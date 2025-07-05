<template>
  <nav
    class="h-16 bg-white bg-opacity-10 backdrop-blur-sm border-b border-white border-opacity-20 flex items-center justify-between px-6"
  >
    <div class="flex items-center gap-4">
      <div class="text-lg font-semibold text-white">{{ pageTitle }}</div>
      <SearchInput
        v-if="showSearch"
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        class="ml-6"
        @input="handleSearchInput"
      />
    </div>
    <UserProfile :user="currentUser" @logout="$emit('logout')" @settings="handleSettings" />
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import UserProfile from './UserProfile.vue'
import { authApi } from '@/services/api'
import { useRoute } from 'vue-router'
import SearchInput from '@/components/ui/SearchInput.vue'

const emit = defineEmits(['logout', 'search'])

const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'Панель управления')

const currentUser = ref({
  name: '',
  role: '',
  avatar: null,
})

const searchQuery = ref('')

const showSearch = computed(() => ['/users', '/clients'].includes(route.path))
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
  try {
    const user = await authApi.me()
    currentUser.value.name = user.name || user.username || ''
    currentUser.value.role = user.role || ''
    currentUser.value.avatar = user.image || null
  } catch (e) {
    currentUser.value.name = 'Гость'
    currentUser.value.role = ''
    currentUser.value.avatar = null
  }
})

const handleSettings = () => {
  // console.log('Открыть настройки')
}
</script>
