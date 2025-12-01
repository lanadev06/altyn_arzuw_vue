<template>
  <div class="stage-list flex flex-col">
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">{{ t('table.total') }}:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || stages.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">{{ t('table.pages') }}:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
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
        <button
          v-if="canCreateEdit()"
          @click="$emit('open-create-modal')"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {{ t('stages.addStage') }}
        </button>
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
                @click="col.sortable ? setSort(col.key) : null"
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
              v-for="(stage, index) in sortedStages"
              :key="stage.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              style="height: 44px"
              @click="editStage(stage)"
            >
              <td
                class="border-r border-gray-200 px-3 py-2 text-center align-middle"
              >
                <input
                  type="checkbox"
                  :value="stage.id"
                  v-model="selectedIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </td>
              <td v-for="(col, colIndex) in columns" :key="`${stage.id}-${col.key}-${colIndex}`"
                  :class="[
                    'border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle',
                    col.key === 'id' ? 'max-w-[100px]' : '',
                    col.key === 'name' ? 'font-medium text-gray-900' : '',
                    col.key === 'created_at' || col.key === 'updated_at' ? 'w-[170px]' : '',
                  ]"
                >
                  <template v-if="col.key === 'id'">
                    <span class="font-mono text-gray-600">{{ stage.id }}</span>
                  </template>

                  <template v-else-if="col.key === 'name'">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        :style="getStageColorStyles(stage.name, stage.color || undefined)"
                      >
                        {{ (stage.display_name || stage.name).charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ stage.display_name || stage.name }}
                        </div>
                        <div class="text-sm text-gray-500">{{ stage.name }}</div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="col.key === 'description'">
                    <span class="text-gray-700">{{ stage.description || '-' }}</span>
                  </template>

                  <template v-else-if="col.key === 'order'">
                    <span class="text-gray-700">{{ stage.order }}</span>
                  </template>

                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(stage.created_at) }}</span>
                  </template>

                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(stage.updated_at) }}</span>
                  </template>
                </td>
              </tr>

            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ t('stages.loading') }}
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && stages.length === 0">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? t('stages.notFound') : t('stages.noStages') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && !error && (pagination?.total || 0) > 0"
        :current-page="pagination?.current_page || 1"
        :last-page="pagination?.last_page || 1"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <StageFormModal
      v-if="props.showCreateModal"
      :stage="null"
      @close="$emit('close-create-modal')"
      @created="handleStageCreated"
    />
    <StageFormModal
      v-if="showEditModal"
      :stage="editingStage"
      @close="showEditModal = false"
      @updated="handleStageUpdated"
      @delete="handleDeleteStage"
    />

    <BulkActionPanel
      :show="hasSelection"
      :count="selectedCount"
      :is-processing="isProcessing"
      @clear="clearSelection"
      @delete="handleBulkDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Sortable from 'sortablejs'
import StageFormModal from './StageFormModal.vue'
import { useBulkActions } from '@/composables/useBulkActions'
import BulkActionPanel from '../../ui/BulkActionPanel.vue'
import Pagination from '../../users/UserList/Pagination.vue'
import StageController from '../../../controllers/StageController'
import { canCreateEdit, canDelete } from '../../../utils/permissions'
import { useToast } from '../../../stores/toast'
import { getStageColorStyles } from '../../../utils/stageColors'
import type { Stage } from '../../../types/stage'

const { t, locale } = useI18n()

const props = defineProps<{
  search?: string
  showCreateModal?: boolean
}>()
const emit = defineEmits(['close-create-modal', 'open-create-modal'])

const toast = useToast()

const pagination = ref<{
  current_page: number
  last_page: number
  total: number
  per_page: number
} | null>(null)

const SORT_KEY = 'stageList_sortBy'
const ORDER_KEY = 'stageList_sortOrder'
const COLUMNS_KEY = 'stageList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY) as 'asc' | 'desc' | null
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('stageList_perPage')

const stages = ref<Stage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const editingStage = ref<Stage | null>(null)
const sortBy = ref('order')
const sortOrder = ref<'asc' | 'desc'>('asc')
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('stageList_currentPage')
const currentPage = ref(savedCurrentPage ? parseInt(savedCurrentPage) : 1)
const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)

