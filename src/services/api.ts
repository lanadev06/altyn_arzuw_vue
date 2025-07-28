import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../config/api'

// Типы для Laravel API
export interface LoginCredentials {
  username: string // Laravel использует username вместо email
  password: string
}

export interface RegisterData {
  username: string
  password: string
  password_confirmation: string // Laravel требует подтверждение пароля
  name: string
  phone?: string
  role: 'admin' | 'manager' | 'designer' | 'print_operator' | 'workshop_worker'
}

export interface LoginResponse {
  user: {
    id: number
    username: string
    name: string
    phone?: string
    role: string
    created_at: string
    updated_at: string
  }
  token: string // Laravel Sanctum token
}

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]> // Laravel validation errors
}

// Функция для выполнения HTTP запросов с таймаутом
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  // Определяем, FormData ли body
  const isFormData = options.body instanceof FormData

  // Базовые заголовки
  const defaultHeaders: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS,
  }

  // Добавляем токен авторизации всегда!
  const token = localStorage.getItem('auth_token')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Только если не FormData, добавляем Content-Type
  if (isFormData && defaultHeaders['Content-Type']) {
    delete defaultHeaders['Content-Type']
  }

  // Если FormData — удаляем Content-Type и из options.headers
  if (isFormData && options.headers && options.headers['Content-Type']) {
    delete options.headers['Content-Type']
  }

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  }

  // Создаем контроллер для таймаута
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Обработка Laravel validation errors
      if (response.status === 422 && errorData.errors) {
        const validationErrors = Object.values(errorData.errors).flat().join(', ')
        throw new Error(validationErrors)
      }

      // --- Добавить обработку 401/403 ---
      if (response.status === 401 || response.status === 403) {
        // localStorage.removeItem('auth_token')
        // localStorage.removeItem('user')
        // window.location.href = '/login'
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      // --- конец блока ---

      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания запроса')
      }
      throw error
    }
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
  }
}

// API функции для аутентификации с Laravel
export const authApi = {
  // Вход в систему
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Реальный API вызов к Laravel
      return await apiRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    } catch (error) {
      // Если API недоступен и включен fallback, используем имитацию
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        console.warn('Laravel API недоступен, используем имитацию:', error)

        // Имитация API вызова
        await new Promise((resolve) => setTimeout(resolve, API_CONFIG.DEV.MOCK_DELAY))

        // Проверяем тестовые данные
        if (credentials.username === 'admin' && credentials.password === 'password') {
          return {
            user: {
              id: 1,
              username: credentials.username,
              name: 'Администратор',
              phone: '+7 (999) 123-45-67',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            token: 'fake-laravel-token-' + Date.now(),
          }
        } else {
          throw new Error('Неверный логин или пароль')
        }
      } else {
        throw error
      }
    }
  },

  // Регистрация пользователя
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      return await apiRequest<LoginResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    } catch (error) {
      throw new Error(
        'Ошибка при регистрации: ' +
          (error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR),
      )
    }
  },

  // Выход из системы
  async logout(): Promise<void> {
    try {
      // Реальный API вызов к Laravel
      await apiRequest<void>(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' })
    } catch (error) {
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        console.warn('Laravel API недоступен, используем локальный logout:', error)
      } else {
        throw error
      }
    } finally {
      // Всегда очищаем локальные данные
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  },

  // Получить текущего пользователя
  async me(): Promise<LoginResponse['user']> {
    try {
      return await apiRequest<LoginResponse['user']>(API_ENDPOINTS.AUTH.ME)
    } catch (error) {
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        console.warn('Laravel API недоступен, используем локальные данные:', error)

        const user = localStorage.getItem('user')
        if (user) {
          return JSON.parse(user)
        }
        throw new Error('Пользователь не найден')
      } else {
        throw error
      }
    }
  },

  // Проверка токена (через /me endpoint)
  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { valid: false }
    }

    try {
      const user = await this.me()
      return { valid: true, user }
    } catch (error) {
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        console.warn('Laravel API недоступен, проверяем локальный токен:', error)

        // Для демонстрации считаем токен валидным, если он есть
        const user = localStorage.getItem('user')
        return {
          valid: !!user,
          user: user ? JSON.parse(user) : null,
        }
      } else {
        // Если токен недействителен, очищаем localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        return { valid: false }
      }
    }
  },
}

// Экспортируем базовую функцию для других API вызовов
export { apiRequest }

// --- Клиенты ---
import type { Client } from '@/types/client'

