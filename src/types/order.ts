export type { Order, OrderAssignment, OrderAssignmentCreate, OrderForm } from './api'

import type { OrderAssignmentCreate as _OrderAssignmentCreate } from './api'

export interface OrderUpdateForm {
  client_id?: number
  project_id?: number
  product_id?: number
  quantity?: number
  deadline?: string
  price?: number
  stage?: string
  work_type?: string
  stages?: number[]
  assignments?: _OrderAssignmentCreate[]
}

export interface StageUpdateForm {
  stage: string
  reason?: string
  reason_status?: string
  work_type?: string
}

export interface BulkOrderAssignmentData {
  order_ids: number[]
  assignments: {
    role_type: string
    user_id: number
    stage_id?: number
  }[]
}
