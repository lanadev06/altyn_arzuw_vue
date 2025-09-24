<template>
  <div class="user-list flex flex-col">
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Всего:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || 0 }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Страницы:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div
        class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1 shadow-sm border border-gray-200"
      >
        <span class="text-gray-600 font-semibold">На странице:</span>
        <select
          v-model.number="perPage"
          @change="changePerPage"
          class="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 font-semibold"
        >
          <option v-for="n in [10, 20, 50, 100, 200, 500]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>
    <div class="flex-1 flex flex-col min-h-0">
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                v-for="col in columns"
                :key="col.key"
                :class="[
                  'border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-100 text-left',
                  col.key === 'created_at' || col.key === 'updated_at'
                    ? 'whitespace-nowrap pr-4 w-[170px]'
                    : 'whitespace-nowrap',
                ]"
                @click="col.sortable ? setSort(col.key) : null"
              >
                <div class="flex items-center justify-between">
                  <span>{{ col.label }}</span>
                  <span v-if="col.sortable && sortBy === col.key" class="ml-1 text-blue-600">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(user, index) in users"
              :key="user.id"
              :class="[
                canEditUsers() ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default',
                'border-b border-gray-100 transition-colors',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
              ]"
              @click="canEditUsers() ? editUser(user) : null"
              style="height: 44px"
            >
              <template
                v-for="(col, colIndex) in columns"
                :key="`${user.id}-${col.key}-${colIndex}`"
              >
                <td
                  :class="[
                    'border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle',
                    col.key === 'id' ? 'max-w-[100px]' : '',
                    col.key === 'name' ? 'font-medium text-gray-900' : '',
                    col.key === 'created_at' || col.key === 'updated_at' ? 'w-[170px]' : '',
                  ]"
                >
                  <template v-if="col.key === 'id'">
                    <span class="font-mono text-gray-600">{{ user.id }}</span>
                  </template>

                  <template v-else-if="col.key === 'name'">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="user.image_url || user.image"
                        :src="user.image_url || `/storage/${user.image}`"
                        :alt="user.name"
                        class="w-8 h-8 rounded-full object-cover"
                      />
                      <div
                        v-else
                        class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm"
                      >
                        {{ (user.name || '').charAt(0).toUpperCase() }}
                      </div>
                      {{ user.name }}
                    </div>
                  </template>

                  <template v-else-if="col.key === 'username'">
                    {{ user.username }}
                  </template>

                  <template v-else-if="col.key === 'role'">
                    <template v-if="user.roles && user.roles.length">
                      <span
                        v-for="role in user.roles"
                        :key="role.id"
                        class="px-2 py-1 rounded-full text-xs font-medium mr-1"
                        :class="getRoleBadgeClass(role.name)"
                        :style="getRoleBadgeStyle(role.name)"
                      >
                        {{ role.display_name || role.name }}
                      </span>
                    </template>
                    <template v-else>
                      <span
                        class="px-2 py-1 rounded-full text-xs font-medium"
                        :class="getRoleBadgeClass(user.roles?.[0]?.name || '')"
                      >
                        {{ user.roles?.[0]?.name || 'Нет роли' }}
                      </span>
                    </template>
                  </template>

                  <template v-else-if="col.key === 'phone'">
                    <span class="text-gray-700">{{ user.phone || '-' }}</span>
                  </template>

                  <template v-else-if="col.key === 'is_active'">
                    <button
                      v-if="canToggleUserActive()"
                      @click.stop="toggleUserActive(user.id)"
                      :class="
                        user.is_active
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      "
                      class="px-2 py-1 rounded text-white text-xs transition-colors"
                      title="Переключить активность"
                    >
                      <span v-if="user.is_active">✓</span>
                      <span v-else>⏻</span>
                    </button>
                    <span
                      v-else
                      :class="
                        user.is_active
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      "
                      class="px-2 py-1 rounded text-white text-xs"
                    >
                      <span v-if="user.is_active">✓</span>
                      <span v-else>⏻</span>
                    </span>
                  </template>

                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(user.created_at) }}</span>
                  </template>

                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(user.updated_at) }}</span>
                  </template>
                </td>
              </template>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка пользователей...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && users.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Сотрудники не найдены' : 'Сотрудники отсутствуют' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && !error && pagination?.total > 0"
        :current-page="pagination?.current_page || 1"
        :last-page="pagination?.last_page || 1"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <UserFormModal
      v-if="props.showCreateModal"
      :user="null"
      :validation-errors="validationErrors"
      @close="$emit('close-create-modal')"
      @submit="handleCreateUser"
    />
    <UserFormModal
      v-if="showEditModal"
      :user="editingUser"
      :validation-errors="validationErrors"
      @close="showEditModal = false"
      @submit="handleUpdateUser"
      @delete="handleDeleteUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useUserController } from '@/controllers/UserController'
