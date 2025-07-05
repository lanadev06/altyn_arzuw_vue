<template>
  <Layout>
    <main class="overflow-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Всего пользователей"
          :value="stats.users.toString()"
          icon="UsersIcon"
          icon-bg-class="bg-blue-500 bg-opacity-20"
        />
        <StatsCard
          title="Активные проекты"
          :value="stats.orders.toString()"
          icon="DocumentIcon"
          icon-bg-class="bg-green-500 bg-opacity-20"
        />
        <StatsCard
          title="Выручка за месяц"
          :value="
            stats.revenue.toLocaleString('ru-RU', {
              style: 'currency',
              currency: 'TMT',
              maximumFractionDigits: 0,
            })
          "
          icon="CurrencyIcon"
          icon-bg-class="bg-yellow-500 bg-opacity-20"
        />
        <StatsCard
          title="Новые клиенты"
          :value="stats.newClients.toString()"
          icon="UserAddIcon"
          icon-bg-class="bg-purple-500 bg-opacity-20"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <QuickActions />
        <RecentActivity />
      </div>
    </main>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '../components/layout/Layout.vue'
import StatsCard from '../components/dashboard/StatsCard.vue'
import QuickActions from '../components/dashboard/QuickActions.vue'
import RecentActivity from '../components/dashboard/RecentActivity.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { authApi } from '../services/api'

const router = useRouter()

const stats = ref({
  users: 0,
  orders: 0,
  revenue: 0,
  newClients: 0,
})

const staffActivity = ref([])

onMounted(async () => {
  try {
    // Статистика
    const statsRes = await fetch('/api/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        Accept: 'application/json',
      },
    })
    if (statsRes.ok) {
      stats.value = await statsRes.json()
    }
    const activityRes = await fetch('/api/activity', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        Accept: 'application/json',
      },
    })
    if (activityRes.ok) {
      staffActivity.value = await activityRes.json()
    }
  } catch (e) {}
})

const handleLogout = async () => {
  try {
    await authApi.logout()
    router.push('/login')
  } catch (error) {
    console.error('Ошибка выхода:', error)
    // Even if API logout fails, clear local storage and redirect
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>
