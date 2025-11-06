<template>
  <div class="order-list flex flex-col">
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">{{ t('table.total') }}:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || 0 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">{{ t('table.pages') }}:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div
        class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1 shadow-sm border border-gray-200"
      >
        <span class="text-gray-600 font-semibold">{{ t('table.perPage') }}:</span>
        <select
          v-model.number="perPage"
          @change="changePerPage"
          class="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 font-semibold"
        >
          <option v-for="n in [10, 20, 50, 100, 200, 500]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="flex items-center gap-3">
        <!-- ✅ НОВОЕ! Фильтр стадий - будет загружаться динамически -->
        <select
          v-model="selectedStage"
          @change="filterByStage"
          class="w-40 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <option value="">{{ t('table.allStages') }}</option>
          <option v-for="stage in stages" :key="stage.id" :value="stage.name" class="text-gray-900">
            {{ stage.display_name || stage.name }}
          </option>
        </select>
        <select
          v-model="selectedArchive"
          @change="filterByArchive"
          class="w-40 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <option value="">{{ t('table.allOrders') }}</option>
          <option value="active">{{ t('table.active') }}</option>
          <option value="archived">{{ t('table.archived') }}</option>
        </select>
        <div v-if="canCreateEdit()" class="flex gap-2">
          <UIButton
            @click="showCreateModal = true"
            variant="primary"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-2 text-base transition-colors duration-200 shadow-none border-none"
          >
            {{ t('table.addOrder') }}
          </UIButton>
        </div>
      </div>
    </div>
    <div class="flex-1 flex flex-col min-h-0">
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                class="border border-gray-200 px-3 py-2 text-center no-drag"
                style="width: 50px"
              >
                <input
                  type="checkbox"
                  v-model="selectAll"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </th>
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
              style="height: 56px"
              @click="openDetailsModal(item)"
            >
              <td
                class="border-r border-gray-200 px-3 py-2 text-center align-middle"
              >
                <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </td>
              <td
                v-for="(col, colIndex) in columns"
                :key="`${item.id}-${col.key}-${colIndex}`"
                class="border-r border-gray-200 px-4 py-4 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'id'">
                  <span class="font-mono text-gray-600">{{ item.id }}</span>
                </template>
                <template v-else-if="col.key === 'product'">
                  <span
                    class="font-medium text-gray-900 cursor-pointer"
                    @click.stop="openDetailsModal(item)"
                    >{{ item.product?.name || '-' }}</span
                  >
                </template>
                <template v-else-if="col.key === 'client'">
                  <span class="text-gray-700">
                    {{ item.client?.name || `(client_id: ${item.client_id})` || '-' }}
                  </span>
                </template>
                <template v-else-if="col.key === 'quantity'">
                  <span class="text-gray-900">{{ item.quantity }}</span>
                </template>
                <!-- ✅ НОВОЕ! Отображение текущей стадии с динамической цветовой индикацией -->
                <template v-else-if="col.key === 'stage'">
                  <div class="flex flex-col items-center gap-1">
                    <!-- Получаем название стадии из всех возможных источников -->
                    <span
                      v-if="getOrderStageName(item)"
                      :class="getStatusClass(getOrderStageName(item) || '')"
                      :style="getOrderStageStyle(item)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer"
                    >
                      {{ getStatusText(getOrderStageName(item) || '') }}
                    </span>
                    <!-- Показываем дефолтную стадию если ничего нет -->
                    <span
                      v-else
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 cursor-pointer"
                    >
                      {{ getStatusText('draft') }}
                    </span>
                    <span
                      v-if="item.is_archived"
                      class="inline-flex px-2 py-1 text-xs font-normal rounded-full bg-gray-100 text-gray-500 border border-gray-200"
                    >
                      {{ item.is_archived ? (stages.find(s => s.name === 'archived')?.display_name || 'archived') : '' }}
                    </span>
                  </div>
                </template>
                <template v-else-if="col.key === 'deadline'">
                  <span class="text-gray-700">{{ formatDate(item.deadline || '') }}</span>
                </template>
                <template v-else-if="col.key === 'price'">
                  <span v-if="canViewPrices()" class="text-blue-500 font-semibold">
                    {{ item.price ?? '-' }} <span class="text-sm">TMT</span>
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </template>
                <template v-else-if="col.key === 'created_at'">
                  <span class="text-gray-600">{{ formatDate(item.created_at) }}</span>
                </template>
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ t('order.loading') }}
              </td>
            </tr>
            <tr v-if="!loading && orders.length === 0 && !error">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? t('order.notFound') : t('order.noOrders') }}
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
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
    <ProjectFormModal
      v-if="showCreateProjectModal"
      @close="showCreateProjectModal = false"
      @submit="handleProjectCreated"
    />
    <OrderDetailsModal
      v-if="detailsOrderId"
      :order-id="detailsOrderId"
      @close="closeDetailsModal"
      @updated="handleOrderUpdatedFromModal"
    />

    <BulkActionPanel
      :show="hasSelection"
      :count="selectedCount"
      :is-processing="isProcessing"
      :show-status-selector="true"
      :show-delete-button="canDelete()"
      :stages="stages"
      @clear="clearSelection"
      @delete="handleBulkDelete"
      @update-status="handleBulkStatusUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Sortable from 'sortablejs'
