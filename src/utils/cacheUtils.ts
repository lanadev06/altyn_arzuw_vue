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
    // console.log('🗑️ Users cache invalidated')
  },

  // Инвалидировать кэш заказов
  orders: () => {
    frontendCache.invalidatePattern(CacheKeys.ORDERS)
    // console.log('🗑️ Orders cache invalidated')
  },

  // Инвалидировать кэш продуктов
  products: () => {
    frontendCache.invalidatePattern(CacheKeys.PRODUCTS)
    // console.log('🗑️ Products cache invalidated')
  },

  // Инвалидировать кэш клиентов
  clients: () => {
    frontendCache.invalidatePattern(CacheKeys.CLIENTS)
    // console.log('🗑️ Clients cache invalidated')
  },

  // Инвалидировать кэш проектов
  projects: () => {
    frontendCache.invalidatePattern(CacheKeys.PROJECTS)
    // console.log('🗑️ Projects cache invalidated')
  },

  // Инвалидировать кэш стадий
  stages: () => {
    frontendCache.invalidatePattern(CacheKeys.STAGES)
    // console.log('🗑️ Stages cache invalidated')
  },

  // Инвалидировать кэш ролей
  roles: () => {
    frontendCache.invalidatePattern(CacheKeys.ROLES)
    // console.log('🗑️ Roles cache invalidated')
  },

  // Инвалидировать кэш статистики
  stats: () => {
    frontendCache.invalidatePattern(CacheKeys.STATS)
    // console.log('🗑️ Stats cache invalidated')
  },

  // Инвалидировать весь кэш
  all: () => {
    frontendCache.clear()
    // console.log('🗑️ All cache invalidated')
  }
}

/**
 * Получить статистику кэша для отладки
 */
export const getCacheStats = () => {
  const stats = frontendCache.getStats()
  // console.log('📊 Cache Statistics:', stats)
  return stats
}

/**
 * Очистить кэш при выходе из системы
 */
export const clearCacheOnLogout = () => {
  frontendCache.clear()
  // console.log('🧹 Cache cleared on logout')
}
