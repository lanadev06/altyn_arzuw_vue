// Circuit Breaker pattern для предотвращения каскадных сбоев
interface CircuitBreakerState {
  CLOSED: 'CLOSED'
  OPEN: 'OPEN'
  HALF_OPEN: 'HALF_OPEN'
}

type State = CircuitBreakerState[keyof CircuitBreakerState]

interface CircuitBreakerOptions {
  failureThreshold: number // Количество ошибок для открытия
  resetTimeout: number // Время до попытки сброса (мс)
  monitoringPeriod: number // Период мониторинга (мс)
}

class CircuitBreaker {
  private state: State = 'CLOSED'
  private failureCount = 0
  private lastFailureTime = 0
  private nextAttempt = 0
  private options: CircuitBreakerOptions

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 секунд
      monitoringPeriod: 60000, // 1 минута
      ...options
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - too many failures')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.options.resetTimeout
      console.warn(`Circuit breaker opened after ${this.failureCount} failures`)
    }
  }

  getState(): State {
    return this.state
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.lastFailureTime = 0
    this.nextAttempt = 0
  }
}

export const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3, // Открываем после 3 ошибок
  resetTimeout: 30000, // 30 секунд до попытки сброса
  monitoringPeriod: 60000 // 1 минута мониторинга
})
