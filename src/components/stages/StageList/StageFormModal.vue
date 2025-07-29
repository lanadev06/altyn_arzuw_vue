<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ stage ? 'Редактировать стадию' : 'Создать стадию' }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Название стадии <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.display_name"
          placeholder="Введите название стадии"
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
          placeholder="design, print, assembly"
          :error="errors.name"
          :disabled="!!stage"
          required
        />
        <p class="text-sm text-gray-500 mt-1">
          Уникальное имя для идентификации стадии (только латинские буквы и подчеркивания)
        </p>
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Описание </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Описание стадии..."
        ></textarea>
      </div>

      <!-- Порядок -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Порядок </label>
        <UIInput v-model="form.order" type="number" placeholder="1" :error="errors.order" />
        <p class="text-sm text-gray-500 mt-1">
          Порядок отображения стадии (меньше число - выше в списке)
        </p>
      </div>

      <!-- Активность -->
      <div>
        <label class="flex items-center">
          <input
            v-model="form.is_active"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span class="ml-2 text-sm text-gray-700">Активная стадия</span>
        </label>
      </div>

      <!-- Цвет стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Цвет стадии <span class="text-red-500">*</span>
        </label>

        <!-- Поиск по цветам -->
        <div class="mb-2">
          <input
            v-model="colorSearch"
            type="text"
            placeholder="Поиск цвета..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Найдено: {{ filteredColors.length }} из {{ availableColors.length }} цветов
          </p>
        </div>

        <div
          class="grid grid-cols-12 gap-1 mb-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg"
        >
          <button
            v-for="color in filteredColors"
            :key="color.value"
            type="button"
            @click="form.color = color.value"
            class="w-8 h-8 rounded border-2 transition-all hover:scale-125 relative group"
            :class="[
              form.color === color.value
                ? 'border-gray-800 scale-125 shadow-lg'
                : 'border-gray-300 hover:border-gray-400',
            ]"
            :style="{ backgroundColor: color.value }"
            :title="color.label"
          >
            <!-- Иконка галочки для выбранного цвета -->
            <div
              v-if="form.color === color.value"
              class="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
            >
              ✓
            </div>
          </button>
        </div>

        <!-- Показываем выбранный цвет -->
        <div v-if="form.color" class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <div
            class="w-4 h-4 rounded-full border border-gray-300"
            :style="{ backgroundColor: form.color }"
          ></div>
          <span class="text-sm text-gray-600">
            Выбран:
            {{
              availableColors.find((c) => c.value === form.color)?.label || 'Пользовательский цвет'
            }}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Выберите цвет для визуального выделения стадии. Цвет будет отображаться везде в системе.
        </p>
        <p v-if="errors.color" class="text-sm text-red-500 mt-1">{{ errors.color }}</p>
      </div>

      <!-- Роли для этой стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Роли для этой стадии </label>
        <div class="space-y-3">
          <div
            v-for="role in availableRoles"
            :key="role.id"
            class="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                :checked="selectedRoles.some((r) => r.role_id === role.id)"
                @change="toggleRole(role)"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <div>
                <span class="font-medium text-gray-900">{{ role.display_name }}</span>
                <p class="text-sm text-gray-500">{{ role.description || 'Нет описания' }}</p>
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Выберите роли, которые могут работать на этой стадии
        </p>
      </div>

      <!-- Кнопки -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <UIButton type="submit" :loading="loading" class="flex-1">
          {{ stage ? 'Сохранить' : 'Создать' }}
        </UIButton>
        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
        <UIButton
          v-if="stage"
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
import { ref, reactive, onMounted, computed } from 'vue'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import type { Stage } from '../../../types/stage'
import type { Role } from '../../../types/role'
import { getAvailableRoles } from '../../../services/api'
import { AVAILABLE_COLORS } from '../../../utils/stageColors'

const props = defineProps<{
  stage?: Stage | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: any]
  delete: [id: number]
}>()

const loading = ref(false)
const deleting = ref(false)
const availableRoles = ref<Role[]>([])
const selectedRoles = ref<Array<{ role_id: number }>>([])
const colorSearch = ref('')

// Используем цвета из утилиты
const availableColors = ref(AVAILABLE_COLORS)

// Фильтрованные цвета для поиска
const filteredColors = computed(() => {
  if (!colorSearch.value) return availableColors.value
  return availableColors.value.filter((color) =>
    color.label.toLowerCase().includes(colorSearch.value.toLowerCase()),
  )
})

const errors = reactive({
  name: '',
  display_name: '',
  order: '',
  color: '',
})

const form = reactive({
  name: '',
  display_name: '',
  description: '',
  order: 1,
  is_active: true,
  color: '#3b82f6', // Default color
})

// Инициализация формы при редактировании
const initializeForm = () => {
  if (props.stage) {
    form.name = props.stage.name
    form.display_name = props.stage.display_name
    form.description = props.stage.description || '' // Исправлено: используем пустую строку для null/undefined
    form.order = props.stage.order
    form.is_active = props.stage.is_active
    form.color = props.stage.color || '#3b82f6' // Initialize color

    // Загружаем связанные роли
    if (props.stage.roles) {
      selectedRoles.value = props.stage.roles.map((role) => ({
        role_id: role.id,
      }))
    }
  }
}

// Загрузка доступных ролей
const loadAvailableRoles = async () => {
  try {
    const rolesData = await getAvailableRoles()
    availableRoles.value = rolesData || []
  } catch (error) {
    console.error('Error loading roles:', error)
  }
}

// Переключение роли
const toggleRole = (role: Role) => {
  const existingIndex = selectedRoles.value.findIndex((r) => r.role_id === role.id)

  if (existingIndex >= 0) {
    selectedRoles.value.splice(existingIndex, 1)
  } else {
    selectedRoles.value.push({
      role_id: role.id,
    })
  }
}

// Валидация формы
const validateForm = () => {
  errors.name = ''
  errors.display_name = ''
  errors.order = ''
  errors.color = ''

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

  if (!form.color) {
    errors.color = 'Цвет стадии обязателен'
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
      description: form.description.trim() || null, // Исправлено: используем trim() и null вместо undefined
      order: form.order,
      is_active: form.is_active,
      color: form.color, // Добавляем цвет
      roles: selectedRoles.value, // Добавляем выбранные роли
    }

    emit('submit', data)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    loading.value = false
  }
}

// Обработка удаления
const handleDelete = async () => {
  if (!props.stage?.id) return

  if (!confirm('Вы уверены, что хотите удалить эту стадию?')) return

  deleting.value = true
  try {
    emit('delete', props.stage.id)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initializeForm()
  loadAvailableRoles()
})
</script>
