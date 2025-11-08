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
    frontendCache.invalidatePattern(CacheKeys.USERS_BY_STAGE_ROLES)
  },

  // Инвалидировать кэш заказов
  orders: () => {
    console.log('[Cache] Invalidating all order caches...')
    
    // Используем новый метод invalidateByPrefix для гарантированной очистки всех ключей
    // Это включает все страницы пагинации с любыми параметрами (per_page, page, stage, etc.)
    frontendCache.invalidateByPrefix('orders_')
    frontendCache.invalidateByPrefix('order_details_')
    frontendCache.invalidateByPrefix('order_status_logs_')
    frontendCache.invalidateByPrefix('order_comments_')
    frontendCache.invalidateByPrefix('orders_admin_')
    
    // Дополнительно используем паттерн для надежности (на случай, если есть ключи с другим форматом)
    frontendCache.invalidatePattern('^orders_')
    frontendCache.invalidatePattern('^order_details_')
    frontendCache.invalidatePattern('^order_status_logs_')
    frontendCache.invalidatePattern('^order_comments_')
    frontendCache.invalidatePattern('^orders_admin_')
    
    // Получаем статистику для отладки
    const stats = frontendCache.getStats()
    console.log('[Cache] Order cache invalidated. Stats:', stats)
  },

  // Инвалидировать кэш продуктов
  products: () => {
    frontendCache.invalidatePattern(CacheKeys.PRODUCTS)
    frontendCache.invalidatePattern('product_stages_')
    frontendCache.invalidatePattern('product_assignments_')
    frontendCache.invalidatePattern('available_users_for_product_')
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
 * Получить все ключи кеша заказов для отладки
 */
export const getOrderCacheKeys = () => {
  try {
    const keys = frontendCache.getKeysByPrefix('orders_')
    return keys
  } catch (error) {
    console.error('Error getting order cache keys:', error)
    return []
  }
}

/**
 * Полная диагностика кеша заказов
 */
export const diagnoseOrderCache = () => {
  const stats = getCacheStats()
  const orderKeys = getOrderCacheKeys()
  
  console.group('[Cache Diagnostics] Orders Cache')
  console.log('Total cache entries:', stats.total)
  console.log('Valid entries:', stats.valid)
  console.log('Expired entries:', stats.expired)
  console.log('Hit rate:', stats.hitRate.toFixed(2) + '%')
  console.log('Order cache keys:', orderKeys)
  console.log('Order cache keys count:', orderKeys.length)
  console.groupEnd()
  
  return {
    stats,
    orderKeys,
    orderKeysCount: orderKeys.length
  }
}

/**
 * Принудительно очистить весь кеш заказов (для отладки)
 */
export const forceClearOrderCache = () => {
  console.log('[Cache] Force clearing all order caches...')
  invalidateCache.orders()
  // Дополнительно очищаем весь кеш на случай, если что-то осталось
  frontendCache.clear()
  console.log('[Cache] All caches cleared')
}

/**
 * Очистить кэш при выходе из системы
 */
export const clearCacheOnLogout = () => {
  frontendCache.clear()
}
