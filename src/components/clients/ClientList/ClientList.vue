<template>
  <div class="client-list flex flex-col">
    <div class="flex justify-end items-center mb-3">
      <UIButton @click="showCreateModal = true" variant="primary" class=""
        >{{ t('clients.addClient') }}</UIButton
      >
    </div>
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
                :class="[
                  'border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-100 text-left',
                  col.key === 'created_at' || col.key === 'updated_at'
                    ? 'whitespace-nowrap pr-4 w-[170px]'
                    : 'whitespace-nowrap',
                ]"
                @click="col.sortable ? setSort(col.key, props.search) : null"
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
              v-for="(client, index) in pagination.data"
              :key="client.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              style="height: 44px"
              @click="editClient(client as Client)"
            >
              <td
                class="border-r border-gray-200 px-3 py-2 text-center align-middle"
              >
                <input
                  type="checkbox"
                  :value="client.id"
                  v-model="selectedIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </td>
              <td v-for="(col, colIndex) in columns" :key="`${client.id}-${col.key}-${colIndex}`"
                  :class="[
                    'border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle',
                    col.key === 'id' ? 'max-w-[100px]' : '',
                    col.key === 'company_name' ? 'max-w-[160px]' : '',
                    col.key === 'contacts' ? 'max-w-[220px]' : '',
                    col.key === 'created_at' || col.key === 'updated_at'
                      ? 'whitespace-nowrap pr-4 w-[170px]'
                      : '',
                  ]"
                >
                  <template v-if="col.key === 'id'">
                    <span class="font-mono text-gray-600">{{ client.id }}</span>
                  </template>
                  <template v-else-if="col.key === 'name'">
                    <span class="font-medium text-gray-900">{{ client.name }}</span>
                  </template>
                  <template v-else-if="col.key === 'company_name'">
                    <span class="text-gray-700 block truncate">{{
                      client.company_name || '-'
                    }}</span>
                  </template>
                  <template v-else-if="col.key === 'contacts'">
                    <div class="flex flex-col gap-1 max-w-[220px]">
                      <span
                        v-for="contact in client.contacts"
                        :key="contact.id"
                        class="text-base block truncate"
                        :title="contact.type + ': ' + contact.value"
                      >
                        <span class="flex items-center gap-2">
                          <ContactTypeIcon :type="contact.type" />
                          <span class="text-gray-700">{{ contact.value }}</span>
                        </span>
                      </span>
                    </div>
                  </template>
                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(client.created_at) }}</span>
                  </template>
                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(client.updated_at) }}</span>
                  </template>
                </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ t('clients.loading') }}
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && (!pagination || pagination.data.length === 0)">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? t('clients.notFound') : t('clients.noClients') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        v-if="!loading && !error && pagination && pagination.total > 0"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <BulkActionPanel
      :show="hasSelection"
      :count="selectedCount"
      :is-processing="isProcessing"
      @clear="clearSelection"
      @delete="handleBulkDelete"
    />

    <ClientFormModal
      v-if="showCreateModal"
      :client="null"
      @close="showCreateModal = false"
      @submit="handleCreateClient"
    />
    <ClientFormModal
      v-if="showEditModal"
      :client="editingClient"
      @close="showEditModal = false"
      @submit="handleUpdateClient"
      @delete="handleDeleteClient"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onActivated, nextTick, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import ClientFormModal from './ClientFormModal.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import type { Client } from '@/types/client'
import { ClientController } from '@/controllers/ClientController'
import ContactTypeIcon from './ContactTypeIcon.vue'
import { useToast } from '@/stores/toast'
import { useBulkActions } from '../../../composables/useBulkActions'
import BulkActionPanel from '../../ui/BulkActionPanel.vue'
import { frontendCache, CacheKeys } from '@/services/cacheService'

const { t, locale } = useI18n()

const props = defineProps({
  search: { type: String, default: '' },
})

const toast = useToast()

