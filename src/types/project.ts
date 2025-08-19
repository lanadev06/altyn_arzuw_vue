import type { Project as ApiProject } from './api'

export interface Project extends ApiProject {
  items?: any[]
  client?: any
  orders?: any[]
}
