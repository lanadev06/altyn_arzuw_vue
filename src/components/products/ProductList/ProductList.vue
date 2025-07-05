<template>
  <div class="product-list flex flex-col h-full">
    <div class="flex justify-end items-center mb-3">
      <UIButton @click="showCreateModal = true" variant="primary">Добавить товар</UIButton>
    </div>

    <div class="flex-1 flex flex-col min-h-0">
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
              v-for="(product, index) in pagination.data"
              :key="product.id"
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
                <template v-else-if="col.key === 'designer'">
                  <span class="text-gray-700">{{ product.designer?.name || '-' }}</span>
                </template>
                <template v-else-if="col.key === 'is_workshop_required'">
                  <span :class="product.is_workshop_required ? 'text-green-600' : 'text-gray-400'">
                    {{ product.is_workshop_required ? 'Да' : 'Нет' }}
                  </span>
                </template>
                <template v-else-if="col.key === 'workshop_type'">
                  <span class="text-gray-700">
                    {{ getWorkshopTypeLabel(product.workshop_type) }}
                  </span>
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
        v-if="!loading && !error && pagination.total > 0"
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
import { ref, watch, onMounted, nextTick } from 'vue'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import ProductFormModal from './ProductFormModal.vue'
import { ProductController } from '@/controllers/ProductController'
import type { Product } from '@/types/product'

const props = defineProps({
  search: { type: String, default: '' },
})

const columns = ref([
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Название', sortable: true },
  { key: 'designer', label: 'Дизайнер', sortable: false },
  { key: 'is_workshop_required', label: 'Требуется цех', sortable: true },
  { key: 'workshop_type', label: 'Тип цеха', sortable: true },
  { key: 'created_at', label: 'Создано', sortable: true },
])

const { pagination, loading, error, fetchProducts, sortBy, sortOrder, create, update, remove } =
  ProductController()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProduct = ref<Product | null>(null)
const currentPage = ref(1)
const columnsHeader = ref<HTMLElement | null>(null)

function setSort(key: string, search = '') {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  fetchProducts(1, search, sortBy.value, sortOrder.value)
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
  fetchProducts(page, props.search, sortBy.value, sortOrder.value)
}

function editProduct(product: Product) {
  editingProduct.value = product
  showEditModal.value = true
}

async function handleCreateProduct(newProduct: Product) {
  await create(newProduct)
  showCreateModal.value = false
  currentPage.value = 1
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleUpdateProduct(updatedProduct: Product) {
  await update(updatedProduct.id, updatedProduct)
  showEditModal.value = false
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleDeleteProduct(productId: number) {
  await remove(productId)
  showEditModal.value = false
  if (pagination.value.data.length === 1 && currentPage.value > 1) {
    currentPage.value--
  }
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value)
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

function getWorkshopTypeLabel(type: string | null | undefined) {
  if (!type) return '-'
  const labels = {
    montage: 'Монтаж',
    binding: 'Переплет',
  }
  return labels[type as keyof typeof labels] || type
}

watch(
  () => props.search,
  (newVal) => {
    currentPage.value = 1
    fetchProducts(1, newVal, sortBy.value, sortOrder.value)
  },
)

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
      },
    })
  }
  fetchProducts(currentPage.value, props.search, sortBy.value, sortOrder.value)
})
</script>
