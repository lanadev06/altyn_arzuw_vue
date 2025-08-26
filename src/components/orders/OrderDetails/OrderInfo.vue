<template>
  <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 flex flex-col gap-4">
    <div class="text-2xl font-extrabold text-blue-900 mb-2">Детали заказа</div>
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-base text-gray-800">
        <span class="font-semibold w-28">Кол-во:</span>
        <EditableField
          v-if="order && canCreateEdit()"
          :model-value="order.quantity || 0"
          type="number"
          :min="1"
          :required="true"
          @save="(val) => $emit('update-field', 'quantity', val)"
          class="w-24"
        />
        <span v-else-if="order" class="text-gray-900">{{ order.quantity }}</span>
      </div>
      <div v-if="canViewPrices()" class="flex items-center gap-2 text-base text-gray-800">
        <span class="font-semibold w-28">Общая сумма:</span>
        <EditableField
          v-if="order && canCreateEdit()"
          :model-value="order.price || 0"
          type="number"
          :min="0"
          :required="true"
          @save="(val) => $emit('update-field', 'price', val)"
          class="w-32"
        />
        <span v-else-if="order" class="text-gray-900">{{ order.price }}</span>
        <span class="ml-1">TMT</span>
      </div>
      <div class="flex items-center gap-2 text-base text-gray-800 group">
        <span class="font-semibold w-28">Дедлайн:</span>
        <div class="flex-1">
          <div v-if="!showDeadlineInput" class="flex items-center">
            <span>{{ formatDateTime(order?.deadline) || 'Не установлен' }}</span>
            <button
              v-if="canCreateEdit()"
              @click="startDeadlineEdit"
              class="ml-2 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Изменить дедлайн"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z"
                />
              </svg>
            </button>
          </div>
          <div v-if="showDeadlineInput" class="flex items-center gap-2 mt-1">
            <input
              v-model="tempDeadline"
              type="datetime-local"
              class="w-48 text-gray-900 text-base p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white"
              placeholder="Выберите дату и время"
            />
            <button
              @click="confirmDeadline"
              class="p-1 rounded hover:bg-green-100 text-green-500"
              title="Подтвердить"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              @click="clearDeadline"
              class="p-1 rounded hover:bg-yellow-100 text-yellow-600"
              title="Очистить дедлайн"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              @click="cancelDeadline"
              class="p-1 rounded hover:bg-red-100 text-red-500"
              title="Отмена"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Бейдж архивирования внизу -->
    <div v-if="order?.is_archived && order?.archived_at" class="mt-6 flex items-center justify-end">
      <span
        class="px-3 py-1 rounded-full text-xs font-normal bg-gray-100 text-gray-500 border border-gray-200"
      >
        Архивировано: {{ formatArchiveDate(order.archived_at) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EditableField from '../../ui/EditableField.vue'
import { canCreateEdit, canViewPrices } from '../../../utils/permissions'
import { toast } from '../../../stores/toast'
import type { OrderInfo } from '../../../types/orderDetails'

interface Props {
  order?: OrderInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-field': [field: string, value: unknown]
}>()

const showDeadlineInput = ref(false)
const tempDeadline = ref('')

function startDeadlineEdit() {
  if (!props.order) return

  // Преобразуем дату в формат для input type="datetime-local" (YYYY-MM-DDTHH:mm)
  if (props.order.deadline) {
    const date = new Date(props.order.deadline)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      tempDeadline.value = `${year}-${month}-${day}T${hours}:${minutes}`
    } else {
      tempDeadline.value = ''
    }
  } else {
    tempDeadline.value = ''
  }

  showDeadlineInput.value = true
}

async function confirmDeadline() {
  if (!props.order) return

  let deadline = tempDeadline.value

  // Преобразуем строку даты из формата datetime-local в формат для Laravel
  if (deadline && typeof deadline === 'string') {
    // Если строка в формате 'YYYY-MM-DDTHH:mm', преобразуем в 'YYYY-MM-DD HH:mm:ss'
    if (deadline.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      deadline = deadline.replace('T', ' ') + ':00'
    }
  }

  try {
    emit('update-field', 'deadline', deadline || null)
    showDeadlineInput.value = false
    toast.show('Дедлайн обновлен успешно!')
  } catch (error) {
    console.error('Ошибка обновления дедлайна:', error)
    toast.show('Ошибка при обновлении дедлайна', 'error')
  }
}

async function clearDeadline() {
  if (!props.order) return

  try {
    emit('update-field', 'deadline', null)
    showDeadlineInput.value = false
    tempDeadline.value = ''
    toast.show('Дедлайн очищен!')
  } catch (error) {
    console.error('Ошибка очистки дедлайна:', error)
    toast.show('Ошибка при очистке дедлайна', 'error')
  }
}

function cancelDeadline() {
  showDeadlineInput.value = false
  tempDeadline.value = ''
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatArchiveDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
