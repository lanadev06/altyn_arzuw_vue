<template>
  <div>
    <div class="flex items-center gap-4 mb-2">
      <div class="text-3xl font-extrabold text-gray-900 tracking-tight">
        Заказ #{{ order?.id }}
      </div>
      
      <!-- Индикатор синхронизации -->
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <div 
          class="w-2 h-2 rounded-full"
          :class="isPollingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"
          :title="isPollingActive ? 'Синхронизация активна' : 'Синхронизация остановлена'"
        ></div>
        <span v-if="lastPollingUpdate">
          {{ Math.floor((Date.now() - lastPollingUpdate.getTime()) / 1000) }}с назад
        </span>
        <button 
          @click="$emit('forceRefresh')"
          class="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          title="Принудительно обновить данные"
        >
          🔄
        </button>
      </div>
      
      <!-- Статус заказа -->
      <div class="flex flex-col gap-2">
        <span
          v-if="order"
          :class="[
            'inline-block px-4 py-1 rounded-full text-base font-bold shadow',
            statusBadge(getCurrentStage(order)),
          ]"
          :style="getStatusBadgeStyle(getCurrentStage(order))"
        >
          {{ getStatusText(getCurrentStage(order)) }}
        </span>
      </div>
    </div>
    
    <div class="text-lg text-gray-500 font-medium mb-6">
      {{ order?.product?.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderInfo as OrderInfoType } from '../../../types/orderDetails'

interface Props {
  order: OrderInfoType | null
  isPollingActive: boolean
  lastPollingUpdate: Date | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  forceRefresh: []
}>()

function getCurrentStage(orderData: OrderInfoType | null): string {
  if (!orderData?.stage) return ''
  return typeof orderData.stage === 'string'
    ? orderData.stage
    : (orderData.stage as { name: string })?.name || ''
}

function getStatusText(stage: string) {
  const stageLabels: Record<string, string> = {
    draft: 'Черновик',
    design: 'Дизайн',
    print: 'Печать',
    engraving: 'Гравировка',
    workshop: 'Цех',
    die_cutting: 'Высечка',
    final: 'Финал',
    completed: 'Завершен',
    cancelled: 'Отменен',
  }
  return stageLabels[stage] || stage
}

function statusBadge(stage: string) {
  return 'text-white'
}

function getStatusBadgeStyle(stage: string) {
  const fallbackColors: Record<string, string> = {
    draft: '#6b7280',
    design: '#3b82f6',
    print: '#f59e0b',
    engraving: '#f97316',
    workshop: '#8b5cf6',
    die_cutting: '#10b981',
    final: '#10b981',
    completed: '#059669',
    cancelled: '#ef4444',
  }

  const fallbackColor = fallbackColors[stage]
  if (fallbackColor) {
    return {
      backgroundColor: fallbackColor,
      color: '#ffffff',
    }
  }

  return {
    backgroundColor: '#6b7280',
    color: '#ffffff',
  }
}

defineOptions({
  name: 'OrderHeader'
})
</script>
