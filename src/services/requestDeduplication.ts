/**
 * Request Deduplication Service
 * Предотвращает дублирование одинаковых запросов
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private readonly REQUEST_TIMEOUT = 30000 // 30 секунд

  /**
   * Выполнить запрос с дедупликацией
   */
  async deduplicate<T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Проверяем, есть ли уже такой запрос
    const existingRequest = this.pendingRequests.get(key)
    
    if (existingRequest) {
      // Проверяем, не устарел ли запрос
      if (Date.now() - existingRequest.timestamp < this.REQUEST_TIMEOUT) {
        return existingRequest.promise
      } else {
        // Удаляем устаревший запрос
        this.pendingRequests.delete(key)
      }
    }

    // Создаем новый запрос
    const promise = requestFn()
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    try {
      const result = await promise
      this.pendingRequests.delete(key)
      return result
    } catch (error) {
      this.pendingRequests.delete(key)
      throw error
    }
  }

  /**
   * Создать ключ для дедупликации
   */
  createKey(method: string, url: string, params?: any): string {
    const baseKey = `${method.toUpperCase()}_${url}`
    
    if (!params) {
      return baseKey
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')

    return `${baseKey}_${btoa(sortedParams)}`
  }

  /**
   * Очистить устаревшие запросы
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.pendingRequests.delete(key))
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      oldestRequest: Math.min(
        ...Array.from(this.pendingRequests.values()).map(r => r.timestamp)
      )
    }
  }
}

export const requestDeduplication = new RequestDeduplicationService()

// Автоматическая очистка каждые 5 минут
setInterval(() => {
  requestDeduplication.cleanup()
}, 5 * 60 * 1000)
