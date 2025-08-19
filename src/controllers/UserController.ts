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
import type { User, CreateUserData, UpdateUserData, Role, Stage } from '@/types/api'
import { getRoleLabel as getRoleLabelFromUtils, getRoleColorClasses } from '@/utils/roleColors'

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

  // Загружаем настройки сортировки из localStorage
  const sortBy = ref(localStorage.getItem('userList_sortBy') || 'id')
  const sortOrder = ref<'asc' | 'desc'>(
    (localStorage.getItem('userList_sortOrder') as 'asc' | 'desc') || 'asc',
  )

  async function fetchUsers(
    page = 1,
    search = '',
    sort_by = sortBy.value,
    sort_order = sortOrder.value,
    per_page = 30,
    role = '',
    is_active: boolean | null | undefined = null,
  ) {
    loading.value = true
    error.value = ''
    try {
      // Используем правильный параметр сортировки
      const sortByParam = getSortByParam(sort_by)

      const res = await getUsers({
        page,
        search,
        sort_by: sortByParam,
        sort_order,
        per_page,
        role,
        is_active: is_active === null ? null : undefined,
      })

      // Проверяем структуру ответа
      if (res.data && Array.isArray(res.data)) {
        pagination.data = res.data
        pagination.current_page = res.current_page || 1
        pagination.last_page = res.last_page || 1
        pagination.total = res.total || 0
        pagination.per_page = res.per_page || 30
        users.value = res.data
      } else {
        // Если данные приходят в другом формате
        pagination.data = Array.isArray(res) ? res : []
        pagination.current_page = 1
        pagination.last_page = 1
        pagination.total = Array.isArray(res) ? res.length : 0
        pagination.per_page = 30
        users.value = Array.isArray(res) ? res : []
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: number) {
    loading.value = true
    try {
      const user = await getUser(id)
      return user
    } catch (e: unknown) {
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
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей по роли'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Вспомогательная функция для получения правильного параметра сортировки
  function getSortByParam(sortKey: string): string {
    return sortKey
  }

  function setSort(key: string, search = '') {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }

    // Сохраняем настройки сортировки в localStorage
    localStorage.setItem('userList_sortBy', sortBy.value)
    localStorage.setItem('userList_sortOrder', sortOrder.value)

    // Используем правильный параметр сортировки
    const sortByParam = getSortByParam(key)
    fetchUsers(1, search, sortByParam, sortOrder.value)
  }

  async function create(userData: CreateUserData & { image?: File }) {
    loading.value = true
    try {
      const created = await createUser(userData)
      // Удалён отдельный PATCH-запрос на /users/{id}/roles
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
      // Удалён отдельный PATCH-запрос на /users/{id}/roles
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
      await fetchUsers(pagination.current_page, '', sortBy.value, sortOrder.value)
      return result
    } finally {
      loading.value = false
    }
  }

  // Функция для получения метки роли
  function getRoleLabel(role: string): string {
    return getRoleLabelFromUtils(role)
  }

  // Функция для получения класса бейджа роли
  function getRoleBadgeClass(role: string, roleData?: Role, stagesData?: Stage[]): string {
    return getRoleColorClasses(role, roleData, stagesData)
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
    getRoleLabel,
    getRoleBadgeClass,
  }
}
