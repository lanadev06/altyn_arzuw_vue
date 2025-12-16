import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../config/api'
import { handle401Error } from '../utils/auth'
import { frontendCache, CacheKeys, CacheTTL } from './cacheService'
import { requestDeduplication } from './requestDeduplication'
import { invalidateCache } from '../utils/cacheUtils'
import { requestQueue } from './requestQueue'
import { circuitBreaker } from './circuitBreaker'
import { rateLimiter } from './rateLimiter'

// Make circuit breaker globally accessible
if (typeof window !== 'undefined') {
  (window as any).circuitBreaker = circuitBreaker
}

// Function to check backend connectivity
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Function to reset circuit breaker and clear caches
export function resetCircuitBreaker() {
  circuitBreaker.reset()
  frontendCache.clear()
  localStorage.removeItem('api_errors')
}

// Function to force reset all pending requests and circuit breaker
export function forceResetAll() {
  // Reset circuit breaker
  circuitBreaker.reset()
  
  // Clear all caches
  frontendCache.clear()
  
  // Clear localStorage errors
  localStorage.removeItem('api_errors')
  
  // Clear any pending requests
  if (typeof window !== 'undefined' && window.AbortController) {
    // This will help abort any pending requests
  }
}
import type {
  PaginatedResponse,
  User,
  Order,
  Client,
  Product,
  Project,
  CreateOrderData,
  UpdateOrderData,
  CreateUserData,
  UpdateUserData,
  ApiRequestConfig,
} from '../types/api'
import type { Category } from '../types/category'

// Development mode flag
const DEV_MODE = false // Отключаем DEV_MODE для тестирования

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
  roles: number[] // массив ID ролей
}

export interface LoginResponse {
  user: {
    id: number
    username: string
    name: string
    phone?: string
    is_active: boolean
    roles: Array<{
      id: number
      name: string
      display_name?: string
    }>
    created_at: string
    updated_at: string
  }
  token: string // Laravel Sanctum token
}