import UIButton from '@/components/ui/UIButton.vue'
import UserFormModal from './UserFormModal.vue'
import { API_CONFIG } from '@/config/api'
import Pagination from './Pagination.vue'
import Sortable from 'sortablejs'
import { useToast } from '@/stores/toast'
import { getRoleColorClasses, getRoleColorStyles } from '../../../utils/roleColors'
import { canEditUsers, canToggleUserActive } from '../../../utils/permissions'
import { getUserImageUrl } from '../../../utils/user'

const props = defineProps<{
  search?: string
  role?: string
  showCreateModal?: boolean
  activeFilter?: string
  rolesData?: any[]
  stagesData?: any[]
}>()
const emit = defineEmits(['close-create-modal', 'open-create-modal'])

const toast = useToast()

const {
  users,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  fetchUsers,
  create,
  update: updateUser,
  remove: deleteUser,
  toggleActive,
} = useUserController()

const showEditModal = ref(false)
const editingUser = ref<any>(null)
const currentPage = ref(1)
const perPage = ref(30)
const validationErrors = ref<Record<string, string>>({})

// Константы для localStorage
const SORT_KEY = 'userList_sortBy'
const ORDER_KEY = 'userList_sortOrder'
const COLUMNS_KEY = 'userList_columns'

// Загружаем сохраненные настройки
const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('userList_perPage')

// Базовые колонки
const baseColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'username', label: 'Логин', sortable: true },
  { key: 'role', label: 'Роль', sortable: false },
  { key: 'phone', label: 'Телефон', sortable: false },
  { key: 'is_active', label: 'Статус', sortable: false },
  { key: 'created_at', label: 'Создано', sortable: true },
  { key: 'updated_at', label: 'Обновлено', sortable: false },
]

// Инициализируем колонки из localStorage или используем базовые
const columns = ref(savedColumns ? JSON.parse(savedColumns) : [...baseColumns])

// Инициализируем сортировку из localStorage
if (savedSortBy && sortBy.value !== savedSortBy) {
  sortBy.value = savedSortBy
}
if (savedSortOrder && sortOrder.value !== savedSortOrder) {
  sortOrder.value = savedSortOrder as 'asc' | 'desc'
}

// Инициализируем perPage из localStorage
if (savedPerPage) {
  perPage.value = parseInt(savedPerPage)
}

function setSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  // Сохраняем в localStorage
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  
  currentPage.value = 1
  fetchUsers(1, props.search || '', key, sortOrder.value, perPage.value, props.role, getActiveFilter())
}

// Вспомогательная функция для получения фильтра активности
function getActiveFilter(): boolean | null {
  if (props.activeFilter === 'active') return true
  if (props.activeFilter === 'inactive') return false
  return null
}

