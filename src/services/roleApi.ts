import { api } from './apiClient'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignUsersRequest,
  RemoveUsersRequest,
} from '../types/role'

export const roleApi = {
  // Получить все роли
  getAll: () => api.get<Role[]>('/roles'),

  // Получить роль по ID
  getById: (id: number) => api.get<Role>(`/roles/${id}`),

  // Создать новую роль
  create: (data: CreateRoleRequest) => api.post<Role>('/roles', data),

  // Обновить роль
  update: (id: number, data: UpdateRoleRequest) => api.put<Role>(`/roles/${id}`, data),

  // Удалить роль
  delete: (id: number) => api.delete(`/roles/${id}`),

  // Назначить пользователей на роль
  assignUsers: (id: number, data: AssignUsersRequest) =>
    api.post(`/roles/${id}/assign-users`, data),

  // Убрать пользователей с роли
  removeUsers: (id: number, data: RemoveUsersRequest) =>
    api.post(`/roles/${id}/remove-users`, data),
}
