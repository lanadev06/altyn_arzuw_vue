import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderModal } from '../stores/orderModal'

/**
 * Composable для глобальной обработки уведомлений
 * Обеспечивает правильное открытие модалок заказов при клике на уведомления
 */
export function useGlobalNotifications() {
  const router = useRouter()
  const orderModal = useOrderModal()

  function handleOpenOrderDetails(event: CustomEvent) {
    const { orderId, commentId, highlightComments } = event.detail
    if (!orderId) return
    
    // Сохраняем данные для подсветки комментариев
    if (commentId) {
      localStorage.setItem('highlightCommentId', commentId.toString())
    }
    if (highlightComments) {
      sessionStorage.setItem('highlightComments', 'true')
    }
    
    // Открываем глобальную модалку заказа
    orderModal.open(orderId)

    // Синхронизируем параметр order в URL для прямых ссылок и обновления страницы
    router.replace({
      query: {
        ...router.currentRoute.value.query,
        order: orderId.toString(),
      },
    }).catch(() => {
      // Игнорируем ошибки навигации
    })
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
