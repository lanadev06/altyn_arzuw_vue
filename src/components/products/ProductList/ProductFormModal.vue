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

      <!-- Категории -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Категории
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label
            v-for="category in availableCategories"
            :key="category.id"
            class="flex items-center p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02]"
            :class="
              selectedCategories.includes(category.id)
                ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                : ''
            "
            @click="toggleCategory(category.id)"
          >
            <div
              class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
              :class="
                selectedCategories.includes(category.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              "
            >
              <svg
                v-if="selectedCategories.includes(category.id)"
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
            <span class="font-medium text-gray-900">{{ category.name }}</span>
          </label>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Выберите категории для этого товара
          <span v-if="selectedCategories.length > 0" class="text-blue-600 font-medium">
            (выбрано: {{ selectedCategories.length }})
          </span>
        </p>
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
                :style="{ backgroundColor: stage.color || '#6b7280' }"
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
                :style="{ backgroundColor: stage.color || '#6b7280' }"
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

        <UIButton v-if="product && canDelete()" type="button" variant="danger" @click="handleDelete">
          Удалить
        </UIButton>

        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import AssignmentManager from './AssignmentManager.vue'
import type { Product, ProductAssignment, ProductForm } from '../../../types/product'
import type { Stage } from '../../../types/stage'
import type { User } from '../../../types/user'
import type { Category } from '../../../types/category'
import {
  getAllStages,
  getAllUsersByStageRoles,
  bulkAssignProductUsers,
  getProductAssignments,
  getProductStages,
  updateProductStages,
  getUsersByRole,
  getByRole,
  getAllCategories,
} from '../../../services/api'
import productController from '../../../controllers/productControllerInstance'
import { toast } from '../../../stores/toast'
import { canDelete } from '../../../utils/permissions'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits(['close', 'submit', 'delete', 'saved'])

const { update, remove, create } = productController

const loading = ref(false)
const stagesLoading = ref(false)
const availableStages = ref<Stage[]>([])
const selectedStages = ref<number[]>([])
const allUsers = reactive<Record<string, User[]>>({})

// Категории
const availableCategories = ref<Category[]>([])
const selectedCategories = ref<number[]>([])

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

// Отслеживаем изменения формы
watch(
  () => form.name,
  (newName) => {},
)

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
function initStageRole(stageId: number, roleName: string) {
  if (!stageAssignments[stageId]) {
    stageAssignments[stageId] = {}
  }
  if (!stageAssignments[stageId][roleName]) {
    stageAssignments[stageId][roleName] = []
  }
}

function getAssignmentsForStageRole(stageId: number, roleName: string): ProductAssignment[] {
  initStageRole(stageId, roleName)
  return stageAssignments[stageId][roleName]
}

function updateAssignmentsForStageRole(
  stageId: number,
  roleName: string,
  assignments: ProductAssignment[],
) {
  // Проверяем, что роль является валидной
  const stage = availableStages.value.find((s) => s.id === stageId)
  if (stage && stage.roles) {
    const validRoleNames = stage.roles.map((r) => r.name)
    if (!validRoleNames.includes(roleName)) {
      return
    }
  }

  initStageRole(stageId, roleName)
  stageAssignments[stageId][roleName] = assignments
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

    // Инициализируем пустые назначения для всех ролей стадии
    const stage = availableStages.value.find((s) => s.id === stageId)
    if (stage && stage.roles) {
      stage.roles.forEach((role) => {
        initStageRole(stageId, role.name)
      })
    }
  }
}

function selectAllStages() {
  // Проверяем, что workingStages.value является массивом
  if (!Array.isArray(workingStages.value)) {
    return
  }

  selectedStages.value = workingStages.value.map((stage) => stage.id)

  // Инициализируем назначения для всех стадий и ролей
  workingStages.value.forEach((stage) => {
    if (stage.roles) {
      stage.roles.forEach((role) => {
        initStageRole(stage.id, role.name)
      })
    }
  })
}

