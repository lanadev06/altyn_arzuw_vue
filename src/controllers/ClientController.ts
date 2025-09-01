import { ref, reactive } from 'vue'
import { getClients, createClient, updateClient, deleteClient } from '@/services/api'
import type { Client } from '@/types/client'

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
  const sortBy = ref('id')
  const sortOrder = ref('asc')

  async function fetchClients(
    page = 1,
    search = '',
    sortByParam = 'id',
    sortOrderParam = 'asc',
    per_page = 30,
  ) {
    sortBy.value = sortByParam
    sortOrder.value = sortOrderParam
    loading.value = true
    error.value = ''
    try {
      const res = await getClients({
        page: String(page),
        search,
        per_page: String(per_page),
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
      })

      if (Array.isArray(res)) {
        // when API returns array (all=true)
        pagination.data = res
        pagination.current_page = 1
        pagination.last_page = 1
        pagination.total = res.length
        pagination.per_page = per_page
        clients.value = res
      } else {
        pagination.data = res.data
        pagination.current_page = res.current_page
        pagination.last_page = res.last_page
        pagination.total = res.total
        pagination.per_page = res.per_page
        clients.value = res.data
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки клиентов'
    } finally {
      loading.value = false
    }
  }

  // Compatibility method for existing components
  async function fetchClientsWithSort(
    page = 1,
    search = '',
    sortByParam = 'id',
    sortOrderParam = 'asc',
    per_page = 30,
  ) {
    sortBy.value = sortByParam
    sortOrder.value = sortOrderParam
    return await fetchClients(page, search, sortByParam, sortOrderParam, per_page)
  }

  function setSort(key: string, search = '') {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    fetchClients(1, search, sortBy.value, sortOrder.value)
  }

  // Contact CRUD methods for compatibility
  async function createContact(clientId: number, contactData: unknown) {
    // This would need to be implemented in API service
    // console.log('createContact called:', clientId, contactData)
    return { id: Date.now(), ...(contactData as Record<string, unknown>) }
  }

  async function updateContact(clientId: number, contactId: number, contactData: unknown) {
    // This would need to be implemented in API service
    // console.log('updateContact called:', clientId, contactId, contactData)
  }

  async function removeContact(clientId: number, contactId: number) {
    // This would need to be implemented in API service
    // console.log('removeContact called:', clientId, contactId)
  }

  async function create(client: Partial<Client>) {
    loading.value = true
    try {
      const created = await createClient(client)
      await fetchClients(pagination.current_page)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, client: Partial<Client>) {
    loading.value = true
    try {
      const updated = await updateClient(id, client)
      await fetchClients(pagination.current_page)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteClient(id)
      // Обновляем список клиентов после успешного удаления
      try {
        await fetchClients(pagination.current_page)
      } catch (fetchError) {
        // Если не удалось загрузить обновленный список, просто очищаем текущие данные
        console.warn('Could not refresh client list after deletion:', fetchError)
        // Удаляем клиента из локального списка
        pagination.data = pagination.data.filter(client => client.id !== id)
        pagination.total = Math.max(0, pagination.total - 1)
      }
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

export function ClientController() {
  return useClientController()
}
