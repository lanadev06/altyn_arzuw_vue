export interface Stage {
  id: number
  name: string
  display_name: string
  description?: string | null
  order: number
  color?: string
  created_at: string
  updated_at: string
  roles?: Role[]
}

export interface Role {
  id: number
  name: string
  display_name: string
}

export interface CreateStageRequest {
  name: string
  display_name: string
  description?: string
  order?: number
  color?: string
  roles?: Array<{ role_id: number }>
}

export interface UpdateStageRequest {
  name?: string
  display_name?: string
  description?: string
  order?: number
  color?: string
  roles?: Array<{ role_id: number }>
}

export interface ReorderStagesRequest {
  stages: Array<{
    id: number
    order: number
  }>
}