import OrderFormModal from './OrderFormModal.vue'
import ProjectFormModal from '../../projects/ProjectList/ProjectFormModal.vue'
import OrderDetailsModal from './OrderDetailsModal.vue'
import Pagination from '../../users/UserList/Pagination.vue'
import UIButton from '../../ui/UIButton.vue'
import { OrderController } from '../../../controllers/OrderController'
import type { Order } from '../../../types/order'
import { canCreateEdit, canViewPrices, canDelete, canViewAllOrders } from '../../../utils/permissions'
import { getAllStages } from '../../../services/api'
import { useOrderEvents } from '../../../composables/useOrderEvents'
import { useBulkActions } from '../../../composables/useBulkActions'
import { useSmartPolling } from '../../../composables/useSmartPolling'
import BulkActionPanel from '../../ui/BulkActionPanel.vue'

const props = defineProps<{
  search?: string
}>()

const { t, locale } = useI18n()

const { getAll, removeOrder, orders, pagination, loading, error, fetchOrders } = OrderController()

// Система событий для синхронизации
const { onOrderStageChanged, onOrderUpdated } = useOrderEvents()

// Оптимизация рендеринга для больших списков (используем computed для реактивности)
const displayedOrders = computed(() => {
  // Если элементов меньше 100, рендерим все сразу
  if (orders.value.length <= 100) {
    return orders.value
  }
  // Для больших списков используем батчинг
  return orders.value
})

// Smart polling для автоматического обновления списка
const { isActive: isPollingActive } = useSmartPolling(
  'order-list',
  async () => {
    if (!loading.value) {
      await loadOrders(currentPage.value)
    }
  },
  {
    interval: 30000, // 30 секунд
    maxInterval: 60000,
    minInterval: 15000,
    enabled: true
  }
)

// Bulk actions
const {
  selectedIds,
  isProcessing,
  selectAll,
  hasSelection,
  selectedCount,
  clearSelection,
  bulkDelete,
  bulkUpdateOrderStatus
} = useBulkActions(orders as any)

async function handleBulkDelete() {
  const result = await bulkDelete('orders')
  if (result.deleted > 0) {
    loadOrders(currentPage.value, true)
  }
}

async function handleBulkStatusUpdate(stage: string) {
  const result = await bulkUpdateOrderStatus(stage)
  if (result.updated > 0) {
    loadOrders(currentPage.value, true)
  }
}

const SORT_KEY = 'orderList_sortBy'
const ORDER_KEY = 'orderList_sortOrder'
const COLUMNS_KEY = 'orderList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('orderList_perPage')

const defaultColumns = computed(() => [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'product', label: t('table.product'), sortable: false },
  { key: 'client', label: t('table.client'), sortable: false },
  { key: 'quantity', label: t('table.quantity'), sortable: true },
  { key: 'stage', label: t('table.status'), sortable: true },
  { key: 'deadline', label: t('table.deadline'), sortable: true },
  ...(canViewPrices() ? [{ key: 'price', label: t('table.price'), sortable: true }] : []),
  { key: 'created_at', label: t('table.created'), sortable: true },
])

// Функция для инициализации колонок с правильными переводами
const initializeColumns = (savedCols: any) => {
  if (!savedCols) return defaultColumns.value
  return JSON.parse(savedCols).map((col: any) => {
    const defaultCol = defaultColumns.value.find((dc: any) => dc.key === col.key)
    return defaultCol ? { ...col, label: defaultCol.label } : col
  })
}

const columns = ref(initializeColumns(savedColumns))

// Обновляем колонки при изменении языка
watch(locale, () => {
  const currentSavedColumns = localStorage.getItem(COLUMNS_KEY)
  if (!currentSavedColumns) {
    columns.value = defaultColumns.value
  } else {
    // Обновляем только метки сохраненных колонок
    const savedCols = JSON.parse(currentSavedColumns)
    columns.value = savedCols.map((col: any) => {
      const defaultCol = defaultColumns.value.find((dc: any) => dc.key === col.key)
      return defaultCol ? { ...col, label: defaultCol.label } : col
    })
  }
})