const defaultColumns = computed(() => [
  { key: 'id', label: t('clients.columns.id'), sortable: true },
  { key: 'name', label: t('clients.columns.name'), sortable: true },
  { key: 'company_name', label: t('clients.columns.company'), sortable: true },
  { key: 'contacts', label: t('clients.columns.contacts'), sortable: false },
  { key: 'created_at', label: t('clients.columns.created'), sortable: true },
  { key: 'updated_at', label: t('clients.columns.updated'), sortable: false },
])

// Константы для localStorage
const SORT_KEY = 'clientList_sortBy'
const ORDER_KEY = 'clientList_sortOrder'
const COLUMNS_KEY = 'clientList_columns'

const savedPerPage = localStorage.getItem('clientList_perPage')
const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)

// Инициализируем колонки - читаем из localStorage, но обновляем labels из computed
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const initializeColumns = () => {
  if (savedColumns) {
    const savedCols = JSON.parse(savedColumns)
    return savedCols.map((col: any) => {
      const defaultCol = defaultColumns.value.find((dc: any) => dc.key === col.key)
      return defaultCol ? { ...col, label: defaultCol.label } : col
    })
  }
  return defaultColumns.value
}

const columns = ref(initializeColumns())

const { pagination, loading, error, fetchClients, update, remove, sortBy, sortOrder, setSort } =
  ClientController()

// Bulk actions - используем computed для создания реактивного источника
const clients = computed(() => pagination.data || [])
const {
  selectedIds,
  isProcessing,
  selectAll,
  hasSelection,
  selectedCount,
  clearSelection,
  bulkDelete
} = useBulkActions(clients as any)

// Инициализируем сортировку из localStorage
if (savedSortBy && sortBy.value !== savedSortBy) {
  sortBy.value = savedSortBy
}
if (savedSortOrder && sortOrder.value !== savedSortOrder) {
  sortOrder.value = savedSortOrder as 'asc' | 'desc'
}

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingClient = ref<Client | null>(null)
const columnsHeader = ref<HTMLElement | null>(null)
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('clientList_currentPage')
const currentPage = ref(savedCurrentPage ? parseInt(savedCurrentPage) : 1)
const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)

function validatePerPage(val: number) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}

function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('clientList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('clientList_currentPage', '1')
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function goToPage(page: number) {
  if (!pagination || page < 1 || page > pagination.last_page) {
    return
  }

  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('clientList_currentPage', page.toString())
  fetchClients(page, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function editClient(client: Client) {
  editingClient.value = client
  showEditModal.value = true
}

async function handleCreateClient() {
  showCreateModal.value = false
  currentPage.value = 1
  localStorage.setItem('clientList_currentPage', '1')
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
}

async function handleUpdateClient(updatedClient: Client) {
  await update(updatedClient.id, updatedClient)
  showEditModal.value = false
  // Сохраняем текущее состояние (страницу, сортировку, perPage)
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
}

async function handleDeleteClient(clientId: number) {
  // Предотвращаем множественные запросы на удаление
  if (loading.value) {
    return
  }

  // Оптимистичное обновление: сразу удаляем клиента из списка
  const clientIndex = pagination.data.findIndex(c => c.id === clientId)
  const wasLastOnPage = pagination.data.length === 1
  const currentPageBeforeDelete = currentPage.value

  if (clientIndex !== -1) {
    pagination.data.splice(clientIndex, 1)
    pagination.total = Math.max(0, (pagination.total || 0) - 1)
  }

  try {
    await remove(clientId)

    // Показываем уведомление об успешном удалении
    toast.show(t('clients.clientDeleted'), 'success')

    // Закрываем модальное окно
    showEditModal.value = false
    editingClient.value = null

    // Обновляем список после удаления
    await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
    
    // Если текущая страница стала больше последней, переходим на последнюю
    if (pagination.current_page > pagination.last_page && pagination.last_page > 0) {
      currentPage.value = pagination.last_page
      localStorage.setItem('clientList_currentPage', currentPage.value.toString())
      await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
    }
  } catch (err: any) {
    // Если ошибка 404 (клиент не найден), считаем это успешным удалением
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      toast.show(t('clients.clientDeleted'), 'success')
      // Обновляем список для синхронизации
      await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
      
      // Если текущая страница стала больше последней, переходим на последнюю
      if (pagination.current_page > pagination.last_page && pagination.last_page > 0) {
        currentPage.value = pagination.last_page
        localStorage.setItem('clientList_currentPage', currentPage.value.toString())
        await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
      }
      return
    }

    // Для других ошибок откатываем оптимистичное обновление
    await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)

    // Показываем сообщение об ошибке
    let message = t('clients.deleteError')
    if (err instanceof Error) {
      message = err.message
    }

    toast.show(message, 'error')
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(
  () => props.search,
  (newVal) => {
    currentPage.value = 1
    localStorage.setItem('clientList_currentPage', '1')
    // Используем force_refresh=true чтобы получить свежие данные, а не из кэша
    fetchClients(1, newVal, sortBy.value, sortOrder.value, perPage.value, true)
  },
)

let pollingInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      filter: '.no-drag',
      onEnd(evt: Sortable.SortableEvent) {
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
        // Сохраняем только структуру колонок (key и sortable), без label
        const colsToSave = newColumns.map((col: any) => ({ key: col.key, sortable: col.sortable }))
        localStorage.setItem('clientList_columns', JSON.stringify(colsToSave))
      },
    })
  }
  // Проверяем, были ли недавние изменения клиентов при монтировании
  const lastClientChange = localStorage.getItem('lastClientChange')
  const shouldForceRefresh = lastClientChange && (Date.now() - parseInt(lastClientChange)) < 300000 // 5 минут
  
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, shouldForceRefresh)
  pollingInterval = setInterval(() => {
    // Polling использует force_refresh для получения актуальных данных
    fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
  }, 30000) // Увеличиваем до 30 секунд
})

