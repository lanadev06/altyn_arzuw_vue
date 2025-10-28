<template>
  <Layout>
    <div class="flex flex-col gap-4">
      <ReadOnlyMessage
        v-if="!canCreateEdit()"
        :message="isStaff() ? 'Вы можете просматривать назначенные вам заказы' : 'Вы можете только просматривать заказы. Создание и редактирование доступно только администраторам и менеджерам.'"
      />
      <div class="flex items-center gap-3 mb-2">
        <button
          class="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          :class="{ 'opacity-70': !isTableView }"
          @click="isTableView = true"
        >
          Таблица
        </button>
        <button
          class="px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition"
          :class="{ 'opacity-70': isTableView }"
          @click="isTableView = false"
        >
          Канбан
        </button>
        <select
          v-model="selectedAssignmentStatus"
          @change="loadOrders"
          class="w-48 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          style="margin-left: 1rem"
        >
          <option value="">Все назначения</option>
          <option value="pending">Ожидание</option>
          <option value="in_progress">В работе</option>
        </select>
      </div>
      <OrderList v-if="isTableView" ref="orderListRef" :search="search" data-order-list />
      <OrderKanban
        v-else
        :statuses="kanbanStatuses"
        @change-status="handleChangeStatus"
        @open-order="openOrderDetails"
        @add-order="openCreateOrderModal"
        :orders="filteredKanbanOrders"
        @updated="handleOrderUpdatedFromModal"
        :enable-selection="true"
        :selected-ids="kanbanSelectedIds"
        @toggle-selection="handleKanbanToggleSelection"
        @select-all-in-stage="handleSelectAllInStage"
        @deselect-all-in-stage="handleDeselectAllInStage"
      />
      <!-- Bulk Action Panel для канбана -->
      <BulkActionPanel
        v-if="!isTableView && kanbanSelectedIds.length > 0"
        :show="kanbanSelectedIds.length > 0"
        :count="kanbanSelectedIds.length"
        :is-processing="kanbanIsProcessing"
        :show-status-selector="true"
        :stages="kanbanStatuses.map((s, idx) => ({ id: idx, name: s.key, display_name: s.label }))"
        @clear="kanbanSelectedIds = []"
        @update-status="handleKanbanBulkStatusUpdate"
      />

      <OrderDetailsModal
        v-if="detailsOrderId"
        :order-id="detailsOrderId"
        :error-msg="detailsErrorMsg"
        @close="closeOrderDetails"
        @updated="handleOrderUpdatedFromModal"
      />
      <OrderFormModal
        v-if="showCreateModal"
        @close="closeCreateOrderModal"
        @submit="handleOrderCreated"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { OrderController } from '../controllers/OrderController'
import Layout from '../components/layout/Layout.vue'
import ReadOnlyMessage from '../components/ui/ReadOnlyMessage.vue'
import { canCreateEdit, canViewAllUsers, canViewAllOrders, isStaff } from '../utils/permissions'
import { getAllStages, apiRequest } from '../services/api'
import { useToast } from '../stores/toast'
import { useOrderEvents } from '../composables/useOrderEvents'
import { useEntityEvents } from '../composables/useEntityEvents'
import { useComponentOptimization } from '../composables/useComponentOptimization'
import BulkActionPanel from '../components/ui/BulkActionPanel.vue'

// Ленивая загрузка тяжелых компонентов
const OrderList = defineAsyncComponent({
  loader: () => import('../components/orders/OrderList/OrderList.vue'),
  loadingComponent: () => import('../components/ui/LoadingSpinner.vue').catch(() => null),
  delay: 200,
  timeout: 5000
})

const OrderKanban = defineAsyncComponent({
  loader: () => import('../components/orders/OrderKanban/OrderKanban.vue'),
  loadingComponent: () => import('../components/ui/LoadingSpinner.vue').catch(() => null),
  delay: 200,
  timeout: 5000
})

const OrderDetailsModal = defineAsyncComponent({
  loader: () => import('../components/orders/OrderList/OrderDetailsModal.vue'),
  delay: 100
})

