<template>
  <Modal @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ project ? 'Редактировать проект' : 'Создать проект' }}
          </h2>
          <p class="text-sm text-gray-600">
            {{ project ? 'Обновите информацию о проекте' : 'Добавьте новый проект в систему' }}
          </p>
        </div>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Основная информация -->
      <div
        class="bg-gray-50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-gray-100"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 group">
          <svg
            class="w-5 h-5 text-purple-600 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Основная информация
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Название проекта <span class="text-red-500">*</span></label
            >
            <UIInput
              :model-value="form.title ?? ''"
              @update:model-value="(val) => (form.title = val ? String(val) : '')"
              placeholder="Введите название проекта"
              :error="errors.title"
              required
              @input="
                () => {
                  if (errors.title) errors.title = ''
                }
              "
              class="transition-all duration-200 hover:shadow-sm focus:shadow-md"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Дедлайн</label>
            <flatPickr
              v-model="form.deadline"
              :config="{
                dateFormat: 'Y-m-d H:i',
                altInput: true,
                altFormat: 'd F Y H:i',
                enableTime: true,
                time_24hr: true,
                allowInput: true,
                clickOpens: true,
                locale: Russian,
              }"
              placeholder="Выберите дату и время дедлайна"
              class="w-full text-gray-900 text-base p-3 border border-gray-300 rounded-lg flatpickr-uiinput focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 hover:shadow-sm focus:shadow-md bg-white"
            />
            <div v-if="errors.deadline" class="text-red-600 text-sm mt-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              {{ errors.deadline }}
            </div>
          </div>
        </div>
      </div>

      <!-- Финансовая информация -->
      <div
        v-if="canViewPrices()"
        class="bg-gray-50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-gray-100"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 group">
          <svg
            class="w-5 h-5 text-green-600 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            ></path>
          </svg>
          Финансовая информация
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Сумма к оплате</label>
            <UIInput
              class="text-gray-700 transition-all duration-200 hover:shadow-sm focus:shadow-md"
              type="number"
              :model-value="form.total_price"
              @update:model-value="(val) => (form.total_price = val ? String(val) : '')"
              placeholder="0.00"
              :error="errors.total_price"
              min="0"
              @input="
                () => {
                  if (errors.total_price) errors.total_price = ''
                }
              "
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Оплачено</label>
            <UIInput
              class="text-gray-700 transition-all duration-200 hover:shadow-sm focus:shadow-md"
              type="number"
              :model-value="form.payment_amount"
              @update:model-value="(val) => (form.payment_amount = val ? String(val) : '')"
              placeholder="0.00"
              :error="errors.payment_amount"
              min="0"
              @input="
                () => {
                  if (errors.payment_amount) errors.payment_amount = ''
                }
              "
            />
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-4 pt-6 border-t border-gray-200">
        <UIButton
          type="submit"
          :loading="loading"
          class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          {{ project ? 'Сохранить изменения' : 'Создать проект' }}
        </UIButton>
        <UIButton
          v-if="project && canDelete()"
          type="button"
          variant="danger"
          @click="handleDelete"
          class="px-6 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Удалить
        </UIButton>
        <UIButton
          v-else
          type="button"
          variant="secondary"
          @click="$emit('close')"
          class="px-6 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Отмена
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import type { Project } from '../../../types/project'
import type { Client } from '../../../types/client'
import projectController from '../../../controllers/projectControllerInstance'
import { getAllClients } from '../../../services/api'
import { toast } from '../../../stores/toast'
import { canViewPrices, canDelete } from '../../../utils/permissions'
import { useEntityEvents } from '../../../composables/useEntityEvents'

