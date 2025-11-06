<template>
  <Modal @close="$emit('close')">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">
        {{ stage ? t('stages.editStage') : t('stages.createStage') }}
      </h2>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('stages.stageName') }} <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.display_name"
          :placeholder="t('stages.enterStageName')"
          :error="errors.display_name"
          required
        />
      </div>

      <!-- Внутреннее имя -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('stages.internalName') }} <span class="text-red-500">*</span>
        </label>
        <UIInput
          v-model="form.name"
          :placeholder="t('stages.internalNamePlaceholder')"
          :error="errors.name"
          :disabled="!!stage"
          required
        />
        <p class="text-sm text-gray-500 mt-1">
          {{ t('stages.internalNameDescription') }}
        </p>
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> {{ t('stages.description') }} </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="t('stages.descriptionPlaceholder')"
        ></textarea>
      </div>

      <!-- Порядок -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> {{ t('stages.order') }} </label>
        <UIInput v-model="form.order" type="number" :placeholder="t('stages.orderPlaceholder')" :error="errors.order" />
        <p class="text-sm text-gray-500 mt-1">
          {{ t('stages.orderDescription') }}
        </p>
      </div>

      <!-- Цвет стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('stages.color') }} <span class="text-red-500">*</span>
        </label>

        <!-- Поиск по цветам -->
        <div class="mb-2">
          <input
            v-model="colorSearch"
            type="text"
            :placeholder="t('stages.searchColor')"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ t('stages.found') }}: {{ filteredColors.length }} {{ t('stages.of') }} {{ availableColors.length }} {{ t('stages.colors') }}
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
            {{ t('stages.selected') }}:
            {{
              availableColors.find((c) => c.value === form.color)?.label || t('stages.customColor')
            }}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          {{ t('stages.colorDescription') }}
        </p>
        <p v-if="errors.color" class="text-sm text-red-500 mt-1">{{ errors.color }}</p>
      </div>

      <!-- Роли для этой стадии -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> {{ t('stages.rolesForStage') }} </label>
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
                <p class="text-sm text-gray-500">{{ role.description || t('stages.noDescription') }}</p>
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">
          {{ t('stages.rolesDescription') }}
        </p>
      </div>

      <!-- Кнопки -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <UIButton v-if="!stage || canEdit()" type="submit" :loading="loading" class="flex-1">
          {{ stage ? t('stages.save') : t('stages.create') }}
        </UIButton>
        <UIButton type="button" variant="secondary" @click="$emit('close')"> {{ t('stages.cancel') }} </UIButton>
        <UIButton
          v-if="stage && canDelete()"
          type="button"
          variant="danger"
          @click="handleDelete"
          :loading="deleting"
        >
          {{ t('stages.delete') }}
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import type { Stage } from '../../../types/stage'
import type { Role } from '../../../types/role'
import { getAvailableRoles } from '../../../services/api'
import { AVAILABLE_COLORS } from '../../../utils/stageColors'
import { canDelete, canEdit } from '../../../utils/permissions'
import StageController from '../../../controllers/StageController'
import { useToast } from '../../../stores/toast'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  stage?: Stage | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: any]
  created: []
  updated: []
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
  color: '#3b82f6', // Default color
})

// Инициализация формы при редактировании
const initializeForm = () => {
  if (props.stage) {
    form.name = props.stage.name
    form.display_name = props.stage.display_name || ''
    form.description = props.stage.description || '' // Исправлено: используем пустую строку для null/undefined
    form.order = props.stage.order
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
  } catch (error) {}
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
    errors.name = t('stages.internalNameRequired')
    valid = false
  } else if (!/^[a-z_]+$/.test(form.name)) {
    errors.name = t('stages.internalNameInvalid')
    valid = false
  }

  if (!form.display_name.trim()) {
    errors.display_name = t('stages.nameRequired')
    valid = false
  }

  // Color is optional in backend, but we'll validate format if provided
  if (form.color && form.color.trim() && !form.color.match(/^#[0-9A-Fa-f]{3,6}$/)) {
    errors.color = t('stages.colorInvalid')
    valid = false
  }

  return valid
}

// Обработка отправки формы
const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    // Убеждаемся, что order является целым числом >= 1
    let orderValue: number
    const orderInput = form.order
    
    if (orderInput === null || orderInput === undefined || orderInput === '' || orderInput === 0) {
      // Если order не указан или равен 0, используем 1
      orderValue = 1
    } else {
      // Преобразуем в число и затем в целое
      const numValue = typeof orderInput === 'number' ? orderInput : parseFloat(String(orderInput))
      orderValue = Math.floor(Math.abs(numValue)) // Берем целую часть и абсолютное значение
      
      if (isNaN(orderValue) || orderValue < 1) {
        errors.order = t('stages.orderRequired')
        loading.value = false
        return
      }
    }

    // Убеждаемся, что color соответствует формату (6 hex цифр)
    let colorValue: string | null = form.color
    if (colorValue) {
      colorValue = colorValue.trim()
      if (colorValue && !colorValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        // Если цвет в формате #RGB, конвертируем в #RRGGBB
        if (colorValue.match(/^#[0-9A-Fa-f]{3}$/)) {
          colorValue = '#' + colorValue.slice(1).split('').map(c => c + c).join('')
        } else {
          errors.color = t('stages.colorInvalid')
          loading.value = false
          return
        }
      }
    } else {
      colorValue = null
    }

    const data: any = {
      name: form.name.trim(),
      display_name: form.display_name.trim(),
      description: form.description.trim() || null,
      order: Number.isInteger(orderValue) ? orderValue : Math.floor(orderValue), // Гарантируем, что это целое число >= 1
    }

    // Добавляем color только если он есть
    if (colorValue) {
      data.color = colorValue
    }

    // Добавляем roles только если они есть
    if (selectedRoles.value.length > 0) {
      data.roles = selectedRoles.value
    }

    // Логируем данные для отладки (можно удалить после исправления)
    console.log('Sending stage data:', JSON.stringify(data, null, 2))

    // Вызываем API напрямую для лучшей обработки ошибок
    if (props.stage) {
      // Обновление существующей стадии
      await StageController.update(props.stage.id, data)
      toast.show(t('stages.stageUpdated'), 'success')
      emit('updated')
    } else {
      // Создание новой стадии
      await StageController.create(data)
      toast.show(t('stages.stageCreated'), 'success')
      emit('created')
    }
    
    emit('close')
  } catch (error: any) {
    // Обрабатываем ошибки валидации
    if (error?.fieldErrors) {
      Object.keys(error.fieldErrors).forEach((field) => {
        if (field in errors) {
          errors[field as keyof typeof errors] = error.fieldErrors[field]
        }
      })
      toast.show(Object.values(error.fieldErrors).join(', '), 'error')
    } else {
      const errorMessage = error?.message || (props.stage ? t('stages.updateError') : t('stages.createError'))
      toast.show(errorMessage, 'error')
    }
  } finally {
    loading.value = false
  }
}

// Обработка удаления
const handleDelete = async () => {
  if (!props.stage?.id) return

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


defineOptions({
  name: 'StageFormModal'
})
</script>
