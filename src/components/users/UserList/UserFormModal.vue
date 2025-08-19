<template>
  <Modal @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ user ? 'Редактировать пользователя' : 'Добавить пользователя' }}
          </h2>
          <p class="text-sm text-gray-600">
            {{
              user ? 'Обновите информацию о пользователе' : 'Добавьте нового пользователя в систему'
            }}
          </p>
        </div>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6" enctype="multipart/form-data">
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
        <input
          :value="form.phone"
          @input="handlePhoneChange"
          type="text"
          placeholder="+993 XX YYYYYY"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          :class="{ 'border-red-500 focus:ring-red-500': errors.phone }"
        />
        <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
        <p class="text-xs text-gray-500 mt-1">Формат: +993 XX YYYYYY (например: +993 12 345678)</p>
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
        <label class="block text-sm font-medium text-gray-700 mb-1">Роли *</label>
        <Vue3Select
          v-model="form.roles"
          :options="roleOptions"
          label="label"
          :reduce="(option: any) => option.value"
          placeholder="Выберите роли"
          :clearable="true"
          :searchable="true"
          :multiple="true"
          required
          :z-index="99999"
        />
        <p v-if="errors.roles" class="text-xs text-red-500 mt-1">{{ errors.roles }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Фото</label>
        <input
          type="file"
          @change="handleImageChange"
          accept="image/*"
          class="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          name="image"
          id="image"
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
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIButton from '@/components/ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import { toast } from '@/stores/toast'
import { getRoles } from '@/services/api'

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
  roles: '',
  image: '',
})

const form = reactive({
  name: '',
  username: '',
  phone: '',
  password: '',
  roles: [] as number[],
  image: null as File | null,
})

const allRoles = ref<Array<{ id: number; name: string; display_name?: string }>>([])

onMounted(async () => {
  allRoles.value = await getRoles()
  // Не заполняем форму здесь, чтобы не было проблем при повторном открытии
})

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.name = newUser.name || ''
      form.username = newUser.username || ''
      form.phone = newUser.phone || ''
      form.roles = newUser.roles ? newUser.roles.map((r: any) => Number(r.id)) : []
    } else {
      form.name = ''
      form.username = ''
      form.phone = ''
      form.roles = []
      form.password = ''
      form.image = null
    }
  },
  { immediate: true },
)

const roleOptions = computed(() =>
  allRoles.value.map((r) => ({ value: r.id, label: r.display_name || r.name })),
)

// Функция для форматирования телефона
const formatPhoneNumber = (value: string): string => {
  // Удаляем все символы кроме цифр
  const cleaned = value.replace(/\D/g, '')

  // Если номер начинается с 993, добавляем +
  if (cleaned.startsWith('993')) {
    const rest = cleaned.slice(3)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  // Если номер начинается с 7 или 8 (российский), конвертируем в туркменский
  if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
    const rest = cleaned.slice(1)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  // Если номер начинается с 9 (без кода страны)
  if (cleaned.startsWith('9')) {
    const rest = cleaned.slice(1)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  // Если номер начинается с цифр (код оператора)
  if (cleaned.length <= 2) {
    return `+993 ${cleaned}`
  } else if (cleaned.length <= 8) {
    return `+993 ${cleaned.slice(0, 2)} ${cleaned.slice(2)}`
  } else {
    return `+993 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 8)}`
  }
}

// Обработчик изменения телефона с автоматическим форматированием
const handlePhoneChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  console.log('handlePhoneChange called with:', value) // Для отладки

  // Если значение пустая строка, очищаем поле
  if (!value || value.trim() === '') {
    console.log('Clearing phone field') // Для отладки
    form.phone = ''
    return
  }

  // Если значение не пустое, форматируем его
  console.log('Formatting phone:', value) // Для отладки
  const formatted = formatPhoneNumber(value)
  console.log('Formatted result:', formatted) // Для отладки
  form.phone = formatted
}

// Функция для принудительной очистки телефона
const clearPhone = () => {
  console.log('clearPhone called') // Для отладки
  form.phone = ''
  console.log('Phone cleared, new value:', form.phone) // Для отладки
}

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement

  if (target.files && target.files[0]) {
    form.image = target.files[0]
  } else {
    form.image = null
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
  if (!props.user && !form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  }
  if (form.password && form.password.length < 6) {
    errors.password = 'Пароль должен быть минимум 6 символов'
    isValid = false
  }
  if (!form.roles || form.roles.length === 0) {
    errors.roles = 'Нужно выбрать хотя бы одну роль'
    isValid = false
  }

  // Валидация телефона (если указан)
  if (form.phone && form.phone.trim()) {
    const phoneRegex = /^\+993[-\s]?\d{2}[-\s]?\d{6}$/
    if (!phoneRegex.test(form.phone.trim())) {
      errors.phone = 'Телефон должен быть в формате +993 XX YYYYYY'
      isValid = false
    }
  }

  return isValid
}

const convertHeicToJpg = async (file: File): Promise<File> => {
  if (!file.name.toLowerCase().endsWith('.heic')) {
    return file
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace('.heic', '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(convertedFile)
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.8,
      )
    }

    img.onerror = () => {
      resolve(file)
    }

    img.src = URL.createObjectURL(file)
  })
}

