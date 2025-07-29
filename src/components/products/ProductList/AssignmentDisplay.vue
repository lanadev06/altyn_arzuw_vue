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
        <span
          v-if="showStatus && assignment.is_active !== undefined"
          :class="[
            'px-1.5 py-0.5 text-xs rounded-full',
            assignment.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
          ]"
        >
          {{ assignment.is_active ? 'Активен' : 'Неактивен' }}
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
  showStatus?: boolean
  roleType?: string // Для фильтрации по типу роли
}

const props = withDefaults(defineProps<Props>(), {
  assignments: () => [],
  showStatus: false,
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
      is_active: true,
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