// Удаляем дублирующийся интерфейс ApiError, так как он уже импортирован из types/api

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
  if (
    isFormData &&
    options.headers &&
    (options.headers as Record<string, string>)['Content-Type']
  ) {
    delete (options.headers as Record<string, string>)['Content-Type']
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
  // Увеличиваем таймаут для медленного интернета
  const timeout = API_CONFIG.TIMEOUT
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Проверяем rate limiter перед выполнением запроса
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getTimeUntilRetry()
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    // Используем circuit breaker и очередь запросов
    const response = await circuitBreaker.execute(async () => {
      return await requestQueue.add(async () => {
        // Добавляем заголовок для сжатия если его нет
        const finalHeaders = {
          ...config.headers,
          'Accept-Encoding': 'gzip, deflate, br',
        }
        
        return await fetch(url, {
          ...config,
          headers: finalHeaders,
          signal: controller.signal,
        })
      })
    })
    
    // Если запрос успешен, сбрасываем счетчик ошибок
    if (response.ok) {
      circuitBreaker.reset()
      rateLimiter.handleSuccess()
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const status = response.status
      const errorData = await response.json().catch(() => ({}))

      // Обработка Laravel validation errors
      if (status === 422 && errorData.errors) {
        // Создаем объект с ошибками по полям
        const fieldErrors: Record<string, string> = {}
        Object.keys(errorData.errors).forEach(field => {
          const fieldErrorArray = errorData.errors[field]
          if (Array.isArray(fieldErrorArray) && fieldErrorArray.length > 0) {
            fieldErrors[field] = fieldErrorArray[0] // Берем первую ошибку для поля
          }
        })
        
        // Если есть ошибки полей, создаем специальный объект ошибки
        if (Object.keys(fieldErrors).length > 0) {
          const error = new Error('Validation failed') as Error & { fieldErrors?: Record<string, string>; status?: number; data?: any }
          ;(error as any).fieldErrors = fieldErrors
          error.status = status
          error.data = errorData
          throw error
        }
        
        // Fallback к старому поведению
        const validationErrors = Object.values(errorData.errors).flat().join(', ')
        const error = new Error(validationErrors) as Error & { status?: number; data?: any }
        error.status = status
        error.data = errorData
        throw error
      }

      // Обработка 401 ошибок (неавторизован)
      if (status === 401) {
        const message = errorData.message || 'Сессия истекла. Необходимо войти в систему заново.'

        // Не вызываем handle401Error для определенных endpoints, которые могут быть недоступны
        const isPublicEndpoint =
          endpoint.includes('/users/role/') ||
          endpoint.includes('/users') ||
          endpoint.includes('/stages') ||
          endpoint.includes('/stats/dashboard') ||
          endpoint.includes('/clients/all') ||
          endpoint.includes('/projects/') ||
          endpoint.includes('/orders/') ||
          endpoint.includes('/comments') ||
          endpoint.includes('/status-logs') ||
          endpoint.includes('/status-logs')

        if (!isPublicEndpoint) {
          handle401Error(message)
        }

        const error = new Error(message) as Error & { status?: number; data?: any }
        error.status = status
        error.data = errorData
        throw error
      }

      // Обработка 403 ошибок (доступ запрещен) - НЕ выбиваем из системы
      if (status === 403) {
        const message = errorData.message || 'У вас нет прав на это действие'
        const error = new Error(message) as Error & { status?: number; data?: any }
        error.status = status
        error.data = errorData
        throw error
      }

      // Обработка 429 ошибок (Too Many Requests)
      if (status === 429) {
        // Пытаемся получить Retry-After из заголовка
        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null
        
        rateLimiter.handle429Error(retryAfter)
        
        const waitTime = rateLimiter.getTimeUntilRetry()
        const message = `Слишком много запросов. Повторите попытку через ${Math.ceil(waitTime / 1000)} секунд.`
        const error = new Error(message)
        ;(error as any).status = 429
        ;(error as any).retryAfter = waitTime
        throw error
      }

      // Унифицированная обработка ошибок
      if (errorData.message) {
        const error = new Error(errorData.message) as Error & { status?: number; data?: any }
        error.status = status
        error.data = errorData
        throw error
      } else {
        const error = new Error(ERROR_MESSAGES.UNKNOWN_ERROR) as Error & { status?: number; data?: any }
        error.status = status
        error.data = errorData
        throw error
      }
    }

    // Проверяем, есть ли контент для парсинга
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json()

      // Laravel API может возвращать данные в формате {data: {...}}
      // Проверяем, есть ли обертка data
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData
      }

      return responseData
    } else {
      // Для ответов без контента (например, 204 No Content) возвращаем null
      return null
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания запроса')
      }
      
      // Если это 429 ошибка, она уже обработана выше, просто пробрасываем
      if ((error as any).status === 429) {
        throw error
      }
      
      // Определяем сетевые ошибки соединения
      // ERR_INTERNET_DISCONNECTED, ERR_CONNECTION_REFUSED и другие сетевые ошибки
      // в JavaScript приходят как TypeError: Failed to fetch
      const errorMessage = error.message.toLowerCase()
      const isNetworkError = 
        error.name === 'TypeError' && (
          errorMessage.includes('failed to fetch') ||
          errorMessage.includes('fetch')
        ) ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('networkerror') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('err_connection_refused') ||
        errorMessage.includes('err_connection_reset') ||
        errorMessage.includes('err_internet_disconnected') ||
        errorMessage.includes('err_connection_timed_out') ||
        errorMessage.includes('err_connection_closed') ||
        errorMessage.includes('err_name_not_resolved') ||
        errorMessage.includes('load failed')
      
      if (isNetworkError) {
        const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR) as Error & { isNetworkError?: boolean; originalError?: Error }
        networkError.isNetworkError = true
        networkError.originalError = error
        throw networkError
      }
      
      throw error
    }
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
  }
}

// Кэшированная версия apiRequest для GET запросов
export async function cachedApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  cacheKey?: string,
  ttl?: number
): Promise<T> {
  // Только для GET запросов используем кэш
  if (options.method && options.method !== 'GET') {
    return apiRequest<T>(endpoint, options)
  }

  const key = cacheKey || frontendCache.createCacheKey(endpoint, options)
  
  // Проверяем кэш
  const cachedData = frontendCache.get<T>(key)
  if (cachedData) {
    return cachedData
  }

  // Создаем ключ для дедупликации
  const dedupeKey = requestDeduplication.createKey(
    options.method || 'GET',
    endpoint,
    options
  )

  // Выполняем запрос с дедупликацией
  const result = await requestDeduplication.deduplicate(dedupeKey, () => 
    apiRequest<T>(endpoint, options)
  )

  // Сохраняем в кэш
  frontendCache.set(key, result, ttl)

  return result
}

