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
      <LanguageSwitcher />
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
import LanguageSwitcher from '../ui/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'Navbar'
})

const emit = defineEmits(['logout', 'search'])

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Маппинг заголовков страниц для переводов
const pageTitleMap: Record<string, string> = {
  'Панель управления': 'navbar.dashboard',
  'Сотрудники': 'common.users',
  'Клиенты': 'common.clients',
  'Проекты': 'common.projects',
  'Товары': 'common.products',
  'Заказы': 'common.orders',
  'Действия': 'common.audit',
    'Управление стадиями': 'common.stages',
    'Управление ролями': 'common.roles',
    'Категории': 'common.categories',
    'Обучение': 'common.training',
    'Вход в систему': 'login.title',
}

const pageTitle = computed(() => {
  const metaTitle = route.meta.title as string
  if (!metaTitle) return t('navbar.dashboard')
  
  // Проверяем, есть ли ключ перевода для этого заголовка
  const translationKey = pageTitleMap[metaTitle]
  if (translationKey) {
    return t(translationKey)
  }
  
  // Если ключа нет, возвращаем как есть (на случай других заголовков)
  return metaTitle
})

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

// Debounce для поиска - избегаем слишком частых обновлений URL
let searchDebounceTimer: number | null = null
watch(searchQuery, (val) => {
  if (showSearch.value) {
    // Очищаем предыдущий таймер
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    
    // Устанавливаем новый таймер для debounce
    searchDebounceTimer = window.setTimeout(() => {
      router.replace({ query: { ...route.query, search: val || undefined } })
    }, 400) // 400ms debounce для поиска
  }
})

const searchPlaceholder = computed(() =>
  route.path === '/users'
    ? t('common.searchByNameOrLogin')
    : route.path === '/clients'
      ? t('common.searchByClientName')
      : t('common.searchPlaceholder'),
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
