<template>
  <div class="space-y-4">
    <div v-if="title" class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-700">{{ title }}</h4>
      <!-- Удаляю дефолтную кнопку 'Добавить' -->
    </div>

    <div v-else class="flex items-center justify-end">
      <!-- Удаляю дефолтную кнопку 'Добавить' -->
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
        <UIButton type="button" variant="danger" size="sm" @click="$emit('remove', index)">
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

interface Props {
  title: string
  assignments: Array<{ id: number; user_id: number | null; user?: { id: number; name: string } }>
  allUsers: Array<{ id: number; name: string }>
  errors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
})

const emit = defineEmits<{
  update: [
    assignments: Array<{ id: number; user_id: number | null; user?: { id: number; name: string } }>,
  ]
  remove: [index: number]
}>()

// Исправление reduceUser для безопасного возврата объекта
function reduceUser(u: { id: number; name: string } | undefined) {
  if (!u) return 0
  return u.id
}

// Для отладки: выводим allUsers и user_id каждого назначения
watch(
  () => props.assignments,
  (assignments) => {
    console.log('AssignmentManager allUsers:', props.allUsers)
    assignments.forEach((a, i) => {
      const foundUser = props.allUsers.find((u) => u.id === a.user_id)
      console.log(`Assignment[${i}] user_id:`, a.user_id, 'reduceUser:', reduceUser(foundUser))
    })
    
    // Проверяем и исправляем дубликаты при изменении assignments
    const userIds = assignments.map((a) => a.user_id).filter((id) => id && id > 0)
    const uniqueUserIds = new Set(userIds)
    
    if (userIds.length !== uniqueUserIds.size) {
      console.log('Found duplicates in assignments, cleaning up...')
      const cleanedAssignments = [...assignments]
      const seenUserIds = new Set()
      
      for (let i = 0; i < cleanedAssignments.length; i++) {
        const assignment = cleanedAssignments[i]
        if (assignment.user_id && assignment.user_id > 0) {
          if (seenUserIds.has(assignment.user_id)) {
            console.log(`Clearing duplicate user_id ${assignment.user_id} at index ${i}`)
            cleanedAssignments[i].user_id = null
            cleanedAssignments[i].user = undefined
          } else {
            seenUserIds.add(assignment.user_id)
          }
        }
      }
      
      // Эмитим очищенные assignments только если они изменились
      if (JSON.stringify(cleanedAssignments) !== JSON.stringify(assignments)) {
        console.log('Emitting cleaned assignments:', cleanedAssignments)
        emit('update', cleanedAssignments)
      }
    }
  },
  { immediate: true },
)

const availableUsers = computed(() => {
  const assignedUserIds = props.assignments.map((a) => a.user_id).filter((id) => id && id > 0)
  const filtered = props.allUsers.filter((user) => !assignedUserIds.includes(user.id))

  console.log('AssignmentManager availableUsers:', {
    allUsers: props.allUsers.length,
    assignedUserIds,
    availableUsers: filtered.length,
    assignments: props.assignments.length,
  })

  return filtered
})

function removeAssignment(index: number) {
  // emit только индекс, чтобы родитель мог удалить
  emit('remove', index)
}

function updateAssignment(index: number) {
  console.log('updateAssignment called for index:', index)

  const updatedAssignments = [...props.assignments]
  const currentAssignment = updatedAssignments[index]

  // Новый лог для отладки user_id и user
  console.log('Assignment debug:', {
    index,
    user_id: currentAssignment.user_id,
    user: currentAssignment.user,
    allUsers: props.allUsers,
  })

  // Проверяем уникальность user_id только если user_id не null
  if (currentAssignment.user_id && currentAssignment.user_id > 0) {
    const userIds = updatedAssignments.map((a) => a.user_id).filter((id) => id && id > 0)
    const uniqueUserIds = new Set(userIds)

    if (userIds.length !== uniqueUserIds.size) {
      // Есть дубликаты - находим все индексы с этим user_id
      const duplicateIndexes = updatedAssignments
        .map((a, i) => ({ assignment: a, index: i }))
        .filter(({ assignment }) => assignment.user_id === currentAssignment.user_id)
        .map(({ index }) => index)

      console.log('Duplicate indexes:', duplicateIndexes)

      // Если текущий индекс не первый в списке дубликатов, сбрасываем его
      if (duplicateIndexes[0] !== index) {
        console.log('Resetting assignment at index:', index)
        updatedAssignments[index].user_id = null as number | null
        updatedAssignments[index].user = undefined
      }
    }
  }

  console.log('Updated assignments:', updatedAssignments)
  emit('update', updatedAssignments)
}

type Assignment = { id: number; user_id: number | null; user?: { id: number; name: string } }
function handleUserSelect(
  val: any,
  assignment: Assignment,
  index: number,
): void {
  assignment.user = val ?? undefined
  assignment.user_id = val ? val.id : null
  updateAssignment(index)
}
</script>

export default {}
