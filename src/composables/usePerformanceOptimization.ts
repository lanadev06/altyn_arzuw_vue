import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * Composable для оптимизации производительности тяжелых вычислений
 */
export function usePerformanceOptimization() {
  const isIdle = ref(true)
  const frameId = ref<number | null>(null)
  const pendingTasks = ref<(() => void)[]>([])

  // Функция для выполнения задач в idle time
  const scheduleTask = (task: () => void) => {
    pendingTasks.value.push(task)
    
    if (isIdle.value) {
      executeNextTask()
    }
  }

  const executeNextTask = () => {
    if (pendingTasks.value.length === 0) {
      isIdle.value = true
      return
    }

    isIdle.value = false
    const task = pendingTasks.value.shift()!
    
    // Используем requestIdleCallback если доступен, иначе setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        task()
        nextTick(() => executeNextTask())
      })
    } else {
      setTimeout(() => {
        task()
        nextTick(() => executeNextTask())
      }, 0)
    }
  }

  onUnmounted(() => {
    if (frameId.value) {
      cancelAnimationFrame(frameId.value)
    }
  })

  return {
    scheduleTask,
    isIdle
  }
}

/**
 * Composable для оптимизации больших списков
 */
export function useListOptimization<T>(
  items: T[],
  options: {
    pageSize?: number
    virtualScrolling?: boolean
    itemHeight?: number
    containerHeight?: number
  } = {}
) {
  const {
    pageSize = 50,
    virtualScrolling = false,
    itemHeight = 50,
    containerHeight = 400
  } = options

  const currentPage = ref(1)
  const searchQuery = ref('')
  const sortBy = ref<string>('')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  // Фильтрация и сортировка
  const filteredItems = computed(() => {
    let result = [...items]

    // Поиск
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query)
      )
    }

    // Сортировка
    if (sortBy.value) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortBy.value]
        const bVal = (b as any)[sortBy.value]
        
        if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  })

  // Пагинация
  const paginatedItems = computed(() => {
    if (virtualScrolling) {
      return filteredItems.value
    }

    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredItems.value.slice(start, end)
  })

  // Виртуальная прокрутка
  const virtualItems = computed(() => {
    if (!virtualScrolling) return paginatedItems.value

    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.floor(scrollTop.value / itemHeight)
    const endIndex = Math.min(startIndex + visibleCount, filteredItems.value.length)

    return filteredItems.value.slice(startIndex, endIndex)
  })

  const scrollTop = ref(0)
  const totalPages = computed(() => 
    Math.ceil(filteredItems.value.length / pageSize)
  )

  const setPage = (page: number) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  }

  const setSearch = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const setSort = (field: string) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
    currentPage.value = 1
  }

  return {
    // Данные
    items: virtualScrolling ? virtualItems : paginatedItems,
    filteredItems,
    
    // Пагинация
    currentPage,
    totalPages,
    setPage,
    
    // Поиск и сортировка
    searchQuery,
    sortBy,
    sortOrder,
    setSearch,
    setSort,
    
    // Виртуальная прокрутка
    scrollTop,
    virtualItems: virtualScrolling ? virtualItems : null
  }
}

/**
 * Composable для оптимизации форм
 */
export function useFormOptimization() {
  const isSubmitting = ref(false)
  const validationErrors = ref<Record<string, string>>({})
  const touchedFields = ref<Set<string>>(new Set())

  const validateField = (field: string, value: any, rules: any) => {
    // Простая валидация
    if (rules.required && (!value || value.toString().trim() === '')) {
      validationErrors.value[field] = 'Поле обязательно для заполнения'
      return false
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      validationErrors.value[field] = `Минимум ${rules.minLength} символов`
      return false
    }

    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      validationErrors.value[field] = 'Некорректный email'
      return false
    }

    delete validationErrors.value[field]
    return true
  }

  const validateForm = (formData: Record<string, any>, rules: Record<string, any>) => {
    let isValid = true
    
    Object.keys(rules).forEach(field => {
      if (!validateField(field, formData[field], rules[field])) {
        isValid = false
      }
    })

    return isValid
  }

  const touchField = (field: string) => {
    touchedFields.value.add(field)
  }

  const isFieldTouched = (field: string) => {
    return touchedFields.value.has(field)
  }

  const getFieldError = (field: string) => {
    return isFieldTouched(field) ? validationErrors.value[field] : ''
  }

  const resetForm = () => {
    validationErrors.value = {}
    touchedFields.value.clear()
    isSubmitting.value = false
  }

  return {
    isSubmitting,
    validationErrors,
    touchedFields,
    validateField,
    validateForm,
    touchField,
    isFieldTouched,
    getFieldError,
    resetForm
  }
}

/**
 * Composable для оптимизации изображений
 */
export function useImageOptimization() {
  const loadedImages = ref<Set<string>>(new Set())
  const loadingImages = ref<Set<string>>(new Set())
  const failedImages = ref<Set<string>>(new Set())

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (loadedImages.value.has(src)) {
        resolve(new Image())
        return
      }

      if (loadingImages.value.has(src)) {
        // Ждем завершения текущей загрузки
        const checkLoaded = () => {
          if (loadedImages.value.has(src)) {
            resolve(new Image())
          } else if (failedImages.value.has(src)) {
            reject(new Error('Image failed to load'))
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
        return
      }

      loadingImages.value.add(src)
      
      const img = new Image()
      img.onload = () => {
        loadedImages.value.add(src)
        loadingImages.value.delete(src)
        resolve(img)
      }
      
      img.onerror = () => {
        failedImages.value.add(src)
        loadingImages.value.delete(src)
        reject(new Error('Image failed to load'))
      }
      
      img.src = src
    })
  }

  const preloadImages = (srcs: string[]) => {
    return Promise.allSettled(srcs.map(src => loadImage(src)))
  }

  return {
    loadedImages,
    loadingImages,
    failedImages,
    loadImage,
    preloadImages
  }
}
