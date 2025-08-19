import type { Product, ProductAssignment, Stage } from './api'

export type { Product, ProductAssignment, Stage }

export interface ProductAssignmentPartial {
  id?: number
  product_id: number
  user_id?: number
  role_type: string
  stage_id?: number
  is_active?: boolean
}

export interface ProductAssignmentMinimal {
  id: number
  product_id: number
  user_id: number
  role_type: string
  stage_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssignmentLike {
  id: number
  user_id: number
  role_type: string
  stage_id?: number
}

export interface ProductForm {
  name: string
  description?: string
  price?: number
  has_engraving: boolean
  designer_id?: number
  print_operator_id?: number
  workshop_worker_id?: number
  engraving_operator_id?: number
  stages?: Array<{
    stage_id: number
    is_available: boolean
  }>
  // Legacy fields for backward compatibility
  has_design_stage?: boolean
  has_print_stage?: boolean
  has_engraving_stage?: boolean
  has_workshop_stage?: boolean
  // Multiple assignments
  designers?: ProductAssignment[]
  print_operators?: ProductAssignment[]
  engraving_operators?: ProductAssignment[]
  workshop_workers?: ProductAssignment[]
  // Stages system
  available_stages?: Stage[]
  // Index signature for dynamic access
  [key: string]: unknown
}

// Type guard to check if object is ProductForm
export function isProductForm(obj: unknown): obj is ProductForm {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'has_engraving' in obj
}
