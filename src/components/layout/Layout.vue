<template>
  <div
    class="flex min-h-screen w-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"
  >
    <div class="absolute inset-0"></div>
    <div class="absolute top-20 right-20 w-32 h-32 bg-white opacity-5 rounded-full"></div>
    <div class="absolute bottom-20 left-20 w-24 h-24 bg-white opacity-10 rounded-full"></div>
    <div class="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-5 rounded-full"></div>
    <div class="absolute top-10 left-10 w-24 h-24 bg-white opacity-10 rounded-full"></div>
    <div class="absolute top-1/3 right-10 w-20 h-20 bg-white opacity-5 rounded-full"></div>
    <div class="absolute bottom-10 right-10 w-28 h-28 bg-white opacity-10 rounded-full"></div>

    <Sidebar />
    <div class="flex-1 flex flex-col relative z-10 h-full min-h-screen">
      <Navbar @search="onSearch" @logout="handleLogout" />
      <main class="flex-1 p-5 flex flex-col h-full min-h-0">
        <slot :search="search" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { authApi } from '@/services/api'

const search = ref('')
function onSearch(value) {
  search.value = value
}

const router = useRouter()
async function handleLogout() {
  try {
    await authApi.logout()
    router.push('/login')
  } catch (error) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>
