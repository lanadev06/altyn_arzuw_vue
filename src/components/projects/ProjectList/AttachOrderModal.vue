<template>
  <Transition name="modal-fade">
    <div
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      @click="emit('close')"
    >
      <Transition name="modal-scale">
        <div
          class="relative w-[600px] max-w-[95vw] bg-white rounded-2xl shadow-2xl p-8"
          @click.stop
        >
          <!-- Кнопка закрытия -->
          <button
            @click="emit('close')"
            class="absolute top-6 right-6 text-3xl text-gray-400 hover:text-red-500 transition font-bold"
          >
            ✕
          </button>

          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Добавить заказ в проект</h2>
            <p class="text-gray-600">Выберите заказы для добавления в проект</p>
          </div>

          <!-- Поиск -->
          <div class="mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по номеру заказа, продукту или клиенту..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          <!-- Информация о выбранных заказах -->
          <div v-if="selectedOrders.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-blue-800">
                Выбрано заказов: {{ selectedOrders.length }}
              </span>
              <button
                @click="clearSelection"
                class="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Очистить выбор
              </button>
            </div>
          </div>

          <!-- Список заказов -->
          <div class="max-h-96 overflow-y-auto mb-6 border border-gray-200 rounded-xl bg-white shadow-sm">
            <div v-if="loading" class="p-8 text-center text-gray-500">
              <div class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Загрузка заказов...
              </div>
            </div>
            <div v-else-if="filteredOrders.length === 0" class="p-8 text-center text-gray-500">
              <div class="text-gray-400 mb-2">
                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              {{ searchQuery ? 'Заказы не найдены' : 'Нет доступных заказов' }}
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="order in filteredOrders"
                :key="order.id"
                class="p-4 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                @click="toggleOrderSelection(order)"
                :class="{ 
                  'bg-blue-100 border-l-4 border-blue-500': isOrderSelected(order.id),
                  'hover:bg-gray-50': !isOrderSelected(order.id)
                }"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 flex-1">
                    <!-- Чекбокс -->
                    <div class="flex-shrink-0">
                      <input
                        type="checkbox"
                        :checked="isOrderSelected(order.id)"
                        @click.stop="toggleOrderSelection(order)"
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    <!-- Информация о заказе -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-blue-600 text-sm">#{{ order.id }}</span>
                        <span
                          v-if="getOrderStage(order)"
                          :class="[
                            'px-2 py-1 rounded-full text-xs font-semibold',
                            getStatusBadge(getOrderStage(order))
                          ]"
                        >
                          {{ getStatusText(getOrderStage(order)) }}
                        </span>
                      </div>
                      <div class="text-sm text-gray-800 font-medium truncate">
                        {{ getOrderProduct(order) || '-' }}
                      </div>
                      <div class="text-xs text-gray-500 truncate">
                        {{ getOrderClient(order) || '—' }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Кнопка выбора -->
                  <button
                    @click.stop="toggleOrderSelection(order)"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                      isOrderSelected(order.id) 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    ]"
                  >
                    {{ isOrderSelected(order.id) ? 'Выбран' : 'Выбрать' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопки -->
          <div class="flex justify-between gap-3">
            <button
              @click="emit('close')"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
            >
              Отмена
            </button>
            
            <div class="flex gap-2">
              <button
                v-if="selectedOrders.length > 0"
                @click="attachSelectedOrders"
                :disabled="attaching"
                class="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <div v-if="attaching" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {{ attaching ? 'Добавляем...' : `Добавить ${selectedOrders.length} заказ${selectedOrders.length > 1 ? 'ов' : ''}` }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { API_CONFIG } from '@/config/api'
import { toast } from '@/stores/toast'

defineOptions({
  name: 'AttachOrderModal'
})

const props = defineProps<{
  projectId?: number
}>()

const emit = defineEmits<{
  close: []
  attach: [orderId: number]
}>()

const orders = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedOrders = ref<number[]>([])
const attaching = ref(false)

const filteredOrders = computed(() => {
  if (!searchQuery.value) return orders.value
  
  const query = searchQuery.value.toLowerCase()
  return orders.value.filter(order => {
    return (
      String(order.id).includes(query) ||
      getOrderProduct(order)?.toLowerCase().includes(query) ||
      getOrderClient(order)?.toLowerCase().includes(query)
    )
  })
})

async function loadOrders() {
  loading.value = true
  try {
    // Загружаем все заказы с правильными отношениями
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders?per_page=1000&admin_view=true&with=product,client,stage`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      const allOrders = Array.isArray(data) ? data : (data.data || [])
      
      // Фильтруем только заказы без проекта (project_id = null или отсутствует)
      orders.value = allOrders.filter((order: any) => !order.project_id)
    }
  } catch (error) {
    console.error('Error loading orders:', error)
    toast.show('Ошибка при загрузке заказов', 'error')
  } finally {
    loading.value = false
  }
}

// Функции для работы с множественным выбором
function toggleOrderSelection(order: any) {
  const index = selectedOrders.value.indexOf(order.id)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(order.id)
  }
}

function isOrderSelected(orderId: number): boolean {
  return selectedOrders.value.includes(orderId)
}

function clearSelection() {
  selectedOrders.value = []
}

async function attachSelectedOrders() {
  if (!props.projectId || selectedOrders.value.length === 0) return
  
  attaching.value = true
  
  try {
    // Привязываем все выбранные заказы
    for (const orderId of selectedOrders.value) {
      const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ project_id: props.projectId })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to attach order ${orderId}`)
      }
    }
    
    toast.show(`Добавлено заказов: ${selectedOrders.value.length}`, 'success')
    emit('close')
  } catch (error) {
    console.error('Ошибка при добавлении заказов:', error)
    toast.show('Ошибка при добавлении заказов', 'error')
  } finally {
    attaching.value = false
  }
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    design: 'bg-blue-100 text-blue-700',
    print: 'bg-yellow-100 text-yellow-700',
    engraving: 'bg-orange-100 text-orange-700',
    workshop: 'bg-purple-100 text-purple-700',
    final: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return badges[status] || 'bg-gray-100 text-gray-700'
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    draft: 'Черновик',
    design: 'Дизайн',
    print: 'Печать',
    engraving: 'Гравировка',
    workshop: 'Цех',
    final: 'Финальный',
    completed: 'Завершён',
    cancelled: 'Отменён',
  }
  return texts[status] || status
}

// Функции для безопасного получения данных заказа
function getOrderProduct(order: any): string {
  if (typeof order.product === 'string') {
    try {
      const parsed = JSON.parse(order.product)
      return parsed?.name || '-'
    } catch {
      return order.product || '-'
    }
  }
  return order.product?.name || '-'
}

function getOrderClient(order: any): string {
  if (typeof order.client === 'string') {
    try {
      const parsed = JSON.parse(order.client)
      return parsed?.name || '-'
    } catch {
      return order.client || '-'
    }
  }
  return order.client?.name || '-'
}

function getOrderStage(order: any): string {
  if (typeof order.stage === 'string') {
    try {
      const parsed = JSON.parse(order.stage)
      return parsed?.name || order.stage
    } catch {
      return order.stage || ''
    }
  }
  return order.stage?.name || order.stage || ''
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.95);
}
</style>