// API функции для аутентификации с Laravel
export const authApi = {
  // Вход в систему
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Реальный API вызов к Laravel
      const response = await apiRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      // Проверка активности пользователя
      if (response.user && !response.user.is_active) {
        throw new Error('Ваш аккаунт деактивирован. Обратитесь к администратору.')
      }

      return response
    } catch (error) {
      // Если API недоступен и включен fallback, используем имитацию
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
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
              is_active: true,
              roles: [
                { id: 1, name: 'admin', display_name: 'Администратор' },
                { id: 2, name: 'manager', display_name: 'Менеджер' },
              ],
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
      } else {
        throw error
      }
    } finally {
      // Всегда очищаем локальные данные
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  },

  // Получить текущего пользователя (с кэшированием на 5 минут)
  async me(): Promise<User> {
    try {
      return await cachedApiRequest<User>(
        API_ENDPOINTS.AUTH.ME,
        {},
        'user_me',
        CacheTTL.SHORT // 15 минут кэш
      )
    } catch (error) {
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        const user = localStorage.getItem('user')
        if (user) {
          return JSON.parse(user)
        }
        throw new Error('Сотрудник не найден')
      } else {
        throw error
      }
    }
  },

  // Проверка токена (через /me endpoint)
  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { valid: false }
    }

    try {
      const user = await this.me()
      return { valid: true, user }
    } catch (error) {
      if (API_CONFIG.DEV.USE_MOCK_FALLBACK) {
        // Для демонстрации считаем токен валидным, если он есть
        const user = localStorage.getItem('user')
        return {
          valid: !!user,
          user: user ? JSON.parse(user) : undefined,
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
// Удаляем дублирующийся импорт Client, так как он уже импортирован из types/api

export async function getClients({
  page = '1',
  search = '',
  sort_by = 'id',
  sort_order = 'asc',
  per_page,
  all,
  force_refresh = false,
}: {
  page?: string
  search?: string
  sort_by?: string
  sort_order?: string
  per_page?: string
  all?: boolean
  force_refresh?: boolean
} = {}): Promise<PaginatedResponse<Client> | Client[]> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page && !all) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  if (all) params.push('all=true')
  if (force_refresh) params.push('force_refresh=true')
  const query = params.length ? `?${params.join('&')}` : ''

  return await cachedApiRequest<PaginatedResponse<Client> | Client[]>(
    `/clients${query}`,
    {},
    `clients_${query}`,
    all ? CacheTTL.LONG : CacheTTL.MEDIUM
  )
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
  const result = (await res.json()).data
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastClientChange', Date.now().toString())
  }
  
  return result
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
  const result = (await res.json()).data
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastClientChange', Date.now().toString())
  }
  
  return result
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })

  // Сохраняем время последнего изменения перед проверкой ошибок
  if (typeof window !== 'undefined' && res.ok) {
    localStorage.setItem('lastClientChange', Date.now().toString())
  }
  
  if (!res.ok) {
    let errorMessage = 'Ошибка удаления клиента'
    let errorData = null

    try {
      errorData = await res.json()
      if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch (e) {
      // Could not parse error response
    }

    const error = new Error(errorMessage)
    ;(error as any).status = res.status
    ;(error as any).response = res
    ;(error as any).data = errorData
    throw error
  }
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
// Удаляем дублирующийся импорт Project, так как он уже импортирован из types/api

export async function getProjects({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  per_page = 30,
  force_refresh = false,
} = {}): Promise<PaginatedResponse<Project>> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  if (force_refresh) params.push('force_refresh=true')
  const query = params.length ? `?${params.join('&')}` : ''
  
  return await cachedApiRequest<PaginatedResponse<Project>>(
    `/projects${query}`,
    {},
    `projects_${query}`,
    CacheTTL.MEDIUM
  )
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
  
  // Инвалидируем кэш проектов после создания
  invalidateCache.projects()
  
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
  const result = (await res.json()).data
  
  // Инвалидируем кэш проектов после обновления
  invalidateCache.projects()
  frontendCache.delete(`project_${id}`)
  
  return result
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
  
  // Инвалидируем кэш проектов после удаления
  invalidateCache.projects()
  frontendCache.delete(`project_${id}`)
}

// --- Товары ---
// Удаляем дублирующийся импорт Product, так как он уже импортирован из types/api
// Оставляем только ProductForm если он нужен
import type { ProductForm } from '@/types/product'

export async function getProducts({
  page = '1',
  search = '',
  sort_by = 'name',
  sort_order = 'asc',
  per_page = '30',
  forceRefresh = false,
  category_id = '',
} = {}): Promise<PaginatedResponse<Product>> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  if (category_id) params.push(`category_id=${encodeURIComponent(category_id)}`)
  if (forceRefresh) params.push('force_refresh=true') // Принудительное обновление кэша на бэкенде
  const query = params.length ? `?${params.join('&')}` : ''

  // Если forceRefresh, очищаем кэш
  if (forceRefresh) {
    frontendCache.invalidatePattern(`products_`)
  }

  return await cachedApiRequest<PaginatedResponse<Product>>(
    `/products${query}`,
    {},
    `products_${query}`,
    CacheTTL.MEDIUM
  )
}

export async function createProduct(data: ProductForm): Promise<Product> {
  const res = await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as any
  
  // Инвалидируем кэш продуктов
  invalidateCache.products()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastProductChange', Date.now().toString())
  }
  
  return res.data
}

