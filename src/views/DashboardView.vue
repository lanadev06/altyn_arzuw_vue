<template>
  <Layout>
    <div class="flex flex-col gap-10">
      <!-- График выручки (только для админов и менеджеров) -->
      <div v-if="hasAdminOrManagerRole" class="grid grid-cols-1 gap-8">
        <RevenueChart />
      </div>

      <!-- Первый ряд: метрики -->
      <div
        :class="
          hasAdminOrManagerRole
            ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
            : 'grid grid-cols-1 md:grid-cols-2 gap-8'
        "
      >
        <!-- Завершённых заказов -->
        <div
          class="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[220px]"
        >
          <svg class="w-24 h-24" viewBox="0 0 100 100">
            <circle
              class="text-gray-200"
              stroke-width="8"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
            />
            <circle
              class="text-emerald-500"
              stroke-width="8"
              :stroke-dasharray="276.46"
              :stroke-dashoffset="276.46 - (dashboardStats.percent_completed / 100) * 276.46"
              stroke-linecap="round"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
              style="transition: stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </svg>
          <span class="text-2xl font-extrabold text-emerald-600 mt-2">{{
            isNaN(Number(dashboardStats.percent_completed))
              ? '—'
              : dashboardStats.percent_completed + '%'
          }}</span>
          <span class="text-base font-semibold text-gray-700 mt-1">{{ t('dashboard.completedOrders') }}</span>
          <span class="text-xs text-gray-400 mt-1">{{ t('dashboard.percentOfAllOrders') }}</span>
        </div>
        <!-- Отменённых заказов -->
        <div
          class="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[220px]"
        >
          <svg class="w-24 h-24" viewBox="0 0 100 100">
            <circle
              class="text-gray-200"
              stroke-width="8"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
            />
            <circle
              class="text-red-500"
              stroke-width="8"
              :stroke-dasharray="276.46"
              :stroke-dashoffset="276.46 - (dashboardStats.percent_cancelled / 100) * 276.46"
              stroke-linecap="round"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
              style="transition: stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </svg>
          <span class="text-2xl font-extrabold text-red-600 mt-2">{{
            isNaN(Number(dashboardStats.percent_cancelled))
              ? '—'
              : dashboardStats.percent_cancelled + '%'
          }}</span>
          <span class="text-base font-semibold text-gray-700 mt-1">{{ t('dashboard.cancelledOrders') }}</span>
          <span class="text-xs text-gray-400 mt-1">{{ t('dashboard.percentOfAllOrders') }}</span>
        </div>
      </div>
      <!-- Быстрые действия и последние действия -->
      <div v-if="hasAdminOrManagerRole" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickActions />
        <RecentActivity />
      </div>
      <!-- Второй ряд: широкие блоки -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Заказы по стадиям -->
        <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col max-h-[420px] overflow-y-auto">
          <div class="font-extrabold text-xl mb-6 text-gray-900 tracking-wide">
            {{ t('dashboard.ordersByStage') }}
          </div>
          <div v-if="allStages.length > 0" class="flex flex-col gap-6">
            <div
              v-for="stage in allStages"
              :key="stage"
              class="flex items-center gap-6 group hover:scale-[1.03] hover:shadow-lg transition-all duration-300 rounded-xl px-3 py-2 cursor-pointer"
            >
              <span
                :class="['w-6 h-6 rounded-full', stageColor(stage)]"
                :style="stageColorStyle(stage)"
              ></span>
              <span class="w-40 font-semibold text-lg text-gray-900 tracking-tight">{{
                stageLabel(stage)
              }}</span>
              <div class="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                <div
                  class="h-5 rounded-full transition-all duration-500"
                  :class="stageColor(stage)"
                  :style="{
                    ...stageColorStyle(stage),
                    width:
                      (getStageCount(stage) /
                        Math.max(...allStages.map((s) => getStageCount(s)), 1)) *
                        100 +
                      '%',
                  }"
                ></div>
              </div>
              <span class="w-12 text-right font-extrabold text-xl text-gray-900">{{
                getStageCount(stage)
              }}</span>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-8">{{ t('dashboard.loadingStages') }}</div>
        </div>
        <!-- Задержанные назначения -->
        <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col max-h-[420px] overflow-y-auto">
          <div
            class="font-extrabold text-xl mb-6 text-red-700 tracking-wide flex items-center gap-3"
          >
            <span class="w-4 h-4 rounded-full bg-red-300"></span>
            {{ t('dashboard.delayedAssignments') }}
          </div>
          <div v-if="delayedAssignmentsList.length" class="flex flex-col gap-4">
            <div
              v-for="item in delayedAssignmentsList"
              :key="item.id"
              class="bg-white/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-2 shadow group hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
            >
              <div class="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                <span class="font-semibold text-gray-900 w-40">{{ item.user_name }}</span>
                <span
                  class="font-mono text-blue-600 hover:underline cursor-pointer"
                  @click.prevent="openOrderDetailsModal(item.order_id)"
                  :title="t('dashboard.openOrder')"
                  >#{{ item.order_id }}</span
                >
                <span class="flex items-center gap-2">
                  <span
                    :class="['w-4 h-4 rounded-full', stageColor(item.order_stage)]"
                    :style="stageColorStyle(item.order_stage)"
                  ></span>
                  <span class="text-gray-700">{{ stageLabel(item.order_stage) }}</span>
                </span>
                <span
                  class="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
                  :class="statusBadgeClass(item.status)"
                  >{{ getAssignmentStatusLabel(item.status) }}</span
                >
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-green-600 py-8 text-center flex items-center justify-center gap-2"
          >
            <svg
              class="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {{ t('dashboard.allAssignmentsOnTime') }}
          </div>
        </div>
      </div>

      <!-- Третий ряд: заказы по сотрудникам -->
      <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col max-h-[600px] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <div class="font-extrabold text-xl text-gray-900 tracking-wide">
            {{ t('dashboard.employeeWorkload') }}
          </div>
          <div class="flex items-center">
            <select
              v-model="selectedEmployeeFilter"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
            >
              <option
                v-for="emp in availableEmployees"
                :key="emp.user_id"
                :value="emp.user_id"
              >
                {{ emp.user_name }}{{ emp.roles && emp.roles.length > 0 ? ` (${emp.roles.map(r => r.display_name || r.name).join(', ')})` : '' }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div
            v-for="emp in filteredEmployees"
            :key="emp.user_id"
            class="bg-white/80 rounded-2xl p-5 flex flex-col gap-2 shadow group hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
          >
            <div class="flex items-center gap-4 mb-2">
              <span class="font-bold text-lg text-gray-900">{{ emp.user_name || '—' }}</span>
              <span
                class="ml-auto px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shadow"
                >{{ emp.total }} {{ getOrderWord(emp.total) }}</span
              >
              <button
                v-if="emp.orders && emp.orders.length > 0"
                @click="toggleEmployeeOrders(emp.user_id)"
                class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                :title="expandedEmployees.includes(emp.user_id) ? t('dashboard.collapseOrders') : t('dashboard.showAllOrders')"
              >
                {{ expandedEmployees.includes(emp.user_id) ? t('dashboard.collapse') : t('dashboard.allOrders') }}
              </button>
            </div>
            <div v-if="emp.orders && emp.orders.length" class="flex flex-col gap-1 overflow-y-auto" :class="expandedEmployees.includes(emp.user_id) ? 'max-h-[400px]' : 'max-h-[200px]'">
              <span
                v-for="order in (expandedEmployees.includes(emp.user_id) ? emp.orders : emp.orders.slice(0, 8))"
                :key="order.id"
                class="flex items-center gap-2 text-blue-600 hover:underline group cursor-pointer"
                title="Открыть детали заказа"
                @click.prevent="openOrderDetailsModal(order.id)"
              >
                <span class="font-mono text-gray-700">#{{ order.id }}</span>
                <span class="font-medium text-gray-900">{{ order.product_name }}</span>
                <span
                  class="px-2 py-0.5 rounded text-xs font-semibold"
                  :class="stageColor(order.stage?.name || order.stage)"
                  :style="stageColorStyle(order.stage?.name || order.stage)"
                  >{{
                    stageLabel(order.stage?.name || order.stage)
                  }}</span
                >
              </span>
              <!-- Показываем индикатор, если заказов больше чем помещается и не развернуто -->
              <div v-if="!expandedEmployees.includes(emp.user_id) && emp.orders.length > 8" class="text-center text-gray-500 text-sm py-2 border-t border-gray-200 mt-2">
                <span class="bg-gray-100 px-3 py-1 rounded-full">
                  {{ t('dashboard.andMoreOrders', { count: emp.orders.length - 8 }) }} {{ getOrderWord(emp.orders.length - 8) }}
                </span>
              </div>
            </div>
            <span v-else class="text-gray-400">{{ t('dashboard.noAssignedOrders') }}</span>
          </div>
        </div>
        <div v-if="filteredEmployees.length === 0 && dashboardStats.orders_by_user.length > 0" class="text-center text-gray-400 py-4">
          {{ t('dashboard.noEmployeesWithOrders') }}
        </div>
        <div
          v-if="!dashboardStats.orders_by_user || !dashboardStats.orders_by_user.length"
          class="text-center text-gray-400 py-4"
        >
          {{ t('dashboard.noData') }}
        </div>
      </div>
    </div>
  </Layout>
  <OrderDetailsModal
    v-if="showOrderDetailsModal"
    :order-id="selectedOrderId"
    @close="showOrderDetailsModal = false"
  />
</template>

<script setup lang="ts">
import Layout from '../components/layout/Layout.vue'
import QuickActions from '../components/dashboard/QuickActions.vue'
import RecentActivity from '../components/dashboard/RecentActivity.vue'
import RevenueChart from '../components/dashboard/RevenueChart.vue'
import OrderDetailsModal from '../components/orders/OrderList/OrderDetailsModal.vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, computed, watch } from 'vue'

const { t } = useI18n()
import { authApi, getAllStages, apiRequest } from '../services/api'
import { canViewAllUsers, canViewAllClients, canCreateEdit } from '../utils/permissions'
import { safeApiRequest, safeProcessActivityData } from '../utils/safeData'
import { getContrastColor } from '../utils/stageColors'
import { getCurrentUser } from '../utils/auth'
import axios from 'axios'
import { API_CONFIG } from '../config/api'
import type { Stage } from '../types/stage'
import type { User } from '../types/user'
import type { Role } from '../types/role'

const router = useRouter()

const stats = ref({
  users: 0,
  orders: 0,
  newClients: 0,
})

const staffActivity = ref<any[]>([])

const notifications = ref([])

// Новые метрики для дашборда
const dashboardStats = ref<{
  orders_by_stage: Record<string, number>
  orders_by_user: Array<{
    user_id: number
    user_name: string
    total: number
    orders: any[]
    roles?: Array<{ name: string; display_name: string }>
  }>
  closed_last_30_days: number
  delayed_assignments: number
  delayed_assignments_list: Array<{
    id: number
    user_name: string
    order_id: number
    order_stage: string
    status: string
  }>
  percent_completed: number
  percent_cancelled: number
}>({
  orders_by_stage: {},
  orders_by_user: [],
  closed_last_30_days: 0,
  delayed_assignments: 0,
  delayed_assignments_list: [],
  percent_completed: 0,
  percent_cancelled: 0,
})

const delayedAssignmentsList = ref<
  Array<{
    id: number
    user_name: string
    order_id: number
    order_stage: string
    status: string
  }>
>([])

const allStages = ref<string[]>([])
const stagesData = ref<Stage[]>([])

const showOrderDetailsModal = ref(false)
const selectedOrderId = ref<number | null>(null)
const expandedEmployees = ref<number[]>([])
const selectedEmployeeFilter = ref<string | number>(0)

// Функция для проверки ролей пользователя
const currentUser = computed(() => getCurrentUser())

const hasAdminOrManagerRole = computed(() => {
  const user = currentUser.value
  if (!user || !user.roles) return false
  return user.roles.some((role: any) => role.name === 'admin' || role.name === 'manager')
})

// Список доступных сотрудников для фильтра
const availableEmployees = computed(() => {
  return dashboardStats.value.orders_by_user.filter(emp => emp.orders && emp.orders.length > 0)
})

// Отфильтрованные сотрудники
const filteredEmployees = computed(() => {
  if (!selectedEmployeeFilter.value || selectedEmployeeFilter.value === 0) {
    // Если фильтр пустой или 0, показываем первого сотрудника
    return availableEmployees.value.slice(0, 1)
  }
  
  const filtered = availableEmployees.value.filter(emp => emp.user_id === selectedEmployeeFilter.value)
  return filtered.length > 0 ? filtered : availableEmployees.value.slice(0, 1)
})

// Устанавливаем первого сотрудника по умолчанию
watch(availableEmployees, (newEmployees) => {
  if (newEmployees && newEmployees.length > 0 && selectedEmployeeFilter.value === 0) {
    selectedEmployeeFilter.value = newEmployees[0].user_id
  }
}, { immediate: true })

function openOrderDetailsModal(orderId: number) {
  selectedOrderId.value = orderId
  showOrderDetailsModal.value = true
}

function toggleEmployeeOrders(userId: number) {
  const index = expandedEmployees.value.indexOf(userId)
  if (index > -1) {
    expandedEmployees.value.splice(index, 1)
  } else {
    expandedEmployees.value.push(userId)
  }
}

function hasRole(user: User, roleName: string) {
  return user.roles && user.roles.some((r) => r.name === roleName)
}

function stageColor(stage: string) {
  // Сначала ищем в динамических данных
  const stageData = stagesData.value.find((s) => s.name === stage)
  if (stageData && stageData.color) {
    // Если есть цвет в API, используем только font-semibold
    return 'font-semibold'
  }

  // Fallback на статические Tailwind классы
  const map: Record<string, string> = {
    draft: 'bg-gray-500 text-white',
    design: 'bg-blue-500 text-white',
    print: 'bg-yellow-500 text-gray-900',
    engraving: 'bg-orange-500 text-white',
    workshop: 'bg-purple-500 text-white',
    final: 'bg-green-500 text-white',
    completed: 'bg-emerald-500 text-white',
    cancelled: 'bg-red-500 text-white',
  }
  return map[stage] || 'bg-gray-400 text-white'
}

function stageColorStyle(stage: string) {
  // Сначала ищем в динамических данных
  const stageData = stagesData.value.find((s) => s.name === stage)
  if (stageData && stageData.color) {
    return {
      backgroundColor: stageData.color,
      color: 'white', // Всегда белый текст для лучшей читаемости
    }
  }
  return {}
}
function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    in_progress: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function stageLabel(stage: string) {
  // Сначала ищем в динамических данных
  const stageData = stagesData.value.find((s) => s.name === stage)
  if (stageData && stageData.display_name) {
    return stageData.display_name
  }

  // Fallback на статические названия
  const map: Record<string, string> = {
    draft: 'Черновик',
    design: 'Дизайн',
    print: 'Печать',
    engraving: 'Гравировка',
    workshop: 'Цех',
    final: 'Финальный',
    completed: 'Завершён',
    cancelled: 'Отменён',
  }
  return map[stage] || stage
}

function getStageCount(stage: string) {
  // Проверяем, есть ли данные о заказах по стадиям
  if (!dashboardStats.value.orders_by_stage) return 0

  // Ищем количество заказов для данной стадии
  const count = dashboardStats.value.orders_by_stage[stage]
  return count || 0
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    in_progress: 'В работе',
    under_review: 'На проверке',
    pending: 'Ожидание',
    approved: 'Одобрено',
    cancelled: 'Отменено',
    completed: 'Завершено',
  }
  return map[status] || status
}