const OrderFormModal = defineAsyncComponent({
  loader: () => import('../components/orders/OrderList/OrderFormModal.vue'),
  delay: 100
})

const route = useRoute()
const search = ref(
  Array.isArray(route.query.search) ? route.query.search[0] || '' : route.query.search || '',
)
const isTableView = ref(true)
const detailsOrderId = ref(null)
const detailsErrorMsg = ref('')
const showCreateModal = ref(false)
const selectedAssignmentStatus = ref('')
const currentPage = ref(1)
const selectedStage = ref<string | null>(null)
const isArchived = ref<boolean>(false)

// Оптимизация компонентов
const { isVisible, isLoaded } = useComponentOptimization()

const { orders, fetchOrders, fetchAllOrdersForKanban } = OrderController()

// Система событий для синхронизации
const { onOrderStageChanged, onOrderUpdated } = useOrderEvents()
const { onAnyEntityCreated, onAnyEntityUpdated, onAnyEntityDeleted } = useEntityEvents()

// Watch для автоматического открытия модалки при изменении detailsOrderId
watch(detailsOrderId, (newOrderId) => {
  if (newOrderId) {
    // Модалка автоматически откроется, так как она привязана к detailsOrderId
  }
})

// Фильтрация заказов для канбана по поисковому запросу
const filteredKanbanOrders = computed(() => {
  const result = !search.value
    ? orders.value || []
    : (orders.value || []).filter((order) => {
        const q = String(search.value).toLowerCase()
        return (
          String(order.id).includes(q) ||
          (order.product?.name && String(order.product.name).toLowerCase().includes(q)) ||
          (order.client?.name && String(order.client.name).toLowerCase().includes(q)) ||
          (typeof (order.stage as any)?.name === 'string' &&
            String((order.stage as any).name)
              .toLowerCase()
              .includes(q))
        )
      })

  return result
})

const kanbanStatuses = ref([])
const kanbanSelectedIds = ref<number[]>([])
const kanbanIsProcessing = ref(false)

const orderListRef = ref()

// Функция для массового обновления статуса в канбане
async function bulkUpdateKanbanStatus(stage: string): Promise<{ updated: number; errors?: string[] }> {
  if (kanbanSelectedIds.value.length === 0) {
    return { updated: 0 }
  }

  kanbanIsProcessing.value = true

  try {
    const toast = useToast()

    const payload: Record<string, any> = {
      ids: kanbanSelectedIds.value,
      stage
    }

    const response = await apiRequest('/orders/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    const result = response as {
      message: string
      updated: number
      total_requested: number
      errors?: string[]
    }

    // Показываем результат
    if (result.updated > 0) {
      toast.success(`Обновлено заказов: ${result.updated}`)
    }

    // Показываем ошибки если есть
    if (result.errors && result.errors.length > 0) {
      setTimeout(() => {
        result.errors?.forEach(error => {
          toast.error(error)
        })
      }, 1000)
    }

    return result
  } catch (error: any) {
    console.error('Bulk status update error:', error)

    return { updated: 0, errors: [error.message] }
  } finally {
    kanbanIsProcessing.value = false
  }
}

const loadOrders = async () => {
  try {
    if (!isTableView.value) {
      // Для Kanban используем fetchAllOrdersForKanban
      await fetchAllOrdersForKanban(
        1, // всегда первая страница для получения всех данных
        'id',
        'desc',
        undefined, // НЕ передаем фильтр по стадии для получения ВСЕХ заказов
        false, // только активные заказы
      )
    } else {
      // Для таблицы используем обычную пагинацию и передаём search
      await fetchOrders(
        currentPage.value,
        search.value,
        'id',
        'desc',
        selectedStage.value || undefined,
        isArchived.value,
        30,
        undefined,
        canViewAllOrders(), // Передаем admin_view только для админов и менеджеров
      )
    }
  } catch (error) {
    orders.value = []
  }
}

