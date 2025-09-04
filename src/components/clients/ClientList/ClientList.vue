<template>
  <div class="client-list flex flex-col">
    <div class="flex justify-end items-center mb-3">
      <UIButton @click="showCreateModal = true" variant="primary" class=""
        >Добавить клиента</UIButton
      >
    </div>
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Всего:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || 0 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Страницы:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div
        class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1 shadow-sm border border-gray-200"
      >
        <span class="text-gray-600 font-semibold">На странице:</span>
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
              @click="editClient(client)"
              style="height: 44px"
            >
              <td v-for="col in columns" :key="col.key"
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
                          <ContactTypeIcon :type="contact.type" class="mr-2" />
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
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка клиентов...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && (!pagination || pagination.data.length === 0)">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Клиенты не найдены' : 'Клиенты отсутствуют' }}
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
import { ref, watch, onMounted, nextTick, onUnmounted } from 'vue'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import ClientFormModal from './ClientFormModal.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import type { Client } from '@/types/client'
import { ClientController } from '@/controllers/ClientController'
import ContactTypeIcon from './ContactTypeIcon.vue'
import { useToast } from '@/stores/toast'

const props = defineProps({
  search: { type: String, default: '' },
})

const toast = useToast()

const defaultColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'company_name', label: 'Компания', sortable: true },
  { key: 'contacts', label: 'Контакты', sortable: false },
  { key: 'created_at', label: 'Создано', sortable: true },
  { key: 'updated_at', label: 'Обновлено', sortable: false },
]

const savedColumns = localStorage.getItem('clientList_columns')
const savedPerPage = localStorage.getItem('clientList_perPage')
const columns = ref(savedColumns ? JSON.parse(savedColumns) : defaultColumns)

const { pagination, loading, error, fetchClients, update, remove, sortBy, sortOrder, setSort } =
  ClientController()

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
  fetchClients(page, props.search, sortBy.value, sortOrder.value)
}

function editClient(client: Client) {
  editingClient.value = client
  showEditModal.value = true
}

async function handleCreateClient() {
  showCreateModal.value = false
  currentPage.value = 1
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleUpdateClient(updatedClient: Client) {
  await update(updatedClient.id, updatedClient)
  showEditModal.value = false
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleDeleteClient(clientId: number) {
  // Предотвращаем множественные запросы на удаление
  if (loading.value) {
    // console.log('⚠️ Deletion already in progress, skipping...')
    return
  }

  try {
    // console.log('🗑️ Starting client deletion for ID:', clientId)

    await remove(clientId)
    // console.log('✅ Client deletion completed successfully')

    // Показываем уведомление об успешном удалении
    toast.show('Клиент успешно удален!', 'success')

    // Обновляем UI только после успешного удаления
    showEditModal.value = false
    editingClient.value = null
    if (pagination && pagination.data.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value)
  } catch (err: unknown) {
    console.error('❌ Ошибка удаления клиента:', clientId, err)
    
    // Если ошибка 404 (клиент не найден), считаем это успешным удалением
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      // console.log('ℹ️ Client not found (404) - already deleted, showing success message')
      toast.show('Клиент успешно удален!', 'success')
      // Обновляем список
      await fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value)
      return
    }

    // Для других ошибок показываем сообщение об ошибке
    let message = 'Ошибка удаления клиента'
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
    fetchClients(1, newVal, sortBy.value, sortOrder.value)
  },
)

let pollingInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      onEnd(evt: Sortable.SortableEvent) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex === undefined || newIndex === undefined) return
        const moved = columns.value.splice(oldIndex, 1)[0]
        columns.value.splice(newIndex, 0, moved)
        localStorage.setItem('clientList_columns', JSON.stringify(columns.value))
      },
    })
  }
  fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
  pollingInterval = setInterval(() => {
    fetchClients(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
  }, 30000) // Увеличиваем до 30 секунд
})

watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('clientList_perPage', perPage.value.toString())
  fetchClients(1, props.search, sortBy.value, sortOrder.value, perPage.value)
  currentPage.value = 1
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})


defineOptions({
  name: 'ClientList'
})
</script>
