<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ user ? 'Редактировать пользователя' : 'Добавить пользователя' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
        <UIInput v-model="form.name" placeholder="Введите имя" :error="errors.name" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Логин *</label>
        <UIInput
          v-model="form.username"
          placeholder="Введите логин"
          :error="errors.username"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
        <UIInput v-model="form.phone" placeholder="+7 (999) 123-45-67" :error="errors.phone" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ user ? 'Новый пароль' : 'Пароль *' }}
        </label>
        <UIInput
          v-model="form.password"
          type="password"
          placeholder="Минимум 6 символов"
          :error="errors.password"
          :required="!user"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
        <Vue3Select
          v-model="form.role"
          :options="[
            { value: 'admin', label: 'Администратор' },
            { value: 'manager', label: 'Менеджер' },
            { value: 'designer', label: 'Дизайнер' },
            { value: 'print_operator', label: 'Печатник' },
            { value: 'workshop_worker', label: 'Работник цеха' },
          ]"
          label="label"
          :reduce="(option) => option.value"
          placeholder="Выберите роль"
          :clearable="true"
          :searchable="true"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Фото</label>
        <input
          type="file"
          @change="handleImageChange"
          accept="image/*"
          class="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">Максимум 2MB, JPG, PNG</p>
      </div>

      <div class="flex gap-3 pt-4">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ user ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton v-if="user" type="button" variant="danger" @click="handleDelete" class="flex-1">
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

const props = defineProps<{
  user?: any
}>()

const emit = defineEmits(['close', 'submit', 'delete'])

const loading = ref(false)
const errors = reactive({
  name: '',
  username: '',
  phone: '',
  password: '',
  role: '',
})

const form = reactive({
  name: '',
  username: '',
  phone: '',
  password: '',
  role: '',
  image: null as File | null,
})

onMounted(() => {
  if (props.user) {
    form.name = props.user.name || ''
    form.username = props.user.username || ''
    form.phone = props.user.phone || ''
    form.role = props.user.role || ''
  }
})

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.image = target.files[0]
  }
}

const validateForm = () => {
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Имя обязательно'
    isValid = false
  }

  if (!form.username.trim()) {
    errors.username = 'Логин обязателен'
    isValid = false
  }

  // Phone validation for Turkmenistan
  if (form.phone && form.phone.trim()) {
    const phoneRegex = /^\+993[-\s]?\d{2}[-\s]?\d{6}$/
    if (!phoneRegex.test(form.phone.trim())) {
      errors.phone = 'Телефон должен быть в формате +993 XX YYYYYY'
      isValid = false
    }
  }

  if (!props.user && !form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  }

  if (form.password && form.password.length < 6) {
    errors.password = 'Пароль должен быть минимум 6 символов'
    isValid = false
  }

  if (!form.role) {
    errors.role = 'Роль обязательна'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  loading.value = true
  try {
    const dataToSend = {
      name: form.name,
      username: form.username,
      phone: form.phone,
      password: form.password,
      role: form.role,
    }
    if (form.image instanceof File) {
      dataToSend.image = form.image
    }
    emit('submit', dataToSend)
  } catch (error) {
    console.error('Ошибка отправки формы:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = () => {
  if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
    emit('delete', props.user.id)
  }
}
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  transition: all 0.15s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #9ca3af;
}
</style>
