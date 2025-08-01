<template>
  <Modal @close="$emit('close')" title="Массовые назначения">
    <div class="space-y-6">
      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Режим назначения
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <label
            class="flex items-center p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
            :class="mode === 'single' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''"
            @click="mode = 'single'"
          >
            <div
              class="mr-3 w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors"
              :class="
                mode === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
              "
            >
              <div v-if="mode === 'single'" class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div class="font-medium text-gray-900">Одиночный заказ</div>
              <div class="text-sm text-gray-500">Назначить на один заказ</div>
            </div>
          </label>

          <label
            class="flex items-center p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
            :class="mode === 'multiple' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''"
            @click="mode = 'multiple'"
          >
            <div
              class="mr-3 w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors"
              :class="
                mode === 'multiple' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
              "
            >
              <div v-if="mode === 'multiple'" class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div class="font-medium text-gray-900">Несколько заказов</div>
              <div class="text-sm text-gray-500">Назначить на разные заказы</div>
            </div>
          </label>
        </div>
      </div>

      <div v-if="mode === 'multiple'" class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Выберите заказы
        </h3>
        <div class="max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
          <label
            v-for="order in availableOrders"
            :key="order.id"
            class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200"
          >
            <div
              class="w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
              :class="
                selectedOrderIds.includes(order.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              "
            >
              <svg
                v-if="selectedOrderIds.includes(order.id)"
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
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">
                Заказ #{{ order.id }} - {{ order.client?.name || 'Без клиента' }}
              </span>
            </div>
            <span
              v-if="order.current_stage_info"
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
              :style="{ backgroundColor: order.current_stage_info.color }"
            >
              {{ order.current_stage_info.display_name }}
            </span>
          </label>
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg
              class="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Назначения
          </h3>
          <button
            type="button"
            @click="addAssignment"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить назначение
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(assignment, index) in assignments"
            :key="index"
            class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start mb-4">
              <h4 class="text-sm font-medium text-gray-900 flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Назначение #{{ index + 1 }}
              </h4>
              <button
                @click="removeAssignment(index)"
                class="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Удалить
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-2"> Пользователь </label>
                <Vue3Select
                  v-model="assignment.user_id"
                  :options="availableUsers"
                  option-label="name"
                  option-value="id"
                  placeholder="Выберите пользователя"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-2"> Роль </label>
                <Vue3Select
                  v-model="assignment.role_type"
                  :options="availableRoles"
                  option-label="display_name"
                  option-value="name"
                  placeholder="Выберите роль"
                  class="w-full"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-3">
                  Назначенные стадии
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="stage in availableStages"
                    :key="stage.id"
                    class="flex items-center p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02]"
                    :class="
                      assignment.assigned_stages.includes(stage.id)
                        ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                        : ''
                    "
                    @click="toggleStageAssignment(index, stage.id)"
                  >
                    <div
                      class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
                      :class="
                        assignment.assigned_stages.includes(stage.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      "
                    >
                      <svg
                        v-if="assignment.assigned_stages.includes(stage.id)"
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
                      <span class="text-sm font-medium text-gray-900">{{
                        stage.display_name
                      }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        <button
          @click="handleSubmit"
          :disabled="!isValid || isSubmitting"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? 'Сохранение...' : 'Сохранить назначения' }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Vue3Select from 'vue3-select'
import { useToast } from '@/stores/toast'
import { getAllStages, getAllRoles, getAllUsers } from '@/services/api'

interface Props {
  orderId?: number
  availableOrders?: Array<{
    id: number
    client?: { name: string }
    current_stage_info?: { display_name: string; color: string }
  }>
}

interface Assignment {
  user_id: number | null
  role_type: string | null
  assigned_stages: number[]
}

interface User {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  display_name: string
}

interface Stage {
  id: number
  name: string
  display_name: string
  color: string
}

const props = withDefaults(defineProps<Props>(), {
  availableOrders: () => [],
})

const emit = defineEmits<{
  close: []
  success: [result: any]
}>()

const toast = useToast()

const mode = ref<'single' | 'multiple'>('single')
const selectedOrderIds = ref<number[]>([])
const assignments = ref<Assignment[]>([
  {
    user_id: null,
    role_type: null,
    assigned_stages: [],
  },
])

const availableUsers = ref<User[]>([])
const availableRoles = ref<Role[]>([])
const availableStages = ref<Stage[]>([])
const isSubmitting = ref(false)

const isValid = computed(() => {
  if (mode.value === 'multiple' && selectedOrderIds.value.length === 0) {
    return false
  }

  return assignments.value.every(
    (assignment) =>
      assignment.user_id && assignment.role_type && assignment.assigned_stages.length > 0,
  )
})

onMounted(async () => {
  await loadData()

  if (props.orderId) {
    mode.value = 'single'
  }
})

async function loadData() {
  try {
    const [stagesResponse, rolesResponse, usersResponse] = await Promise.all([
      getAllStages(),
      getAllRoles(),
      getAllUsers(),
    ])

    availableStages.value = Array.isArray(stagesResponse) ? stagesResponse : (stagesResponse as any)?.data || []
    availableRoles.value = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse as any)?.data || []
    availableUsers.value = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any)?.data || []
  } catch (error) {
    toast.show('Ошибка загрузки данных', 'error')
  }
}

function addAssignment() {
  assignments.value.push({
    user_id: null,
    role_type: null,
    assigned_stages: [],
  })
}

function removeAssignment(index: number) {
  if (assignments.value.length > 1) {
    assignments.value.splice(index, 1)
  }
}

function toggleStageAssignment(assignmentIndex: number, stageId: number) {
  const assignment = assignments.value[assignmentIndex]
  if (!assignment) return

  const stageIndex = assignment.assigned_stages.indexOf(stageId)
  if (stageIndex > -1) {
    assignment.assigned_stages.splice(stageIndex, 1)
  } else {
    assignment.assigned_stages.push(stageId)
  }
}

async function handleSubmit() {
  if (!isValid.value) {
    toast.show('Пожалуйста, заполните все обязательные поля', 'error')
    return
  }

  isSubmitting.value = true

  try {
    let result: Response | undefined

    if (mode.value === 'single' && props.orderId) {
      result = await fetch(`/api/orders/${props.orderId}/bulk-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assignments.value }),
      })
    } else if (mode.value === 'multiple') {
      const bulkAssignments = selectedOrderIds.value.flatMap((orderId) =>
        assignments.value.map((assignment) => ({
          order_id: orderId,
          ...assignment,
        })),
      )

      result = await fetch('/api/assignments/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: bulkAssignments }),
      })
    }

    if (result) {
      const response = await result.json()

      if (response.errors && response.errors.length > 0) {
        toast.show(`Ошибки: ${response.errors.join(', ')}`, 'error')
      } else {
        toast.show('Назначения успешно созданы', 'success')
        emit('success', response)
        emit('close')
      }
    }
  } catch (error) {
    toast.show('Ошибка сохранения назначений', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.bg-gray-50 {
  transition: all 0.3s ease;
}

.bg-gray-50:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

h3 svg {
  transition: transform 0.2s ease;
}

h3:hover svg {
  transform: scale(1.1);
}
</style>

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
