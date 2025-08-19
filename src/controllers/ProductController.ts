import { ref, reactive } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/api'
import type { Product } from '@/types/api'
import type { ProductForm } from '@/types/product'

export function useProductController() {
  const products = ref<Product[]>([])
  const pagination = reactive({
    data: [] as Product[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
    from: 0,
    to: 0,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('id')
  const sortOrder = ref('desc')

  async function fetchProducts(
    page = 1,
    search = '',
    sortByParam = 'id',
    sortOrderParam = 'desc',
    per_page = 30,
  ) {
    sortBy.value = sortByParam
    sortOrder.value = sortOrderParam
    loading.value = true
    error.value = ''
    try {
      const res = await getProducts({
        page: String(page),
        search,
        per_page: String(per_page),
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
      })
      pagination.data = res.data
      pagination.current_page = res.current_page
      pagination.last_page = res.last_page
      pagination.total = res.total
      pagination.per_page = res.per_page
      pagination.from = res.from
      pagination.to = res.to
      products.value = res.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки продуктов'
    } finally {
      loading.value = false
    }
  }

  // Compatibility method for existing components
  async function fetchProductsWithSort(
    page = 1,
    search = '',
    sortByParam = 'id',
    sortOrderParam = 'desc',
    per_page = 30,
  ) {
    sortBy.value = sortByParam
    sortOrder.value = sortOrderParam
    return await fetchProducts(page, search, sortByParam, sortOrderParam, per_page)
  }

  function setSort(key: string, search = '') {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    fetchProducts(1, search, sortBy.value, sortOrder.value)
  }

  async function create(product: Partial<Product> | ProductForm) {
    loading.value = true
    try {
      const created = await createProduct(product as any) // Type assertion for compatibility
      await fetchProducts(pagination.current_page)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, product: Partial<Product> | ProductForm) {
    loading.value = true
    try {
      const updated = await updateProduct(id, product as any) // Type assertion for compatibility
      await fetchProducts(pagination.current_page)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteProduct(id)
      await fetchProducts(pagination.current_page)
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
    fetchProductsWithSort,
    setSort,
    create,
    update,
    remove,
  }
}

export function ProductController() {
  return useProductController()
}
