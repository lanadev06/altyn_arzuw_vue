import { onMounted, onUnmounted, ref } from 'vue'
import { eventBus } from '../utils/eventBus'
import type {
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent
} from '../utils/eventBus'

/**
 * Composable для работы с глобальными событиями сущностей
 * Обеспечивает синхронизацию между компонентами при изменении любых сущностей
 */
export function useEntityEvents() {
  const unsubscribeFunctions: Array<() => void> = []

  /**
   * Подписаться на создание сущности определенного типа
   */
  function onEntityCreated(
    entityType: EntityCreatedEvent['entityType'],
    callback: (event: EntityCreatedEvent) => void
  ) {
    const unsubscribe = eventBus.on(`${entityType}-created`, callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на обновление сущности определенного типа
   */
  function onEntityUpdated(
    entityType: EntityUpdatedEvent['entityType'],
    callback: (event: EntityUpdatedEvent) => void
  ) {
    const unsubscribe = eventBus.on(`${entityType}-updated`, callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на удаление сущности определенного типа
   */
  function onEntityDeleted(
    entityType: EntityDeletedEvent['entityType'],
    callback: (event: EntityDeletedEvent) => void
  ) {
    const unsubscribe = eventBus.on(`${entityType}-deleted`, callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на все события создания сущностей
   */
  function onAnyEntityCreated(callback: (event: EntityCreatedEvent) => void) {
    const unsubscribe = eventBus.on('entity-created', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на все события обновления сущностей
   */
  function onAnyEntityUpdated(callback: (event: EntityUpdatedEvent) => void) {
    const unsubscribe = eventBus.on('entity-updated', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на все события удаления сущностей
   */
  function onAnyEntityDeleted(callback: (event: EntityDeletedEvent) => void) {
    const unsubscribe = eventBus.on('entity-deleted', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Отправить событие создания сущности
   */
  function emitEntityCreated(
    entityType: EntityCreatedEvent['entityType'],
    entityId: number,
    entityData: Record<string, any>,
    source: EntityCreatedEvent['source'] = 'form'
  ) {
    const event: EntityCreatedEvent = {
      entityType,
      entityId,
      entityData,
      timestamp: new Date(),
      source
    }
    eventBus.emitEntityCreated(event)
  }

  /**
   * Отправить событие обновления сущности
   */
  function emitEntityUpdated(
    entityType: EntityUpdatedEvent['entityType'],
    entityId: number,
    changes: Record<string, any>,
    source: EntityUpdatedEvent['source'] = 'form'
  ) {
    const event: EntityUpdatedEvent = {
      entityType,
      entityId,
      changes,
      timestamp: new Date(),
      source
    }
    eventBus.emitEntityUpdated(event)
  }

  /**
   * Отправить событие удаления сущности
   */
  function emitEntityDeleted(
    entityType: EntityDeletedEvent['entityType'],
    entityId: number,
    source: EntityDeletedEvent['source'] = 'form'
  ) {
    const event: EntityDeletedEvent = {
      entityType,
      entityId,
      timestamp: new Date(),
      source
    }
    eventBus.emitEntityDeleted(event)
  }

  /**
   * Очистить все подписки
   */
  function cleanup() {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions.length = 0
  }

  // Автоматическая очистка при размонтировании компонента
  onUnmounted(() => {
    cleanup()
  })

  return {
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onAnyEntityCreated,
    onAnyEntityUpdated,
    onAnyEntityDeleted,
    emitEntityCreated,
    emitEntityUpdated,
    emitEntityDeleted,
    cleanup
  }
}

/**
 * Composable для отслеживания изменений конкретной сущности
 */
export function useEntityWatcher(entityType: EntityCreatedEvent['entityType'], entityId: number | null) {
  const { onEntityCreated, onEntityUpdated, onEntityDeleted } = useEntityEvents()
  
  const lastCreated = ref<EntityCreatedEvent | null>(null)
  const lastUpdated = ref<EntityUpdatedEvent | null>(null)
  const lastDeleted = ref<EntityDeletedEvent | null>(null)

  onEntityCreated(entityType, (event) => {
    if (event.entityId === entityId) {
      lastCreated.value = event
    }
  })

  onEntityUpdated(entityType, (event) => {
    if (event.entityId === entityId) {
      lastUpdated.value = event
    }
  })

  onEntityDeleted(entityType, (event) => {
    if (event.entityId === entityId) {
      lastDeleted.value = event
    }
  })

  return {
    lastCreated,
    lastUpdated,
    lastDeleted
  }
}
