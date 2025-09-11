<template>
  <div class="flex-1">
    <!-- Заголовок -->
    <div class="mb-3">
      <h3 class="text-base font-medium text-gray-700">История изменений стадий</h3>
    </div>
    
    <!-- Timeline -->
    <div class="flex flex-col gap-4">
      <div
        v-for="log in statusLogs"
        :key="log.id"
        class="flex items-center bg-white rounded-lg shadow-sm p-3 border border-gray-100 min-h-[48px]"
      >
        <div class="flex-1 flex flex-row items-center gap-3">
          <span class="font-medium text-gray-600 text-sm">Стадия изменена</span>
          <span class="text-xs text-gray-500">{{ formatTime(log.changed_at) }}</span>
          <span
            class="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
            >{{ getStatusText(log.from_status) }}</span
          >
          <span class="text-gray-400 text-sm">→</span>
          <span
            class="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium"
            >{{ getStatusText(log.to_status) }}</span
          >
          <span class="text-xs text-gray-500 ml-2">
            {{ log.user?.name || 'Неизвестно' }}
          </span>
        </div>
        <div class="ml-3 flex-shrink-0">
          <div
            class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-xs"
          >
            {{ log.user?.name ? log.user.name[0] : '?' }}
          </div>
        </div>
      </div>
      
      <!-- Сообщение когда нет логов -->
      <div v-if="statusLogs.length === 0" class="text-center py-4">
        <p class="text-gray-400 text-sm">История изменений стадий пока пуста</p>
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
  
  const dateObj = new Date(date)
  const now = new Date()
  
  // Получаем даты без времени для сравнения
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const logDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
  
  // Если сегодня
  if (logDate.getTime() === today.getTime()) {
    return `Сегодня в ${dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Если вчера
  if (logDate.getTime() === yesterday.getTime()) {
    return `Вчера в ${dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Иначе показываем полную дату и время
  return dateObj.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }) + ' в ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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


</script>