export async function updateProduct(id: number, data: ProductForm): Promise<Product> {
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
    throw new Error('Ошибка обновления товара')
  }

  const responseData = await res.json()

  // Инвалидируем кэш продуктов после обновления
  invalidateCache.products()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastProductChange', Date.now().toString())
  }

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

  // Обрабатываем различные статусы ответа
  if (!res.ok) {
    if (res.status === 404) {
      // Товар уже удалён
      throw new Error('Ошибка удаления товара')
    } else if (res.status === 422) {
      // Ошибка валидации (например, товар используется в заказах)
      const errorData = await res.json()
      const error = new Error(errorData.message || 'Ошибка удаления товара')
      ;(error as any).response = { data: errorData }
      throw error
    } else {
      // Другие ошибки
      throw new Error('Ошибка удаления товара')
    }
  }

  // Инвалидируем кэш продуктов после удаления
  invalidateCache.products()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastProductChange', Date.now().toString())
  }
}

// Product Stages API - для работы с таблицей product_stages
export async function getProductStages(productId: number) {
  if (DEV_MODE) {
    // Моковые данные для разработки - некоторые выключены для тестирования
    const mockData = {
      data: [
        { id: 1, product_id: productId, stage_id: 2, is_available: true, is_default: false }, // design - включено
        { id: 2, product_id: productId, stage_id: 3, is_available: false, is_default: false }, // print - выключено
        { id: 3, product_id: productId, stage_id: 5, is_available: false, is_default: false }, // engraving - выключено
        { id: 4, product_id: productId, stage_id: 7, is_available: true, is_default: false }, // workshop - включено
      ],
    }
    return mockData
  }

  return await cachedApiRequest(
    `/products/${productId}/stages`,
    {},
    `product_stages_${productId}`,
    CacheTTL.MEDIUM,
  )
}

export async function updateProductStages(
  productId: number,
  stages: Array<{ stage_id: number; is_available: boolean }>,
) {
  if (DEV_MODE) {
    return { data: stages }
  }

  const response = await apiRequest(`/products/${productId}/stages`, {
    method: 'PUT',
    body: JSON.stringify({ stages }),
  })
  frontendCache.invalidatePattern(`product_stages_${productId}`)
  return response
}

// --- Дизайнеры ---
export async function getByRole(role: string): Promise<{ data: User[] }> {
  return await cachedApiRequest<{ data: User[] }>(
    `/users/role/${role}`,
    {},
    `users_by_role_${role}`,
    CacheTTL.LONG
  )
}

export async function getAllClients(): Promise<any[]> {
  const res = await cachedApiRequest('/clients/all', {}, CacheKeys.CLIENTS, CacheTTL.MEDIUM)
  return Array.isArray(res) ? res : []
}

export async function getAllProducts(forceRefresh = false): Promise<any[]> {
  if (forceRefresh) {
    invalidateCache.products()
  }

  // Запрашиваем все товары (лимит 5000, что больше чем нужно)
  // Используем отдельный ключ кэша с лимитом, чтобы не конфликтовать со старым кэшем
  const cacheKey = `${CacheKeys.PRODUCTS}_limit_5000`
  const res = await cachedApiRequest('/products/all?limit=5000', {}, cacheKey, CacheTTL.MEDIUM)

  if (Array.isArray(res)) {
    return res
  }

  if (res && typeof res === 'object' && 'data' in res) {
    const data = (res as any).data
    if (Array.isArray(data)) {
      return data
    }
  }

  console.warn('[getAllProducts] Unexpected response format:', res)
  return []
}

export async function getAllUsers(): Promise<any[]> {
  const res = await cachedApiRequest('/users/all', {}, CacheKeys.USERS, CacheTTL.MEDIUM)
  return Array.isArray(res) ? res : []
}

export async function getAllProjects(): Promise<any[]> {
  const res = await cachedApiRequest('/projects/all', {}, CacheKeys.PROJECTS, CacheTTL.MEDIUM)
  return Array.isArray(res) ? res : []
}

// --- Заказы ---
export async function getOrders({
  page = '1',
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  per_page = '30',
  stage,
  is_archived,
  assignment_status,
  admin_view = false,
  force_refresh = false,
}: {
  page?: string
  search?: string
  sort_by?: string
  sort_order?: string
  per_page?: string
  stage?: string
  is_archived?: boolean
  assignment_status?: string
  admin_view?: boolean
  force_refresh?: boolean
} = {}): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams({
    page,
    search,
    sort_by,
    sort_order,
    per_page,
  })
  if (stage) params.append('stage', stage)
  if (typeof is_archived === 'boolean') params.append('is_archived', String(is_archived))
  if (assignment_status) params.append('assignment_status', assignment_status)
  if (admin_view) params.append('admin_view', 'true')
  if (force_refresh) params.append('force_refresh', 'true')

  const cacheKey = `orders_${params.toString()}`
  
  // Если force_refresh, очищаем кеш для этого конкретного ключа перед запросом
  if (force_refresh) {
    frontendCache.delete(cacheKey)
  }
  
  return await cachedApiRequest<PaginatedResponse<Order>>(
    `/orders?${params.toString()}`,
    {},
    cacheKey,
    CacheTTL.SHORT // Короткий TTL для заказов, так как они часто меняются
  )
}

