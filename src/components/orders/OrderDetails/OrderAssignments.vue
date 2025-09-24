<template>
  <div
    class="bg-white rounded-xl shadow p-4 border border-blue-100 mb-6"
    :class="{ 'assignment-highlight': highlightAssignments }"
  >
    <div class="font-semibold text-gray-700 mb-2 text-lg">
      Назначенные сотрудники
      <span class="text-sm font-normal text-gray-500"> ({{ currentStageLabel }}) </span>
    </div>

    <div
      v-for="assignment in currentStageAssignments"
      :key="assignment.id"
      :class="`assignment-card flex flex-col rounded-lg shadow-sm px-3 py-2 mb-2 border border-gray-100 ${getAssignmentBg(assignment.status)} ${
        isCurrentUserAssignment(assignment) ? 'ring-2 ring-blue-300 bg-blue-50' : ''
      }`"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-900">{{ assignment.user?.name || '—' }}</span>
            <span
              class="inline-block rounded px-2 py-0.5 text-xs font-semibold align-middle leading-tight"
              :style="getRoleBadgeStyle(assignment.role_type)"
            >
              {{ getRoleLabel(assignment.role_type) }}
            </span>

          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Селект статуса (для назначений текущего пользователя или для админов/менеджеров) -->
          <select
            v-if="isCurrentUserAssignment(assignment) || canViewAllOrders()"
            v-model="assignment.status"
            @change="handleStatusChange(assignment)"
            :class="`border rounded px-2 py-1 text-xs text-gray-900 bg-white transition-all duration-200 ${getStatusTextColor(assignment.status)} ${assignment.updating ? 'status-updating' : ''}`"
            :disabled="assignment.updating || !canUpdateAssignmentStatus()"
          >
            <option value="pending">Ожидание</option>
            <option value="in_progress">В работе</option>
            <option value="cancelled">Отменено</option>
            <option value="under_review">На проверке</option>
            <option value="approved">Одобрено</option>
          </select>
          
          <!-- Статичный статус для назначений других пользователей -->
          <div
            v-else
            :class="`px-2 py-1 text-xs rounded ${getStatusTextColor(assignment.status)}`"
          >
            {{ getStatusLabel(assignment.status) }}
          </div>
          
          <div v-if="assignment.updating" class="text-xs text-blue-600 animate-pulse">
            Обновление...
          </div>
          <button
            v-if="assignment.status === 'cancelled' && canViewAllOrders()"
            @click="$emit('delete-assignment', assignment)"
            class="text-red-500 hover:underline text-xs ml-2"
          >
            Удалить
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-gray-400">
          Назначил:
          <span class="font-semibold">{{ getAssignedByName(assignment.assigned_by) }}</span>
        </span>
      </div>
    </div>
    <!-- Селект для назначения пользователей (только для админов и менеджеров) -->
    <div v-if="currentStageUsersWithRoles.length > 0 && canViewAllOrders()" class="flex items-center gap-2 mt-4">
      <Vue3Select
        v-model="selectedUserId"
        :options="currentStageUsersWithRoles"
        label="displayName"
        :reduce="(user) => user.id"
        placeholder="Добавить сотрудника..."
        class="w-80"
        :searchable="true"
        :clearable="true"
        :no-drop="false"
        :close-on-select="true"
        :preserve-search="false"
        :autoscroll="true"
        :dropdown-offset="8"
        @update:modelValue="assignUser"
      />
      <span class="text-xs text-gray-400"> ({{ getCurrentStageRolesText() }}) </span>
    </div>

    <!-- Сообщение для финальных стадий -->
    <div
      v-else-if="
        ['completed', 'cancelled', 'final', 'финал', 'завершен', 'отменен'].includes(
          props.currentStage.toLowerCase(),
        )
      "
      class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      <p class="text-sm text-gray-500 text-center">
        На финальной стадии "{{ currentStageLabel }}" назначения не требуются
      </p>
    </div>

    <!-- Сообщение если нет ролей для стадии (только для админов и менеджеров) -->
    <div v-else-if="canViewAllOrders()" class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500 text-center">
        Для стадии "{{ currentStageLabel }}" не настроены роли или нет доступных сотрудников
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Vue3Select from 'vue3-select'
import { canCreateEdit, canViewAllOrders, canUpdateAssignmentStatus } from '../../../utils/permissions'
import { getCurrentUser } from '../../../utils/auth'
import type { Assignment, Role, Stage, User, UserWithRole } from '../../../types/orderDetails'


interface Props {
  assignments: Assignment[]
  availableUsers: User[]
  stages: Stage[]
  roles: Role[]
  currentStage: string
  highlightAssignments?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'assign-user': [userId: number]
  'update-assignment-status': [assignment: Assignment]
  'delete-assignment': [assignment: Assignment]
}>()

const selectedUserId = ref<number | null>(null)

const currentStageLabel = computed(() => {
  const stageData = props.stages.find((s) => s.name === props.currentStage)
  return stageData?.display_name || props.currentStage
})

// Назначения для текущей стадии
const currentStageAssignments = computed(() => {
  // Получаем роли для текущей стадии
  const stageData = props.stages.find((stage: Stage) => stage.name === props.currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  // Фильтруем назначения для текущей стадии
  const stageAssignments = props.assignments.filter(
    (assignment: Assignment, index: number, array: Assignment[]) => {
      // 1. Если назначение создано для конкретной стадии (оптимистичное)
      const isManualAssignment = assignment.stage_name === props.currentStage

      // 2. Через assigned_stages (если есть)
      const hasStageAssignment =
        assignment.assigned_stages &&
        assignment.assigned_stages.some((stage: Stage) => stage.name === props.currentStage)

      // 3. Проверяем, соответствует ли роль назначения текущей стадии
      const hasMatchingRole = stageRoles.includes(assignment.role_type)

      // 4. Проверяем на дублирование - если это не первое вхождение такого назначения
      const isDuplicate =
        array.findIndex(
          (a) =>
            a.user_id === assignment.user_id &&
            a.role_type === assignment.role_type &&
            a.order_id === assignment.order_id,
        ) !== index

      // Если это дубликат - не показываем
      if (isDuplicate) {
        return false
      }

      // Для финальных стадий показываем только назначения, привязанные к этой стадии
      const finalStages = ['completed', 'cancelled', 'final', 'финал', 'завершен', 'отменен']
      if (finalStages.includes(props.currentStage.toLowerCase())) {
        // На финальных стадиях показываем только назначения с явной привязкой к стадии
        const shouldShow = hasStageAssignment || isManualAssignment
        return shouldShow
      }

      // Приоритет отдаем ручным назначениям (stage_name)
      if (isManualAssignment) {
        return true
      }

      // Для назначений через assigned_stages проверяем связь
      if (hasStageAssignment) {
        return true
      }

      // Для остальных назначений показываем только если роль подходит для текущей стадии
      return hasMatchingRole
    },
  )

  // Сортируем назначения по статусу для лучшего UX
  return stageAssignments.sort((a, b) => {
    const statusPriority = {
      in_progress: 1,
      under_review: 2,
      pending: 3,
      approved: 4,
      cancelled: 5,
    }
    return (
      (statusPriority[a.status as keyof typeof statusPriority] || 6) -
      (statusPriority[b.status as keyof typeof statusPriority] || 6)
    )
  })
})

// Сотрудники для текущей стадии
const currentStageUsers = computed(() => {
  // Получаем роли для текущей стадии
  const stageData = props.stages.find((stage: Stage) => stage.name === props.currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  // Фильтруем пользователей по ролям стадии
  const stageUsers = props.availableUsers.filter((user: User) => {
    const userRoles = user.roles?.map((role: { name: string }) => role.name) || []
    const hasMatchingRole = userRoles.some((role: string) => stageRoles.includes(role))

    return hasMatchingRole
  })

  return stageUsers
})

// Функция для пользователей с ролями
const currentStageUsersWithRoles = computed(() => {
  const stageData = props.stages.find((stage: Stage) => stage.name === props.currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  // Если у стадии нет ролей или это финальная/завершенная стадия - не показываем пользователей
  const finalStages = ['completed', 'cancelled', 'final', 'финал', 'завершен', 'отменен']
  if (stageRoles.length === 0 || finalStages.includes(props.currentStage.toLowerCase())) {
    return []
  }

  const result = currentStageUsers.value.map((user: User) => {
    // Находим роль пользователя, которая соответствует текущей стадии
    const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
      user.role,
    ]
    const matchingRole =
      userRoles.find((role) => stageRoles.includes(role || '')) ||
      userRoles[0] ||
      user.role ||
      'Неизвестная роль'

    return {
      ...user,
      displayName: `${user.name} (${getRoleLabel(matchingRole)})`,
      roleForStage: matchingRole,
    } as UserWithRole
  })

  return result
})

function assignUser(userId: number) {
  if (userId) {
    emit('assign-user', userId)
    selectedUserId.value = null
  }
}

function handleStatusChange(assignment: Assignment) {
  // Добавляем флаг обновления для лучшего UX
  assignment.updating = true

  // Создаем копию назначения для передачи в событие
  const assignmentCopy = { ...assignment }

  // Эмитим событие для обновления статуса
  emit('update-assignment-status', assignmentCopy)

  // Убираем флаг обновления через небольшую задержку
  setTimeout(() => {
    assignment.updating = false
  }, 2000)
}

function getRoleLabel(role: string) {
  // Ищем в динамически загруженных ролях
  const dynamicRole = props.roles.find((r: Role) => r.name === role)
  if (dynamicRole && dynamicRole.display_name) {
    return dynamicRole.display_name
  }

  // Если роль не найдена, возвращаем оригинальное имя
  return role
}

function getRoleBadgeStyle(role: string) {
  // Ищем стадию, которая содержит эту роль
  const stageWithRole = props.stages.find(
    (stage: Stage) => stage.roles && stage.roles.some((r: Role) => r.name === role),
  )

  if (stageWithRole?.color) {
    return {
      backgroundColor: stageWithRole.color,
      color: '#ffffff',
    }
  }

  // Fallback к серому цвету
  return {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }
}

function getAssignmentBg(status: string) {
  return (
    {
      pending: 'bg-yellow-50 border-yellow-200',
      in_progress: 'bg-blue-50 border-blue-200',
      cancelled: 'bg-red-50 border-red-200',
      under_review: 'bg-purple-50 border-purple-200',
      approved: 'bg-emerald-50 border-emerald-200',
    }[status] || 'bg-gray-50 border-gray-200'
  )
}

function getStatusTextColor(status: string) {
  return (
    {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      under_review: 'bg-purple-100 text-purple-800 border-purple-300',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    }[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  )
}

function getAssignedByName(assignedBy: User | number | string | unknown): string {
  if (!assignedBy) return '—'

  // Если это объект с именем
  if (typeof assignedBy === 'object' && assignedBy !== null && 'name' in assignedBy) {
    return (assignedBy as User).name
  }

  // Если это ID, попробуем найти пользователя в доступных пользователях
  if (typeof assignedBy === 'number' || typeof assignedBy === 'string') {
    const user = props.availableUsers.find((u: User) => u.id == assignedBy)
    if (user && user.name) {
      return user.name
    }
  }

  // Если это строка (возможно имя)
  if (typeof assignedBy === 'string') {
    return assignedBy
  }

  return '—'
}

// Проверить, является ли назначение текущего пользователя
function isCurrentUserAssignment(assignment: Assignment): boolean {
  const currentUser = getCurrentUser()
  if (!currentUser) return false
  
  // Проверяем, является ли назначение текущего пользователя
  return assignment.user_id === currentUser.id
}

// Функция для получения текста ролей
function getCurrentStageRolesText() {
  const stageData = props.stages.find((stage: Stage) => stage.name === props.currentStage)
  const stageRoles = stageData?.roles || []

  if (stageRoles.length === 0) {
    return 'Нет доступных ролей'
  }

  const roleLabels = stageRoles.map((role: Role) => getRoleLabel(role.name)).join(', ')
  return roleLabels
}

// Функция для получения текста статуса
function getStatusLabel(status: string): string {
  const statusLabels = {
    pending: 'Ожидание',
    in_progress: 'В работе',
    cancelled: 'Отменено',
    under_review: 'На проверке',
    approved: 'Одобрено'
  }
  return statusLabels[status as keyof typeof statusLabels] || status
}

// Следим за изменениями стадии и принудительно обновляем данные
watch(
  () => [props.currentStage, props.availableUsers, props.stages],
  () => {
    // Сбрасываем выбранного пользователя при смене стадии
    selectedUserId.value = null
  },
  { deep: true },
)

// Следим за изменениями назначений для лучшей реактивности
watch(
  () => props.assignments,
  () => {
    // Принудительно обновляем computed свойство
  },
  { deep: true },
)


</script>

<style scoped>
/* Плавная подсветка карточки назначений */
.assignment-highlight {
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.3),
    0 0 0 0 transparent;
  border-color: #ef4444 !important;
  background-color: white !important;
  transform: scale(1.02) !important;
  transition:
    box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: assignmentPulse 2s ease-in-out infinite;
}

@keyframes assignmentPulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15);
  }
}

/* Анимации для изменения статуса */
.assignment-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Анимация для обновления статуса */
.status-updating {
  animation: statusUpdate 0.6s ease-in-out;
}

@keyframes statusUpdate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.vs__dropdown-menu {
  max-height: 200px !important;
  overflow-y: auto !important;
  min-width: 280px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999 !important;
}

.vs__dropdown-menu .vs__dropdown-option,
.vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 32px !important;
  padding: 6px 12px !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
  color: #374151 !important;
  background: #fff !important;
  border-bottom: 1px solid #f3f4f6 !important;
  transition: all 0.2s ease !important;
}

.vs__dropdown-menu .vs__dropdown-option:hover {
  background: #f8fafc !important;
  color: #1f2937 !important;
}

.vs__dropdown-menu .vs__dropdown-option--selected {
  background: #dbeafe !important;
  color: #1e40af !important;
  font-weight: 500 !important;
}

/* Ensure Vue3Select input has good visibility */
.vs__selected-options {
  color: #111827 !important;
}

.vs__search {
  color: #111827 !important;
  background: transparent !important;
}

.vs__dropdown-toggle {
  background: white !important;
  border: 1px solid #d1d5db !important;
}

/* Кастомные стили для скроллбара в выпадающем списке */
.vs__dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.vs__dropdown-menu::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.vs__dropdown-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.vs__dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Улучшенная прокрутка для Firefox */
.vs__dropdown-menu {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}
</style>
