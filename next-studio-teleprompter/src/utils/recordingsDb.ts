export type SavedRecording = { id: string; name: string; createdAt: string; duration: number; mimeType: string; size: number; blob: Blob; hasAudio?: boolean }

const databaseName = 'next-studio-teleprompter'
const storeName = 'recordings'

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const request = operation(transaction.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function saveRecording(recording: Omit<SavedRecording, 'id' | 'size'>) {
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const saved: SavedRecording = { ...recording, id, size: recording.blob.size }
  await withStore('readwrite', (store) => store.put(saved))
  return saved
}

export async function getRecordings() {
  const recordings = await withStore('readonly', (store) => store.getAll()) as SavedRecording[]
  return recordings.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getRecording(id: string) { return withStore('readonly', (store) => store.get(id)) as Promise<SavedRecording | undefined> }
export async function deleteRecording(id: string) { await withStore('readwrite', (store) => store.delete(id)) }

export function formatDuration(seconds: number) { return new Date(seconds * 1000).toISOString().slice(seconds >= 3600 ? 11 : 14, 19) }
export function formatFileSize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`; if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`; return `${(bytes / 1024 ** 3).toFixed(1)} GB` }
export function downloadBlob(blob: Blob, name: string, mimeType: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'recording'}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0) }
