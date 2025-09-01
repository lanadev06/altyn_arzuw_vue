<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        Пользователи роли "{{ role?.display_name }}"
      </h2>
    </template>

    <div class="space-y-6">
      <!-- Текущие пользователи -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Текущие пользователи</h3>
        <div v-if="roleUsers.length > 0" class="space-y-2">
          <div
            v-for="user in roleUsers"
            :key="user.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <div class="font-medium text-gray-900">{{ user.name }}</div>
              <div class="text-sm text-gray-500">{{ user.email }}</div>
            </div>
            <UIButton @click="removeUser(user)" variant="danger" size="sm"> Убрать </UIButton>
          </div>
        </div>
        <div v-else class="text-center py-4 text-gray-500">Нет назначенных пользователей</div>
      </div>

      <!-- Добавление пользователей -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Добавить пользователей</h3>

        <!-- Поиск пользователей -->
        <SearchInput v-model="searchQuery" placeholder="Поиск пользователей..." class="mb-4" />

        <!-- Список доступных пользователей -->
        <div v-if="availableUsers.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="user in filteredAvailableUsers"
            :key="user.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div>
              <div class="font-medium text-gray-900">{{ user.name }}</div>
              <div class="text-sm text-gray-500">{{ user.email }}</div>
            </div>
            <UIButton @click="addUser(user)" variant="primary" size="sm"> Добавить </UIButton>
          </div>
        </div>
        <div v-else class="text-center py-4 text-gray-500">Нет доступных пользователей</div>
      </div>

      <!-- Кнопки -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <UIButton @click="$emit('close')" class="flex-1"> Закрыть </UIButton>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIButton from '@/components/ui/UIButton.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import RoleController from '@/controllers/RoleController'
import type { Role, User } from '@/types/role'
import { toast } from '@/stores/toast'

const props = defineProps<{
  role: Role | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const searchQuery = ref('')
const roleUsers = ref<User[]>([])
const availableUsers = ref<User[]>([])

// Фильтрация доступных пользователей
const filteredAvailableUsers = computed(() => {
  let filtered = availableUsers.value

  // Поиск по имени или email
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    )
  }

  // Исключаем уже назначенных пользователей
  const assignedUserIds = roleUsers.value.map((u) => u.id)
  filtered = filtered.filter((user) => !assignedUserIds.includes(user.id))

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Загрузка пользователей роли
const loadRoleUsers = async () => {
  if (!props.role) return

  try {
    const role = await RoleController.getById(props.role.id)
    roleUsers.value = role.users || []
  } catch (error) {
    toast.show('Ошибка загрузки пользователей роли', 'error')
  }
}

// Загрузка всех пользователей
const loadAvailableUsers = async () => {
  try {
    // Здесь нужно будет добавить API для получения всех пользователей
    // Пока используем заглушку
    availableUsers.value = []
  } catch (error) {
    toast.show('Ошибка загрузки доступных пользователей', 'error')
  }
}

// Добавление пользователя к роли
const addUser = async (user: User) => {
  if (!props.role) return

  try {
    await RoleController.assignUsers(props.role.id, { user_ids: [user.id] })
    roleUsers.value.push(user)
    toast.show('Пользователь успешно добавлен к роли', 'success')
  } catch (error) {
    toast.show('Ошибка добавления пользователя к роли', 'error')
  }
}

// Удаление пользователя из роли
const removeUser = async (user: User) => {
  if (!props.role) return

  if (!confirm(`Убрать пользователя "${user.name}" из роли?`)) {
    return
  }

  try {
    await RoleController.removeUsers(props.role.id, { user_ids: [user.id] })
    roleUsers.value = roleUsers.value.filter((u) => u.id !== user.id)
    toast.show('Пользователь успешно убран из роли', 'success')
  } catch (error) {
    toast.show('Ошибка удаления пользователя из роли', 'error')
  }
}

onMounted(() => {
  loadRoleUsers()
  loadAvailableUsers()
})


defineOptions({
  name: 'RoleUsersModal'
})
</script>
