import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { apiRequest } from '../services/api'
import { useToast } from '../stores/toast'

export function useBulkActions<T extends { id: number }>(items: Ref<T[]> | ComputedRef<T[]>) {
  const toast = useToast()
  
  const selectedIds = ref<number[]>([])
  const isProcessing = ref(false)

  const getItemsList = () => {
    const value = items.value || []
    return Array.isArray(value) ? value : []
  }

  const selectAll = computed({
    get() {
      const itemsList = getItemsList()
      const allSelected = selectedIds.value.length === itemsList.length && itemsList.length > 0
      return allSelected
    },
    set(value: boolean) {
      const itemsList = getItemsList()
      selectedIds.value = value ? itemsList.map(item => item.id) : []
    }
  })

  const hasSelection = computed(() => selectedIds.value.length > 0)
  const selectedCount = computed(() => selectedIds.value.length)

  function toggleSelect(id: number) {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  async function bulkDelete(entity: string): Promise<{ deleted: number; errors?: string[] }> {
    if (selectedIds.value.length === 0) {
      toast.error('Выберите элементы для удаления')
      return { deleted: 0 }
    }

    isProcessing.value = true

    try {
      const response = await apiRequest(`/bulk-delete/${entity}`, {
        method: 'POST',
        body: JSON.stringify({
          ids: selectedIds.value
        })
      })

      const result = response as {
        message: string
        deleted: number
        skipped: number
        errors?: string[]
      }

      // Показываем результат
      if (result.deleted > 0) {
        if (result.skipped > 0) {
          toast.show(`Успешно удалено: ${result.deleted}. Пропущено: ${result.skipped}`, 'error')
        } else {
          toast.success(`Успешно удалено: ${result.deleted}`)
        }
      }

      // Показываем ошибки если есть
      if (result.errors && result.errors.length > 0) {
        setTimeout(() => {
          result.errors?.forEach(error => {
            toast.error(error)
          })
        }, 1000)
      }

      // Очищаем выбор
      clearSelection()

      return result
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      
      toast.error(error.message || 'Ошибка при удалении элементов')

      return { deleted: 0, errors: [error.message] }
    } finally {
      isProcessing.value = false
    }
  }

  async function bulkUpdateOrderStatus(
    stage: string,
    additionalData?: Record<string, any>
  ): Promise<{ updated: number; errors?: string[] }> {
    if (selectedIds.value.length === 0) {
      toast.error('Выберите заказы для обновления')
      return { updated: 0 }
    }

    isProcessing.value = true

    try {
      const payload: Record<string, any> = {
        ids: selectedIds.value,
        stage
      }

      if (additionalData) {
        Object.assign(payload, additionalData)
      }

      const response = await apiRequest('/orders/bulk-update-status', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const result = response as {
        message: string
        updated: number
        total_requested: number
        errors?: string[]
      }

      // Показываем результат
      if (result.updated > 0) {
        const totalRequested = result.total_requested || selectedIds.value.length
        if (result.updated === totalRequested) {
          toast.success(`Успешно обновлено заказов: ${result.updated}`)
        } else {
          toast.show(`Обновлено заказов: ${result.updated} из ${totalRequested}`, 'warning')
        }
      } else if (result.errors && result.errors.length > 0) {
        // No orders were updated, but we have errors
        const totalRequested = result.total_requested || selectedIds.value.length
        toast.error(`Не удалось обновить ни одного заказа из ${totalRequested}. Проверьте назначения.`)
      }

      // Показываем ошибки если есть (но не все сразу, чтобы не спамить)
      if (result.errors && result.errors.length > 0) {
        setTimeout(() => {
          if (result.errors!.length <= 3) {
            // Показываем каждую ошибку если их немного
            result.errors!.forEach(error => {
              toast.error(error)
            })
          } else {
            // Если ошибок много, показываем только первые 2 и общее количество
            result.errors!.slice(0, 2).forEach(error => {
              toast.error(error)
            })
            toast.error(`... и еще ${result.errors!.length - 2} ошибок. Проверьте назначения заказов.`)
          }
        }, 1000)
      }

      // Очищаем выбор
      clearSelection()

      return result
    } catch (error: any) {
      console.error('Bulk status update error:', error)
      
      // Parse the error message to provide better feedback
      let errorMessage = error.message || 'Ошибка при обновлении статуса заказов'
      
      // If it's a validation error with multiple orders, show a summary
      if (errorMessage.includes('нельзя завершить, пока есть неодобренные назначения')) {
        const orderIds = errorMessage.match(/Заказ ID (\d+)/g) || []
        const totalOrders = orderIds.length
        const selectedCount = selectedIds.value.length
        
        if (totalOrders === selectedCount) {
          // All selected orders have the same issue
          toast.error(`Все выбранные заказы (${totalOrders}) нельзя завершить - есть неодобренные назначения. Сначала одобрите все назначения.`)
        } else {
          // Some orders succeeded, some failed
          toast.error(`${totalOrders} из ${selectedCount} заказов нельзя завершить - есть неодобренные назначения.`)
        }
      } else {
        // Generic error message
        toast.error(errorMessage)
      }

      return { updated: 0, errors: [error.message] }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    selectedIds,
    isProcessing,
    selectAll,
    hasSelection,
    selectedCount,
    toggleSelect,
    clearSelection,
    bulkDelete,
    bulkUpdateOrderStatus
  }
}

