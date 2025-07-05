export interface Project {
  id: number
  title: string
  client_id: number
  deadline: string | null
  total_price: number | null
  payment_amount: number | null
  created_at: string
  updated_at: string
  items: any[]
  client?: any
}