watch(
  () => route.query.search,
  (val) => {
    search.value = Array.isArray(val) ? val[0] || '' : val || ''
    loadOrders()
  },
)

watch(isTableView, (newValue) => {
  // Очищаем выбранные элементы при переключении вида
  if (newValue) {
    kanbanSelectedIds.value = []
  }
  loadOrders()
})

async function loadStages() {
  try {
    const stagesData = await getAllStages()

    let allStages = []
    if (Array.isArray(stagesData)) {
      allStages = stagesData
    } else if (stagesData && stagesData.data && Array.isArray(stagesData.data)) {
      allStages = stagesData.data
    } else {
      return
    }

    // Показываем все стадии для всех пользователей
    kanbanStatuses.value = allStages.map((stage: any) => ({
      key: stage.name,
      label: stage.display_name || stage.name,
    }))
  } catch (error) {
  }
}

// Обработчик для событий от NotificationBell
const handleOpenOrderDetailsEvent = async (event: any) => {
  const { orderId } = event.detail
  if (orderId) {
    try {
      // Проверяем существование заказа перед открытием модалки
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        detailsOrderId.value = orderId
        detailsErrorMsg.value = ''
      } else if (response.status === 404) {
        // Заказ был удален - показываем toast
        const { useToast } = await import('../stores/toast')
        const toast = useToast()
        toast.error('Заказ #' + orderId + ' был удалён')
        detailsErrorMsg.value = ''
      } else {
        // Другие ошибки
        const { useToast } = await import('../stores/toast')
        const toast = useToast()
        toast.error('Ошибка при загрузке заказа')
        detailsErrorMsg.value = ''
      }
    } catch (error) {
      const { useToast } = await import('../stores/toast')
      const toast = useToast()
      toast.error('Ошибка при загрузке заказа')
      detailsErrorMsg.value = ''
    }
  }
}

// Очищаем обработчик при размонтировании компонента
onUnmounted(() => {
  document.removeEventListener('openOrderDetails', handleOpenOrderDetailsEvent as EventListener)
})

onMounted(async () => {
  await loadStages()
  loadOrders()
  
  // Добавляем обработчик для событий от NotificationBell
  document.addEventListener('openOrderDetails', handleOpenOrderDetailsEvent)
  
  // Подписываемся на глобальные события смены стадий
  onOrderStageChanged((event) => {
    // Обновляем данные во всех компонентах
    loadOrders()
    fetchAllOrdersForKanban()
  })
  
  onOrderUpdated((event) => {
    // Обновляем данные во всех компонентах
    loadOrders()
    fetchAllOrdersForKanban()
  })
  
  // Слушаем события создания сущностей
  onAnyEntityCreated((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      fetchAllOrdersForKanban()
    }
  })
  
  // Слушаем события обновления сущностей
  onAnyEntityUpdated((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      fetchAllOrdersForKanban()
    }
  })
  
  // Слушаем события удаления сущностей
  onAnyEntityDeleted((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      fetchAllOrdersForKanban()
    }
  })
  
  // Проверяем, есть ли ID заказа в localStorage для автоматического открытия модалки
  const orderIdToOpen = localStorage.getItem('openOrderModal')
  if (orderIdToOpen) {
    // Удаляем из localStorage
    localStorage.removeItem('openOrderModal')
    
    // Открываем модалку с деталями заказа
    detailsOrderId.value = parseInt(orderIdToOpen)
    detailsErrorMsg.value = ''
  }
  
  // Проверяем, есть ли параметр order в URL для автоматического открытия модального окна
  const orderParam = route.query.order
  if (orderParam && typeof orderParam === 'string') {
    const orderId = parseInt(orderParam)
    if (!isNaN(orderId)) {
      detailsOrderId.value = orderId
      detailsErrorMsg.value = ''
    }
  }
  
})

