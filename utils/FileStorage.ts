class FileStorage {
  storage

  constructor() {
    this.storage = new Map()
  }

  put(id: string, chunkId: number, data: string) {
    const buffer = atob(data)
      .split('')
      .map((c) => c.charCodeAt(0))
    if (this.storage.has(id)) {
      const current = this.storage.get(id)
      current[chunkId] = buffer
      this.storage.set(id, current)
    } else {
      this.storage.set(id, [buffer])
    }
  }

  forge(id: string, type: string) {
    const d = this.storage.get(id)
    if (Array.isArray(d)) {
      const size = d.reduce((size, b) => size + b.length, 0)
      const buffer = new Uint8Array(size)
      let offset = 0
      for (let i = 0; i < d.length; i++) {
        buffer.set(d[i], offset)
        offset += d[i].length
      }
      this.storage.set(id, new Blob([buffer], { type }))
    }
  }

  get(id: string) {
    return this.storage.get(id)
  }
}

export default FileStorage