const defaultColumns = computed(() => [
  { key: 'id', label: t('stages.columnId'), sortable: true },
  { key: 'name', label: t('stages.columnName'), sortable: true },
  { key: 'description', label: t('stages.columnDescription'), sortable: false },
  { key: 'order', label: t('stages.columnOrder'), sortable: true },
  { key: 'created_at', label: t('stages.columnCreatedAt'), sortable: true },
  { key: 'updated_at', label: t('stages.columnUpdatedAt'), sortable: false },
])

const columns = ref(savedColumns ? JSON.parse(savedColumns) : defaultColumns.value)

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder) sortOrder.value = savedSortOrder

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

const sortedStages = computed(() => {
  const filteredStages = props.search
    ? stages.value.filter(
        (stage) =>
          stage.name.toLowerCase().includes(props.search!.toLowerCase()) ||
          (stage.display_name &&
            stage.display_name.toLowerCase().includes(props.search!.toLowerCase())) ||
          (stage.description &&
            stage.description.toLowerCase().includes(props.search!.toLowerCase())),
      )
    : stages.value

  return filteredStages.sort((a, b) => {
    let aVal: string | number = (a[sortBy.value as keyof Stage] as string | number) || ''
    let bVal: string | number = (b[sortBy.value as keyof Stage] as string | number) || ''

    if (sortBy.value === 'name') {
      aVal = a.display_name || a.name
      bVal = b.display_name || b.name
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// Bulk actions
const {
  selectedIds,
  isProcessing,
  selectAll,
  hasSelection,
  selectedCount,
  clearSelection,
  bulkDelete
} = useBulkActions(sortedStages as any)

async function handleBulkDelete() {
  const result = await bulkDelete('stages')
  if (result.deleted > 0) {
    // Reload stages after deletion
    await fetchStages()
  }
}

function setSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  // При изменении сортировки остаемся на той же странице
}

const columnsHeader = ref<HTMLElement | null>(null)

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

const editStage = (stage: Stage) => {
  editingStage.value = stage
  showEditModal.value = true
}

const fetchStages = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await StageController.getAll()
    stages.value = data
  } catch (err: any) {
    error.value = (err as Error)?.message || t('stages.loadingError')
  } finally {
    loading.value = false
  }
}

const handleStageCreated = async () => {
  emit('close-create-modal')
  await fetchStages()
}

const handleStageUpdated = async () => {
  showEditModal.value = false
  editingStage.value = null
  await fetchStages()
}

const handleDeleteStage = async (stageId: number) => {
  try {
    // Проверяем права доступа
    if (!canDelete()) {
      toast.show(t('errors.noPermission'), 'error')
      return
    }

    // Проверяем токен авторизации
    const token = localStorage.getItem('auth_token')
    if (!token) {
      toast.show(t('errors.authRequired'), 'error')
      return
    }

    await StageController.delete(stageId)
    toast.show(t('stages.stageDeleted'), 'success')
    showEditModal.value = false
    editingStage.value = null
    await fetchStages()
  } catch (err: any) {
    // Показываем детальное сообщение об ошибке
    let errorMessage = t('stages.deleteError')
    
    if (err instanceof Error) {
      // Если есть детальное сообщение от сервера, показываем его
      errorMessage = err.message || errorMessage
      
      // Если ошибка содержит информацию о связанных заказах/продуктах, показываем детали
      if (err.message && (err.message.includes('заказах') || err.message.includes('продуктах'))) {
        errorMessage = err.message
      }
    } else if (err?.response?.data?.message) {
      errorMessage = err.response.data.message
    } else {
      errorMessage = t('stages.unknownError')
    }
    
    toast.show(errorMessage, 'error')
    console.error('Error deleting stage:', err)
  }
}

function goToPage(page: number) {
  if (!pagination.value || !pagination.value.last_page) return
  if (page < 1 || page > pagination.value.last_page) return
  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('stageList_currentPage', page.toString())
  fetchStages()
}

function validatePerPage(val: number) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}

function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('stageList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('stageList_currentPage', '1')
  goToPage(1)
}

onMounted(async () => {
  // Очищаем старые сохранённые колонки для применения переводов
  localStorage.removeItem(COLUMNS_KEY)
  columns.value = defaultColumns.value
  
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      filter: '.no-drag', // Prevent dragging checkbox column
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
  await fetchStages()
})

watch(
  () => props.search,
  () => {
    // Search is handled by computed property
  },
)

watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('stageList_perPage', perPage.value.toString())
  goToPage(1)
})


defineOptions({
  name: 'StageList'
})
</script>
