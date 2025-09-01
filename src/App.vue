<template
  class="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-hidden"
>
  <div id="app">
    <RouterView />
  </div>
  <Toast
    :message="toast.message?.value || ''"
    :visible="toast.visible?.value || false"
    :type="toast.type?.value || 'success'"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Toast from './components/ui/Toast.vue'
import { toast } from './stores/toast'

// Глобальный обработчик unhandledrejection для перехвата 401 ошибок
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error = event.reason

  // Проверяем, если это 401 ошибка
  if (error && typeof error.message === 'string') {
    if (error.message.includes('401') || error.message.includes('Сессия истекла')) {
      // console.log('🚨 Unhandled 401 error detected')
      event.preventDefault() // Предотвращаем показ ошибки в консоли
      // handle401Error уже вызывается в других местах, здесь просто логируем
    }
  }
}

onMounted(() => {
  // Добавляем глобальный обработчик ошибок
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
})

onUnmounted(() => {
  // Очищаем обработчик при размонтировании
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
})
</script>

<style>
html,
body,
#app {
  height: auto;
}
</style>
