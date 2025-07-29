export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  created_at: string
  updated_at: string
  stages?: Stage[]
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRoleRequest {
  name: string
  display_name: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  display_name?: string
  description?: string
}

export interface AssignUsersRequest {
  user_ids: number[]
}

export interface RemoveUsersRequest {
  user_ids: number[]
}
