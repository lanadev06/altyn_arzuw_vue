import { handle401Error } from '../utils/auth'
import { API_CONFIG } from '../config/api'

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = {
  async request(config: any) {
    try {
      // Добавляем токен авторизации
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        }
      }

      // Добавляем базовый URL
      config.url = `${API_CONFIG.BASE_URL}${config.url}`

      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...config.headers,
        },
        body: config.data ? JSON.stringify(config.data) : undefined,
      })

      // Обработка 401 ошибки
      if (response.status === 401) {
        handle401Error()
        throw new Error('Unauthorized')
      }

      // Обработка 403 ошибки
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Access denied')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  },

  get(url: string, config = {}) {
    return this.request({ ...config, method: 'GET', url })
  },

  post(url: string, data?: any, config = {}) {
    return this.request({ ...config, method: 'POST', url, data })
  },

  put(url: string, data?: any, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data })
  },

  patch(url: string, data?: any, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data })
  },

  delete(url: string, config = {}) {
    return this.request({ ...config, method: 'DELETE', url })
  },
}

export default apiClient
