<template
  class="relative min-h-screen bg-gray-300 overflow-hidden"
>
  <div id="app">
    <Suspense>
      <RouterView />
      <template #fallback>
        <div class="flex items-center justify-center min-h-screen">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </template>
    </Suspense>
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
import { useLanguage } from './composables/useLanguage'

// Инициализация языка при старте приложения
const { initLocale } = useLanguage()
onMounted(() => {
  initLocale()
})

// Глобальный обработчик unhandledrejection для перехвата 401 ошибок
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error = event.reason

  // Проверяем, если это 401 ошибка
  if (error && typeof error.message === 'string') {
    if (error.message.includes('401') || error.message.includes('Сессия истекла')) {
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
