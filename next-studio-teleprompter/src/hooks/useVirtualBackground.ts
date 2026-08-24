import { useEffect, useRef, useState, type RefObject } from 'react'
import { FaceLandmarker, FilesetResolver, ImageSegmenter, type MPMask, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { BackgroundSelection } from './useBackground'
import type { VideoEffects } from '../components/studio/StudioToolPanels'

export type VirtualBackgroundStatus = 'idle' | 'loading' | 'ready' | 'unsupported'
type Ratio = '16:9' | '9:16' | '1:1' | '4:5'

const ratioDimensions: Record<Ratio, [number, number]> = {
  '16:9': [960, 540],
  '9:16': [540, 960],
  '1:1': [720, 720],
  '4:5': [640, 800],
}

function drawCover(context: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, width: number, height: number) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const cropWidth = width / scale
  const cropHeight = height / scale
  context.drawImage(source, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height)
}

function paintGradient(context: CanvasRenderingContext2D, width: number, height: number, colors: string[]) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  colors.forEach((color, index) => gradient.addColorStop(index / Math.max(1, colors.length - 1), color))
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

function paintInternalBackground(context: CanvasRenderingContext2D, id: string, width: number, height: number) {
  const palettes: Record<string, string[]> = {
    'professional-blue': ['#061936', '#0b5bc8'],
    'modern-office': ['#edf5fb', '#a8c5da', '#f9fcff'],
    'dark-studio': ['#05080e', '#17273d', '#426d9f'],
    'light-studio': ['#a9c7dc', '#d9ebf8', '#ffffff'],
    'next-studio': ['#06152f', '#0a4db4', '#20d4ff'],
  }
  paintGradient(context, width, height, palettes[id] || ['#061936', '#1769e0'])
  context.globalAlpha = id === 'modern-office' ? 0.2 : 0.12
  context.fillStyle = '#ffffff'
  for (let index = 0; index < 5; index += 1) context.fillRect(width * (0.08 + index * 0.21), height * 0.12, width * 0.015, height * 0.76)
  context.globalAlpha = 1
}

function maskToCanvas(mask: MPMask, context: CanvasRenderingContext2D) {
  const confidence = mask.getAsFloat32Array()
  const pixels = context.createImageData(mask.width, mask.height)
  for (let index = 0; index < confidence.length; index += 1) {
    const alpha = Math.max(0, Math.min(1, (confidence[index] - 0.18) / 0.65))
    const offset = index * 4
    pixels.data[offset] = 255
    pixels.data[offset + 1] = 255
    pixels.data[offset + 2] = 255
    pixels.data[offset + 3] = Math.round(alpha * alpha * (3 - 2 * alpha) * 255)
  }
  context.canvas.width = mask.width
  context.canvas.height = mask.height
  context.putImageData(pixels, 0, 0)
}

const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
const leftEyeArea = [70, 63, 105, 66, 107, 55, 193, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
const rightEyeArea = [300, 293, 334, 296, 336, 285, 417, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]
const lipArea = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]

function drawLandmarkPath(context: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], indices: number[], width: number, height: number) {
  context.beginPath()
  indices.forEach((index, position) => {
    const point = landmarks[index]
    if (position === 0) context.moveTo(point.x * width, point.y * height)
    else context.lineTo(point.x * width, point.y * height)
  })
  context.closePath()
}

function punchFeature(context: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], indices: number[], width: number, height: number, padding: number) {
  const points = indices.map((index) => landmarks[index]).filter(Boolean)
  if (!points.length) return
  const xs = points.map((point) => point.x * width)
  const ys = points.map((point) => point.y * height)
  const minX = Math.min(...xs); const maxX = Math.max(...xs)
  const minY = Math.min(...ys); const maxY = Math.max(...ys)
  context.beginPath()
  context.ellipse((minX + maxX) / 2, (minY + maxY) / 2, (maxX - minX) / 2 + padding, (maxY - minY) / 2 + padding, 0, 0, Math.PI * 2)
  context.fill()
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath(); context.roundRect(x, y, width, height, safeRadius)
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3) {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && context.measureText(candidate).width > maxWidth) { lines.push(line); line = word } else line = candidate
      if (lines.length >= maxLines) break
    }
    if (line && lines.length < maxLines) lines.push(line)
    if (lines.length >= maxLines) break
  }
  return lines
}

