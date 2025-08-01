import apiClient from './apiClient'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignUsersRequest,
  RemoveUsersRequest,
} from '../types/role'

export const roleApi = {
  // Получить все роли
  getAll: () => apiClient.get('/roles'),

  // Получить роль по ID
  getById: (id: number) => apiClient.get(`/roles/${id}`),

  // Создать новую роль
  create: (data: CreateRoleRequest) => apiClient.post('/roles', data),

  // Обновить роль
  update: (id: number, data: UpdateRoleRequest) => apiClient.put(`/roles/${id}`, data),

  // Удалить роль
  delete: (id: number) => apiClient.delete(`/roles/${id}`),

  // Назначить пользователей на роль
  assignUsers: (id: number, data: AssignUsersRequest) =>
    apiClient.post(`/roles/${id}/assign-users`, data),

  // Убрать пользователей с роли
  removeUsers: (id: number, data: RemoveUsersRequest) =>
    apiClient.post(`/roles/${id}/remove-users`, data),
}
