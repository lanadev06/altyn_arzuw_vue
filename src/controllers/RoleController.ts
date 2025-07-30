import { roleApi } from '../services/roleApi'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignUsersRequest,
  RemoveUsersRequest,
} from '../types/role'

class RoleController {
  async getAll(): Promise<Role[]> {
    try {
      const response = await roleApi.getAll()
      return response
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  }

  async getById(id: number): Promise<Role> {
    try {
      const response = await roleApi.getById(id)
      return response
    } catch (error) {
      console.error('Error fetching role:', error)
      throw error
    }
  }

  async create(data: CreateRoleRequest): Promise<Role> {
    try {
      const response = await roleApi.create(data)
      return response
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  async update(id: number, data: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await roleApi.update(id, data)
      return response
    } catch (error) {
      console.error('❌ Error updating role:', error)
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await roleApi.delete(id)
    } catch (error) {
      console.error('❌ Error deleting role:', id, error)
      throw error
    }
  }

  async assignUsers(id: number, data: AssignUsersRequest): Promise<void> {
    try {
      await roleApi.assignUsers(id, data)
    } catch (error) {
      console.error('Error assigning users to role:', error)
      throw error
    }
  }

  async removeUsers(id: number, data: RemoveUsersRequest): Promise<void> {
    try {
      await roleApi.removeUsers(id, data)
    } catch (error) {
      console.error('Error removing users from role:', error)
      throw error
    }
  }
}

export default new RoleController()
