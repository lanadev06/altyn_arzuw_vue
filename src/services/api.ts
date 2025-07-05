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

  const defaultHeaders: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS,
  }

  // Добавляем токен авторизации, если он есть
  const token = localStorage.getItem('auth_token')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
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
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
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
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
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
  return (await res.json()).data
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
import type { Product } from '@/types/product'

export async function getProducts({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
} = {}): Promise<any> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  const query = params.length ? `?${params.join('&')}` : ''

  const url = `${API_CONFIG.BASE_URL}/products${query}`
  const token = localStorage.getItem('auth_token')

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

  return await res.json()
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
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

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления товара')
  return (await res.json()).data
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка удаления товара')
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
export async function getOrderDetails(orderId) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки заказа')
  return await res.json()
}

export async function getOrderStatusLogs(orderId) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/status-logs`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки истории статусов')
  return await res.json()
}

export async function getOrderComments(orderId) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments?order_id=${orderId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки комментариев')
  return await res.json()
}

export async function postOrderComment(orderId, text) {
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
export async function getProjectDetails(projectId) {
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