export async function getClients({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'asc',
  per_page,
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  const query = params.length ? `?${params.join('&')}` : ''

  const res = await fetch(`${API_CONFIG.BASE_URL}/clients${query}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки клиентов')
  const data = await res.json()

  return data
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка создания клиента')
  return (await res.json()).data
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления клиента')
  return (await res.json()).data
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка удаления клиента')
}

// Создать контакт клиента
export async function createClientContact(clientId: number, data: { type: string; value: string }) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${clientId}/contacts`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка создания контакта')
  return await res.json()
}

// Обновить контакт клиента
export async function updateClientContact(
  clientId: number,
  contactId: number,
  data: { type: string; value: string },
) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${clientId}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления контакта')
  return await res.json()
}

// Удалить контакт клиента
export async function deleteClientContact(clientId: number, contactId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${clientId}/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка удаления контакта')
  return await res.json()
}

// --- Проекты ---
import type { Project } from '@/types/project'

export async function getProjects({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  per_page = 30,
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  const query = params.length ? `?${params.join('&')}` : ''
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects${query}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки проектов')
  return await res.json()
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка создания проекта')
  const json = await res.json()
  console.log('createProject API response:', json)
  return json.data || json
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления проекта')
  return (await res.json()).data
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка удаления проекта')
}

// --- Товары ---
import type { Product, ProductForm } from '@/types/product'

export async function getProducts({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  per_page = 30,
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  const query = params.length ? `?${params.join('&')}` : ''

  const url = `${API_CONFIG.BASE_URL}/products${query}`
  const token = localStorage.getItem('auth_token')

  console.log('🔍 API Request URL:', url)

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ API Error:', {
      status: res.status,
      statusText: res.statusText,
      response: errorText,
    })
    throw new Error(`Ошибка загрузки товаров: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  console.log('📡 API Response:', data)

  // Проверяем структуру ответа
  if (data.data && Array.isArray(data.data)) {
    console.log(
      '📊 Sample product from API:',
      data.data[0]
        ? {
            id: data.data[0].id,
            name: data.data[0].name,
            designers: data.data[0].designers,
            print_operators: data.data[0].print_operators,
            engraving_operators: data.data[0].engraving_operators,
            workshop_workers: data.data[0].workshop_workers,
            has_design_stage: data.data[0].has_design_stage,
            has_print_stage: data.data[0].has_print_stage,
            has_engraving_stage: data.data[0].has_engraving_stage,
            has_workshop_stage: data.data[0].has_workshop_stage,
          }
        : 'No products',
    )
  }

  return data
}

export async function createProduct(data: ProductForm): Promise<Product> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка создания товара')
  return (await res.json()).data
}

export async function updateProduct(id: number, data: ProductForm): Promise<Product> {
  console.log('🔄 updateProduct API call:', {
    url: `${API_CONFIG.BASE_URL}/products/${id}`,
    method: 'PUT',
    data: data,
  })

  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ updateProduct API Error:', {
      status: res.status,
      statusText: res.statusText,
      response: errorText,
    })
    throw new Error('Ошибка обновления товара')
  }

  const responseData = await res.json()
  console.log('📡 updateProduct API Response:', responseData)

  return responseData.data
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  // Не выбрасывать ошибку при 404 — товар уже удалён
  if (!res.ok && res.status !== 404) {
    throw new Error('Ошибка удаления товара')
  }
}

// --- Дизайнеры ---
export async function getByRole(role: string): Promise<{ data: any[] }> {
  const url = `${API_CONFIG.BASE_URL}/users/role/${role}`
  const token = localStorage.getItem('auth_token')

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ getByRole API Error:', {
      status: res.status,
      statusText: res.statusText,
      response: errorText,
    })
    throw new Error(`Ошибка загрузки пользователей по роли: ${res.status} ${res.statusText}`)
  }

  return await res.json()
}

export async function getAllClients(): Promise<any[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/all`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки клиентов')
  return await res.json()
}

export async function getAllProducts(): Promise<any[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/all`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки продуктов')
  return await res.json()
}

export async function getAllUsers(): Promise<any[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/users/all`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки пользователей')
  return await res.json()
}

export async function getAllProjects(): Promise<any[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/all`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки проектов')
  return await res.json()
}

// --- Заказы ---
export async function getOrderDetails(orderId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки заказа')
  return await res.json()
}

export async function getOrderStatusLogs(orderId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/status-logs`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки истории статусов')
  return await res.json()
}

export async function getOrderComments(orderId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments?order_id=${orderId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки комментариев')
  return await res.json()
}

export async function postOrderComment(orderId: number, text: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({ order_id: orderId, text }),
  })
  if (!res.ok) throw new Error('Ошибка добавления комментария')
  return await res.json()
}

// Добавляем функцию для удаления комментария к заказу
export async function deleteOrderComment(orderId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments/${commentId}?order_id=${orderId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка удаления комментария')
}

// --- Проекты ---
export async function getProjectDetails(projectId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${projectId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки проекта')
  return await res.json()
}

export async function updateOrderStage(orderId: number, stage: string): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({ stage }),
  })
  if (!res.ok) throw new Error('Ошибка смены статуса заказа')
}