// Функция сброса настроек
function resetSettings() {
  columns.value = [...baseColumns]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'id'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  perPage.value = 30
  localStorage.setItem('userList_perPage', perPage.value.toString())
  currentPage.value = 1
  fetchUsers(1, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
}

const columnsHeader = ref<HTMLElement | null>(null)

function formatDate(date: string | null | undefined) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}


const getRoleBadgeClass = (role: string) => {
  const roleData = props.rolesData?.find((r) => r.name === role)
  return getRoleColorClasses(role, roleData, props.stagesData)
}

const getRoleBadgeStyle = (role: string) => {
  const roleData = props.rolesData?.find((r) => r.name === role)
  return getRoleColorStyles(role, roleData, props.stagesData)
}

const editUser = (user: any) => {
  if (!canEditUsers()) return
  editingUser.value = user
  showEditModal.value = true
}

async function toggleUserActive(userId: number) {
  if (!canToggleUserActive()) {
    return
  }
  
  try {
    const result = await toggleActive(userId)
    // Если локальное обновление не сработало, перезагружаем данные
    if (!result || result.is_active === undefined) {
      fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
    } else {
    }
  } catch (e) {
    // В случае ошибки перезагружаем данные
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
  }
}





function goToPage(page: number) {
  if (!pagination || !pagination.last_page) return
  if (page < 1 || page > pagination.last_page) return
  
  currentPage.value = page
  fetchUsers(page, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
}

function changePerPage() {
  // Сохраняем perPage в localStorage
  localStorage.setItem('userList_perPage', perPage.value.toString())
  
  currentPage.value = 1
  fetchUsers(1, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
}

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      onEnd(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex === undefined || newIndex === undefined) return
        const moved = columns.value.splice(oldIndex, 1)[0]
        columns.value.splice(newIndex, 0, moved)
        
        // Сохраняем новый порядок колонок в localStorage
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      },
    })
  }
  fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
})

watch([() => props.search, () => props.role, () => props.activeFilter], () => {
  currentPage.value = 1
  fetchUsers(1, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
})

watch([sortBy, sortOrder], () => {
  fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
})

// Обработчики событий от UserFormModal
async function handleCreateUser(userData: any) {
  try {
    // Очищаем предыдущие ошибки валидации
    validationErrors.value = {}
    
    await create(userData)
    emit('close-create-modal')
    toast.show('Сотрудник создан!', 'success')
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
  } catch (err: any) {
    // Если есть ошибки валидации полей, передаем их в модальное окно
    if (err.fieldErrors) {
      validationErrors.value = err.fieldErrors
      toast.show('Пожалуйста, исправьте ошибки в форме', 'error')
    } else {
      toast.show('Ошибка при создании сотрудника', 'error')
    }
  }
}

async function handleUpdateUser(userData: any) {
  try {
    if (!editingUser.value) return
    
    // Очищаем предыдущие ошибки валидации
    validationErrors.value = {}
    
    await updateUser(editingUser.value.id, userData)
    showEditModal.value = false
    toast.show('Сотрудник обновлён!', 'success')
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role, getActiveFilter())
  } catch (err: any) {
    // Если есть ошибки валидации полей, передаем их в модальное окно
    if (err.fieldErrors) {
      validationErrors.value = err.fieldErrors
      toast.show('Пожалуйста, исправьте ошибки в форме', 'error')
    } else {
      toast.show('Ошибка при обновлении сотрудника', 'error')
    }
  }
}

async function handleDeleteUser(userId: number) {
  try {
    await deleteUser(userId, currentPage.value)
    showEditModal.value = false
    toast.show('Сотрудник успешно удалён!', 'success')
  } catch (err: any) {
    let message = 'Произошла неизвестная ошибка при удалении сотрудника'
    if (err?.response?.data?.message) {
      message = err.response.data.message
    } else if (err instanceof Error && err.message) {
      message = `Ошибка удаления сотрудника: ${err.message}`
    }
    toast.show(message, 'error')
  }
}

defineOptions({
  name: 'UserList'
})
</script>
