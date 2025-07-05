<template>
  <div class="user-list flex flex-col">
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
              v-for="(user, index) in displayedUsers"
              :key="user.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              @click="editUser(user)"
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
                    <span class="font-mono text-gray-600">{{ user.id }}</span>
                  </template>

                  <template v-else-if="col.key === 'name'">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="getUserImageUrl(user)"
                        :src="getUserImageUrl(user)"
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
                    <span
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="getRoleBadgeClass(user.role)"
                    >
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </template>

                  <template v-else-if="col.key === 'phone'">
                    <span class="text-gray-700">{{ user.phone || '-' }}</span>
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
            <tr v-if="!loading && !error && displayedUsers.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500 text-base">
                {{ props.search ? 'Пользователи не найдены' : 'Пользователи отсутствуют' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && !error && pagination.total > 0"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <UserFormModal
      v-if="props.showCreateModal"
      :user="null"
      @close="$emit('close-create-modal')"
      @submit="handleCreateUser"
    />
    <UserFormModal
      v-if="showEditModal"
      :user="editingUser"
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

const props = defineProps<{ search?: string; role?: string; showCreateModal?: boolean }>()
const emit = defineEmits(['close-create-modal', 'open-create-modal'])

const {
  users,
  loading,
  error,
  pagination,
  sortBy,
  sortOrder,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  setSort,
  getRoleLabel,
} = useUserController()

const showEditModal = ref(false)
const editingUser = ref<any>(null)
const currentPage = ref(1)
const perPage = ref(10)

const displayedUsers = ref<any[]>([])
const columnsHeader = ref<HTMLElement | null>(null)

function updateDisplayedUsers() {
  displayedUsers.value = [...users.value].sort((a, b) => {
    let aValue = a[sortBy.value]
    let bValue = b[sortBy.value]
    if (sortBy.value === 'created_at' || sortBy.value === 'updated_at') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

watch([users, sortBy, sortOrder], updateDisplayedUsers, { immediate: true })

const columns = ref([
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'username', label: 'Логин', sortable: true },
  { key: 'role', label: 'Роль', sortable: true },
  { key: 'phone', label: 'Телефон', sortable: false },
  { key: 'created_at', label: 'Создано', sortable: true },
  { key: 'updated_at', label: 'Обновлено', sortable: false },
])

const getRoleBadgeClass = (role: string) => {
  const classes: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    designer: 'bg-green-100 text-green-800',
    print_operator: 'bg-yellow-100 text-yellow-800',
    workshop_worker: 'bg-purple-100 text-purple-800',
  }
  return classes[role] || 'bg-gray-100 text-gray-800'
}

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

function getUserImageUrl(user: any) {
  if (user.image_url) return user.image_url
  if (user.image && user.image.startsWith('http')) return user.image
  if (user.image) return `${API_CONFIG.BASE_URL.replace('/api', '')}/storage/${user.image}`
  return ''
}

const editUser = (user: any) => {
  editingUser.value = user
  showEditModal.value = true
}

const handleCreateUser = async (userData: any) => {
  try {
    await createUser(userData)
    emit('close-create-modal')
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role)
  } catch (err) {
    console.error('Ошибка создания:', err)
  }
}

const handleUpdateUser = async (userData: any) => {
  try {
    if (!editingUser.value) return
    await updateUser(editingUser.value.id, userData)
    showEditModal.value = false
    editingUser.value = null
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role)
  } catch (err) {
    console.error('Ошибка обновления:', err)
  }
}

const handleDeleteUser = async (userId: number) => {
  try {
    await deleteUser(userId)
    showEditModal.value = false
    editingUser.value = null
    fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role)
  } catch (err) {
    console.error('Ошибка удаления:', err)
  }
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
  fetchUsers(page, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role)
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
      },
    })
  }
  fetchUsers(currentPage.value, props.search || '', sortBy.value, sortOrder.value, perPage.value, props.role)
})

watch([() => props.search, () => props.role], () => {
  goToPage(1)
})
</script>
