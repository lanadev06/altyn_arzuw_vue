/**
 * Frontend Cache Service
 * Кэширование API запросов для снижения нагрузки на сервер
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live в миллисекундах
}

interface CacheConfig {
  defaultTTL: number // 5 минут по умолчанию
  maxSize: number // Максимальное количество записей
}

class FrontendCacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig = {
    defaultTTL: 30 * 60 * 1000, // 30 минут для снижения нагрузки
    maxSize: 500 // Увеличиваем до 500 записей
  }

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Проверяем, не истек ли TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Очищаем старые записи если достигли лимита
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    })
  }

  /**
   * Удалить запись из кэша
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Очистить устаревшие записи
   */
  private cleanup(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key)
      }
    }

    entriesToDelete.forEach(key => this.cache.delete(key))

    // Если все еще много записей, удаляем самые старые
    if (this.cache.size >= this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = sortedEntries.slice(0, Math.floor(this.config.maxSize / 2))
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Получить статистику кэша
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: this.calculateHitRate()
    }
  }

  private hitCount = 0
  private missCount = 0

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }

  /**
   * Создать ключ кэша для API запроса
   */
  createCacheKey(endpoint: string, params?: Record<string, any>): string {
    const baseKey = endpoint.replace(/[^a-zA-Z0-9]/g, '_')
    
    if (!params || Object.keys(params).length === 0) {
      return baseKey
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return `${baseKey}_${btoa(sortedParams)}`
  }

  /**
   * Инвалидировать кэш по паттерну
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Экспортируем singleton
export const frontendCache = new FrontendCacheService()

// Утилиты для работы с кэшем
export const CacheKeys = {
  USERS: 'users',
  ORDERS: 'orders', 
  PRODUCTS: 'products',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  STAGES: 'stages',
  ROLES: 'roles',
  STATS: 'stats',
  NOTIFICATIONS: 'notifications',
  USERS_BY_STAGE_ROLES: 'users_by_stage_roles',
  CATEGORIES: 'categories'
} as const

// TTL константы (в миллисекундах)
export const CacheTTL = {
  SHORT: 5 * 60 * 1000,     // 5 минут
  MEDIUM: 15 * 60 * 1000,   // 15 минут  
  LONG: 60 * 60 * 1000,     // 1 час
  VERY_LONG: 4 * 60 * 60 * 1000, // 4 часа
  STATIC: 24 * 60 * 60 * 1000    // 24 часа для статических данных
} as const
