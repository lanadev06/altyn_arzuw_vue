<template>
  <div class="space-y-1">
    <div v-if="activeAssignments.length === 0" class="text-sm text-gray-500 italic">
      {{ emptyMessage || 'Не назначены' }}
    </div>
    <div v-else class="space-y-1">
      <div
        v-for="assignment in activeAssignments"
        :key="assignment.id || assignment.user?.id"
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
import type { ProductAssignment } from '@/types/product'
import type { User } from '@/types/user'

interface Props {
  assignments?: ProductAssignment[] | User[] // Поддержка обоих форматов
  emptyMessage?: string
  roleType?: string // Для фильтрации по типу роли
}

const props = withDefaults(defineProps<Props>(), {
  assignments: () => [],
})

// Нормализуем assignments к единому формату ProductAssignment
const normalizedAssignments = computed(() => {
  if (!props.assignments) return []

  return props.assignments.map((item) => {
    // Если это уже ProductAssignment
    if ('role_type' in item) {
      return item as ProductAssignment
    }

    // Если это User, преобразуем в ProductAssignment
    const user = item as User
    return {
      id: 0,
      role_type: props.roleType || '',
      user: user,
      user_id: user.id,
    } as ProductAssignment
  })
})

// Показываем ВСЕ назначения (и активные, и неактивные)
const activeAssignments = computed(() => {
  return normalizedAssignments.value.filter((assignment) => {
    // Показываем все назначения, которые имеют пользователя
    return assignment.user
  })
})
</script>
