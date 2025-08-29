<template>
  <transition name="modal-fade">
    <div
      v-if="orderId"
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      @click="onOverlayClick"
    >
      <transition name="modal-scale">
        <div
          v-if="orderId"
          class="relative w-[1300px] max-w-[98vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Кнопка закрытия -->
          <button
            @click="emit('close')"
            class="absolute top-6 right-6 text-3xl text-gray-400 hover:text-red-500 transition font-bold z-10"
          >
            ✕
          </button>
          


          <!-- Прогресс бар стадий -->
          <div class="flex gap-1 items-center justify-center px-0 pt-8 pb-4 w-full">
            <template v-for="(stage, idx) in stages" :key="stage.value">
              <button
                :class="[
                  'relative px-5 py-2 font-semibold text-base transition border-none outline-none focus:ring-2 focus:ring-yellow-300',
                  'rounded-l-full',
                  idx === stages.length - 1 ? 'rounded-r-full' : 'chevron-right',
                  getStageColor(stage.value, getCurrentStage(order), completedStages),
                  'hover:brightness-110',
                  'min-w-[120px] text-center',
                  idx !== 0 ? '-ml-2' : '',
                  'transition-all duration-150',
                ]"
                @click="handleStageClick(stage.value)"
                :disabled="getCurrentStage(order) === stage.value"
                :style="{
                  zIndex: stages.length - idx,
                  ...getStageStyle(stage.value, getCurrentStage(order), completedStages),
                }"
              >
                {{ stage.label }}
                <span
                  v-if="idx !== stages.length - 1"
                  class="chevron absolute right-0 top-0 h-full w-4"
                ></span>
              </button>
            </template>
          </div>

          <!-- Основной контент -->
          <div class="flex-1 flex flex-row h-full min-h-0">
            <!-- Левая панель - информация о заказе -->
            <div
              class="w-1/2 bg-gradient-to-br from-blue-200 via-purple-200 to-cyan-200 p-10 flex flex-col gap-8 border-r border-gray-200 min-w-[340px] overflow-y-auto"
            >
              <!-- Заголовок заказа -->
              <div>
                <div class="flex items-center gap-4 mb-2">
                  <div class="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Заказ #{{ order?.id }}
                  </div>
                  <div class="flex flex-col gap-2">
                    <span
                      v-if="order"
                      :class="[
                        'inline-block px-4 py-1 rounded-full text-base font-bold shadow',
                        statusBadge(getCurrentStage(order)),
                      ]"
                      :style="getStatusBadgeStyle(getCurrentStage(order))"
                    >
                      {{ getStatusText(getCurrentStage(order)) }}
                    </span>
                  </div>
                </div>
                <div class="text-lg text-gray-500 font-medium mb-6">{{ order?.product?.name }}</div>

                <!-- Информация о заказе -->
                <OrderInfo :order="order" @update-field="updateOrderField" />

                <hr class="my-4 border-blue-100" />

                <!-- Информация о проекте и клиенте -->
                <OrderProject :order="order" :project="project" />
              </div>
            </div>

            <!-- Правая панель - комментарии, назначения, таймлайн -->
            <div class="w-1/2 flex flex-col gap-8 p-10 bg-[#f8fafc] min-w-[340px] overflow-y-auto">
              <!-- Форма отмены заказа -->
              <div
                v-if="showCancelForm"
                class="bg-white border border-red-100 rounded-xl shadow-md p-4 mb-6 flex flex-col gap-3 animate-fade-in"
              >
                <div class="text-red-500 text-base font-semibold mb-1">
                  Подтвердите отмену заказа
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-medium text-gray-700 text-sm">Причина отмены</label>
                  <textarea
                    v-model="cancelReason"
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full resize-none text-gray-900 bg-white"
                    placeholder="Опишите причину отмены..."
                    rows="2"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-medium text-gray-700 text-sm">Статус причины</label>
                  <select
                    v-model="cancelReasonStatus"
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full text-gray-900 bg-white"
                  >
                    <option value="refused">Отказ клиента</option>
                    <option value="not_responding">Не отвечает</option>
                    <option value="defective_product">Брак/Дефект</option>
                  </select>
                </div>
                <div class="flex gap-2 justify-end mt-1">
                  <button
                    @click="confirmCancel"
                    class="rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1.5 text-sm shadow transition"
                  >
                    Подтвердить
                  </button>
                  <button
                    @click="cancelCancel"
                    class="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-1.5 text-sm shadow transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>

              <!-- Комментарии -->
              <OrderComments
                :comments="comments"
                :roles="roles"
                @add-comment="addComment"
                @delete-comment="deleteComment"
              />

              <!-- Назначенные сотрудники -->
              <OrderAssignments
                :assignments="assignments"
                :available-users="availableUsers"
                :stages="stagesWithRoles"
                :roles="roles"
                :current-stage="getCurrentStage(order)"
                :highlight-assignments="highlightAssignments"
                @assign-user="assignUser"
                @update-assignment-status="updateAssignmentStatus"
                @delete-assignment="deleteAssignment"
              />

              <!-- Временная шкала -->
              <OrderTimeline :status-logs="statusLogs" :stages="stagesWithRoles" :roles="roles" />
              
              <!-- Кнопка удаления заказа -->
              <div class="mt-4 flex justify-end">
                <button
                  @click="deleteOrderHandler"
                  class="w-8 h-8 bg-gray-200 hover:bg-red-500 text-gray-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Удалить заказ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
