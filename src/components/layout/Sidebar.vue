<template>
  <aside
    class="border-r border-gray-400 flex flex-col py-8 shadow-lg bg-gray-300"
  >
    <div
      v-if="logoLoading"
      class="mx-auto mb-10 max-w-[150px] w-40 h-24 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
    </div>
    <img
      v-else
      :src="logoUrl"
      alt="Altyn-Arzuw Logo"
      class="mx-auto mb-10 max-w-[150px] w-40 h-auto"
      @error="handleLogoError"
    />
    <nav class="flex flex-col gap-2 px-4 flex-1">
      <router-link
        to="/"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          ></path>
        </svg>
        <span>Главная</span>
      </router-link>

      <router-link
        v-if="canViewAllUsers()"
        to="/users"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          ></path>
        </svg>
        <span>Сотрудники</span>
      </router-link>

      <router-link
        v-if="canViewAllClients()"
        to="/clients"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span>Клиенты</span>
      </router-link>

      <router-link
        to="/projects"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>{{ getNavigationText('projects') }}</span>
      </router-link>

      <router-link
        to="/products"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span>{{ getNavigationText('products') }}</span>
      </router-link>

      <router-link
        v-if="canViewOrders()"
        to="/orders"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <span>{{ getNavigationText('orders') }}</span>
      </router-link>

      <router-link
        v-if="canViewAuditLogs()"
        to="/audit-logs"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Действия</span>
      </router-link>

      <router-link
        v-if="canViewStages()"
        to="/stages"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>Стадии</span>
      </router-link>

      <router-link
        v-if="canViewRoles()"
        to="/roles"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <span>Роли</span>
      </router-link>

      <router-link
        v-if="canViewCategories()"
        to="/categories"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors text-gray-800"
        active-class="bg-gray-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <span>Категории</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  canViewAllUsers,
  canViewAllClients,
  canViewAuditLogs,
  canViewStages,
  canViewRoles,
  canViewCategories,
  canViewOrders,
  getNavigationText,
} from '../../utils/permissions'
import { useLogo } from '@/composables/useLogo'

defineOptions({
  name: 'Sidebar'
})

// Используем composable для логотипа
const { logoDataUrl, isLoading: logoLoading } = useLogo()

// Получаем URL логотипа
const logoUrl = ref(logoDataUrl.value || '/logo.svg')

// Обработчик ошибки загрузки логотипа
const handleLogoError = () => {
  // При ошибке загрузки основного логотипа, используем fallback
  logoUrl.value = '/logo.svg'
}
</script>
