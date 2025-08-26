<template>
  <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
    <!-- Заголовок -->
    <div class="mb-6">
      <h3 class="text-xl font-bold text-gray-900 mb-1">Общая выручка по месяцам</h3>
      <p class="text-3xl font-bold text-blue-600">
        {{ revenueData.total_revenue_formatted }} <span class="text-lg text-gray-500">TMT</span>
      </p>
      <p class="text-sm text-gray-500 mt-1">
        Общая выручка (по всем проектам и заказам) за {{ revenueData.year }} год
      </p>
      <p class="text-xs text-gray-400 mt-1">
        * Включает все проекты и заказы, независимо от статуса оплаты
      </p>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="flex flex-col items-center space-y-3">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"
        ></div>
        <p class="text-gray-500 text-sm">Загрузка данных...</p>
      </div>
    </div>

    <!-- График -->
    <div v-else class="relative">
      <div class="relative h-64">
        <svg class="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
          <!-- Градиент для заливки -->
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 0.3" />
              <stop offset="100%" style="stop-color: #3b82f6; stop-opacity: 0.05" />
            </linearGradient>
          </defs>

          <!-- Сетка -->
          <g class="grid-lines">
            <line x1="60" y1="40" x2="60" y2="200" stroke="#e5e7eb" stroke-width="1" />
            <line x1="60" y1="200" x2="740" y2="200" stroke="#e5e7eb" stroke-width="1" />

            <!-- Горизонтальные линии сетки -->
            <line
              x1="60"
              y1="40"
              x2="740"
              y2="40"
              stroke="#f3f4f6"
              stroke-width="1"
              stroke-dasharray="2,4"
            />
            <line
              x1="60"
              y1="80"
              x2="740"
              y2="80"
              stroke="#f3f4f6"
              stroke-width="1"
              stroke-dasharray="2,4"
            />
            <line
              x1="60"
              y1="120"
              x2="740"
              y2="120"
              stroke="#f3f4f6"
              stroke-width="1"
              stroke-dasharray="2,4"
            />
            <line
              x1="60"
              y1="160"
              x2="740"
              y2="160"
              stroke="#f3f4f6"
              stroke-width="1"
              stroke-dasharray="2,4"
            />
          </g>

          <!-- Подписи осей Y -->
          <g class="y-labels">
            <text x="55" y="45" text-anchor="end" class="text-xs fill-gray-400">5M</text>
            <text x="55" y="85" text-anchor="end" class="text-xs fill-gray-400">4M</text>
            <text x="55" y="125" text-anchor="end" class="text-xs fill-gray-400">3M</text>
            <text x="55" y="165" text-anchor="end" class="text-xs fill-gray-400">2M</text>
            <text x="55" y="205" text-anchor="end" class="text-xs fill-gray-400">0</text>
          </g>

          <!-- График -->
          <g v-if="chartPoints.length > 0" class="chart-elements">
            <!-- Заливка под графиком -->
            <path :d="areaPath" fill="url(#areaGradient)" class="area-fill" opacity="0" />

            <!-- Линия графика -->
            <path
              :d="linePath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="chart-line"
              opacity="0"
            />

            <!-- Точки на графике -->
            <g class="data-points">
              <circle
                v-for="(point, index) in chartPoints"
                :key="index"
                :cx="point.x"
                :cy="point.y"
                r="0"
                fill="#3b82f6"
                stroke="white"
                stroke-width="2"
                class="data-point"
                @mouseenter="showTooltip(point, $event)"
                @mouseleave="hideTooltip"
                style="cursor: pointer"
              />
            </g>

            <!-- Подписи месяцев -->
            <g class="month-labels">
              <text
                v-for="(point, index) in chartPoints"
                :key="`label-${index}`"
                :x="point.x"
                :y="220"
                text-anchor="middle"
                class="text-xs fill-gray-500"
                opacity="0"
              >
                {{ point.month_name }}
              </text>
            </g>
          </g>
        </svg>

        <!-- Тултип -->
        <div
          v-if="tooltip.show"
          :style="{
            left: tooltip.x + 'px',
            top: tooltip.y + 'px',
          }"
          class="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-full pointer-events-none"
        >
          <div class="font-semibold">{{ tooltip.month_name }}</div>
          <div>{{ tooltip.revenue_formatted }} TMT</div>
          <div class="text-xs text-gray-300 mt-1">Общая выручка</div>
          <div
            class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { apiRequest } from '../../services/api'
import type { RevenueByMonthResponse } from '../../types/api'

// Интерфейс для точки графика
interface ChartPoint {
  x: number
  y: number
  month_name: string
  revenue_formatted: string
  revenue: number
}

const currentYear = new Date().getFullYear()
const loading = ref(false)
const revenueData = ref<RevenueByMonthResponse>({
  monthly_data: [],
  total_revenue: 0,
  total_revenue_formatted: '0',
  year: currentYear,
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  month_name: '',
  revenue_formatted: '',
})

// Функция для перевода месяцев на русский
// Выручка теперь считается по общей сумме проектов и заказов, а не по оплаченным суммам
const getRussianMonthName = (monthName: string): string => {
  const monthMap: { [key: string]: string } = {
    January: 'Январь',
    February: 'Февраль',
    March: 'Март',
    April: 'Апрель',
    May: 'Май',
    June: 'Июнь',
    July: 'Июль',
    August: 'Август',
    September: 'Сентябрь',
    October: 'Октябрь',
    November: 'Ноябрь',
    December: 'Декабрь',
    // Сокращенные варианты
    Jan: 'Янв',
    Feb: 'Фев',
    Mar: 'Мар',
    Apr: 'Апр',
    Jun: 'Июн',
    Jul: 'Июл',
    Aug: 'Авг',
    Sep: 'Сен',
    Oct: 'Окт',
    Nov: 'Ноя',
    Dec: 'Дек',
  }

  return monthMap[monthName] || monthName
}

