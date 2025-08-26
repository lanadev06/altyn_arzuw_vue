// Типы для компонентов OrderDetails
export interface User {
  id: number
  name: string
  role?: string
  roles?: Array<{ name: string; display_name: string }>
}

export interface Role {
  id: number
  name: string
  display_name?: string
  color?: string
}

export interface Stage {
  id: number
  name: string
  display_name?: string
  color?: string
  roles?: Role[]
}

export interface Assignment {
  id: number
  user_id: number
  user?: User
  role_type: string
  status: string
  assigned_stages?: Stage[]
  stage_name?: string
  order_stage?: string
  order_id?: number
  assigned_by?: User | number | string | unknown
  updating?: boolean
}

export interface OrderComment {
  id: number
  text: string
  user: User
  created_at: string
}

export interface StatusLog {
  id: number
  from_status: string
  to_status: string
  changed_at: string
  user?: User
}

export interface StageTransition {
  from: string
  to: string
  message: string
}

export interface AssignmentStatusResponse {
  stage_transition?: StageTransition
}

export interface UserWithRole extends User {
  displayName: string
  roleForStage: string
}

export interface ContactInfo {
  id: number
  type: string
  value: string
}

export interface ClientInfo {
  id: number
  name: string
  company_name?: string
  contacts?: ContactInfo[]
}

export interface ProjectInfo {
  id: number
  title: string
}

export interface OrderInfo {
  id: number
  quantity: number
  price?: number
  deadline?: string
  stage: string | { name: string }
  product?: { name: string }
  client?: ClientInfo
  project_id?: number
  is_archived?: boolean
  archived_at?: string
  reason?: string
  reason_status?: string
  assignments?: Assignment[]
}