const handleSubmit = async () => {
  if (!validateForm()) return
  loading.value = true
  try {
    const dataToSend: any = {
      name: form.name,
      username: form.username,
      phone: form.phone && form.phone.trim() ? form.phone.trim() : null,
      roles: Array.isArray(form.roles)
        ? form.roles
            .map((r) => Number(typeof r === 'object' ? (r as any)?.id || 0 : r))
            .filter((id) => Number.isInteger(id) && id > 0)
        : [],
    }
    if (form.password) dataToSend.password = form.password

    if (form.image instanceof File) {
      const convertedImage = await convertHeicToJpg(form.image)
      dataToSend.image = convertedImage
    }

    // Проверяем, что данные не теряются при передаче
    const eventData = { ...dataToSend }

    // Отладочная информация
    console.log('Sending user data:', {
      phone: form.phone,
      phoneTrimmed: form.phone && form.phone.trim(),
      phoneFinal: eventData.phone,
    })

    // Тест сериализации
    try {
      const serialized = JSON.stringify(eventData)
      console.log('Serialized data:', serialized)
    } catch (e) {
      console.error('Serialization error:', e)
    }

    emit('submit', eventData)
    toast.show(props.user ? 'Пользователь обновлён!' : 'Пользователь создан!')
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!props.user?.id) return

  // Показываем toast с подтверждением вместо alert
  toast.show('Удаление пользователя...', 'success')

  try {
    await emit('delete', props.user.id)
    toast.show('Пользователь удалён!', 'success')
  } catch (err: any) {
    let message = 'Произошла неизвестная ошибка при удалении пользователя'
    if (err?.response?.data?.message) {
      message = err.response.data.message
    } else if (err instanceof Error && err.message) {
      message = `Ошибка удаления пользователя: ${err.message}`
    }
    toast.show(message, 'error')
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

:deep(.vue3-select__dropdown) {
  z-index: 99999 !important;
  min-width: 320px !important;
  width: 100% !important;
  max-width: 420px !important;
  max-height: 340px !important;
  overflow-y: auto !important;
  font-size: 1.08rem !important;
  line-height: 1.7 !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 8px 0 !important;
}

:deep(.vue3-select__option) {
  padding: 10px 18px !important;
  font-size: 1.08rem !important;
  border-radius: 8px !important;
  margin: 2px 6px !important;
}

:deep(.vue3-select__option--selected) {
  background: #2563eb !important;
  color: #fff !important;
  font-weight: 600;
}

:deep(.vue3-select__option--highlight) {
  background: #e0e7ff !important;
  color: #1e293b !important;
}

:deep(.vue3-select__selected-option) {
  background: #f1f5f9 !important;
  color: #1e293b !important;
  border-radius: 8px !important;
  padding: 4px 10px !important;
  margin: 2px 4px !important;
  font-weight: 500;
  font-size: 1.02rem;
}

.modal {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 32px 24px;
  background: #fff;
}
</style>
