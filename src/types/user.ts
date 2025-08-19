export type { User } from './api'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DESIGNER = 'designer',
  PRINT_OPERATOR = 'print_operator',
  ENGRAVING_OPERATOR = 'engraving_operator',
  WORKSHOP_WORKER = 'workshop_worker',
}

export interface UserFilters {
  role?: UserRole
  search?: string
  is_active?: boolean
}

export interface CreateUserData {
  name: string
  username: string
  phone?: string
  password: string
  password_confirmation?: string
  is_active?: boolean
  image?: File

  // Новая система ролей (Laravel)
  roles: number[] // массив ID ролей

  // Устаревшие поля (для обратной совместимости)
  role?: UserRole
}

export interface UpdateUserData {
  name?: string
  username?: string
  phone?: string
  password?: string
  password_confirmation?: string
  is_active?: boolean
  image?: File

  // Новая система ролей (Laravel)
  roles?: number[] // массив ID ролей

  // Устаревшие поля (для обратной совместимости)
  role?: UserRole
}
