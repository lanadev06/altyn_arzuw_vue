import { ref, computed, watch } from 'vue'
import { toast } from '../stores/toast'
import { frontendCache, CacheKeys } from '../services/cacheService'
import { getCurrentUser } from '../utils/permissions'
import {
  getOrderDetails,
  getOrderComments,
  postOrderComment,
  getProjectDetails,
  getOrderStatusLogs,
  deleteOrderComment,
  getAllStages,
  getAllUsersByStageRoles,
  assignOrderToUser,
  updateOrderAssignmentStatus,
  deleteOrderAssignment,
  getRoles,
  deleteOrder,
} from '../services/api'
import { useSmartPolling } from './useSmartPolling'
import { OrderController } from '../controllers/OrderController'
import { useOrderEvents } from './useOrderEvents'
import type {
  OrderInfo as OrderInfoType,
  ProjectInfo,
  OrderComment,
  StatusLog,
  Assignment,
  User,
  Role,
  Stage,
  AssignmentStatusResponse,
} from '../types/orderDetails'

export function useOrderDetails(orderId: number | null | undefined) {
  // Состояние
  const loading = ref(true)
  const order = ref<OrderInfoType | null>(null)
  const project = ref<ProjectInfo | null>(null)
  const comments = ref<OrderComment[]>([])
  const statusLogs = ref<StatusLog[]>([])
  const assignments = ref<Assignment[]>([])
  const availableUsers = ref<User[]>([])
  const roles = ref<Role[]>([])
  const stages = ref<Array<{ value: string; label: string; color?: string }>>([])
  const stagesWithRoles = ref<Stage[]>([])

  // Состояние для отмены заказа
  const showCancelForm = ref(false)
  const cancelReason = ref('')
  const cancelReasonStatus = ref('refused')

  // Состояние для подсветки назначений
  const highlightAssignments = ref(false)

  const { updateStage, update } = OrderController()
  
  // Система событий
  const { emitOrderStageChanged, emitOrderUpdated, emitOrderCommentAdded, emitOrderCommentDeleted, onOrderStageChanged } = useOrderEvents()

  // Smart polling - оптимизированные настройки с учетом бэкенд кэширования
  const { isActive: isPollingActive, lastUpdate: lastPollingUpdate, reset: resetPolling, stop: stopPolling } = useSmartPolling(
    `order-details-${orderId}`,
    async () => {
      if (orderId) {
        await fetchAll()
      }
    },
    {
      interval: 10000, // 10 секунд - оптимальный баланс с учетом бэкенд кэша (900 сек)
      maxInterval: 30000, // Максимальный интервал 30 секунд
      minInterval: 5000, // Минимальный интервал 5 секунд
      backoffMultiplier: 1.5, // Умеренное увеличение интервала при ошибках
      maxBackoff: 60000, // Максимальный интервал при ошибках 1 минута
      enabled: !!orderId
    }
  )

  // Computed свойства
  const completedStages = computed(() => {
    if (!order.value || !order.value.stage) return []
    const currentStage = getCurrentStage(order.value)
    const idx = stages.value.findIndex((s) => s.value === currentStage)
    return stages.value.slice(0, idx).map((s) => s.value)
  })

  // Вспомогательные функции
  function getCurrentStage(orderData: OrderInfoType | null): string {
    if (!orderData?.stage) return ''
    return typeof orderData.stage === 'string'
      ? orderData.stage
      : (orderData.stage as { name: string })?.name || ''
  }

  function normalizeUser(u: any): User {
    if (typeof u === 'object' && u !== null) {
      const user = u as Record<string, unknown>

      if (Array.isArray(user.roles) && typeof user.roles[0] === 'string') {
        return {
          ...user,
          roles: user.roles.map((r: string) => ({ name: r, display_name: getRoleLabel(r) })),
        } as User
      }
      if (!user.roles && user.role && typeof user.role === 'string') {
        return {
          ...user,
          roles: [{ name: user.role, display_name: getRoleLabel(user.role) }],
        } as User
      }
    }
    return u as User
  }

  function getRoleLabel(role: string) {
    const dynamicRole = roles.value.find((r: Role) => r.name === role)
    if (dynamicRole && dynamicRole.display_name) {
      return dynamicRole.display_name
    }
    return role
  }

  // Функция принудительного обновления данных
  async function forceRefresh() {
    if (!orderId) return
    
    const cacheKey = `order_details_${orderId}`
    frontendCache.delete(cacheKey)
    
    await fetchAll()
  }

  // Основные функции загрузки данных с ленивой загрузкой
  async function fetchAll() {
    if (!orderId) return
    loading.value = true

    try {
      // 1. Сначала загружаем только основные данные заказа (быстро)
      const orderData = await getOrderDetails(orderId)
      order.value = orderData as OrderInfoType
      loading.value = false // Показываем основную информацию сразу
    } catch (error: any) {
      loading.value = false
      stopPolling()

      const status = (error && typeof error === 'object') ? (error as any).status : undefined

      if (status === 404) {
        order.value = null
        project.value = null
        comments.value = []
        statusLogs.value = []
        assignments.value = []

        toast.show('Этот заказ был удалён', 'error')

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('order-not-found', {
            detail: { orderId }
          }))
        }
      } else {
        const message = error instanceof Error && error.message ? error.message : 'Ошибка загрузки заказа'
        toast.show(message, 'error')
      }
      return
    }

    // 2. Загружаем стадии в фоне (не критично для отображения)
    loadStagesAsync()

    // 3. Загружаем остальные данные в фоне
    loadSecondaryDataAsync()
  }

  // Асинхронная загрузка стадий
  async function loadStagesAsync() {
    try {
      const stagesData = await getAllStages()
      stagesWithRoles.value = stagesData as Stage[]

      stages.value = stagesData.map((stage: Stage) => ({
        value: stage.name,
        label: stage.display_name || stage.name,
        color: stage.color,
      }))
    } catch {
      // Fallback к статическим стадиям
      const fallbackStages: Stage[] = [
        { id: 1, name: 'draft', display_name: 'Черновик', color: '#6b7280', roles: [] },
        { id: 2, name: 'design', display_name: 'Дизайн', color: '#3b82f6', roles: [] },
        { id: 3, name: 'print', display_name: 'Печать', color: '#f59e0b', roles: [] },
        { id: 4, name: 'engraving', display_name: 'Гравировка', color: '#f97316', roles: [] },
        { id: 5, name: 'workshop', display_name: 'Цех', color: '#8b5cf6', roles: [] },
        { id: 6, name: 'die_cutting', display_name: 'Высечка', color: '#10b981', roles: [] },
        { id: 7, name: 'final', display_name: 'Финал', color: '#10b981', roles: [] },
        { id: 8, name: 'completed', display_name: 'Завершен', color: '#059669', roles: [] },
        { id: 9, name: 'cancelled', display_name: 'Отменен', color: '#ef4444', roles: [] },
      ]
      stagesWithRoles.value = fallbackStages

      stages.value = fallbackStages.map((stage: Stage) => ({
        value: stage.name,
        label: stage.display_name || stage.name,
        color: stage.color,
      }))
    }
  }

  // Асинхронная загрузка вторичных данных
  async function loadSecondaryDataAsync() {
    // Загружаем проект в фоне
    if (order.value?.project_id) {
      try {
        const projectData = await getProjectDetails(order.value.project_id)
        project.value = projectData as ProjectInfo
      } catch {
        // Не критично
      }
    }

    // Загружаем пользователей и роли в фоне (важно для селектора назначений)
    loadUsersAndRolesAsync()

    // Загружаем комментарии и логи в фоне
    await loadComments()
  }

  // Отдельная функция для загрузки комментариев с ленивой загрузкой
  async function loadComments() {
    if (!orderId) {
      comments.value = []
      return
    }
    
    // Загружаем комментарии и логи параллельно
    const [commentsResult, logsResult] = await Promise.allSettled([
      getOrderComments(orderId),
      getOrderStatusLogs(orderId)
    ])
    
    // Обрабатываем комментарии
    if (commentsResult.status === 'fulfilled') {
      try {
        const rawComments = commentsResult.value
        
        // Обрабатываем комментарии и нормализуем пользователей
        const processedComments = (rawComments as OrderComment[]).map((c: OrderComment) => ({
          ...c,
          user: c.user ? normalizeUser(c.user) : {
            id: 0,
            name: 'Неизвестный пользователь',
            roles: []
          } as User,
        }))
        
        // Обновляем массив комментариев
        comments.value = processedComments
      } catch (error) {
        comments.value = []
      }
    } else {
      comments.value = []
    }

    // Обрабатываем логи
    if (logsResult.status === 'fulfilled') {
      statusLogs.value = logsResult.value as StatusLog[]
    } else {
      statusLogs.value = []
    }

    // Обрабатываем назначения
    if (order.value && order.value.assignments) {
      assignments.value = order.value.assignments.map((a: Assignment) => ({
        ...a,
        user: normalizeUser(a.user),
      }))
    } else {
      assignments.value = []
    }

    // Проверяем, нужно ли подсвечивать назначения
    const shouldHighlight = sessionStorage.getItem('highlightAssignments')
    if (shouldHighlight === 'true') {
      highlightAssignments.value = true
      sessionStorage.removeItem('highlightAssignments')
      sessionStorage.removeItem('assignmentMessage')

      setTimeout(() => {
        highlightAssignments.value = false
      }, 5000)
    }
  }

  // Асинхронная загрузка пользователей и ролей
  async function loadUsersAndRolesAsync() {
    // Загружаем пользователей и роли параллельно
    const [usersResult, rolesResult] = await Promise.allSettled([
      fetchAvailableUsers(),
      getRoles()
    ])

    if (usersResult.status === 'rejected') {
      availableUsers.value = []
    }

    if (rolesResult.status === 'fulfilled') {
      roles.value = rolesResult.value
    } else {
      roles.value = []
    }
  }

  // Флаг для предотвращения одновременных вызовов fetchAvailableUsers
  let isFetchingUsers = false
  let pendingFetchUsers: Promise<void> | null = null

  async function fetchAvailableUsers(forceRefresh = false) {
    // Если уже идет загрузка, возвращаем существующий промис
    if (isFetchingUsers && pendingFetchUsers) {
      return pendingFetchUsers
    }

    // Создаем промис для дедупликации
    pendingFetchUsers = (async () => {
      isFetchingUsers = true
      try {
        let users: User[] = []

        // Если принудительное обновление, очищаем кэш
        if (forceRefresh) {
          frontendCache.invalidatePattern(CacheKeys.USERS)
          frontendCache.invalidatePattern(CacheKeys.USERS_BY_STAGE_ROLES)
          frontendCache.invalidatePattern('users_by_stage_roles')
          frontendCache.invalidatePattern('stages_users_by_roles')
        }

        // Источник 1: все пользователи (увеличенный per_page, чтобы не терять пользователей на последующих страницах)
        try {
          const { cachedApiRequest } = await import('../services/api')
          const data = await cachedApiRequest('/users?per_page=1000&sort_by=id&sort_order=asc', {}, undefined, forceRefresh ? 0 : 60000) // 1 минута кэш, если не принудительное обновление
          const paged = Array.isArray(data) ? data : (data as { data?: User[] })?.data || []
          users = Array.isArray(paged) ? (paged as User[]) : []
        } catch {
          // Продолжаем ко второму источнику
        }

        // Источник 2: пользователи по ролям стадий — помогает подтянуть только активных и точно ролевых
        try {
          const data = await getAllUsersByStageRoles(forceRefresh)
          let allUsers: User[] = []

          if (data && typeof data === 'object' && !Array.isArray(data)) {
            Object.values(data).forEach((stageUsers: any) => {
              if (Array.isArray(stageUsers)) {
                // Новый формат: stageId -> [user1, user2, ...]
                allUsers = allUsers.concat(stageUsers as User[])
              } else if (stageUsers && typeof stageUsers === 'object' && stageUsers !== null) {
                // Старый формат: stageId -> { users_by_role: { roleName: { users: [...] } } }
                const stage = stageUsers as Record<string, unknown>
                if (stage.users_by_role) {
                  Object.values(stage.users_by_role).forEach((roleData: any) => {
                    if (roleData && typeof roleData === 'object' && roleData !== null) {
                      const role = roleData as Record<string, unknown>
                      if (role.users && Array.isArray(role.users)) {
                        allUsers = allUsers.concat(role.users as User[])
                      }
                    }
                  })
                }
              }
            })
          }

          // Объединяем оба источника и убираем дубликаты по id
          const merged = [...users, ...allUsers]
          users = merged.filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))
        } catch {
          // Игнорируем ошибку, остаёмся на users из первого источника
        }

        availableUsers.value = users
      } catch {
        availableUsers.value = []
      } finally {
        isFetchingUsers = false
        pendingFetchUsers = null
      }
    })()

    return pendingFetchUsers
  }

  // Функции для работы с комментариями
  async function addComment(text: string) {
    if (!text.trim()) return
    
    // Проверяем, что orderId существует
    if (!orderId) {
      toast.show('Ошибка: не указан ID заказа', 'error')
      console.error('addComment: orderId is null or undefined')
      return
    }
    
    const tempId = Date.now()
    
    try {
      // Создаем временный комментарий для оптимистичного обновления
      const tempComment = {
        id: tempId,
        text: text.trim(),
        user: {
          id: 0,
          name: 'Вы',
          roles: []
        },
        created_at: new Date().toISOString()
      }
      
      // Добавляем временный комментарий в начало списка
      comments.value.unshift(tempComment as any)
      
      // Отправляем комментарий на сервер
      const result = await postOrderComment(orderId as number, text.trim())
      
      // Показываем уведомление об успехе
      toast.show('Комментарий добавлен!')
      
      // Удаляем временный комментарий
      comments.value = comments.value.filter(c => c.id !== tempId)
      
      // Загружаем актуальные комментарии (кэш уже очищен в postOrderComment)
      await loadComments()
      
      // Отправляем глобальное событие добавления комментария
      if (result && (result as any).id) {
        emitOrderCommentAdded(
          orderId as number,
          (result as any).id,
          text.trim(),
          (result as any).user?.id || 0,
          (result as any).user?.name || 'Сотрудник',
          'modal'
        )
      }
      
      // Отправляем глобальное событие обновления заказа
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } catch (error) {
      // Удаляем временный комментарий при ошибке
      comments.value = comments.value.filter(c => c.id !== tempId)
      
      // Логируем ошибку для диагностики
      console.error('Error adding comment:', error)
      
      // Определяем сообщение об ошибке
      let errorMessage = 'Ошибка добавления комментария'
      if (error instanceof Error) {
        // Если есть детали ошибки от сервера, используем их
        const errorData = (error as any).data
        if (errorData?.error) {
          errorMessage = errorData.error
        } else if (errorData?.message) {
          errorMessage = errorData.message
        } else if ((error as any).status === 422) {
          errorMessage = 'Ошибка валидации данных'
        } else if ((error as any).status === 403) {
          errorMessage = 'Доступ запрещён'
        } else if ((error as any).status === 401) {
          errorMessage = 'Сессия истекла. Необходимо войти заново.'
        }
      }
      
      toast.show(errorMessage, 'error')
    }
  }

  async function deleteComment(commentId: number) {
    if (!orderId) {
      toast.show('Ошибка: не указан ID заказа', 'error')
      console.error('deleteComment: orderId is null or undefined')
      return
    }
    
    const commentToDelete = comments.value.find(c => c.id === commentId)
    comments.value = comments.value.filter(c => c.id !== commentId)
    
    try {
      await deleteOrderComment(orderId as number, commentId)
      toast.show('Комментарий удален!')
      
      // Отправляем глобальное событие удаления комментария
      emitOrderCommentDeleted(
        orderId as number,
        commentId,
        'modal'
      )
      
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } catch (error) {
      // Возвращаем комментарий при ошибке
      if (commentToDelete) {
        comments.value.push(commentToDelete)
      }
      
      toast.show('Ошибка удаления комментария', 'error')
    }
  }

  // Функции для работы с назначениями
  async function assignUser(userId: number) {
    if (!order.value || !order.value.id || !userId) return

    try {
      const user = availableUsers.value.find((u: User) => u.id === userId)
      if (!user) return

      const currentStage = getCurrentStage(order.value)
      const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
      if (!stageData) return

      const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
        user.role,
      ]
      const stageRoles = stageData.roles?.map((role: Role) => role.name) || []

      const matchingRole = userRoles.find((role) => stageRoles.includes(role || ''))
      const roleToAssign = matchingRole || userRoles[0] || user.role || 'unknown'

      const existingAssignment = assignments.value.find(
        (a) =>
          a.user_id === userId && a.role_type === roleToAssign && a.order_id === order.value.id,
      )

      if (existingAssignment) {
        toast.show('Этот сотрудник уже назначен на данную роль', 'error')
        return
      }

      const assignmentData = {
        user_id: userId,
        role_type: roleToAssign,
      }

      const result = await assignOrderToUser(order.value.id, assignmentData)

      if (result && result.assignment) {
        if (orderId) {
          const cacheKey = `order_details_${orderId}`
          frontendCache.delete(cacheKey)
        }

        // Обновляем данные заказа (пользователи обновятся автоматически через watch на стадию)
        await forceRefresh()
        
        toast.show('Сотрудник успешно назначен', 'success')
        
        window.dispatchEvent(new CustomEvent('order-updated', {
          detail: { orderId }
        }))
      }
    } catch {
      toast.show('Ошибка назначения пользователя', 'error')
    }
  }

  async function updateAssignmentStatus(assignment: Assignment) {
    if (!assignment?.id) return

    const oldStatus = assignment.status

    try {
      const assignmentIndex = assignments.value.findIndex((a) => a.id === assignment.id)
      if (assignmentIndex !== -1) {
        assignments.value[assignmentIndex].status = assignment.status
      }

      const response = (await updateOrderAssignmentStatus(
        assignment.id,
        assignment.status,
      )) as AssignmentStatusResponse

      if (
        response.stage_transition &&
        response.stage_transition.from &&
        response.stage_transition.to
      ) {
        toast.show(
          `✅ ${response.stage_transition.message}: ${response.stage_transition.from} → ${response.stage_transition.to}`,
          'success',
        )
      }

      if (orderId) {
        const cacheKey = `order_details_${orderId}`
        frontendCache.delete(cacheKey)
      }

      // Обновляем данные без множественных вызовов fetchAvailableUsers
      // fetchAvailableUsers будет вызван автоматически через watch на order.value?.stage
      // если стадия изменилась, или через дебаунсинг
      setTimeout(async () => {
        try {
          await forceRefresh()
          resetPolling()
        } catch (error) {
        }
      }, 500)

      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
      
      toast.show('Назначение обновлено!', 'success')
    } catch (error) {
      const assignmentIndex = assignments.value.findIndex((a) => a.id === assignment.id)
      if (assignmentIndex !== -1) {
        assignments.value[assignmentIndex].status = oldStatus
      }

      
      // Показываем понятное сообщение об ошибке
      let errorMessage = 'Ошибка обновления назначения'
      
      if (error instanceof Error) {
        if (error.message.includes('У вас нет прав')) {
          errorMessage = 'У вас нет прав на изменение этого назначения'
        } else if (error.message.includes('Forbidden')) {
          errorMessage = 'У вас нет прав на это действие'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.show(errorMessage, 'error')
    }
  }

  async function deleteAssignment(assignment: Assignment) {
    if (!assignment?.id) return

    try {
      await deleteOrderAssignment(assignment.id)

      if (orderId) {
        const cacheKey = `order_details_${orderId}`
        frontendCache.delete(cacheKey)
      }

      await fetchAll()

      toast.show('Назначение удалено', 'success')
      
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } catch (error) {
      toast.show('Ошибка удаления назначения', 'error')
    }
  }

  // Функции для работы со стадиями
  async function changeStatus(newStatus: string, additionalData?: Record<string, any>) {
    if (!order.value || getCurrentStage(order.value) === newStatus) return

    const oldStage = getCurrentStage(order.value)
    
    // Оптимистичное обновление UI - сразу меняем стадию на экране
    if (order.value) {
      order.value.stage = newStatus
    }
    
    // Оптимистичное обновление timeline - добавляем новый лог сразу
    const currentUser = getCurrentUser()
    const newLog: StatusLog = {
      id: Date.now(), // Временный ID
      from_status: oldStage,
      to_status: newStatus,
      changed_at: new Date().toISOString(),
      user: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.roles?.[0]?.name || 'staff'
      } : undefined
    }
    statusLogs.value.unshift(newLog)
    
    try {
      await updateStage(order.value.id, newStatus, additionalData)
      
      // Обновляем локальные данные заказа если переданы дополнительные данные
      if (additionalData && order.value) {
        if (additionalData.reason !== undefined) {
          order.value.reason = additionalData.reason
        }
        if (additionalData.reason_status !== undefined) {
          order.value.reason_status = additionalData.reason_status
        }
      }
      
      if (orderId) {
        const cacheKey = `order_details_${orderId}`
        frontendCache.delete(cacheKey)
      }
      
      const stageDisplayName = getStatusText(newStatus)
      toast.show('Стадия заказа обновлена: ' + stageDisplayName)

      // Отправляем глобальное событие о смене стадии
      // Это событие автоматически также вызывает 'order-updated' через eventBus
      emitOrderStageChanged(
        order.value.id,
        oldStage,
        newStatus,
        'modal',
        stageDisplayName
      )

      // Timeline обновится автоматически через глобальные события
      // НЕ вызываем window.dispatchEvent('order-updated') здесь, так как
      // emitOrderStageChanged уже вызывает это событие через eventBus
    } catch (err: any) {
      // Откатываем изменения в случае ошибки
      if (order.value) {
        order.value.stage = oldStage
      }
      
      // Убираем оптимистично добавленный лог
      statusLogs.value = statusLogs.value.filter(log => log.id !== newLog.id)
      
      // Показываем понятное сообщение об ошибке
      let errorMessage = 'Ошибка смены стадии'
      
      // Проверяем разные источники ошибки
      let serverMessage = ''
      
      if (err instanceof Error) {
        serverMessage = err.message || ''
        // Проверяем data.message если есть
        if ((err as any).data?.message) {
          serverMessage = (err as any).data.message
        }
      } else if (err?.data?.message) {
        serverMessage = err.data.message
      } else if (err?.message) {
        serverMessage = err.message
      }
      
      // Обрабатываем сообщение от сервера
      if (serverMessage.includes('не полностью оплачен') || serverMessage.includes('оплачен')) {
        errorMessage = 'Нельзя завершить заказ — он не полностью оплачен'
      } else if (serverMessage.includes('неодобренные назначения')) {
        errorMessage = serverMessage
      } else if (serverMessage) {
        errorMessage = serverMessage
      }
      
      toast.show(errorMessage, 'error')
    }
  }

  async function updateOrderField(field: string, value: any) {
    if (!order.value) return
    const payload: Record<string, unknown> = {}
    payload[field] = value
    
    try {
      const updatedOrder = await update(order.value.id, payload)
      
      // Обновляем локальное состояние
      if (order.value) {
        (order.value as any)[field] = value
        // Если сервер вернул обновленный заказ, обновляем все поля
        if (updatedOrder && typeof updatedOrder === 'object') {
          Object.assign(order.value, updatedOrder)
        }
      }
      
      if (orderId) {
        const cacheKey = `order_details_${orderId}`
        frontendCache.delete(cacheKey)
      }
      
      // Перезагружаем данные для получения актуальной информации
      await fetchAll()
      
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } catch (error) {
      toast.show('Ошибка обновления заказа', 'error')
    }
  }

  // Функции для стилизации стадий
  function getStatusText(stage: string) {
    const stageData = stages.value.find((s) => s.value === stage)
    return stageData?.label || stage
  }

  function getStageColor(stage: string, current: string | undefined, completed: string[]) {
    const stageData = stages.value.find((s) => s.value === stage)

    if (current === stage) {
      if (stageData && stageData.color) {
        return `text-white font-semibold`
      }
      return 'bg-blue-600 text-white font-semibold'
    }

    if (completed.includes(stage)) {
      if (stageData && stageData.color) {
        return `text-[${stageData.color}]`
      }
      return 'bg-green-100 text-green-800'
    }

    return 'bg-gray-100 text-gray-400'
  }

  function getStageStyle(stage: string, current: string | undefined, completed: string[]) {
    const stageData = stages.value.find((s) => s.value === stage)

    const fallbackColors = {
      draft: '#6b7280',
      design: '#3b82f6',
      print: '#f59e0b',
      engraving: '#f97316',
      workshop: '#8b5cf6',
      die_cutting: '#10b981',
      final: '#10b981',
      completed: '#059669',
      cancelled: '#ef4444',
    }

    const color =
      stageData?.color || fallbackColors[stage as keyof typeof fallbackColors] || '#6b7280'

    if (current === stage) {
      return {
        backgroundColor: color,
        color: '#ffffff',
      }
    }

    if (completed.includes(stage)) {
      return {
        backgroundColor: `${color}20`,
        color: color,
      }
    }

    return {}
  }

  // Функции для отмены заказа
  function startCancelFlow() {
    showCancelForm.value = true
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
  }

  function cancelCancel() {
    showCancelForm.value = false
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
  }

  async function confirmCancel() {
    if (!order.value) return
    if (!cancelReason.value.trim()) {
      alert('Пожалуйста, укажите причину отмены!')
      return
    }
    
    try {
      // Передаем причину отмены в API через changeStatus
      await changeStatus('cancelled', {
        reason: cancelReason.value,
        reason_status: cancelReasonStatus.value
      })
      
      toast.show('Заказ отменён!')
      showCancelForm.value = false
      cancelReason.value = ''
      cancelReasonStatus.value = 'refused'
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Ошибка при отмене заказа!'
      toast.show(msg, 'error')
    }
  }

  function handleStageClick(value: string) {
    if (value === 'cancelled') {
      startCancelFlow()
    } else {
      showCancelForm.value = false
      cancelReason.value = ''
      cancelReasonStatus.value = 'refused'
      changeStatus(value)
    }
  }

  // Функция удаления заказа
  async function deleteOrderHandler() {
    if (!order.value) return
    
    try {
      await deleteOrder(order.value.id)
      
      // Останавливаем polling перед удалением данных
      stopPolling()
      
      if (orderId) {
        const cacheKey = `order_details_${orderId}`
        frontendCache.delete(cacheKey)
      }
      
      // НЕ отправляем событие order-updated после удаления,
      // так как это вызовет попытку загрузить удаленный заказ
      // window.dispatchEvent(new CustomEvent('order-updated', {
      //   detail: { orderId }
      // }))
      
      toast.show('Заказ удален!', 'success')
    } catch (error) {
      toast.show('Ошибка удаления заказа', 'error')
    }
  }

  // Слушаем изменения orderId
  watch(
    () => orderId,
    (val) => {
      if (val) fetchAll()
    },
    { immediate: true },
  )

  // Слушаем глобальные события смены стадии для обновления timeline
  onOrderStageChanged((event) => {
    // Обновляем timeline только если событие относится к текущему заказу
    if (orderId && event.orderId === orderId) {
      // Дебаунсинг: загружаем комментарии через 500мс после последнего изменения стадии
      if (loadCommentsTimeout) {
        clearTimeout(loadCommentsTimeout)
      }
      
      loadCommentsTimeout = setTimeout(() => {
        loadComments()
        loadCommentsTimeout = null
      }, 500)
    }
  })

  // Слушаем глобальные события обновления пользователей
  window.addEventListener('users-updated', async () => {
    try {
      await fetchAvailableUsers(true)
    } catch {
      // Игнорируем ошибку
    }
  })

  // Дебаунсинг для fetchAvailableUsers чтобы избежать множественных запросов
  let fetchUsersTimeout: ReturnType<typeof setTimeout> | null = null
  
  // Дебаунсинг для loadComments чтобы избежать множественных запросов при изменении стадии
  let loadCommentsTimeout: ReturnType<typeof setTimeout> | null = null
  
  watch(
    () => order.value?.stage,
    async (newStage) => {
      if (showCancelForm.value && newStage !== 'cancelled') {
        showCancelForm.value = false
        cancelReason.value = ''
        cancelReasonStatus.value = 'refused'
      }

      // Дебаунсинг: обновляем пользователей только через 2 секунды после последнего изменения стадии
      if (fetchUsersTimeout) {
        clearTimeout(fetchUsersTimeout)
      }
      
      fetchUsersTimeout = setTimeout(async () => {
        try {
          await fetchAvailableUsers(true)
        } catch {
          // Игнорируем ошибку
        }
        fetchUsersTimeout = null
      }, 2000)
    },
  )

  return {
    // Состояние
    loading,
    order,
    project,
    comments,
    statusLogs,
    assignments,
    availableUsers,
    roles,
    stages,
    stagesWithRoles,
    showCancelForm,
    cancelReason,
    cancelReasonStatus,
    highlightAssignments,
    isPollingActive,
    lastPollingUpdate,
    completedStages,
    
    // Функции
    fetchAll,
    forceRefresh,
    addComment,
    deleteComment,
    assignUser,
    updateAssignmentStatus,
    deleteAssignment,
    changeStatus,
    updateOrderField,
    startCancelFlow,
    cancelCancel,
    confirmCancel,
    handleStageClick,
    deleteOrderHandler,
    getCurrentStage,
    getStatusText,
    getStageColor,
    getStageStyle,
  }
}


