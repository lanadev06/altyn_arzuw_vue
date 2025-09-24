// Система очереди запросов для предотвращения перегрузки сервера
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private activeRequests = 0
  private maxConcurrentRequests = 5 // Максимальное количество одновременных запросов
  private isProcessing = false

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })
      
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrentRequests) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.queue.shift()
      if (request) {
        this.activeRequests++
        request()
          .catch(() => {
            // Ошибка уже обработана в requestFn
          })
          .finally(() => {
            this.activeRequests--
            this.processQueue()
          })
      }
    }

    this.isProcessing = false
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrentRequests
    }
  }

  clear() {
    this.queue = []
    this.activeRequests = 0
    this.isProcessing = false
  }
}

export const requestQueue = new RequestQueue()