async function openOrderDetails(payload: any) {
  if (payload && payload.order) {
    // Если открываем тот же заказ, сначала закрываем модалку
    if (detailsOrderId.value === payload.order.id) {
      detailsOrderId.value = null
      detailsErrorMsg.value = ''
      await nextTick()
    }

    // Сохраняем информацию о подсветке назначений
    if (payload.highlightAssignments) {
      sessionStorage.setItem('highlightAssignments', 'true')
      sessionStorage.setItem('assignmentMessage', payload.message || '')
    }

    // Открываем модалку
    detailsOrderId.value = payload.order.id
    detailsErrorMsg.value = payload.errorMsg || ''
  } else if (payload && payload.id) {
    detailsOrderId.value = payload.id
    detailsErrorMsg.value = ''
  } else {
    detailsOrderId.value = payload
    detailsErrorMsg.value = ''
  }
}
function closeOrderDetails() {
  detailsOrderId.value = null
  detailsErrorMsg.value = ''
}
function handleOrderUpdatedFromModal() {
  orderListRef.value?.loadOrders()
}

function openCreateOrderModal(stage: string) {
  showCreateModal.value = true
}

// Обработчики для канбана
function handleKanbanToggleSelection(orderId: number, selected: boolean) {
  if (selected) {
    kanbanSelectedIds.value.push(orderId)
  } else {
    kanbanSelectedIds.value = kanbanSelectedIds.value.filter(id => id !== orderId)
  }
}

function handleSelectAllInStage(stage: string) {
  // Получаем все заказы в этой стадии
  const ordersInStage = filteredKanbanOrders.value.filter(order => {
    const orderStage = typeof order.stage === 'string' ? order.stage : (order.stage as any)?.name || ''
    return orderStage === stage
  })
  
  // Добавляем ID всех заказов, которые еще не выбраны
  ordersInStage.forEach(order => {
    if (!kanbanSelectedIds.value.includes(order.id)) {
      kanbanSelectedIds.value.push(order.id)
    }
  })
}

function handleDeselectAllInStage(stage: string) {
  // Получаем все заказы в этой стадии
  const ordersInStage = filteredKanbanOrders.value.filter(order => {
    const orderStage = typeof order.stage === 'string' ? order.stage : (order.stage as any)?.name || ''
    return orderStage === stage
  })
  
  // Удаляем ID всех заказов в этой стадии из выбранных
  const ordersToDeselect = ordersInStage.map(order => order.id)
  kanbanSelectedIds.value = kanbanSelectedIds.value.filter(id => !ordersToDeselect.includes(id))
}

async function handleKanbanBulkStatusUpdate(stage: string) {
  if (kanbanSelectedIds.value.length === 0) return
  
  const result = await bulkUpdateKanbanStatus(stage)
  if (result.updated > 0) {
    // Очищаем выбранные элементы
    kanbanSelectedIds.value = []
    // Обновляем данные
    loadOrders()
  }
}

function closeCreateOrderModal() {
  showCreateModal.value = false
}

async function handleOrderCreated(newOrder: any) {
  showCreateModal.value = false
  await loadOrders()
}

async function handleChangeStatus({ order, newStatus }: { order: any; newStatus: any }) {
  try {
    if (!order || !order.id) {
      throw new Error('Некорректные данные заказа')
    }

    const validStatuses = [
      'draft',
      'design',
      'print',
      'engraving',
      'workshop',
      'final',
      'completed',
      'cancelled',
    ]

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Недопустимый статус: ${newStatus}`)
    }

    // Обновляем заказы для Kanban
    await fetchAllOrdersForKanban()

    // Обновляем заказы для таблицы
    orderListRef.value?.loadOrders()
  } catch (error: any) {
    let errorMessage = 'Ошибка обновления стадии'
    if (error.message && error.message.includes('422')) {
      try {
        const jsonMatch = error.message.match(/\{.*\}/)
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0])
          errorMessage = errorData.message || 'Ошибка валидации на сервере'
        }
      } catch (parseError) {
        errorMessage = error.message
      }
    } else {
      errorMessage = error.message
    }
    alert(`Ошибка обновления стадии: ${errorMessage}`)
  }
}
</script>
