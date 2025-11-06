import { ref, reactive } from 'vue'
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient,
  createClientContact,
  updateClientContact,
  deleteClientContact
} from '@/services/api'
import type { Client } from '@/types/client'
import { frontendCache, CacheKeys } from '@/services/cacheService'

export function useClientController() {
  const clients = ref<Client[]>([])
  const pagination = reactive({
    data: [] as Client[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
  })
  const loading = ref(false)
  const error = ref('')
  
  // Инициализируем сортировку из localStorage
  const savedSortBy = localStorage.getItem('clientList_sortBy')
  const savedSortOrder = localStorage.getItem('clientList_sortOrder')
  const sortBy = ref(savedSortBy || 'id')
  const sortOrder = ref<'asc' | 'desc'>((savedSortOrder as 'asc' | 'desc') || 'asc')

  async function fetchClients(
    page = 1,
    search = '',
    sortByParam?: string,
    sortOrderParam?: 'asc' | 'desc',
    per_page = 30,
    force_refresh = false,
  ) {
    // Используем переданные параметры или текущие значения из контроллера
    if (sortByParam !== undefined) {
      sortBy.value = sortByParam
    }
    if (sortOrderParam !== undefined) {
      sortOrder.value = sortOrderParam
    }
    
    loading.value = true
    error.value = ''
    try {
      const res = await getClients({
        page: String(page),
        search,
        per_page: String(per_page),
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        force_refresh,
      })

      if (Array.isArray(res)) {
        // when API returns array (all=true)
        pagination.data = res || []
        pagination.current_page = 1
        pagination.last_page = 1
        pagination.total = res?.length || 0
        pagination.per_page = per_page
        clients.value = res || []
      } else {
        // Обрабатываем пагинированный ответ
        pagination.data = res?.data || []
        pagination.current_page = res?.current_page || 1
        pagination.last_page = res?.last_page || 1
        pagination.total = res?.total || 0
        pagination.per_page = res?.per_page || per_page
        clients.value = res?.data || []
        
        // Если текущая страница больше последней, переходим на последнюю
        if (pagination.current_page > pagination.last_page && pagination.last_page > 0) {
          // Это обрабатывается вызывающим кодом, но здесь мы гарантируем корректные данные
        }
      }
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки клиентов'
      // При ошибке не очищаем данные полностью, чтобы не было пустого экрана
      // Данные останутся прежними, но будет показана ошибка
      console.error('Error fetching clients:', e)
    } finally {
      loading.value = false
    }
  }

  // Compatibility method for existing components
  async function fetchClientsWithSort(
    page = 1,
    search = '',
    sortByParam?: string,
    sortOrderParam?: 'asc' | 'desc',
    per_page = 30,
  ) {
    return await fetchClients(page, search, sortByParam, sortOrderParam, per_page)
  }

  function setSort(key: string, search = '') {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('clientList_sortBy', sortBy.value)
    localStorage.setItem('clientList_sortOrder', sortOrder.value)
    
    // Получаем сохраненный perPage из localStorage
    const savedPerPage = localStorage.getItem('clientList_perPage')
    const perPage = savedPerPage ? parseInt(savedPerPage) : 30
    
    fetchClients(1, search, sortBy.value, sortOrder.value, perPage)
  }

  // Contact CRUD methods
  async function createContact(clientId: number, contactData: { type: string; value: string }) {
    return await createClientContact(clientId, contactData)
  }

  async function updateContact(clientId: number, contactId: number, contactData: { type: string; value: string }) {
    return await updateClientContact(clientId, contactId, contactData)
  }

  async function removeContact(clientId: number, contactId: number) {
    return await deleteClientContact(clientId, contactId)
  }

  async function create(client: Partial<Client>) {
    loading.value = true
    try {
      const created = await createClient(client)
      // Инвалидируем кеш клиентов после создания
      frontendCache.invalidatePattern(CacheKeys.CLIENTS)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, client: Partial<Client>) {
    loading.value = true
    try {
      const updated = await updateClient(id, client)
      // Инвалидируем кеш клиентов после обновления
      frontendCache.invalidatePattern(CacheKeys.CLIENTS)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteClient(id)
      // Инвалидируем кеш клиентов после удаления
      frontendCache.invalidatePattern(CacheKeys.CLIENTS)
    } finally {
      loading.value = false
    }
  }

  return {
    clients,
    pagination,
    loading,
    error,
    sortBy,
    sortOrder,
    fetchClients,
    fetchClientsWithSort,
    setSort,
    createContact,
    updateContact,
    removeContact,
    create,
    update,
    remove,
  }
}

// Создаем singleton экземпляр контроллера
let clientControllerInstance: ReturnType<typeof useClientController> | null = null

export function ClientController() {
  if (!clientControllerInstance) {
    clientControllerInstance = useClientController()
  }
  return clientControllerInstance
}
