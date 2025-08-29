<template>
  <div class="role-list flex flex-col">
    <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
      <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Всего:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.total || roles.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 font-semibold">Страницы:</span>
          <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
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
        <button
          v-if="canCreateEdit()"
          @click="$emit('open-create-modal')"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Добавить роль
        </button>
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
              v-for="(role, index) in sortedRoles"
              :key="role.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              @click="editRole(role)"
              style="height: 44px"
            >
              <template v-for="col in columns" :key="col.key">
                <td
                  :class="[
                    'border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle',
                    col.key === 'id' ? 'max-w-[100px]' : '',
                    col.key === 'name' ? 'font-medium text-gray-900' : '',
                    col.key === 'created_at' || col.key === 'updated_at' ? 'w-[170px]' : '',
                  ]"
                >
                  <template v-if="col.key === 'id'">
                    <span class="font-mono text-gray-600">{{ role.id }}</span>
                  </template>

                  <template v-else-if="col.key === 'name'">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-600 font-medium"
                      >
                        {{ (role.display_name || role.name).charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ role.display_name || role.name }}
                        </div>
                        <div class="text-sm text-gray-500">{{ role.name }}</div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="col.key === 'description'">
                    <span class="text-gray-700">{{ role.description || '-' }}</span>
                  </template>

                  <template v-else-if="col.key === 'users_count'">
                    <span class="text-gray-700">{{ role.users_count || 0 }}</span>
                  </template>

                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(role.created_at) }}</span>
                  </template>

                  <template v-else-if="col.key === 'updated_at'">
                    <span class="text-gray-600 text-base">{{ formatDate(role.updated_at) }}</span>
                  </template>
                </td>
              </template>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                Загрузка ролей...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500 text-base">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && roles.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Роли не найдены' : 'Роли отсутствуют' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && !error && (pagination?.total || 0) > 0"
        :current-page="pagination?.current_page || 1"
        :last-page="pagination?.last_page || 1"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <RoleFormModal
      v-if="props.showCreateModal"
      :role="null"
      @close="$emit('close-create-modal')"
      @submit="handleCreateRole"
    />
    <RoleFormModal
      v-if="showEditModal"
      :role="editingRole"
      @close="showEditModal = false"
      @submit="handleUpdateRole"
      @delete="handleDeleteRole"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import RoleController from '../../../controllers/RoleController'
import RoleFormModal from './RoleFormModal.vue'
import Pagination from '../../users/UserList/Pagination.vue'
import Sortable from 'sortablejs'
import type { Role } from '../../../types/role'
import { canCreateEdit, canDelete } from '../../../utils/permissions'
import { useToast } from '../../../stores/toast'

const props = defineProps<{
  search?: string
  showCreateModal?: boolean
}>()
const emit = defineEmits(['close-create-modal', 'open-create-modal'])

const toast = useToast()

const pagination = ref<{
  current_page: number
  last_page: number
  total: number
  per_page: number
} | null>(null)

const SORT_KEY = 'roleList_sortBy'
const ORDER_KEY = 'roleList_sortOrder'
const COLUMNS_KEY = 'roleList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY) as 'asc' | 'desc' | null
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('roleList_perPage')

const roles = ref<Role[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const editingRole = ref<Role | null>(null)
const sortBy = ref('id')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)

const columns = ref(
  savedColumns
    ? JSON.parse(savedColumns)
    : [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Название', sortable: true },
        { key: 'description', label: 'Описание', sortable: false },
        { key: 'users_count', label: 'Пользователей', sortable: true },
        { key: 'created_at', label: 'Создано', sortable: true },
        { key: 'updated_at', label: 'Обновлено', sortable: false },
      ],
)

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder) sortOrder.value = savedSortOrder

const sortedRoles = computed(() => {
  const filteredRoles = props.search
    ? roles.value.filter(
        (role) =>
          role.name.toLowerCase().includes(props.search!.toLowerCase()) ||
          (role.display_name &&
            role.display_name.toLowerCase().includes(props.search!.toLowerCase())) ||
          (role.description &&
            role.description.toLowerCase().includes(props.search!.toLowerCase())),
      )
    : roles.value

  return filteredRoles.sort((a, b) => {
    let aVal: string | number = (a[sortBy.value as keyof Role] as string | number) || ''
    let bVal: string | number = (b[sortBy.value as keyof Role] as string | number) || ''

    if (sortBy.value === 'name') {
      aVal = a.display_name || a.name
      bVal = b.display_name || b.name
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

function setSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
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

const editRole = (role: Role) => {
  editingRole.value = role
  showEditModal.value = true
}

const fetchRoles = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await RoleController.getAll()
    roles.value = data
  } catch (err: unknown) {
    error.value = (err as Error)?.message || 'Ошибка загрузки ролей'
  } finally {
    loading.value = false
  }
}

const handleCreateRole = async (roleData: {
  name: string
  display_name: string
  description?: string
}) => {
  try {
    await RoleController.create(roleData)
    emit('close-create-modal')
    await fetchRoles()
  } catch (err: unknown) {}
}

const handleUpdateRole = async (roleData: {
  name?: string
  display_name?: string
  description?: string
}) => {
  try {
    if (!editingRole.value) return
    await RoleController.update(editingRole.value.id, roleData)
    showEditModal.value = false
    editingRole.value = null
    await fetchRoles()
  } catch (err: unknown) {}
}

const handleDeleteRole = async (roleId: number) => {
  try {
    // Проверяем права доступа
    if (!canDelete()) {
      toast.show('У вас нет прав для удаления ролей', 'error')
      return
    }

    // Проверяем токен авторизации
    const token = localStorage.getItem('auth_token')
    if (!token) {
      toast.show('Необходима авторизация для удаления роли', 'error')
      return
    }

    await RoleController.delete(roleId)
    toast.show('Роль успешно удалена!', 'success')
    showEditModal.value = false
    editingRole.value = null
    await fetchRoles()
  } catch (err: unknown) {
    // Показываем ошибку пользователю
    if (err instanceof Error) {
      toast.show(`Ошибка удаления роли: ${err.message}`, 'error')
    } else {
      toast.show('Произошла неизвестная ошибка при удалении роли', 'error')
    }
  }
}

function goToPage(page: number) {
  if (!pagination.value || !pagination.value.last_page) return
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
  fetchRoles()
}

function validatePerPage(val: number) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}

function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('roleList_perPage', perPage.value.toString())
  goToPage(1)
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
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      },
    })
  }
  await fetchRoles()
})

watch(
  () => props.search,
  () => {
    // Search is handled by computed property
  },
)

watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('roleList_perPage', perPage.value.toString())
  goToPage(1)
})
</script>
