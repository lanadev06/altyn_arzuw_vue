<template>
  <div class="order-list flex flex-col">
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-3">
        <select
          v-model="selectedStage"
          @change="filterByStage"
          class="w-48 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <option value="">Все</option>
          <option value="draft">Черновик</option>
          <option value="design">Дизайн</option>
          <option value="print">Печать</option>
          <option value="workshop">Цех</option>
          <option value="final">Финальный</option>
          <option value="archived">Архив</option>
          <option value="completed">Завершен</option>
          <option value="cancelled">Отменен</option>
        </select>
      </div>
      <div>
        <UIButton
          @click="showCreateModal = true"
          variant="primary"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-2 text-base transition-colors duration-200 shadow-none border-none"
        >
          Добавить заказ
        </UIButton>
      </div>
    </div>
    <div class="flex-1 flex flex-col min-h-0">
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                v-for="col in columns"
                :key="col.key"
                @click="col.sortable ? setSort(col.key) : null"
                :class="[
                  'border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-100 text-left whitespace-nowrap',
                  col.sortable ? 'select-none' : '',
                  col.key === 'created_at' ? 'w-[170px]' : '',
                ]"
              >
                <div class="flex items-center justify-between">
                  <span>{{ col.label }}</span>
                  <span v-if="col.sortable && sortBy === col.key" class="ml-1 text-blue-600">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(item, index) in displayedOrders"
              :key="item.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              style="height: 44px"
              @click="openDetailsModal(item)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'id'">
                  <span class="font-mono text-gray-600">{{ item.id }}</span>
                </template>
                <template v-else-if="col.key === 'product'">
                  <span
                    class="font-medium text-blue-700 underline cursor-pointer"
                    @click.stop="openDetailsModal(item)"
                    >{{ item.product?.name || '-' }}</span
                  >
                </template>
                <template v-else-if="col.key === 'quantity'">
                  <span class="text-gray-900">{{ item.quantity }}</span>
                </template>
                <template v-else-if="col.key === 'manager'">
                  <span class="text-gray-700">{{ item.manager?.name || '-' }}</span>
                </template>
                <template v-else-if="col.key === 'stage'">
                  <span
                    :class="getStatusClass(item.stage)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:underline"
                  >
                    {{ getStatusText(item.stage) }}
                  </span>
                </template>
                <template v-else-if="col.key === 'deadline'">
                  <span class="text-gray-700">{{ formatDate(item.deadline) }}</span>
                </template>
                <template v-else-if="col.key === 'price'">
                  <span class="text-blue-500 font-semibold">
                    {{ item.price ?? '-' }} <span class="text-sm">TMT</span>
                  </span>
                </template>
                <template v-else-if="col.key === 'created_at'">
                  <span class="text-gray-600">{{ formatDate(item.created_at) }}</span>
                </template>
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка заказов...
              </td>
            </tr>
            <tr v-if="!loading && displayedOrders.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Заказы не найдены
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && pagination.total > 0"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @go-to-page="changePage"
        class="mt-1 shrink-0"
      />
    </div>

    <OrderFormModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @submit="handleOrderCreated"
    />
    <OrderDetailsModal
      v-if="detailsOrderId"
      :order-id="detailsOrderId"
      @close="closeDetailsModal"
      @updated="handleOrderUpdatedFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Sortable from 'sortablejs'
import OrderFormModal from './OrderFormModal.vue'
import OrderDetailsModal from './OrderDetailsModal.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import UIButton from '@/components/ui/UIButton.vue'
import { OrderController } from '@/controllers/OrderController'
import type { Order } from '@/types/order'

const { getAll, remove } = OrderController()

const orders = ref<Order[]>([])
const pagination = ref<any>({})
const loading = ref(false)
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('asc')
const columnsHeader = ref<HTMLElement | null>(null)
const columns = ref([
  { key: 'id', label: 'ID', sortable: true },
  { key: 'product', label: 'Продукт', sortable: false },
  { key: 'quantity', label: 'Кол-во', sortable: false },
  { key: 'manager', label: 'Менеджер', sortable: false },
  { key: 'stage', label: 'Статус', sortable: true },
  { key: 'deadline', label: 'Дедлайн', sortable: true },
  { key: 'price', label: 'Цена', sortable: true },
  { key: 'created_at', label: 'Создано', sortable: true },
])

const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const detailsOrderId = ref<number | null>(null)

const displayedOrders = ref<Order[]>([])
const selectedStage = ref('')

function loadOrders(page = 1) {
  loading.value = true
  getAll({ page })
    .then((res) => {
      orders.value = res.data
      pagination.value = res
    })
    .catch((err) => console.error(err))
    .finally(() => (loading.value = false))
}

watch([orders, sortBy, sortOrder], () => {
  displayedOrders.value = [...orders.value].sort((a, b) => {
    const aVal = a[sortBy.value as keyof Order]
    const bVal = b[sortBy.value as keyof Order]
    return sortOrder.value === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
  })
})

function setSort(key: string) {
  if (sortBy.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
}

function changePage(page: number) {
  loadOrders(page)
}

async function deleteOrder(id: number) {
  if (confirm('Удалить заказ?')) {
    try {
      await remove(id)
      loadOrders(pagination.value.current_page)
    } catch (e) {
      console.error('Ошибка удаления:', e)
    }
  }
}

function handleOrderCreated() {
  showCreateModal.value = false
  loadOrders()
}

function getStatusClass(stage: string) {
  return (
    {
      draft: 'bg-gray-100 text-gray-800',
      design: 'bg-blue-100 text-blue-800',
      print: 'bg-yellow-100 text-yellow-800',
      workshop: 'bg-purple-100 text-purple-800',
      final: 'bg-green-100 text-green-800',
      archived: 'bg-gray-200 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }[stage] || 'bg-gray-100 text-gray-800'
  )
}

function getStatusText(stage: string) {
  return (
    {
      draft: 'Черновик',
      design: 'Дизайн',
      print: 'Печать',
      workshop: 'Цех',
      final: 'Финальный',
      archived: 'Архив',
      completed: 'Завершен',
      cancelled: 'Отменен',
    }[stage] || stage
  )
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function filterByStage() {
  loading.value = true
  getAll({ page: 1, stage: selectedStage.value || undefined })
    .then((res) => {
      orders.value = res.data
      pagination.value = res
    })
    .catch((err) => console.error(err))
    .finally(() => (loading.value = false))
}

function openDetailsModal(order) {
  detailsOrderId.value = order.id
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailsOrderId.value = null
}

function handleOrderUpdatedFromModal() {
  loadOrders(pagination.value.current_page)
}

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      onEnd(evt) {
        const moved = columns.value.splice(evt.oldIndex!, 1)[0]
        columns.value.splice(evt.newIndex!, 0, moved)
      },
    })
  }
  loadOrders()
})
</script>