export async function createUser(data: any): Promise<any> {
  console.log('createUser API called with:', data)
  console.log('data.image type:', typeof data.image)
  console.log('data.image instanceof File:', data.image instanceof File)
  console.log('data.image:', data.image)

  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('username', data.username)
  formData.append('password', data.password)
  if (data.phone) formData.append('phone', data.phone)
  if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())
  if (data.image instanceof File) {
    console.log('Adding image to FormData:', data.image)
    formData.append('image', data.image)
  }
  // Если есть массив ролей, добавляем их
  if (data.roles && Array.isArray(data.roles)) {
    data.roles.forEach((role: number, idx: number) => {
      formData.append(`roles[${idx}]`, role.toString())
    })
  }

  console.log('FormData entries:')
  for (const [key, value] of formData.entries()) {
    console.log(key, value)
  }

  const res = await apiRequest('/users', {
    method: 'POST',
    body: formData,
  })

  console.log('Server response for createUser:', res)
  console.log('Response type:', typeof res)

  return res
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })
}

export async function getUser(id: number): Promise<any> {
  const res = await apiRequest(`/users/${id}`)
  return res
}

export async function getUsers({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'asc',
  per_page = 30,
  role = '',
  is_active = null,
} = {}): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    search,
    sort_by,
    sort_order,
    per_page: per_page.toString(),
  })
  if (role) params.append('role', role)
  if (is_active !== null) params.append('is_active', is_active.toString())
  const res = await apiRequest(`/users?${params.toString()}`)
  return res
}

export async function getUsersByRole(role: string): Promise<any> {
  const res = await apiRequest(`/users/by-role/${role}`)
  return res
}

export async function toggleUserActive(id: number): Promise<any> {
  const res = await apiRequest(`/users/${id}/toggle-active`, {
    method: 'PATCH',
  })
  return res
}

export async function updateUser(id: number, data: any): Promise<any> {
  console.log('updateUser API called with id:', id, 'data:', data)
  console.log('data.image type:', typeof data.image)
  console.log('data.image instanceof File:', data.image instanceof File)
  console.log('data.image:', data.image)

  const token = localStorage.getItem('auth_token')
  if (data.image instanceof File) {
    console.log('Using FormData for update (image present)')
    const formData = new FormData()
    if (data.name !== undefined) formData.append('name', data.name)
    if (data.username !== undefined) formData.append('username', data.username)
    if (data.phone !== undefined) formData.append('phone', data.phone || '')
    if (data.password) formData.append('password', data.password)
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())
    console.log('Adding image to FormData:', data.image)
    formData.append('image', data.image)
    if (data.roles && Array.isArray(data.roles)) {
      data.roles.forEach((role: number, idx: number) => {
        formData.append(`roles[${idx}]`, role.toString())
      })
    }

    // Добавляем _method: PUT для Laravel
    formData.append('_method', 'PUT')

    console.log('FormData entries for update:')
    for (const [key, value] of formData.entries()) {
      console.log(key, value)
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/users/${id}`, {
      method: 'POST', // Используем POST вместо PATCH
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    console.log('Response status:', res.status)
    console.log('Response headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.log('Error response data:', errorData)
      console.log('Error message:', errorData.message)
      console.log('Validation errors:', errorData.errors)
      throw new Error(`Ошибка обновления пользователя: ${errorData.message || res.statusText}`)
    }

    const responseData = await res.json()
    console.log('Server response for updateUser:', responseData)

    return responseData
  } else {
    console.log('Using JSON for update (no image)')
    const res = await fetch(`${API_CONFIG.BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Ошибка обновления пользователя')
    return await res.json()
  }
}

export async function getRoles(): Promise<
  Array<{ id: number; name: string; display_name?: string }>
> {
  const res = await apiRequest('/roles')
  return res.data || res // поддержка разных форматов ответа
}