function clearAllStages() {
  selectedStages.value = []
  // НЕ удаляем назначения - они должны сохраняться
}

// Функции для работы с категориями
function toggleCategory(categoryId: number) {
  const index = selectedCategories.value.indexOf(categoryId)
  
  if (index > -1) {
    // Удаляем категорию из выбранных
    selectedCategories.value.splice(index, 1)
  } else {
    // Добавляем категорию в выбранные
    selectedCategories.value.push(categoryId)
  }
}

onMounted(async () => {
  try {
    stagesLoading.value = true

    // Сначала загружаем стадии, чтобы получить список ролей (с кэшированием)
    let stagesResult
    try {
      stagesResult = await getAllStages()
    } catch (error) {
      stagesResult = { data: [] }
    }

    // Получаем все роли из стадий
    const allRoles = new Set<string>()
    if (stagesResult && Array.isArray(stagesResult)) {
      stagesResult.forEach((stage) => {
        if (stage.roles) {
          stage.roles.forEach((role: any) => {
            allRoles.add(role.name)
          })
        }
      })
    } else if (stagesResult && stagesResult.data && Array.isArray(stagesResult.data)) {
      stagesResult.data.forEach((stage: any) => {
        if (stage.roles) {
          stage.roles.forEach((role: any) => {
            allRoles.add(role.name)
          })
        }
      })
    }

    // Загружаем пользователей по ролям стадий и альтернативные источники
    let usersByStageRoles, roleUsersData
    try {
      // Загружаем пользователей по ролям стадий (с кэшированием)
      const stageRolesResult = await getAllUsersByStageRoles()

      const roleUsersPromises = Array.from(allRoles).map(async (roleName) => {
        try {
          const result = await getUsersByRole(roleName)
          return result
        } catch (error) {
          // Пробуем альтернативный метод
          try {
            const result = await getByRole(roleName)
            return result
          } catch (error2) {
            return { data: [], roleName }
          }
        }
      })

      roleUsersData = await Promise.all(roleUsersPromises)
      usersByStageRoles = stageRolesResult
    } catch (error) {
      usersByStageRoles = {}
      roleUsersData = []
    }

    availableStages.value = stagesResult.data || stagesResult || []

    // Загружаем категории
    try {
      const categoriesResult = await getAllCategories()
      availableCategories.value = categoriesResult || []
    } catch (error) {
      availableCategories.value = []
    }

    // Если стадии не загрузились, создаем fallback стадии
    if (availableStages.value.length === 0) {
      availableStages.value = [
        {
          id: 2,
          name: 'design',
          display_name: 'Дизайн',
          description: undefined,
          color: '#3B82F6',
          order: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [
            {
              id: 1,
              name: 'designer',
              display_name: 'Дизайнер',
              description: undefined,
              color: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 3,
          name: 'print',
          display_name: 'Печать',
          description: undefined,
          color: '#10B981',
          order: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [
            {
              id: 2,
              name: 'print_operator',
              display_name: 'Печатник',
              description: undefined,
              color: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 4,
          name: 'engraving',
          display_name: 'Гравировка',
          description: undefined,
          color: '#8B5CF6',
          order: 4,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [
            {
              id: 3,
              name: 'engraving_operator',
              display_name: 'Гравировщик',
              description: undefined,
              color: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 5,
          name: 'workshop',
          display_name: 'Цех',
          description: undefined,
          color: '#F59E0B',
          order: 5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [
            {
              id: 4,
              name: 'workshop_worker',
              display_name: 'Работник цеха',
              description: undefined,
              color: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
      ]
    }

    // Загружаем пользователей по ролям из новой динамической системы

    // Инициализируем все роли пустыми массивами (динамически)
    // Очищаем предыдущие данные
    if (allUsers && typeof allUsers === 'object') {
      Object.keys(allUsers).forEach((key) => delete allUsers[key])
    }

    // Динамически заполняем пользователей по ролям из стадий

    // Создаем динамический объект для пользователей по ролям
    const dynamicUsers: Record<string, any[]> = {}

    // Обрабатываем данные по стадиям и ролям
    if (usersByStageRoles && typeof usersByStageRoles === 'object') {
      // Проверяем разные возможные форматы данных
      if (Array.isArray(usersByStageRoles)) {
        // Если API возвращает массив пользователей

        // Получаем все роли из стадий
        const allRoles = new Set<string>()
        availableStages.value.forEach((stage) => {
          if (stage.roles) {
            stage.roles.forEach((role) => {
              allRoles.add(role.name)
            })
          }
        })

        // Распределяем пользователей по ролям
        usersByStageRoles.forEach((user: any) => {
          if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach((role: any) => {
              const roleName = role.name || role
              if (allRoles.has(roleName)) {
                if (!dynamicUsers[roleName]) {
                  dynamicUsers[roleName] = []
                }
                const existingUser = dynamicUsers[roleName].find((u) => u.id === user.id)
                if (!existingUser) {
                  dynamicUsers[roleName].push(user)
                }
              }
            })
          }
        })
      } else {
        // Если API возвращает объект с пользователями по стадиям
        Object.keys(usersByStageRoles).forEach((stageName) => {
          const stageData = usersByStageRoles[stageName]

          if (Array.isArray(stageData)) {
            // Если стадия содержит массив пользователей

            stageData.forEach((user: any) => {
              if (user.roles && Array.isArray(user.roles)) {
                user.roles.forEach((role: any) => {
                  const roleName = role.name || role
                  if (!dynamicUsers[roleName]) {
                    dynamicUsers[roleName] = []
                  }
                  const existingUser = dynamicUsers[roleName].find((u) => u.id === user.id)
                  if (!existingUser) {
                    dynamicUsers[roleName].push(user)
                  }
                })
              }
            })
          } else if (stageData && typeof stageData === 'object') {
            // Если стадия содержит объект с ролями
            const stageRoles = stageData.users_by_role || stageData.roles || {}

            Object.keys(stageRoles).forEach((roleName) => {
              const roleData = stageRoles[roleName]
              const users = roleData.users || roleData || []

              if (!dynamicUsers[roleName]) {
                dynamicUsers[roleName] = []
              }

              if (Array.isArray(users)) {
                users.forEach((user) => {
                  const existingUser = dynamicUsers[roleName].find((u) => u.id === user.id)
                  if (!existingUser) {
                    dynamicUsers[roleName].push(user)
                  }
                })
              }
            })
          }
        })
      }
    } else {
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

    // Если сотрудники не загрузились, создаем fallback сотрудников
    const totalUsers =
      allUsers && typeof allUsers === 'object'
        ? Object.keys(allUsers).reduce((sum, role) => sum + (allUsers[role]?.length || 0), 0)
        : 0

    if (totalUsers === 0) {
      // Пробуем загрузить пользователей из альтернативных источников
      const alternativeUsers: Record<string, any[]> = {}

      // Обрабатываем данные пользователей по ролям из roleUsersData
      roleUsersData.forEach((userData, index) => {
        const roleName = Array.from(allRoles)[index]

        if (userData && userData.data && Array.isArray(userData.data)) {
          alternativeUsers[roleName] = userData.data
        } else if (userData && Array.isArray(userData)) {
          // Если данные приходят напрямую как массив
          alternativeUsers[roleName] = userData
        } else {
        }
      })

      // Если альтернативные источники не дали результатов, создаем fallback пользователей
      const alternativeTotalUsers = Object.keys(alternativeUsers).reduce(
        (sum, role) => sum + (alternativeUsers[role]?.length || 0),
        0,
      )

      if (alternativeTotalUsers === 0) {
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
        Array.from(allRoles).forEach((roleName, index) => {
          // Создаем несколько тестовых пользователей для каждой роли
          const fallbackUsers = [
            {
              id: 100 + index * 3,
              name: `Оператор ${roleName.replace(/_/g, ' ')}`,
              username: `operator_${roleName}`,
              email: `operator_${roleName}@example.com`,
              roles: [{ name: roleName }],
            },
            {
              id: 101 + index * 3,
              name: `Специалист ${roleName.replace(/_/g, ' ')}`,
              username: `specialist_${roleName}`,
              email: `specialist_${roleName}@example.com`,
              roles: [{ name: roleName }],
            },
            {
              id: 102 + index * 3,
              name: `Мастер ${roleName.replace(/_/g, ' ')}`,
              username: `master_${roleName}`,
              email: `master_${roleName}@example.com`,
              roles: [{ name: roleName }],
            },
          ]
          allUsers[roleName] = fallbackUsers as unknown as User[]
        })
      } else {
        // Используем альтернативные данные
        Object.keys(alternativeUsers).forEach((roleName) => {
          allUsers[roleName] = alternativeUsers[roleName]
        })
      }
    }

    // Если редактируем продукт
    if (props.product) {
      form.name = props.product.name || ''

      // Загружаем категории продукта
      if (props.product.categories && props.product.categories.length > 0) {
        selectedCategories.value = props.product.categories.map(category => category.id)
      }

      if (props.product.available_stages && props.product.available_stages.length > 0) {
        // Фильтруем стадии, оставляя только те, которые есть в availableStages
        const validStageIds = props.product.available_stages
          .map((stage) => stage.id)
          .filter((stageId) => availableStages.value.some((stage) => stage.id === stageId))

        selectedStages.value = validStageIds

        // Если были удалены невалидные стадии, показываем предупреждение
        const removedStages = props.product.available_stages
          .map((stage) => stage.id)
          .filter((stageId) => !availableStages.value.some((stage) => stage.id === stageId))

        if (removedStages.length > 0) {
        }
      } else {
        // Если нет доступных стадий у продукта, НЕ устанавливаем стадии по умолчанию
        // Сотрудник должен сам выбрать нужные стадии
        selectedStages.value = []
      }

      // Дополнительно загружаем все стадии продукта (включая недоступные) для правильного отображения
      try {
        const productStagesResponse: any = await getProductStages(props.product.id)

        if (productStagesResponse && productStagesResponse.product_stages) {
          // Получаем все стадии продукта (включая недоступные)
          const allProductStages = productStagesResponse.product_stages

          // Фильтруем только доступные стадии для selectedStages
          const availableProductStages = allProductStages.filter((ps: any) => ps.is_available)
          const availableStageIds = availableProductStages.map((ps: any) => ps.stage_id)

          // Обновляем selectedStages только доступными стадиями, исключая служебные
          selectedStages.value = availableStageIds.filter((stageId: number) => {
            const stage = availableStages.value.find((s) => s.id === stageId)
            if (!stage) return false

            // Исключаем служебные стадии
            const serviceStages = ['draft', 'completed', 'cancelled', 'final']
            if (serviceStages.includes(stage.name)) {
              return false
            }

            return true
          })
        }
      } catch (error) {
        // Продолжаем с данными из available_stages
      }

      // Загружаем назначения через API для получения полной структуры
      try {
        const assignmentsResponse = await getProductAssignments(props.product.id)

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
              product_id: assignment.product_id || 0,
              created_at: assignment.created_at || new Date().toISOString(),
              updated_at: assignment.updated_at || new Date().toISOString(),
            } as ProductAssignment)
          })

          // Обновляем stageAssignments
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
          const uniqueRoles = new Set(allAssignments.map((a: any) => a.role_type))

          uniqueRoles.forEach((roleType) => {
            const roleAssignments = allAssignments.filter((a: any) => a.role_type === roleType)

            // Находим стадию для этой роли (если есть)
            const stageForRole = availableStages.value.find((stage) =>
              stage.roles?.some((role) => role.name === roleType),
            )

            if (stageForRole) {
              // Если стадия найдена, добавляем назначения к ней
              const existingAssignments = getAssignmentsForStageRole(
                stageForRole.id,
                roleType as string,
              )
              const newAssignments = [...existingAssignments, ...roleAssignments]
              updateAssignmentsForStageRole(stageForRole.id, roleType as string, newAssignments)
            } else {
              // Если стадия не найдена, создаем назначения для первой доступной стадии
              // или для стадии по умолчанию
              const defaultStage =
                availableStages.value.find((s) => s.name === 'workshop') || availableStages.value[0]
              if (defaultStage) {
                const existingAssignments = getAssignmentsForStageRole(
                  defaultStage.id,
                  roleType as string,
                )
                const newAssignments = [...existingAssignments, ...roleAssignments]
                updateAssignmentsForStageRole(defaultStage.id, roleType as string, newAssignments)
              } else {
              }
            }
          })
        } else {
          // Распределяем назначения по стадиям (для всех стадий, включая отключенные)
          const allProductStageIds = selectedStages.value

          // Загружаем назначения для всех стадий продукта (динамически)
          allProductStageIds.forEach((stageId: number) => {
            const stage = availableStages.value.find((s) => s.id === stageId)
            if (stage && stage.roles) {
              stage.roles.forEach((role) => {
                const roleName = role.name
                let users: User[] = []

                // Получаем пользователей для роли из назначений продукта
                if (props.product && props.product.assignments) {
                  users =
                    props.product.assignments
                      .filter((a) => a.role_type === roleName && a.is_active)
                      .map((a) => a.user)
                      .filter(Boolean) || []
                }

                // Создаем назначения для этой стадии и роли
                const assignments = users.map(
                  (user) =>
                    ({
                      id: user.id,
                      role_type: roleName as string,
                      user: user,
                      user_id: user.id,
                      is_active: true,
                      product_id: props.product?.id || 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }) as ProductAssignment,
                )

                updateAssignmentsForStageRole(stageId, roleName, assignments)
              })
            }
          })
        }
      } catch (error) {
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

        // Используем fallback на старые поля
        const stageRoleMapping = {
          design: 'designer',
          print: 'print_operator',
          engraving: 'engraving_operator',
          workshop: 'workshop_worker',
        }

        // Распределяем назначения по стадиям (для всех стадий, включая отключенные)
        const allProductStageIds = selectedStages.value

        // Загружаем назначения для всех стадий продукта (динамически)
        allProductStageIds.forEach((stageId: number) => {
          const stage = availableStages.value.find((s) => s.id === stageId)
          if (stage && stage.roles) {
            stage.roles.forEach((role) => {
              const roleName = role.name
              let users: User[] = []

              // Получаем пользователей для роли из назначений продукта
              if (props.product && props.product.assignments) {
                users =
                  props.product.assignments
                    .filter((a) => a.role_type === roleName && a.is_active)
                    .map((a) => a.user)
                    .filter(Boolean) || []
              }

              // Создаем назначения для этой стадии и роли
              const assignments = users.map(
                (user) =>
                  ({
                    id: user.id,
                    role_type: roleName as string,
                    user: user,
                    user_id: user.id,
                    is_active: true,
                    product_id: props.product?.id || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }) as ProductAssignment,
              )

              updateAssignmentsForStageRole(stageId, roleName, assignments)
            })
          }
        })
      }
    } else {
      // Для нового продукта НЕ устанавливаем стадии по умолчанию
      // Сотрудник должен сам выбрать нужные стадии
      selectedStages.value = []
    }
  } catch (error) {
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
    // Обновляем stageAssignments при изменении выбранных стадий
    const removedStages = oldStages?.filter((id) => !newStages.includes(id)) || []
    if (removedStages.length > 0) {
      // Назначения сохраняются даже для отключенных стадий
    }
  },
  { deep: true, immediate: true },
)

function validateForm(): boolean {
  // Очищаем ошибки
  errors.name = ''
  errors.stages = ''
  errors.general = ''

  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Название обязательно'
    valid = false
  }

  // Для существующих продуктов требуем хотя бы одну стадию
  if (selectedStages.value.length === 0 && props.product?.id) {
    errors.stages = 'Выберите хотя бы одну стадию для существующего товара'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    // Сохраняем все стадии: выбранные как доступные, остальные как недоступные
    const allStageIds = availableStages.value.map((stage) => stage.id)
    const stagesData = allStageIds.map((stageId) => ({
      stage_id: stageId,
      is_available: selectedStages.value.includes(stageId),
    }))

    const productData = {
      name: form.name,
      stages: stagesData,
      categories: selectedCategories.value,
    } as unknown as ProductForm

    let productId: number

    if (props.product?.id) {
      // Обновляем существующий продукт

      await update(props.product.id, productData)
      productId = props.product.id
    } else {
      // Создаем новый продукт
      const created = await create(productData)
      const directId =
        created && typeof created === 'object' && 'id' in created ? (created as any).id : undefined
      const nestedId = (created as any)?.data?.id as number | undefined
      const resolvedId =
        typeof directId === 'number'
          ? directId
          : typeof nestedId === 'number'
            ? nestedId
            : undefined
      if (typeof resolvedId === 'number') {
        productId = resolvedId
      } else {
        throw new Error('Не удалось получить ID созданного продукта')
      }
    }

    // Сохраняем назначения по стадиям (ВСЕ назначения, включая отключенные стадии)
    const allAssignments: ProductAssignment[] = []

    // Получаем допустимые роли из стадий
    const validRoles = new Set<string>()
    availableStages.value.forEach((stage) => {
      if (stage.roles && Array.isArray(stage.roles)) {
        stage.roles.forEach((role) => {
          validRoles.add(role.name)
        })
      }
    })

    // Собираем все назначения по стадиям с валидацией ролей
    Object.keys(stageAssignments).forEach((stageId) => {
      const stageAssignmentsForStage = stageAssignments[parseInt(stageId)]

      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        // Проверяем, что роль является допустимой
        if (!validRoles.has(roleName)) {
          return
        }

        const roleAssignments = stageAssignmentsForStage[roleName]

        roleAssignments.forEach((assignment) => {
          // Проверяем, что назначение имеет пользователя (user_id может быть null согласно типу)
          if (assignment.user && assignment.user.id) {
            allAssignments.push({
              id: Date.now() + Math.random(),
              role_type: roleName as string,
              user: assignment.user,
              user_id: assignment.user.id, // Используем ID из user объекта
              is_active: true,
              product_id: productId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as ProductAssignment)
          }
        })
      })
    })

    // Всегда отправляем запрос, даже если массив пустой (для удаления всех назначений)
    try {
      const result = await bulkAssignProductUsers(productId, { assignments: allAssignments })
    } catch (error) {

      // Показываем более детальную ошибку
      let errorMessage = 'Ошибка при сохранении назначений'
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          errorMessage = 'Ошибка валидации назначений - проверьте роли пользователей'
        } else {
          errorMessage = `Ошибка при сохранении назначений: ${error.message}`
        }
      }

        toast.show(errorMessage, 'error')
        // Не прерываем сохранение продукта, только показываем ошибку
      }

    // Проверяем, что стадии действительно сохранились
    try {
      const savedStages: any = await getProductStages(productId)

      if (savedStages?.product_stages) {
        const availableStages = savedStages.product_stages.filter((ps: any) => ps.is_available)
        const availableStageIds = availableStages.map((ps: any) => ps.stage_id)

        const newSelectedStages = availableStageIds.filter((stageId: number) => {
          const stage = availableStages.value.find((s: any) => s.id === stageId)
          if (!stage) return false

          // Исключаем служебные стадии
          const serviceStages = ['draft', 'completed', 'cancelled', 'final']
          if (serviceStages.includes(stage.name)) {
            return false
          }

          return true
        })

        selectedStages.value = newSelectedStages
      }
    } catch (verifyError) {
      // Игнорируем ошибки проверки
    }

    toast.show(`Товар ${props.product ? 'обновлен' : 'создан'} успешно!`)
    emit('saved')
    emit('close')
  } catch (error) {
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


defineOptions({
  name: 'ProductFormModal'
})
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
