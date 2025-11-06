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
    defaultTTL: 60 * 60 * 1000, // 60 минут для медленного интернета (увеличено с 30)
    maxSize: 500 // Увеличиваем до 500 записей
  }
  private hitCount = 0
  private missCount = 0
  private cleanupInterval: number | null = null

  constructor() {
    // Запускаем периодическую очистку устаревших записей каждые 5 минут
    if (typeof window !== 'undefined') {
      this.cleanupInterval = window.setInterval(() => {
        this.cleanupExpired()
      }, 5 * 60 * 1000) // 5 минут
    }
  }

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.missCount++
        return null
      }

      // Проверяем, не истек ли TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        this.missCount++
        return null
      }

      this.hitCount++
      return entry.data
    } catch (error) {
      console.error('Cache get error:', error)
      this.missCount++
      return null
    }
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      // Очищаем старые записи если достигли лимита
      if (this.cache.size >= this.config.maxSize) {
        this.cleanup()
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL
      })
    } catch (error) {
      console.error('Cache set error:', error)
      // В случае ошибки пытаемся очистить кэш и повторить
      try {
        this.cleanup()
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: ttl || this.config.defaultTTL
        })
      } catch (retryError) {
        console.error('Cache set retry error:', retryError)
      }
    }
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
    try {
      this.cache.clear()
      // Сбрасываем счетчики статистики
      this.hitCount = 0
      this.missCount = 0
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Очистить устаревшие записи (вызывается периодически)
   */
  private cleanupExpired(): void {
    try {
      const now = Date.now()
      const entriesToDelete: string[] = []

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          entriesToDelete.push(key)
        }
      }

      entriesToDelete.forEach(key => this.cache.delete(key))
    } catch (error) {
      console.error('Cache cleanupExpired error:', error)
    }
  }

  /**
   * Очистить устаревшие записи и освободить место
   */
  private cleanup(): void {
    try {
      // Сначала очищаем устаревшие записи
      this.cleanupExpired()

      // Если все еще много записей, удаляем самые старые
      if (this.cache.size >= this.config.maxSize) {
        const sortedEntries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
        
        const toDelete = sortedEntries.slice(0, Math.floor(this.config.maxSize / 2))
        toDelete.forEach(([key]) => this.cache.delete(key))
      }
    } catch (error) {
      console.error('Cache cleanup error:', error)
      // В случае критической ошибки очищаем весь кэш
      this.cache.clear()
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

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }

  /**
   * Создать ключ кэша для API запроса
   */
  createCacheKey(endpoint: string, params?: Record<string, any>): string {
    try {
      const baseKey = endpoint.replace(/[^a-zA-Z0-9]/g, '_')
      
      if (!params || Object.keys(params).length === 0) {
        return baseKey
      }

      // Сортируем ключи для консистентности
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => {
          const value = params[key]
          // Обрабатываем объекты и массивы
          const stringValue = typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value)
          return `${key}=${stringValue}`
        })
        .join('&')

      // Используем безопасное кодирование вместо btoa для поддержки non-ASCII
      // btoa может упасть на non-ASCII символах, поэтому используем encodeURIComponent
      const encodedParams = encodeURIComponent(sortedParams)
        .replace(/%/g, '_') // Заменяем % на _ для читаемости
        .replace(/[^a-zA-Z0-9_]/g, '_') // Оставляем только безопасные символы

      return `${baseKey}_${encodedParams}`
    } catch (error) {
      console.error('Cache key creation error:', error)
      // Fallback: используем простой ключ
      return endpoint.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now()
    }
  }

  /**
   * Инвалидировать кэш по паттерну
   */
  invalidatePattern(pattern: string): void {
    try {
      // Экранируем специальные символы regex для безопасности
      // Если паттерн уже содержит regex-символы, используем его как есть
      // Иначе экранируем и делаем простой поиск подстроки
      let regex: RegExp
      
      // Проверяем, является ли паттерн простой строкой или regex
      const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(pattern)
      
      if (hasRegexChars) {
        // Используем как regex, но с флагом для безопасности
        try {
          regex = new RegExp(pattern, 'i') // case-insensitive
        } catch (regexError) {
          // Если паттерн некорректный, используем простой поиск подстроки
          regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        }
      } else {
        // Простой поиск подстроки (быстрее и безопаснее)
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        regex = new RegExp(escapedPattern, 'i')
      }

      const keysToDelete: string[] = []

      for (const key of this.cache.keys()) {
        try {
          if (regex.test(key)) {
            keysToDelete.push(key)
          }
        } catch (testError) {
          // Пропускаем ключи, которые вызывают ошибки
          console.warn('Cache pattern test error for key:', key, testError)
        }
      }

      keysToDelete.forEach(key => {
        try {
          this.cache.delete(key)
        } catch (deleteError) {
          console.warn('Cache delete error for key:', key, deleteError)
        }
      })
    } catch (error) {
      console.error('Cache invalidatePattern error:', error)
    }
  }

  /**
   * Уничтожить сервис и очистить интервалы
   */
  destroy(): void {
    if (this.cleanupInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
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

// TTL константы (в миллисекундах) - увеличены для медленного интернета
export const CacheTTL = {
  SHORT: 15 * 60 * 1000,     // 15 минут (увеличено с 5)
  MEDIUM: 30 * 60 * 1000,    // 30 минут (увеличено с 15)
  LONG: 2 * 60 * 60 * 1000,  // 2 часа (увеличено с 1)
  VERY_LONG: 8 * 60 * 60 * 1000, // 8 часов (увеличено с 4)
  STATIC: 24 * 60 * 60 * 1000    // 24 часа для статических данных
} as const
