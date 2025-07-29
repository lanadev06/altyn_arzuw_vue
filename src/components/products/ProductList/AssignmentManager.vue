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
            @update:model-value="(val) => handleUserSelect(val, assignment, index)"
          />
        </div>
        <span
          v-if="assignment.is_active !== undefined"
          :class="[
            'px-2 py-1 text-xs rounded-full',
            assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600',
          ]"
        >
          {{ assignment.is_active ? 'Активен' : 'Неактивен' }}
        </span>
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
import UIButton from '@/components/ui/UIButton.vue'
import type { User } from '@/types/user'
import type { ProductAssignment } from '@/types/product'

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

  console.log(`👥 AssignmentManager [${props.roleType}] available users:`, {
    totalUsers: props.allUsers.length,
    assignedUserIds: assignedUserIds,
    availableUsers: result.length,
    assignments: props.assignments.length,
  })

  return result
})

function addAssignment() {
  const newAssignment: ProductAssignment = {
    id: 0, // Временный ID, будет заменен сервером
    role_type: props.roleType,
    is_active: true,
    user: null,
    user_id: 0,
  }

  const updatedAssignments = [...props.assignments, newAssignment]
  emit('update', updatedAssignments)
}

function removeAssignment(index: number) {
  console.log(
    '🗑️ Removing assignment at index:',
    index,
    'from',
    props.assignments.length,
    'assignments',
  )
  const updatedAssignments = props.assignments.filter((_, i) => i !== index)
  console.log('🗑️ After removal:', updatedAssignments.length, 'assignments remain')
  emit('update', updatedAssignments)
}

function handleUserSelect(
  val: User | undefined,
  assignment: ProductAssignment,
  index: number,
): void {
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
      user_id: 0,
    }
  }

  emit('update', updatedAssignments)
}

// Отладка для разработки
watch(
  () => props.assignments,
  (assignments) => {
    if (assignments.length > 0) {
      console.log(
        `✅ AssignmentManager [${props.roleType}] received:`,
        assignments.length,
        'assignments',
      )
      console.log(`👤 First assignment:`, {
        id: assignments[0].id,
        user_id: assignments[0].user_id,
        user_name: assignments[0].user?.name,
        is_active: assignments[0].is_active,
        role_type: assignments[0].role_type,
      })
    } else {
      console.log(`❌ AssignmentManager [${props.roleType}] received: 0 assignments`)
    }
  },
  { immediate: true },
)
</script>
