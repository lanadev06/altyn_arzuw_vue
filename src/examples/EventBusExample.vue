<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">🎯 Система глобальных событий для синхронизации стадий</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Модалка -->
      <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h2 class="text-xl font-semibold mb-3 text-blue-800">📱 Модалка заказа</h2>
        <p class="text-sm text-gray-600 mb-3">При смене стадии в модалке:</p>
        <div class="space-y-2">
          <button 
            @click="simulateModalStageChange('draft', 'design')"
            class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Draft → Design
          </button>
          <button 
            @click="simulateModalStageChange('design', 'print')"
            class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Design → Print
          </button>
          <button 
            @click="simulateModalStageChange('print', 'completed')"
            class="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Print → Completed
          </button>
        </div>
      </div>

      <!-- Канбан -->
      <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h2 class="text-xl font-semibold mb-3 text-green-800">📋 Канбан доска</h2>
        <p class="text-sm text-gray-600 mb-3">При перетаскивании в канбане:</p>
        <div class="space-y-2">
          <button 
            @click="simulateKanbanStageChange('draft', 'workshop')"
            class="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Draft → Workshop
          </button>
          <button 
            @click="simulateKanbanStageChange('workshop', 'final')"
            class="w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Workshop → Final
          </button>
          <button 
            @click="simulateKanbanStageChange('final', 'cancelled')"
            class="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Final → Cancelled
          </button>
        </div>
      </div>

      <!-- Список заказов -->
      <div class="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
        <h2 class="text-xl font-semibold mb-3 text-purple-800">📊 Список заказов</h2>
        <p class="text-sm text-gray-600 mb-3">При изменении в списке:</p>
        <div class="space-y-2">
          <button 
            @click="simulateListStageChange('draft', 'engraving')"
            class="w-full px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Draft → Engraving
          </button>
          <button 
            @click="simulateListStageChange('engraving', 'completed')"
            class="w-full px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Engraving → Completed
          </button>
        </div>
      </div>
    </div>

    <!-- Лог событий -->
    <div class="mt-8 bg-gray-50 p-4 rounded-lg border">
      <h3 class="text-lg font-semibold mb-3">📝 Лог событий</h3>
      <div class="max-h-64 overflow-y-auto space-y-2">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="p-2 bg-white rounded border-l-4"
          :class="getEventLogClass(event.source)"
        >
          <div class="flex justify-between items-start">
            <div>
              <span class="font-semibold">{{ event.source.toUpperCase() }}</span>
              <span class="text-gray-600 ml-2">Заказ #{{ event.orderId }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
          </div>
          <div class="text-sm mt-1">
            <span class="px-2 py-1 bg-gray-200 rounded text-xs">{{ event.oldStage }}</span>
            <span class="mx-2">→</span>
            <span class="px-2 py-1 bg-blue-200 rounded text-xs">{{ event.newStage }}</span>
            <span v-if="event.stageDisplayName" class="ml-2 text-gray-600">
              ({{ event.stageDisplayName }})
            </span>
          </div>
        </div>
        <div v-if="eventLog.length === 0" class="text-gray-500 text-center py-4">
          События будут отображаться здесь...
        </div>
      </div>
    </div>

    <!-- Инструкции -->
    <div class="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 class="text-lg font-semibold mb-3 text-yellow-800">💡 Как это работает</h3>
      <div class="text-sm text-gray-700 space-y-2">
        <p><strong>1. EventBus:</strong> Центральная система событий для синхронизации между компонентами</p>
        <p><strong>2. useOrderEvents:</strong> Composable для работы с событиями заказов</p>
        <p><strong>3. Автоматическая синхронизация:</strong> При смене стадии в любом компоненте, все остальные обновляются автоматически</p>
        <p><strong>4. Источник события:</strong> Каждое событие содержит информацию о том, откуда оно пришло (modal, kanban, list)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOrderEvents } from '../composables/useOrderEvents'
import type { OrderStageChangedEvent } from '../utils/eventBus'

defineOptions({
  name: 'EventBusExample'
})

const { emitOrderStageChanged } = useOrderEvents()
const eventLog = ref<OrderStageChangedEvent[]>([])

// Симуляция смены стадии из модалки
function simulateModalStageChange(oldStage: string, newStage: string) {
  const orderId = Math.floor(Math.random() * 1000) + 1
  emitOrderStageChanged(orderId, oldStage, newStage, 'modal', getStageDisplayName(newStage))
  addToEventLog(orderId, oldStage, newStage, 'modal', getStageDisplayName(newStage))
}

// Симуляция смены стадии из канбана
function simulateKanbanStageChange(oldStage: string, newStage: string) {
  const orderId = Math.floor(Math.random() * 1000) + 1
  emitOrderStageChanged(orderId, oldStage, newStage, 'kanban', getStageDisplayName(newStage))
  addToEventLog(orderId, oldStage, newStage, 'kanban', getStageDisplayName(newStage))
}

// Симуляция смены стадии из списка
function simulateListStageChange(oldStage: string, newStage: string) {
  const orderId = Math.floor(Math.random() * 1000) + 1
  emitOrderStageChanged(orderId, oldStage, newStage, 'list', getStageDisplayName(newStage))
  addToEventLog(orderId, oldStage, newStage, 'list', getStageDisplayName(newStage))
}

// Добавление события в лог
function addToEventLog(orderId: number, oldStage: string, newStage: string, source: OrderStageChangedEvent['source'], stageDisplayName?: string) {
  const event: OrderStageChangedEvent = {
    orderId,
    oldStage,
    newStage,
    stageDisplayName,
    timestamp: new Date(),
    source
  }
  eventLog.value.unshift(event)
  
  // Ограничиваем лог 20 событиями
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

// Получение отображаемого названия стадии
function getStageDisplayName(stage: string): string {
  const stageNames: Record<string, string> = {
    'draft': 'Черновик',
    'design': 'Дизайн',
    'print': 'Печать',
    'workshop': 'Цех',
    'final': 'Финализация',
    'completed': 'Завершен',
    'cancelled': 'Отменен',
    'engraving': 'Гравировка'
  }
  return stageNames[stage] || stage
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
function getEventLogClass(source: string): string {
  const classes: Record<string, string> = {
    'modal': 'border-blue-400',
    'kanban': 'border-green-400',
    'list': 'border-purple-400'
  }
  return classes[source] || 'border-gray-400'
}
</script>
