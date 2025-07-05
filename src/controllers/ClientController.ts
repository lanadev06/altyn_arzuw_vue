import { ref } from 'vue'
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  createClientContact,
  updateClientContact,
  deleteClientContact,
} from '@/services/api'
import type { Client } from '@/types/client'

export function ClientController() {
  const clients = ref<Client[]>([])
  const pagination = ref({
    data: [] as Client[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  async function fetchClients(
    page = 1,
    search = '',
    sort_by = sortBy.value,
    sort_order = sortOrder.value,
  ) {
    console.log('📡 fetchClients called:', { page, search, sort_by, sort_order })

    loading.value = true
    error.value = ''
    try {
      const res = await getClients({ page, search, sort_by, sort_order })
      pagination.value = {
        ...res,
        data: res.data || [],
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        per_page: res.per_page || 10,
      }
      clients.value = res.data || []

      console.log('✅ fetchClients completed:', {
        dataLength: res.data?.length || 0,
        pagination: pagination.value,
      })
    } catch (e: any) {
      error.value = e.message || 'Ошибка загрузки клиентов'
      console.error('❌ fetchClients error:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    const res = await getClients({ all: true })
    return res.data || []
  }

  function setSort(key: string, search = '') {
    console.log('🔄 setSort called:', {
      key,
      search,
      currentSortBy: sortBy.value,
      currentSortOrder: sortOrder.value,
    })

    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }

    console.log('🔄 setSort after update:', { sortBy: sortBy.value, sortOrder: sortOrder.value })
    fetchClients(1, search, sortBy.value, sortOrder.value)
  }

  async function create(newClient: Client) {
    loading.value = true
    try {
      await createClient(newClient)
      await fetchClients(pagination.value.current_page)
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, updatedClient: Client) {
    loading.value = true
    try {
      await updateClient(id, updatedClient)
      await fetchClients(pagination.value.current_page)
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    try {
      await deleteClient(id)
      if (pagination.value.data.length === 1 && pagination.value.current_page > 1) {
        await fetchClients(pagination.value.current_page - 1)
      } else {
        await fetchClients(pagination.value.current_page)
      }
    } finally {
      loading.value = false
    }
  }

  async function createContact(clientId: number, data: { type: string; value: string }) {
    return await createClientContact(clientId, data)
  }

  async function updateContact(
    clientId: number,
    contactId: number,
    data: { type: string; value: string },
  ) {
    return await updateClientContact(clientId, contactId, data)
  }

  async function removeContact(clientId: number, contactId: number) {
    return await deleteClientContact(clientId, contactId)
  }

  return {
    clients,
    pagination,
    loading,
    error,
    sortBy,
    sortOrder,
    fetchClients,
    setSort,
    create,
    update,
    remove,
    createContact,
    updateContact,
    removeContact,
    fetchAll,
  }
}
