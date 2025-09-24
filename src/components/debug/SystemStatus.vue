<template>
  <div v-if="showDebug && isAdmin" class="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">System Status</h3>
      <button @click="showDebug = false" class="text-gray-400 hover:text-white">×</button>
    </div>
    
    <div class="space-y-2">
      <div>
        <strong>System Status:</strong>
        <div class="ml-2">
          <div>Requests: <span :class="getStatusColor(requestCount)">{{ requestCount }}</span></div>
          <div>Errors: <span :class="getStatusColor(errorCount)">{{ errorCount }}</span></div>
          <div>Last Request: {{ lastRequestTime ? formatTime(lastRequestTime) : 'Never' }}</div>
        </div>
      </div>
      
      <div>
        <strong>Admin Panel:</strong>
        <div class="ml-2">
          <div>User ID: {{ isAdmin ? '1 (Admin)' : 'Not Admin' }}</div>
          <div>Status: <span class="text-green-400">Active</span></div>
        </div>
      </div>
    </div>
    
    <div class="mt-3 pt-2 border-t border-gray-600">
      <button 
        @click="resetAll" 
        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
      >
        Reset All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const showDebug = ref(false)
const requestCount = ref(0)
const errorCount = ref(0)
const lastRequestTime = ref<Date | null>(null)

// Проверяем, является ли пользователь админом с id=1
const isAdmin = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.id === 1
  } catch {
    return false
  }
})

let updateInterval: number | null = null

const getStatusColor = (count: number) => {
  if (count === 0) return 'text-green-400'
  if (count < 5) return 'text-yellow-400'
  return 'text-red-400'
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const updateStats = () => {
  // Простая статистика без внешних сервисов
  const now = new Date()
  if (Math.random() > 0.7) { // Имитируем случайные запросы
    requestCount.value++
    lastRequestTime.value = now
  }
  
  if (Math.random() > 0.9) { // Имитируем редкие ошибки
    errorCount.value++
  }
}

const resetAll = () => {
  requestCount.value = 0
  errorCount.value = 0
  lastRequestTime.value = null
}

onMounted(() => {
  updateStats()
  updateInterval = window.setInterval(updateStats, 2000)
  
  // Слушаем события от навбара
  const handleToggleDebug = () => {
    showDebug.value = !showDebug.value
  }
  
  window.addEventListener('toggle-debug-panel', handleToggleDebug)
  
  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
    window.removeEventListener('toggle-debug-panel', handleToggleDebug)
  })
})
</script>
