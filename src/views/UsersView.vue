<template>
  <Layout v-slot="{ search }">
    <div class="flex items-center justify-between mb-3 gap-4">
      <div class="flex items-center gap-4">
        <select
          v-model="selectedRole"
          @change="handleRoleChange"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 180px"
          :disabled="loadingRoles"
        >
          <option value="">Все роли</option>
          <option v-for="role in availableRoles" :key="role.id" :value="role.name">
            {{ role.display_name || role.name }}
          </option>
        </select>
        <select
          v-model="activeFilter"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 180px"
        >
          <option value="">Все пользователи</option>
          <option value="1">Только активные</option>
          <option value="0">Только неактивные</option>
        </select>
      </div>
      <UIButton v-if="canCreateUsers()" @click="openCreateModal" variant="primary"> Добавить пользователя </UIButton>
    </div>
    <div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <UserList
        :search="search"
        :role="selectedRole"
        :activeFilter="activeFilter"
        :showCreateModal="showCreateModal"
        :roles-data="availableRoles"
        :stages-data="stagesData"
        @close-create-modal="closeCreateModal"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UserList from '../components/users/UserList/UserList.vue'
import UIButton from '../components/ui/UIButton.vue'
import Layout from '../components/layout/Layout.vue'
import { getAllRoles, getRolesWithStages, getAllStages } from '../services/api'
import { canCreateUsers } from '../utils/permissions'

const showCreateModal = ref(false)
const selectedRole = ref('')
const activeFilter = ref('')
const availableRoles = ref<any[]>([])
const loadingRoles = ref(false)
const stagesData = ref<any[]>([])

// Загружаем роли и стадии из API
async function loadRoles() {
  loadingRoles.value = true
  try {
    // Загружаем роли со связанными стадиями
    const rolesResponse = await getRolesWithStages()
    const roles = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse.data || []

    // Загружаем стадии для дополнительной информации о цветах
    const stagesResponse = await getAllStages()
    const stages = Array.isArray(stagesResponse) ? stagesResponse : stagesResponse.data || []

    availableRoles.value = roles
    stagesData.value = stages
  } catch (error) {
    // Fallback к статическим ролям в случае ошибки
    availableRoles.value = [
      { id: 1, name: 'admin', display_name: 'Администратор' },
      { id: 2, name: 'manager', display_name: 'Менеджер' },
      { id: 3, name: 'designer', display_name: 'Дизайнер' },
      { id: 4, name: 'print_operator', display_name: 'Печатник' },
      { id: 5, name: 'workshop_worker', display_name: 'Работник цеха' },
    ]
    stagesData.value = []
  } finally {
    loadingRoles.value = false
  }
}

function openCreateModal() {
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function handleRoleChange(e: Event) {
  selectedRole.value = (e.target as HTMLSelectElement).value
}

onMounted(() => {
  loadRoles()
})
</script>
