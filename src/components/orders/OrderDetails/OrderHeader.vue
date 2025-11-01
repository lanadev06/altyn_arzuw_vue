<template>
  <div>
    <div class="flex items-center gap-4 mb-2">
      <div class="text-3xl font-extrabold text-gray-900 tracking-tight">
        {{ t('common.orders') }} #{{ order?.id }}
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
import { useI18n } from 'vue-i18n'
import type { OrderInfo as OrderInfoType } from '../../../types/orderDetails'

const { t } = useI18n() // Используется только для "Заказ #" в заголовке


interface Stage {
  value: string
  label: string
  color?: string
}

interface Props {
  order: OrderInfoType | null
  stages?: Stage[]
}

const props = defineProps<Props>()

function getCurrentStage(orderData: OrderInfoType | null): string {
  if (!orderData?.stage) return ''
  return typeof orderData.stage === 'string'
    ? orderData.stage
    : (orderData.stage as { name: string })?.name || ''
}

function getStatusText(stage: string) {
  // Используем динамические данные из props.stages (приходят с сервера)
  if (props.stages) {
    const stageData = props.stages.find((s) => s.value === stage)
    if (stageData?.label) {
      return stageData.label
    }
  }
  // Fallback - показываем как есть, если данных нет
  return stage
}

function statusBadge(stage: string) {
  return 'text-white'
}

function getStatusBadgeStyle(stage: string) {
  // Сначала ищем цвет в данных стадий
  if (props.stages) {
    const stageData = props.stages.find((s) => s.value === stage)
    if (stageData?.color) {
      return {
        backgroundColor: stageData.color,
        color: '#ffffff',
      }
    }
  }

  // Fallback цвета, если данные стадий недоступны
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

</script>
