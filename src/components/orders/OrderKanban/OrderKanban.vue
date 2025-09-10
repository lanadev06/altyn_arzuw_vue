<template>
  <div class="bitrix-board-new flex w-full p-0 min-h-[90vh]">
    <div
      v-for="(stageObj, idx) in statuses"
      :key="stageObj.key"
      class="bitrix-column flex flex-col max-h-[88vh] p-0 relative flex-1 min-w-0"
      :class="{
        'with-divider': idx !== statuses.length - 1,
        'bitrix-column--dragover': dragOverStage === stageObj.key,
        'first-col': idx === 0,
        'last-col': idx === statuses.length - 1,
      }"
      :style="{ borderLeft: idx !== 0 ? '1px solid #ece6f6' : 'none' }"
    >
      <div
        class="bitrix-top-bar"
        :style="{ background: getStatusColor(stageObj.key), ...getStatusColorStyle(stageObj.key) }"
      ></div>
      <div
        class="bitrix-header flex items-center justify-between px-3 py-2 font-bold relative"
        :class="{ 'first-col-header': idx === 0, 'last-col-header': idx === statuses.length - 1 }"
        :style="{ background: getStatusColor(stageObj.key), ...getStatusColorStyle(stageObj.key) }"
      >
        <span class="bitrix-header-title">{{ stageObj.label }}</span>
        <span
          class="bitrix-counter-badge"
          :style="{
            borderColor: getStatusColor(stageObj.key),
            color: getStatusColor(stageObj.key),
            ...getStatusColorStyle(stageObj.key),
          }"
        >
          {{ ordersByStage(stageObj.key).length }}
        </span>
      </div>
      <button
        v-if="stageObj.key === 'draft' && canCreateEdit()"
        class="bitrix-add-btn"
        @click="$emit('add-order', stageObj.key)"
      >
        <span class="plus-icon">+</span> Добавить заказ
      </button>
      <div
        class="bitrix-cards flex flex-col gap-0 p-1 overflow-y-auto min-h-[40px] transition-all"
        :id="'col-' + stageObj.key"
        @dragover.prevent
        @drop="onDrop($event, stageObj.key)"
        @dragenter="onDragEnter(stageObj.key)"
        @dragleave="onDragLeave(stageObj.key)"
        :class="{ 'bitrix-cards--dragover': dragOverStage === stageObj.key }"
      >
        <slot name="add-card" :stage="stageObj.key"></slot>
        <div
          v-for="order in ordersByStage(stageObj.key)"
          :key="order.id"
          class="bitrix-card-wrapper cursor-move transition"
          :class="{ dragging: draggingOrder && draggingOrder.id === order.id }"
          draggable="true"
          @dragstart="onDragStart(order)"
          @dragend="onDragEnd"
        >
          <slot name="card" :order="order">
            <OrderCard
              :order="order"
              :dragging="draggingOrder && draggingOrder.id === order.id"
              @click="handleOrderCardClick"
            />
          </slot>
        </div>
      </div>
    </div>
    <div v-if="toastMsg" class="fixed top-4 right-4 z-[9999]">
      <div
        :class="[
          'mb-2 px-4 py-2 rounded shadow text-white',
          toastType === 'error' ? 'bg-red-500' : 'bg-green-500',
        ]"
      >
        {{ toastMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import OrderCard from './OrderCard.vue'
import { OrderController } from '../../../controllers/OrderController'
import { canCreateEdit } from '../../../utils/permissions'
import { getStageColorStyles } from '../../../utils/stageColors'
import { stageApi } from '../../../services/stageApi'
import { useOrderEvents } from '../../../composables/useOrderEvents'

defineOptions({
  name: 'OrderKanban'
})

// Интерфейс для заказа
interface Order {
  id: number
  title?: string
  stage?: { name?: string } | string
  // Добавьте другие поля по необходимости
}

// Интерфейс для событий
interface StatusChangePayload {
  order: Order
  newStatus: string
}

// Вспомогательная функция для получения имени стадии
function getStageName(stage: { name?: string } | string | undefined): string {
  if (typeof stage === 'string') return stage
  return stage?.name || ''
}

const stages = ref<Array<{ value: string; label: string; color: string }>>([])

// Функция для сохранения цветов в localStorage
function saveStagesToStorage(stagesData: Array<{ value: string; label: string; color: string }>) {
  try {
    localStorage.setItem('kanban-stages-colors', JSON.stringify(stagesData))
  } catch {
    // Игнорируем ошибки localStorage
  }
}

// Функция для загрузки цветов из localStorage
function loadStagesFromStorage(): Array<{ value: string; label: string; color: string }> | null {
  try {
    const stored = localStorage.getItem('kanban-stages-colors')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

onMounted(async () => {
  // Сначала пытаемся загрузить цвета из localStorage
  const cachedStages = loadStagesFromStorage()
  if (cachedStages && cachedStages.length > 0) {
    stages.value = cachedStages
  }

  // Затем загружаем свежие цвета из API
  try {
    const stagesData = await stageApi.getAll()
    const newStages = stagesData.map(
      (stage: { name: string; display_name?: string; color?: string }) => ({
        value: stage.name,
        label: stage.display_name || stage.name,
        color: stage.color || '#6366f1', // Fallback цвет если API не вернул цвет
      }),
    )

    stages.value = newStages
    saveStagesToStorage(newStages) // Сохраняем в localStorage
  } catch {
    // Если API не работает и нет кэша, используем базовые цвета
    if (!cachedStages) {
      stages.value = props.statuses.map((status) => ({
        value: status.key,
        label: status.label,
        color: '#6366f1', // Единый fallback цвет
      }))
    }
  }

  OrderController().fetchAllOrdersForKanban()
  pollingInterval = window.setInterval(() => {
    OrderController().fetchAllOrdersForKanban()
  }, 25000) // Увеличиваем до 25 секунд
})
const props = defineProps<{
  statuses: { key: string; label: string }[]
  orders: Order[]
}>()

// Локальный ref для заказов, который мы можем обновлять
const localOrders = ref<Order[]>([])

// Инициализируем локальные заказы при изменении props
watch(
  () => props.orders,
  (newOrders) => {
    localOrders.value = [...(newOrders || [])]
  },
  { immediate: true },
)
const emit = defineEmits<{
  (e: 'update:orders'): void
  (e: 'open-order', payload: { order: Order }): void
  (e: 'add-order', stage: string): void
  (e: 'updated'): void
  (e: 'order-updated', orderId: string): void
  (e: 'change-status', payload: StatusChangePayload): void
}>()

// Система событий
const { emitOrderStageChanged } = useOrderEvents()

function handleOrderCardClick(order: Order) {
  emit('open-order', { order })
}

const draggingOrder = ref<Order | null>(null)
const dragOverStage = ref<string | null>(null)
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimeout: number | null = null
let pollingInterval: number | null = null

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = window.setTimeout(() => {
    toastMsg.value = ''
  }, 2200)
}

function ordersByStage(stage: string) {
  if (!Array.isArray(localOrders.value)) {
    return []
  }

  const filtered = localOrders.value.filter((order) => {
    const orderStage = getStageName(order.stage)
    return orderStage === stage
  })

  return filtered
}
function getStatusColor(key: string) {
  const stageData = stages.value.find((s) => s.value === key)
  if (stageData && stageData.color) {
    return stageData.color // ✅ Возвращаем цвет из stage
  }
  // Если API еще не загрузился, используем fallback цвет
  return '#6366f1'
}

function getStatusColorStyle(key: string) {
  const stageData = stages.value.find((s) => s.value === key)
  if (stageData && stageData.color) {
    return getStageColorStyles(key, stageData.color)
  }
  return {}
}
function onDragStart(order: Order) {
  draggingOrder.value = order
}
function onDragEnd() {
  draggingOrder.value = null
}
function onDragEnter(stage: string) {
  dragOverStage.value = stage
}
function onDragLeave(stage: string) {
  if (dragOverStage.value === stage) dragOverStage.value = null
}
async function onDrop(event: DragEvent, newStage: string) {
  event.preventDefault()
  dragOverStage.value = null

  const order = draggingOrder.value
  draggingOrder.value = null
  if (!order) {
    return
  }

  // Сохраняем исходную стадию для возможного отката
  const originalStage = getStageName(order.stage)

  try {
    // Подготавливаем дополнительные данные для отмененных заказов
    let additionalData = {}
    if (newStage === 'cancelled') {
      additionalData = {
        reason: 'Отменено через kanban',
        reason_status: 'refused',
      }
    }

    // Немедленно обновляем локальное состояние для мгновенного отображения
    const orderIndex = localOrders.value.findIndex((o) => o.id === order.id)
    if (orderIndex !== -1) {
      // Создаем копию заказа с новой стадией
      const updatedOrder = { ...localOrders.value[orderIndex] }
      updatedOrder.stage = newStage

      // Обновляем локальный массив заказов
      localOrders.value[orderIndex] = updatedOrder
      localOrders.value = [...localOrders.value]
    }

    // Передаем стадию и дополнительные данные на сервер
    await OrderController().updateStage(order.id, newStage, additionalData)

    // Получаем display_name стадии
    const stageData = stages.value.find((s) => s.value === newStage)
    const stageDisplayName = stageData?.label || newStage
    showToast('Стадия обновлена: ' + stageDisplayName, 'success')

    // Отправляем глобальное событие о смене стадии
    emitOrderStageChanged(
      order.id,
      originalStage,
      newStage,
      'kanban',
      stageDisplayName
    )

    // Эмитим событие change-status для OrdersView
    emit('change-status', { order, newStatus: newStage })
  } catch (err: any) {
    const msg = (err as Error)?.message || 'Ошибка смены стадии'

    // При ошибке откатываем заказ к исходной стадии
    const orderIndex = localOrders.value.findIndex((o) => o.id === order.id)
    if (orderIndex !== -1) {
      const revertedOrder = { ...localOrders.value[orderIndex] }
      revertedOrder.stage = originalStage

      // Возвращаем заказ в исходную стадию
      localOrders.value[orderIndex] = revertedOrder
      localOrders.value = [...localOrders.value]
    }

    // Показываем ошибку
    showToast(msg, 'error')
  }
}
</script>

<style scoped>
.bitrix-board-new {
  background: transparent;
  min-height: 90vh;
  border-radius: 0;
  box-shadow: none;
  gap: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-wrap: nowrap;
  min-width: 100vw;
}
.bitrix-column {
  background: linear-gradient(135deg, #f7eafd 0%, #f5f3ff 100%);
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  transition:
    box-shadow 0.12s,
    transform 0.12s;
  position: relative;
  min-width: 140px;
  max-width: 280px;
}
.bitrix-column.first-col {
  border-radius: 10px 0 0 0;
}
.bitrix-column.last-col {
  border-radius: 0 10px 0 0;
}
.bitrix-card-wrapper {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.bitrix-top-bar {
  height: 5px;
  border-radius: 10px 10px 0 0;
  width: 100%;
  margin-bottom: -5px;
}
.bitrix-column--dragover {
  box-shadow:
    0 0 0 2px #6366f1aa,
    0 2px 8px #0002;
  transform: scale(1.01);
  z-index: 2;
}
.bitrix-header {
  border-radius: 0;
  color: #fff;
  font-size: 1em;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: #6366f1;
  min-height: 38px;
  box-shadow: none;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.first-col-header {
  border-radius: 10px 0 0 0;
}
.last-col-header {
  border-radius: 0 10px 0 0;
}
.bitrix-header-title {
  font-weight: 600;
  font-size: 1em;
  text-shadow: none;
}
.bitrix-counter-badge {
  background: #fff;
  border: 1.5px solid;
  border-radius: 8px;
  font-size: 0.92em;
  font-weight: 700;
  min-width: 22px;
  text-align: center;
  padding: 0 6px;
  margin-left: 8px;
  box-shadow: 0 1px 3px #0001;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 22px;
  position: static;
}
.bitrix-add-btn {
  margin: 8px 8px 4px 8px;
  padding: 4px 12px;
  border: 1.5px dashed #bdbdbd;
  border-radius: 8px;
  background: #fafdff;
  color: #6366f1;
  font-weight: 600;
  font-size: 0.97em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    background 0.13s,
    border 0.13s;
}
.bitrix-add-btn:hover {
  background: #f0f4ff;
  border-color: #6366f1;
}
.plus-icon {
  font-size: 1.2em;
  font-weight: 700;
  margin-right: 2px;
}
.bitrix-cards {
  display: block;
  max-height: calc(90vh - 60px);
  min-height: 40px;
  overflow-y: auto;
  transition: background 0.12s;
  background: transparent;
}
.bitrix-card-wrapper {
  transition:
    box-shadow 0.18s,
    transform 0.18s,
    background 0.18s;
}
.bitrix-card-wrapper.dragging {
  opacity: 0.7;
  transform: scale(1.04) rotate(-1deg);
  box-shadow:
    0 8px 32px #6366f155,
    0 2px 8px #0002;
  z-index: 10;
}
.bitrix-cards--dragover {
  background: #e0e7ff44 !important;
  border-radius: 8px;
  box-shadow: 0 0 0 2px #a5b4fc55;
  transition:
    background 0.18s,
    box-shadow 0.18s;
}
.bitrix-card-wrapper {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px #0001;
  margin-bottom: 3px;
  transition:
    box-shadow 0.1s,
    transform 0.1s;
  will-change: box-shadow, transform;
  padding: 0;
  min-height: 38px;
  display: flex;
  align-items: stretch;
}
.bitrix-card-wrapper:hover {
  box-shadow: 0 2px 8px #0002;
  transform: translateY(-1px) scale(1.01);
}
.bitrix-card-inner {
  padding: 6px 8px 5px 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 0.97em;
}
.bitrix-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
.bitrix-add-btn {
  position: sticky;
  top: 38px;
  z-index: 2;
}
@media (max-width: 900px) {
  .bitrix-board-new {
    overflow-x: auto;
    flex-wrap: nowrap !important;
    min-width: 0;
  }
  .bitrix-column {
    min-width: 260px;
    max-width: 340px;
    flex: 0 0 80vw;
  }
  .bitrix-card-wrapper {
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }
}
</style>
