<template>
  <div class="relative" ref="rootRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
    >
      <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
        <img
          v-if="userImageUrl"
          :src="userImageUrl"
          :alt="safeUser.name"
          class="w-8 h-8 rounded-full object-cover"
        />
        <span v-else class="text-white text-sm font-medium">
          {{ safeUser.name ? safeUser.name.charAt(0).toUpperCase() : '?' }}
        </span>
      </div>
      <div class="text-left">
        <p class="text-white text-sm font-medium">{{ safeUser.name || 'Загрузка...' }}</p>
        <p class="text-blue-100 text-xs">
          <template v-if="safeUser.roles && safeUser.roles.length">
            <span
              v-for="role in safeUser.roles"
              :key="role.id"
              class="inline-block bg-blue-200 text-blue-800 rounded px-2 py-0.5 mr-1"
            >
              {{ role.display_name || role.name }}
            </span>
          </template>
          <template v-else>
            {{ safeUser.role }}
          </template>
        </p>
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
        <p class="text-gray-900 text-sm font-medium">{{ safeUser.name || 'Загрузка...' }}</p>
        <p class="text-blue-600 text-xs">
          <template v-if="safeUser.roles && safeUser.roles.length">
            <span
              v-for="role in safeUser.roles"
              :key="role.id"
              class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1"
            >
              {{ role.display_name || role.name }}
            </span>
          </template>
          <template v-else>
            {{ safeUser.role }}
          </template>
        </p>
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { API_CONFIG } from '../../config/api'

defineOptions({
  name: 'UserProfile'
})

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      name: '',
      role: '',
      image: null,
      roles: [],
    }),
  },
})

const emit = defineEmits(['logout'])

// Ensure we always have a safe user object
const safeUser = computed(() => ({
  name: props.user?.name || '',
  role: props.user?.role || '',
  image: props.user?.image || null,
  roles: props.user?.roles || [],
}))

const isDropdownOpen = ref(false)
const rootRef = ref<HTMLElement>()
const userImageUrl = ref('')

const getUserImageUrl = (user: { image_url?: string; image?: string }) => {
  if (user.image_url) return user.image_url
  if (user.image && user.image.startsWith('http')) return user.image
  if (user.image) return `http://localhost:8000/storage/${user.image}`
  return ''
}

const loadUserImageUrl = () => {
  if (safeUser.value) {
    const url = getUserImageUrl(safeUser.value)
    userImageUrl.value = url
  } else {
    userImageUrl.value = ''
  }
}

watch(() => safeUser.value, loadUserImageUrl, { immediate: true })

onMounted(() => {
  loadUserImageUrl()
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleLogout = () => {
  isDropdownOpen.value = false
  emit('logout')
}

const closeDropdown = (event: MouseEvent) => {
  if (isDropdownOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
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
