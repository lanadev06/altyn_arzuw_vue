<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ order ? 'Редактировать заказ' : 'Новый заказ' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6 pb-4">
      <!-- Основная информация о заказе -->
      <div class="space-y-6">
        <!-- Клиент -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Клиент <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <Vue3Select
              v-model="form.client_id"
              :options="clients"
              label="name"
              :reduce="(client) => client.id"
              placeholder="Выберите клиента"
              :clearable="true"
              :searchable="true"
              :error="errors.client_id"
              required
              class="flex-1"
            />
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="showClientModal = true"
              title="Создать нового клиента"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </UIButton>
          </div>
          <div v-if="errors.client_id" class="text-red-600 text-sm mt-1">
            {{ errors.client_id }}
          </div>
        </div>

        <!-- Проект (опционально) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Проект</label>
          <div class="flex gap-2">
            <Vue3Select
              v-model="form.project_id"
              :options="projects"
              label="title"
              :reduce="(project) => project.id"
              placeholder="Выберите проект (опционально)"
              :clearable="true"
              :searchable="true"
              class="flex-1"
            />
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="showProjectModal = true"
              title="Создать новый проект"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </UIButton>
          </div>
        </div>

        <!-- Продукт -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Продукт <span class="text-red-500">*</span>
          </label>
          <Vue3Select
            v-model="form.product_id"
            :options="products"
            label="name"
            :reduce="(product) => product.id"
            placeholder="Выберите продукт"
            :clearable="true"
            :searchable="true"
            :error="errors.product_id"
            required
            @update:model-value="onProductChange"
          />
          <div v-if="errors.product_id" class="text-red-600 text-sm mt-1">
            {{ errors.product_id }}
          </div>
        </div>

        <!-- Количество и цена в одной строке -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Количество <span class="text-red-500">*</span>
            </label>
            <UIInput
              v-model.number="form.quantity"
              type="number"
              min="1"
              placeholder="Введите количество"
              :error="errors.quantity"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Цена</label>
            <UIInput
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Введите цену"
            />
          </div>
        </div>

        <!-- Дедлайн -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Дедлайн</label>
          <UIInput
            v-model="form.deadline"
            type="datetime-local"
            placeholder="Выберите дату и время"
          />
        </div>
      </div>

      <!-- Стадии производства -->
      <div v-if="workingStages.length > 0" class="relative">
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
              :disabled="selectedOrderStages.length === workingStages.length"
            >
              Выбрать все
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="clearAllStages"
              :disabled="selectedOrderStages.length === 0"
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
              selectedOrderStages.includes(stage.id)
                ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                : ''
            "
            @click="toggleOrderStage(stage.id)"
          >
            <div
              class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
              :class="
                selectedOrderStages.includes(stage.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              "
            >
              <svg
                v-if="selectedOrderStages.includes(stage.id)"
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
          Выберите стадии, которые будут использоваться в этом заказе
          <span v-if="selectedOrderStages.length > 0" class="text-blue-600 font-medium">
            (выбрано: {{ selectedOrderStages.length }} из {{ workingStages.length }})
          </span>
        </p>
        <p v-if="errors.stages" class="text-sm text-red-600 mt-1">
          {{ errors.stages }}
        </p>
      </div>

      <!-- Назначения исполнителей по стадиям -->
      <div v-if="selectedOrderStages.length > 0" class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900">Назначение исполнителей по стадиям</h3>

        <div v-for="stage in selectedOrderStageObjects" :key="stage.id" class="space-y-4">
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
                <!-- Debug info -->
                <div class="text-xs text-gray-500 mt-1">
                  Debug: Stage {{ stage.id }}, Role {{ role.name }}, 
                  Assignments: {{ getAssignmentsForStageRole(stage.id, role.name).length }}, 
                  Users: {{ getUsersForRole(role.name).length }}
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-gray-500">Для этой стадии не настроены роли</div>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <UIButton
          type="submit"
          :loading="loading"
          class="flex-1"
          :disabled="!form.client_id || !form.product_id || selectedOrderStages.length === 0"
        >
          {{ order ? 'Сохранить' : 'Создать' }}
        </UIButton>

        <UIButton v-if="order" type="button" variant="danger" @click="handleDelete">
          Удалить
        </UIButton>

        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
      </div>
    </form>

    <!-- Модальное окно для создания клиента -->
    <!-- <ClientFormModal
      v-if="showClientModal"
      @close="showClientModal = false"
      @submit="onClientCreated"
    /> -->

    <!-- Модальное окно для создания проекта -->
    <!-- <ProjectFormModal
      v-if="showProjectModal"
      @close="showProjectModal = false"
      @submit="onProjectCreated"
    /> -->
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIButton from '@/components/ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import AssignmentManager from '../../products/ProductList/AssignmentManager.vue'
import type { Order, OrderForm } from '../../../types/order'
import type { Product } from '../../../types/product'
import type { Stage } from '../../../types/stage'
import {
  getAllClients,
  getAllProducts,
  getAllProjects,
  getAllStages,
  getAllUsersByStageRoles,
  getProductAssignments,
} from '@/services/api'
import type { ProductAssignment } from '../../../types/product'
import type { User } from '../../../types/user'
import orderController from '../../../controllers/orderControllerInstance'
import { toast } from '../../../stores/toast'
// import ClientFormModal from '../../clients/ClientList/ClientFormModal.vue'
// import ProjectFormModal from '../../projects/ProjectList/ProjectFormModal.vue'

const props = defineProps<{ order?: Order | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { create, update, remove } = orderController

const loading = ref(false)
const stagesLoading = ref(false)
const clients = ref([])
const products = ref<Product[]>([])
const projects = ref([])
const availableStages = ref<Stage[]>([])
const selectedOrderStages = ref<number[]>([])

const showClientModal = ref(false)
const showProjectModal = ref(false)

const form = reactive<OrderForm>({
  client_id: 0,
  project_id: null,
  product_id: null,
  quantity: 1,
  price: null,
  deadline: null,
})

const errors = reactive({
  client_id: '',
  product_id: '',
  quantity: '',
  price: '',
  deadline: '',
  stages: '',
})

// Пользователи по ролям (динамическая структура)
const allUsers = reactive<Record<string, User[]>>({})

// Структура для хранения назначений по стадиям и ролям
const stageAssignments = reactive<Record<number, Record<string, ProductAssignment[]>>>({})

// Выбранный продукт для отображения назначений
const selectedProduct = computed(() => {
  if (!Array.isArray(products.value)) {
    console.warn('⚠️ products.value is not an array:', products.value)
    return null
  }
  return products.value.find((p) => p.id === form.product_id) || null
})

// Вычисляемое свойство для получения только рабочих стадий (исключаем служебные)
const workingStages = computed(() => {
  const serviceStages = ['draft', 'completed', 'cancelled', 'final']
  const filtered = availableStages.value.filter((stage) => !serviceStages.includes(stage.name))

  console.log('🔍 Working stages filter:', {
    total: availableStages.value.length,
    filtered: filtered.length,
    workingStages: filtered.map((s) => s.name),
    selectedStages: selectedOrderStages.value,
    selectedStageNames: selectedOrderStages.value
      .map((id) => availableStages.value.find((s) => s.id === id)?.name)
      .filter(Boolean),
    serviceStagesFiltered: availableStages.value
      .filter((stage) => serviceStages.includes(stage.name))
      .map((s) => s.name),
  })

  return filtered
})

// Вычисляемое свойство для получения объектов выбранных стадий заказа
const selectedOrderStageObjects = computed(() => {
  const result = availableStages.value
    .filter((stage) => selectedOrderStages.value.includes(stage.id))
    .filter((stage) => stage.roles && stage.roles.length > 0) // Показываем только стадии с ролями
  
  console.log('🎯 Selected order stage objects:', result.length, 'stages', result)
  return result
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
  const result = Array.isArray(assignments) ? assignments : []
  console.log(`🔍 Getting assignments for stage ${stageId}, role ${roleName}:`, result.length, 'assignments')
  return result
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
  console.log(
    `🔄 Updated order assignments for stage ${stageId}, role ${roleName}:`,
    assignments.length,
    'assignments',
    assignments
  )
}

function getUsersForRole(roleName: string): User[] {
  const users = allUsers[roleName] || []
  console.log(`👥 Getting users for role ${roleName}:`, users.length, 'users', users)
  return users
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

function toggleOrderStage(stageId: number) {
  try {
    console.log(
      '🔄 Toggling order stage:',
      stageId,
      'Current selected stages:',
      selectedOrderStages.value,
    )

    // Проверяем, что стадия существует в доступных стадиях
    const stageExists = workingStages.value.some((stage) => stage.id === stageId)
    if (!stageExists) {
      console.error('❌ Stage not found:', stageId)
      return
    }

    const index = selectedOrderStages.value.indexOf(stageId)
    if (index > -1) {
      // Удаляем стадию из выбранных
      selectedOrderStages.value.splice(index, 1)
      console.log('❌ Removed stage:', stageId, 'New selected stages:', selectedOrderStages.value)

      // НЕ удаляем назначения для отключенной стадии - они должны сохраняться
      console.log('💾 Keeping assignments for disabled stage:', stageId)
    } else {
      // Добавляем стадию в выбранные
      selectedOrderStages.value.push(stageId)
      console.log('✅ Added stage:', stageId, 'New selected stages:', selectedOrderStages.value)

      // Инициализируем пустые назначения для новой стадии
      if (!stageAssignments[stageId]) {
        stageAssignments[stageId] = {}
        console.log('📋 Initialized empty assignments for stage:', stageId)
      }
    }

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
    console.log('🔄 Force updated selectedOrderStages:', selectedOrderStages.value)
  } catch (error) {
    console.error('❌ Error toggling order stage:', error)
  }
}

function selectAllStages() {
  try {
    console.log('✅ Selecting all order stages')
    selectedOrderStages.value = workingStages.value.map((stage) => stage.id)

    // Инициализируем назначения для всех стадий
    workingStages.value.forEach((stage) => {
      if (!stageAssignments[stage.id]) {
        stageAssignments[stage.id] = {}
      }
    })

    console.log('📋 All order stages selected:', selectedOrderStages.value)

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
    console.log('🔄 Force updated selectedOrderStages after select all:', selectedOrderStages.value)
  } catch (error) {
    console.error('❌ Error selecting all order stages:', error)
  }
}

function clearAllStages() {
  try {
    console.log('❌ Clearing all order stages')
    selectedOrderStages.value = []

    // НЕ удаляем назначения - они должны сохраняться
    console.log('💾 Keeping all assignments while clearing stages')

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
    console.log('🔄 Force updated selectedOrderStages after clear all:', selectedOrderStages.value)
  } catch (error) {
    console.error('❌ Error clearing all order stages:', error)
  }
}

async function onProductChange(productId: number | null) {
  try {
    console.log('🔄 Product changed:', productId)
    form.product_id = productId
    selectedOrderStages.value = [] // Сбрасываем выбранные стадии

    // Очищаем назначения
    if (stageAssignments && typeof stageAssignments === 'object') {
      Object.keys(stageAssignments).forEach((key) => {
        delete stageAssignments[parseInt(key)]
      })
    }

    // Если есть доступные стадии и выбран продукт
    if (productId && selectedProduct.value?.available_stages) {
      stagesLoading.value = true

      try {
        // Загружаем назначения продукта для автоматического подтягивания
        console.log('📋 Loading product assignments for auto-fill...')
        const productAssignmentsResponse = await getProductAssignments(productId)
        console.log('📋 Product assignments response:', productAssignmentsResponse)

        if (
          productAssignmentsResponse &&
          productAssignmentsResponse.assignments &&
          Array.isArray(productAssignmentsResponse.assignments)
        ) {
          // Группируем назначения продукта по стадиям и ролям
          const productAssignmentsByStageRole: Record<
            number,
            Record<string, ProductAssignment[]>
          > = {}

          productAssignmentsResponse.assignments.forEach((assignment: any) => {
            const stageId = assignment.stage_id
            const roleType = assignment.role_type

            if (!productAssignmentsByStageRole[stageId]) {
              productAssignmentsByStageRole[stageId] = {}
            }
            if (!productAssignmentsByStageRole[stageId][roleType]) {
              productAssignmentsByStageRole[stageId][roleType] = []
            }

            productAssignmentsByStageRole[stageId][roleType].push({
              id: assignment.id,
              user_id: assignment.user_id,
              role_type: assignment.role_type,
              stage_id: assignment.stage_id,
              is_active: assignment.is_active,
              user: assignment.user,
            })
          })

          console.log('📋 Product assignments by stage/role:', productAssignmentsByStageRole)

          // Выбираем все доступные стадии продукта по умолчанию
          if (
            selectedProduct.value &&
            selectedProduct.value.available_stages &&
            Array.isArray(selectedProduct.value.available_stages)
          ) {
            selectedOrderStages.value = selectedProduct.value.available_stages.map(
              (stage) => stage.id,
            )
          } else {
            console.warn('⚠️ No available stages found for product, using empty selection')
            selectedOrderStages.value = []
          }

          // Копируем назначения продукта в заказ
          if (productAssignmentsByStageRole && typeof productAssignmentsByStageRole === 'object') {
            Object.keys(productAssignmentsByStageRole).forEach((stageId) => {
              const stageIdNum = parseInt(stageId)
              const stageAssignmentsForStage = productAssignmentsByStageRole[stageIdNum]

              if (stageAssignmentsForStage && typeof stageAssignmentsForStage === 'object') {
                Object.keys(stageAssignmentsForStage).forEach((roleType) => {
                  const assignments = stageAssignmentsForStage[roleType]
                  if (Array.isArray(assignments)) {
                    updateAssignmentsForStageRole(
                      stageIdNum,
                      roleType,
                      [...assignments], // Копируем массив
                    )
                  }
                })
              }
            })
          }

          console.log('✅ Product assignments copied to order')
        }
      } catch (error) {
        console.warn('⚠️ Could not load product assignments:', error)
        // Продолжаем без назначений продукта
      } finally {
        stagesLoading.value = false
      }
    }
  } catch (error) {
    console.error('❌ Error in onProductChange:', error)
    stagesLoading.value = false
  }
}

onMounted(async () => {
  try {
    console.log('🚀 OrderFormModal mounted, loading data...')

    // Загружаем все необходимые данные
    const [clientsData, productsData, projectsData, stagesData, usersByStageRoles] =
      await Promise.all([
        getAllClients().catch((error) => {
          console.error('❌ Error loading clients:', error)
          return []
        }),
        getAllProducts().catch((error) => {
          console.error('❌ Error loading products:', error)
          return []
        }),
        getAllProjects().catch((error) => {
          console.error('❌ Error loading projects:', error)
          return []
        }),
        getAllStages().catch((error) => {
          console.error('❌ Error loading stages:', error)
          return { data: [] }
        }),
        getAllUsersByStageRoles().catch((error) => {
          console.error('❌ Error loading users by stage roles:', error)
          return {}
        }),
      ])

    console.log('📋 Raw data loaded:', {
      clients: clientsData,
      products: productsData,
      projects: projectsData,
      stages: stagesData,
      usersByStageRoles: usersByStageRoles,
    })

    // Обрабатываем данные клиентов
    if (Array.isArray(clientsData)) {
      clients.value = clientsData
    } else if (clientsData && Array.isArray(clientsData.data)) {
      clients.value = clientsData.data
    } else {
      console.warn('⚠️ Invalid clients data format:', clientsData)
      clients.value = []
    }

    // Обрабатываем данные продуктов
    if (Array.isArray(productsData)) {
      products.value = productsData
    } else if (productsData && Array.isArray(productsData.data)) {
      products.value = productsData.data
    } else {
      console.warn('⚠️ Invalid products data format:', productsData)
      products.value = []
    }

    // Обрабатываем данные проектов
    if (Array.isArray(projectsData)) {
      projects.value = projectsData
    } else if (projectsData && Array.isArray(projectsData.data)) {
      projects.value = projectsData.data
    } else {
      console.warn('⚠️ Invalid projects data format:', projectsData)
      projects.value = []
    }

    // Обрабатываем данные стадий
    if (Array.isArray(stagesData)) {
      availableStages.value = stagesData
    } else if (stagesData && Array.isArray(stagesData.data)) {
      availableStages.value = stagesData.data
    } else {
      console.warn('⚠️ Invalid stages data format:', stagesData)
      availableStages.value = []
    }

    console.log('✅ Processed data:', {
      clientsCount: clients.value.length,
      productsCount: products.value.length,
      projectsCount: projects.value.length,
      stagesCount: availableStages.value.length,
    })

    // Если клиенты не загрузились, создаем fallback клиентов
    if (clients.value.length === 0) {
      console.log('⚠️ No clients from API, creating fallback clients')
      clients.value = [
        { id: 1, name: 'Тестовый клиент 1', company_name: 'Компания 1' },
        { id: 2, name: 'Тестовый клиент 2', company_name: 'Компания 2' },
      ]
    }

    // Если продукты не загрузились, создаем fallback продукты
    if (products.value.length === 0) {
      console.log('⚠️ No products from API, creating fallback products')
      products.value = [
        {
          id: 1,
          name: 'Тестовый продукт 1',
          available_stages: [
            {
              id: 2,
              name: 'design',
              display_name: 'Дизайн',
              color: '#3B82F6',
              order: 2,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
            },
            {
              id: 3,
              name: 'print',
              display_name: 'Печать',
              color: '#10B981',
              order: 3,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 2, name: 'print_operator', display_name: 'Печатник' }],
            },
          ],
        },
        {
          id: 2,
          name: 'Тестовый продукт 2',
          available_stages: [
            {
              id: 2,
              name: 'design',
              display_name: 'Дизайн',
              color: '#3B82F6',
              order: 2,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
            },
          ],
        },
      ] as any
    }

    // Если проекты не загрузились, создаем fallback проекты
    if (projects.value.length === 0) {
      console.log('⚠️ No projects from API, creating fallback projects')
      projects.value = [
        { id: 1, title: 'Тестовый проект 1' },
        { id: 2, title: 'Тестовый проект 2' },
      ]
    }

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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
        },
        {
          id: 3,
          name: 'print',
          display_name: 'Печать',
          color: '#10B981',
          order: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 2, name: 'print_operator', display_name: 'Печатник' }],
        },
        {
          id: 4,
          name: 'engraving',
          display_name: 'Гравировка',
          color: '#8B5CF6',
          order: 4,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 3, name: 'engraving_operator', display_name: 'Гравировщик' }],
        },
        {
          id: 5,
          name: 'workshop',
          display_name: 'Цех',
          color: '#F59E0B',
          order: 5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 4, name: 'workshop_worker', display_name: 'Работник цеха' }],
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
          email: `operator_${roleName}@example.com`,
          roles: [{ name: roleName }],
        } as any
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

    // Если редактируем заказ
    if (props.order) {
      Object.assign(form, {
        client_id: props.order.client_id || 0,
        project_id: props.order.project_id || null,
        product_id: props.order.product_id || null,
        quantity: props.order.quantity || 1,
        price: props.order.price || null,
        deadline: props.order.deadline ? formatDateForInput(props.order.deadline) : null,
      })

      // Загружаем стадии заказа
      if (props.order.stages) {
        selectedOrderStages.value = props.order.stages.map((stage) => stage.id)
      }

      // Загружаем назначения заказа
      if (props.order.assignments) {
        props.order.assignments.forEach((assignment) => {
          if (assignment.stage_id && assignment.role_type) {
            const existingAssignments = getAssignmentsForStageRole(
              assignment.stage_id,
              assignment.role_type,
            )
            existingAssignments.push({
              id: assignment.user_id,
              role_type: assignment.role_type,
              user: assignment.user,
              user_id: assignment.user_id,
              is_active: true,
            })
          }
        })
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    toast.show('Ошибка загрузки данных', 'error')
  }
})

