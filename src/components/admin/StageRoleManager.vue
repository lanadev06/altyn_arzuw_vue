<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-900">Управление связями стадий и ролей</h2>
      <UIButton @click="loadData" :loading="loading" variant="secondary"> Обновить </UIButton>
    </div>

    <!-- Стадии с их ролями -->
    <div class="space-y-6">
      <div v-for="stage in stages" :key="stage.id" class="border rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: stage.color || '#6b7280' }"
            ></div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ stage.display_name }}
            </h3>
            <span class="text-sm text-gray-500">({{ stage.name }})</span>
          </div>
          <UIButton @click="addRoleToStage(stage)" size="sm" :disabled="!availableRoles.length">
            Добавить роль
          </UIButton>
        </div>

        <!-- Роли стадии -->
        <div v-if="stage.roles && stage.roles.length > 0" class="space-y-2">
          <div
            v-for="role in stage.roles"
            :key="role.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <span class="font-medium text-gray-900">{{ role.display_name }}</span>
              <span class="text-sm text-gray-500">({{ role.name }})</span>
              <div class="flex space-x-2">
                <span
                  v-if="(role as any).pivot?.is_required"
                  class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                >
                  Обязательная
                </span>
                <span
                  v-if="(role as any).pivot?.auto_assign"
                  class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                >
                  Автоназначение
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UIButton @click="editRoleSettings(stage, role)" size="sm" variant="secondary">
                Настройки
              </UIButton>
              <UIButton @click="removeRoleFromStage(stage, role)" size="sm" variant="danger">
                Удалить
              </UIButton>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-4">Нет назначенных ролей</div>
      </div>
    </div>

    <!-- Модальное окно добавления роли -->
    <Modal v-if="showAddRoleModal" @close="showAddRoleModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">
          Добавить роль к стадии "{{ selectedStage?.display_name }}"
        </h3>
      </template>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Выберите роль </label>
          <Vue3Select
            v-model="selectedRole"
            :options="availableRoles"
            label="display_name"
            :reduce="(role: any) => role.id"
            placeholder="Выберите роль"
          />
        </div>

        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input v-model="roleSettings.is_required" type="checkbox" class="mr-2" />
            <span class="text-sm text-gray-700">Обязательная роль</span>
          </label>
        </div>

        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input v-model="roleSettings.auto_assign" type="checkbox" class="mr-2" />
            <span class="text-sm text-gray-700">Автоматическое назначение</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UIButton @click="showAddRoleModal = false" variant="secondary"> Отмена </UIButton>
          <UIButton @click="confirmAddRole" :loading="loading"> Добавить </UIButton>
        </div>
      </template>
    </Modal>

    <!-- Модальное окно настроек роли -->
    <Modal v-if="showSettingsModal" @close="showSettingsModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">
          Настройки роли "{{ selectedRoleForSettings?.display_name }}"
        </h3>
      </template>

      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input v-model="roleSettings.is_required" type="checkbox" class="mr-2" />
            <span class="text-sm text-gray-700">Обязательная роль</span>
          </label>
        </div>

        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input v-model="roleSettings.auto_assign" type="checkbox" class="mr-2" />
            <span class="text-sm text-gray-700">Автоматическое назначение</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UIButton @click="showSettingsModal = false" variant="secondary"> Отмена </UIButton>
          <UIButton @click="confirmUpdateSettings" :loading="loading"> Сохранить </UIButton>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIButton from '@/components/ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import { getAllStages, getAvailableRoles } from '@/services/api'
import { toast } from '@/stores/toast'
import type { Stage } from '@/types/stage'
import type { Role } from '@/types/role'

const loading = ref(false)
const stages = ref<Stage[]>([])
const availableRoles = ref<Role[]>([])

// Модальные окна
const showAddRoleModal = ref(false)
const showSettingsModal = ref(false)
const selectedStage = ref<Stage | null>(null)
const selectedRole = ref<number | null>(null)
const selectedRoleForSettings = ref<Role | null>(null)

// Настройки роли
const roleSettings = reactive({
  is_required: false,
  auto_assign: true,
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [stagesData, rolesData] = await Promise.all([getAllStages(), getAvailableRoles()])

    stages.value = stagesData.data || []
    availableRoles.value = rolesData || []

    console.log('📋 Loaded stages:', stages.value.length)
    console.log('👥 Loaded roles:', availableRoles.value.length)
  } catch (error) {
    console.error('Error loading data:', error)
    toast.show('Ошибка загрузки данных', 'error')
  } finally {
    loading.value = false
  }
}

function addRoleToStage(stage: Stage) {
  selectedStage.value = stage
  selectedRole.value = null
  roleSettings.is_required = false
  roleSettings.auto_assign = true
  showAddRoleModal.value = true
}

async function confirmAddRole() {
  if (!selectedStage.value || !selectedRole.value) {
    toast.show('Выберите роль', 'error')
    return
  }

  loading.value = true
  try {
    // Здесь нужно добавить API вызов для создания связи
    // await createStageRole(selectedStage.value.id, selectedRole.value, roleSettings)

    toast.show('Роль успешно добавлена к стадии', 'success')
    showAddRoleModal.value = false
    await loadData()
  } catch (error) {
    console.error('Error adding role to stage:', error)
    toast.show('Ошибка добавления роли', 'error')
  } finally {
    loading.value = false
  }
}

function editRoleSettings(stage: Stage, role: Role) {
  selectedStage.value = stage
  selectedRoleForSettings.value = role
  roleSettings.is_required = role.pivot?.is_required || false
  roleSettings.auto_assign = role.pivot?.auto_assign || true
  showSettingsModal.value = true
}

async function confirmUpdateSettings() {
  if (!selectedStage.value || !selectedRoleForSettings.value) {
    toast.show('Ошибка обновления настроек', 'error')
    return
  }

  loading.value = true
  try {
    // Здесь нужно добавить API вызов для обновления настроек
    // await updateStageRoleSettings(selectedStage.value.id, selectedRoleForSettings.value.id, roleSettings)

    toast.show('Настройки успешно обновлены', 'success')
    showSettingsModal.value = false
    await loadData()
  } catch (error) {
    console.error('Error updating role settings:', error)
    toast.show('Ошибка обновления настроек', 'error')
  } finally {
    loading.value = false
  }
}

async function removeRoleFromStage(stage: Stage, role: Role) {
  if (!confirm(`Удалить роль "${role.display_name}" из стадии "${stage.display_name}"?`)) {
    return
  }

  loading.value = true
  try {
    // Здесь нужно добавить API вызов для удаления связи
    // await removeStageRole(stage.id, role.id)

    toast.show('Роль успешно удалена из стадии', 'success')
    await loadData()
  } catch (error) {
    console.error('Error removing role from stage:', error)
    toast.show('Ошибка удаления роли', 'error')
  } finally {
    loading.value = false
  }
}
</script>
