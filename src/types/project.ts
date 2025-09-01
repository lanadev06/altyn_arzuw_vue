import type { Project as ApiProject } from './api'

export interface Project extends ApiProject {
  items?: unknown[]
  client?: unknown
  orders?: unknown[]
}
