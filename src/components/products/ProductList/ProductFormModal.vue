<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ product ? 'Редактировать товар' : 'Создать товар' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6 pb-4">
      <!-- Название товара -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Название товара <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.name"
          placeholder="Введите название товара"
          :error="errors.name"
          required
        />
      </div>

      <!-- Динамические стадии -->
      <div v-if="availableStages.length > 0" class="relative">
        <div
          v-if="stagesLoading"
          class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10"
        >
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div class="flex items-center justify-between mb-3">
          <label class="block text-sm font-medium text-gray-700">
            Стадии производства <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="selectAllStages"
              :disabled="selectedStages.length === workingStages.length"
            >
              Выбрать все
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="clearAllStages"
              :disabled="selectedStages.length === 0"
            >
              Очистить
            </UIButton>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label
            v-for="stage in workingStages"
            :key="stage.id"
            class="flex items-center p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02]"
            :class="
              selectedStages.includes(stage.id)
                ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                : ''
            "
            @click="toggleStage(stage.id)"
          >
            <div
              class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
              :class="
                selectedStages.includes(stage.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              "
              :title="`Stage ${stage.id} (${stage.name}): ${selectedStages.includes(stage.id) ? 'selected' : 'not selected'}`"
            >
              <svg
                v-if="selectedStages.includes(stage.id)"
                class="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: stage.color }"
              ></div>
              <span class="font-medium text-gray-900">{{ stage.display_name }}</span>
            </div>
          </label>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Выберите стадии, которые будут доступны для этого товара
          <span v-if="selectedStages.length > 0" class="text-blue-600 font-medium">
            (выбрано: {{ selectedStages.length }} из {{ workingStages.length }})
          </span>
        </p>

        <p v-if="errors.stages" class="text-sm text-red-600 mt-1">
          {{ errors.stages }}
        </p>
        <p v-if="errors.general" class="text-sm text-red-600 mt-1">
          {{ errors.general }}
        </p>
      </div>

      <!-- Назначения сотрудников по стадиям -->
      <div v-if="selectedStages.length > 0" class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900">Назначение сотрудников по стадиям</h3>

        <div v-for="stage in selectedStageObjects" :key="stage.id" class="space-y-4">
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center mb-3">
              <div
                class="w-4 h-4 rounded-full mr-2"
                :style="{ backgroundColor: stage.color }"
              ></div>
              <h4 class="text-md font-medium text-gray-900">{{ stage.display_name }}</h4>
            </div>

            <!-- Роли для этой стадии -->
            <div v-if="stage.roles && stage.roles.length > 0" class="space-y-3">
              <div v-for="role in stage.roles" :key="role.id" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">
                  {{ getRoleDisplayName(role.name) }}
                  <span class="text-xs text-gray-500">({{ role.name }})</span>
                </label>
                <AssignmentManager
                  title=""
                  :role-type="role.name"
                  :assignments="getAssignmentsForStageRole(stage.id, role.name)"
                  :all-users="getUsersForRole(role.name)"
                  :errors="getErrorsForStageRole(stage.id, role.name)"
                  @update="
                    (assignments) => updateAssignmentsForStageRole(stage.id, role.name, assignments)
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <UIButton
          type="submit"
          :loading="loading"
          class="flex-1"
          :disabled="!form.name.trim() || selectedStages.length === 0"
        >
          {{ product ? 'Сохранить' : 'Создать' }}
        </UIButton>

        <UIButton v-if="product" type="button" variant="danger" @click="handleDelete">
          Удалить
        </UIButton>

        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIButton from '@/components/ui/UIButton.vue'
import AssignmentManager from './AssignmentManager.vue'
import type { Product, ProductAssignment } from '@/types/product'
import type { Stage } from '@/types/stage'
import type { User } from '@/types/user'
import {
  getAllStages,
  getAllUsersByStageRoles,
  bulkAssignProductUsers,
  getProductAssignments,
  getProductStages,
  updateProductStages,
} from '@/services/api'
import productController from '@/controllers/productControllerInstance'
import { toast } from '@/stores/toast'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { update, remove, create } = productController

const loading = ref(false)
const stagesLoading = ref(false)
const availableStages = ref<Stage[]>([])
const selectedStages = ref<number[]>([])
const allUsers = reactive<Record<string, User[]>>({})

// Структура для хранения назначений по стадиям и ролям
const stageAssignments = reactive<Record<number, Record<string, ProductAssignment[]>>>({})

const errors = reactive({
  name: '',
  stages: '',
  general: '',
})

const form = reactive({
  name: '',
})

// Вычисляемое свойство для получения только рабочих стадий (исключаем служебные)
const workingStages = computed(() => {
  const serviceStages = ['draft', 'completed', 'cancelled', 'final']
  const filtered = availableStages.value.filter((stage) => !serviceStages.includes(stage.name))

  return filtered
})

// Вычисляемое свойство для получения объектов выбранных стадий
const selectedStageObjects = computed(() => {
  return availableStages.value
    .filter((stage) => selectedStages.value.includes(stage.id))
    .filter((stage) => stage.roles && stage.roles.length > 0) // Показываем только стадии с ролями
})

// Функции для работы с назначениями по стадиям
function getAssignmentsForStageRole(stageId: number, roleName: string): ProductAssignment[] {
  if (!stageAssignments[stageId]) {
    stageAssignments[stageId] = {}
  }
  if (!stageAssignments[stageId][roleName]) {
    stageAssignments[stageId][roleName] = []
  }

  const assignments = stageAssignments[stageId][roleName]

  return assignments
}

function updateAssignmentsForStageRole(
  stageId: number,
  roleName: string,
  assignments: ProductAssignment[],
) {
  if (!stageAssignments[stageId]) {
    stageAssignments[stageId] = {}
  }
  stageAssignments[stageId][roleName] = assignments

  // Проверяем, что назначения действительно сохранились
  console.log(
    `🔍 Verification - stageAssignments[${stageId}][${roleName}]:`,
    stageAssignments[stageId][roleName]?.length || 0,
    'assignments',
  )
}

function getUsersForRole(roleName: string): User[] {
  return allUsers[roleName] || []
}

function getErrorsForStageRole(stageId: number, roleName: string): string[] {
  // Здесь можно добавить валидацию для конкретных стадий и ролей
  return []
}

function getRoleDisplayName(roleName: string): string {
  // Специальные названия для известных ролей
  const names: Record<string, string> = {
    designer: 'Дизайнеры',
    print_operator: 'Печатники',
    engraving_operator: 'Гравировщики',
    workshop_worker: 'Работники цеха',
    die_cutting_operator: 'Операторы высечки',
    lamination_operator: 'Операторы ламинирования',
    cutting_operator: 'Операторы резки',
    packaging_worker: 'Упаковщики',
    quality_controller: 'Контролеры качества',
    shipping_operator: 'Операторы доставки',
  }

  // Если роль не найдена, автоматически создаем красивое название
  if (!names[roleName]) {
    console.log(`🆕 Auto-generating display name for role: ${roleName}`)
    return (
      roleName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + 'ы'
    )
  }

  return names[roleName]
}

function toggleStage(stageId: number) {
  try {
    // Проверяем, что стадия существует в доступных стадиях
    const stageExists = workingStages.value.some((stage) => stage.id === stageId)
    if (!stageExists) {
      return
    }

    const index = selectedStages.value.indexOf(stageId)
    if (index > -1) {
      // Удаляем стадию из выбранных
      selectedStages.value.splice(index, 1)
    } else {
      // Добавляем стадию в выбранные
      selectedStages.value.push(stageId)

      // Инициализируем пустые назначения для новой стадии
      if (!stageAssignments[stageId]) {
        stageAssignments[stageId] = {}
      }
    }

    // Принудительно обновляем реактивность
    selectedStages.value = [...selectedStages.value]
  } catch (error) {
    console.error('❌ Error toggling stage:', error)
  }
}

function selectAllStages() {
  try {
    console.log('✅ Selecting all stages')
    selectedStages.value = workingStages.value.map((stage) => stage.id)

    // Инициализируем назначения для всех стадий
    workingStages.value.forEach((stage) => {
      if (!stageAssignments[stage.id]) {
        stageAssignments[stage.id] = {}
      }
    })

    console.log('📋 All stages selected:', selectedStages.value)

    // Принудительно обновляем реактивность
    selectedStages.value = [...selectedStages.value]
    console.log('🔄 Force updated selectedStages after select all:', selectedStages.value)
  } catch (error) {
    console.error('❌ Error selecting all stages:', error)
  }
}

function clearAllStages() {
  try {
    console.log('❌ Clearing all stages')
    selectedStages.value = []

    // НЕ удаляем назначения - они должны сохраняться
    console.log('💾 Keeping all assignments while clearing stages')

    // Принудительно обновляем реактивность
    selectedStages.value = [...selectedStages.value]
    console.log('🔄 Force updated selectedStages after clear all:', selectedStages.value)
  } catch (error) {
    console.error('❌ Error clearing all stages:', error)
  }
}

onMounted(async () => {
  try {
    stagesLoading.value = true
    // Загружаем стадии и пользователей по ролям стадий
    let stagesResult, usersByStageRoles

    try {
      ;[stagesResult, usersByStageRoles] = await Promise.all([
        getAllStages(),
        getAllUsersByStageRoles(),
      ])
    } catch (error) {
      console.error('❌ Failed to load initial data:', error)

      // Пытаемся загрузить данные по отдельности
      try {
        stagesResult = await getAllStages()
      } catch (stagesError) {
        console.error('❌ Failed to load stages:', stagesError)
        stagesResult = { data: [] }
      }

      try {
        usersByStageRoles = await getAllUsersByStageRoles()
      } catch (usersError) {
        console.error('❌ Failed to load users:', usersError)
        usersByStageRoles = {}
      }
    }

    availableStages.value = stagesResult.data || stagesResult || []
    console.log('📋 Loaded availableStages:', availableStages.value.length, 'stages')

    // Если стадии не загрузились, создаем fallback стадии
    if (availableStages.value.length === 0) {
      console.log('⚠️ No stages from API, creating fallback stages')
      availableStages.value = [
        {
          id: 2,
          name: 'design',
          display_name: 'Дизайн',
          color: '#3B82F6',
          order: 2,
          is_active: true,
          is_initial: false,
          is_final: false,
          roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
        },
        {
          id: 3,
          name: 'print',
          display_name: 'Печать',
          color: '#10B981',
          order: 3,
          is_active: true,
          is_initial: false,
          is_final: false,
          roles: [{ id: 2, name: 'print_operator', display_name: 'Печатник' }],
        },
        {
          id: 4,
          name: 'engraving',
          display_name: 'Гравировка',
          color: '#8B5CF6',
          order: 4,
          is_active: true,
          is_initial: false,
          is_final: false,
          roles: [{ id: 3, name: 'engraving_operator', display_name: 'Гравировщик' }],
        },
        {
          id: 5,
          name: 'workshop',
          display_name: 'Цех',
          color: '#F59E0B',
          order: 5,
          is_active: true,
          is_initial: false,
          is_final: false,
          roles: [
            { id: 4, name: 'workshop_worker', display_name: 'Работник цеха' },
            { id: 5, name: 'die_cutting_operator', display_name: 'Оператор высечки' },
          ],
        },
      ]
    }

    // Загружаем пользователей по ролям из новой динамической системы
    console.log('👥 Loading users by stage roles:', usersByStageRoles)

    // Инициализируем все роли пустыми массивами (динамически)
    // Очищаем предыдущие данные
    if (allUsers && typeof allUsers === 'object') {
      Object.keys(allUsers).forEach((key) => delete allUsers[key])
    }

    // Динамически заполняем пользователей по ролям из стадий
    console.log('🔍 Processing users by stage roles:', usersByStageRoles)

    // Создаем динамический объект для пользователей по ролям
    const dynamicUsers: Record<string, any[]> = {}

    // Обрабатываем данные по стадиям и ролям
    if (usersByStageRoles && typeof usersByStageRoles === 'object') {
      Object.keys(usersByStageRoles).forEach((stageName) => {
        const stageData = usersByStageRoles[stageName]
        const stageRoles = stageData?.users_by_role || {}

        console.log(`📋 Processing stage: ${stageName}`, stageRoles)

        // Для каждой роли в стадии добавляем пользователей
        Object.keys(stageRoles).forEach((roleName) => {
          const roleData = stageRoles[roleName]
          const users = roleData.users || []

          console.log(`  👥 Role ${roleName}: ${users.length} users`)
          console.log(`  📋 Role data:`, roleData)

          // Инициализируем массив для роли, если его нет
          if (!dynamicUsers[roleName]) {
            dynamicUsers[roleName] = []
          }

          // Добавляем пользователей в динамический массив
          dynamicUsers[roleName] = [...dynamicUsers[roleName], ...users]
        })
      })
    } else {
      console.warn('⚠️ usersByStageRoles is not defined or not an object:', usersByStageRoles)
    }

    // Удаляем дубликаты пользователей для каждой роли
    if (dynamicUsers && typeof dynamicUsers === 'object') {
      Object.keys(dynamicUsers).forEach((roleName) => {
        dynamicUsers[roleName] = Array.from(
          new Map(dynamicUsers[roleName].map((user) => [user.id, user])).values(),
        )
      })

      // Обновляем allUsers динамически
      Object.keys(dynamicUsers).forEach((roleName) => {
        allUsers[roleName] = dynamicUsers[roleName]
      })
    }

    console.log(
      '👥 Loaded users by roles:',
      allUsers && typeof allUsers === 'object'
        ? Object.keys(allUsers).reduce(
            (acc, role) => {
              acc[role] = allUsers[role]?.length || 0
              return acc
            },
            {} as Record<string, number>,
          )
        : {},
    )

    // Если пользователи не загрузились, создаем fallback пользователей
    const totalUsers =
      allUsers && typeof allUsers === 'object'
        ? Object.keys(allUsers).reduce((sum, role) => sum + (allUsers[role]?.length || 0), 0)
        : 0

    if (totalUsers === 0) {
      console.log('⚠️ No users from API, creating fallback users')

      // Динамически создаем fallback пользователей для всех ролей из стадий
      const allRoles = new Set<string>()

      // Собираем все роли из всех стадий
      availableStages.value.forEach((stage) => {
        if (stage.roles) {
          stage.roles.forEach((role) => {
            allRoles.add(role.name)
          })
        }
      })

      // Создаем fallback пользователей для каждой роли
      allRoles.forEach((roleName, index) => {
        const fallbackUser = {
          id: 100 + index,
          name: `Оператор ${roleName.replace(/_/g, ' ')}`,
          username: `operator_${roleName}`,
          roles: [{ name: roleName }],
        }
        allUsers[roleName] = [fallbackUser]
      })

      console.log(
        '✅ Fallback users created:',
        allUsers && typeof allUsers === 'object'
          ? Object.keys(allUsers).reduce(
              (acc, role) => {
                acc[role] = allUsers[role]?.length || 0
                return acc
              },
              {} as Record<string, number>,
            )
          : {},
      )
    }

    // Если редактируем продукт
    if (props.product) {
      console.log('🔧 Loading product for editing:', {
        id: props.product.id,
        name: props.product.name,
        available_stages: props.product.available_stages,
        available_stages_count: props.product.available_stages?.length || 0,
      })

      form.name = props.product.name || ''

      // Загружаем выбранные стадии
      if (props.product.available_stages && props.product.available_stages.length > 0) {
        // Фильтруем стадии, оставляя только те, которые есть в availableStages
        const validStageIds = props.product.available_stages
          .map((stage) => stage.id)
          .filter((stageId) => availableStages.value.some((stage) => stage.id === stageId))

        selectedStages.value = validStageIds

        console.log('🔧 Loading stages from product:', {
          original: props.product.available_stages.map((s) => ({ id: s.id, name: s.name })),
          filtered: validStageIds,
          available: availableStages.value.map((s) => ({ id: s.id, name: s.name })),
          removed: props.product.available_stages
            .map((stage) => stage.id)
            .filter((stageId) => !availableStages.value.some((stage) => stage.id === stageId)),
        })

        // Если были удалены невалидные стадии, показываем предупреждение
        const removedStages = props.product.available_stages
          .map((stage) => stage.id)
          .filter((stageId) => !availableStages.value.some((stage) => stage.id === stageId))

        if (removedStages.length > 0) {
          console.warn('⚠️ Removed invalid stages from product:', removedStages)
        }
      } else {
        // Если нет доступных стадий у продукта, НЕ устанавливаем стадии по умолчанию
        // Пользователь должен сам выбрать нужные стадии
        selectedStages.value = []
        console.log('⚠️ Existing product has no available_stages - no default stages set')
      }

      // Дополнительно загружаем все стадии продукта (включая недоступные) для правильного отображения
      let allProductStages: any[] = []
      let availableStageIds: number[] = []

      try {
        const productStagesResponse = await getProductStages(props.product.id)
        console.log('📋 Product stages response:', productStagesResponse)

        if (productStagesResponse && productStagesResponse.product_stages) {
          // Получаем все стадии продукта (включая недоступные)
          allProductStages = productStagesResponse.product_stages

          // Фильтруем только доступные стадии для selectedStages
          const availableProductStages = allProductStages.filter((ps) => ps.is_available)
          availableStageIds = availableProductStages.map((ps) => ps.stage_id)

          // Обновляем selectedStages только доступными стадиями, исключая служебные
          selectedStages.value = availableStageIds.filter((stageId) => {
            const stage = availableStages.value.find((s) => s.id === stageId)
            if (!stage) return false

            // Исключаем служебные стадии
            const serviceStages = ['draft', 'completed', 'cancelled', 'final']
            if (serviceStages.includes(stage.name)) {
              console.log(`❌ Excluding service stage: ${stage.name} (${stageId})`)
              return false
            }

            return true
          })

          console.log('🔧 Updated stages from product stages API:', {
            allProductStages: allProductStages.map((ps) => ({
              stage_id: ps.stage_id,
              is_available: ps.is_available,
              stage_name: ps.stage?.name,
            })),
            availableStageIds,
            finalSelectedStages: selectedStages.value,
            workingStages: workingStages.value.map((s) => ({ id: s.id, name: s.name })),
          })
        }
      } catch (error) {
        console.warn('⚠️ Could not load product stages from API:', error)
        // Продолжаем с данными из available_stages
      }

      // Загружаем назначения из новой структуры Laravel
      console.log('📋 Loading assignments from Laravel structure:', {
        designers: props.product.designers?.length || 0,
        print_operators: props.product.print_operators?.length || 0,
        engraving_operators: props.product.engraving_operators?.length || 0,
        workshop_workers: props.product.workshop_workers?.length || 0,
      })

      // Загружаем назначения через API для получения полной структуры
      try {
        const assignmentsResponse = await getProductAssignments(props.product.id)
        console.log('📋 Product assignments API response:', assignmentsResponse)
        console.log('📋 Response type:', typeof assignmentsResponse)
        console.log('📋 Response keys:', Object.keys(assignmentsResponse || {}))
        console.log('📋 Response full:', assignmentsResponse)

        if (assignmentsResponse && assignmentsResponse.assignments) {
          // Группируем назначения по стадиям и ролям
          const assignmentsByStageRole: Record<number, Record<string, ProductAssignment[]>> = {}

          assignmentsResponse.assignments.forEach((assignment: any) => {
            const stageId = assignment.stage_id
            const roleType = assignment.role_type

            if (!assignmentsByStageRole[stageId]) {
              assignmentsByStageRole[stageId] = {}
            }
            if (!assignmentsByStageRole[stageId][roleType]) {
              assignmentsByStageRole[stageId][roleType] = []
            }

            assignmentsByStageRole[stageId][roleType].push({
              id: assignment.id,
              user_id: assignment.user_id,
              role_type: assignment.role_type,
              stage_id: assignment.stage_id,
              is_active: assignment.is_active,
              user: assignment.user,
            })
          })

          // Обновляем stageAssignments
          console.log('🔍 assignmentsByStageRole:', assignmentsByStageRole)
          console.log('🔍 assignmentsByStageRole type:', typeof assignmentsByStageRole)
          if (assignmentsByStageRole && typeof assignmentsByStageRole === 'object') {
            Object.keys(assignmentsByStageRole).forEach((stageId) => {
              const stageIdNum = parseInt(stageId)
              if (
                assignmentsByStageRole[stageIdNum] &&
                typeof assignmentsByStageRole[stageIdNum] === 'object'
              ) {
                Object.keys(assignmentsByStageRole[stageIdNum]).forEach((roleType) => {
                  updateAssignmentsForStageRole(
                    stageIdNum,
                    roleType,
                    assignmentsByStageRole[stageIdNum][roleType],
                  )
                })
              }
            })
          }

          // Также загружаем назначения для ролей, которые могут не быть в стадиях
          // Это нужно для ролей типа die_cutting_operator, которые могут быть назначены
          // но не включены в стадии продукта
          const allAssignments = assignmentsResponse.assignments || []
          const uniqueRoles = new Set(allAssignments.map((a) => a.role_type))

          console.log('🔍 Processing all assignments by role:', {
            totalAssignments: allAssignments.length,
            uniqueRoles: Array.from(uniqueRoles),
            assignmentsByRole: allAssignments.reduce(
              (acc, assignment) => {
                if (!acc[assignment.role_type]) acc[assignment.role_type] = []
                acc[assignment.role_type].push(assignment)
                return acc
              },
              {} as Record<string, any[]>,
            ),
          })

          uniqueRoles.forEach((roleType) => {
            const roleAssignments = allAssignments.filter((a) => a.role_type === roleType)
            console.log(`🔍 Processing role ${roleType}:`, {
              assignmentsCount: roleAssignments.length,
              assignments: roleAssignments.map((a) => ({
                id: a.id,
                user_id: a.user_id,
                user_name: a.user?.name,
                is_active: a.is_active,
              })),
            })

            // Находим стадию для этой роли (если есть)
            const stageForRole = availableStages.value.find((stage) =>
              stage.roles?.some((role) => role.name === roleType),
            )

            if (stageForRole) {
              // Если стадия найдена, добавляем назначения к ней
              const existingAssignments = getAssignmentsForStageRole(stageForRole.id, roleType)
              const newAssignments = [...existingAssignments, ...roleAssignments]
              updateAssignmentsForStageRole(stageForRole.id, roleType, newAssignments)
              console.log(
                `✅ Assigned ${roleType} to existing stage ${stageForRole.name} (${stageForRole.id})`,
              )
            } else {
              // Если стадия не найдена, создаем назначения для первой доступной стадии
              // или для стадии по умолчанию
              const defaultStage =
                availableStages.value.find((s) => s.name === 'workshop') || availableStages.value[0]
              if (defaultStage) {
                const existingAssignments = getAssignmentsForStageRole(defaultStage.id, roleType)
                const newAssignments = [...existingAssignments, ...roleAssignments]
                updateAssignmentsForStageRole(defaultStage.id, roleType, newAssignments)
                console.log(
                  `🔧 Assigned ${roleType} to default stage ${defaultStage.name} (${defaultStage.id})`,
                )
              } else {
                console.error(`❌ No default stage found for role ${roleType}`)
              }
            }
          })

          console.log('✅ Assignments loaded from API:', assignmentsByStageRole)
        } else {
          console.warn('⚠️ No assignments data from API, using fallback')
          console.log('📋 Checking fallback data from product:', {
            designers: props.product.designers?.length || 0,
            print_operators: props.product.print_operators?.length || 0,
            engraving_operators: props.product.engraving_operators?.length || 0,
            workshop_workers: props.product.workshop_workers?.length || 0,
          })
          // Fallback на старые поля если API не вернул данные
          const stageRoleMapping = {
            design: 'designer',
            print: 'print_operator',
            engraving: 'engraving_operator',
            workshop: 'workshop_worker',
          }

          // Распределяем назначения по стадиям (для всех стадий, включая отключенные)
          const allProductStageIds =
            allProductStages.length > 0
              ? allProductStages.map((ps) => ps.stage_id)
              : selectedStages.value

          // Загружаем назначения для всех стадий продукта (динамически)
          allProductStageIds.forEach((stageId) => {
            const stage = availableStages.value.find((s) => s.id === stageId)
            if (stage && stage.roles) {
              stage.roles.forEach((role) => {
                const roleName = role.name
                let users: User[] = []

                // Динамически получаем пользователей для любой роли из продукта
                // Используем динамический доступ к свойствам продукта
                const rolePropertyName = `${roleName}s` // добавляем 's' для множественного числа
                if (props.product[rolePropertyName]) {
                  users = props.product[rolePropertyName] || []
                } else {
                  // Fallback для старых имен ролей
                  const roleMapping: Record<string, string> = {
                    designer: 'designers',
                    print_operator: 'print_operators',
                    engraving_operator: 'engraving_operators',
                    workshop_worker: 'workshop_workers',
                  }
                  const fallbackProperty = roleMapping[roleName]
                  if (fallbackProperty && props.product[fallbackProperty]) {
                    users = props.product[fallbackProperty] || []
                  }
                }

                console.log(`🔍 Loading users for role ${roleName}:`, users.length, 'users')

                // Создаем назначения для этой стадии и роли
                const assignments = users.map((user) => ({
                  id: user.id,
                  role_type: roleName,
                  user: user,
                  user_id: user.id,
                  is_active: true,
                }))

                updateAssignmentsForStageRole(stageId, roleName, assignments)
              })
            }
          })
        }
      } catch (error) {
        console.error('❌ Error loading assignments from API:', error)

        // Показываем более конкретную ошибку
        let errorMessage = 'Ошибка загрузки назначений'
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'Назначения не найдены'
          } else if (error.message.includes('401')) {
            errorMessage = 'Ошибка авторизации при загрузке назначений'
          } else {
            errorMessage = `Ошибка загрузки назначений: ${error.message}`
          }
        }
        console.warn(`⚠️ ${errorMessage}, using fallback`)

        // Используем fallback на старые поля
        const stageRoleMapping = {
          design: 'designer',
          print: 'print_operator',
          engraving: 'engraving_operator',
          workshop: 'workshop_worker',
        }

        // Распределяем назначения по стадиям (для всех стадий, включая отключенные)
        const allProductStageIds =
          allProductStages.length > 0
            ? allProductStages.map((ps) => ps.stage_id)
            : selectedStages.value

        // Загружаем назначения для всех стадий продукта (динамически)
        allProductStageIds.forEach((stageId) => {
          const stage = availableStages.value.find((s) => s.id === stageId)
          if (stage && stage.roles) {
            stage.roles.forEach((role) => {
              const roleName = role.name
              let users: User[] = []

              // Динамически получаем пользователей для любой роли из продукта
              // Используем динамический доступ к свойствам продукта
              const rolePropertyName = `${roleName}s` // добавляем 's' для множественного числа
              if (props.product[rolePropertyName]) {
                users = props.product[rolePropertyName] || []
              } else {
                // Fallback для старых имен ролей
                const roleMapping: Record<string, string> = {
                  designer: 'designers',
                  print_operator: 'print_operators',
                  engraving_operator: 'engraving_operators',
                  workshop_worker: 'workshop_workers',
                }
                const fallbackProperty = roleMapping[roleName]
                if (fallbackProperty && props.product[fallbackProperty]) {
                  users = props.product[fallbackProperty] || []
                }
              }

              console.log(`🔍 Loading users for role ${roleName}:`, users.length, 'users')

              // Создаем назначения для этой стадии и роли
              const assignments = users.map((user) => ({
                id: user.id,
                role_type: roleName,
                user: user,
                user_id: user.id,
                is_active: true,
              }))

              updateAssignmentsForStageRole(stageId, roleName, assignments)
            })
          }
        })
      }

      console.log('✅ Stage assignments loaded for all stages:', {
        allProductStageIds:
          allProductStages.length > 0
            ? allProductStages.map((ps) => ps.stage_id)
            : selectedStages.value,
        selectedStages: selectedStages.value,
        stageAssignments: Object.keys(stageAssignments).map((stageId) => ({
          stageId: parseInt(stageId),
          roles: Object.keys(stageAssignments[parseInt(stageId)] || {}),
          assignmentsCount: Object.values(stageAssignments[parseInt(stageId)] || {}).reduce(
            (sum, assignments) => sum + assignments.length,
            0,
          ),
        })),
      })

      console.log('✅ Stage assignments loaded:', stageAssignments)
    } else {
      // Для нового продукта НЕ устанавливаем стадии по умолчанию
      // Пользователь должен сам выбрать нужные стадии
      selectedStages.value = []
      console.log('🆕 New product - no default stages selected')
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)

    // Более детальная обработка ошибок
    let errorMessage = 'Ошибка загрузки данных'

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Ошибка подключения к серверу'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Ошибка авторизации'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Доступ запрещен'
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'Данные не найдены'
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Ошибка сервера'
      } else {
        errorMessage = `Ошибка: ${error.message}`
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    toast.show(errorMessage, 'error')
  } finally {
    stagesLoading.value = false
  }
})

