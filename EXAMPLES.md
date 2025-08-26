# 📚 Примеры использования - Alytn Arzuw Frontend

Практические примеры использования компонентов, API и утилит в проекте.

## 🧩 Компоненты

### Создание модального окна

```vue
<template>
  <Modal
    :visible="showModal"
    title="Создать заказ"
    @close="showModal = false"
  >
    <OrderForm
      :order="orderData"
      @submit="handleSubmit"
      @cancel="showModal = false"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import OrderForm from '@/components/orders/OrderForm.vue'

const showModal = ref(false)
const orderData = ref({})

const handleSubmit = (data: any) => {
  console.log('Новый заказ:', data)
  showModal.value = false
}
</script>
```

### Использование Toast уведомлений

```vue
<template>
  <button @click="showSuccessToast">Показать успех</button>
  <button @click="showErrorToast">Показать ошибку</button>
</template>

<script setup lang="ts">
import { useToast } from '@/stores/toast'

const toast = useToast()

const showSuccessToast = () => {
  toast.show('Операция выполнена успешно!', 'success')
}

const showErrorToast = () => {
  toast.show('Произошла ошибка!', 'error')
}
</script>
```

### Адаптивная таблица

```vue
<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white border border-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th 
            v-for="column in columns" 
            :key="column.key"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr 
          v-for="item in items" 
          :key="item.id"
          class="hover:bg-gray-50"
        >
          <td 
            v-for="column in columns" 
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            <slot :name="column.key" :item="item" :column="column">
              {{ item[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface Props {
  columns: Column[]
  items: any[]
}

defineProps<Props>()
</script>
```

## 🔌 API интеграция

### Загрузка данных с обработкой ошибок

```typescript
// composables/useApi.ts
import { ref, onMounted } from 'vue'
import { getOrders } from '@/services/api'
import type { Order, PaginatedResponse } from '@/types/api'

export function useOrders() {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref('')
  const pagination = ref<PaginatedResponse<Order> | null>(null)

  const fetchOrders = async (params = {}) => {
    try {
      loading.value = true
      error.value = ''
      
      const response = await getOrders(params)
      orders.value = response.data
      pagination.value = response
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки заказов'
      console.error('API Error:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchOrders()
  })

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders
  }
}
```

### Создание заказа с валидацией

```typescript
// composables/useOrderForm.ts
import { ref, computed } from 'vue'
import { createOrder, updateOrder } from '@/services/api'
import type { CreateOrderData, UpdateOrderData, Order } from '@/types/api'

export function useOrderForm(order?: Order) {
  const formData = ref<CreateOrderData>({
    client_id: order?.client_id || 0,
    product_id: order?.product_id || 0,
    quantity: order?.quantity || 1,
    deadline: order?.deadline || '',
    price: order?.price || 0
  })

  const loading = ref(false)
  const error = ref('')

  const isEdit = computed(() => !!order)

  const isValid = computed(() => {
    return formData.value.client_id > 0 && 
           formData.value.product_id > 0 && 
           formData.value.quantity > 0
  })

  const submit = async () => {
    if (!isValid.value) {
      error.value = 'Пожалуйста, заполните все обязательные поля'
      return
    }

    try {
      loading.value = true
      error.value = ''

      if (isEdit.value && order) {
        await updateOrder(order.id, formData.value as UpdateOrderData)
      } else {
        await createOrder(formData.value)
      }

      // Успешное создание/обновление
      return true
    } catch (err: any) {
      error.value = err.message || 'Ошибка сохранения заказа'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    formData,
    loading,
    error,
    isValid,
    isEdit,
    submit
  }
}
```

### Обработка пагинации

```typescript
// composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(totalItems: number, perPage: number = 20) {
  const currentPage = ref(1)
  
  const totalPages = computed(() => Math.ceil(totalItems / perPage))
  
  const startIndex = computed(() => (currentPage.value - 1) * perPage)
  const endIndex = computed(() => Math.min(startIndex.value + perPage, totalItems))
  
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)
  
  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }
  
  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage
  }
}
```

## 🎨 Стилизация

### Динамические цвета для стадий

```vue
<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="stage in stages"
      :key="stage.name"
      :class="getStageClasses(stage.name)"
      :style="getStageStyles(stage.name)"
    >
      {{ stage.display_name }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { getContrastColor } from '@/utils/stageColors'

const stages = [
  { name: 'draft', display_name: 'Черновик' },
  { name: 'design', display_name: 'Дизайн' },
  { name: 'print', display_name: 'Печать' },
  { name: 'completed', display_name: 'Завершён' }
]

const getStageClasses = (stageName: string) => {
  const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'
  
  switch (stageName) {
    case 'draft':
      return `${baseClasses} bg-gray-100 text-gray-800`
    case 'design':
      return `${baseClasses} bg-blue-100 text-blue-800`
    case 'print':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

const getStageStyles = (stageName: string) => {
  // Можно добавить дополнительные стили
  return {}
}
</script>
```

### Адаптивная сетка

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div 
      v-for="item in items" 
      :key="item.id"
      class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ item.title }}
      </h3>
      <p class="text-gray-600 text-sm">
        {{ item.description }}
      </p>
      <div class="mt-4 flex justify-between items-center">
        <span class="text-blue-600 font-medium">
          {{ item.price }} TMT
        </span>
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Подробнее
        </button>
      </div>
    </div>
  </div>
