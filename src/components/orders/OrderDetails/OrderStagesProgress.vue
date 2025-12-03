<template>
  <div class="flex gap-1 items-center justify-center px-0 pt-8 pb-4 w-full">
    <button 
      v-for="(stage, idx) in stages" 
      :key="stage.value"
      :class="[
        'relative px-5 py-2 font-semibold text-base transition border-none outline-none focus:ring-2 focus:ring-yellow-300',
        'rounded-l-full',
        idx === stages.length - 1 ? 'rounded-r-full' : 'chevron-right',
        getStageColor(stage.value, currentStage, completedStages),
        canViewAllOrders() ? 'hover:brightness-110 cursor-pointer' : 'cursor-default',
        'min-w-[120px] text-center',
        idx !== 0 ? '-ml-2' : '',
        'transition-all duration-150',
      ]"
      @click="handleStageClick(stage.value)"
      :disabled="currentStage === stage.value || isCompletedDisabled(stage.value)"
      :style="{
        zIndex: stages.length - idx,
        ...getStageStyle(stage.value, currentStage, completedStages),
        ...(isCompletedDisabled(stage.value) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
      }"
      :title="getStageTitle(stage.value)"
    >
      {{ stage.label }}
      <span
        v-if="idx !== stages.length - 1"
        class="chevron absolute right-0 top-0 h-full w-4"
      ></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { canViewAllOrders } from '../../../utils/permissions'

interface Stage {
  value: string
  label: string
  color?: string
}

interface Order {
  price?: number
  payment_amount?: number
}

interface Props {
  stages: Stage[]
  currentStage: string
  completedStages: string[]
  order?: Order | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  stageClick: [stageValue: string]
}>()

function handleStageClick(stageValue: string) {
  // Сотрудники не могут менять стадии
  if (!canViewAllOrders()) {
    return
  }
  
  // Блокируем переход в completed если не оплачено полностью
  if (stageValue === 'completed' && isCompletedDisabled(stageValue)) {
    return
  }
  
  emit('stageClick', stageValue)
}

function isCompletedDisabled(stageValue: string): boolean {
  if (stageValue !== 'completed') return false
  if (!props.order) return false
  
  const paymentAmount = props.order.payment_amount ?? 0
  const price = props.order.price ?? 0
  
  return paymentAmount < price
}

function getStageTitle(stageValue: string): string {
  if (!canViewAllOrders()) {
    return 'Только администраторы и менеджеры могут менять стадии'
  }
  
  if (stageValue === 'completed' && isCompletedDisabled(stageValue)) {
    return 'Нельзя завершить заказ — он не полностью оплачен'
  }
  
  return ''
}

function getStageColor(stage: string, current: string, completed: string[]) {
  const stageData = props.stages.find((s) => s.value === stage)

  // Всегда возвращаем базовые классы, цвета будут применяться через getStageStyle
  if (current === stage) {
    return 'text-white font-semibold'
  }

  if (completed.includes(stage)) {
    return 'font-medium'
  }

  return 'text-gray-400'
}

function getStageStyle(stage: string, current: string, completed: string[]) {
  const stageData = props.stages.find((s) => s.value === stage)

  const fallbackColors = {
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

  const color =
    stageData?.color || fallbackColors[stage as keyof typeof fallbackColors] || '#6b7280'

  if (current === stage) {
    return {
      backgroundColor: color,
      color: '#ffffff',
    }
  }

  if (completed.includes(stage)) {
    return {
      backgroundColor: `${color}20`,
      color: color,
    }
  }

  // Для неактивных стадий возвращаем серый фон
  return {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  }
}
</script>

<style scoped>
.chevron-right::after,
.chevron::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  right: -8px;
  width: 16px;
  height: 100%;
  background: inherit;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  z-index: 2;
  pointer-events: none;
}

.chevron-right:last-child::after {
  display: none;
}
</style>