const sortBy = ref(savedSortBy || 'id')
const sortOrder = ref<'asc' | 'desc'>((savedSortOrder as 'asc' | 'desc') || 'asc')
const columnsHeader = ref<HTMLElement | null>(null)

const showCreateModal = ref(false)
const showCreateProjectModal = ref(false)
const showDetailsModal = ref(false)
const detailsOrderId = ref<number | null>(null)

// Add search variable to the component
const search = ref('')
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('orderList_currentPage')
const currentPage = ref(savedCurrentPage ? parseInt(savedCurrentPage) : 1)
const selectedStage = ref<string>('')
const selectedArchive = ref('')
const isArchived = ref<boolean>(false)
const selectedAssignmentStatus = ref<string | null>(null)
const stages = ref<any[]>([])
const loadingStages = ref(false)

// Дебаунсинг для предотвращения множественных обновлений
let updateTimeout: ReturnType<typeof setTimeout> | null = null

const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
function validatePerPage(val: any) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}

function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('orderList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('orderList_currentPage', '1')
  loadOrders(1)
}

watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('orderList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('orderList_currentPage', '1')
  loadOrders(1)
})

function loadOrders(page = currentPage.value, hard = false) {
  const isArchived =
    selectedArchive.value === 'archived'
      ? true
      : selectedArchive.value === 'active'
        ? false
        : undefined

  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('orderList_currentPage', page.toString())

  fetchOrders(
    page,
    props.search || '',
    sortBy.value,
    sortOrder.value,
    selectedStage.value || undefined,
    isArchived,
    perPage.value,
    selectedAssignmentStatus.value || undefined,
    canViewAllOrders(), // Передаем admin_view только для админов и менеджеров
    hard, // force_refresh при необходимости
  )
}

