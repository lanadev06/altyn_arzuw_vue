import type { Stage } from './stage'

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string | null
  color?: string | null
  created_at: string
  updated_at: string
  stages?: Stage[]
  users_count?: number
  users?: User[]
  pivot?: {
    is_required?: boolean
    auto_assign?: boolean
    stage_id?: number
    role_id?: number
  }
}

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
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
