<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ product ? 'Редактировать товар' : 'Создать товар' }}
      </h2>
    </template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Название *</label>
        <UIInput
          v-model="form.name"
          placeholder="Введите название товара"
          :error="errors.name"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дизайнер</label>
        <Vue3Select
          v-model="form.designer_id"
          :options="allDesigners"
          label="name"
          :reduce="(designer) => designer.id"
          placeholder="Выберите дизайнера"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.designer_id" class="text-red-600 text-sm mt-1">
          {{ errors.designer_id }}
        </div>
      </div>

      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            v-model="form.is_workshop_required"
            class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">Требуется цех</span>
        </label>
      </div>

      <div v-if="form.is_workshop_required">
        <label class="block text-sm font-medium text-gray-700 mb-1">Тип цеха</label>
        <Vue3Select
          v-model="form.workshop_type"
          :options="[
            { value: 'montage', label: 'Монтаж' },
            { value: 'binding', label: 'Переплет' },
          ]"
          label="label"
          :reduce="(option) => option.value"
          placeholder="Выберите тип цеха"
          :clearable="true"
          :searchable="true"
        />
        <div v-if="errors.workshop_type" class="text-red-600 text-sm mt-1">
          {{ errors.workshop_type }}
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ product ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton
          v-if="product"
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
import type { Product } from '@/types/product'
import type { Designer } from '@/types/designer'
import { ProductController } from '@/controllers/ProductController'
import { getByRole, createProduct } from '../../../services/api'

const props = defineProps<{ product?: Product | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { update, remove } = ProductController()

const loading = ref(false)
const allDesigners = ref<Designer[]>([])
const errors = reactive({
  name: '',
  designer_id: '',
  workshop_type: '',
})

const form = reactive({
  name: '',
  designer_id: null as number | null,
  is_workshop_required: false,
  workshop_type: null as 'montage' | 'binding' | null,
})

onMounted(async () => {
  try {
    const response = await getByRole('designer')
    allDesigners.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки дизайнеров:', error)
    allDesigners.value = []
  }

  if (props.product) {
    Object.assign(form, {
      name: props.product.name || '',
      designer_id: props.product.designer_id || null,
      is_workshop_required: props.product.is_workshop_required || false,
      workshop_type: props.product.workshop_type || null,
    })
  }
})

function validateForm() {
  errors.name = ''
  errors.designer_id = ''
  errors.workshop_type = ''

  let valid = true
  if (!form.name.trim()) {
    errors.name = 'Название обязательно'
    valid = false
  }

  if (form.is_workshop_required && !form.workshop_type) {
    errors.workshop_type = 'Тип цеха обязателен'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  loading.value = true
  try {
    if (props.product?.id) {
      await update(props.product.id, { ...form })
      emit('submit', { id: props.product.id, ...form })
    } else {
      console.log('CREATE PRODUCT PAYLOAD:', { ...form })
      const created = await createProduct({ ...form })
      emit('submit', created)
      emit('close')
    }
  } catch (error: any) {
    console.error('CREATE PRODUCT ERROR:', error)
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  if (props.product) {
    remove(props.product.id).then(() => {
      emit('delete', props.product!.id)
      emit('close')
    })
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
</style>