// Специальная функция для получения всех заказов без пагинации
export async function getAllOrders({
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  stage,
  is_archived = false,
  assignment_status,
}: {
  search?: string
  sort_by?: string
  sort_order?: string
  stage?: string
  is_archived?: boolean
  assignment_status?: string
} = {}): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams({
    search,
    sort_by,
    sort_order,
    per_page: '1000', // Оптимизированное количество для снижения нагрузки
  })
  if (stage) params.append('stage', stage)
  if (typeof is_archived === 'boolean') params.append('is_archived', String(is_archived))
  if (assignment_status) params.append('assignment_status', assignment_status)

  return await apiRequest(`/orders?${params.toString()}`)
}

// Специальная функция для получения всех заказов админом (с очисткой кэша)
export async function getAllOrdersForAdmin({
  search = '',
  sort_by = 'id',
  sort_order = 'desc',
  stage,
  is_archived = false,
  assignment_status,
  force_refresh = false,
}: {
  search?: string
  sort_by?: string
  sort_order?: string
  stage?: string
  is_archived?: boolean
  assignment_status?: string
  force_refresh?: boolean
} = {}): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams({
    search,
    sort_by,
    sort_order,
    per_page: '1000', // Оптимизированное количество для снижения нагрузки
    admin_view: 'true', // Специальный флаг для админа
  })
  if (stage) params.append('stage', stage)
  if (typeof is_archived === 'boolean') params.append('is_archived', String(is_archived))
  if (assignment_status) params.append('assignment_status', assignment_status)
  if (force_refresh) params.append('force_refresh', 'true')

  // Используем cachedApiRequest но с коротким TTL, так как это для админа с force_refresh
  const cacheKey = `orders_admin_${params.toString()}`
  // Если force_refresh, очищаем кэш
  if (force_refresh) {
    frontendCache.invalidatePattern(`orders_admin_`)
  }
  
  return await cachedApiRequest<PaginatedResponse<Order>>(
    `/orders?${params.toString()}`,
    {},
    cacheKey,
    CacheTTL.SHORT // Короткий TTL, так как force_refresh должен обновлять
  )
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const result = await apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as any
  
  // Инвалидируем весь кэш заказов (все списки с фильтрами, детали, логи, комментарии)
  invalidateCache.orders()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastOrderChange', Date.now().toString())
  }
  
  return result.data || result
}

export async function updateOrder(id: number, data: UpdateOrderData): Promise<Order> {
  const result = await apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }) as any
  
  // Инвалидируем весь кэш заказов (все списки с фильтрами, детали, логи, комментарии)
  invalidateCache.orders()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastOrderChange', Date.now().toString())
  }
  
  return result.data || result
}

export async function deleteOrder(id: number): Promise<void> {
  await apiRequest(`/orders/${id}`, { method: 'DELETE' })
  
  // Инвалидируем весь кэш заказов (все списки с фильтрами, детали, логи, комментарии)
  invalidateCache.orders()
  
  // Сохраняем время последнего изменения для принудительного обновления при возврате на страницу
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastOrderChange', Date.now().toString())
  }
}
export async function getOrderDetails(orderId: number) {
  return await cachedApiRequest(`/orders/${orderId}`, {}, `order_details_${orderId}`, CacheTTL.MEDIUM)
}

export async function getOrderStatusLogs(orderId: number) {
  return await cachedApiRequest(`/orders/${orderId}/status-logs`, {}, `order_status_logs_${orderId}`, CacheTTL.MEDIUM)
}

export async function getOrderComments(orderId: number) {
  return await cachedApiRequest(`/comments?order_id=${orderId}`, {}, `order_comments_${orderId}`, CacheTTL.MEDIUM)
}

export async function postOrderComment(orderId: number, text: string) {
  const result = await apiRequest('/comments', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, text }),
  })
  
  // Очищаем кэш комментариев для этого заказа
  // Также инвалидируем списки заказов, так как комментарии могут влиять на отображение
  invalidateCache.orders()
  
  return result
}

