export interface CachedApiKey {
  id: string
  appId: string
  permissions: string[]
  appName: string
}

export class ApiKeyCache {
  private readonly ttlMs: number
  private readonly writeIntervalMs: number
  private readonly values = new Map<string, { value: CachedApiKey, expiresAt: number }>()
  private readonly lastWriteAt = new Map<string, number>()

  constructor(ttlMs: number, writeIntervalMs: number) {
    this.ttlMs = ttlMs
    this.writeIntervalMs = writeIntervalMs
  }

  get(key: string, now: number = Date.now()): CachedApiKey | null {
    const entry = this.values.get(key)
    if (!entry) {
      return null
    }

    if (entry.expiresAt <= now) {
      this.values.delete(key)
      return null
    }

    return entry.value
  }

  set(key: string, value: CachedApiKey, now: number = Date.now()) {
    this.values.set(key, {
      value,
      expiresAt: now + this.ttlMs,
    })
  }

  shouldWriteUsage(id: string, now: number = Date.now()) {
    const lastWrite = this.lastWriteAt.get(id)
    if (lastWrite !== undefined && now - lastWrite < this.writeIntervalMs) {
      return false
    }

    this.lastWriteAt.set(id, now)
    return true
  }

  clear() {
    this.values.clear()
    this.lastWriteAt.clear()
  }
}
