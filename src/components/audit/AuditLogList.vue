<template>
  <div class="space-y-6">
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
          v-model.number="filters.per_page"
          @change="changePerPage"
          class="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 font-semibold"
        >
          <option v-for="n in [10, 20, 50, 100, 200, 500]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('audit.modelType') }}</label>
          <select
            v-model="filters.auditable_type"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            @change="loadLogs"
          >
            <option value="">{{ t('audit.all') }}</option>
            <option value="App\Models\Order">{{ t('common.orders') }}</option>
            <option value="App\Models\Product">{{ t('common.products') }}</option>
            <option value="App\Models\Project">{{ t('common.projects') }}</option>
            <option value="App\Models\User">{{ t('common.users') }}</option>
            <option value="App\Models\Client">{{ t('common.clients') }}</option>
            <option value="App\Models\ClientContact">{{ t('order.clientContacts') }}</option>
            <option value="App\Models\Comment">{{ t('order.details.comments') }}</option>
            <option value="App\Models\OrderAssignment">{{ t('order.details.assignedEmployees') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('audit.action') }}</label>
          <select
            v-model="filters.action"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            @change="loadLogs"
          >
            <option value="">{{ t('audit.allActions') }}</option>
            <option value="created">{{ t('audit.created') }}</option>
            <option value="updated">{{ t('audit.updated') }}</option>
            <option value="deleted">{{ t('audit.deleted') }}</option>
            <option value="restored">{{ t('audit.restored') }}</option>
            <option value="force_deleted">{{ t('audit.forceDeleted') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('audit.dateFrom') }}</label>
          <input
            ref="dateFromInput"
            v-model="filters.date_from"
            type="text"
            :placeholder="t('audit.selectDate')"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            readonly
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('audit.dateTo') }}</label>
          <input
            ref="dateToInput"
            v-model="filters.date_to"
            type="text"
            :placeholder="t('audit.selectDate')"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            readonly
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <input
            v-model="filters.auditable_id"
            type="number"
            :placeholder="t('audit.recordIdPlaceholder')"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            @input="debouncedSearch"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            {{ t('audit.clearFilters') }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">{{ t('audit.loading') }}</p>
      </div>

      <div v-else-if="logs.length === 0" class="p-8 text-center">
        <p class="text-gray-600">{{ t('audit.notFound') }}</p>
      </div>

      <div v-else>
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                v-for="col in columns"
                :key="col.key"
                class="border border-gray-200 px-3 py-2 text-left whitespace-nowrap select-none cursor-move"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(log, $index) in logs"
              :key="log.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                $index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              style="height: 56px"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="border-r border-gray-200 px-4 py-4 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'created_at'">
                  {{ formatDate(log.created_at) }}
                </template>
                <template v-else-if="col.key === 'user'">
                  <div class="text-sm font-medium text-gray-900">
                    {{ log.user?.name || t('audit.system') }}
                  </div>
                  <div v-if="log.user?.role" class="text-xs text-gray-500">
                    {{ t(`roles.${log.user.role}`) || log.user.role }}
                  </div>
                </template>
                <template v-else-if="col.key === 'action'">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      AUDIT_ACTION_COLORS[log.action],
                    ]"
                  >
                    {{ AUDIT_ACTION_LABELS[log.action] }}
                  </span>
                </template>
                <template v-else-if="col.key === 'auditable_type'">
                  {{ AUDIT_MODEL_LABELS[log.auditable_type] || log.auditable_type }}
                </template>
                <template v-else-if="col.key === 'auditable_id'">
                  <span v-if="log.auditable_type === 'App\\Models\\User'">
                    {{ log.auditable?.name || log.auditable_id }}
                  </span>
                  <span v-else-if="log.auditable_type === 'App\\Models\\Client'">
                    {{ log.auditable?.name || log.auditable?.company_name || log.auditable_id }}
                  </span>
                  <span v-else-if="log.auditable_type === 'App\\Models\\Product'">
                    {{ log.auditable?.name || log.auditable_id }}
                  </span>
                  <span v-else-if="log.auditable_type === 'App\\Models\\Project'">
                    {{ log.auditable?.title || log.auditable_id }}
                  </span>
                  <span v-else>
                    {{ log.auditable_id }}
                  </span>
                </template>

                <template v-else-if="col.key === 'actions'">
                  <button @click="showDetails(log)" class="text-blue-600 hover:text-blue-900">
                    {{ t('audit.details') }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination
      v-if="pagination && pagination.last_page > 1"
      :current-page="pagination.current_page"
      :last-page="pagination.last_page"
      @go-to-page="changePage"
      class="mt-4 shrink-0"
    />

    <AuditLogDetailsModal v-if="selectedLog" :log="selectedLog" @close="selectedLog = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import Sortable from 'sortablejs'
import { AuditController } from '@/controllers/AuditController'
import type { AuditLog, AuditLogFilters, AuditLogResponse } from '@/types/audit'
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, AUDIT_MODEL_LABELS } from '@/types/audit'
import AuditLogDetailsModal from './AuditLogDetailsModal.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'

