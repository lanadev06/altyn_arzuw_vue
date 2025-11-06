<template>
  <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
    <!-- Заголовок -->
    <div class="mb-6">
      <h3 class="text-xl font-bold text-gray-900 mb-1">{{ t('dashboard.totalRevenueByMonth') }}</h3>
      <p class="text-3xl font-bold text-blue-600">
        {{ revenueData.total_revenue_formatted }} <span class="text-lg text-gray-500">TMT</span>
      </p>
      <p class="text-sm text-gray-500 mt-1">
        {{ t('dashboard.totalRevenueForYear', { year: revenueData.year }) }}
      </p>
      <p class="text-xs text-gray-400 mt-1">
        {{ t('dashboard.includesAllProjects') }}
      </p>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex items-center justify-center h-80">
      <div class="flex flex-col items-center space-y-3">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"
        ></div>
        <p class="text-gray-500 text-sm">{{ t('dashboard.loadingData') }}</p>
      </div>
    </div>

    <!-- Chart.js график -->
    <div v-else class="relative">
      <div class="relative h-80 w-full">
        <canvas 
          ref="chartCanvas" 
          class="w-full h-full"
          style="display: block; width: 100%; height: 320px;"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import { apiRequest } from '../../services/api'
import type { RevenueByMonthResponse } from '../../types/api'

const { t } = useI18n()

// Регистрируем все компоненты Chart.js
Chart.register(...registerables)

const currentYear = new Date().getFullYear()
const loading = ref(false)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const revenueData = ref<RevenueByMonthResponse>({
  monthly_data: [],
  total_revenue: 0,
  total_revenue_formatted: '0',
  year: currentYear,
})

// Функция для перевода месяцев используя i18n
const getMonthName = (monthName: string): string => {
  const monthKey = monthName.toLowerCase()
  return t(`months.${monthKey}`) || monthName
}

const createChart = () => {
  if (!chartCanvas.value) {
    setTimeout(() => {
      if (chartCanvas.value) {
        createChart()
      }
    }, 50)
    return
  }

  if (!revenueData.value.monthly_data.length) {
    return
  }

  // Уничтожаем предыдущий график если он существует
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) {
    return
  }

  const labels = revenueData.value.monthly_data.map(data => getMonthName(data.month_name))
  const data = revenueData.value.monthly_data.map(data => data.revenue)

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('dashboard.revenueChart'),
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#1d4ed8',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#93c5fd',
          bodyColor: '#ffffff',
          borderColor: 'rgba(55, 65, 81, 1)',
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: false,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 16,
            weight: 'bold'
          },
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              const value = context.parsed.y
              return `${value.toLocaleString('ru-RU')} TMT`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(243, 244, 246, 1)',
            lineWidth: 1
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(243, 244, 246, 1)',
            lineWidth: 1
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
              weight: 'normal'
            },
            callback: function(value) {
              return `${value}M`
            }
          }
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeInOutQuart'
      }
    }
  })
}

const loadRevenueData = async (year: number) => {
  loading.value = true
  try {
    const response = (await apiRequest(
      `/stats/revenue-by-month?year=${year}`,
    )) as RevenueByMonthResponse

    if (response && response.monthly_data) {
      revenueData.value = response
      await nextTick()
      setTimeout(() => {
        createChart()
      }, 100)
    }
  } catch (error: any) {
    // Игнорируем 429 ошибки - они обрабатываются глобально
    if (error?.status === 429) {
      console.warn('Rate limit exceeded for revenue data. Will retry later.')
      // Не сбрасываем данные, оставляем предыдущие значения
      return
    }
    
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

// Следим за изменениями данных и пересоздаем график
watch(() => revenueData.value.monthly_data, () => {
  if (revenueData.value.monthly_data.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        createChart()
      }, 100)
    })
  }
}, { deep: true })

onMounted(() => {
  loadRevenueData(currentYear)
})

onUpdated(() => {
  if (chartCanvas.value && revenueData.value.monthly_data.length > 0 && !chartInstance) {
    createChart()
  }
})

defineOptions({
  name: 'RevenueChart'
})
</script>

<style scoped>
/* Chart.js автоматически адаптируется под размер контейнера */
canvas {
  max-width: 100%;
  height: auto;
}
</style>
