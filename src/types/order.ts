import type { User } from './user'
import type { Stage } from './stage'

export interface OrderAssignment {
  id: number
  order_id: number
  user_id: number
  role_type: string
  stage_id?: number
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  assigned_at: string
  completed_at?: string
  user: User
}

export interface OrderAssignmentCreate {
  user_id: number
  role_type: string
  stage_id?: number
  is_active?: boolean
}

export interface Order {
  id: number
  client_id: number | null
  project_id?: number | null
  product_id?: number | null
  quantity?: number
  deadline?: string | null
  price?: number | null

  // Новая система стадий (Laravel)
  stage: string
  current_stage?: Stage
  current_stage_info?: Stage
  stages?: Stage[] // Стадии, выбранные для этого заказа

  // Система назначений (Laravel)
  assignments: OrderAssignment[]
  assigned_stages?: any[]

  // Связанные модели
  client?: {
    id: number
    name: string
    company_name?: string | null
  } | null
  product?: {
    id: number
    name: string
    available_stages?: Stage[]
  } | null
  project?: {
    id: number
    name: string
  } | null

  // Статусы и архивирование
  status?: string
  reason?: string
  reason_status?: string
  is_archived?: boolean
  archived_at?: string

  // Временные метки
  created_at: string
  updated_at: string

  // Устаревшие поля (для обратной совместимости)
  title?: string
  has_design_stage?: boolean
  has_print_stage?: boolean
  has_workshop_stage?: boolean
  has_engraving_stage?: boolean
  designer_id?: number | null
  print_operator_id?: number | null
  workshop_worker_id?: number | null

  // Дополнительные поля
  work_type?: string
  [key: string]: any
}

export interface OrderForm {
  client_id: number
  project_id?: number
  product_id?: number
  quantity?: number
  deadline?: string | null
  price?: number | null
  stage?: string
  work_type?: string
  stages?: number[] // ID выбранных стадий
  assignments?: OrderAssignmentCreate[] // Назначения по стадиям

  // Устаревшие поля (для обратной совместимости)
  has_design_stage?: boolean
  has_print_stage?: boolean
  has_workshop_stage?: boolean
  has_engraving_stage?: boolean
  designer_id?: number | null
  print_operator_id?: number | null
  workshop_worker_id?: number | null
}

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
  assignments?: OrderAssignmentCreate[]
}

export interface StageUpdateForm {
  stage: string
  reason?: string
  reason_status?: string
  work_type?: string
  designer_id?: number
  print_operator_id?: number
  workshop_worker_id?: number
}

// Для массовых назначений заказов
export interface BulkOrderAssignmentData {
  order_ids: number[]
  assignments: {
    role_type: string
    user_id: number
    stage_id?: number
  }[]
}
