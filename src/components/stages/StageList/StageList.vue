<template>
  <div class="stage-list flex flex-col">
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Всего:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || stages.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Страницы:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
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
        <button
          v-if="canCreateEdit()"
          @click="$emit('open-create-modal')"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Добавить стадию
        </button>
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
              @click="editStage(stage)"
              style="height: 44px"
            >
              <template v-for="col in columns" :key="col.key">
                <td
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
                        :style="getStageColorStyles(stage.name, stage.color)"
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

                  <template v-else-if="col.key === 'is_active'">
                    <button
                      @click.stop="toggleStageActive(stage.id)"
                      :class="
                        stage.is_active
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      "
                      class="px-2 py-1 rounded text-white text-xs transition-colors"
                      title="Переключить активность"
                    >
                      <span v-if="stage.is_active">✓</span>
                      <span v-else>⏻</span>
                    </button>
                  </template>

                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(stage.created_at) }}</span>
                  </template>

                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(stage.updated_at) }}</span>
                  </template>
                </td>
              </template>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка стадий...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && stages.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Стадии не найдены' : 'Стадии отсутствуют' }}
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
      @submit="handleCreateStage"
    />
    <StageFormModal
      v-if="showEditModal"
      :stage="editingStage"
      @close="showEditModal = false"
      @submit="handleUpdateStage"
      @delete="handleDeleteStage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import Sortable from 'sortablejs'
import StageFormModal from './StageFormModal.vue'
import Pagination from '../../users/UserList/Pagination.vue'
import StageController from '../../../controllers/StageController'
import { canCreateEdit } from '../../../utils/permissions'
import { getStageColorStyles } from '../../../utils/stageColors'
import type { Stage } from '../../../types/stage'

const props = defineProps<{
  search?: string
  showCreateModal?: boolean
}>()
const emit = defineEmits(['close-create-modal', 'open-create-modal'])

const stages = ref<Stage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const editingStage = ref<Stage | null>(null)
const sortBy = ref('order')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(30)
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

const columns = ref(
  savedColumns
    ? JSON.parse(savedColumns)
    : [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Название', sortable: true },
        { key: 'description', label: 'Описание', sortable: false },
        { key: 'order', label: 'Порядок', sortable: true },
        { key: 'is_active', label: 'Статус', sortable: false },
        { key: 'created_at', label: 'Создано', sortable: true },
        { key: 'updated_at', label: 'Обновлено', sortable: false },
      ],
)

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder) sortOrder.value = savedSortOrder

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

function setSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
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
  } catch (err: unknown) {
    error.value = (err as Error)?.message || 'Ошибка загрузки стадий'
    console.error('Error fetching stages:', err)
  } finally {
    loading.value = false
  }
}

const toggleStageActive = async (stageId: number) => {
  try {
    const stage = stages.value.find((s) => s.id === stageId)
    if (!stage) return

    await StageController.update(stageId, { is_active: !stage.is_active })
    await fetchStages()
  } catch (err: unknown) {
    console.error('Ошибка переключения статуса:', err)
  }
}

const handleCreateStage = async (stageData: {
  name: string
  display_name: string
  description?: string
  order?: number
  is_active?: boolean
}) => {
  try {
    await StageController.create(stageData)
    emit('close-create-modal')
    await fetchStages()
  } catch (err: unknown) {
    console.error('Ошибка создания:', err)
  }
}

const handleUpdateStage = async (stageData: {
  name?: string
  display_name?: string
  description?: string
  order?: number
  is_active?: boolean
}) => {
  try {
    if (!editingStage.value) return
    await StageController.update(editingStage.value.id, stageData)
    showEditModal.value = false
    editingStage.value = null
    await fetchStages()
  } catch (err: unknown) {
    console.error('Ошибка обновления:', err)
  }
}

const handleDeleteStage = async (stageId: number) => {
  try {
    await StageController.delete(stageId)
    showEditModal.value = false
    editingStage.value = null
    await fetchStages()
  } catch (err: unknown) {
    console.error('Ошибка удаления:', err)
  }
}

function goToPage(page: number) {
  if (!pagination.value || !pagination.value.last_page) return
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
  fetchStages()
}

function validatePerPage(val: number) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}

function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  goToPage(1)
}

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      onEnd(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex === undefined || newIndex === undefined) return
        const moved = columns.value.splice(oldIndex, 1)[0]
        columns.value.splice(newIndex, 0, moved)
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
</script>
