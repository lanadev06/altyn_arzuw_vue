import { api } from './apiClient'
import type {
  Stage,
  CreateStageRequest,
  UpdateStageRequest,
  ReorderStagesRequest,
} from '@/types/stage'

export const stageApi = {
  // Получить все стадии
  getAll: () => api.get<Stage[]>('/stages'),

  // Получить стадию по ID
  getById: (id: number) => api.get<Stage>(`/stages/${id}`),

  // Создать новую стадию
  create: (data: CreateStageRequest) => api.post<Stage>('/stages', data),

  // Обновить стадию
  update: (id: number, data: UpdateStageRequest) => api.put<Stage>(`/stages/${id}`, data),

  // Удалить стадию
  delete: (id: number) => api.delete(`/stages/${id}`),

  // Изменить порядок стадий
  reorder: (data: ReorderStagesRequest) => api.post('/stages/reorder', data),

  // Получить доступные роли
  getAvailableRoles: () => api.get('/stages/available-roles'),
}
