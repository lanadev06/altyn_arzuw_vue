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
      <div class="input-wrapper">
        <label class="block text-sm font-medium text-gray-900 mb-1">
          Пароль
        </label>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Введите ваш пароль"
            :class="[
              'w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
              'text-gray-900 placeholder:text-gray-500 bg-white',
              {
                'border-red-500 focus:ring-red-500': errors.password,
              },
            ]"
            required
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            tabindex="-1"
          >
            <!-- Иконка открытого глаза (когда пароль скрыт) -->
            <svg
              v-if="!showPassword"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
            <!-- Иконка закрытого глаза (когда пароль виден) -->
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
      </div>
      <div class="flex items-center">
        <input
          id="remember-me"
          v-model="form.rememberMe"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded accent-blue-600"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-900 cursor-pointer">
          Запомнить меня
        </label>
      </div>
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
  rememberMe: boolean
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
const showPassword = ref(false)
const generalError = ref('')
const errors = reactive<FormErrors>({
  username: '',
  password: '',
})
const form = reactive<LoginFormData>({
  username: '',
  password: '',
  rememberMe: false,
})

// Получаем URL логотипа
const logoUrl = ref(logoDataUrl.value || '/logo.svg')

// Обработчик ошибки загрузки логотипа
const handleLogoError = () => {
  // При ошибке загрузки основного логотипа, используем fallback с версией
  logoUrl.value = `/logo.svg?v=${Date.now()}`
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
      rememberMe: form.rememberMe,
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

<style scoped>
input[type="checkbox"] {
  accent-color: #2563eb; /* blue-600 */
}

input[type="checkbox"]:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}
</style>
