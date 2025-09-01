<template>
  <div class="stage-color-demo p-6 bg-white rounded-lg shadow-lg">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Демонстрация цветов стадий</h3>

    <!-- Поиск по цветам -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск цвета..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Найдено: {{ filteredColors.length }} из {{ availableColors.length }} цветов
      </p>
    </div>

    <!-- Палитра цветов -->
    <div class="mb-6">
      <h4 class="font-medium text-gray-900 mb-2">
        Палитра цветов ({{ availableColors.length }} цветов)
      </h4>
      <div
        class="grid grid-cols-16 gap-1 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg"
      >
        <div
          v-for="color in filteredColors"
          :key="color.value"
          class="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-125 transition-transform"
          :style="{ backgroundColor: color.value }"
          :title="color.label"
          @click="selectColor(color)"
        ></div>
      </div>
    </div>

    <!-- Демонстрация выбранного цвета -->
    <div v-if="selectedColor" class="mb-6">
      <h4 class="font-medium text-gray-900 mb-2">Выбранный цвет: {{ selectedColor.label }}</h4>
      <div class="space-y-2">
        <!-- Кнопка в стиле канбана -->
        <button
          class="w-full px-3 py-2 rounded text-white font-medium"
          :style="{ backgroundColor: selectedColor.value }"
        >
          Стадия с цветом {{ selectedColor.label }}
        </button>

        <!-- Бейдж статуса -->
        <span
          class="inline-block px-2 py-1 rounded-full text-xs font-medium"
          :style="{
            backgroundColor: selectedColor.value + '20',
            color: selectedColor.value,
          }"
        >
          Активная стадия
        </span>

        <!-- Иконка стадии -->
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
            :style="{ backgroundColor: selectedColor.value }"
          >
            С
          </div>
          <span class="text-sm text-gray-600">Иконка стадии</span>
        </div>
      </div>
    </div>

    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-2">Как это работает:</h4>
      <ul class="text-sm text-gray-600 space-y-1">
        <li>• Выберите цвет для стадии в StageFormModal</li>
        <li>• Цвет автоматически применится везде в системе</li>
        <li>• В канбане, деталях заказа, списках - везде будет ваш цвет</li>
        <li>• Можно изменить цвет в любой момент</li>
        <li>• Доступно {{ availableColors.length }} различных цветов</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AVAILABLE_COLORS } from '../../utils/stageColors'

const searchQuery = ref('')
const selectedColor = ref<{ value: string; label: string } | null>(null)

const availableColors = ref(AVAILABLE_COLORS)

const filteredColors = computed(() => {
  if (!searchQuery.value) return availableColors.value
  return availableColors.value.filter((color) =>
    color.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

function selectColor(color: { value: string; label: string }) {
  selectedColor.value = color
}


defineOptions({
  name: 'StageColorDemo'
})
</script>

<style scoped>
.grid-cols-16 {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}
</style>
