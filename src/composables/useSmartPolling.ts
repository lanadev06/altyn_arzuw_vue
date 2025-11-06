import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { rateLimiter } from '../services/rateLimiter'

interface PollingOptions {
  interval: number // Базовый интервал в миллисекундах
  maxInterval: number // Максимальный интервал
  minInterval: number // Минимальный интервал
  enabled: boolean | Ref<boolean> // Включен ли polling
  backoffMultiplier?: number // Множитель для увеличения интервала при ошибках
  maxBackoff?: number // Максимальный интервал при ошибках
}

interface PollingState {
  isActive: boolean
  lastUpdate: Date | null
  errorCount: number
  currentInterval: number
}

export function useSmartPolling(
  key: string,
  callback: () => Promise<void>,
  options: PollingOptions
) {
  const isActive = ref(false)
  const lastUpdate = ref<Date | null>(null)
  const errorCount = ref(0)
  const currentInterval = ref(options.interval)

  let intervalId: number | null = null
  let isDestroyed = false

  // Создаем реактивную ссылку на enabled
  const isEnabled = typeof options.enabled === 'boolean' ? ref(options.enabled) : options.enabled

  const startPolling = () => {
    if (intervalId || !isEnabled.value || isDestroyed) return

    isActive.value = true
    currentInterval.value = options.interval

    const poll = async () => {
      if (isDestroyed || !isEnabled.value) return

      // Проверяем rate limiter перед выполнением callback
      if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.getTimeUntilRetry()
        // Увеличиваем интервал при rate limit
        currentInterval.value = Math.max(currentInterval.value, waitTime)
        if (!isDestroyed && isEnabled.value) {
          intervalId = window.setTimeout(poll, currentInterval.value)
        }
        return
      }

      try {
        await callback()
        lastUpdate.value = new Date()
        errorCount.value = 0
        
        // Используем рекомендуемый интервал с учетом rate limits
        const recommendedInterval = rateLimiter.getRecommendedPollingInterval(options.interval)
        currentInterval.value = recommendedInterval
      } catch (error) {
        errorCount.value++
        
        // Проверяем, является ли это 429 ошибкой
        const is429Error = (error as any)?.status === 429 || 
                          (error instanceof Error && error.message.includes('429')) ||
                          (error instanceof Error && error.message.includes('слишком много запросов'))
        
        if (is429Error) {
          // Для 429 ошибок используем рекомендуемый интервал от rate limiter
          const recommendedInterval = rateLimiter.getRecommendedPollingInterval(options.interval)
          currentInterval.value = Math.max(currentInterval.value, recommendedInterval)
        } else {
          // Для других ошибок используем стандартный backoff
          const backoffMultiplier = options.backoffMultiplier || 1.5
          const maxBackoff = options.maxBackoff || options.maxInterval
          currentInterval.value = Math.min(
            currentInterval.value * backoffMultiplier,
            maxBackoff
          )
        }
      }

      if (!isDestroyed && isEnabled.value) {
        intervalId = window.setTimeout(poll, currentInterval.value)
      }
    }

    // Запускаем первый poll
    poll()
  }

  const stopPolling = () => {
    if (intervalId) {
      clearTimeout(intervalId)
      intervalId = null
    }
    isActive.value = false
  }

  const resetPolling = () => {
    stopPolling()
    if (isEnabled.value) {
      startPolling()
    }
  }

  // Следим за изменениями enabled
  watch(isEnabled, (enabled) => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }
  })

  // Следим за изменениями key
  watch(() => key, () => {
    resetPolling()
  })

  onMounted(() => {
    if (isEnabled.value) {
      startPolling()
    }
  })

  onUnmounted(() => {
    isDestroyed = true
    stopPolling()
  })

  return {
    isActive,
    lastUpdate,
    errorCount,
    currentInterval,
    start: startPolling,
    stop: stopPolling,
    reset: resetPolling
  }
}
