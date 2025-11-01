<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ category ? t('categories.editCategory') : t('categories.createCategory') }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6 pb-4">
      <!-- Название категории -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('categories.categoryName') }} <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.name"
          :placeholder="t('categories.enterCategoryName')"
          :error="errors.name"
          required
        />
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <UIButton
          type="submit"
          :loading="loading"
          class="flex-1"
          :disabled="!form.name.trim()"
        >
          {{ category ? t('categories.save') : t('categories.create') }}
        </UIButton>

        <UIButton v-if="category && canDelete()" type="button" variant="danger" @click="handleDelete">
          {{ t('categories.delete') }}
        </UIButton>

        <UIButton type="button" variant="secondary" @click="$emit('close')"> {{ t('categories.cancel') }} </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import type { Category, CategoryForm } from '../../../types/category'
import { createCategory, updateCategory, deleteCategory } from '../../../services/api'
import categoryController from '../../../controllers/categoryControllerInstance'
import { toast } from '../../../stores/toast'
import { canDelete } from '../../../utils/permissions'

const { t } = useI18n()

const props = defineProps<{ category?: Category | null }>()
const emit = defineEmits(['close', 'submit', 'delete', 'saved'])

const { update, remove, create } = categoryController

const loading = ref(false)

const errors = reactive({
  name: '',
  general: '',
})

const form = reactive({
  name: '',
})

function validateForm(): boolean {
  // Очищаем ошибки
  errors.name = ''
  errors.general = ''

  let valid = true

  if (!form.name.trim()) {
    errors.name = t('categories.nameRequired')
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    const categoryData = {
      name: form.name,
    } as CategoryForm

    if (props.category?.id) {
      // Обновляем существующую категорию
      await update(props.category.id, categoryData)
    } else {
      // Создаем новую категорию
      await create(categoryData)
    }

    toast.show(`${props.category ? t('categories.categoryUpdated') : t('categories.categoryCreated')} ${t('categories.categorySuccess')}`)
    emit('saved')
    emit('close')
  } catch (error) {
    // Более детальная обработка ошибок сохранения
    let errorMessage = 'Ошибка при сохранении категории'

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Ошибка подключения к серверу при сохранении'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Ошибка авторизации при сохранении'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Доступ запрещен при сохранении'
      } else if (error.message.includes('422') || error.message.includes('Validation')) {
        errorMessage = 'Ошибка валидации данных'
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Ошибка сервера при сохранении'
      } else {
        errorMessage = `Ошибка сохранения: ${error.message}`
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    toast.show(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!props.category) return

  try {
    await remove(props.category.id)
    toast.show(t('categories.categoryDeleted'), 'success')
    emit('delete', props.category.id)
    emit('close')
  } catch (error: any) {
    // Обрабатываем ошибки от сервера
    let message = 'Произошла неизвестная ошибка при удалении категории'

    if (error?.response?.data?.message) {
      // Ошибка от Laravel (например, категория используется в продуктах)
      message = error.response.data.message
    } else if (error.message && error.message.includes('Ошибка удаления категории')) {
      // Если ошибка 404 — категория уже удалена
      toast.show('Категория уже была удалена')
      emit('delete', props.category.id)
      emit('close')
      return
    } else if (error instanceof Error && error.message) {
      message = `Ошибка удаления категории: ${error.message}`
    }

    toast.show(message, 'error')
  }
}

onMounted(() => {
  // Если редактируем категорию
  if (props.category) {
    form.name = props.category.name || ''
  }
})
</script>

