<template>
  <Layout v-slot="{ search }">
    <div class="flex items-center justify-between mb-3 gap-4">
      <div class="items-center gap-4">
        <select
          v-model="selectedRole"
          @change="handleRoleChange"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 180px"
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="designer">Дизайнер</option>
          <option value="print_operator">Печатник</option>
          <option value="workshop_worker">Работник цеха</option>
        </select>
      </div>
      <UIButton @click="openCreateModal" variant="primary"> Добавить пользователя </UIButton>
    </div>
    <div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <UserList
        :search="search"
        :role="selectedRole"
        :show-create-modal="showCreateModal"
        @close-create-modal="closeCreateModal"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserListImport from '../components/users/UserList/UserList.vue'
import UIButtonImport from '../components/ui/UIButton.vue'
import LayoutImport from '../components/layout/Layout.vue'

const UserList = UserListImport.default || UserListImport
const UIButton = UIButtonImport.default || UIButtonImport
const Layout = LayoutImport.default || LayoutImport

const showCreateModal = ref(false)
const selectedRole = ref('')

function openCreateModal() {
  console.log('Открытие модального окна...')
  showCreateModal.value = true
  console.log('showCreateModal установлен в:', showCreateModal.value)
}

function closeCreateModal() {
  showCreateModal.value = false
}

function handleRoleChange(e: Event) {
  selectedRole.value = (e.target as HTMLSelectElement).value
}
</script>