function setSort(key: string) {
  // Разрешённые поля для сортировки
  const allowedSortFields = [
    'id',
    'quantity',
    'stage',
    'deadline',
    ...(canViewPrices() ? ['price'] : []),
    'created_at',
  ]
  if (!allowedSortFields.includes(key)) return
  if (sortBy.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  // При изменении сортировки остаемся на той же странице
  loadOrders(currentPage.value)
}

function resetSettings() {
  columns.value = [...defaultColumns.value]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'id'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  perPage.value = 30
  localStorage.setItem('orderList_perPage', perPage.value.toString())
  selectedStage.value = ''
  loadOrders(1)
}

function changePage(page: number) {
  loadOrders(page)
}

async function deleteOrder(id: number) {
  if (confirm(t('order.deleteConfirm'))) {
    try {
      await removeOrder(id)
      // Принудительно обновляем список
      loadOrders(currentPage.value, true)
    } catch (e) {}
  }
}

function handleOrderCreated() {
  showCreateModal.value = false
  loadOrders(undefined as any, true) // Немедленно обновляем список с force_refresh
}

function handleProjectCreated() {
  showCreateProjectModal.value = false
  loadOrders(undefined as any, true) // Немедленно обновляем список с force_refresh
}

function getStatusClass(stage: string) {
  // Сначала ищем стадию в загруженных данных
  const foundStage = stages.value.find((s) => s.name === stage)
  if (foundStage && foundStage.color) {
    // Если есть цвет в API, используем только font-semibold
    return 'font-semibold'
  }

  // Fallback на старые цвета (когда нет цвета в API)
  return (
    {
      draft: 'bg-gray-100 text-gray-800',
      design: 'bg-blue-100 text-blue-800',
      print: 'bg-yellow-100 text-yellow-800',
      engraving: 'bg-orange-100 text-orange-800',
      workshop: 'bg-purple-100 text-purple-800',
      final: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }[stage] || 'bg-gray-100 text-gray-800'
  )
}

function getStatusText(stage: string) {
  // Используем динамические данные с сервера (display_name уже содержит перевод)
  const foundStage = stages.value.find((s) => s.name === stage)
  if (foundStage && foundStage.display_name) {
    return foundStage.display_name
  }

  // Fallback - возвращаем ключ стадии, если данных нет (не переводим через i18n)
  return stage
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
  // При изменении фильтра возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('orderList_currentPage', '1')
  loadOrders(1)
}

function filterByArchive() {
  // При изменении фильтра возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('orderList_currentPage', '1')
  loadOrders(1)
}

function filterByAssignmentStatus() {
  // При изменении фильтра возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('orderList_currentPage', '1')
  loadOrders(1)
}

function openDetailsModal(order: Order) {
  detailsOrderId.value = order.id
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailsOrderId.value = null
}

function handleOrderUpdatedFromModal() {
  // Принудительно обновляем список с небольшой задержкой для синхронизации с сервером
  setTimeout(() => {
    loadOrders()
  }, 100)
}

function getOrderStageName(order: any): string | null {
  // Проверяем все возможные источники названия стадии
  if (order.current_stage_info?.display_name) {
    return order.current_stage_info.display_name
  }

  if (order.current_stage_info?.name) {
    return order.current_stage_info.name
  }

  if (order.stage?.display_name) {
    return order.stage.display_name
  }

  if (order.stage?.name) {
    return order.stage.name
  }

  if (order.current_stage) {
    return order.current_stage
  }

  if (order.stage_id) {
    // Если есть только ID стадии, ищем её в загруженных стадиях
    const foundStage = stages.value.find((s) => s.id === order.stage_id)
    if (foundStage) {
      return foundStage.display_name || foundStage.name
    }
  }

  // Если ничего не найдено, возвращаем null
  return null
}

function getOrderStageStyle(order: any): any {
  // Если есть current_stage_info с цветом, используем его
  if (order.current_stage_info?.color) {
    return { backgroundColor: order.current_stage_info.color, color: 'white' }
  }

  // Если есть stage с цветом, используем его
  if (order.stage?.color) {
    return { backgroundColor: order.stage.color, color: 'white' }
  }

  // Если есть название стадии, ищем цвет в загруженных стадиях
  const stageName = getOrderStageName(order)
  if (stageName) {
    const foundStage = stages.value.find(
      (s) => s.name === stageName || s.display_name === stageName,
    )
    if (foundStage?.color) {
      return { backgroundColor: foundStage.color, color: 'white' }
    }
  }

  // Если ничего не найдено, возвращаем пустой объект
  return {}
}

async function loadStages() {
  try {
    loadingStages.value = true

    const stagesData = await getAllStages()

    if (stagesData && Array.isArray(stagesData)) {
      stages.value = stagesData
    } else if (stagesData && stagesData.data && Array.isArray(stagesData.data)) {
      stages.value = stagesData.data
    } else {
      stages.value = []
    }
  } catch (error) {
    stages.value = []
  } finally {
    loadingStages.value = false
  }
}

// Убрали автоматическое обновление для предотвращения сброса на первую страницу
// let autoRefreshInterval: number | null = null
// let handleFocus: (() => void) | null = null

defineExpose({ loadOrders })

// Отслеживаем изменения поискового запроса
watch(
  () => props.search,
  () => {
    // При изменении поиска возвращаемся на первую страницу
    currentPage.value = 1
    localStorage.setItem('orderList_currentPage', '1')
    loadOrders(1)
  },
)

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      filter: '.no-drag',
      onEnd(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        
        // Skip if dragging checkbox column
        if (oldIndex === 0 || newIndex === 0) return
        if (oldIndex === undefined || newIndex === undefined) return
        
        // Adjust indices because checkbox column is at index 0
        const adjustedOldIndex = oldIndex - 1
        const adjustedNewIndex = newIndex - 1
        
        const newColumns = [...columns.value]
        const moved = newColumns.splice(adjustedOldIndex, 1)[0]
        newColumns.splice(adjustedNewIndex, 0, moved)
        columns.value = newColumns
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      },
    })
  }

  // Подписываемся на глобальные события смены стадий
  onOrderStageChanged((event) => {
    // Дебаунсинг: обновляем список только через 500ms после последнего события
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(() => {
      loadOrders(currentPage.value)
      updateTimeout = null
    }, 500)
  })
  
  onOrderUpdated((event) => {
    // Дебаунсинг: обновляем список только через 500ms после последнего события
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(() => {
      loadOrders(currentPage.value)
      updateTimeout = null
    }, 500)
  })

  // Загружаем стадии для фильтра
  await loadStages()

  // Загружаем заказы
  loadOrders()

  // Убрали автоматическое обновление для предотвращения сброса на первую страницу
  // autoRefreshInterval = window.setInterval(() => {
  //   loadOrders()
  // }, 30000)

  // Убрали обновление при фокусе окна
  // handleFocus = () => {
  //   loadOrders()
  // }
  // window.addEventListener('focus', handleFocus)
})

onUnmounted(() => {
  // Очищаем таймер обновления при размонтировании
  if (updateTimeout) {
    clearTimeout(updateTimeout)
    updateTimeout = null
  }
  // Убрали очистку интервала и обработчика фокуса
  // if (autoRefreshInterval) {
  //   clearInterval(autoRefreshInterval)
  //   autoRefreshInterval = null
  // }

  // if (handleFocus) {
  //   window.removeEventListener('focus', handleFocus)
  // }
})



defineOptions({
  name: 'OrderList'
})
</script>
