<template>
  <nav
    class="h-16 bg-gray-300 border-b border-gray-400 flex items-center justify-between px-6"
  >
    <div class="flex items-center gap-4">
      <div class="text-lg font-semibold text-gray-800">{{ pageTitle }}</div>
      <SearchInput
        v-if="showSearch"
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        class="ml-6"
        @input="handleSearchInput"
      />
    </div>
    <div class="flex items-center gap-2">
      <!-- Debug панель для админа -->
      <button 
        v-if="isAdmin" 
        @click="toggleDebugPanel"
        class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
        title="System Debug Panel"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      </button>
      <NotificationBell :user="currentUser" />
      <UserProfile :user="currentUser" @logout="$emit('logout')" @profile-updated="handleProfileUpdated" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import UserProfile from './UserProfile.vue'
import { authApi } from '../../services/api'
import { useRoute, useRouter } from 'vue-router'
import SearchInput from '../ui/SearchInput.vue'
import NotificationBell from '../ui/NotificationBell.vue'

defineOptions({
  name: 'Navbar'
})

const emit = defineEmits(['logout', 'search'])

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta.title || 'Панель управления')

const currentUser = ref<{
  id?: number
  name: string
  role: string
  image: any
  image_url?: string
  roles?: any[]
  phone?: string
}>({
  id: undefined,
  name: '',
  role: '',
  image: null,
  image_url: null,
  phone: '',
})

// Проверяем, является ли пользователь админом с id=1
const isAdmin = computed(() => {
  return currentUser.value.id === 1
})

const searchQuery = ref('')

const showSearch = computed(() => {
  return ['/orders', '/projects', '/products', '/users', '/clients'].includes(route.path)
})

watch(searchQuery, (val) => {
  if (showSearch.value) {
    router.replace({ query: { ...route.query, search: val || undefined } })
  }
})

const searchPlaceholder = computed(() =>
  route.path === '/users'
    ? 'Поиск по имени или логину...'
    : route.path === '/clients'
      ? 'Поиск по имени клиента...'
      : 'Поиск...',
)

function handleSearchInput() {
  emit('search', searchQuery.value)
}

function handleProfileUpdated(updatedUser: any) {
  // Обновляем данные текущего пользователя
  currentUser.value = {
    ...currentUser.value,
    ...updatedUser
  }
  
  // Сохраняем обновленные данные в localStorage
  localStorage.setItem('user', JSON.stringify(updatedUser))
}

// Функция для переключения debug панели
function toggleDebugPanel() {
  // Отправляем событие для переключения debug панели
  window.dispatchEvent(new CustomEvent('toggle-debug-panel'))
}

onMounted(async () => {
  // Сначала загружаем данные из localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      currentUser.value = {
        id: user.id,
        name: user.name,
        role: user.roles?.[0]?.name || '',
        image: user.image || null,
        image_url: user.image_url || null,
        roles: user.roles || [],
        phone: user.phone || '',
      }
    } catch (parseError) {
    }
  }

  try {
    const response = await authApi.me()

    // Laravel API возвращает данные в формате {data: {...}}
    const user = (response as any).data || response

    currentUser.value = {
      id: user.id,
      name: user.name,
      role: user.roles?.[0]?.name || '',
      image: user.image || null,
      image_url: user.image_url || null,
      roles: user.roles || [],
      phone: user.phone || '',
    }
    // Обновляем localStorage с новыми данными
    localStorage.setItem('user', JSON.stringify(user))
  } catch (e) {
    // Если API не работает, продолжаем использовать данные из localStorage
  }
})

const handleSettings = () => {}
</script>
