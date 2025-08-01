import { ref, reactive } from 'vue'
import { API_CONFIG } from '../config/api'
import { handle401Error } from '../utils/auth'
import type {
  Order,
  OrderForm,
  OrderUpdateForm,
  StageUpdateForm,
  OrderAssignmentCreate,
} from '../types/order'

// Создаем синглтон экземпляр
const orders = ref<Order[]>([])
const pagination = reactive({
  data: [] as Order[],
  current_page: 1,
  last_page: 1,
  total: 0,
  per_page: 30,
})
const loading = ref(false)
const error = ref('')
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Вспомогательная функция для обработки ответов с проверкой 401
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    handle401Error('Сессия истекла. Необходимо войти в систему заново.')
    throw new Error('Сессия истекла. Необходимо войти в систему заново.')
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

const fetchOrders = async (
  page = 1,
  sort_by = sortBy.value,
  sort_order = sortOrder.value,
  stage?: string,
  is_archived?: boolean,
  search?: string,
  assignment_status?: string,
  per_page = pagination.per_page,
) => {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      sort_by,
      sort_order,
      stage,
      is_archived,
      search,
      assignment_status,
      per_page,
    }
    const res = await getAll(params)
    pagination.data = res.data || []
    pagination.current_page = res.current_page || 1
    pagination.last_page = res.last_page || 1
    pagination.total = res.total || 0
    pagination.per_page = res.per_page || 30
    orders.value = res.data || []
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Ошибка загрузки заказов'
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

const fetchAllOrdersForKanban = async (assignment_status?: string) => {
  loading.value = true
  error.value = ''
  try {
    // Загружаем первую страницу для получения информации о пагинации
    const firstPageParams: any = {
      page: 1,
      sort_by: 'id',
      sort_order: 'desc',
      per_page: 1000,
    }
    if (assignment_status) firstPageParams.assignment_status = assignment_status

    const firstPageRes = await getAll(firstPageParams)
    // (логирование или обработка, если нужно)

    // Если есть больше страниц, загружаем их все
    if (firstPageRes.last_page > 1) {
      let allOrders = [...(firstPageRes.data || [])]

      for (let page = 2; page <= firstPageRes.last_page; page++) {
        const pageParams = { ...firstPageParams, page }
        const pageRes = await getAll(pageParams)
        allOrders = [...allOrders, ...(pageRes.data || [])]
      }

      orders.value = allOrders
    } else {
      orders.value = firstPageRes.data || []
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Ошибка загрузки заказов'
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

const createOrder = async (data: OrderForm) => {
  loading.value = true
  try {
    const result = await create(data)
    await fetchOrders(pagination.current_page)
    return result // Возвращаем результат создания заказа (например, { id: ... })
  } finally {
    loading.value = false
  }
}

const updateOrder = async (id: number, data: OrderUpdateForm) => {
  loading.value = true
  try {
    await update(id, data)
    await fetchOrders(pagination.current_page)
  } finally {
    loading.value = false
  }
}

const removeOrder = async (id: number) => {
  loading.value = true
  try {
    await remove(id)
    if (pagination.data.length === 1 && pagination.current_page > 1) {
      await fetchOrders(pagination.current_page - 1)
    } else {
      await fetchOrders(pagination.current_page)
    }
  } finally {
    loading.value = false
  }
}

const getAll = async (params?: {
  project_id?: number
  stage?: string
  page?: number
  sort_by?: string
  sort_order?: string
  is_archived?: boolean
  per_page?: number
  search?: string
  assignment_status?: string
}) => {

  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append('project_id', params.project_id.toString())
  if (params?.stage) queryParams.append('stage', params.stage)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order)
  if (params?.is_archived !== undefined)
    queryParams.append('is_archived', params.is_archived.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.assignment_status) queryParams.append('assignment_status', params.assignment_status)

  const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const endpoint = `/orders${query}`


  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  const result = await apiRequest(endpoint)


  return result
}

const getById = async (id: number) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest(`/orders/${id}`)
}

const create = async (data: OrderForm) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const update = async (id: number, data: OrderUpdateForm) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const updateStage = async (id: number, data: StageUpdateForm) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest(`/orders/${id}/stage`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const moveToNextStage = async (id: number) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest(`/orders/${id}/next-stage`, {
    method: 'POST',
  })
}

const remove = async (id: number) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest(`/orders/${id}`, {
    method: 'DELETE',
  })
}

const createProjectWithOrders = async (data: {
  title: string
  client_id: number
  orders: unknown[]
}) => {
  // Import apiRequest dynamically to avoid circular dependencies
  const { apiRequest } = await import('../services/api')
  return await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// --- SINGLETON STATE ---
const controller = {
  orders,
  pagination,
  loading,
  error,
  sortBy,
  sortOrder,
  fetchOrders,
  fetchAllOrdersForKanban,
  createOrder,
  updateOrder,
  removeOrder,
  getAll,
  getById,
  create,
  update,
  updateStage,
  moveToNextStage,
  remove,
  createProjectWithOrders,
}

export function OrderController() {
  return controller
}
