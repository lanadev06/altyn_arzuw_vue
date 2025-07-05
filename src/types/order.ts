export interface Order {
  id: number
  title: string
  project_id?: number | null
  client_id?: number | null
  status: string
  created_at: string
  updated_at: string
  // Добавьте другие поля по необходимости
  [key: string]: any
}
