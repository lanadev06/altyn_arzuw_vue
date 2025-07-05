export interface User {
  id: number
  name: string
  username: string
  phone?: string
  role: UserRole
  image?: string
  created_at?: string
  updated_at?: string
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DESIGNER = 'designer',
  PRINT_OPERATOR = 'print_operator',
  WORKSHOP_WORKER = 'workshop_worker',
}

export interface UserFilters {
  role?: UserRole
  search?: string
}

export interface CreateUserData {
  name: string
  username: string
  phone?: string
  password: string
  role: UserRole
  image?: File
}

export interface UpdateUserData {
  name?: string
  phone?: string
  password?: string
  role?: UserRole
  image?: File
}