const props = defineProps<{ project?: Project | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

// Система событий
const { emitEntityCreated, emitEntityUpdated, emitEntityDeleted } = useEntityEvents()

const loading = ref(false)
const loadingClients = ref(false)

const clients = ref<{ id: number; name: string }[]>([])

const form = reactive({
  title: '',
  deadline: new Date() as Date | null, // По умолчанию сегодняшняя дата
  total_price: '',
  payment_amount: '',
})

const errors = reactive({
  title: '',
  total_price: '',
  payment_amount: '',
  deadline: '',
})

const reduceClient = (client: { id: number; name: string }) => client.id

onMounted(async () => {
  loadingClients.value = true
  const data = await getAllClients()
  clients.value = data.map((c: Client) => ({
    id: c.id,
    name: c.name,
  }))
  loadingClients.value = false

  if (props.project) {
    Object.assign(form, {
      title: props.project.title || '',
      deadline: props.project.deadline ? new Date(props.project.deadline) : new Date(),
      total_price: props.project.total_price != null ? String(props.project.total_price) : '',
      payment_amount:
        props.project.payment_amount != null ? String(props.project.payment_amount) : '',
    })
  } else {
    // Для нового проекта устанавливаем дедлайн на сегодня
    form.deadline = new Date()
  }
})

// Валидация названия
function validateTitle() {
  if (!form.title || !form.title.trim()) {
    errors.title = 'Название обязательно'
  } else {
    errors.title = ''
  }
}

// Валидация общей суммы
function validateTotalPrice() {
  if (form.total_price && Number(form.total_price) < 0) {
    errors.total_price = 'Сумма не может быть отрицательной'
  } else {
    errors.total_price = ''
  }
}

// Валидация оплаченной суммы
function validatePaymentAmount() {
  if (form.payment_amount && Number(form.payment_amount) < 0) {
    errors.payment_amount = 'Оплата не может быть отрицательной'
  } else {
    errors.payment_amount = ''
  }
}

function validateForm() {
  // Очищаем все ошибки
  errors.title = ''
  errors.total_price = ''
  errors.payment_amount = ''
  errors.deadline = ''

  let valid = true

  // Валидация названия - всегда проверяем
  if (!form.title || !form.title.trim()) {
    errors.title = 'Название обязательно'
    valid = false
  }

  if (form.total_price && Number(form.total_price) < 0) {
    errors.total_price = 'Сумма не может быть отрицательной'
    valid = false
  }

  if (form.payment_amount && Number(form.payment_amount) < 0) {
    errors.payment_amount = 'Оплата не может быть отрицательной'
    valid = false
  }

  if (form.deadline && form.deadline instanceof Date && form.deadline < new Date()) {
    errors.deadline = 'Дата не может быть в прошлом'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  // Валидация происходит только в validateForm()
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      ...form,
      total_price: form.total_price ? Number(form.total_price) : 0,
      payment_amount: form.payment_amount ? Number(form.payment_amount) : 0,
      deadline: form.deadline
        ? (() => {
            const d = new Date(form.deadline)
            if (!isNaN(d.getTime())) {
              const pad = (n: number) => n.toString().padStart(2, '0')
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
            }
            return form.deadline
          })()
        : null,
    }

    if (props.project?.id) {
      await projectController.update(props.project.id, payload as Partial<Project>)
      toast.show('Проект успешно обновлён!')
      
      // Отправляем событие обновления
      emitEntityUpdated('project', props.project.id, payload, 'form')
      
      emit('submit', { id: props.project.id, ...payload })
      emit('close')
    } else {
      const created = await projectController.create(payload as Partial<Project>)
      toast.show('Проект успешно создан!')
      const newId = (created as any)?.id || (created as any)?.data?.id
      if (newId) {
        // Отправляем событие создания
        emitEntityCreated('project', newId, payload, 'form')
        emit('submit', { id: newId, ...payload })
      }
      emit('close')
    }
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  if (props.project && confirm('Удалить проект?')) {
    const projectId = props.project.id
    projectController.remove(projectId).then(() => {
      toast.show('Проект удалён!')
      
      // Отправляем событие удаления
      emitEntityDeleted('project', projectId, 'form')
      
      emit('delete', projectId)
      emit('close')
    })
  }
}


defineOptions({
  name: 'ProjectFormModal'
})
</script>

<style>
@import '@vueform/multiselect/themes/default.css';
@import 'vue3-select/dist/vue3-select.css';

/* Компактный dropdown для vue3-select */
.vs__dropdown-menu {
  max-height: 110px !important;
  overflow-y: auto !important;
  padding: 0 !important;
}

.vs__dropdown-menu .vs__dropdown-option,
.vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 24px !important;
  padding: 2px 10px !important;
  font-size: 15px !important;
  line-height: 1.2 !important;
  color: #374151 !important; /* text-gray-700 */
  background: #fff !important;
}

.flatpickr-uiinput .flatpickr-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.flatpickr-uiinput .flatpickr-input:focus {
  outline: none;
  border-color: transparent;
  box-shadow: 0 0 0 2px #3b82f6;
}
:deep(.flatpickr-calendar) {
  left: 60px !important;
}
</style>
