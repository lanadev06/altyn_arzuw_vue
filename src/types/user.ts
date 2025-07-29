export interface Role {
  id: number
  name: string
  display_name?: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  name: string
  username: string
  phone?: string
  image?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string

  // Новая система множественных ролей (Laravel)
  roles: Role[]

  // Устаревшие поля (для обратной совместимости)
  role?: UserRole
}

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
