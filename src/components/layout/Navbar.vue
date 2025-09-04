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
      <NotificationBell :user="currentUser" />
      <UserProfile :user="currentUser" @logout="$emit('logout')" @settings="handleSettings" />
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
  name: string
  role: string
  image: unknown
  roles?: unknown[]
}>({
  name: '',
  role: '',
  image: null,
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

onMounted(async () => {
  // Сначала загружаем данные из localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      currentUser.value = {
        name: user.name,
        role: user.roles?.[0]?.name || '',
        image: user.image || null,
        roles: user.roles || [],
      }
    } catch (parseError) {
      console.error('Failed to parse stored user:', parseError)
    }
  }

  // Затем пытаемся обновить данные через API (в фоне)
  try {
    const response = await authApi.me()

    // Laravel API возвращает данные в формате {data: {...}}
    const user = (response as any).data || response

    currentUser.value = {
      name: user.name,
      role: user.roles?.[0]?.name || '',
      image: user.image || null,
      roles: user.roles || [],
    }
    // Обновляем localStorage с новыми данными
    localStorage.setItem('user', JSON.stringify(user))
  } catch (e) {
    console.error('API call failed:', e)
    // Если API не работает, продолжаем использовать данные из localStorage
  }
})

const handleSettings = () => {}
</script>
