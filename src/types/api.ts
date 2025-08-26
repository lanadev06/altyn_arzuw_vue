// Базовые интерфейсы для API ответов

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number
  to: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// Интерфейсы для пользователей
export interface User {
  id: number
  name: string
  username: string
  phone?: string
  is_active: boolean
  image?: string
  image_url?: string // For compatibility with components
  roles: Role[]
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  display_name: string // Make required to match component expectations
  description?: string
  order?: number // Make optional to match API response
  is_active?: boolean // Make optional to match API response
  color?: string // Make optional to match API response
  created_at: string
  updated_at: string
  roles?: Role[] // For nested roles
}

// Интерфейсы для заказов
export interface Order {
  id: number
  client_id: number
  project_id?: number
  product_id: number
  stage_id?: number
  quantity: number
  deadline?: string
  price?: number
  stage?: string | { id: number; name: string; display_name?: string }
  work_type?: string
  stages?: number[]
  assignments?: OrderAssignment[]
  created_at: string
  updated_at: string
  client?: Client
  product?: Product
  project?: Project
  current_stage_info?: Stage // For compatibility with components
  current_stage?: Stage // For compatibility with components
  is_archived?: boolean // For compatibility with components
  archived_at?: string // For compatibility with components
  reason?: string // For compatibility with components
  reason_status?: string // For compatibility with components
  // Additional fields for component compatibility
  title?: string // For compatibility with components
  project_title?: string // For compatibility with components
  status?: string // For compatibility with components
}

export interface OrderAssignment {
  id: number
  order_id: number
  user_id: number
  role_type: string
  stage_id?: number
  status: string // Make required to match component expectations
  assigned_by?: number // For compatibility with components
  assigned_stages?: Stage[] // For compatibility with components
  stage_name?: string // For compatibility with components
  order_stage?: string // For compatibility with components
  created_at: string
  updated_at: string
  user?: User
}

// Интерфейс для создания назначений заказов
export interface OrderAssignmentCreate {
  user_id: number
  role_type: string
  stage_id?: number
}

// Интерфейсы для клиентов
export interface Client {
  id: number
  name: string
  company_name?: string
  created_at: string
  updated_at: string
  contacts: ClientContact[]
}

export interface ClientContact {
  id: number
  client_id: number
  name: string
  phone: string
  email?: string
  type: string // For compatibility with components
  value: string // For compatibility with components
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Интерфейсы для продуктов
export interface Product {
  id: number
  name: string
  description?: string
  price?: number
  has_engraving: boolean
  created_at: string
  updated_at: string
  assignments: ProductAssignment[]
  stages?: Stage[] // For compatibility with components
  available_stages?: Stage[] // For compatibility with components
  has_design_stage?: boolean
  has_print_stage?: boolean
  has_engraving_stage?: boolean
  has_workshop_stage?: boolean
  designers?: ProductAssignment[] // For compatibility with components
  print_operators?: ProductAssignment[] // For compatibility with components
  engraving_operators?: ProductAssignment[] // For compatibility with components
  workshop_workers?: ProductAssignment[] // For compatibility with components
}

export interface ProductAssignment {
  id: number
  product_id: number
  user_id: number | null // Allow null to match component expectations
  role_type: string
  stage_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User | null
}

// Интерфейсы для проектов
export interface Project {
  id: number
  name: string
  title?: string // For compatibility with components
  description?: string
  client_id: number
  total_price?: number
  payment_amount?: number
  deadline?: string
  status: string
  created_at: string
  updated_at: string
  client?: Client
  items?: unknown[]
  orders?: Order[]
}

// Интерфейсы для стадий
export interface Stage {
  id: number
  name: string
  display_name: string
  description?: string
  order: number
  is_active: boolean
  color: string
  created_at: string
  updated_at: string
  roles?: Role[]
}

// Интерфейсы для комментариев
export interface Comment {
  id: number
  order_id: number
  user_id: number
  text: string
  created_at: string
  updated_at: string
  user?: User
}

// Интерфейсы для аудит-логов
export interface AuditLog {
  id: number
  user_id: number
  event: string
  auditable_type: string
  auditable_id: number
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
  user?: User
}

// Интерфейсы для уведомлений
export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read_at?: string
  created_at: string
}

// Интерфейсы для статистики
export interface DashboardStats {
  total_orders: number
  active_orders: number
  completed_orders: number
  total_revenue: number
  monthly_revenue: number
  top_products: Array<{
    id: number
    name: string
    order_count: number
  }>
}

export interface UserStats {
  total_assignments: number
  completed_assignments: number
  pending_assignments: number
  in_progress_assignments: number
  delayed_assignments: number
}

export interface EmployeeDashboard {
  assigned_orders: number
  completed_orders: number
  pending_orders: number
  recent_activities: Array<{
    id: number
    type: string
    description: string
    created_at: string
  }>
}

export interface RevenueByMonthData {
  month: number
  month_name: string
  revenue: number
  revenue_formatted: string
}

export interface RevenueByMonthResponse {
  monthly_data: RevenueByMonthData[]
  total_revenue: number
  total_revenue_formatted: string
  year: number
}

// Интерфейсы для форм
export interface CreateOrderData {
  client_id: number
  project_id?: number
  product_id: number
  quantity: number
  deadline?: string
  price?: number
  stage?: string
  work_type?: string
  stages?: number[]
  assignments?: OrderAssignmentCreate[]
}

export type UpdateOrderData = Partial<CreateOrderData>

// Интерфейс для формы заказа (используется в компонентах)
export interface OrderForm {
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

export interface CreateUserData {
  name: string
  username: string
  phone?: string
  password: string
  password_confirmation?: string
  is_active?: boolean
  image?: File
  roles: number[]
}

export type UpdateUserData = Partial<CreateUserData>

// Интерфейсы для фильтров
export interface OrderFilters {
  stage?: string
  is_archived?: boolean
  assignment_status?: string
}

// Интерфейсы для API запросов
export interface ApiRequestConfig {
  timeout?: number
  retries?: number
}

// Типы для обработки ошибок
export type ApiErrorHandler = (error: ApiError) => void

// Типы для колбэков
export type SuccessCallback<T> = (data: T) => void
export type ErrorCallback = (error: ApiError) => void