// Отслеживаем изменения выбранных стадий
watch(
  selectedOrderStages,
  (newStages, oldStages) => {
    console.log('👀 selectedOrderStages changed:', {
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

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  // Форматируем для input type="datetime-local"
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function validateForm(): boolean {
  console.log('🔍 Validating order form:', {
    client_id: form.client_id,
    product_id: form.product_id,
    quantity: form.quantity,
    selectedStages: selectedOrderStages.value,
  })

  // Очищаем ошибки
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })

  let valid = true

  if (!form.client_id || form.client_id <= 0) {
    errors.client_id = 'Выберите клиента'
    valid = false
    console.log('❌ Client validation failed')
  }

  if (!form.product_id || form.product_id <= 0) {
    errors.product_id = 'Выберите продукт'
    valid = false
    console.log('❌ Product validation failed')
  }

  if (!form.quantity || form.quantity <= 0) {
    errors.quantity = 'Введите корректное количество'
    valid = false
    console.log('❌ Quantity validation failed')
  }

  if (selectedOrderStages.value.length === 0) {
    errors.stages = 'Выберите хотя бы одну стадию'
    valid = false
    console.log('❌ Stages validation failed')
  }

  console.log('✅ Order form validation result:', valid)
  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  loading.value = true
  try {
    const orderData = {
      ...form,
      deadline: form.deadline || null,
      price: form.price || null,
      stages: selectedOrderStages.value,
      assignments: getAllAssignments(),
    }

    console.log('💾 Saving order with data:', orderData)

    if (props.order) {
      // Обновляем существующий заказ
      await update(props.order.id, orderData)
      toast.show('Заказ обновлен успешно!')
    } else {
      // Создаем новый заказ
      await create(orderData)
      toast.show('Заказ создан успешно!')
    }

    emit('submit')
    emit('close')
  } catch (error) {
    console.error('Ошибка сохранения заказа:', error)
    toast.show('Ошибка при сохранении заказа', 'error')
  } finally {
    loading.value = false
  }
}

function getAllAssignments() {
  const allAssignments = []
  Object.keys(stageAssignments).forEach((stageId) => {
    const stageAssignmentsForStage = stageAssignments[parseInt(stageId)]
    if (stageAssignmentsForStage && typeof stageAssignmentsForStage === 'object') {
      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        const assignments = stageAssignmentsForStage[roleName]
        if (Array.isArray(assignments)) {
          assignments.forEach((assignment) => {
            if (assignment && assignment.user_id && assignment.user_id > 0) {
              allAssignments.push({
                user_id: assignment.user_id,
                role_type: roleName,
                stage_id: parseInt(stageId),
                is_active: assignment.is_active,
              })
            }
          })
        }
      })
    }
  })
  return allAssignments
}

async function handleDelete() {
  if (!props.order) return

  if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return

  try {
    await remove(props.order.id)
    toast.show('Заказ удален!')
    emit('delete', props.order.id)
    emit('close')
  } catch (error) {
    console.error('Ошибка удаления заказа:', error)
    toast.show('Ошибка при удалении заказа', 'error')
  }
}

// function onClientCreated(client: any) {
//   clients.value.push(client)
//   form.client_id = client.id
//   showClientModal.value = false
//   toast.show('Клиент создан!')
// }

// function onProjectCreated(project: any) {
//   projects.value.push(project)
//   form.project_id = project.id
//   showProjectModal.value = false
//   toast.show('Проект создан!')
// }
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
