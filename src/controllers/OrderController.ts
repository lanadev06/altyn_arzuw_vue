import { API_CONFIG } from '@/config/api'
import type { Order, OrderForm, OrderUpdateForm, StageUpdateForm } from '@/types/order'

export const OrderController = () => {
  const getAll = async (params?: {
    project_id?: number
    stage?: string
    page?: number
    sort_by?: string
    sort_order?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.project_id) queryParams.append('project_id', params.project_id.toString())
    if (params?.stage) queryParams.append('stage', params.stage)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''

    const response = await fetch(`${API_CONFIG.BASE_URL}/orders${query}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (!response.ok) throw new Error('Ошибка загрузки заказов')
    return await response.json()
  }

  const getById = async (id: number) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (!response.ok) throw new Error('Ошибка загрузки заказа')
    return await response.json()
  }

  const create = async (data: OrderForm) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Ошибка создания заказа')
    return await response.json()
  }

  const update = async (id: number, data: OrderUpdateForm) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Ошибка обновления заказа')
    return await response.json()
  }

  const updateStage = async (id: number, data: StageUpdateForm) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}/stage`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Ошибка обновления статуса')
    return await response.json()
  }

  const remove = async (id: number) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (!response.ok) throw new Error('Ошибка удаления заказа')
    return await response.json()
  }

  return {
    getAll,
    getById,
    create,
    update,
    updateStage,
    remove,
  }
}
