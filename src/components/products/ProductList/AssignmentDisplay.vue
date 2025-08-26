<template>
  <div class="space-y-1">
    <div v-if="activeAssignments.length === 0" class="text-sm text-gray-500 italic">
      {{ emptyMessage || 'Не назначены' }}
    </div>
    <div v-else class="space-y-1">
      <div
        v-for="assignment in activeAssignments"
        :key="assignment.id"
        class="flex items-center gap-2 text-sm"
      >
        <span class="font-medium text-gray-700">
          {{ assignment.user?.name || 'Неизвестный' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProductAssignment } from '../../../types/api'

interface Props {
  assignments?: ProductAssignment[]
  emptyMessage?: string
  roleType?: string // Для фильтрации по типу роли
}

const props = withDefaults(defineProps<Props>(), {
  assignments: () => [],
})

// Показываем все активные назначения
const activeAssignments = computed(() => {
  if (!props.assignments) return []

  return props.assignments.filter((assignment) => {
    // Фильтруем по типу роли, если указан
    if (props.roleType && assignment.role_type !== props.roleType) {
      return false
    }

    // Показываем только активные назначения с пользователем
    return assignment.is_active && assignment.user
  })
})
</script>
