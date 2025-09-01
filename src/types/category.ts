export interface Category {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface CategoryForm {
  name: string
}

export interface ProductCategory {
  id: number
  product_id: number
  category_id: number
  created_at: string
  updated_at: string
}

