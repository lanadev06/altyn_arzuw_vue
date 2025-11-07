<template>
  <div class="min-h-screen w-full flex">
    <Sidebar class="fixed left-0 top-0 bottom-0 z-20 w-48" />
    <div class="flex-1 flex flex-col min-h-screen">
      <Navbar class="fixed top-0 left-48 right-0 z-30" @search="onSearch" @logout="handleLogout" />
      <main
        class="flex-1 flex flex-col h-[calc(100vh-4rem)] min-h-0 mt-16 overflow-auto p-5 pl-52 bg-gray-200"
      >
        <slot :search="search" />
      </main>
    </div>
  </div>

  <Teleport to="body">
    <OrderDetailsModal
      v-if="orderModalOrderId"
      :order-id="orderModalOrderId"
      :error-msg="orderModalErrorMsg"
      @close="handleGlobalOrderModalClose"
      @updated="handleGlobalOrderModalUpdated"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import { authApi } from '../../services/api'
import { useGlobalNotifications } from '../../composables/useGlobalNotifications'
import { useOrderModal } from '../../stores/orderModal'

const OrderDetailsModal = defineAsyncComponent(() => import('../orders/OrderList/OrderDetailsModal.vue'))

defineOptions({
  name: 'Layout'
})

// Инициализируем глобальную обработку уведомлений
useGlobalNotifications()

const search = ref('')
function onSearch(value: string) {
  search.value = value
}

const router = useRouter()
const route = useRoute()
const orderModal = useOrderModal()

const orderModalOrderId = computed(() => orderModal.orderId.value)
const orderModalErrorMsg = computed(() => orderModal.errorMsg.value)

function syncQueryToModal(orderParam: unknown) {
  const value = Array.isArray(orderParam) ? orderParam[0] : orderParam
  if (typeof value === 'string' && value !== '') {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) {
      orderModal.open(id)
      return
    }
  }
  orderModal.close()
}

watch(
  () => route.query.order,
  (orderParam) => {
    syncQueryToModal(orderParam)
  },
  { immediate: true },
)

function clearOrderQuery() {
  if (!('order' in route.query)) {
    return
  }
  const nextQuery = { ...route.query }
  delete nextQuery.order
  router.replace({ query: nextQuery }).catch(() => {
    // игнорируем ошибки навигации
  })
}

function handleGlobalOrderModalClose() {
  orderModal.close()
  clearOrderQuery()
}

function handleGlobalOrderModalUpdated() {
  orderModal.markUpdated()
}

async function handleLogout() {
  try {
    await authApi.logout()
    router.push('/login')
  } catch {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>
