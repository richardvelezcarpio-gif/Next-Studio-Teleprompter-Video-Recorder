import { useEffect, useRef, useState, type RefObject } from 'react'
import { FilesetResolver, ImageSegmenter, type MPMask } from '@mediapipe/tasks-vision'
import type { BackgroundSelection } from './useBackground'

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

export function useVirtualBackground({
  videoRef,
  canvasRef,
  cameraStream,
  background,
  ratio,
  onProcessedStream,
  onUnsupported,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  cameraStream: MediaStream | null
  background: BackgroundSelection
  ratio: Ratio
  onProcessedStream: (stream: MediaStream | null, active: boolean) => void
  onUnsupported: () => void
}) {
  const [status, setStatus] = useState<VirtualBackgroundStatus>('idle')
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const rafRef = useRef<number | null>(null)
  const captureRef = useRef<MediaStream | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const busyRef = useRef(false)
  const lastFrameRef = useRef(0)

  useEffect(() => {
    const active = background.type !== 'original'
    const video = videoRef.current
    const output = canvasRef.current
    let cancelled = false
    let sourceCanvas: HTMLCanvasElement | null = null
    let personCanvas: HTMLCanvasElement | null = null
    let maskCanvas: HTMLCanvasElement | null = null

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
        if (!segmenterRef.current) {
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
        if (cancelled) return

        const mobile = window.matchMedia('(max-width: 620px)').matches
        let [width, height] = ratioDimensions[ratio]
        if (mobile) { width = Math.round(width * 2 / 3); height = Math.round(height * 2 / 3) }
        output.width = width
        output.height = height
        sourceCanvas = document.createElement('canvas')
        personCanvas = document.createElement('canvas')
        maskCanvas = document.createElement('canvas')
        sourceCanvas.width = personCanvas.width = width
        sourceCanvas.height = personCanvas.height = height
        const outputContext = output.getContext('2d')
        const sourceContext = sourceCanvas.getContext('2d')
        const personContext = personCanvas.getContext('2d')
        const maskContext = maskCanvas.getContext('2d')
        if (!outputContext || !sourceContext || !personContext || !maskContext) throw new Error('unsupported')

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

        if (background.type === 'uploaded') {
          const image = new Image()
          image.decoding = 'async'
          image.src = background.value
          imageRef.current = image
          try { await image.decode() } catch { /* The internal fallback remains visible if decoding fails. */ }
        } else imageRef.current = null

        const labels = segmenterRef.current.getLabels()
        const labeledPersonIndex = labels.findIndex((label) => /person/i.test(label))
        const frame = (now: number) => {
          if (cancelled || !segmenterRef.current || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
            rafRef.current = requestAnimationFrame(frame)
            return
          }
          if (!busyRef.current && now - lastFrameRef.current >= 50) {
            busyRef.current = true
            lastFrameRef.current = now
            sourceContext.clearRect(0, 0, width, height)
            drawCover(sourceContext, video, video.videoWidth, video.videoHeight, width, height)
            try {
              segmenterRef.current.segmentForVideo(sourceCanvas!, now, (result) => {
                const masks = result.confidenceMasks
                const mask = labeledPersonIndex >= 0 ? masks?.[labeledPersonIndex] : masks?.[masks.length - 1]
                if (mask && !cancelled) {
                  maskToCanvas(mask, maskContext)
                  drawBackground()
                  personContext.clearRect(0, 0, width, height)
                  personContext.globalCompositeOperation = 'source-over'
                  personContext.drawImage(sourceCanvas!, 0, 0)
                  personContext.globalCompositeOperation = 'destination-in'
                  personContext.filter = 'blur(1.5px)'
                  personContext.drawImage(maskCanvas!, 0, 0, width, height)
                  personContext.filter = 'none'
                  personContext.globalCompositeOperation = 'source-over'
                  outputContext.drawImage(personCanvas!, 0, 0)
                }
                busyRef.current = false
              })
            } catch {
              busyRef.current = false
            }
          }
          rafRef.current = requestAnimationFrame(frame)
        }

        drawBackground()
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
  }, [background, cameraStream, canvasRef, onProcessedStream, onUnsupported, ratio, videoRef])

  useEffect(() => () => {
    segmenterRef.current?.close()
    segmenterRef.current = null
  }, [])

  return { status }
}
