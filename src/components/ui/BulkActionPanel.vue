<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="show"
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border-2 border-blue-500 z-50 min-w-[450px] max-w-[90vw]"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">
            Выбрано: <span class="text-blue-600 font-bold">{{ count }}</span> элемент(ов)
          </p>
          <p class="text-xs text-gray-500">Массовые действия</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="px-6 py-4 flex flex-col sm:flex-row gap-3">
        <!-- Status selector для заказов -->
        <div v-if="showStatusSelector" class="flex flex-col gap-2 flex-1 min-w-0">
          <label class="text-xs font-medium text-gray-600">Изменить статус</label>
          <div class="flex gap-2">
            <select
              v-model="selectedStatus"
              class="flex-1 px-3 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              :disabled="isProcessing"
            >
              <option value="">Выберите статус...</option>
              <option
                v-for="stage in stages"
                :key="stage.id"
                :value="stage.name"
              >
                {{ stage.display_name || stage.name }}
              </option>
            </select>
            
            <button
              v-if="selectedStatus"
              @click="$emit('update-status', selectedStatus)"
              :disabled="isProcessing"
              class="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
            >
              <span v-if="isProcessing" class="animate-spin">⏳</span>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isProcessing ? '...' : 'Применить' }}
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
          <button
            @click="$emit('clear')"
            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Отменить
          </button>
          
          <button
            v-if="showDeleteButton"
            @click="$emit('delete')"
            :disabled="isProcessing"
            class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="isProcessing" class="animate-spin">⏳</span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ isProcessing ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

defineOptions({
  name: 'BulkActionPanel'
})

const props = defineProps<{
  show: boolean
  count: number
  isProcessing?: boolean
  showStatusSelector?: boolean
  showDeleteButton?: boolean
  stages?: Array<{ id: number; name: string; display_name?: string; color?: string }>
}>()

const emit = defineEmits<{
  clear: []
  delete: []
  'update-status': [status: string]
}>()

const selectedStatus = ref('')

// Сброс выбранного статуса при закрытии панели
watch(() => props.show, (newVal) => {
  if (!newVal) {
    selectedStatus.value = ''
  }
})
</script>

<style scoped>
/* Дополнительные стили если нужно */
</style>

