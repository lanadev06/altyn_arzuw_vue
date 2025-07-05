<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ project ? 'Редактировать проект' : 'Создать проект' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Название *</label>
        <UIInput
          :model-value="form.title ?? ''"
          @update:model-value="(val: string) => (form.title = val)"
          placeholder="Введите название"
          :error="errors.title"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
        <Vue3Select
          class="text-gray-700"
          v-model="form.client_id"
          :options="clients"
          label="name"
          :reduce="reduceClient"
          placeholder="Выберите клиента"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.client_id" class="text-red-600 text-sm mt-1">{{ errors.client_id }}</div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
        <flatPickr
          v-model="form.deadline"
          :config="{ enableTime: true, dateFormat: 'Y-m-d H:i', time_24hr: true, allowInput: true }"
          placeholder="Выберите дату и время"
          class="w-full text-gray-700 text-base  p-2 border border-gray-300 rounded-md flatpickr-uiinput focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        />
        <div v-if="errors.deadline" class="text-red-600 text-sm mt-1">{{ errors.deadline }}</div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Сумма к оплате</label>
        <UIInput
          class="text-gray-700"
          type="number"
          :model-value="form.total_price"
          @update:model-value="(val: string) => (form.total_price = val)"
          placeholder="0.00"
          :error="errors.total_price"
          min="0"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Оплачено</label>
        <UIInput
          class="text-gray-700"
          type="number"
          :model-value="form.payment_amount"
          @update:model-value="(val: string) => (form.payment_amount = val)"
          placeholder="0.00"
          :error="errors.payment_amount"
          min="0"
        />
      </div>

      <div class="flex gap-3 pt-4">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ project ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton
          v-if="project"
          type="button"
          variant="danger"
          @click="handleDelete"
          class="flex-1"
        >
          Удалить
        </UIButton>
        <UIButton v-else type="button" variant="secondary" @click="$emit('close')" class="flex-1">
          Отмена
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIButton from '@/components/ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import type { Project } from '@/types/project'
import type { Client } from '@/types/client'
import { ProjectController } from '@/controllers/ProjectController'
import { getAllClients } from '@/services/api'

const props = defineProps<{ project?: Project | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { create, update, remove } = ProjectController()
const loading = ref(false)
const loadingClients = ref(false)

const clients = ref<{ id: number; name: string }[]>([])

const form = reactive({
  title: '',
  client_id: undefined as number | undefined,
  deadline: null as Date | null,
  total_price: '',
  payment_amount: '',
})

const errors = reactive({
  title: '',
  client_id: '',
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
      client_id: props.project.client_id ? Number(props.project.client_id) : undefined,
      deadline: props.project.deadline ? new Date(props.project.deadline) : null,
      total_price: props.project.total_price != null ? String(props.project.total_price) : '',
      payment_amount:
        props.project.payment_amount != null ? String(props.project.payment_amount) : '',
    })
  }
})

function validateForm() {
  errors.title = ''
  errors.client_id = ''
  errors.total_price = ''
  errors.payment_amount = ''
  errors.deadline = ''

  let valid = true

  if (!form.title?.trim()) {
    errors.title = 'Название обязательно'
    valid = false
  }

  if (form.client_id === undefined || form.client_id === null) {
    errors.client_id = 'Клиент обязателен'
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
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      ...form,
      total_price: form.total_price ? Number(form.total_price) : null,
      payment_amount: form.payment_amount ? Number(form.payment_amount) : null,
      deadline: form.deadline
        ? form.deadline instanceof Date
          ? form.deadline.toISOString().slice(0, 16).replace('T', ' ')
          : form.deadline
        : null,
    }

    if (props.project?.id) {
      await update(props.project.id, payload)
      emit('submit', { id: props.project.id, ...payload })
    } else {
      const created = await create(payload)
      emit('submit', { id: created.id, ...payload })
    }
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  if (props.project && confirm('Удалить проект?')) {
    remove(props.project.id).then(() => emit('delete', props.project!.id))
  }
}
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
