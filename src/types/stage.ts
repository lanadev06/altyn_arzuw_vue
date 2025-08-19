export type { Stage, Role } from './api'

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
