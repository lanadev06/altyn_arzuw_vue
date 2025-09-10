<template>
  <div class="relative" ref="rootRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
    >
      <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
        <img
          v-if="userImageUrl"
          :src="userImageUrl"
          :alt="safeUser.name"
          class="w-8 h-8 rounded-full object-cover"
        />
        <span v-else class="text-white text-sm font-medium">
          {{ safeUser.name ? safeUser.name.charAt(0).toUpperCase() : '?' }}
        </span>
      </div>
      <div class="text-left">
        <p class="text-white text-sm font-medium">{{ safeUser.name || 'Загрузка...' }}</p>
        <p class="text-blue-100 text-xs">
          <template v-if="safeUser.roles && safeUser.roles.length">
            <span
              v-for="role in safeUser.roles"
              :key="role.id"
              class="inline-block bg-blue-200 text-blue-800 rounded px-2 py-0.5 mr-1"
            >
              {{ role.display_name || role.name }}
            </span>
          </template>
          <template v-else>
            {{ safeUser.role }}
          </template>
        </p>
      </div>
      <svg
        class="w-4 h-4 text-white transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-2"
    >
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full mt-3 w-96 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-2xl shadow-2xl border border-purple-200 z-50"
      >
      
      <!-- Форма редактирования профиля -->
      <div class="px-6 py-4 space-y-4">

        <!-- Имя -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Имя</label>
          <input
            v-model="profileData.name"
            type="text"
            class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
            :class="{ 'border-red-500': validationErrors.name }"
            placeholder="Введите ваше имя"
          />
          <p v-if="validationErrors.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
        </div>

        <!-- Загрузка фото -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Фото профиля</label>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
              <img
                v-if="userImageUrl"
                :src="userImageUrl"
                :alt="safeUser.name"
                class="w-20 h-20 rounded-xl object-cover"
              />
              <span v-else class="text-gray-400 text-2xl font-medium">
                {{ safeUser.name ? safeUser.name.charAt(0).toUpperCase() : '?' }}
              </span>
            </div>
            <div class="flex-1 space-y-2">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
              />
              <div class="flex gap-2">
                <button
                  @click.stop="fileInput?.click()"
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Изменить
                </button>
                <button
                  v-if="userImageUrl"
                  @click.stop="removePhoto"
                  class="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Удалить
                </button>
              </div>
              <p class="text-xs text-gray-500">JPG, PNG до 2MB</p>
            </div>
          </div>
        </div>

        <!-- Телефон -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
          <input
            v-model="profileData.phone"
            @input="handlePhoneChange"
            type="text"
            class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
            :class="{ 'border-red-500': validationErrors.phone }"
            placeholder="+993 XX YYYYYY"
          />
          <p v-if="validationErrors.phone" class="text-red-500 text-xs mt-1">{{ validationErrors.phone }}</p>
          <p v-else class="text-xs text-gray-500 mt-1">Формат: +993 XX YYYYYY (например: +993 12 345678)</p>
        </div>

        <!-- Смена пароля -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">Смена пароля</h3>
          <div>
            <input
              v-model="passwordData.currentPassword"
              type="password"
              class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
              :class="{ 'border-red-500': validationErrors.currentPassword }"
              placeholder="Текущий пароль"
            />
            <p v-if="validationErrors.currentPassword" class="text-red-500 text-xs mt-1">{{ validationErrors.currentPassword }}</p>
          </div>
          <div>
            <input
              v-model="passwordData.newPassword"
              type="password"
              class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
              :class="{ 'border-red-500': validationErrors.newPassword }"
              placeholder="Новый пароль"
            />
            <p v-if="validationErrors.newPassword" class="text-red-500 text-xs mt-1">{{ validationErrors.newPassword }}</p>
          </div>
          <div>
            <input
              v-model="passwordData.confirmPassword"
              type="password"
              class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400"
              :class="{ 'border-red-500': validationErrors.confirmPassword }"
              placeholder="Подтвердите новый пароль"
            />
            <p v-if="validationErrors.confirmPassword" class="text-red-500 text-xs mt-1">{{ validationErrors.confirmPassword }}</p>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="flex gap-3 pt-2">
          <button
            @click="saveProfile"
            :disabled="isSaving"
            class="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ isSaving ? 'Сохранение...' : 'Сохранить изменения' }}
          </button>
        </div>
        
        <!-- Кнопка выхода -->
        <div class="border-t border-gray-200 pt-3 mt-3">
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              ></path>
            </svg>
            Выйти
          </button>
        </div>
      </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { API_CONFIG } from '../../config/api'
import { apiRequest } from '../../services/api'

defineOptions({
  name: 'UserProfile'
})

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      name: '',
      role: '',
      image: null,
      roles: [],
    }),
  },
})

const emit = defineEmits(['logout', 'profile-updated'])

// Ensure we always have a safe user object
const safeUser = computed(() => ({
  name: props.user?.name || '',
  role: props.user?.role || '',
  image: props.user?.image || null,
  roles: props.user?.roles || [],
  phone: props.user?.phone || '',
}))

const isDropdownOpen = ref(false)
const rootRef = ref<HTMLElement>()
const userImageUrl = ref('')
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement>()

// Данные профиля
const profileData = ref({
  name: '',
  phone: '',
})

