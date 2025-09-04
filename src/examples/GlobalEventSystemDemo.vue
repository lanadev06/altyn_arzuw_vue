<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">🌐 Глобальная система событий для всех сущностей</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Заказы -->
      <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h2 class="text-xl font-semibold mb-3 text-blue-800">📦 Заказы</h2>
        <div class="space-y-2">
          <button 
            @click="simulateOrderCreated"
            class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Создать заказ
          </button>
          <button 
            @click="simulateOrderUpdated"
            class="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Обновить заказ
          </button>
          <button 
            @click="simulateOrderDeleted"
            class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить заказ
          </button>
        </div>
      </div>

      <!-- Проекты -->
      <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h2 class="text-xl font-semibold mb-3 text-green-800">📋 Проекты</h2>
        <div class="space-y-2">
          <button 
            @click="simulateProjectCreated"
            class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Создать проект
          </button>
          <button 
            @click="simulateProjectUpdated"
            class="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Обновить проект
          </button>
          <button 
            @click="simulateProjectDeleted"
            class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить проект
          </button>
        </div>
      </div>

      <!-- Продукты -->
      <div class="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
        <h2 class="text-xl font-semibold mb-3 text-purple-800">🛍️ Продукты</h2>
        <div class="space-y-2">
          <button 
            @click="simulateProductCreated"
            class="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Создать продукт
          </button>
          <button 
            @click="simulateProductUpdated"
            class="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Обновить продукт
          </button>
          <button 
            @click="simulateProductDeleted"
            class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить продукт
          </button>
        </div>
      </div>

      <!-- Клиенты -->
      <div class="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
        <h2 class="text-xl font-semibold mb-3 text-orange-800">👥 Клиенты</h2>
        <div class="space-y-2">
          <button 
            @click="simulateClientCreated"
            class="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Создать клиента
          </button>
          <button 
            @click="simulateClientUpdated"
            class="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Обновить клиента
          </button>
          <button 
            @click="simulateClientDeleted"
            class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить клиента
          </button>
        </div>
      </div>
    </div>

    <!-- Статистика событий -->
    <div class="bg-gray-50 p-4 rounded-lg border mb-6">
      <h3 class="text-lg font-semibold mb-3">📊 Статистика событий</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ eventStats.created }}</div>
          <div class="text-sm text-gray-600">Создано</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ eventStats.updated }}</div>
          <div class="text-sm text-gray-600">Обновлено</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ eventStats.deleted }}</div>
          <div class="text-sm text-gray-600">Удалено</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ eventStats.total }}</div>
          <div class="text-sm text-gray-600">Всего</div>
        </div>
      </div>
    </div>

    <!-- Лог событий -->
    <div class="bg-gray-50 p-4 rounded-lg border">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold">📝 Лог событий</h3>
        <button 
          @click="clearLog"
          class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Очистить
        </button>
      </div>
      <div class="max-h-64 overflow-y-auto space-y-2">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="p-3 bg-white rounded border-l-4"
          :class="getEventLogClass(event.type)"
        >
          <div class="flex justify-between items-start">
            <div>
              <span class="font-semibold">{{ getEventTypeIcon(event.type) }} {{ getEventTypeName(event.type) }}</span>
              <span class="text-gray-600 ml-2">{{ event.entityType.toUpperCase() }} #{{ event.entityId }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
          </div>
          <div class="text-sm mt-1 text-gray-700">
            <span v-if="event.entityData">{{ JSON.stringify(event.entityData).substring(0, 100) }}...</span>
            <span v-else-if="event.changes">{{ JSON.stringify(event.changes).substring(0, 100) }}...</span>
          </div>
        </div>
        <div v-if="eventLog.length === 0" class="text-gray-500 text-center py-4">
          События будут отображаться здесь...
        </div>
      </div>
    </div>

    <!-- Инструкции -->
    <div class="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 class="text-lg font-semibold mb-3 text-yellow-800">💡 Как работает глобальная система событий</h3>
      <div class="text-sm text-gray-700 space-y-2">
        <p><strong>🔄 Автоматическая синхронизация:</strong> При создании, обновлении или удалении любой сущности все связанные компоненты обновляются автоматически</p>
        <p><strong>📡 Централизованная система:</strong> EventBus координирует все события между компонентами</p>
        <p><strong>🎯 Типизированные события:</strong> Каждое событие имеет строгую типизацию TypeScript</p>
        <p><strong>🧹 Автоочистка:</strong> Слушатели автоматически удаляются при размонтировании компонентов</p>
        <p><strong>⚡ Производительность:</strong> Минимальные перезагрузки данных, только необходимые обновления</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEntityEvents } from '../composables/useEntityEvents'
import type { EntityCreatedEvent, EntityUpdatedEvent, EntityDeletedEvent } from '../utils/eventBus'

defineOptions({
  name: 'GlobalEventSystemDemo'
})

const { emitEntityCreated, emitEntityUpdated, emitEntityDeleted } = useEntityEvents()

const eventLog = ref<Array<{
  type: 'created' | 'updated' | 'deleted'
  entityType: string
  entityId: number
  entityData?: Record<string, any>
  changes?: Record<string, any>
  timestamp: Date
}>>([])

