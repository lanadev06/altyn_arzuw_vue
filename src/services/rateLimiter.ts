/**
 * Rate Limiter Service
 * Обрабатывает 429 ошибки (Too Many Requests) с экспоненциальным backoff
 */

interface RateLimitState {
  isRateLimited: boolean
  retryAfter: number // Время в миллисекундах до следующей попытки
  consecutive429Errors: number
  last429ErrorTime: number
}

class RateLimiterService {
  private state: RateLimitState = {
    isRateLimited: false,
    retryAfter: 0,
    consecutive429Errors: 0,
    last429ErrorTime: 0,
  }

  private readonly MAX_RETRY_AFTER = 60000 // Максимальное время ожидания: 60 секунд
  private readonly BASE_BACKOFF = 1000 // Базовая задержка: 1 секунда
  private readonly MAX_BACKOFF = 30000 // Максимальная задержка: 30 секунд

  /**
   * Обрабатывает 429 ошибку
   * @param retryAfter - Значение заголовка Retry-After (в секундах) или null
   */
  handle429Error(retryAfter: number | null = null): void {
    this.state.consecutive429Errors++
    this.state.last429ErrorTime = Date.now()
    this.state.isRateLimited = true

    // Если сервер указал Retry-After, используем его
    if (retryAfter !== null && retryAfter > 0) {
      this.state.retryAfter = Math.min(retryAfter * 1000, this.MAX_RETRY_AFTER)
    } else {
      // Иначе используем экспоненциальный backoff
      const backoff = Math.min(
        this.BASE_BACKOFF * Math.pow(2, this.state.consecutive429Errors - 1),
        this.MAX_BACKOFF
      )
      this.state.retryAfter = backoff
    }

    console.warn(
      `Rate limit exceeded. Retry after ${Math.ceil(this.state.retryAfter / 1000)}s. ` +
      `Consecutive 429 errors: ${this.state.consecutive429Errors}`
    )
  }

  /**
   * Проверяет, можно ли выполнить запрос
   */
  canMakeRequest(): boolean {
    if (!this.state.isRateLimited) {
      return true
    }

    const timeSinceLastError = Date.now() - this.state.last429ErrorTime
    if (timeSinceLastError >= this.state.retryAfter) {
      // Сбрасываем состояние после истечения времени ожидания
      this.state.isRateLimited = false
      this.state.retryAfter = 0
      return true
    }

    return false
  }

  /**
   * Получает время до следующей попытки (в миллисекундах)
   */
  getTimeUntilRetry(): number {
    if (!this.state.isRateLimited) {
      return 0
    }

    const timeSinceLastError = Date.now() - this.state.last429ErrorTime
    const remaining = this.state.retryAfter - timeSinceLastError
    return Math.max(0, remaining)
  }

  /**
   * Ожидает до следующей попытки
   */
  async waitUntilRetry(): Promise<void> {
    const waitTime = this.getTimeUntilRetry()
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  /**
   * Обрабатывает успешный запрос (сбрасывает счетчик 429 ошибок)
   */
  handleSuccess(): void {
    if (this.state.consecutive429Errors > 0) {
      // Постепенно уменьшаем счетчик при успешных запросах
      this.state.consecutive429Errors = Math.max(0, this.state.consecutive429Errors - 1)
    }

    // Если прошло достаточно времени без 429 ошибок, сбрасываем состояние
    const timeSinceLastError = Date.now() - this.state.last429ErrorTime
    if (timeSinceLastError > 60000) { // 1 минута без ошибок
      this.state.consecutive429Errors = 0
      this.state.isRateLimited = false
      this.state.retryAfter = 0
    }
  }

  /**
   * Получает текущее состояние
   */
  getState(): RateLimitState {
    return { ...this.state }
  }

  /**
   * Сбрасывает состояние (для тестирования или принудительного сброса)
   */
  reset(): void {
    this.state = {
      isRateLimited: false,
      retryAfter: 0,
      consecutive429Errors: 0,
      last429ErrorTime: 0,
    }
  }

  /**
   * Получает рекомендуемый интервал для polling (в миллисекундах)
   * Увеличивает интервал при наличии rate limit ошибок
   */
  getRecommendedPollingInterval(baseInterval: number): number {
    if (this.state.consecutive429Errors === 0) {
      return baseInterval
    }

    // Увеличиваем интервал в зависимости от количества последовательных ошибок
    const multiplier = Math.min(1 + this.state.consecutive429Errors * 0.5, 5) // Максимум 5x
    return Math.min(baseInterval * multiplier, 120000) // Максимум 2 минуты
  }
}

export const rateLimiter = new RateLimiterService()

