<template>
  <div class="product-list flex flex-col h-full">
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-3">
        <!-- Фильтр по категориям -->
        <select
          v-model="selectedCategory"
          @change="filterByCategory"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 200px"
        >
          <option value="">Все категории</option>
          <option v-for="category in availableCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      <UIButton v-if="canCreateEdit()" @click="showCreateModal = true" variant="primary"
        >Добавить товар</UIButton
      >
    </div>

    <div class="flex-1 flex flex-col min-h-0">
      <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
        <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
          <div class="flex items-center gap-1">
            <span class="text-gray-500 font-semibold">Всего:</span>
            <span class="text-blue-600 font-bold">{{
              pagination && pagination.total ? pagination.total : 0
            }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-gray-500 font-semibold">Страницы:</span>
            <span class="text-blue-600 font-bold">{{
              pagination && pagination.last_page ? pagination.last_page : 1
            }}</span>
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
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                v-for="col in columns"
                :key="col.key"
                @click="col.sortable ? setSort(col.key, props.search) : null"
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
              v-for="(product, index) in pagination && pagination.data
                ? pagination.data.filter((p) => p)
                : []"
              :key="product && product.id ? product.id : index"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              @click="editProduct(product)"
              style="height: 44px"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'id'">
                  <span class="font-mono text-gray-600">{{ product.id }}</span>
                </template>
                <template v-else-if="col.key === 'name'">
                  <span class="font-medium text-gray-900">{{ product.name }}</span>
                </template>
                <template v-else-if="col.key === 'categories'">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="category in product.categories"
                      :key="category.id"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {{ category.name }}
                    </span>
                    <span v-if="!product.categories || product.categories.length === 0" class="text-gray-400 text-sm">
                      Нет категорий
                    </span>
                  </div>
                </template>
                <!-- Колонки для назначений -->
                <template v-else-if="col.type === 'stage_assignments'">
                  <AssignmentDisplay
                    :assignments="getStageAssignments(product, col.stageId, col.roleType)"
                    :role-type="col.roleType"
                    empty-message="Не назначены"
                  />
                  <!-- Отладочная информация -->
                  <div v-if="false" class="text-xs text-gray-400">
                    Debug:
                    {{ getStageAssignments(product, col.stageId, col.roleType).length }}
                    assignments
                    <br />
                    Product assignments: {{ product.assignments?.length || 0 }}
                    <br />
                    Role: {{ col.roleType }}
                  </div>
                </template>
                <template v-else-if="col.key === 'created_at'">
                  <span class="text-gray-600">{{ formatDate(product.created_at) }}</span>
                </template>
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500">
                Загрузка товаров...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && pagination.data.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500">
                {{ props.search ? 'Товары не найдены' : 'Товары отсутствуют' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="
          !loading &&
          !error &&
          pagination &&
          typeof pagination.last_page !== 'undefined' &&
          pagination.total > 0
        "
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <ProductFormModal
      v-if="showCreateModal"
      :product="null"
      @close="showCreateModal = false"
      @submit="handleCreateProduct"
    />

    <ProductFormModal
      v-if="showEditModal"
      :product="editingProduct"
      @close="showEditModal = false"
      @delete="handleDeleteProduct"
      @saved="handleProductSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import ProductFormModal from './ProductFormModal.vue'
import AssignmentDisplay from './AssignmentDisplay.vue'
import productController from '@/controllers/productControllerInstance'
import type { Product, ProductForm, ProductAssignment } from '@/types/product'
import type { Stage } from '@/types/stage'
import { canCreateEdit } from '@/utils/permissions'
import { toast } from '@/stores/toast'
import { getAllStages, getAllCategories } from '@/services/api'

const props = defineProps({
  search: { type: String, default: '' },
})

const SORT_KEY = 'productList_sortBy'
const ORDER_KEY = 'productList_sortOrder'
const COLUMNS_KEY = 'productList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('productList_perPage')

// Переменные для фильтра по категориям
const selectedCategory = ref('')
const availableCategories = ref<any[]>([])

// Тип для колонок
interface Column {
  key: string
  label: string
  sortable: boolean
  type?: string
  stageId?: number
  roleType?: string
  color?: string
}

// Базовые колонки (без статичных колонок для ролей)
const baseColumns: Column[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Название', sortable: true },
  { key: 'categories', label: 'Категории', sortable: false },
  { key: 'created_at', label: 'Создано', sortable: true },
]

// Сначала определяем pagination и другие переменные из контроллера
const { pagination, loading, error, fetchProducts, sortBy, sortOrder, update, remove } =
  productController

// Теперь определяем dynamicColumns после pagination
const dynamicColumns = computed<Column[]>(() => {
  try {
    // Создаем базовые колонки
    const columns = [...baseColumns]

    // Получаем все уникальные стадии с назначениями из всех продуктов
    const stageAssignments = new Map()

    // Сначала собираем все стадии из всех продуктов
    if (pagination.data) {
      pagination.data.forEach((product: any, index: number) => {
        if (product.available_stages) {
          product.available_stages.forEach((stage: any) => {
            // Исключаем служебные стадии
            const serviceStages = ['draft', 'completed', 'cancelled', 'final']
            if (serviceStages.includes(stage.name)) {
              return
            }

            if (stage.roles && stage.roles.length > 0) {
              stage.roles.forEach((role: any) => {
                // Исключаем роль die_cutting_operator из колонок
                if (role.name === 'die_cutting_operator') {
                  return
                }

                const key = `${stage.id}_${role.name}`
                if (!stageAssignments.has(key)) {
                  stageAssignments.set(key, {
                    stageId: stage.id,
                    stageName: stage.display_name,
                    roleType: role.name,
                    roleDisplayName: role.display_name,
                    color: stage.color,
                  })
                }
              })
            }
          })
        }
      })
    }

    // Создаем колонки для каждой стадии с назначениями
    stageAssignments.forEach((assignment, key) => {
      const column = {
        key: `stage_${key}`,
        label: assignment.stageName, // Только display_name стадии
        sortable: false,
        type: 'stage_assignments',
        stageId: assignment.stageId,
        roleType: assignment.roleType,
        color: assignment.color,
      }
      columns.push(column)
    })

    // Убираем статичные колонки - используем только динамические

    return columns
  } catch (error) {
    return baseColumns
  }
})

// Инициализируем columns из localStorage или используем dynamicColumns
const savedColumnsData = savedColumns ? JSON.parse(savedColumns) : null
const columns = ref<Column[]>(savedColumnsData || [])

// Если нет сохраненных колонок, инициализируем из dynamicColumns
if (!savedColumnsData) {
  watch(
    dynamicColumns,
    (newColumns) => {
      if (newColumns.length > 0 && columns.value.length === 0) {
        columns.value = [...newColumns]
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      }
    },
    { immediate: true },
  )
}

// Функция для получения назначений для конкретной стадии и роли
function getStageAssignments(product: Product, stageId: number | undefined, roleType: string) {
  // Сначала пытаемся получить назначения из массива assignments
  if (product.assignments) {
    const filteredAssignments = product.assignments.filter(
      (assignment) => assignment.role_type === roleType && assignment.is_active,
    )

    if (filteredAssignments.length > 0) {
      return filteredAssignments
    }
  }

  return []
}

// Функция для отображения названий ролей
function getRoleDisplayName(roleType: string): string {
  // Специальные названия для известных ролей
  const names: Record<string, string> = {
    designer: 'Дизайнеры',
    print_operator: 'Печатники',
    engraving_operator: 'Гравировщики',
    workshop_worker: 'Работники цеха',
    die_cutting_operator: 'Операторы высечки',
  }

  // Если роль не найдена, автоматически создаем красивое название
  if (!names[roleType]) {
    return (
      roleType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + 'ы'
    )
  }

  return names[roleType]
}

// Обновляем columns при изменении dynamicColumns (для новых колонок)
watch(
  dynamicColumns,
  (newColumns) => {
    if (newColumns.length > 0) {
      // Если columns пустые, инициализируем их
      if (columns.value.length === 0) {
        columns.value = [...newColumns]
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      } else {
        // Если есть новые колонки, добавляем их к существующим
        const existingKeys = new Set(columns.value.map((col) => col.key))
        const newColumnsToAdd = newColumns.filter((col) => !existingKeys.has(col.key))

        if (newColumnsToAdd.length > 0) {
          columns.value.push(...newColumnsToAdd)
          localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
        }
      }
    }
  },
  { immediate: true },
)

// Принудительно устанавливаем сортировку по имени, если сохранена сортировка по ID
if (savedSortBy === 'id') {
  sortBy.value = 'name'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, 'name')
  localStorage.setItem(ORDER_KEY, 'asc')
} else if (savedSortBy && sortBy.value !== savedSortBy) {
  sortBy.value = savedSortBy
}
if (savedSortOrder && sortOrder.value !== savedSortOrder && savedSortBy !== 'id')
  sortOrder.value = savedSortOrder as 'asc' | 'desc'

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProduct = ref<Product | null>(null)
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('productList_currentPage')
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
  localStorage.setItem('productList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('productList_currentPage', '1')
  goToPage(1)
}
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('productList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('productList_currentPage', '1')
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
  localStorage.setItem('productList_currentPage', '1')
  fetchProducts(1, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
}

function resetSettings() {
  columns.value = [...baseColumns]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'name'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  perPage.value = 30
  localStorage.setItem('productList_perPage', perPage.value.toString())
  currentPage.value = 1
  selectedCategory.value = '' // Сбрасываем фильтр по категориям
      fetchProducts(1, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
}

function goToPage(page: number) {
  if (!pagination || typeof pagination.last_page === 'undefined') return
  if (page < 1 || page > pagination.last_page) return
  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('productList_currentPage', page.toString())
      fetchProducts(page, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
}

function editProduct(product: Product) {
  if (!canCreateEdit()) return

  // Защита от null/undefined
  if (!product) {
    return
  }

  editingProduct.value = product
  showEditModal.value = true
}

async function handleCreateProduct(newProduct: Product) {
  showCreateModal.value = false
  currentPage.value = 1
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
}

async function handleProductSaved() {
  showEditModal.value = false

  // Принудительно очищаем кэш и обновляем список
  // Добавляем небольшую задержку для обновления данных на сервере
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Обновляем список с принудительным сбросом кэша
  await fetchProducts(
    currentPage.value,
    props.search,
    sortBy.value,
    sortOrder.value,
    perPage.value,
    true,
    selectedCategory.value,
  )

  // Принудительно обновляем колонки после обновления данных
  await nextTick()
  if (dynamicColumns.value.length > 0) {
    columns.value = [...dynamicColumns.value]
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  }
}

async function handleDeleteProduct(productId: number) {
  try {
    await remove(productId)
    showEditModal.value = false
    editingProduct.value = null
    if (pagination?.data?.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    toast.show('Товар успешно удален!', 'success')
  } catch (e: any) {
    // Обрабатываем ошибки от сервера
    let message = 'Произошла неизвестная ошибка при удалении товара'

    if (e?.response?.data?.message) {
      // Ошибка от Laravel (например, товар используется в заказах)
      message = e.response.data.message
    } else if (e.message && e.message.includes('Ошибка удаления товара')) {
      // Если ошибка 404 — просто закрыть модалку и обновить список
      toast.show('Товар уже был удалён')
      showEditModal.value = false
      editingProduct.value = null
      // Обновить список, чтобы убрать "мертвый" товар
      await fetchProducts(
        currentPage.value,
        props.search,
        sortBy.value,
        sortOrder.value,
        perPage.value,
        false,
        selectedCategory.value,
      )
      return
    } else if (e instanceof Error && e.message) {
      message = `Ошибка удаления товара: ${e.message}`
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

// Функция фильтрации по категориям
function filterByCategory() {
  // При изменении фильтра возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('productList_currentPage', '1')
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
}

// Функция загрузки категорий
async function loadCategories() {
  try {
    const categoriesData = await getAllCategories()
    availableCategories.value = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).data || []
  } catch (error) {
    availableCategories.value = []
  }
}

watch(
  () => props.search,
  (newVal) => {
    // При изменении поиска возвращаемся на первую страницу
    currentPage.value = 1
    localStorage.setItem('productList_currentPage', '1')
    selectedCategory.value = '' // Сбрасываем фильтр по категориям при поиске
    fetchProducts(1, newVal, sortBy.value, sortOrder.value, perPage.value)
  },
)

onMounted(async () => {
  // Загружаем категории для фильтра
  await loadCategories()
  
  // Инициализируем колонки из localStorage, если они есть
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
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value, false, selectedCategory.value)
})


defineOptions({
  name: 'ProductList'
})
</script>
