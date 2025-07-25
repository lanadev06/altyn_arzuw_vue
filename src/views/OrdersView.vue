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
      </div>
      <OrderList v-if="isTableView" ref="orderListRef" />
      <OrderKanban
        v-else
        :statuses="kanbanStatuses"
        @change-status="handleChangeStatus"
        @open-order="openOrderDetails"
        @add-order="openCreateOrderModal"
        :orders="orders"
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
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { OrderController } from '../controllers/OrderController'
import Layout from '../components/layout/Layout.vue'
import OrderList from '../components/orders/OrderList/OrderList.vue'
import OrderKanban from '../components/orders/OrderKanban/OrderKanban.vue'
import OrderDetailsModal from '../components/orders/OrderList/OrderDetailsModal.vue'
import OrderFormModal from '../components/orders/OrderList/OrderFormModal.vue'
import ReadOnlyMessage from '../components/ui/ReadOnlyMessage.vue'
import { canCreateEdit } from '../utils/permissions'

const route = useRoute()
const search = ref(route.query.search || '')
const isTableView = ref(true)
const detailsOrderId = ref(null)
const detailsErrorMsg = ref('')
const showCreateModal = ref(false)

const { orders, fetchOrders } = OrderController()

const kanbanStatuses = [
  { key: 'draft', label: 'Черновик' },
  { key: 'design', label: 'Дизайн' },
  { key: 'print', label: 'Печать' },
  { key: 'engraving', label: 'Гравировка' },
  { key: 'workshop', label: 'Цех' },
  { key: 'final', label: 'Финальный' },
  { key: 'completed', label: 'Завершен' },
  { key: 'cancelled', label: 'Отменен' },
]

const orderListRef = ref()

const loadOrders = async () => {
  try {
    if (!isTableView.value) {
      // Для Kanban загружаем все заказы через getAll с большим per_page
      const { getAll } = OrderController()
      const res = await getAll({ page: 1, per_page: 10000 })
      orders.value = res.data || []
    } else {
      // Для таблицы используем обычную пагинацию и передаём search
      await fetchOrders(1, 'id', 'asc', undefined, undefined, String(search.value))
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки заказов:', error)
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

onMounted(loadOrders)

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
      console.log('🔍 Заказ после обновления:', {
        id: updatedOrder.id,
        oldStage: order.stage,
        newStage: updatedOrder.stage,
        expectedStage: newStatus,
      })
    } else {
      console.log('❌ Заказ не найден после обновления')
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
