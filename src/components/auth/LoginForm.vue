<template>
  <div class="login-form">
    <div
      v-if="logoLoading"
      class="mx-auto mb-6 max-w-xs w-48 h-32 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    <img
      v-else
      :src="logoUrl"
      alt="Altyn-Arzuw Logo"
      class="mx-auto mb-6 max-w-xs w-48 h-auto"
      @error="handleLogoError"
    />
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать</h2>
      <p class="text-gray-600">Войдите в свою учетную запись</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <UIInput
        v-model="form.username"
        label="Логин"
        placeholder="Введите ваш логин"
        type="text"
        :error="errors.username"
        required
      />
      <UIInput
        v-model="form.password"
        label="Пароль"
        placeholder="Введите ваш пароль"
        type="password"
        :error="errors.password"
        required
      />
      <div v-if="generalError" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span class="text-sm text-red-600">{{ generalError }}</span>
        </div>
      </div>

      <UIButton type="submit" variant="primary" :disabled="loading" class="w-full">
        <svg
          v-if="loading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ loading ? 'Вход...' : 'Войти в систему' }}
      </UIButton>
    </form>
    <div class="mt-8 text-center">
      <p class="text-xs text-gray-500">© 2024 Altyn Arzuw. Все права защищены.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIButton from '@/components/ui/UIButton.vue'
import { useLogo } from '@/composables/useLogo'

interface LoginFormData {
  username: string
  password: string
}

interface FormErrors {
  username: string
  password: string
}

const emit = defineEmits<{
  submit: [data: LoginFormData]
}>()

// Используем composable для логотипа
const { logoDataUrl, isLoading: logoLoading } = useLogo()

const loading = ref(false)
const generalError = ref('')
const errors = reactive<FormErrors>({
  username: '',
  password: '',
})
const form = reactive<LoginFormData>({
  username: '',
  password: '',
})

// Получаем URL логотипа
const logoUrl = ref(logoDataUrl.value || '/logo.svg')

// Обработчик ошибки загрузки логотипа
const handleLogoError = () => {
  // При ошибке загрузки основного логотипа, используем fallback
  logoUrl.value = '/logo.svg'
}

const validateForm = (): boolean => {
  errors.username = ''
  errors.password = ''
  generalError.value = ''

  let isValid = true

  if (!form.username.trim()) {
    errors.username = 'Логин обязателен'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    emit('submit', {
      username: form.username,
      password: form.password,
    })
  } finally {
    loading.value = false
  }
}

const setError = (message: string) => {
  generalError.value = message
}

defineExpose({
  setError,
  form,
})


defineOptions({
  name: 'LoginForm'
})
</script>
