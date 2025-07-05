import { ref, computed } from 'vue'
import { UserRole } from '@/types/user'
import { API_CONFIG } from '@/config/api'

export function useUserController() {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    has_previous_page: false,
    has_next_page: false,
  })
  const filters = ref({
    role: null,
    search: '',
  })
  const sortBy = ref('id')
  const sortOrder = ref('asc')

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  const filteredUsers = computed(() => {
    let result = [...users.value]

    if (filters.value.role) {
      result = result.filter((user) => user.role === filters.value.role)
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(search) || user.username.toLowerCase().includes(search),
      )
    }

    result.sort((a, b) => {
      let aValue = a[sortBy.value]
      let bValue = b[sortBy.value]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return result
  })

  const fetchUsers = async (
    page = 1,
    search = '',
    sort_by = 'id',
    sort_order = 'asc',
    per_page = 10,
    role = null,
  ) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(per_page),
        sort_by,
        sort_order,
      })
      if (search) params.append('search', search)
      if (role) {
        params.append('role', role)
      } else if (filters.value.role) {
        params.append('role', filters.value.role)
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/users?${params.toString()}`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) throw new Error('Необходима авторизация')
        if (response.status === 403) throw new Error('Доступ запрещен')
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер вернул неверный формат данных')
      }

      const json = await response.json()
      users.value = json.data
      pagination.value = json.pagination
    } catch (err) {
      error.value = err.message
      console.error('Ошибка загрузки пользователей:', err)
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== undefined && userData[key] !== null && userData[key] !== '') {
          formData.append(key, userData[key])
        }
      })

      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          ...(localStorage.getItem('auth_token') && {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка создания пользователя')
      }

      const newUser = await response.json()
      users.value.push(newUser.data || newUser)
      return newUser.data || newUser
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId, userData) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      Object.keys(userData).forEach((key) => {
        if (userData[key] !== undefined && userData[key] !== null && userData[key] !== '') {
          formData.append(key, userData[key])
        }
      })
      formData.append('_method', 'PUT')

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          ...(localStorage.getItem('auth_token') && {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка обновления пользователя')
      }

      const updatedUser = await response.json()
      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1) {
        users.value[index] = updatedUser.data || updatedUser
      }
      return updatedUser.data || updatedUser
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Ошибка удаления пользователя')
      }

      users.value = users.value.filter((u) => u.id !== userId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const setSort = (column) => {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = column
      sortOrder.value = 'asc'
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      [UserRole.ADMIN]: 'Администратор',
      [UserRole.MANAGER]: 'Менеджер',
      [UserRole.DESIGNER]: 'Дизайнер',
      [UserRole.PRINT_OPERATOR]: 'Печатник',
      [UserRole.WORKSHOP_WORKER]: 'Работник цеха',
    }
    return labels[role] || role
  }

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    sortBy,
    sortOrder,

    filteredUsers,

    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setFilter,
    setSort,
    getRoleLabel,
  }
}
