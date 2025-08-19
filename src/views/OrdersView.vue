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
import { canCreateEdit, canViewAllUsers, canViewAllOrders } from '../utils/permissions'
import { getAllStages } from '../services/api'

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

const { orders, fetchOrders, fetchAllOrdersForKanban } = OrderController()

// Фильтрация заказов для канбана по поисковому запросу
const filteredKanbanOrders = computed(() => {
  console.log('🔍 filteredKanbanOrders computed called')
  console.log('📦 Raw orders.value:', orders.value?.length || 0)
  console.log('🔍 Search value:', search.value)

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

  console.log('🎯 Filtered Kanban orders:', {
    totalOrders: orders.value?.length || 0,
    filteredOrders: result.length,
    searchQuery: search.value,
    hasSearch: !!search.value,
    ordersStages: result.map((o) => ({ id: o.id, stage: o.stage?.name || o.stage })),
  })

  return result
})

const kanbanStatuses = ref([])

const orderListRef = ref()

const loadOrders = async () => {
  try {
    console.log('🔄 Loading orders... isTableView:', isTableView.value)

    if (!isTableView.value) {
      // Для Kanban используем fetchAllOrdersForKanban
      console.log('📋 Loading orders for Kanban view...')
      await fetchAllOrdersForKanban(
        1, // всегда первая страница для получения всех данных
        'id',
        'desc',
        undefined, // НЕ передаем фильтр по стадии для получения ВСЕХ заказов
        false, // только активные заказы
      )
      console.log('✅ Kanban orders loaded:', orders.value?.length || 0)
    } else {
      // Для таблицы используем обычную пагинацию и передаём search
      console.log('📊 Loading orders for Table view...')
      await fetchOrders(
        currentPage.value,
        search.value,
        'id',
        'desc',
        selectedStage.value || undefined,
        isArchived.value,
        30,
        undefined,
      )
      console.log('✅ Table orders loaded:', orders.value?.length || 0)
    }

    console.log('📦 Total orders in state:', orders.value?.length || 0)
    console.log(
      '🔍 Orders by stage:',
      orders.value?.reduce(
        (acc, order) => {
          const stage = order.stage?.name || order.stage || 'unknown'
          acc[stage] = (acc[stage] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    )

    // Проверяем структуру первых нескольких заказов
    if (orders.value && orders.value.length > 0) {
      console.log('🔍 Sample order structure:', {
        firstOrder: {
          id: orders.value[0].id,
          stage: orders.value[0].stage,
          stageName: orders.value[0].stage?.name,
          product: orders.value[0].product?.name,
          client: orders.value[0].client?.name,
        },
        totalOrders: orders.value.length,
      })
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки заказов:', error)
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

    // Показываем все стадии для всех пользователей (временно для отладки)
    console.log('🎯 Setting all stages for Kanban:', allStages.length)
    kanbanStatuses.value = allStages.map((stage: any) => ({
      key: stage.name,
      label: stage.display_name || stage.name,
    }))

    console.log('📋 Final kanban statuses:', kanbanStatuses.value)
  } catch (error) {
    console.error('❌ Error loading stages:', error)
  }
}

onMounted(async () => {
  // Проверяем роли пользователя
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  console.log('👤 Current user info:', {
    id: user.id,
    name: user.name,
    roles: user.roles?.map((r: any) => r.name) || [],
    isAdminOrManager: canViewAllUsers(),
    canViewAllOrders: canViewAllOrders(),
  })

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
