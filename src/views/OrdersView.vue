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
          {{ t('table.table') }}
        </button>
        <button
          class="px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition"
          :class="{ 'opacity-70': isTableView }"
          @click="isTableView = false"
        >
          {{ t('table.kanban') }}
        </button>
        <select
          v-model="selectedAssignmentStatus"
          @change="() => loadOrders()"
          class="w-48 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          style="margin-left: 1rem"
        >
          <option value="">{{ t('table.allAssignments') }}</option>
          <option value="pending">{{ t('status.pending') }}</option>
          <option value="in_progress">{{ t('status.in_progress') }}</option>
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
        :show-delete-button="canDeletePermission()"
        :stages="kanbanStatuses.map((s, idx) => ({ id: idx, name: s.key, display_name: s.label }))"
        @clear="kanbanSelectedIds = []"
        @update-status="handleKanbanBulkStatusUpdate"
        @delete="handleKanbanBulkDelete"
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
import { ref, watch, onMounted, onActivated, onUnmounted, nextTick, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const toast = useToast()
import { OrderController } from '../controllers/OrderController'
import Layout from '../components/layout/Layout.vue'
import ReadOnlyMessage from '../components/ui/ReadOnlyMessage.vue'
import { canCreateEdit, canViewAllUsers, canViewAllOrders, isStaff, canDelete } from '../utils/permissions'
import { getAllStages, apiRequest } from '../services/api'
import { useToast } from '../stores/toast'
import { useOrderEvents } from '../composables/useOrderEvents'
import { useEntityEvents } from '../composables/useEntityEvents'
import { useComponentOptimization } from '../composables/useComponentOptimization'
import { useOrderModal } from '../stores/orderModal'
import BulkActionPanel from '../components/ui/BulkActionPanel.vue'
import { invalidateCache } from '../utils/cacheUtils'

// Ленивая загрузка тяжелых компонентов
const OrderList = defineAsyncComponent({
  loader: () => import('../components/orders/OrderList/OrderList.vue'),
  loadingComponent: () => import('../components/ui/LoadingSpinner.vue').catch(() => null),
  delay: 200,
  timeout: 5000,
  onError(error, retry, fail, attempts) {
    const message = error instanceof Error ? error.message : String(error)
    const isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError')

    if (isChunkError && attempts <= 3) {
      setTimeout(() => retry(), 500)
      return
    }

    toast.error('Не удалось загрузить таблицу заказов. Обновите страницу.')
    fail()
  }
})

const OrderKanban = defineAsyncComponent({
  loader: () => import('../components/orders/OrderKanban/OrderKanban.vue'),
  loadingComponent: () => import('../components/ui/LoadingSpinner.vue').catch(() => null),
  delay: 200,
  timeout: 5000,
  onError(error, retry, fail, attempts) {
    const message = error instanceof Error ? error.message : String(error)
    const isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError')

    if (isChunkError && attempts <= 3) {
      setTimeout(() => retry(), 500)
      return
    }

    toast.error('Не удалось загрузить Kanban. Попробуйте обновить страницу.')
    fail()
  }
})

const OrderFormModal = defineAsyncComponent({
  loader: () => import('../components/orders/OrderList/OrderFormModal.vue'),
  delay: 100
})

const orderModal = useOrderModal()
const route = useRoute()
const router = useRouter()
const search = ref(
  Array.isArray(route.query.search) ? route.query.search[0] || '' : route.query.search || '',
)
const isTableView = ref(true)
const showCreateModal = ref(false)
const selectedAssignmentStatus = ref('')
const currentPage = ref(1)
const selectedStage = ref<string | null>(null)
const isArchived = ref<boolean>(false)
const detailsOrderId = computed(() => orderModal.orderId.value)

// Оптимизация компонентов
const { isVisible, isLoaded } = useComponentOptimization()

const { orders, fetchOrders, fetchAllOrdersForKanban } = OrderController()

// Система событий для синхронизации
const { onOrderStageChanged, onOrderUpdated } = useOrderEvents()
const { onAnyEntityCreated, onAnyEntityUpdated, onAnyEntityDeleted } = useEntityEvents()

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
      const totalRequested = result.total_requested || kanbanSelectedIds.value.length
      if (result.updated === totalRequested) {
        toast.success(`Успешно обновлено заказов: ${result.updated}`)
      } else {
        toast.show(`Обновлено заказов: ${result.updated} из ${totalRequested}`, 'error')
      }
    } else if (result.errors && result.errors.length > 0) {
      // No orders were updated, but we have errors
      const totalRequested = result.total_requested || kanbanSelectedIds.value.length
      toast.error(`Не удалось обновить ни одного заказа из ${totalRequested}. Проверьте назначения.`)
    }

    // Показываем ошибки если есть (но не все сразу, чтобы не спамить)
    if (result.errors && result.errors.length > 0) {
      setTimeout(() => {
        if (result.errors!.length <= 3) {
          // Показываем каждую ошибку если их немного
          result.errors!.forEach(error => {
            toast.error(error)
          })
        } else {
          // Если ошибок много, показываем только первые 2 и общее количество
          result.errors!.slice(0, 2).forEach(error => {
            toast.error(error)
          })
          toast.error(`... и еще ${result.errors!.length - 2} ошибок. Проверьте назначения заказов.`)
        }
      }, 1000)
    }

    return result
  } catch (error: any) {
    console.error('Bulk status update error:', error)
    
    // Parse the error message to extract order IDs and provide better feedback
    let errorMessage = error.message || 'Ошибка при обновлении статуса заказов'
    
    // If it's a validation error with multiple orders, show a summary
    if (errorMessage.includes('нельзя завершить, пока есть неодобренные назначения')) {
      const orderIds = errorMessage.match(/Заказ ID (\d+)/g) || []
      const totalOrders = orderIds.length
      const selectedCount = kanbanSelectedIds.value.length
      
      if (totalOrders === selectedCount) {
        // All selected orders have the same issue
        toast.error(`Все выбранные заказы (${totalOrders}) нельзя завершить - есть неодобренные назначения. Сначала одобрите все назначения.`)
      } else {
        // Some orders succeeded, some failed
        toast.error(`${totalOrders} из ${selectedCount} заказов нельзя завершить - есть неодобренные назначения.`)
      }
    } else {
      // Generic error message
      toast.error(errorMessage)
    }

    return { updated: 0, errors: [error.message] }
  } finally {
    kanbanIsProcessing.value = false
  }
}

