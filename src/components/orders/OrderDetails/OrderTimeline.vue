<template>
  <div class="flex-1">
    <div class="flex flex-col gap-4">
      <div
        v-for="log in statusLogs"
        :key="log.id"
        class="flex items-center bg-white rounded-xl shadow p-4 border border-gray-100 min-h-[48px]"
      >
        <div class="flex-1 flex flex-row items-center gap-2">
          <span class="font-medium text-gray-500 text-sm">Стадия изменена</span>
          <span class="text-xs text-gray-300">{{ formatTime(log.changed_at) }}</span>
          <span
            class="inline-block px-3 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
            >{{ getStatusText(log.from_status) }}</span
          >
          <span class="text-base text-gray-300">→</span>
          <span
            class="inline-block px-3 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
            >{{ getStatusText(log.to_status) }}</span
          >
          <span class="text-xs text-gray-300 ml-2"
            >{{ log.user?.name
            }}<span
              v-if="log.user?.role"
              class="inline-block rounded px-1 py-0.5 text-xs font-semibold ml-1"
              :style="getRoleBadgeStyle(log.user.role)"
            >
              {{ getRoleLabel(log.user.role) }}</span
            ></span
          >
        </div>
        <div class="ml-3 flex-shrink-0">
          <div
            class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-semibold text-xs"
          >
            {{ log.user?.name ? log.user.name[0] : '?' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusLog, Role, Stage } from '../../../types/orderDetails'

interface Props {
  statusLogs: StatusLog[]
  stages: Stage[]
  roles: Role[]
}

const props = defineProps<Props>()

function formatTime(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getStatusText(stage: string) {
  const stageData = props.stages.find((s) => s.name === stage)
  return stageData?.display_name || stage
}

function getRoleLabel(role: string) {
  // Ищем в динамически загруженных ролях
  const dynamicRole = props.roles.find((r: Role) => r.name === role)
  if (dynamicRole && dynamicRole.display_name) {
    return dynamicRole.display_name
  }

  // Если роль не найдена, возвращаем оригинальное имя
  return role
}

function getRoleBadgeStyle(role: string) {
  // Ищем стадию, которая содержит эту роль
  const stageWithRole = props.stages.find(
    (stage: Stage) => stage.roles && stage.roles.some((r: Role) => r.name === role),
  )

  if (stageWithRole?.color) {
    return {
      backgroundColor: stageWithRole.color,
      color: '#ffffff',
    }
  }

  // Fallback к серому цвету
  return {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }
}


defineOptions({
  name: 'OrderTimeline'
})
</script>