const eventStats = computed(() => {
  const created = eventLog.value.filter(e => e.type === 'created').length
  const updated = eventLog.value.filter(e => e.type === 'updated').length
  const deleted = eventLog.value.filter(e => e.type === 'deleted').length
  return {
    created,
    updated,
    deleted,
    total: eventLog.value.length
  }
})

// Симуляция событий заказов
function simulateOrderCreated() {
  const orderId = Math.floor(Math.random() * 1000) + 1
  const orderData = {
    title: `Заказ #${orderId}`,
    quantity: Math.floor(Math.random() * 100) + 1,
    price: Math.floor(Math.random() * 10000) + 1000
  }
  emitEntityCreated('order', orderId, orderData, 'form')
  addToEventLog('created', 'order', orderId, orderData)
}

function simulateOrderUpdated() {
  const orderId = Math.floor(Math.random() * 1000) + 1
  const changes = {
    quantity: Math.floor(Math.random() * 100) + 1,
    stage: 'in_progress'
  }
  emitEntityUpdated('order', orderId, changes, 'form')
  addToEventLog('updated', 'order', orderId, undefined, changes)
}

function simulateOrderDeleted() {
  const orderId = Math.floor(Math.random() * 1000) + 1
  emitEntityDeleted('order', orderId, 'form')
  addToEventLog('deleted', 'order', orderId)
}

// Симуляция событий проектов
function simulateProjectCreated() {
  const projectId = Math.floor(Math.random() * 1000) + 1
  const projectData = {
    name: `Проект #${projectId}`,
    description: 'Описание проекта',
    total_price: Math.floor(Math.random() * 50000) + 5000
  }
  emitEntityCreated('project', projectId, projectData, 'form')
  addToEventLog('created', 'project', projectId, projectData)
}

function simulateProjectUpdated() {
  const projectId = Math.floor(Math.random() * 1000) + 1
  const changes = {
    status: 'completed',
    total_price: Math.floor(Math.random() * 50000) + 5000
  }
  emitEntityUpdated('project', projectId, changes, 'form')
  addToEventLog('updated', 'project', projectId, undefined, changes)
}

function simulateProjectDeleted() {
  const projectId = Math.floor(Math.random() * 1000) + 1
  emitEntityDeleted('project', projectId, 'form')
  addToEventLog('deleted', 'project', projectId)
}

// Симуляция событий продуктов
function simulateProductCreated() {
  const productId = Math.floor(Math.random() * 1000) + 1
  const productData = {
    name: `Продукт #${productId}`,
    price: Math.floor(Math.random() * 1000) + 100,
    category: 'Печатная продукция'
  }
  emitEntityCreated('product', productId, productData, 'form')
  addToEventLog('created', 'product', productId, productData)
}

function simulateProductUpdated() {
  const productId = Math.floor(Math.random() * 1000) + 1
  const changes = {
    price: Math.floor(Math.random() * 1000) + 100,
    is_active: true
  }
  emitEntityUpdated('product', productId, changes, 'form')
  addToEventLog('updated', 'product', productId, undefined, changes)
}

function simulateProductDeleted() {
  const productId = Math.floor(Math.random() * 1000) + 1
  emitEntityDeleted('product', productId, 'form')
  addToEventLog('deleted', 'product', productId)
}

// Симуляция событий клиентов
function simulateClientCreated() {
  const clientId = Math.floor(Math.random() * 1000) + 1
  const clientData = {
    name: `Клиент #${clientId}`,
    company_name: `Компания ${clientId}`,
    email: `client${clientId}@example.com`
  }
  emitEntityCreated('client', clientId, clientData, 'form')
  addToEventLog('created', 'client', clientId, clientData)
}

function simulateClientUpdated() {
  const clientId = Math.floor(Math.random() * 1000) + 1
  const changes = {
    phone: '+993 12 34 56 78',
    address: 'Новый адрес'
  }
  emitEntityUpdated('client', clientId, changes, 'form')
  addToEventLog('updated', 'client', clientId, undefined, changes)
}

function simulateClientDeleted() {
  const clientId = Math.floor(Math.random() * 1000) + 1
  emitEntityDeleted('client', clientId, 'form')
  addToEventLog('deleted', 'client', clientId)
}

// Добавление события в лог
function addToEventLog(
  type: 'created' | 'updated' | 'deleted',
  entityType: string,
  entityId: number,
  entityData?: Record<string, any>,
  changes?: Record<string, any>
) {
  eventLog.value.unshift({
    type,
    entityType,
    entityId,
    entityData,
    changes,
    timestamp: new Date()
  })
  
  // Ограничиваем лог 50 событиями
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

// Очистка лога
function clearLog() {
  eventLog.value = []
}

// Получение иконки для типа события
function getEventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'created': '🆕',
    'updated': '📝',
    'deleted': '🗑️'
  }
  return icons[type] || '📄'
}

// Получение названия типа события
function getEventTypeName(type: string): string {
  const names: Record<string, string> = {
    'created': 'Создано',
    'updated': 'Обновлено',
    'deleted': 'Удалено'
  }
  return names[type] || type
}

// Форматирование времени
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// Получение CSS класса для лога событий
function getEventLogClass(type: string): string {
  const classes: Record<string, string> = {
    'created': 'border-green-400',
    'updated': 'border-blue-400',
    'deleted': 'border-red-400'
  }
  return classes[type] || 'border-gray-400'
}
</script>
