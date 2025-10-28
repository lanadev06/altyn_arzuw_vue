import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composable для глобальной обработки уведомлений
 * Обеспечивает правильное открытие модалок заказов при клике на уведомления
 */
export function useGlobalNotifications() {
  const router = useRouter()

  function handleOpenOrderDetails(event: CustomEvent) {
    const { orderId, commentId, highlightComments } = event.detail
    if (!orderId) return
    
    // Сохраняем данные для открытия модалки
    localStorage.setItem('openOrderModal', orderId.toString())
    if (commentId) {
      localStorage.setItem('highlightCommentId', commentId.toString())
    }
    if (highlightComments) {
      sessionStorage.setItem('highlightComments', 'true')
    }
    
    // Если мы на странице заказов, просто обновляем страницу
    if (router.currentRoute.value.name === 'OrdersView' || router.currentRoute.value.path.includes('/orders')) {
      // Удаляем обработчик перед перенаправлением, чтобы избежать рекурсии
      const event = new CustomEvent('requestOrderModalOpen', { detail: { orderId, commentId, highlightComments } })
      document.dispatchEvent(event)
    } else {
      // Если мы на другой странице, переходим на страницу заказов
      router.push({
        name: 'OrdersView',
        query: { order: orderId }
      })
    }
  }

  function handleOpenProjectDetails(event: CustomEvent) {
    const { projectId } = event.detail
    if (projectId) {
      // Если мы на странице проектов, открываем модалку
      if (router.currentRoute.value.name === 'ProjectsView' || router.currentRoute.value.path.includes('/projects')) {
        // Отправляем событие для открытия модалки на странице проектов
        document.dispatchEvent(new CustomEvent('openProjectDetails', {
          detail: { projectId }
        }))
      } else {
        // Если мы на другой странице, переходим на страницу проектов
        router.push({
          name: 'ProjectsView',
          query: { project: projectId }
        })
      }
    }
  }

  function handleOpenClientDetails(event: CustomEvent) {
    const { clientId } = event.detail
    if (clientId) {
      // Если мы на странице клиентов, открываем модалку
      if (router.currentRoute.value.name === 'ClientsView' || router.currentRoute.value.path.includes('/clients')) {
        // Отправляем событие для открытия модалки на странице клиентов
        document.dispatchEvent(new CustomEvent('openClientDetails', {
          detail: { clientId }
        }))
      } else {
        // Если мы на другой странице, переходим на страницу клиентов
        router.push({
          name: 'ClientsView',
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
