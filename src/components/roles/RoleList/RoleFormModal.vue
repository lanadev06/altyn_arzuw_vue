<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ role ? 'Редактировать роль' : 'Создать роль' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название роли -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Название роли <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.display_name"
          placeholder="Введите название роли"
          :error="errors.display_name"
          required
        />
      </div>

      <!-- Внутреннее имя -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Внутреннее имя <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.name"
          placeholder="designer, print_operator"
          :error="errors.name"
          :disabled="!!role"
          required
        />
        <p class="text-sm text-gray-500 mt-1">
          Уникальное имя для идентификации роли (только латинские буквы и подчеркивания)
        </p>
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Описание </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Описание роли..."
        ></textarea>
      </div>

      <!-- Стадии для этой роли -->
      <div v-if="props.role && props.role.stages && props.role.stages.length > 0">
        <label class="block text-sm font-medium text-gray-700 mb-2"> Связанные стадии </label>
        <div class="space-y-2">
          <div
            v-for="stage in props.role.stages"
            :key="stage.id"
            class="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-2">
              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: stage.color || '#3b82f6' }"
              ></div>
              <div>
                <span class="font-medium text-gray-900">{{ stage.display_name }}</span>
                <p class="text-sm text-gray-500">{{ stage.description || 'Нет описания' }}</p>
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">Эта роль связана с указанными стадиями</p>
      </div>

      <!-- Кнопки -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ role ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
        <UIButton
          v-if="role && canDelete()"
          type="button"
          variant="danger"
          @click="handleDelete"
          :loading="deleting"
        >
          Удалить
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import type { Role } from '../../../types/role'
import { canDelete } from '../../../utils/permissions'

const props = defineProps<{
  role?: Role | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: any]
  delete: [id: number]
}>()

const loading = ref(false)
const deleting = ref(false)

const errors = reactive({
  name: '',
  display_name: '',
})

const form = reactive({
  name: '',
  display_name: '',
  description: '',
})

// Инициализация формы при редактировании
const initializeForm = () => {
  console.log('🔄 initializeForm вызвана с role:', props.role)
  if (props.role) {
    form.name = props.role.name || ''
    form.display_name = props.role.display_name || ''
    form.description = props.role.description || ''

    // Отладочная информация о стадиях
    console.log('📋 Роль имеет стадии:', props.role.stages)
    console.log('📋 Количество стадий:', props.role.stages?.length || 0)
  } else {
    form.name = ''
    form.display_name = ''
    form.description = ''
  }
}

// Валидация формы
const validateForm = () => {
  errors.name = ''
  errors.display_name = ''

  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Внутреннее имя обязательно'
    valid = false
  } else if (!/^[a-z_]+$/.test(form.name)) {
    errors.name = 'Внутреннее имя должно содержать только латинские буквы и подчеркивания'
    valid = false
  }

  if (!form.display_name.trim()) {
    errors.display_name = 'Название обязательно'
    valid = false
  }

  return valid
}

// Обработка отправки формы
const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const data = {
      name: form.name,
      display_name: form.display_name,
      description: form.description.trim() || null,
    }

    console.log('🔄 Отправка формы с данными:', data)
    emit('submit', data)
  } catch (error) {
    console.error('❌ Error submitting form:', error)
  } finally {
    loading.value = false
  }
}

// Обработка удаления
const handleDelete = async () => {
  if (!props.role?.id) return

  if (!confirm('Вы уверены, что хотите удалить эту роль?')) return

  deleting.value = true
  try {
    console.log('🔄 Удаляем роль:', props.role.id)
    emit('delete', props.role.id)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initializeForm()
})

// Следим за изменениями props.role
watch(
  () => props.role,
  () => {
    initializeForm()
  },
  { immediate: true },
)
</script>
