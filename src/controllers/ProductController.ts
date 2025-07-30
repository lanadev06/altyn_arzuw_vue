import { ref, reactive } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/api'
import type { Product, ProductForm } from '@/types/product'

export function ProductController() {
  const products = ref<Product[]>([])
  const pagination = reactive({
    data: [] as Product[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  // ВАЖНО: сортировка по name на сервере всегда сначала кириллица, потом латиница, а внутри каждой группы — по алфавиту (см. backend). Это влияет на отображение списка товаров при сортировке по name.

  async function fetchProducts(
    page = 1,
    search = '',
    sort_by = sortBy.value,
    sort_order = sortOrder.value,
    per_page = pagination.per_page,
  ) {
    loading.value = true
    error.value = ''
    try {
      const res = await getProducts({ page, search, sort_by, sort_order, per_page })
      // Исправление: поддержка структуры с meta (Laravel Resource)
      if (res.meta && Array.isArray(res.data)) {
        pagination.data = res.data
        pagination.current_page = res.meta.current_page || 1
        pagination.last_page = res.meta.last_page || 1
        pagination.total = res.meta.total || 0
        pagination.per_page = res.meta?.per_page || res.per_page || 30
      } else {
        pagination.data = res.data || []
        pagination.current_page = res.current_page || 1
        pagination.last_page = res.last_page || 1
        pagination.total = res.total || 0
        pagination.per_page = res.per_page || 30
      }
      products.value = pagination.data
    } catch (e: any) {
      console.error('❌ Error in fetchProducts:', e)
      error.value = e.message || 'Ошибка загрузки товаров'
    } finally {
      loading.value = false
    }
  }

  async function create(newProduct: ProductForm) {
    loading.value = true
    try {
      const res = await createProduct(newProduct)
      await fetchProducts(pagination.current_page)
      return res
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, updatedProduct: ProductForm) {
    loading.value = true
    try {
      await updateProduct(id, updatedProduct)
      await fetchProducts(pagination.current_page)
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteProduct(id)
      if (pagination.data.length === 1 && pagination.current_page > 1) {
        await fetchProducts(pagination.current_page - 1)
      } else {
        await fetchProducts(pagination.current_page)
      }
    } catch (err: any) {
      // Пробрасываем ошибку дальше для обработки в компоненте
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    pagination,
    loading,
    error,
    sortBy,
    sortOrder,
    fetchProducts,
    create,
    update,
    remove,
  }
}