const { t } = useI18n()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const selectedLog = ref<AuditLog | null>(null)

const AUDIT_PER_PAGE_KEY = 'auditLogList_perPage'
const AUDIT_CURRENT_PAGE_KEY = 'auditLogList_currentPage'

const savedPerPage = localStorage.getItem(AUDIT_PER_PAGE_KEY)
const savedCurrentPage = localStorage.getItem(AUDIT_CURRENT_PAGE_KEY)

const filters = ref<AuditLogFilters>({
  page: savedCurrentPage ? parseInt(savedCurrentPage) : 1,
  per_page: savedPerPage ? parseInt(savedPerPage) : 30,
})

const pagination = ref<{
  current_page: number
  last_page: number
  per_page: number
  total: number
} | null>(null)

const columns = computed(() => [
  { key: 'created_at', label: t('audit.columnTime') },
  { key: 'user', label: t('audit.columnEmployee') },
  { key: 'action', label: t('audit.columnAction') },
  { key: 'auditable_type', label: t('audit.columnModel') },
  { key: 'auditable_id', label: t('audit.columnId') },
  { key: 'actions', label: t('audit.columnActions') },
])
const columnsHeader = ref(null)

const loadLogs = async () => {
  loading.value = true
  try {
    const response: AuditLogResponse = await AuditController.getAuditLogs(filters.value)
    logs.value = response.data
    pagination.value = {
      current_page: response.pagination?.current_page || response.current_page,
      last_page: response.pagination?.last_page || response.last_page,
      per_page: response.pagination?.per_page || response.per_page,
      total: response.pagination?.total || response.total,
    }
  } catch {
    logs.value = []
    pagination.value = null
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= (pagination.value?.last_page || 1)) {
    filters.value.page = page
    localStorage.setItem(AUDIT_CURRENT_PAGE_KEY, page.toString())
    loadLogs()
  }
}

const clearFilters = () => {
  filters.value = {
    page: 1,
    per_page: 30,
  }
  localStorage.setItem(AUDIT_PER_PAGE_KEY, (filters.value.per_page || 30).toString())
  localStorage.setItem(AUDIT_CURRENT_PAGE_KEY, '1')
  loadLogs()
}

let searchTimeout: number
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = window.setTimeout(() => {
    filters.value.page = 1
    localStorage.setItem(AUDIT_CURRENT_PAGE_KEY, '1')
    loadLogs()
  }, 500)
}

const showDetails = (log: AuditLog) => {
  selectedLog.value = log
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dateFromInput = ref(null)
const dateToInput = ref(null)


const allowedPerPage = [10, 20, 50, 100, 200, 500]
function validatePerPage(val: any) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}
function changePerPage() {
  filters.value.per_page = validatePerPage(filters.value.per_page)
  localStorage.setItem(AUDIT_PER_PAGE_KEY, (filters.value.per_page || 30).toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  filters.value.page = 1
  localStorage.setItem(AUDIT_CURRENT_PAGE_KEY, '1')
  loadLogs()
}
watch(
  () => filters.value.per_page,
  (newVal) => {
    filters.value.per_page = validatePerPage(newVal)
    localStorage.setItem(AUDIT_PER_PAGE_KEY, (filters.value.per_page || 30).toString())
    // При изменении количества элементов на странице возвращаемся на первую страницу
    filters.value.page = 1
    localStorage.setItem(AUDIT_CURRENT_PAGE_KEY, '1')
    loadLogs()
  },
)

onMounted(async () => {
  loadLogs()
  nextTick(() => {
    if (dateFromInput.value) {
      flatpickr(dateFromInput.value, {
        dateFormat: 'Y-m-d',
        onChange: ([date]) => {
          filters.value.date_from = date ? date.toISOString().slice(0, 10) : ''
          loadLogs()
        },
      })
    }
    if (dateToInput.value) {
      flatpickr(dateToInput.value, {
        dateFormat: 'Y-m-d',
        onChange: ([date]) => {
          filters.value.date_to = date ? date.toISOString().slice(0, 10) : ''
          loadLogs()
        },
      })
    }
    if (columnsHeader.value) {
      Sortable.create(columnsHeader.value, {
        animation: 150,
        direction: 'horizontal',
        onEnd(evt) {
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
            const moved = columns.value.splice(evt.oldIndex, 1)[0]
            columns.value.splice(evt.newIndex, 0, moved)
          }
        },
      })
    }
  })
})


defineOptions({
  name: 'AuditLogList'
})
</script>

<style scoped>
table {
  table-layout: fixed;
  width: 100%;
}
td {
  white-space: normal;
  word-break: break-word;
  max-width: 180px;
}
</style>