const chartPoints = computed((): ChartPoint[] => {
  if (!revenueData.value.monthly_data.length) return []

  const maxRevenue = Math.max(...revenueData.value.monthly_data.map((d) => d.revenue))
  const scale = maxRevenue > 0 ? 160 / maxRevenue : 1

  return revenueData.value.monthly_data.map((data, index) => {
    const x = 60 + (index * 680) / (revenueData.value.monthly_data.length - 1)
    const y = 200 - data.revenue * scale

    return {
      x,
      y,
      month_name: getRussianMonthName(data.month_name),
      revenue_formatted: data.revenue_formatted,
      revenue: data.revenue,
    }
  })
})

const linePath = computed(() => {
  if (chartPoints.value.length < 2) return ''

  const points = chartPoints.value.map((point) => `${point.x},${point.y}`).join(' L ')
  return `M ${points}`
})

const areaPath = computed(() => {
  if (chartPoints.value.length < 2) return ''

  const points = chartPoints.value.map((point) => `${point.x},${point.y}`).join(' L ')
  return `M ${points} L ${chartPoints.value[chartPoints.value.length - 1].x},200 L ${chartPoints.value[0].x},200 Z`
})

const showTooltip = (point: ChartPoint, event: MouseEvent) => {
  const rect = (event.target as Element).closest('svg')?.getBoundingClientRect()
  if (rect) {
    const x = rect.left + point.x * (rect.width / 800)
    const y = rect.top + point.y * (rect.height / 250) - 50

    // Проверяем границы экрана
    const tooltipWidth = 120
    const tooltipHeight = 60

    let finalX = x
    let finalY = y

    if (x + tooltipWidth / 2 > window.innerWidth) {
      finalX = window.innerWidth - tooltipWidth / 2 - 10
    }
    if (x - tooltipWidth / 2 < 0) {
      finalX = tooltipWidth / 2 + 10
    }
    if (y - tooltipHeight < 0) {
      finalY = rect.top + point.y * (rect.height / 250) + 20
    }

    tooltip.value = {
      show: true,
      x: finalX,
      y: finalY,
      month_name: point.month_name,
      revenue_formatted: point.revenue_formatted,
    }
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const animateChart = async () => {
  await nextTick()

  // Проверяем, что данные загружены
  if (chartPoints.value.length === 0) return

  // Анимация линии
  const line = document.querySelector('.chart-line') as SVGPathElement
  if (line) {
    const length = line.getTotalLength()
    line.style.strokeDasharray = length.toString()
    line.style.strokeDashoffset = length.toString()

    setTimeout(() => {
      line.style.transition = 'stroke-dashoffset 1s ease-in-out'
      line.style.strokeDashoffset = '0'
      line.style.opacity = '1'
    }, 100)
  }

  // Анимация области
  const area = document.querySelector('.area-fill') as SVGPathElement
  if (area) {
    setTimeout(() => {
      area.style.transition = 'opacity 0.8s ease-in-out'
      area.style.opacity = '1'
    }, 300)
  }

  // Анимация точек
  const points = document.querySelectorAll('.data-point')
  points.forEach((point, index) => {
    setTimeout(
      () => {
        ;(point as SVGElement).style.transition = 'r 0.3s ease-out'
        ;(point as SVGElement).setAttribute('r', '4')
      },
      600 + index * 80,
    )
  })

  // Анимация подписей месяцев
  const labels = document.querySelectorAll('.month-labels text')
  labels.forEach((label, index) => {
    setTimeout(
      () => {
        ;(label as SVGElement).style.transition = 'opacity 0.5s ease-in-out'
        ;(label as SVGElement).style.opacity = '1'
      },
      800 + index * 80,
    )
  })
}

const loadRevenueData = async (year: number) => {
  loading.value = true
  try {
    // Загружаем данные о выручке (теперь по общей сумме, а не по оплаченной)
    const response = (await apiRequest(
      `/stats/revenue-by-month?year=${year}`,
    )) as RevenueByMonthResponse

    // Проверяем, что ответ содержит необходимые данные
    if (response && response.monthly_data) {
      revenueData.value = response

      // Запускаем анимацию после загрузки данных
      if (response.monthly_data.length > 0) {
        setTimeout(animateChart, 100)
      }
    } else {
      console.warn('Получены некорректные данные о выручке (общая сумма):', response)
    }
  } catch (error) {
    console.error('Ошибка загрузки данных выручки (общая сумма):', error)
    // Устанавливаем пустые данные при ошибке
    revenueData.value = {
      monthly_data: [],
      total_revenue: 0,
      total_revenue_formatted: '0',
      year: year,
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRevenueData(currentYear)
})
</script>

<style scoped>
.chart-line {
  transition: opacity 0.5s ease-in-out;
}

.area-fill {
  transition: opacity 0.5s ease-in-out;
}

.data-point {
  transition: r 0.3s ease-out;
}

.month-labels text {
  transition: opacity 0.5s ease-in-out;
}

/* Hover эффекты */
.data-point:hover {
  r: 6 !important;
  fill: #1d4ed8;
  transition: all 0.2s ease-in-out;
}
</style>
