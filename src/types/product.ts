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
  stages?: Array<{
    stage_id: number
    is_available: boolean
  }>
  // Multiple assignments
  assignments?: ProductAssignment[]
  // Stages system
  available_stages?: Stage[]
  // Categories
  categories?: number[]
  // Index signature for dynamic access
  [key: string]: unknown
}

// Type guard to check if object is ProductForm
export function isProductForm(obj: unknown): obj is ProductForm {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'has_engraving' in obj
}
