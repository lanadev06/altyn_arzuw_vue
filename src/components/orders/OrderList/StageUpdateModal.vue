<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">Обновить статус заказа</h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
        <select
          v-model="form.stage"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Выберите статус</option>
          <option value="draft">Черновик</option>
          <option value="design">Дизайн</option>
          <option value="print">Печать</option>
          <option value="workshop">Цех</option>
          <option value="final">Финальный</option>
          <option value="archived">Архив</option>
          <option value="completed">Завершен</option>
          <option value="cancelled">Отменен</option>
        </select>
        <div v-if="errors.stage" class="text-red-600 text-sm mt-1">{{ errors.stage }}</div>
      </div>

      <div v-if="form.stage === 'cancelled'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Причина отмены *</label>
          <textarea
            v-model="form.reason"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Укажите причину отмены"
            required
          ></textarea>
          <div v-if="errors.reason" class="text-red-600 text-sm mt-1">{{ errors.reason }}</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Статус причины *</label>
          <select
            v-model="form.reason_status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Выберите статус причины</option>
            <option value="refused">Отказался</option>
            <option value="not_responding">Не отвечает</option>
            <option value="defective_product">Бракованный продукт</option>
          </select>
          <div v-if="errors.reason_status" class="text-red-600 text-sm mt-1">
            {{ errors.reason_status }}
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <UIButton type="submit" :loading="loading" class="flex-1"> Обновить статус </UIButton>
        <UIButton type="button" variant="secondary" @click="$emit('close')" class="flex-1">
          Отмена
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIButton from '@/components/ui/UIButton.vue'
import type { Order, StageUpdateForm } from '@/types/order'
import { OrderController } from '@/controllers/OrderController'

const props = defineProps<{ order: Order | null }>()
const emit = defineEmits(['close', 'submit'])

const { updateStage } = OrderController()
const loading = ref(false)

const form = reactive<StageUpdateForm>({
  stage: 'draft',
  reason: undefined,
  reason_status: undefined,
})

const errors = reactive({
  stage: '',
  reason: '',
  reason_status: '',
})

if (props.order) {
  form.stage = props.order.stage
  form.reason = props.order.reason || undefined
  form.reason_status = props.order.reason_status || undefined
}

function validateForm() {
  errors.stage = ''
  errors.reason = ''
  errors.reason_status = ''

  let valid = true

  if (!form.stage) {
    errors.stage = 'Статус обязателен'
    valid = false
  }

  if (form.stage === 'cancelled') {
    if (!form.reason?.trim()) {
      errors.reason = 'Причина отмены обязательна'
      valid = false
    }

    if (!form.reason_status) {
      errors.reason_status = 'Статус причины обязателен'
      valid = false
    }
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm() || !props.order) return

  loading.value = true
  try {
    const payload = {
      stage: form.stage,
      reason: form.stage === 'cancelled' ? form.reason : undefined,
      reason_status: form.stage === 'cancelled' ? form.reason_status : undefined,
    }

    await updateStage(props.order.id, payload)
    emit('submit', { id: props.order.id, ...payload })
  } finally {
    loading.value = false
  }
}
</script>