// Добавляем функцию для удаления комментария к заказу
export async function deleteOrderComment(orderId: number, commentId: number): Promise<void> {
  await apiRequest(`/comments/${commentId}?order_id=${orderId}`, {
    method: 'DELETE',
  })
  
  // Очищаем кэш комментариев и списки заказов
  invalidateCache.orders()
}

// --- Проекты ---
export async function getProjectDetails(projectId: number) {
  return await cachedApiRequest(`/projects/${projectId}`, {}, `project_${projectId}`, CacheTTL.MEDIUM)
}

export async function updateOrderStage(orderId: number, stage: string, additionalData?: Record<string, any>): Promise<void> {
  const payload: Record<string, any> = { stage }
  
  // Добавляем дополнительные данные если они переданы
  if (additionalData) {
    Object.assign(payload, additionalData)
  }
  
  await apiRequest(`/orders/${orderId}/stage`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  
  // Инвалидируем весь кэш заказов после изменения стадии
  // Это важно, так как изменение стадии влияет на фильтрацию по стадиям
  invalidateCache.orders()
  
  // Сохраняем время последнего изменения
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastOrderChange', Date.now().toString())
  }
}

export async function createUser(data: CreateUserData & { image?: File }): Promise<User> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('username', data.username)
  formData.append('password', data.password)
  if (data.phone) formData.append('phone', data.phone)
  if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())
  if (data.image instanceof File) {
    formData.append('image', data.image)
  }
  // Если есть массив ролей, добавляем их
  if (data.roles && Array.isArray(data.roles)) {
    data.roles.forEach((role: number, idx: number) => {
      formData.append(`roles[${idx}]`, role.toString())
    })
  }

  const res = await apiRequest('/users', {
    method: 'POST',
    body: formData,
  })

  return res as User
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })
}

export async function getUser(id: number): Promise<User> {
  const res = await apiRequest(`/users/${id}`)
  return res as User
}

export async function getUsers({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'asc',
  per_page = 30,
  role = '',
  is_active = null,
  force_refresh = false,
} = {}): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: page.toString(),
    search,
    sort_by,
    sort_order,
    per_page: per_page.toString(),
  })
  if (role) params.append('role', role)
  if (is_active !== null) {
    params.append('is_active', String(is_active))
  }
  if (force_refresh) params.append('force_refresh', 'true')
  const cacheKey = `users_${params.toString()}`
  const res = await cachedApiRequest<PaginatedResponse<User>>(
    `/users?${params.toString()}`,
    {},
    cacheKey,
    CacheTTL.MEDIUM
  )
  return res
}

export async function getUsersByRole(role: string): Promise<any> {
  return await cachedApiRequest(
    `/users/role/${role}`,
    {},
    `users_by_role_${role}`,
    CacheTTL.LONG,
  )
}

export async function toggleUserActive(id: number): Promise<any> {
  const res = await apiRequest(`/users/${id}/toggle-active`, {
    method: 'PATCH',
  })
  return res
}

export async function updateUser(id: number, data: UpdateUserData & { image?: File }): Promise<User> {
  if (data.image instanceof File) {
    
    const formData = new FormData()
    
    // Добавляем только переданные поля
    if (data.name !== undefined) formData.append('name', data.name)
    if (data.username !== undefined) formData.append('username', data.username)
    if (data.phone !== undefined) formData.append('phone', data.phone === null ? '' : data.phone)
    if (data.password) formData.append('password', data.password)
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())
    
    // Добавляем изображение
    formData.append('image', data.image)
    
    // Добавляем роли если переданы
    if (data.roles && Array.isArray(data.roles)) {
      data.roles.forEach((role: number) => {
        formData.append('roles[]', role.toString())
      })
    }

    // Добавляем _method: PUT для Laravel
    formData.append('_method', 'PUT')

    const res = await apiRequest(`/users/${id}`, {
      method: 'POST',
      body: formData,
    })

    return res as User
  } else {
    // Для обновления без изображения используем обычный PUT
    const res = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res as User
  }
}

export async function getRoles(): Promise<
  Array<{ id: number; name: string; display_name?: string }>
> {
  const res = (await cachedApiRequest('/roles', {}, CacheKeys.ROLES, CacheTTL.VERY_LONG)) as { data?: any[] } | any[]
  return (res as any).data || res // поддержка разных форматов ответа
}

// Алиас для совместимости
export { getAllRoles as getRolesNew }

// === НОВЫЕ API ФУНКЦИИ ДЛЯ LARAVEL BACKEND ===

// --- Стадии (Stages) ---
export async function getAllStages(): Promise<any> {
  const res = await cachedApiRequest('/stages', {}, CacheKeys.STAGES, CacheTTL.VERY_LONG)
  return res
}

