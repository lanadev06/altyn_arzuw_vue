<template>
  <div class="product-list flex flex-col h-full">
    <div class="flex justify-end items-center mb-3">
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
                v-for="col in dynamicColumns"
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
                v-for="col in dynamicColumns"
                :key="col.key"
                class="border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'id'">
                  <span class="font-mono text-gray-600">{{ product.id }}</span>
                </template>
                <template v-else-if="col.key === 'name'">
                  <span class="font-medium text-gray-900">{{ product.name }}</span>
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
                    {{ getStageAssignments(product, col.stageId, col.roleType).length }} assignments
                  </div>
                </template>
                <template v-else-if="col.key === 'created_at'">
                  <span class="text-gray-600">{{ formatDate(product.created_at) }}</span>
                </template>
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="dynamicColumns.length" class="px-3 py-8 text-center text-gray-500">
                Загрузка товаров...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="dynamicColumns.length" class="px-3 py-8 text-center text-red-500">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && pagination.data.length === 0">
              <td :colspan="dynamicColumns.length" class="px-3 py-8 text-center text-gray-500">
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
      @submit="handleUpdateProduct"
      @delete="handleDeleteProduct"
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
import type { Product, ProductForm } from '@/types/product'
import type { Stage } from '@/types/stage'
import { canCreateEdit } from '@/utils/permissions'
import { toast } from '@/stores/toast'
import { getAllStages } from '@/services/api'

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

// Загружаем все доступные стадии для создания колонок
const availableStages = ref<Stage[]>([])

// Безопасная функция для получения доступных стадий
const getAvailableStages = () => {
  return availableStages.value || []
}

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
  { key: 'created_at', label: 'Создано', sortable: true },
]

// Сначала определяем pagination и другие переменные из контроллера
const { pagination, loading, error, fetchProducts, sortBy, sortOrder, update, remove } =
  productController