function getAssignmentStatusLabel(status: string) {
  // Используем динамические данные - статусы назначений могут приходить с сервера
  // Если нужны переводы, они должны приходить с сервера в display_name
  return statusLabel(status)
}

function getOrderWord(count: number) {
  if (count === 1) return t('dashboard.order')
  if (count < 5) return t('dashboard.orders2')
  return t('dashboard.orders3')
}

onMounted(async () => {
  try {
    // Статистика (только для admin и manager)
    // Используем задержку между запросами для снижения нагрузки
    if (hasAdminOrManagerRole.value) {
      const statsData = await safeApiRequest<typeof stats.value>('/stats')
      if (statsData) {
        stats.value = statsData
      } else {
        stats.value = { users: 0, orders: 0, newClients: 0 }
      }
      // Небольшая задержка перед следующим запросом
      await new Promise(resolve => setTimeout(resolve, 200))
    } else {
      // Для обычных пользователей загружаем только базовую статистику
      const statsData = await safeApiRequest<typeof stats.value>('/stats')
      if (statsData) {
        stats.value = {
          users: statsData.users || 0,
          orders: statsData.orders || 0,
          newClients: statsData.newClients || 0,
        }
      } else {
        stats.value = { users: 0, orders: 0, newClients: 0 }
      }
      // Небольшая задержка перед следующим запросом
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Активность (только для admin и manager)
    // Убираем дублирование - RecentActivity уже показывает эту информацию
    // if (hasAdminOrManagerRole.value) {
    //   const activityData = await safeApiRequest<any[]>('/activity')
    //   if (Array.isArray(activityData)) {
    //     staffActivity.value = safeProcessActivityData(activityData) as any[]
    //   } else {
    //     staffActivity.value = [] as any[]
    //   }
    // } else {
    //   staffActivity.value = [] as any[]
    // }

    // Оставляем пустой массив - активность показывается в RecentActivity
    staffActivity.value = []

    // Уведомления - загружаем с задержкой после других запросов
    // Небольшая задержка перед запросом уведомлений
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const token = localStorage.getItem('auth_token')
      const res = await axios.get(`${API_CONFIG.BASE_URL}/notifications/unread`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      notifications.value = res.data
      if (notifications.value.length > 0) {
        // Пометить все как прочитанные
        await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/read-all`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      }
    } catch (notificationError: any) {
      // Игнорируем 429 ошибки для уведомлений, они обрабатываются в NotificationBell
      if (notificationError?.response?.status !== 429) {
        notifications.value = []
      }
    }

    // Загрузка стадий
    try {
      const stagesRes = await getAllStages()

      if (Array.isArray(stagesRes)) {
        stagesData.value = stagesRes
        allStages.value = stagesRes.map((s) => s.name)
      } else if (stagesRes && stagesRes.data && Array.isArray(stagesRes.data)) {
        stagesData.value = stagesRes.data
        allStages.value = stagesRes.data.map((s: Stage) => s.name)
      } else {
        // Fallback на статические стадии
        allStages.value = [
          'draft',
          'design',
          'print',
          'engraving',
          'workshop',
          'final',
          'completed',
          'cancelled',
        ]
      }
    } catch (stagesError) {
      // Fallback на статические стадии
      allStages.value = [
        'draft',
        'design',
        'print',
        'engraving',
        'workshop',
        'final',
        'completed',
        'cancelled',
      ]
    }

    // Новый эндпоинт для дашборда - загружаем с задержкой
    await new Promise(resolve => setTimeout(resolve, 400))
    try {
      const res = (await apiRequest('/stats/dashboard')) as any

      // Проверяем, является ли это представлением для сотрудника
      if (res.is_employee_view) {
        // Подсчитываем заказы по стадиям из назначений сотрудника
        const ordersByStage: Record<string, number> = {}
        if (res.recent_assignments) {
          Object.values(res.recent_assignments).forEach((assignment: any) => {
            const stage = assignment.stage || 'unknown'
            ordersByStage[stage] = (ordersByStage[stage] || 0) + 1
          })
        }

        // Для сотрудников показываем их персональную статистику
        dashboardStats.value = {
          orders_by_stage: ordersByStage,
          orders_by_user: [
            {
              user_id: currentUser.value?.id,
              user_name: currentUser.value?.name,
              total: res.user_stats?.total_assignments || 0,
              orders: res.recent_assignments || [],
            },
          ],
          closed_last_30_days: 0,
          delayed_assignments: res.user_stats?.delayed_assignments || 0,
          delayed_assignments_list: [],
          percent_completed: res.user_stats?.total_assignments
            ? Math.round(
                (res.user_stats.completed_assignments / res.user_stats.total_assignments) * 100,
              )
            : 0,
          percent_cancelled: 0, // Для сотрудников не показываем отменённые
        }

        // Для сотрудников показываем их собственные задержанные назначения
        if (res.recent_assignments) {
          const delayed = Object.values(res.recent_assignments).filter((assignment: any) => {
            if (!assignment.deadline) return false
            const deadline = new Date(assignment.deadline)
            const now = new Date()
            return (
              deadline < now &&
              assignment.status !== 'completed' &&
              assignment.status !== 'cancelled'
            )
          })

          delayedAssignmentsList.value = delayed.map((assignment: any) => ({
            id: assignment.id,
            user_name: currentUser.value?.name,
            order_id: assignment.id,
            order_stage: assignment.stage,
            status: assignment.status,
          }))
        } else {
          delayedAssignmentsList.value = []
        }
      } else {
        // Для админов и менеджеров показываем полную статистику
        dashboardStats.value = res
        delayedAssignmentsList.value = res.delayed_assignments_list || []
      }
    } catch (e) {
      // Устанавливаем значения по умолчанию при ошибке
      dashboardStats.value = {
        orders_by_stage: {},
        orders_by_user: [],
        closed_last_30_days: 0,
        delayed_assignments: 0,
        delayed_assignments_list: [],
        percent_completed: 0,
        percent_cancelled: 0,
      }
    }
  } catch (e) {
    // Устанавливаем значения по умолчанию
    stats.value = {
      users: 0,
      orders: 0,
      newClients: 0,
    }
    staffActivity.value = []
    notifications.value = []
  }
})

const handleLogout = async () => {
  try {
    await authApi.logout()
    router.push('/login')
  } catch (error) {
    // Even if API logout fails, clear local storage and redirect
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
.animate-shimmer {
  background-size: 400px 100%;
  background-repeat: no-repeat;
  animation: shimmer 2s infinite linear;
}
@keyframes pulse-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 16px #fff);
  }
  50% {
    filter: drop-shadow(0 0 32px #fff);
  }
}
.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}
</style>