// import { canCreateEdit } from '../../../utils/permissions'
import { toast } from '../../../stores/toast'
import { getStageColorClasses } from '../../../utils/stageColors'
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
} from '../../../services/api'
import { OrderController } from '../../../controllers/OrderController'
import OrderInfo from '../OrderDetails/OrderInfo.vue'
import OrderProject from '../OrderDetails/OrderProject.vue'
import OrderComments from '../OrderDetails/OrderComments.vue'
import OrderAssignments from '../OrderDetails/OrderAssignments.vue'
import OrderTimeline from '../OrderDetails/OrderTimeline.vue'
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
} from '../../../types/orderDetails'

interface Props {
  orderId?: number | null
  errorMsg?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

// Состояние компонента
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

// Polling
let pollingInterval: number | null = null

const { updateStage, update } = OrderController()

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

function normalizeUser(u: unknown): User {
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

// Основные функции загрузки данных
async function fetchAll() {
  if (!props.orderId) return
  loading.value = true

  try {
    // Загружаем стадии
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

  try {
    const orderData = await getOrderDetails(props.orderId)
    order.value = orderData as OrderInfoType
  } catch {
    toast.show('Ошибка загрузки заказа', 'error')
    return
  }

  try {
    if (order.value?.project_id) {
      const projectData = await getProjectDetails(order.value.project_id)
      project.value = projectData as ProjectInfo
    }
  } catch {
    // Не критично
  }

  await loadComments()
}

// Отдельная функция для загрузки комментариев
async function loadComments() {
  try {
    const rawComments = await getOrderComments(props.orderId)
    comments.value = (rawComments as OrderComment[]).map((c: OrderComment) => ({
      ...c,
      user: normalizeUser(c.user),
    }))
  } catch {
    comments.value = []
  }

  try {
    const logsData = await getOrderStatusLogs(props.orderId)
    statusLogs.value = logsData as StatusLog[]
  } catch {
    statusLogs.value = []
  }

  try {
    await fetchAvailableUsers()
  } catch {
    availableUsers.value = []
  }

  try {
    const rolesData = await getRoles()
    roles.value = rolesData
  } catch {
    roles.value = []
  }

  loading.value = false

  // Сохраняем оптимистичные назначения (временные с большими ID)
  const optimisticAssignments = assignments.value.filter((a) => a.id > 1000000000)

  // Сохраняем локальные изменения статуса назначений
  const localStatusChanges = new Map<number, string>()
  assignments.value.forEach((assignment) => {
    if (assignment.id <= 1000000000) {
      // Только реальные назначения, не оптимистичные
      localStatusChanges.set(assignment.id, assignment.status)
    }
  })

  // Используем назначения из деталей заказа
  if (order.value && order.value.assignments) {
    const serverAssignments = order.value.assignments.map((a: Assignment) => {
      // Применяем локальные изменения статуса, если они есть
      const localStatus = localStatusChanges.get(a.id)
      if (localStatus && localStatus !== a.status) {
        return {
          ...a,
          user: normalizeUser(a.user),
          status: localStatus, // Сохраняем локальный статус
        }
      }
      return {
        ...a,
        user: normalizeUser(a.user),
      }
    })

    // Проверяем, есть ли оптимистичные назначения, которые уже есть на сервере
    const filteredOptimisticAssignments = optimisticAssignments.filter((optimistic) => {
      // Ищем соответствующее серверное назначение
      const existsOnServer = serverAssignments.some(
        (server) =>
          server.user_id === optimistic.user_id &&
          server.role_type === optimistic.role_type &&
          server.order_id === optimistic.order_id,
      )
      return !existsOnServer
    })

    // Объединяем серверные и только те оптимистичные, которых нет на сервере
    assignments.value = [...serverAssignments, ...filteredOptimisticAssignments]
  } else {
    // Если нет серверных назначений, оставляем только оптимистичные
    assignments.value = optimisticAssignments
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

async function fetchAvailableUsers() {
  try {
    let users = []

    // Вариант 1: Используем apiRequest для /users
    try {
      const { apiRequest } = await import('../../../services/api')
      const data = await apiRequest('/users')
      users = Array.isArray(data) ? data : (data as { data?: User[] })?.data || []
    } catch {
      // Продолжаем к варианту 2
    }

    // Вариант 2: Если первый не сработал, попробуем через getAllUsersByStageRoles
    if (users.length === 0) {
      try {
        const data = await getAllUsersByStageRoles()
        let allUsers: User[] = []

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          Object.values(data).forEach((stageData: unknown) => {
            if (stageData && typeof stageData === 'object' && stageData !== null) {
              const stage = stageData as Record<string, unknown>
              if (stage.users_by_role) {
                Object.values(stage.users_by_role).forEach((roleData: unknown) => {
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

        // Убираем дубликаты по id
        users = allUsers.filter(
          (user, index, self) => index === self.findIndex((u) => u.id === user.id),
        )
      } catch {
        // Игнорируем ошибку
      }
    }

    availableUsers.value = users
  } catch {
    availableUsers.value = []
  }
}

// Функции для работы с комментариями
async function addComment(text: string) {
  try {
    await postOrderComment(props.orderId as number, text)
    toast.show('Комментарий добавлен!')
    // Обновляем только комментарии, а не все данные
    await loadComments()
  } catch {
    toast.show('Ошибка добавления комментария', 'error')
  }
}

async function deleteComment(commentId: number) {
  if (confirm('Удалить комментарий?')) {
    await deleteOrderComment(props.orderId as number, commentId)
    // Обновляем только комментарии, а не все данные
    await loadComments()
  }
}

// Функции для работы с назначениями
async function assignUser(userId: number) {
  if (!order.value || !order.value.id || !userId) return

  try {
    // Находим пользователя
    const user = availableUsers.value.find((u: User) => u.id === userId)
    if (!user) return

    // Определяем текущую стадию
    const currentStage = getCurrentStage(order.value)

    // Находим данные стадии с ролями
    const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
    if (!stageData) return

    // Определяем роль пользователя для этой стадии
    const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
      user.role,
    ]
    const stageRoles = stageData.roles?.map((role: Role) => role.name) || []

    // Находим подходящую роль
    const matchingRole = userRoles.find((role) => stageRoles.includes(role || ''))

    // Используем первую доступную роль пользователя или дефолтную
    const roleToAssign = matchingRole || userRoles[0] || user.role || 'unknown'

    // Создаем данные назначения с ролью пользователя
    const assignmentData = {
      user_id: userId,
      role_type: roleToAssign,
      stage: currentStage,
      stage_name: currentStage,
    }

    try {
      const result = await assignOrderToUser(order.value.id, assignmentData)

      // Получаем текущего пользователя из localStorage или другого источника
      let currentUser = null
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          currentUser = JSON.parse(userData)
        }
      } catch {
        // Игнорируем ошибку
      }

      // Оптимистично добавляем назначение в UI
      const newAssignment: Assignment = {
        id: Date.now(), // Временный ID
        user_id: userId,
        order_id: order.value.id,
        role_type: roleToAssign,
        stage_name: currentStage, // Временное поле для оптимистичного отображения
        status: 'pending',
        user: user,
        assigned_by: currentUser || 'Текущий пользователь',
      }

      // Проверяем, нет ли уже такого назначения
      const existingAssignment = assignments.value.find(
        (a) =>
          a.user_id === userId && a.role_type === roleToAssign && a.order_id === order.value.id,
      )

      if (existingAssignment) {
        toast.show('Этот пользователь уже назначен на данную роль', 'error')
        return
      }

      // Добавляем в список назначений сразу
      assignments.value.push(newAssignment)

      // Загружаем актуальные данные с сервера с повторными попытками
      const retryFetchWithAssignment = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Увеличиваем задержку

          const oldAssignmentsLength = assignments.value.length
          await fetchAll()

          // Проверяем, есть ли наше назначение в обновленных данных
          const hasRealAssignment = assignments.value.some(
            (a) =>
              a.user_id === userId &&
              a.role_type === roleToAssign &&
              a.order_id === order.value.id &&
              a.id !== newAssignment.id, // Не наше временное назначение
          )

          if (hasRealAssignment) {
            break
          } else if (assignments.value.length < oldAssignmentsLength) {
            const hasOurAssignment = assignments.value.some((a) => a.id === newAssignment.id)
            if (!hasOurAssignment) {
              assignments.value.push(newAssignment)
            }
          }
        }
      }

      retryFetchWithAssignment()

      toast.show('Пользователь успешно назначен', 'success')
    } catch (apiError: unknown) {
      toast.show(
        `Ошибка назначения пользователя: ${apiError instanceof Error ? apiError.message : 'Неизвестная ошибка'}`,
        'error',
      )
    }
  } catch {
    toast.show('Ошибка назначения пользователя', 'error')
  }
}

async function updateAssignmentStatus(assignment: Assignment) {
  if (!assignment?.id) return

  // Сохраняем старый статус для отката в случае ошибки
  const oldStatus = assignment.status

  try {
    // Оптимистично обновляем UI сразу
    const assignmentIndex = assignments.value.findIndex((a) => a.id === assignment.id)
    if (assignmentIndex !== -1) {
      assignments.value[assignmentIndex].status = assignment.status
    }

    const response = (await updateOrderAssignmentStatus(
      assignment.id,
      assignment.status,
    )) as AssignmentStatusResponse

    // Проверяем, произошел ли автоматический переход стадии
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

    // Обновляем данные в order.assignments для синхронизации
    if (order.value?.assignments) {
      const orderAssignmentIndex = order.value.assignments.findIndex(
        (a: Assignment) => a.id === assignment.id,
      )
      if (orderAssignmentIndex !== -1) {
        order.value.assignments[orderAssignmentIndex].status = assignment.status
      }
    }

    // Принудительно обновляем assignments для синхронизации с order.assignments
    if (order.value?.assignments) {
      assignments.value = [...order.value.assignments]
    }

    emit('updated')
    toast.show('Назначение обновлено!', 'success')
  } catch (error) {
    // При ошибке возвращаем старый статус
    const assignmentIndex = assignments.value.findIndex((a) => a.id === assignment.id)
    if (assignmentIndex !== -1) {
      assignments.value[assignmentIndex].status = oldStatus
    }

    console.error('Error updating assignment status:', error)
    toast.show('Ошибка обновления назначения', 'error')
  }
}

async function deleteAssignment(assignment: Assignment) {
  if (!assignment?.id) return
  try {
    // Оптимистично удаляем из UI сразу
    const assignmentIndex = assignments.value.findIndex((a) => a.id === assignment.id)
    if (assignmentIndex !== -1) {
      assignments.value.splice(assignmentIndex, 1)
    }

    await deleteOrderAssignment(assignment.id)

    // Загружаем актуальные данные с сервера
    fetchAll()
  } catch {
    // При ошибке возвращаем назначение обратно
    assignments.value.push(assignment)
  }
}

// Функции для работы со стадиями
async function changeStatus(newStatus: string) {
  if (!order.value || getCurrentStage(order.value) === newStatus) return

  try {
    await updateStage(order.value.id, newStatus)
    
    // Сразу обновляем локальное состояние
    if (order.value) {
      order.value.stage = newStatus
    }
    
    // Получаем display_name стадии
    const stageDisplayName = getStatusText(newStatus)
    toast.show('Стадия заказа обновлена: ' + stageDisplayName)

    // Обновляем данные в фоне (без задержки)
    fetchAll()

    emit('updated')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ошибка смены стадии'
    toast.show(msg, 'error')
  }
}

async function updateOrderField(field: string, value: unknown) {
  if (!order.value) return
  const payload: Record<string, unknown> = {}
  payload[field] = value
  await update(order.value.id, payload)
  await fetchAll()
  emit('updated')
}

// Функции для стилизации стадий
function getStatusText(stage: string) {
  const stageData = stages.value.find((s) => s.value === stage)
  return stageData?.label || stage
}

function statusBadge(stage: string) {
  const stageData = stages.value.find((s) => s.value === stage)
  if (stageData && stageData.color) {
    return `text-white`
  }
  return getStageColorClasses(stage, undefined, true)
}

function getStatusBadgeStyle(stage: string) {
  const stageData = stages.value.find((s) => s.value === stage)
  if (stageData && stageData.color) {
    return {
      backgroundColor: stageData.color,
      color: '#ffffff',
    }
  }

  const fallbackColors: Record<string, string> = {
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

  const fallbackColor = fallbackColors[stage]
  if (fallbackColor) {
    return {
      backgroundColor: fallbackColor,
      color: '#ffffff',
    }
  }

  return {
    backgroundColor: '#6b7280',
    color: '#ffffff',
  }
}

function getStageColor(stage: string, current: string | undefined, completed: string[]) {
  const stageData = stages.value.find((s) => s.value === stage)

  if (current === stage) {
    if (stageData && stageData.color) {
      return `text-white font-semibold`
    }
    return getStageColorClasses(stage, undefined, true)
  }

  if (completed.includes(stage)) {
    if (stageData && stageData.color) {
      return `text-[${stageData.color}]`
    }
    return getStageColorClasses(stage, undefined, false)
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
    await updateStage(order.value.id, 'cancelled')
    toast.show('Заказ отменён!')
    showCancelForm.value = false
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
    await fetchAll()
    emit('updated')
  } catch (err: unknown) {
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

function onOverlayClick() {
  emit('close')
}

// Функция удаления заказа
async function deleteOrderHandler() {
  if (!order.value) return
  
  try {
    await deleteOrder(order.value.id)
    
    toast.show('Заказ удален!', 'success')
    emit('close')
    emit('updated')
  } catch (error) {
    toast.show('Ошибка удаления заказа', 'error')
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchAll()
  pollingInterval = window.setInterval(() => {
    fetchAll()
  }, 20000) // Увеличиваем до 20 секунд
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

watch(
  () => props.orderId,
  (val) => {
    if (val) fetchAll()
  },
  { immediate: true },
)

watch(
  () => order.value?.stage,
  async (newStage) => {
    if (showCancelForm.value && newStage !== 'cancelled') {
      showCancelForm.value = false
      cancelReason.value = ''
      cancelReasonStatus.value = 'refused'
    }

    // Обновляем доступных пользователей при смене стадии
    try {
      await fetchAvailableUsers()
    } catch {
      // Игнорируем ошибку
    }
  },
)
</script>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.chevron-right::after,
.chevron::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  right: -8px;
  width: 16px;
  height: 100%;
  background: inherit;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  z-index: 2;
  pointer-events: none;
}

.chevron-right:last-child::after {
  display: none;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.modal-scale-enter-to,
.modal-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