export async function createStage(data: any): Promise<any> {
  const res = await apiRequest('/stages', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res
}

export async function updateStage(id: number, data: any): Promise<any> {
  const res = await apiRequest(`/stages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res
}

export async function deleteStage(id: number): Promise<void> {
  await apiRequest(`/stages/${id}`, {
    method: 'DELETE',
  })
}

export async function reorderStages(stages: { id: number; order: number }[]): Promise<any> {
  const res = await apiRequest('/stages/reorder', {
    method: 'POST',
    body: JSON.stringify({ stages }),
  })
  return res
}

export async function getAvailableRoles(): Promise<any> {
  const res = await apiRequest('/stages/available-roles')
  return res
}

// Получить пользователей по ролям конкретной стадии
export async function getUsersByStageRoles(stageId: number): Promise<any> {
  const res = await apiRequest(`/stages/${stageId}/users-by-roles`)
  return res
}

// Получить всех пользователей по ролям всех стадий
export async function getAllUsersByStageRoles(forceRefresh = false): Promise<any> {
  // Если принудительное обновление, очищаем кэш
  if (forceRefresh) {
    frontendCache.invalidatePattern(CacheKeys.USERS_BY_STAGE_ROLES)
    frontendCache.invalidatePattern('users_by_stage_roles')
    frontendCache.invalidatePattern('stages_users_by_roles')
  }
  
  const res = await cachedApiRequest('/stages/users-by-roles/all', {}, CacheKeys.USERS_BY_STAGE_ROLES, CacheTTL.VERY_LONG)
  return res
}

// --- Роли (Roles) ---
export async function getAllRoles(): Promise<any> {
  const res = await cachedApiRequest('/roles', {}, CacheKeys.ROLES, CacheTTL.VERY_LONG)
  return res
}

// Получить роли со связанными стадиями и их цветами
export async function getRolesWithStages(forceRefresh = false): Promise<any> {
  const cacheKey = 'roles_with_stages'

  if (forceRefresh) {
    frontendCache.invalidatePattern(cacheKey)
  }

  return await cachedApiRequest('/roles?with=stages', {}, cacheKey, CacheTTL.LONG)
}

export async function createRole(data: any): Promise<any> {
  const res = await apiRequest('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res
}

export async function updateRole(id: number, data: any): Promise<any> {
  const res = await apiRequest(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res
}

export async function deleteRole(id: number): Promise<void> {
  await apiRequest(`/roles/${id}`, {
    method: 'DELETE',
  })
}

export async function assignUsersToRole(roleId: number, userIds: number[]): Promise<any> {
  const res = await apiRequest(`/roles/${roleId}/assign-users`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  })
  return res
}

export async function removeUsersFromRole(roleId: number, userIds: number[]): Promise<any> {
  const res = await apiRequest(`/roles/${roleId}/remove-users`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  })
  return res
}

// --- Управление стадиями продуктов --- (дублированные функции удалены, используем те что выше)

export async function addStageToProduct(productId: number, stageId: number): Promise<any> {
  const res = await apiRequest(`/products/${productId}/stages`, {
    method: 'POST',
    body: JSON.stringify({ stage_id: stageId }),
  })
  return res
}

export async function removeStageFromProduct(productId: number, stageId: number): Promise<void> {
  await apiRequest(`/products/${productId}/stages/${stageId}`, {
    method: 'DELETE',
  })
}

// --- Назначения продуктов (Product Assignments) ---
export async function getProductAssignments(productId: number): Promise<any> {
  return await cachedApiRequest(
    `/products/${productId}/assignments`,
    {},
    `product_assignments_${productId}`,
    CacheTTL.MEDIUM,
  )
}

export async function createProductAssignment(productId: number, data: any): Promise<any> {
  const res = await apiRequest(`/products/${productId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  frontendCache.invalidatePattern(`product_assignments_${productId}`)
  frontendCache.invalidatePattern(`available_users_for_product_${productId}`)
  return res
}

export async function updateProductAssignment(
  productId: number,
  assignmentId: number,
  data: any,
): Promise<any> {
  const res = await apiRequest(`/products/${productId}/assignments/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  frontendCache.invalidatePattern(`product_assignments_${productId}`)
  frontendCache.invalidatePattern(`available_users_for_product_${productId}`)
  return res
}

export async function deleteProductAssignment(
  productId: number,
  assignmentId: number,
): Promise<void> {
  await apiRequest(`/products/${productId}/assignments/${assignmentId}`, {
    method: 'DELETE',
  })
  frontendCache.invalidatePattern(`product_assignments_${productId}`)
  frontendCache.invalidatePattern(`available_users_for_product_${productId}`)
}

export async function bulkAssignProductUsers(productId: number, data: any): Promise<any> {
  const res = await apiRequest(`/products/${productId}/assignments/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  frontendCache.invalidatePattern(`product_assignments_${productId}`)
  frontendCache.invalidatePattern(`available_users_for_product_${productId}`)
  return res
}

export async function getAvailableUsersForProduct(productId: number): Promise<any> {
  return await cachedApiRequest(
    `/products/${productId}/assignments/available-users`,
    {},
    `available_users_for_product_${productId}`,
    CacheTTL.MEDIUM,
  )
}

// --- Назначения заказов (Order Assignments) ---
export async function assignOrderToUser(orderId: number, data: any): Promise<any> {
  const res = await apiRequest(`/orders/${orderId}/assign`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  // Инвалидируем кэш заказов, так как назначение влияет на фильтрацию по assignment_status
  invalidateCache.orders()
  
  return res
}

export async function bulkAssignOrders(orderId: number, data: any): Promise<any> {
  const res = await apiRequest(`/orders/${orderId}/bulk-assign`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  // Инвалидируем кэш заказов после массового назначения
  invalidateCache.orders()
  
  return res
}

export async function getOrderAssignments(): Promise<any> {
  const res = await apiRequest('/assignments')
  return res
}

export async function getOrderAssignment(assignmentId: number): Promise<any> {
  const res = await apiRequest(`/assignments/${assignmentId}`)
  return res
}

export async function updateOrderAssignmentStatus(
  assignmentId: number,
  status: string,
): Promise<any> {
  const res = await apiRequest(`/assignments/${assignmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  
  // Инвалидируем кэш заказов, так как изменение статуса назначения влияет на фильтрацию
  invalidateCache.orders()
  
  return res
}

export async function deleteOrderAssignment(assignmentId: number): Promise<void> {
  await apiRequest(`/assignments/${assignmentId}`, {
    method: 'DELETE',
  })
  
  // Инвалидируем кэш заказов после удаления назначения
  invalidateCache.orders()
}

// Массовые операции с назначениями
export async function bulkAssignGlobal(data: any): Promise<any> {
  const res = await apiRequest('/assignments/bulk-assign', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  // Инвалидируем кэш заказов после массового назначения
  invalidateCache.orders()
  
  return res
}

export async function bulkReassignOrders(data: any): Promise<any> {
  const res = await apiRequest('/assignments/bulk-reassign', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  // Инвалидируем кэш заказов после массового переназначения
  invalidateCache.orders()
  
  return res
}

export async function bulkUpdateAssignments(data: any): Promise<any> {
  const res = await apiRequest('/assignments/bulk-update', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res
}

// --- Категории ---
export async function getCategories({
  page = '1',
  search = '',
  sort_by = 'name',
  sort_order = 'asc',
  per_page = '30',
  forceRefresh = false,
} = {}): Promise<PaginatedResponse<Category>> {
  const params = []
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  if (page) params.push(`page=${page}`)
  if (sort_by) params.push(`sort_by=${encodeURIComponent(sort_by)}`)
  if (sort_order) params.push(`sort_order=${encodeURIComponent(sort_order)}`)
  if (per_page) params.push(`per_page=${per_page}`)
  if (forceRefresh) params.push('force_refresh=true') // Принудительное обновление кэша на бэкенде
  const query = params.length ? `?${params.join('&')}` : ''

  // Если forceRefresh, очищаем кэш
  if (forceRefresh) {
    frontendCache.invalidatePattern(`categories_`)
  }

  return await cachedApiRequest<PaginatedResponse<Category>>(
    `/categories${query}`,
    {},
    `categories_${query}`,
    CacheTTL.LONG
  )
}

export async function getAllCategories(): Promise<any[]> {
  const res = await cachedApiRequest('/categories/all', {}, CacheKeys.CATEGORIES, CacheTTL.VERY_LONG)
  // API возвращает {data: [...]}, поэтому извлекаем data
  const categories = (res as any)?.data || res
  return Array.isArray(categories) ? categories : []
}

export async function createCategory(data: any): Promise<any> {
  const res = await apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res
}

export async function updateCategory(id: number, data: any): Promise<any> {
  const res = await apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return res
}

export async function deleteCategory(id: number): Promise<void> {
  await apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  })
}

export async function getCategoryProducts(categoryId: number): Promise<any[]> {
  const res = await apiRequest(`/categories/${categoryId}/products`) as any
  return res.data || []
}

/**
 * Batch API запрос - объединяет несколько запросов в один
 * Полезно для медленного интернета - уменьшает количество запросов
 */
export async function batchRequest(requests: Array<{
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
}>): Promise<Array<{ success: boolean; data?: any; error?: string }>> {
  return await apiRequest('/batch', {
    method: 'POST',
    body: JSON.stringify({ requests }),
  })
}