// Данные для смены пароля
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validationErrors = ref({
  name: '',
  phone: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const getUserImageUrl = (user: { image_url?: string; image?: string }) => {
  if (user.image_url) return user.image_url
  if (user.image && user.image.startsWith('http')) return user.image
  if (user.image) {
    // Используем относительный путь для работы в production
    return `/storage/${user.image}`
  }
  return ''
}

const loadUserImageUrl = () => {
  if (safeUser.value) {
    const url = getUserImageUrl(safeUser.value)
    userImageUrl.value = url
  } else {
    userImageUrl.value = ''
  }
}

watch(() => safeUser.value, loadUserImageUrl, { immediate: true })

// Загрузка данных пользователя
const loadUserData = () => {
  if (safeUser.value) {
    profileData.value.name = safeUser.value.name || ''
    
    // Загружаем и форматируем номер телефона
    const phone = safeUser.value.phone || ''
    if (phone) {
      // Если номер уже в правильном формате, используем его
      if (/^\+993\s\d{2}\s\d{6}$/.test(phone)) {
        profileData.value.phone = phone
      } else {
        // Иначе форматируем номер
        const formatted = formatPhoneNumber(phone)
        profileData.value.phone = formatted
      }
    } else {
      profileData.value.phone = ''
    }
  }
}

onMounted(() => {
  loadUserImageUrl()
  loadUserData()
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  
  // Загружаем актуальные данные пользователя при открытии dropdown'а
  if (isDropdownOpen.value) {
    loadUserData()
  }
}

const handleLogout = () => {
  isDropdownOpen.value = false
  emit('logout')
}

// Обработка загрузки изображения
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Здесь можно добавить предварительный просмотр
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      userImageUrl.value = e.target.result as string
    }
  }
  reader.readAsDataURL(file)
}

// Удаление фото
const removePhoto = async () => {
  try {
    const result = await apiRequest('/user/profile', {
      method: 'POST',
      body: JSON.stringify({
        remove_image: true
      })
    })
    
    // Обновляем данные пользователя
    if (result.user) {
      emit('profile-updated', result.user)
    }
    
    // Очищаем локальное состояние
    userImageUrl.value = ''
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Ошибка при удалении фото:', error)
  }
}

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

  // Если значение пустая строка, очищаем поле
  if (!value || value.trim() === '') {
    profileData.value.phone = ''
    return
  }

  // Если значение не пустое, форматируем его
  const formatted = formatPhoneNumber(value)
  profileData.value.phone = formatted
}

// Сохранение профиля
const validateForm = async () => {
  // Очищаем предыдущие ошибки
  validationErrors.value = {
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }

  let isValid = true

  // Валидация телефона
  if (profileData.value.phone && !/^\+993\s\d{2}\s\d{6}$/.test(profileData.value.phone)) {
    validationErrors.value.phone = 'Неверный формат номера телефона'
    isValid = false
  }

  // Валидация паролей
  if (passwordData.value.newPassword) {
    if (!passwordData.value.currentPassword) {
      validationErrors.value.currentPassword = 'Введите текущий пароль'
      isValid = false
    } else {
      // Проверяем текущий пароль через API
      try {
        const result = await apiRequest('/validate-password', {
          method: 'POST',
          body: JSON.stringify({
            current_password: passwordData.value.currentPassword
          })
        })
        
        if (!result.valid) {
          validationErrors.value.currentPassword = 'Неверный текущий пароль'
          isValid = false
        }
      } catch (error) {
        validationErrors.value.currentPassword = 'Ошибка при проверке пароля'
        isValid = false
      }
    }
    
    if (passwordData.value.newPassword.length < 6) {
      validationErrors.value.newPassword = 'Пароль должен содержать минимум 6 символов'
      isValid = false
    }
    
    if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
      validationErrors.value.confirmPassword = 'Пароли не совпадают'
      isValid = false
    }
  }

  return isValid
}

const saveProfile = async () => {
  if (!(await validateForm())) {
    return
  }

  isSaving.value = true
  
  try {

    const formData = new FormData()
    
    // Добавляем данные профиля
    formData.append('name', profileData.value.name.trim())
    if (profileData.value.phone) {
      formData.append('phone', profileData.value.phone)
    }
    
    // Добавляем пароли если они указаны
    if (passwordData.value.currentPassword) {
      formData.append('current_password', passwordData.value.currentPassword)
    }
    if (passwordData.value.newPassword) {
      formData.append('password', passwordData.value.newPassword)
    }
    
    // Добавляем файл изображения если выбран
    const file = fileInput.value?.files?.[0]
    if (file) {
      formData.append('image', file)
    }

    // Отправляем запрос на обновление профиля
    const result = await apiRequest('/user/profile', {
      method: 'POST',
      body: formData,
    })
    
    // Обновляем данные пользователя
    if (result.user) {
      // Обновляем данные в родительском компоненте
      emit('profile-updated', result.user)
    }
    
    // Сбрасываем форму паролей
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    
    // Перезагружаем данные пользователя с небольшой задержкой
    setTimeout(() => {
      loadUserData()
    }, 100)
    
    // Закрываем dropdown после успешного сохранения
    isDropdownOpen.value = false
  } catch (error) {
  } finally {
    isSaving.value = false
  }
}


const closeDropdown = (event: MouseEvent) => {
  if (isDropdownOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

// Watcher для обновления данных при изменении пользователя
watch(() => safeUser.value, loadUserData, { immediate: true })
</script>
