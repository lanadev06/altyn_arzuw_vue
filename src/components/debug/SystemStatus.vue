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
          <div>Backend: <span :class="getBackendStatusColor()">{{ getBackendStatusText() }}</span></div>
          <div>Circuit Breaker: <span :class="getCircuitBreakerColor()">{{ circuitBreakerState }}</span></div>
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
    
    <div class="mt-3 pt-2 border-t border-gray-600 space-y-2">
      <button 
        @click="resetAll" 
        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs w-full"
      >
        Reset All
      </button>
      <button 
        @click="resetCircuitBreaker" 
        class="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs w-full"
      >
        Reset Circuit Breaker
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Extend Window interface for circuit breaker
declare global {
  interface Window {
    circuitBreaker?: {
      getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN'
      reset(): void
    }
  }
}

const showDebug = ref(false)
const requestCount = ref(0)
const errorCount = ref(0)
const lastRequestTime = ref<Date | null>(null)
const backendStatus = ref<'checking' | 'online' | 'offline'>('checking')
const circuitBreakerState = ref<'CLOSED' | 'OPEN' | 'HALF_OPEN'>('CLOSED')

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

const getBackendStatusColor = () => {
  switch (backendStatus.value) {
    case 'online': return 'text-green-400'
    case 'offline': return 'text-red-400'
    case 'checking': return 'text-yellow-400'
    default: return 'text-gray-400'
  }
}

const getBackendStatusText = () => {
  switch (backendStatus.value) {
    case 'online': return 'Online'
    case 'offline': return 'Offline'
    case 'checking': return 'Checking...'
    default: return 'Unknown'
  }
}

const getCircuitBreakerColor = () => {
  switch (circuitBreakerState.value) {
    case 'CLOSED': return 'text-green-400'
    case 'OPEN': return 'text-red-400'
    case 'HALF_OPEN': return 'text-yellow-400'
    default: return 'text-gray-400'
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const updateStats = async () => {
  // Обновляем состояние circuit breaker
  if (window.circuitBreaker) {
    circuitBreakerState.value = window.circuitBreaker.getState()
  }
  
  // Проверяем статус бэкенда
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    })
    backendStatus.value = response.ok ? 'online' : 'offline'
  } catch (error) {
    backendStatus.value = 'offline'
  }
}

const resetAll = async () => {
  requestCount.value = 0
  errorCount.value = 0
  lastRequestTime.value = null
  
  // Import and use force reset function
  const { forceResetAll } = await import('../../services/api')
  forceResetAll()
  
  // Reset local state
  backendStatus.value = 'checking'
  circuitBreakerState.value = 'CLOSED'
  
  // Show success message
  
  // Reload the page to reset all states
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

const resetCircuitBreaker = () => {
  if (window.circuitBreaker) {
    window.circuitBreaker.reset()
    circuitBreakerState.value = 'CLOSED'
  }
}

onMounted(() => {
  updateStats()
  updateInterval = window.setInterval(updateStats, 30000)
  
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
