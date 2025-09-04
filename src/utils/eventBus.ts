/**
 * Глобальная система событий для синхронизации между компонентами
 * Используется для синхронизации смены стадий заказов между модалкой, канбаном и списком
 */

export interface OrderStageChangedEvent {
  orderId: number
  oldStage: string
  newStage: string
  stageDisplayName?: string
  timestamp: Date
  source: 'modal' | 'kanban' | 'list' | 'api'
}

export interface OrderUpdatedEvent {
  orderId: number
  changes: Record<string, any>
  timestamp: Date
  source: 'modal' | 'kanban' | 'list' | 'api'
}

export interface EntityCreatedEvent {
  entityType: 'order' | 'project' | 'product' | 'client' | 'user' | 'role' | 'stage' | 'category'
  entityId: number
  entityData: Record<string, any>
  timestamp: Date
  source: 'modal' | 'form' | 'api'
}

export interface EntityUpdatedEvent {
  entityType: 'order' | 'project' | 'product' | 'client' | 'user' | 'role' | 'stage' | 'category'
  entityId: number
  changes: Record<string, any>
  timestamp: Date
  source: 'modal' | 'form' | 'api'
}

export interface EntityDeletedEvent {
  entityType: 'order' | 'project' | 'product' | 'client' | 'user' | 'role' | 'stage' | 'category'
  entityId: number
  timestamp: Date
  source: 'modal' | 'form' | 'api'
}

export interface OrderCommentAddedEvent {
  orderId: number
  commentId: number
  commentText: string
  userId: number
  userName: string
  timestamp: Date
  source: 'modal' | 'form' | 'api'
}

export interface OrderCommentDeletedEvent {
  orderId: number
  commentId: number
  timestamp: Date
  source: 'modal' | 'form' | 'api'
}

class EventBus {
  private listeners: Map<string, Set<Function>> = new Map()

  /**
   * Подписаться на событие
   */
  on(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(callback)

    // Возвращаем функцию для отписки
    return () => {
      this.off(eventName, callback)
    }
  }

  /**
   * Отписаться от события
   */
  off(eventName: string, callback: Function) {
    const eventListeners = this.listeners.get(eventName)
    if (eventListeners) {
      eventListeners.delete(callback)
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  /**
   * Отправить событие
   */
  emit(eventName: string, data?: any) {
    const eventListeners = this.listeners.get(eventName)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error)
        }
      })
    }
  }

  /**
   * Отправить событие смены стадии заказа
   */
  emitOrderStageChanged(event: OrderStageChangedEvent) {
    this.emit('order-stage-changed', event)
    // Также отправляем общее событие обновления заказа
    this.emit('order-updated', {
      orderId: event.orderId,
      changes: { stage: event.newStage },
      timestamp: event.timestamp,
      source: event.source
    } as OrderUpdatedEvent)
  }

  /**
   * Отправить событие обновления заказа
   */
  emitOrderUpdated(event: OrderUpdatedEvent) {
    this.emit('order-updated', event)
  }

  /**
   * Отправить событие создания сущности
   */
  emitEntityCreated(event: EntityCreatedEvent) {
    this.emit('entity-created', event)
    // Также отправляем специфичное событие для типа сущности
    this.emit(`${event.entityType}-created`, event)
  }

  /**
   * Отправить событие обновления сущности
   */
  emitEntityUpdated(event: EntityUpdatedEvent) {
    this.emit('entity-updated', event)
    // Также отправляем специфичное событие для типа сущности
    this.emit(`${event.entityType}-updated`, event)
  }

  /**
   * Отправить событие удаления сущности
   */
  emitEntityDeleted(event: EntityDeletedEvent) {
    this.emit('entity-deleted', event)
    // Также отправляем специфичное событие для типа сущности
    this.emit(`${event.entityType}-deleted`, event)
  }

  /**
   * Отправить событие добавления комментария к заказу
   */
  emitOrderCommentAdded(event: OrderCommentAddedEvent) {
    this.emit('order-comment-added', event)
    // Также отправляем общее событие обновления заказа
    this.emit('order-updated', {
      orderId: event.orderId,
      changes: { commentAdded: true },
      timestamp: event.timestamp,
      source: event.source
    } as OrderUpdatedEvent)
  }

  /**
   * Отправить событие удаления комментария к заказу
   */
  emitOrderCommentDeleted(event: OrderCommentDeletedEvent) {
    this.emit('order-comment-deleted', event)
    // Также отправляем общее событие обновления заказа
    this.emit('order-updated', {
      orderId: event.orderId,
      changes: { commentDeleted: true },
      timestamp: event.timestamp,
      source: event.source
    } as OrderUpdatedEvent)
  }

  /**
   * Очистить все слушатели
   */
  clear() {
    this.listeners.clear()
  }
}

// Создаем глобальный экземпляр
export const eventBus = new EventBus()

// Типы уже экспортированы как интерфейсы выше