// Функция для массового удаления заказов в канбане
async function bulkDeleteKanban(): Promise<{ deleted: number; errors?: string[] }> {
  if (kanbanSelectedIds.value.length === 0) {
    return { deleted: 0 }
  }

  kanbanIsProcessing.value = true

  try {
    const response = await apiRequest('/bulk-delete/orders', {
      method: 'POST',
      body: JSON.stringify({
        ids: kanbanSelectedIds.value
      })
    })

    const result = response as {
      message: string
      deleted: number
      skipped: number
      errors?: string[]
    }

    // Показываем результат
    if (result.deleted > 0) {
      if (result.skipped > 0) {
        toast.show(`Успешно удалено: ${result.deleted}. Пропущено: ${result.skipped}`, 'error')
      } else {
        toast.success(`Успешно удалено: ${result.deleted}`)
      }

      // Инвалидируем кэш заказов и отмечаем время изменения
      invalidateCache.orders()
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderChange', Date.now().toString())
      }
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
    console.error('Bulk delete error:', error)
    
    toast.error(error.message || 'Ошибка при удалении заказов')

    return { deleted: 0, errors: [error.message] }
  } finally {
    kanbanIsProcessing.value = false
  }
}

const loadOrders = async (hard = false) => {
  try {
    if (!isTableView.value) {
      // Для Kanban используем fetchAllOrdersForKanban
      await fetchAllOrdersForKanban(
        1, // всегда первая страница для получения всех данных
        'id',
        'desc',
        undefined, // НЕ передаем фильтр по стадии для получения ВСЕХ заказов
        false, // только активные заказы
        hard,
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
        hard, // force_refresh при необходимости
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

watch(() => orderModal.updateTick.value, () => {
  orderListRef.value?.loadOrders()
  if (!isTableView.value) {
    fetchAllOrdersForKanban()
  }
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

// Очищаем обработчики при размонтировании компонента
let visibilityChangeHandler: (() => void) | null = null

onUnmounted(() => {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
  }
})

onMounted(async () => {
  await loadStages()
  
  // Проверяем, были ли недавние изменения заказов (удаление, создание, обновление)
  // Если были изменения в последние 5 минут, принудительно обновляем данные
  const lastOrderChange = localStorage.getItem('lastOrderChange')
  const shouldForceRefresh = lastOrderChange && (Date.now() - parseInt(lastOrderChange)) < 300000 // 5 минут
  
  loadOrders(shouldForceRefresh)
  
  // Отслеживаем возврат на вкладку и принудительно обновляем данные, если были изменения
  visibilityChangeHandler = () => {
    if (!document.hidden) {
      const lastChange = localStorage.getItem('lastOrderChange')
      if (lastChange && (Date.now() - parseInt(lastChange)) < 300000) {
        // Если были изменения в последние 5 минут, обновляем данные
        loadOrders(true)
      }
    }
  }
  document.addEventListener('visibilitychange', visibilityChangeHandler)
  
  // Подписываемся на глобальные события смены стадий
  onOrderStageChanged((event) => {
    // Обновляем данные во всех компонентах
    loadOrders()
    if (!isTableView.value) {
      fetchAllOrdersForKanban()
    }
  })
  
  onOrderUpdated((event) => {
    // Обновляем данные во всех компонентах
    loadOrders()
    if (!isTableView.value) {
      fetchAllOrdersForKanban()
    }
  })
  
  // Слушаем события создания сущностей
  onAnyEntityCreated((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      if (!isTableView.value) {
        fetchAllOrdersForKanban()
      }
    }
  })
  
  // Слушаем события обновления сущностей
  onAnyEntityUpdated((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      if (!isTableView.value) {
        fetchAllOrdersForKanban()
      }
    }
  })
  
  // Слушаем события удаления сущностей
  onAnyEntityDeleted((event) => {
    if (event.entityType === 'order') {
      loadOrders()
      if (!isTableView.value) {
        fetchAllOrdersForKanban()
      }
    }
  })
  
  // Проверяем, есть ли ID заказа в localStorage для автоматического открытия модалки
  const orderParam = route.query.order
  if (orderParam && typeof orderParam === 'string') {
    const orderId = parseInt(orderParam)
    if (!isNaN(orderId)) {
      orderModal.open(orderId)
    }
  }
  
})

// Хук для отслеживания возврата на страницу через навигацию Vue Router
onActivated(() => {
  // Проверяем, были ли изменения заказов при возврате на страницу
  const lastOrderChange = localStorage.getItem('lastOrderChange')
  if (lastOrderChange && (Date.now() - parseInt(lastOrderChange)) < 300000) {
    // Если были изменения в последние 5 минут, принудительно обновляем данные
    loadOrders(true)
  }
})

async function openOrderDetails(payload: any) {
  const rawId = payload?.order?.id ?? payload?.id ?? payload
  const numericId = Number(rawId)

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return
  }

  if (detailsOrderId.value === numericId) {
    orderModal.close()
    await nextTick()
  }

  if (payload?.highlightAssignments) {
    sessionStorage.setItem('highlightAssignments', 'true')
    sessionStorage.setItem('assignmentMessage', payload.message || '')
  }

  orderModal.open(numericId, { errorMsg: payload?.errorMsg })

  router.replace({
    query: {
      ...route.query,
      order: numericId.toString(),
    },
  }).catch(() => {
    // игнорируем ошибки навигации (например, дубликаты)
  })
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

async function handleKanbanBulkDelete() {
  if (kanbanSelectedIds.value.length === 0) return
  
  const result = await bulkDeleteKanban()
  if (result.deleted > 0) {
    // Очищаем выбранные элементы
    kanbanSelectedIds.value = []
    // Обновляем данные
    loadOrders(true)
  }
}

function closeCreateOrderModal() {
  showCreateModal.value = false
}

async function handleOrderCreated(newOrder: any) {
  showCreateModal.value = false
  await loadOrders(true)
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

// Create local reference for template access
const canDeletePermission = canDelete
</script>
