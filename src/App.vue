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
import Toast from './components/ui/Toast.vue'
import { toast } from './stores/toast'
</script>

<style>
html,
body,
#app {
  height: auto;
}
</style>