// Хук для отслеживания возврата на страницу через навигацию Vue Router
onActivated(() => {
  // Проверяем, были ли изменения клиентов при возврате на страницу
  const lastClientChange = localStorage.getItem('lastClientChange')
  if (lastClientChange && (Date.now() - parseInt(lastClientChange)) < 300000) {
    // Если были изменения в последние 5 минут, принудительно обновляем данные
    fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
  }
})

watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('clientList_perPage', perPage.value.toString())
  currentPage.value = 1
  localStorage.setItem('clientList_currentPage', '1')
  // Используем force_refresh=true чтобы получить свежие данные
  fetchClients(1, props.search, sortBy.value, sortOrder.value, perPage.value, true)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

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
    // Сохраняем обновленные колонки обратно в localStorage (сохраняем только структуру, без label)
    const colsToSave = columns.value.map((col: any) => ({ key: col.key, sortable: col.sortable }))
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(colsToSave))
  }
}, { immediate: false })


async function handleBulkDelete() {
  // Сохраняем выбранные ID перед удалением
  const selectedIdsBeforeDelete = [...selectedIds.value]
  
  // Оптимистичное обновление: сразу удаляем выбранные клиенты из списка
  selectedIdsBeforeDelete.forEach(id => {
    const index = pagination.data.findIndex(c => c.id === id)
    if (index !== -1) {
      pagination.data.splice(index, 1)
    }
  })
  pagination.total = Math.max(0, (pagination.total || 0) - selectedIdsBeforeDelete.length)
  
  const result = await bulkDelete('clients')
  
  if (result.deleted > 0) {
    // Инвалидируем кэш клиентов на фронтенде
    frontendCache.invalidatePattern(CacheKeys.CLIENTS)
    frontendCache.invalidatePattern('clients_')
    
    // Инвалидируем кэш клиентов в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastClientChange', Date.now().toString())
    }
    
    // Небольшая задержка перед обновлением, чтобы сервер успел обработать удаление
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Обновляем список с принудительным обновлением (force_refresh=true)
    // Используем await чтобы убедиться, что данные загружены
    await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
    
    // Если текущая страница стала больше последней, переходим на последнюю
    if (pagination.current_page > pagination.last_page && pagination.last_page > 0) {
      currentPage.value = pagination.last_page
      localStorage.setItem('clientList_currentPage', currentPage.value.toString())
      await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
    }
  } else {
    // Если ничего не удалилось, откатываем оптимистичное обновление
    await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, true)
  }
}

defineOptions({
  name: 'ClientList'
})
</script>
