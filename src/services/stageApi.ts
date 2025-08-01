import apiClient from './apiClient'
import type {
  Stage,
  CreateStageRequest,
  UpdateStageRequest,
  ReorderStagesRequest,
} from '@/types/stage'

export const stageApi = {
  // Получить все стадии
  getAll: () => apiClient.get('/stages'),

  // Получить стадию по ID
  getById: (id: number) => apiClient.get(`/stages/${id}`),

  // Создать новую стадию
  create: (data: CreateStageRequest) => apiClient.post('/stages', data),

  // Обновить стадию
  update: (id: number, data: UpdateStageRequest) => apiClient.put(`/stages/${id}`, data),

  // Удалить стадию
  delete: (id: number) => apiClient.delete(`/stages/${id}`),

  // Изменить порядок стадий
  reorder: (data: ReorderStagesRequest) => apiClient.post('/stages/reorder', data),

  // Получить доступные роли
  getAvailableRoles: () => apiClient.get('/stages/available-roles'),
}
