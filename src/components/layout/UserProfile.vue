<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
    >
      <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.name"
          class="w-8 h-8 rounded-full object-cover"
        />
        <span v-else class="text-white text-sm font-medium">
          {{ user.name.charAt(0).toUpperCase() }}
        </span>
      </div>
      <div class="text-left">
        <p class="text-white text-sm font-medium">{{ user.name }}</p>
        <p class="text-blue-100 text-xs">{{ user.role }}</p>
      </div>
      <svg
        class="w-4 h-4 text-white transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>

    <div
      v-if="isDropdownOpen"
      class="absolute right-0 top-full mt-2 w-48 bg-white bg-opacity-95 rounded-lg shadow-lg border border-white border-opacity-20 py-2 z-50"
    >
      <div class="px-4 py-3 border-b border-gray-200 border-opacity-20">
        <p class="text-gray-900 text-sm font-medium">{{ user.name }}</p>
        <p class="text-blue-600 text-xs">{{ user.role }}</p>
      </div>

      <div class="py-1">
        <button
          @click="handleSettings"
          class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          Настройки
        </button>
      </div>

      <div class="border-t border-gray-200 border-opacity-20 pt-1">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Выйти
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      name: 'Пользователь',
      role: 'Пользователь',
      avatar: null,
    }),
  },
})

const emit = defineEmits(['logout', 'settings'])

const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleLogout = () => {
  isDropdownOpen.value = false
  emit('logout')
}

const handleSettings = () => {
  isDropdownOpen.value = false
  emit('settings')
}

const closeDropdown = (event) => {
  if (!event.target.closest('.relative')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>
