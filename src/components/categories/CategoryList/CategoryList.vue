<template>
  <div class="category-list flex flex-col">
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
          @click="showCreateModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Добавить категорию
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
                @click="col.sortable ? setSort(col.key, search) : null"
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
              v-for="(category, index) in pagination.data"
              :key="category.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              @click="editCategory(category)"
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
                    <span class="font-mono text-gray-600">{{ category.id }}</span>
                  </template>

                  <template v-else-if="col.key === 'name'">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-600 font-medium"
                      >
                        {{ category.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ category.name }}
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(category.created_at) }}</span>
                  </template>

                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(category.updated_at) }}</span>
                  </template>
                </td>
              </template>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка категорий...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && (!pagination.data || pagination.data.length === 0)">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Категории не найдены' : 'Категории отсутствуют' }}
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

    <CategoryFormModal
      v-if="showCreateModal"
      :category="null"
      @close="showCreateModal = false"
      @submit="handleCreateCategory"
    />

    <CategoryFormModal
      v-if="showEditModal"
      :category="editingCategory"
      @close="showEditModal = false"
      @delete="handleDeleteCategory"
      @saved="handleCategorySaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import UIButton from '@/components/ui/UIButton.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import CategoryFormModal from './CategoryFormModal.vue'
import categoryController from '@/controllers/categoryControllerInstance'
import type { Category } from '@/types/category'
import { canCreateEdit, canDelete } from '@/utils/permissions'
import { toast } from '@/stores/toast'
import Sortable from 'sortablejs'

const props = defineProps({
  search: { type: String, default: '' },
})

const SORT_KEY = 'categoryList_sortBy'
const ORDER_KEY = 'categoryList_sortOrder'
const COLUMNS_KEY = 'categoryList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('categoryList_perPage')

// Тип для колонок
interface Column {
  key: string
  label: string
  sortable: boolean
}

// Колонки таблицы
const columns = ref(
  savedColumns
    ? JSON.parse(savedColumns)
    : [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Название', sortable: true },
        { key: 'created_at', label: 'Создано', sortable: true },
        { key: 'updated_at', label: 'Обновлено', sortable: false },
      ],
)

// Получаем переменные из контроллера
const { pagination, loading, error, fetchCategories, sortBy, sortOrder, update, remove } =
  categoryController

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder)
  sortOrder.value = savedSortOrder as 'asc' | 'desc'

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingCategory = ref<Category | null>(null)
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('categoryList_currentPage')
const currentPage = ref(savedCurrentPage ? parseInt(savedCurrentPage) : 1)
const columnsHeader = ref<HTMLElement | null>(null)

const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
function validatePerPage(val: any) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('categoryList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('categoryList_currentPage', '1')
  goToPage(1)
}
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('categoryList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('categoryList_currentPage', '1')
  goToPage(1)
})

function setSort(key: string, search = '') {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  // При изменении сортировки возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('categoryList_currentPage', '1')
  fetchCategories(1, search, sortBy.value, sortOrder.value, perPage.value)
}

function goToPage(page: number) {
  if (!pagination || typeof pagination.last_page === 'undefined') return
  if (page < 1 || page > pagination.last_page) return
  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('categoryList_currentPage', page.toString())
  fetchCategories(page, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function editCategory(category: Category) {
  if (!canCreateEdit()) return

  if (!category) {
    return
  }

  editingCategory.value = category
  showEditModal.value = true
}



async function deleteCategory(category: Category) {
  if (!canDelete()) return

  if (confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
    try {
      await remove(category.id)
      toast.show('Категория успешно удалена!', 'success')
      fetchCategories(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
    } catch (error: any) {
      toast.show(error.message || 'Ошибка удаления категории', 'error')
    }
  }
}

// Обработчики событий от CategoryFormModal
async function handleCreateCategory(categoryData: any) {
  try {
    await categoryController.create(categoryData)
    showCreateModal.value = false
    fetchCategories(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
  } catch (err) {
  }
}

async function handleCategorySaved() {
  showEditModal.value = false
  fetchCategories(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
}

async function handleDeleteCategory(categoryId: number) {
  try {
    await remove(categoryId)
    showEditModal.value = false
    fetchCategories(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
  } catch (err) {
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

// Загружаем данные при монтировании
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
  fetchCategories(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
})

// Отслеживаем изменения поиска
watch(
  () => props.search,
  (newSearch) => {
    // При изменении поиска возвращаемся на первую страницу
    currentPage.value = 1
    localStorage.setItem('categoryList_currentPage', '1')
    fetchCategories(currentPage.value, newSearch, sortBy.value, sortOrder.value, perPage.value)
  },
)
</script>
