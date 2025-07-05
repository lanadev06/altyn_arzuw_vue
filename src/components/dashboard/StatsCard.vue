<template>
  <div class="bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-blue-100 text-sm font-medium">{{ title }}</p>
        <p class="text-3xl font-bold text-white">{{ value }}</p>
      </div>
      <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="iconBgClass">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            v-if="icon === 'UsersIcon'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          ></path>
          <path
            v-else-if="icon === 'DocumentIcon'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
          <path
            v-else-if="icon === 'CurrencyIcon'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          ></path>
          <path
            v-else-if="icon === 'UserAddIcon'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          ></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  iconBgClass: {
    type: String,
    default: 'bg-blue-500 bg-opacity-20',
  },
})
</script>
