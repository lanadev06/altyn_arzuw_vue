import { ref } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/api'
import type { Product } from '@/types/product'

export function ProductController() {
  const products = ref<Product[]>([])
  const pagination = ref({
    data: [] as Product[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  async function fetchProducts(
    page = 1,
    search = '',
    sort_by = sortBy.value,
    sort_order = sortOrder.value,
  ) {
    loading.value = true
    error.value = ''
    try {
      const res = await getProducts({ page, search, sort_by, sort_order })

      pagination.value = {
        ...res,
        data: res.data || [],
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        per_page: res.per_page || 10,
      }
      products.value = res.data || []
    } catch (e: any) {
      console.error('❌ Error in fetchProducts:', e)
      error.value = e.message || 'Ошибка загрузки товаров'
    } finally {
      loading.value = false
    }
  }

  async function create(newProduct: Product) {
    loading.value = true
    try {
      await createProduct(newProduct)
      await fetchProducts(pagination.value.current_page)
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, updatedProduct: Product) {
    loading.value = true
    try {
      await updateProduct(id, updatedProduct)
      await fetchProducts(pagination.value.current_page)
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteProduct(id)
      if (pagination.value.data.length === 1 && pagination.value.current_page > 1) {
        await fetchProducts(pagination.value.current_page - 1)
      } else {
        await fetchProducts(pagination.value.current_page)
      }
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