function captionCase(text: string, mode: VideoEffects['captionCaps']) {
  if (mode === 'uppercase') return text.toUpperCase()
  if (mode === 'capitalize') return text.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
  return text
}

export function useVirtualBackground({
  videoRef,
  canvasRef,
  cameraStream,
  background,
  effects,
  ratio,
  onProcessedStream,
  onUnsupported,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  cameraStream: MediaStream | null
  background: BackgroundSelection
  effects: VideoEffects
  ratio: Ratio
  onProcessedStream: (stream: MediaStream | null, active: boolean) => void
  onUnsupported: () => void
}) {
  const [status, setStatus] = useState<VirtualBackgroundStatus>('idle')
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const rafRef = useRef<number | null>(null)
  const captureRef = useRef<MediaStream | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const busyRef = useRef(false)
  const lastFrameRef = useRef(0)
  const effectsRef = useRef(effects)
  effectsRef.current = effects
  const processingActive = background.type !== 'original' || (effects.retouchEnabled && (effects.smoothing > 0 || effects.faceBrightness !== 0 || effects.skinTone !== 0)) || effects.brightness !== 100 || effects.contrast !== 100 || effects.saturation !== 100 || effects.temperature !== 0 || (effects.textVisible && Boolean(effects.text.trim())) || effects.captionEnabled

  useEffect(() => {
    const initialEffects = effectsRef.current
    const hasRetouch = initialEffects.retouchEnabled && (initialEffects.smoothing > 0 || initialEffects.faceBrightness !== 0 || initialEffects.skinTone !== 0)
    const needsSegmentation = background.type !== 'original'
    const active = processingActive
    const video = videoRef.current
    const output = canvasRef.current
    let cancelled = false
    let sourceCanvas: HTMLCanvasElement | null = null
    let personCanvas: HTMLCanvasElement | null = null
    let maskCanvas: HTMLCanvasElement | null = null
    let faceMaskCanvas: HTMLCanvasElement | null = null
    let featherMaskCanvas: HTMLCanvasElement | null = null
    let smoothCanvas: HTMLCanvasElement | null = null
    let faceLayerCanvas: HTMLCanvasElement | null = null
    let lastFaceLandmarks: NormalizedLandmark[] | null = null
    let lastFaceDetection = 0
    let lastFaceSeen = 0

    const stopPipeline = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      captureRef.current?.getTracks().forEach((track) => track.stop())
      captureRef.current = null
      onProcessedStream(null, false)
      busyRef.current = false
    }

    if (!active || !cameraStream || !video || !output) {
      stopPipeline()
      setStatus('idle')
      return stopPipeline
    }
    onProcessedStream(null, true)

    const start = async () => {
      setStatus('loading')
      try {
        if (!('captureStream' in output) || typeof WebAssembly === 'undefined') throw new Error('unsupported')
        if (needsSegmentation && !segmenterRef.current) {
          const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
          const options = { runningMode: 'VIDEO' as const, outputConfidenceMasks: true, outputCategoryMask: false }
          try {
            segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
              ...options,
              baseOptions: { modelAssetPath: '/mediapipe/selfie_segmenter_landscape.tflite', delegate: 'GPU' },
            })
          } catch {
            segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
              ...options,
              baseOptions: { modelAssetPath: '/mediapipe/selfie_segmenter_landscape.tflite', delegate: 'CPU' },
            })
          }
        }
        if (hasRetouch && !faceLandmarkerRef.current) {
          const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
          const options = { runningMode: 'VIDEO' as const, numFaces: 1, minFaceDetectionConfidence: 0.45, minFacePresenceConfidence: 0.45, minTrackingConfidence: 0.45 }
          try {
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate: 'GPU' } })
          } catch {
            try { faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate: 'CPU' } }) } catch { faceLandmarkerRef.current = null }
          }
        }
        if (cancelled) return

        const mobile = window.matchMedia('(max-width: 620px)').matches
        let [width, height] = ratioDimensions[ratio]
        if (mobile) { width = Math.round(width * 2 / 3); height = Math.round(height * 2 / 3) }
        output.width = width
        output.height = height
        sourceCanvas = document.createElement('canvas')
        personCanvas = document.createElement('canvas')
        maskCanvas = document.createElement('canvas')
        faceMaskCanvas = document.createElement('canvas')
        featherMaskCanvas = document.createElement('canvas')
        smoothCanvas = document.createElement('canvas')
        faceLayerCanvas = document.createElement('canvas')
        sourceCanvas.width = personCanvas.width = width
        sourceCanvas.height = personCanvas.height = height
        faceMaskCanvas.width = featherMaskCanvas.width = smoothCanvas.width = faceLayerCanvas.width = width
        faceMaskCanvas.height = featherMaskCanvas.height = smoothCanvas.height = faceLayerCanvas.height = height
        const outputContext = output.getContext('2d')
        const sourceContext = sourceCanvas.getContext('2d')
        const personContext = personCanvas.getContext('2d')
        const maskContext = maskCanvas.getContext('2d')
        const faceMaskContext = faceMaskCanvas.getContext('2d')
        const featherMaskContext = featherMaskCanvas.getContext('2d')
        const smoothContext = smoothCanvas.getContext('2d')
        const faceLayerContext = faceLayerCanvas.getContext('2d')
        if (!outputContext || !sourceContext || !personContext || !maskContext || !faceMaskContext || !featherMaskContext || !smoothContext || !faceLayerContext) throw new Error('unsupported')

        const drawBackground = () => {
          outputContext.save()
          outputContext.clearRect(0, 0, width, height)
          if (background.type === 'blur') {
            const blur = Number(background.value) || 16
            outputContext.filter = `blur(${blur}px)`
            outputContext.drawImage(sourceCanvas!, -blur * 2, -blur * 2, width + blur * 4, height + blur * 4)
          } else if (background.type === 'color') {
            outputContext.fillStyle = background.value
            outputContext.fillRect(0, 0, width, height)
          } else if (background.type === 'gradient') {
            const colors = background.value.match(/#[0-9a-fA-F]{3,8}/g) || ['#061936', '#1769e0']
            paintGradient(outputContext, width, height, colors)
          } else if (background.type === 'uploaded' && imageRef.current?.complete) {
            drawCover(outputContext, imageRef.current, imageRef.current.naturalWidth, imageRef.current.naturalHeight, width, height)
          } else {
            paintInternalBackground(outputContext, background.id, width, height)
          }
          outputContext.restore()
        }

        const effectFilter = () => { const current = effectsRef.current; return `brightness(${current.brightness}%) contrast(${current.contrast}%) saturate(${current.saturation}%) sepia(${Math.abs(current.temperature) * 0.25}%) hue-rotate(${current.temperature < 0 ? current.temperature * 0.35 : current.temperature * -0.18}deg)` }
        const updateFaceMask = (now: number) => {
          if (!hasRetouch || !faceLandmarkerRef.current) return
          if (now - lastFaceDetection >= 100) {
            lastFaceDetection = now
            try {
              const detected = faceLandmarkerRef.current.detectForVideo(sourceCanvas!, now).faceLandmarks[0]
              if (detected) { lastFaceLandmarks = detected; lastFaceSeen = now }
            } catch { /* Keep the last stable mask briefly. */ }
          }
          if (!lastFaceLandmarks || now - lastFaceSeen > 650) return
          faceMaskContext.clearRect(0, 0, width, height)
          faceMaskContext.fillStyle = '#fff'
          drawLandmarkPath(faceMaskContext, lastFaceLandmarks, faceOval, width, height)
          faceMaskContext.fill()
          faceMaskContext.globalCompositeOperation = 'destination-out'
          faceMaskContext.fillStyle = '#000'
          const featurePadding = Math.max(3, width * 0.006)
          punchFeature(faceMaskContext, lastFaceLandmarks, leftEyeArea, width, height, featurePadding)
          punchFeature(faceMaskContext, lastFaceLandmarks, rightEyeArea, width, height, featurePadding)
          punchFeature(faceMaskContext, lastFaceLandmarks, lipArea, width, height, featurePadding * 0.65)
          faceMaskContext.globalCompositeOperation = 'source-over'
          featherMaskContext.clearRect(0, 0, width, height)
          featherMaskContext.filter = `blur(${Math.max(5, width * 0.009)}px)`
          featherMaskContext.drawImage(faceMaskCanvas!, 0, 0)
          featherMaskContext.filter = 'none'
        }
        const applyFaceRetouch = (now: number) => {
          const current = effectsRef.current
          if (!current.retouchEnabled || (current.smoothing <= 0 && current.faceBrightness === 0 && current.skinTone === 0)) return
          updateFaceMask(now)
          if (!lastFaceLandmarks || now - lastFaceSeen > 650) return
          const strength = Math.pow(current.smoothing / 100, 0.72) * (1 - current.skinDetail / 180)
          const blurRadius = current.smoothing > 0 ? 1.5 + current.smoothing * 0.095 : 0
          const warmth = current.skinTone
          smoothContext.clearRect(0, 0, width, height)
          smoothContext.save()
          smoothContext.filter = `blur(${blurRadius}px) brightness(${100 + current.faceBrightness}%) saturate(${100 + Math.abs(warmth) * 0.16}%) sepia(${Math.abs(warmth) * 0.18}%) hue-rotate(${warmth < 0 ? warmth * 0.38 : warmth * -0.2}deg)`
          smoothContext.drawImage(output, 0, 0)
          smoothContext.restore()
          faceLayerContext.clearRect(0, 0, width, height)
          faceLayerContext.drawImage(smoothCanvas!, 0, 0)
          faceLayerContext.globalCompositeOperation = 'destination-in'
          faceLayerContext.drawImage(featherMaskCanvas!, 0, 0)
          faceLayerContext.globalCompositeOperation = 'source-over'
          outputContext.save()
          outputContext.globalAlpha = Math.max(strength, current.faceBrightness !== 0 || current.skinTone !== 0 ? 0.42 : 0)
          outputContext.drawImage(faceLayerCanvas!, 0, 0)
          outputContext.restore()
        }
        const drawText = () => {
          const current = effectsRef.current
          if (!current.textVisible || !current.text.trim()) return
          const fontSize = Math.max(14, Math.round(current.textSize * width / 960))
          const presets: Record<VideoEffects['textPosition'], [number, number]> = { top: [0.5, 0.14], center: [0.5, 0.5], bottom: [0.5, 0.84], 'top-left': [0.12, 0.16], 'top-right': [0.88, 0.16], 'bottom-left': [0.12, 0.82], 'bottom-right': [0.88, 0.82], custom: [current.textX, current.textY] }
          const [normalizedX, normalizedY] = current.textPosition === 'custom' ? [current.textX, current.textY] : presets[current.textPosition]
          const x = width * normalizedX; const y = height * normalizedY
          outputContext.save()
          outputContext.globalAlpha = current.textOpacity / 100
          outputContext.font = `${current.textItalic ? 'italic ' : ''}${current.textBold ? '700' : '400'} ${fontSize}px "${current.textFont}", sans-serif`
          outputContext.textAlign = current.textAlign
          outputContext.textBaseline = 'middle'
          const mainLines = wrapText(outputContext, current.text.trim().slice(0, 240), width * 0.74, 3)
          const lines = current.textSecondary.trim() ? [...mainLines, current.textSecondary.trim().slice(0, 100)] : mainLines
          const lineHeight = fontSize * 1.18
          const widths = lines.map((line, index) => { if (index === lines.length - 1 && current.textSecondary.trim()) outputContext.font = `${current.textItalic ? 'italic ' : ''}400 ${Math.round(fontSize * 0.58)}px "${current.textFont}", sans-serif`; const measured = outputContext.measureText(line).width; outputContext.font = `${current.textItalic ? 'italic ' : ''}${current.textBold ? '700' : '400'} ${fontSize}px "${current.textFont}", sans-serif`; return measured })
          const blockWidth = Math.max(...widths, 1); const blockHeight = lineHeight * lines.length
          const alignOffset = current.textAlign === 'left' ? 0 : current.textAlign === 'right' ? -blockWidth : -blockWidth / 2
          const padding = current.textPadding * width / 960
          if (current.textBackground) {
            outputContext.fillStyle = `${current.textBackgroundColor}${Math.round(current.textBackgroundOpacity * 2.55).toString(16).padStart(2, '0')}`
            roundedRect(outputContext, x + alignOffset - padding, y - blockHeight / 2 - padding, blockWidth + padding * 2, blockHeight + padding * 2, current.textRadius * width / 960)
            outputContext.fill()
          }
          const shadowValues = { none: [0, 0, 0], soft: [2, 5, 0.38], medium: [3, 9, 0.55], strong: [5, 14, 0.72] }[current.textShadow]
          outputContext.shadowOffsetY = shadowValues[0] * width / 960; outputContext.shadowBlur = shadowValues[1] * width / 960; outputContext.shadowColor = `rgba(0,0,0,${shadowValues[2]})`
          lines.forEach((line, index) => {
            const secondary = index === lines.length - 1 && Boolean(current.textSecondary.trim())
            outputContext.font = `${current.textItalic ? 'italic ' : ''}${secondary ? '400' : current.textBold ? '700' : '400'} ${secondary ? Math.round(fontSize * 0.58) : fontSize}px "${current.textFont}", sans-serif`
            const lineY = y - blockHeight / 2 + lineHeight * (index + 0.55)
            if (current.textOutline) { outputContext.lineWidth = current.textOutlineWidth * width / 960; outputContext.strokeStyle = current.textOutlineColor; outputContext.strokeText(line, x, lineY, width * 0.82) }
            outputContext.fillStyle = current.textColor; outputContext.fillText(line, x, lineY, width * 0.82)
          })
          outputContext.restore()
        }
        const drawCaption = () => {
          const current = effectsRef.current
          if (!current.captionEnabled || !current.captionText.trim()) return
          const fontSize = Math.max(16, Math.round(current.captionSize * width / 960))
          const styledSize = current.captionStyle === 'social' ? fontSize * 1.18 : current.captionStyle === 'bold' ? fontSize * 1.1 : fontSize
          const text = captionCase(current.captionText, current.captionCaps)
          outputContext.save()
          outputContext.font = `800 ${styledSize}px Inter, sans-serif`
          outputContext.textAlign = 'center'; outputContext.textBaseline = 'middle'
          const words = text.split(/\s+/).slice(-14)
          const midpoint = words.length > 7 ? Math.ceil(words.length / 2) : words.length
          const lines = [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')].filter(Boolean)
          const lineHeight = styledSize * 1.18
          const y = height * (current.captionPosition === 'top' ? 0.16 : current.captionPosition === 'center' ? 0.54 : 0.86)
          const maxLineWidth = Math.max(...lines.map((line) => outputContext.measureText(line).width))
          const useBackground = current.captionBackground || current.captionStyle === 'subtitle'
          if (useBackground) { outputContext.fillStyle = 'rgba(3,7,14,.72)'; roundedRect(outputContext, width / 2 - maxLineWidth / 2 - styledSize * 0.42, y - lineHeight * lines.length / 2 - styledSize * 0.24, maxLineWidth + styledSize * 0.84, lineHeight * lines.length + styledSize * 0.48, styledSize * 0.2); outputContext.fill() }
          outputContext.shadowColor = 'rgba(0,0,0,.72)'; outputContext.shadowBlur = current.captionStyle === 'clean' ? styledSize * 0.18 : styledSize * 0.08
          lines.forEach((line, index) => { const lineY = y - lineHeight * (lines.length - 1) / 2 + lineHeight * index; if (current.captionStyle === 'bold' || current.captionStyle === 'social') { outputContext.lineWidth = styledSize * 0.12; outputContext.strokeStyle = '#05070b'; outputContext.strokeText(line, width / 2, lineY, width * 0.88) } outputContext.fillStyle = current.captionColor; outputContext.fillText(line, width / 2, lineY, width * 0.88) })
          if ((current.captionHighlight || current.captionStyle === 'highlight') && lines.length) { const segment = lines[lines.length - 1]; const lineY = y + lineHeight * (lines.length - 1) / 2; outputContext.globalAlpha = current.captionInterim ? 1 : 0.82; outputContext.fillStyle = current.captionHighlightColor; outputContext.fillText(segment, width / 2, lineY, width * 0.88) }
          outputContext.restore()
        }

        if (background.type === 'uploaded') {
          const image = new Image()
          image.decoding = 'async'
          image.src = background.value
          imageRef.current = image
          try { await image.decode() } catch { /* The internal fallback remains visible if decoding fails. */ }
        } else imageRef.current = null

        const labels = segmenterRef.current?.getLabels() || []
        const labeledPersonIndex = labels.findIndex((label) => /person/i.test(label))
        const frame = (now: number) => {
          if (cancelled || (needsSegmentation && !segmenterRef.current) || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
            rafRef.current = requestAnimationFrame(frame)
            return
          }
          if (!busyRef.current && now - lastFrameRef.current >= 50) {
            busyRef.current = true
            lastFrameRef.current = now
            sourceContext.clearRect(0, 0, width, height)
            drawCover(sourceContext, video, video.videoWidth, video.videoHeight, width, height)
            if (!needsSegmentation) {
              outputContext.clearRect(0, 0, width, height)
              outputContext.save()
              outputContext.filter = effectFilter()
              drawCover(outputContext, video, video.videoWidth, video.videoHeight, width, height)
              outputContext.restore()
              applyFaceRetouch(now)
              drawText()
              drawCaption()
              busyRef.current = false
              rafRef.current = requestAnimationFrame(frame)
              return
            }
            try {
              segmenterRef.current!.segmentForVideo(sourceCanvas!, now, (result) => {
                const masks = result.confidenceMasks
                const mask = labeledPersonIndex >= 0 ? masks?.[labeledPersonIndex] : masks?.[masks.length - 1]
                if (mask && !cancelled) {
                  maskToCanvas(mask, maskContext)
                  drawBackground()
                  personContext.clearRect(0, 0, width, height)
                  personContext.globalCompositeOperation = 'source-over'
                  personContext.filter = effectFilter()
                  personContext.drawImage(sourceCanvas!, 0, 0)
                  personContext.filter = 'none'
                  personContext.globalCompositeOperation = 'destination-in'
                  personContext.filter = 'blur(1.5px)'
                  personContext.drawImage(maskCanvas!, 0, 0, width, height)
                  personContext.filter = 'none'
                  personContext.globalCompositeOperation = 'source-over'
                  outputContext.drawImage(personCanvas!, 0, 0)
                  applyFaceRetouch(now)
                  drawText()
                  drawCaption()
                }
                busyRef.current = false
              })
            } catch {
              busyRef.current = false
            }
          }
          rafRef.current = requestAnimationFrame(frame)
        }

        if (needsSegmentation) drawBackground()
        captureRef.current = output.captureStream(30)
        onProcessedStream(captureRef.current, true)
        setStatus('ready')
        rafRef.current = requestAnimationFrame(frame)
      } catch {
        if (cancelled) return
        stopPipeline()
        setStatus('unsupported')
        onUnsupported()
      }
    }

    void start()
    return () => { cancelled = true; stopPipeline() }
  }, [background, cameraStream, canvasRef, effects.retouchEnabled, onProcessedStream, onUnsupported, processingActive, ratio, videoRef])

  useEffect(() => () => {
    segmenterRef.current?.close()
    segmenterRef.current = null
    faceLandmarkerRef.current?.close()
    faceLandmarkerRef.current = null
  }, [])

  return { status, active: processingActive }
}
