import { ref, reactive } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import type { Category } from '@/types/category'

export function useCategoryController() {
  const categories = ref<Category[]>([])
  const pagination = reactive({
    data: [] as Category[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
    from: 0,
    to: 0,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('name')
  const sortOrder = ref('asc')

  async function fetchCategories(
    page = 1,
    search = '',
    sortByParam = 'name',
    sortOrderParam = 'asc',
    per_page = 30,
    forceRefresh = false,
  ) {
    sortBy.value = sortByParam
    sortOrder.value = sortOrderParam
    loading.value = true
    error.value = ''
    try {
      const res = await getCategories({
        page: String(page),
        search,
        per_page: String(per_page),
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        forceRefresh,
      })
      pagination.data = res.data
      pagination.current_page = res.current_page
      pagination.last_page = res.last_page
      pagination.total = res.total
      pagination.per_page = res.per_page
      pagination.from = res.from
      pagination.to = res.to
      categories.value = res.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки категорий'
    } finally {
      loading.value = false
    }
  }

  function setSort(key: string, search = '') {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    fetchCategories(1, search, sortBy.value, sortOrder.value)
  }

  async function create(category: Partial<Category>) {
    loading.value = true
    try {
      const created = await createCategory(category as any)
      await fetchCategories(pagination.current_page)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, category: Partial<Category>) {
    loading.value = true
    try {
      const updated = await updateCategory(id, category as any)
      await fetchCategories(pagination.current_page)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteCategory(id)
      await fetchCategories(pagination.current_page)
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    pagination,
    loading,
    error,
    sortBy,
    sortOrder,
    fetchCategories,
    setSort,
    create,
    update,
    remove,
  }
}

export function CategoryController() {
  return useCategoryController()
}









