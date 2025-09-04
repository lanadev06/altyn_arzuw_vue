import { onMounted, onUnmounted, ref } from 'vue'
import { eventBus } from '../utils/eventBus'
import type { 
  OrderStageChangedEvent, 
  OrderUpdatedEvent,
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent,
  OrderCommentAddedEvent,
  OrderCommentDeletedEvent
} from '../utils/eventBus'

/**
 * Composable для работы с глобальными событиями заказов
 * Обеспечивает синхронизацию между компонентами при изменении заказов
 */
export function useOrderEvents() {
  const unsubscribeFunctions: Array<() => void> = []

  /**
   * Подписаться на смену стадии заказа
   */
  function onOrderStageChanged(callback: (event: OrderStageChangedEvent) => void) {
    const unsubscribe = eventBus.on('order-stage-changed', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на обновление заказа
   */
  function onOrderUpdated(callback: (event: OrderUpdatedEvent) => void) {
    const unsubscribe = eventBus.on('order-updated', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Отправить событие смены стадии заказа
   */
  function emitOrderStageChanged(
    orderId: number,
    oldStage: string,
    newStage: string,
    source: OrderStageChangedEvent['source'],
    stageDisplayName?: string
  ) {
    const event: OrderStageChangedEvent = {
      orderId,
      oldStage,
      newStage,
      stageDisplayName,
      timestamp: new Date(),
      source
    }
    eventBus.emitOrderStageChanged(event)
  }

  /**
   * Отправить событие обновления заказа
   */
  function emitOrderUpdated(
    orderId: number,
    changes: Record<string, any>,
    source: OrderUpdatedEvent['source']
  ) {
    const event: OrderUpdatedEvent = {
      orderId,
      changes,
      timestamp: new Date(),
      source
    }
    eventBus.emitOrderUpdated(event)
  }

  /**
   * Подписаться на создание сущности
   */
  function onEntityCreated(callback: (event: EntityCreatedEvent) => void) {
    const unsubscribe = eventBus.on('entity-created', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на обновление сущности
   */
  function onEntityUpdated(callback: (event: EntityUpdatedEvent) => void) {
    const unsubscribe = eventBus.on('entity-updated', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на удаление сущности
   */
  function onEntityDeleted(callback: (event: EntityDeletedEvent) => void) {
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
    source: EntityCreatedEvent['source']
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
    source: EntityUpdatedEvent['source']
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
    source: EntityDeletedEvent['source']
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
   * Подписаться на добавление комментария к заказу
   */
  function onOrderCommentAdded(callback: (event: OrderCommentAddedEvent) => void) {
    const unsubscribe = eventBus.on('order-comment-added', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Подписаться на удаление комментария к заказу
   */
  function onOrderCommentDeleted(callback: (event: OrderCommentDeletedEvent) => void) {
    const unsubscribe = eventBus.on('order-comment-deleted', callback)
    unsubscribeFunctions.push(unsubscribe)
    return unsubscribe
  }

  /**
   * Отправить событие добавления комментария к заказу
   */
  function emitOrderCommentAdded(
    orderId: number,
    commentId: number,
    commentText: string,
    userId: number,
    userName: string,
    source: OrderCommentAddedEvent['source']
  ) {
    const event: OrderCommentAddedEvent = {
      orderId,
      commentId,
      commentText,
      userId,
      userName,
      timestamp: new Date(),
      source
    }
    eventBus.emitOrderCommentAdded(event)
  }

  /**
   * Отправить событие удаления комментария к заказу
   */
  function emitOrderCommentDeleted(
    orderId: number,
    commentId: number,
    source: OrderCommentDeletedEvent['source']
  ) {
    const event: OrderCommentDeletedEvent = {
      orderId,
      commentId,
      timestamp: new Date(),
      source
    }
    eventBus.emitOrderCommentDeleted(event)
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
    onOrderStageChanged,
    onOrderUpdated,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onOrderCommentAdded,
    onOrderCommentDeleted,
    emitOrderStageChanged,
    emitOrderUpdated,
    emitEntityCreated,
    emitEntityUpdated,
    emitEntityDeleted,
    emitOrderCommentAdded,
    emitOrderCommentDeleted,
    cleanup
  }
}

/**
 * Composable для отслеживания изменений конкретного заказа
 */
export function useOrderWatcher(orderId: number | null) {
  const { onOrderStageChanged, onOrderUpdated } = useOrderEvents()
  
  const lastStageChange = ref<OrderStageChangedEvent | null>(null)
  const lastUpdate = ref<OrderUpdatedEvent | null>(null)

  onOrderStageChanged((event) => {
    if (event.orderId === orderId) {
      lastStageChange.value = event
    }
  })

  onOrderUpdated((event) => {
    if (event.orderId === orderId) {
      lastUpdate.value = event
    }
  })

  return {
    lastStageChange,
    lastUpdate
  }
}
