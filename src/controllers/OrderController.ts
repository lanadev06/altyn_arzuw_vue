import { ref, reactive } from 'vue'
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStage,
  getAllOrders,
  getAllOrdersForAdmin,
} from '@/services/api'
import type { Order } from '@/types/api'

export function useOrderController() {
  const orders = ref<Order[]>([])
  const pagination = reactive({
    data: [] as Order[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
    from: 0,
    to: 0,
  })
  const loading = ref(false)
  const error = ref('')

  async function fetchOrders(
    page = 1,
    search = '',
    sortBy = 'id',
    sortOrder = 'desc',
    stage?: string,
    isArchived = false,
    per_page = 30,
    assignment_status?: string,
    admin_view = false,
    force_refresh = false,
  ) {
    loading.value = true
    error.value = ''

    // Проверяем права пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    try {
      const res = await getOrders({
        page: String(page),
        search,
        per_page: String(per_page),
        stage,
        is_archived: isArchived,
        assignment_status,
        admin_view,
        force_refresh,
      })

      pagination.data = res.data
      pagination.current_page = res.current_page
      pagination.last_page = res.last_page
      pagination.total = res.total
      pagination.per_page = res.per_page
      pagination.from = res.from
      pagination.to = res.to

      orders.value = res.data || []
      
      // Если данные не были получены, но ошибки нет - устанавливаем пустой массив
      if (!orders.value || orders.value.length === 0) {
        orders.value = []
      }
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки заказов'
      orders.value = []
      pagination.data = []
      pagination.total = 0
      console.error('Error loading orders:', e)
    } finally {
      loading.value = false
    }
  }

  // Compatibility methods for existing components
  async function fetchAllOrdersForKanban(
    page = 1,
    sortBy = 'id',
    sortOrder = 'desc',
    stage?: string,
    isArchived = false,
    forceRefresh = false,
  ) {
    // Проверяем права пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdminOrManager =
      user.roles?.some((r: any) => ['admin', 'manager'].includes(r.name)) || false

    if (isAdminOrManager) {
      // Для админов/менеджеров используем специальную функцию
      try {
        const response = await getAllOrdersForAdmin({
          search: '',
          sort_by: sortBy,
          sort_order: sortOrder,
          stage: undefined, // без фильтра по стадии
          is_archived: null, // загружаем все заказы (и активные, и архивированные)
          force_refresh: forceRefresh,
        })

        // Обновляем состояние
        pagination.data = response.data
        pagination.current_page = response.current_page
        pagination.last_page = response.last_page
        pagination.total = response.total
        pagination.per_page = response.per_page
        pagination.from = response.from
        pagination.to = response.to

        orders.value = response.data

        return response
      } catch (error) {
        throw error
      }
    } else {
      // Для обычных пользователей используем стандартный подход
      return await fetchOrders(
        1, // первая страница
        '', // без поиска
        sortBy,
        sortOrder,
        undefined, // без фильтра по стадии
        null, // загружаем все заказы (и активные, и архивированные)
        1000, // оптимизированное количество на страницу
        undefined,
        false,
        forceRefresh,
      )
    }
  }

  async function updateStage(orderId: number, stage: string, additionalData?: any) {
    try {
      // Если есть дополнительные данные (например, для отмененных заказов)
      if (additionalData && Object.keys(additionalData).length > 0) {
        // Используем общую функцию updateOrder для отправки дополнительных полей
        await updateOrder(orderId, { stage, ...additionalData })
      } else {
        // Используем специальную функцию только для смены стадии
        await updateOrderStage(orderId, stage)
      }

      return true
    } catch (error) {
      throw error
    }
  }

  async function getAll() {
    return await fetchOrders(1, '', 'id', 'desc', undefined, null, 1000)
  }

  async function removeOrder(id: number) {
    return await remove(id)
  }

  async function createProjectWithOrders(projectData: any) {
    // This would need to be implemented in API service
    await fetchOrders(pagination.current_page)
  }

  async function create(order: any) {
    loading.value = true
    try {
      const created = await createOrder(order as any)
      await fetchOrders(pagination.current_page)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, order: any) {
    loading.value = true
    try {
      const updated = await updateOrder(id, order as any)
      await fetchOrders(pagination.current_page)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteOrder(id)
      // Принудительно обновляем список с force_refresh, чтобы не использовать кеш
      await fetchOrders(pagination.current_page, '', 'id', 'desc', undefined, false, pagination.per_page, undefined, false, true)
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    pagination,
    loading,
    error,
    fetchOrders,
    fetchAllOrdersForKanban,
    updateStage,
    getAll,
    removeOrder,
    createProjectWithOrders,
    create,
    update,
    remove,
  }
}

let orderControllerInstance: ReturnType<typeof useOrderController> | null = null

export function OrderController() {
  if (!orderControllerInstance) {
    orderControllerInstance = useOrderController()
  }
  return orderControllerInstance
}