</template>
```

## 🔒 Безопасность и разрешения

### Проверка разрешений

```vue
<template>
  <div>
    <!-- Показываем только авторизованным пользователям -->
    <div v-if="canViewAllOrders()" class="mb-4">
      <h2 class="text-xl font-bold">Все заказы</h2>
      <OrderList />
    </div>
    
    <!-- Показываем только пользователям с правами на создание -->
    <div v-if="canCreateEdit()" class="mb-4">
      <button 
        @click="showCreateModal = true"
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Создать заказ
      </button>
    </div>
    
    <!-- Показываем только администраторам -->
    <div v-if="isAdmin()" class="mb-4">
      <h3 class="text-lg font-semibold">Административные функции</h3>
      <AdminPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { canViewAllOrders, canCreateEdit, isAdmin } from '@/utils/permissions'
import OrderList from '@/components/orders/OrderList.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'

const showCreateModal = ref(false)
</script>
```

### Защищенные маршруты

```typescript
// router/guards.ts
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { checkAuthStatus, getCurrentUser } from '@/utils/auth'

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const requiresAuth = to.meta.requiresAuth
  const requiredRoles = to.meta.roles as string[]
  
  if (requiresAuth && !checkAuthStatus()) {
    // Перенаправляем на страницу входа
    next('/login')
    return
  }
  
  if (requiredRoles && requiredRoles.length > 0) {
    const user = getCurrentUser()
    const hasRequiredRole = user?.roles?.some(role => 
      requiredRoles.includes(role.name)
    )
    
    if (!hasRequiredRole) {
      // Перенаправляем на страницу 403
      next('/403')
      return
    }
  }
  
  next()
}
```

## 📱 Адаптивность

### Responsive компонент

```vue
<template>
  <div class="container mx-auto px-4">
    <!-- Мобильная версия -->
    <div class="block md:hidden">
      <div class="space-y-4">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="bg-white rounded-lg p-4 shadow"
        >
          <h3 class="font-semibold text-lg">{{ item.title }}</h3>
          <p class="text-gray-600 mt-2">{{ item.description }}</p>
          <div class="mt-3 flex justify-between items-center">
            <span class="text-blue-600 font-medium">{{ item.price }} TMT</span>
            <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Действие
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Десктопная версия -->
    <div class="hidden md:block">
      <table class="w-full bg-white rounded-lg shadow overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Название
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Описание
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Цена
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr 
            v-for="item in items" 
            :key="item.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ item.title }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ item.description }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
              {{ item.price }} TMT
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Действие
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

## 🧪 Тестирование

### Unit тест компонента

```typescript
// tests/components/OrderCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import OrderCard from '@/components/orders/OrderCard.vue'

describe('OrderCard', () => {
  const mockOrder = {
    id: 1,
    title: 'Тестовый заказ',
    status: 'pending',
    price: 1000
  }

  it('отображает информацию о заказе', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })
    
    expect(wrapper.text()).toContain('Тестовый заказ')
    expect(wrapper.text()).toContain('1000')
  })

  it('эмитит событие при клике', async () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrder }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockOrder])
  })
})
```

### Тест API функции

```typescript
// tests/services/api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getOrders } from '@/services/api'

// Мокаем fetch
global.fetch = vi.fn()

describe('API Functions', () => {
  it('getOrders возвращает данные заказов', async () => {
    const mockResponse = {
      data: [
        { id: 1, title: 'Заказ 1' },
        { id: 2, title: 'Заказ 2' }
      ],
      current_page: 1,
      total: 2
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const result = await getOrders({ page: '1' })
    
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders?page=1'),
      expect.any(Object)
    )
  })

  it('getOrders обрабатывает ошибки', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    await expect(getOrders({ page: '1' })).rejects.toThrow('Network error')
  })
})
```

## 🚀 Оптимизация производительности

### Ленивая загрузка компонентов

```typescript
// router/index.ts
import { defineAsyncComponent } from 'vue'

const routes = [
  {
    path: '/orders',
    name: 'Orders',
    component: defineAsyncComponent(() => import('@/views/OrdersView.vue'))
  },
  {
    path: '/clients',
    name: 'Clients',
    component: defineAsyncComponent(() => import('@/views/ClientsView.vue'))
  }
]
```

### Виртуализация списков

```vue
<template>
  <div class="h-96 overflow-auto">
    <div 
      v-for="item in visibleItems" 
      :key="item.id"
      class="p-4 border-b border-gray-200"
      :style="{ height: '60px' }"
    >
      {{ item.title }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  items: any[]
  itemHeight?: number
}>()

const containerHeight = ref(400)
const scrollTop = ref(0)
const itemHeight = props.itemHeight || 60

const visibleItems = computed(() => {
  const startIndex = Math.floor(scrollTop.value / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight.value / itemHeight),
    props.items.length
  )
  
  return props.items.slice(startIndex, endIndex)
})

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

onMounted(() => {
  const container = document.querySelector('.overflow-auto')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  const container = document.querySelector('.overflow-auto')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>
```

---

**Эти примеры демонстрируют лучшие практики разработки на Vue 3 с TypeScript в проекте Alytn Arzuw.**

