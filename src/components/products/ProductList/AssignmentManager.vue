<template>
  <div class="space-y-4">
    <div v-if="title" class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-700">{{ title }}</h4>
      <UIButton type="button" variant="primary" size="sm" @click="addAssignment">
        Добавить
      </UIButton>
    </div>

    <div v-else class="flex items-center justify-end">
      <UIButton type="button" variant="primary" size="sm" @click="addAssignment">
        Добавить
      </UIButton>
    </div>

    <div v-if="assignments.length === 0" class="text-sm text-gray-500 italic py-2">
      Назначения не добавлены
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(assignment, index) in assignments"
        :key="assignment.id || index"
        class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex-1">
          <Vue3Select
            v-model="assignment.user"
            :options="availableUsers"
            label="name"
            placeholder="Выберите пользователя"
            :clearable="true"
            :searchable="true"
            @update:model-value="getUserSelectHandler(index)"
          />
        </div>

        <UIButton type="button" variant="danger" size="sm" @click="removeAssignment(index)">
          Удалить
        </UIButton>
      </div>
    </div>

    <div v-if="errors.length > 0" class="text-red-600 text-sm">
      <div v-for="error in errors" :key="error" class="mt-1">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import UIButton from '../../ui/UIButton.vue'
import type { User } from '../../../types/user'
import type { ProductAssignment } from '../../../types/api'

interface Props {
  title: string
  roleType: string
  assignments: ProductAssignment[]
  allUsers: User[]
  errors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
})

const emit = defineEmits<{
  update: [assignments: ProductAssignment[]]
}>()

// Доступные пользователи - исключаем уже назначенных
const availableUsers = computed(() => {
  const assignedUserIds = props.assignments
    .filter((a) => a.user && a.is_active !== false)
    .map((a) => a.user?.id)
    .filter((id) => id !== undefined)

  const result = props.allUsers.filter((user) => !assignedUserIds.includes(user.id))

  return result
})

// Функция для получения обработчика выбора пользователя для конкретного индекса
const getUserSelectHandler = (index: number) => {
  return (val: unknown) => {
    const assignment = props.assignments[index]
    if (assignment) {
      handleUserSelect(val as User | null, assignment, index)
    }
  }
}

function addAssignment() {
  // Проверяем, что roleType не пустой и валидный
  if (!props.roleType || props.roleType.trim() === '') {
    console.warn('Попытка добавить назначение с пустой ролью')
    return
  }

  const newAssignment: ProductAssignment = {
    id: Date.now() + Math.random(), // Уникальный временный ID
    product_id: 0, // Будет установлен при сохранении
    role_type: props.roleType,
    user: null,
    user_id: null, // Может быть null согласно типу
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Создаем новый массив для правильной реактивности
  const updatedAssignments = [...props.assignments, newAssignment]
  emit('update', updatedAssignments)
}

function removeAssignment(index: number) {
  // Создаем новый массив без указанного элемента для правильной реактивности
  const updatedAssignments = props.assignments.filter((_, i) => i !== index)
  emit('update', updatedAssignments)
}

function handleUserSelect(val: User | null, assignment: ProductAssignment, index: number): void {
  // Создаем новый массив для правильной реактивности
  const updatedAssignments = [...props.assignments]

  if (val) {
    updatedAssignments[index] = {
      ...assignment,
      user: val,
      user_id: val.id,
      is_active: true,
    }
  } else {
    updatedAssignments[index] = {
      ...assignment,
      user: null,
      user_id: null,
    }
  }

  emit('update', updatedAssignments)
}

// Отладка для разработки
watch(
  () => props.assignments,
  (assignments) => {
    if (assignments.length > 0) {
    }
  },
  { immediate: true },
)


defineOptions({
  name: 'AssignmentManager'
})
</script>
