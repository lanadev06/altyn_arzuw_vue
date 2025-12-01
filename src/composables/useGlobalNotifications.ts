import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderModal } from '../stores/orderModal'
import { useToast } from '../stores/toast'
import { getOrderDetails } from '../services/api'

/**
 * Composable для глобальной обработки уведомлений
 * Обеспечивает правильное открытие модалок заказов при клике на уведомления
 */
export function useGlobalNotifications() {
  const router = useRouter()
  const orderModal = useOrderModal()
  const toast = useToast()

  function handleOpenOrderDetails(event: CustomEvent) {
    const { orderId, commentId, highlightComments } = event.detail
    if (!orderId) return

    ;(async () => {
      try {
        await getOrderDetails(orderId)
      } catch (error: any) {
        const status = error?.status
        if (status === 404) {
          toast.error('Этот заказ был удалён')
        } else {
          const message = error instanceof Error && error.message ? error.message : 'Не удалось открыть заказ'
          toast.error(message)
        }
        return
      }

      if (commentId) {
        localStorage.setItem('highlightCommentId', commentId.toString())
      }
      if (highlightComments) {
        sessionStorage.setItem('highlightComments', 'true')
      }

      orderModal.open(orderId)

      // Если мы на странице заказов, обновляем query параметр
      if (router.currentRoute.value.name === 'orders' || router.currentRoute.value.path.includes('/orders')) {
        router.replace({
          query: {
            ...router.currentRoute.value.query,
            order: orderId.toString(),
          },
        }).catch(() => {})
      } else {
        // Если мы на другой странице, переходим на страницу заказов
        router.push({
          name: 'orders',
          query: { order: orderId.toString() }
        }).catch(() => {})
      }
    })()
  }

  function handleOpenProjectDetails(event: CustomEvent) {
    const { projectId } = event.detail
    if (projectId) {
      // Если мы на странице проектов, открываем модалку
      if (router.currentRoute.value.name === 'projects' || router.currentRoute.value.path.includes('/projects')) {
        // Отправляем событие для открытия модалки на странице проектов
        document.dispatchEvent(new CustomEvent('openProjectDetails', {
          detail: { projectId }
        }))
      } else {
        // Если мы на другой странице, переходим на страницу проектов
        router.push({
          name: 'projects',
          query: { project: projectId }
        })
      }
    }
  }

  function handleOpenClientDetails(event: CustomEvent) {
    const { clientId } = event.detail
    if (clientId) {
      // Если мы на странице клиентов, открываем модалку
      if (router.currentRoute.value.name === 'clients' || router.currentRoute.value.path.includes('/clients')) {
        // Отправляем событие для открытия модалки на странице клиентов
        document.dispatchEvent(new CustomEvent('openClientDetails', {
          detail: { clientId }
        }))
      } else {
        // Если мы на другой странице, переходим на страницу клиентов
        router.push({
          name: 'clients',
          query: { client: clientId }
        })
      }
    }
  }

  onMounted(() => {
    // Добавляем глобальные обработчики для уведомлений
    document.addEventListener('openOrderDetails', handleOpenOrderDetails as EventListener)
    document.addEventListener('openProjectDetails', handleOpenProjectDetails as EventListener)
    document.addEventListener('openClientDetails', handleOpenClientDetails as EventListener)
  })

  onUnmounted(() => {
    // Удаляем обработчики при размонтировании
    document.removeEventListener('openOrderDetails', handleOpenOrderDetails as EventListener)
    document.removeEventListener('openProjectDetails', handleOpenProjectDetails as EventListener)
    document.removeEventListener('openClientDetails', handleOpenClientDetails as EventListener)
  })

  return {
    handleOpenOrderDetails,
    handleOpenProjectDetails,
    handleOpenClientDetails
  }
}