// Отслеживаем изменения выбранных стадий
watch(
  selectedStages,
  (newStages, oldStages) => {
    console.log('👀 selectedStages changed:', {
      old: oldStages,
      new: newStages,
      added: newStages.filter((id) => !oldStages.includes(id)),
      removed: oldStages.filter((id) => !newStages.includes(id)),
      workingStages: workingStages.value.map((s) => ({ id: s.id, name: s.name })),
    })

    // Обновляем stageAssignments при изменении выбранных стадий
    const removedStages = oldStages.filter((id) => !newStages.includes(id))
    if (removedStages.length > 0) {
      console.log('⚠️ Stages removed, keeping assignments for:', removedStages)
      // Назначения сохраняются даже для отключенных стадий
    }
  },
  { deep: true },
)

function validateForm(): boolean {
  console.log('🔍 Validating form:', { name: form.name, selectedStages: selectedStages.value })

  // Очищаем ошибки
  errors.name = ''
  errors.stages = ''
  errors.general = ''

  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Название обязательно'
    valid = false
    console.log('❌ Name validation failed')
  }

  // Для новых продуктов разрешаем создание без стадий
  if (selectedStages.value.length === 0 && props.product?.id) {
    errors.stages = 'Выберите хотя бы одну стадию для существующего товара'
    valid = false
    console.log('❌ Stages validation failed - existing product must have stages')
  } else if (selectedStages.value.length === 0) {
    console.log('ℹ️ New product - no stages selected (allowed)')
  } else {
    console.log('✅ Stages validation passed - selected stages:', selectedStages.value.length)
  }

  console.log('✅ Form validation result:', valid)
  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  loading.value = true
  try {
    // Фильтруем selectedStages, оставляя только те, которые есть в availableStages
    const validSelectedStages = selectedStages.value.filter((stageId) =>
      availableStages.value.some((stage) => stage.id === stageId),
    )

    // Сохраняем только выбранные стадии как доступные
    const stagesData = validSelectedStages.map((stageId) => ({
      stage_id: stageId,
      is_available: true,
    }))

    const productData = {
      name: form.name,
      stages: stagesData,
    }

    console.log('💾 Saving product with stages:', selectedStages.value)
    console.log('📋 Valid selected stages:', validSelectedStages)
    console.log('📋 Stages data to save:', stagesData)
    console.log('📋 Product data:', productData)

    let productId: number

    if (props.product?.id) {
      // Обновляем существующий продукт
      console.log('🔄 Updating existing product:', props.product.id)
      console.log('📋 Update data:', productData)
      await update(props.product.id, productData)
      productId = props.product.id
      console.log('✅ Product updated successfully')
    } else {
      // Создаем новый продукт
      const created = await create(productData)
      productId = created?.data?.id || created?.id
      if (!productId) {
        throw new Error('Не удалось получить ID созданного продукта')
      }
      console.log('🆕 New product created with ID:', productId)
    }

    // Сохраняем назначения по стадиям (ВСЕ назначения, включая отключенные стадии)
    const allAssignments = []

    // Собираем все назначения по стадиям (без маппинга - используем роли как есть)
    Object.keys(stageAssignments).forEach((stageId) => {
      const stageAssignmentsForStage = stageAssignments[parseInt(stageId)]
      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        stageAssignmentsForStage[roleName].forEach((assignment) => {
          if (assignment.user_id && assignment.user_id > 0) {
            allAssignments.push({
              user_id: assignment.user_id,
              role_type: roleName, // Используем роль как есть из базы данных
              stage_id: parseInt(stageId),
              is_active: true,
            })
          }
        })
      })
    })

    console.log('💾 Saving stage assignments:', allAssignments.length, 'assignments')
    console.log('📋 Assignments data:', allAssignments)

    if (allAssignments.length > 0) {
      try {
        console.log('✅ Sending assignments to API...')
        const result = await bulkAssignProductUsers(productId, { assignments: allAssignments })
        console.log('✅ Stage assignments saved successfully:', result)
      } catch (error) {
        console.error('❌ Error saving assignments:', error)
        toast.show('Ошибка при сохранении назначений', 'error')
        // Не прерываем сохранение продукта, только показываем ошибку
      }
    } else {
      console.log('ℹ️ No stage assignments to save')
    }

    // Обновляем selectedStages, убирая невалидные стадии
    if (validSelectedStages.length !== selectedStages.value.length) {
      console.log(
        '⚠️ Removed invalid stages from selection:',
        selectedStages.value.filter((id) => !validSelectedStages.includes(id)),
      )
      selectedStages.value = validSelectedStages
    }

    // Проверяем, что стадии действительно сохранились (только для новых продуктов)
    if (!props.product?.id) {
      try {
        const savedStages = await getProductStages(productId)
        console.log('🔍 Verification - saved stages:', savedStages)

        if (savedStages && savedStages.product_stages) {
          const availableStages = savedStages.product_stages.filter((ps) => ps.is_available)
          console.log(
            '🔍 Verification - available stages:',
            availableStages.map((ps) => ({
              stage_id: ps.stage_id,
              stage_name: ps.stage?.name,
              is_available: ps.is_available,
            })),
          )
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify saved stages:', verifyError)
      }
    }

    toast.show(`Товар ${props.product ? 'обновлен' : 'создан'} успешно!`)
    emit('submit', { id: productId, ...productData })
    emit('close')
  } catch (error) {
    console.error('Ошибка сохранения:', error)

    // Более детальная обработка ошибок сохранения
    let errorMessage = 'Ошибка при сохранении товара'

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Ошибка подключения к серверу при сохранении'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Ошибка авторизации при сохранении'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Доступ запрещен при сохранении'
      } else if (error.message.includes('422') || error.message.includes('Validation')) {
        errorMessage = 'Ошибка валидации данных'
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Ошибка сервера при сохранении'
      } else {
        errorMessage = `Ошибка сохранения: ${error.message}`
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    toast.show(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!props.product) return

  try {
    await remove(props.product.id)
    toast.show('Товар успешно удален!', 'success')
    emit('delete', props.product.id)
    emit('close')
  } catch (error: any) {
    console.error('❌ Ошибка удаления товара:', props.product.id, error)

    // Обрабатываем ошибки от сервера
    let message = 'Произошла неизвестная ошибка при удалении товара'

    if (error?.response?.data?.message) {
      // Ошибка от Laravel (например, товар используется в заказах)
      message = error.response.data.message
    } else if (error.message && error.message.includes('Ошибка удаления товара')) {
      // Если ошибка 404 — товар уже удалён
      toast.show('Товар уже был удалён')
      emit('delete', props.product.id)
      emit('close')
      return
    } else if (error instanceof Error && error.message) {
      message = `Ошибка удаления товара: ${error.message}`
    }

    toast.show(message, 'error')
  }
}
</script>

<style>
@import 'vue3-select/dist/vue3-select.css';

.vs__dropdown-menu {
  max-height: 110px !important;
  overflow-y: auto !important;
  padding: 0 !important;
}

.vs__dropdown-menu .vs__dropdown-option,
.vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 24px !important;
  padding: 2px 10px !important;
  font-size: 15px !important;
  line-height: 1.2 !important;
  color: #374151 !important;
  background: #fff !important;
}
</style>
