<template>
  <div class="flex justify-end mt-4 pb-7 pr-2 shrink-0">
    <nav class="flex gap-2">
      <button
        @click="$emit('go-to-page', currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 flex items-center"
      >
        ←
      </button>
      <button
        v-for="page in lastPage"
        :key="page"
        @click="$emit('go-to-page', page)"
        :class="[
          'px-3 py-1 rounded-full border',
          page === currentPage
            ? 'border-blue-600 bg-blue-600 text-white font-bold shadow'
            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100',
        ]"
      >
        {{ page }}
      </button>
      <button
        @click="$emit('go-to-page', currentPage + 1)"
        :disabled="currentPage === lastPage"
        class="px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 flex items-center"
      >
        →
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  lastPage: number
}>()
defineEmits<{
  'go-to-page': [page: number]
}>()
</script>