// Теперь определяем dynamicColumns после pagination
const dynamicColumns = computed<Column[]>(() => {
  try {
    const columns = [...baseColumns]

    // Получаем все уникальные стадии с назначениями из всех продуктов
    const stageAssignments = new Map()

    // Сначала собираем все стадии из всех продуктов
    if (pagination.value?.data) {
      pagination.value.data.forEach((product, index) => {
        if (product.available_stages) {
          console.log(
            `🔍 Product ${product.id} stages:`,
            product.available_stages.map((s) => ({
              id: s.id,
              name: s.display_name,
              roles_count: s.roles?.length || 0,
              roles: s.roles?.map((r) => r.name) || [],
            })),
          )

          product.available_stages.forEach((stage) => {
            if (stage.roles && stage.roles.length > 0) {
              stage.roles.forEach((role) => {
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
            } else {
              console.log(`⚠️ Stage ${stage.id} (${stage.display_name}) has no roles`)
            }
          })
        } else {
          console.log(`  ⚠️ Product ${product.id} has no available_stages`)
        }
      })
    }

    // Дополнительно добавляем стадии из глобального списка стадий (если есть)
    // Это обеспечит появление колонок для новых стадий, даже если они еще не назначены ни одному продукту
    const globalStages = getAvailableStages()
    if (globalStages.length > 0) {
      globalStages.forEach((stage) => {
        if (stage.roles && stage.roles.length > 0) {
          stage.roles.forEach((role) => {
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
      console.log(`📋 Created column:`, column)
    })

    console.log(
      `🎯 Final columns: ${columns.length}`,
      columns.map((c) => c.label),
    )

    // Убираем статичные колонки - используем только динамические
    console.log(`🎯 Final dynamic columns: ${columns.length}`)

    return columns
  } catch (error) {
    console.error('❌ Error building dynamic columns:', error)
    return baseColumns
  }
})

// Функция для получения назначений для конкретной стадии и роли
function getStageAssignments(product: Product, stageId: number, roleType: string) {
  // Сначала пытаемся получить назначения из массива assignments
  if (product.assignments) {
    const filteredAssignments = product.assignments.filter(
      (assignment) => assignment.role_type === roleType && assignment.is_active,
    )

    console.log(
      `🔍 Product ${product.id}, role ${roleType}: found ${filteredAssignments.length} assignments from assignments array`,
      filteredAssignments.map((a) => ({
        id: a.id,
        user: a.user?.name,
        role_type: a.role_type,
        is_active: a.is_active,
      })),
    )

    if (filteredAssignments.length > 0) {
      return filteredAssignments
    }
  }

  // Fallback: проверяем отдельные поля для ролей
  const roleFields = {
    designer: product.designers,
    print_operator: product.print_operators,
    engraving_operator: product.engraving_operators,
    workshop_worker: product.workshop_workers,
  }

  const roleData = roleFields[roleType as keyof typeof roleFields]

  if (roleData && Array.isArray(roleData)) {
    console.log(
      `🔍 Product ${product.id}, role ${roleType}: found ${roleData.length} users from ${roleType} field`,
      roleData.map((u) => ({ id: u.id, name: u.name })),
    )

    // Преобразуем пользователей в формат ProductAssignment
    return roleData.map((user) => ({
      id: 0,
      role_type: roleType,
      user: user,
      user_id: user.id,
      is_active: true,
    }))
  }

  console.log(`🔍 Product ${product.id}, role ${roleType}: no assignments found`)
  return []
}

// Функция для отображения названий ролей
function getRoleDisplayName(roleType: string): string {
  // Специальные названия для известных ролей
  const names = {
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

const columns = ref(savedColumns ? JSON.parse(savedColumns) : baseColumns)

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder) sortOrder.value = savedSortOrder

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProduct = ref<Product | null>(null)
const currentPage = ref(1)
const columnsHeader = ref<HTMLElement | null>(null)

const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
function validatePerPage(val) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('productList_perPage', perPage.value.toString())
  goToPage(1)
}
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('productList_perPage', perPage.value.toString())
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
  fetchProducts(1, search, sortBy.value, sortOrder.value, perPage.value)
}

function resetSettings() {
  columns.value = [...baseColumns]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'id'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  perPage.value = 30
  localStorage.setItem('productList_perPage', perPage.value.toString())
  currentPage.value = 1
  fetchProducts(1, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function goToPage(page: number) {
  if (!pagination || typeof pagination.last_page === 'undefined') return
  if (page < 1 || page > pagination.last_page) return
  currentPage.value = page
  fetchProducts(page, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function editProduct(product: Product) {
  if (!canCreateEdit()) return

  // Защита от null/undefined
  if (!product) {
    console.error('❌ editProduct: product is null or undefined')
    return
  }

  console.log('Editing product:', {
    id: product.id,
    name: product.name,
    designers: product.designers,
    print_operators: product.print_operators,
    engraving_operators: product.engraving_operators,
    workshop_workers: product.workshop_workers,
  })

  editingProduct.value = product
  showEditModal.value = true

  console.log('🔧 Modal state after setting:', {
    showEditModal: showEditModal.value,
    editingProduct: editingProduct.value?.id,
    canCreateEdit: canCreateEdit(),
  })
}

async function handleCreateProduct(newProduct: Product) {
  showCreateModal.value = false
  currentPage.value = 1
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
}

async function handleUpdateProduct(updatedProduct: Product) {
  console.log('handleUpdateProduct called with:', updatedProduct)

  // Новая структура для Laravel API
  const productForm: ProductForm = {
    name: updatedProduct.name,
    // Поддержка старых полей для совместимости
    has_design_stage: updatedProduct.has_design_stage,
    has_print_stage: updatedProduct.has_print_stage,
    has_engraving_stage: updatedProduct.has_engraving_stage,
    has_workshop_stage: updatedProduct.has_workshop_stage,
  }

  console.log('💾 Sending product to API:', productForm)

  await update(updatedProduct.id, productForm)
  showEditModal.value = false

  console.log('✅ Product updated, refreshing list...')
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
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
    console.error('❌ Ошибка удаления товара:', productId, e)

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

watch(
  () => props.search,
  (newVal) => {
    currentPage.value = 1
    fetchProducts(1, newVal, sortBy.value, sortOrder.value, perPage.value)
  },
)

onMounted(async () => {
  // Загружаем все доступные стадии для создания колонок
  try {
    const stagesResult = await getAllStages()
    availableStages.value = stagesResult.data || stagesResult || []
    console.log('📋 Loaded available stages for columns:', availableStages.value.length)
  } catch (error) {
    console.error('❌ Failed to load stages for columns:', error)
  }

  // Принудительно сбрасываем productList_columns в localStorage, чтобы обновить колонки
  localStorage.removeItem('productList_columns')
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
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
})
</script>
