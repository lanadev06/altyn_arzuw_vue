<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ order ? 'Редактировать заказ' : 'Создать заказ' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Проект *</label>
        <Vue3Select
          class="text-gray-700"
          v-model="form.project_id"
          :options="projects"
          label="title"
          :reduce="reduceProject"
          placeholder="Выберите проект"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.project_id" class="text-red-600 text-sm mt-1">
          {{ errors.project_id }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Продукт *</label>
        <Vue3Select
          class="text-gray-700"
          v-model="form.product_id"
          :options="products"
          label="name"
          :reduce="reduceProduct"
          placeholder="Выберите продукт"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.product_id" class="text-red-600 text-sm mt-1">
          {{ errors.product_id }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Количество *</label>
        <UIInput
          :model-value="form.quantity"
          @update:model-value="(val: string) => (form.quantity = Number(val))"
          type="number"
          placeholder="Введите количество"
          :error="errors.quantity"
          min="1"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Менеджер</label>
        <Vue3Select
          class="text-gray-700"
          v-model="form.manager_id"
          :options="managers"
          label="name"
          :reduce="reduceManager"
          placeholder="Выберите менеджера"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.manager_id" class="text-red-600 text-sm mt-1">
          {{ errors.manager_id }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
        <flatPickr
          v-model="form.deadline"
          :config="{ enableTime: true, dateFormat: 'Y-m-d H:i', time_24hr: true, allowInput: true }"
          placeholder="Выберите дату и время"
          class="w-full text-gray-700 text-base p-2 border border-gray-300 rounded-md flatpickr-uiinput focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        />
        <div v-if="errors.deadline" class="text-red-600 text-sm mt-1">{{ errors.deadline }}</div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Цена</label>
        <UIInput
          :model-value="form.price"
          @update:model-value="(val: string) => (form.price = Number(val))"
          type="number"
          placeholder="0.00"
          :error="errors.price"
          min="0"
          step="0.01"
        />
      </div>

      <div class="flex gap-3 pt-4">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ order ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton v-if="order" type="button" variant="danger" @click="handleDelete" class="flex-1">
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
import type { Order, OrderForm } from '@/types/order'
import type { Product } from '@/types/product'
import type { User } from '@/types/user'
import { OrderController } from '@/controllers/OrderController'
import { getAllProducts, getAllUsers, getAllProjects } from '@/services/api'

const props = defineProps<{ order?: Order | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { create, update, remove } = OrderController()
const loading = ref(false)
const loadingProducts = ref(false)
const loadingManagers = ref(false)

const products = ref<{ id: number; name: string }[]>([])
const managers = ref<{ id: number; name: string }[]>([])
const projects = ref<{ id: number; title: string }[]>([])

const form = reactive<OrderForm>({
  project_id: 0,
  product_id: 0,
  quantity: 1,
  manager_id: undefined,
  deadline: undefined,
  price: undefined,
})

const errors = reactive({
  project_id: '',
  product_id: '',
  quantity: '',
  manager_id: '',
  deadline: '',
  price: '',
})

const reduceProduct = (product: { id: number; name: string }) => product.id
const reduceManager = (manager: { id: number; name: string }) => manager.id
const reduceProject = (project: { id: number; title: string }) => project.id

onMounted(async () => {
  loadingProducts.value = true
  loadingManagers.value = true

  try {
    const [productsData, managersData, projectsData] = await Promise.all([
      getAllProducts(),
      getAllUsers(),
      getAllProjects(),
    ])

    products.value = productsData.map((p: Product) => ({
      id: p.id,
      name: p.name,
    }))

    managers.value = managersData
      .filter((u: User) => u.role === 'manager')
      .map((u: User) => ({
        id: u.id,
        name: u.name,
      }))

    projects.value = projectsData.map((p: Project) => ({
      id: p.id,
      title: p.title,
    }))
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    loadingProducts.value = false
    loadingManagers.value = false
  }

  if (props.order) {
    Object.assign(form, {
      project_id: props.order.project_id,
      product_id: props.order.product_id,
      quantity: props.order.quantity,
      manager_id: props.order.manager_id || undefined,
      deadline: props.order.deadline || undefined,
      price: props.order.price || undefined,
    })
  }
})

function validateForm() {
  errors.project_id = ''
  errors.product_id = ''
  errors.quantity = ''
  errors.manager_id = ''
  errors.deadline = ''
  errors.price = ''

  let valid = true

  if (!form.project_id || form.project_id <= 0) {
    errors.project_id = 'Проект обязателен'
    valid = false
  }

  if (!form.product_id || form.product_id <= 0) {
    errors.product_id = 'Продукт обязателен'
    valid = false
  }

  if (!form.quantity || form.quantity <= 0) {
    errors.quantity = 'Количество должно быть больше 0'
    valid = false
  }

  if (form.price !== undefined && form.price < 0) {
    errors.price = 'Цена не может быть отрицательной'
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
      deadline: form.deadline
        ? form.deadline instanceof Date
          ? form.deadline.toISOString().slice(0, 16).replace('T', ' ')
          : form.deadline
        : undefined,
    }

    if (props.order?.id) {
      await update(props.order.id, payload)
      emit('submit', { id: props.order.id, ...payload })
    } else {
      const created = await create(payload)
      emit('submit', { id: created.id, ...payload })
    }
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  if (props.order && confirm('Удалить этот заказ?')) {
    remove(props.order.id).then(() => emit('delete', props.order!.id))
  }
}
</script>

<style>
@import 'vue3-select/dist/vue3-select.css';

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
  color: #374151 !important;
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
