<template>
  <Layout>
    <div class="flex flex-col gap-4">
      <ReadOnlyMessage
        v-if="!canCreateEdit()"
        message="Вы можете только просматривать заказы. Создание и редактирование доступно только администраторам и менеджерам."
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
      <OrderList v-if="isTableView" ref="orderListRef" />
      <OrderKanban
        v-else
        :statuses="kanbanStatuses"
        @change-status="handleChangeStatus"
        @open-order="openOrderDetails"
        @add-order="openCreateOrderModal"
        :orders="filteredKanbanOrders"
        @updated="handleOrderUpdatedFromModal"
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
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { OrderController } from '../controllers/OrderController'
import Layout from '../components/layout/Layout.vue'
import OrderList from '../components/orders/OrderList/OrderList.vue'
import OrderKanban from '../components/orders/OrderKanban/OrderKanban.vue'
import OrderDetailsModal from '../components/orders/OrderList/OrderDetailsModal.vue'
import OrderFormModal from '../components/orders/OrderList/OrderFormModal.vue'
import ReadOnlyMessage from '../components/ui/ReadOnlyMessage.vue'
import { canCreateEdit, canViewAllUsers } from '../utils/permissions'
import { getAllStages } from '../services/api'

const route = useRoute()
const search = ref(route.query.search || '')
const isTableView = ref(true)
const detailsOrderId = ref(null)
const detailsErrorMsg = ref('')
const showCreateModal = ref(false)
const selectedAssignmentStatus = ref('')

const { orders, fetchOrders } = OrderController()

// Фильтрация заказов для канбана по поисковому запросу
const filteredKanbanOrders = computed(() => {
  if (!search.value) {
    return orders.value || []
  }

  const q = String(search.value).toLowerCase()
  const filtered = (orders.value || []).filter((order) => {
    return (
      String(order.id).includes(q) ||
      (order.product?.name && String(order.product.name).toLowerCase().includes(q)) ||
      (order.client?.name && String(order.client.name).toLowerCase().includes(q)) ||
      (typeof (order.stage?.name || order.stage) === 'string' &&
        (order.stage?.name || order.stage).toLowerCase().includes(q))
    )
  })

  return filtered
})

const kanbanStatuses = ref([])

const orderListRef = ref()

const loadOrders = async () => {
  try {
    if (!isTableView.value) {
      // Для Kanban используем fetchAllOrdersForKanban
      const { fetchAllOrdersForKanban } = OrderController()
      await fetchAllOrdersForKanban(selectedAssignmentStatus.value || undefined)
    } else {
      // Для таблицы используем обычную пагинацию и передаём search
      await fetchOrders(1, 'id', 'asc', undefined, undefined, String(search.value))
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки заказов:', error)
    orders.value = []
  }
}

watch(
  () => route.query.search,
  (val) => {
    search.value = val || ''
    loadOrders()
  },
)

watch(isTableView, (newValue) => {
  loadOrders()
})

async function loadStages() {
  try {
    console.log('🔄 Loading stages for OrdersView...')
    const stagesData = await getAllStages()
    console.log('📊 Stages data received:', stagesData)

    let allStages = []
    if (Array.isArray(stagesData)) {
      allStages = stagesData
      console.log('✅ Loaded stages directly:', stagesData.length)
    } else if (stagesData && stagesData.data && Array.isArray(stagesData.data)) {
      allStages = stagesData.data
      console.log('✅ Loaded stages from data property:', stagesData.data.length)
    } else {
      console.warn('⚠️ Unexpected stages data format:', stagesData)
      return
    }

    // Фильтруем стадии в зависимости от роли пользователя
    const isAdminOrManager = canViewAllUsers()
    console.log('🔍 User role check - isAdminOrManager:', isAdminOrManager)

    if (isAdminOrManager) {
      // Для администраторов и менеджеров показываем все стадии
      kanbanStatuses.value = allStages.map((stage) => ({
        key: stage.name,
        label: stage.display_name || stage.name,
      }))
      // Для всех остальных пользователей (с динамическими ролями) исключаем стадии "Отменено" и "Завершено"
      const filteredStages = allStages.filter((stage) => {
        const stageName = stage.name.toLowerCase()
        const isExcluded = stageName === 'cancelled' || stageName === 'completed'
        return !isExcluded
      })

      kanbanStatuses.value = filteredStages.map((stage) => ({
        key: stage.name,
        label: stage.display_name || stage.name,
      }))
    }
  } catch (error) {
    console.error('❌ Error loading stages:', error)
  }
}

onMounted(async () => {
  await loadStages()
  loadOrders()
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
    const orderId = order.id
    const updateData: any = { stage: newStatus }
    if (newStatus === 'cancelled') {
      updateData.reason = 'Отменен пользователем'
      updateData.reason_status = 'refused'
    }
    await OrderController().updateStage(order.id, updateData)
    orderListRef.value?.loadOrders()
    const updatedOrder = orders.value.find((o) => o.id === orderId)
    if (updatedOrder) {
    } else {
    }
  } catch (error: any) {
    console.error('❌ Ошибка обновления статуса:', error)
    let errorMessage = 'Ошибка обновления статуса'
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
    alert(`Ошибка обновления статуса: ${errorMessage}`)
  }
}
</script>
