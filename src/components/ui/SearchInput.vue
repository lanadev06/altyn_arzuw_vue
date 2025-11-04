<template>
  <input
    :value="modelValue"
    @input="handleInput"
    :placeholder="placeholder"
    type="text"
    class="px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    style="min-width: 260px"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  debounceMs?: number
}>()

const emit = defineEmits(['update:modelValue', 'input'])

const debounceMs = props.debounceMs ?? 300
let debounceTimer: number | null = null

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  
  // Обновляем modelValue сразу для синхронизации с формой
  emit('update:modelValue', value)
  
  // Debounce для события input (API запросы)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = window.setTimeout(() => {
    emit('input', value)
  }, debounceMs)
}

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

defineOptions({
  name: 'SearchInput'
})
</script>
