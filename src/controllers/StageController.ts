import { stageApi } from '@/services/stageApi'
import type {
  Stage,
  CreateStageRequest,
  UpdateStageRequest,
  ReorderStagesRequest,
} from '@/types/stage'

class StageController {
  async getAll(): Promise<Stage[]> {
    try {
      const response = await stageApi.getAll()
      return response
    } catch (error) {
      console.error('Error fetching stages:', error)
      throw error
    }
  }

  async getById(id: number): Promise<Stage> {
    try {
      const response = await stageApi.getById(id)
      return response
    } catch (error) {
      console.error('Error fetching stage:', error)
      throw error
    }
  }

  async create(data: CreateStageRequest): Promise<Stage> {
    try {
      const response = await stageApi.create(data)
      return response
    } catch (error) {
      console.error('Error creating stage:', error)
      throw error
    }
  }

  async update(id: number, data: UpdateStageRequest): Promise<Stage> {
    try {
      const response = await stageApi.update(id, data)
      return response
    } catch (error) {
      console.error('Error updating stage:', error)
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await stageApi.delete(id)
    } catch (error) {
      console.error('Error deleting stage:', error)
      throw error
    }
  }

  async reorder(data: ReorderStagesRequest): Promise<void> {
    try {
      await stageApi.reorder(data)
    } catch (error) {
      console.error('Error reordering stages:', error)
      throw error
    }
  }

  async getAvailableRoles() {
    try {
      const response = await stageApi.getAvailableRoles()
      return response
    } catch (error) {
      console.error('Error fetching available roles:', error)
      throw error
    }
  }
}

export default new StageController()
