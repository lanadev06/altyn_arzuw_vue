<template>
  <aside
    class="w-64 bg-white bg-opacity-10 backdrop-blur-sm border-r border-white border-opacity-20 flex flex-col py-8 shadow-lg"
  >
    <div class="text-2xl font-bold mb-10 px-8 text-white">Altyn Arzuw</div>
    <nav class="flex flex-col gap-2 px-4 flex-1">
      <router-link
        to="/"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
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
        to="/users"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          ></path>
        </svg>
        <span>Пользователи</span>
      </router-link>

      <router-link
        to="/clients"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span>Клиенты</span>
      </router-link>

      <router-link
        to="/projects"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Проекты</span>
      </router-link>

      <router-link
        to="/products"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span>Товары</span>
      </router-link>

      <router-link
        to="/orders"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
        active-class="bg-white bg-opacity-20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <span>Заказы</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(true)
const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}
</script>
