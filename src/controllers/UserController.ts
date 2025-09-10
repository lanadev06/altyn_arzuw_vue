import { ref, reactive } from 'vue'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUsersByRole,
} from '@/services/api'
import type { User, CreateUserData, UpdateUserData } from '@/types/api'

export function useUserController() {
  const users = ref<User[]>([])
  const pagination = reactive({
    data: [] as User[],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
  })
  const loading = ref(false)
  const error = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  async function fetchUsers(
    page = 1,
    search = '',
    sort_by = sortBy.value,
    sort_order = sortOrder.value,
    per_page = 30,
    role = '',
    is_active: boolean | null = null,
  ) {
    loading.value = true
    error.value = ''
    try {
      const res = await getUsers({
        page,
        search,
        sort_by,
        sort_order,
        per_page,
        role,
        is_active,
      })

      pagination.data = res.data
      pagination.current_page = res.current_page
      pagination.last_page = res.last_page
      pagination.total = res.total
      pagination.per_page = res.per_page
      users.value = res.data
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: number) {
    loading.value = true
    try {
      return await getUser(id)
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователя'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchUsersByRole(role: string) {
    loading.value = true
    try {
      const res = await getUsersByRole(role)
      return res.data || []
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей по роли'
      throw e
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
    fetchUsers(1, search, sortBy.value, sortOrder.value)
  }

  async function create(userData: CreateUserData & { image?: File }) {
    loading.value = true
    try {
      const created = await createUser(userData)
      await fetchUsers(pagination.current_page, '', sortBy.value, sortOrder.value)
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, userData: UpdateUserData & { image?: File }) {
    loading.value = true
    try {
      const updated = await updateUser(id, userData)
      await fetchUsers(pagination.current_page, '', sortBy.value, sortOrder.value)
      return updated
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number, page = pagination.current_page) {
    loading.value = true
    try {
      await deleteUser(id)
      await fetchUsers(page, '', sortBy.value, sortOrder.value)
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(id: number) {
    loading.value = true
    try {
      const result = await toggleUserActive(id)
      
      // Обновляем локальное состояние пользователя
      const userIndex = users.value.findIndex(user => user.id === id)
      if (userIndex !== -1) {
        // API возвращает { message: string, is_active: boolean }
        const newActiveStatus = result.is_active
        users.value[userIndex].is_active = newActiveStatus
        return { is_active: newActiveStatus }
      } else {
        return { is_active: result.is_active }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    pagination,
    loading,
    error,
    sortBy,
    sortOrder,
    fetchUsers,
    fetchUser,
    fetchUsersByRole,
    setSort,
    create,
    update,
    remove,
    toggleActive,
  }
}
