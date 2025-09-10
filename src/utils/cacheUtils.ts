/**
 * Утилиты для работы с кэшем
 */

import { frontendCache, CacheKeys } from '../services/cacheService'

/**
 * Инвалидировать кэш после создания/обновления/удаления
 */
export const invalidateCache = {
  // Инвалидировать кэш пользователей
  users: () => {
    frontendCache.invalidatePattern(CacheKeys.USERS)
  },

  // Инвалидировать кэш заказов
  orders: () => {
    frontendCache.invalidatePattern(CacheKeys.ORDERS)
  },

  // Инвалидировать кэш продуктов
  products: () => {
    frontendCache.invalidatePattern(CacheKeys.PRODUCTS)
  },

  // Инвалидировать кэш клиентов
  clients: () => {
    frontendCache.invalidatePattern(CacheKeys.CLIENTS)
  },

  // Инвалидировать кэш проектов
  projects: () => {
    frontendCache.invalidatePattern(CacheKeys.PROJECTS)
  },

  // Инвалидировать кэш стадий
  stages: () => {
    frontendCache.invalidatePattern(CacheKeys.STAGES)
  },

  // Инвалидировать кэш ролей
  roles: () => {
    frontendCache.invalidatePattern(CacheKeys.ROLES)
  },

  // Инвалидировать кэш статистики
  stats: () => {
    frontendCache.invalidatePattern(CacheKeys.STATS)
  },

  // Инвалидировать весь кэш
  all: () => {
    frontendCache.clear()
  }
}

/**
 * Получить статистику кэша для отладки
 */
export const getCacheStats = () => {
  const stats = frontendCache.getStats()
  return stats
}

/**
 * Очистить кэш при выходе из системы
 */
export const clearCacheOnLogout = () => {
  frontendCache.clear()
}
