import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Composable для оптимизации производительности компонентов
 */
export function useComponentOptimization() {
  const isVisible = ref(false)
  const isLoaded = ref(false)
  const loadingTime = ref(0)

  // Отслеживание времени загрузки
  const startTime = performance.now()

  onMounted(async () => {
    // Ждем следующий тик для отображения
    await nextTick()
    isVisible.value = true
    
    // Отслеживаем время загрузки
    loadingTime.value = performance.now() - startTime
    
    // Помечаем как загруженный через небольшую задержку
    setTimeout(() => {
      isLoaded.value = true
    }, 50)
  })

  onUnmounted(() => {
    isVisible.value = false
    isLoaded.value = false
  })

  return {
    isVisible,
    isLoaded,
    loadingTime
  }
}

/**
 * Composable для ленивой загрузки данных
 */
export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  options: {
    immediate?: boolean
    delay?: number
    retry?: number
  } = {}
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const retryCount = ref(0)

  const { immediate = true, delay = 0, retry = 3 } = options

  const fetch = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const result = await fetchFn()
      data.value = result
      retryCount.value = 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      
      if (retryCount.value < retry) {
        retryCount.value++
        setTimeout(fetch, 1000 * retryCount.value) // Exponential backoff
      }
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    fetch()
  }

  return {
    data,
    loading,
    error,
    retryCount,
    fetch,
    refetch: fetch
  }
}

/**
 * Composable для дебаунсинга
 */
export function useDebounce<T>(value: T, delay: number = 300) {
  const debouncedValue = ref(value)
  let timeoutId: number | null = null

  const updateValue = (newValue: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = window.setTimeout(() => {
      debouncedValue.value = newValue
      timeoutId = null
    }, delay)
  }

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    debouncedValue,
    updateValue
  }
}

/**
 * Composable для виртуализации списков
 */
export function useVirtualization(
  items: any[],
  options: {
    itemHeight: number
    containerHeight: number
    overscan?: number
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options
  
  const scrollTop = ref(0)
  const visibleStart = ref(0)
  const visibleEnd = ref(0)
  const visibleItems = ref<any[]>([])

  const updateVisibleItems = () => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    
    visibleStart.value = Math.max(0, start - overscan)
    visibleEnd.value = end
    
    visibleItems.value = items.slice(visibleStart.value, visibleEnd.value)
  }

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    updateVisibleItems()
  }

  // Инициализация
  updateVisibleItems()

  return {
    scrollTop,
    visibleStart,
    visibleEnd,
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart.value * itemHeight
  }
}

/**
 * Composable для кэширования вычислений
 */
export function useMemoizedComputed<T>(
  computeFn: () => T,
  deps: any[] = []
) {
  const cache = new Map<string, T>()
  const lastDeps = ref<any[]>([])

  return computed(() => {
    const depsKey = JSON.stringify(deps)
    
    if (cache.has(depsKey) && JSON.stringify(lastDeps.value) === depsKey) {
      return cache.get(depsKey)!
    }

    const result = computeFn()
    cache.set(depsKey, result)
    lastDeps.value = [...deps]
    
    return result
  })
}

/**
 * Composable для оптимизации рендеринга списков
 */
export function useListRendering<T>(
  items: T[],
  options: {
    batchSize?: number
    delay?: number
    keyField?: string
  } = {}
) {
  const { batchSize = 20, delay = 16, keyField = 'id' } = options
  
  const renderedItems = ref<T[]>([])
  const isRendering = ref(false)
  const currentIndex = ref(0)

  const renderBatch = () => {
    if (currentIndex.value >= items.length) {
      isRendering.value = false
      return
    }

    const endIndex = Math.min(currentIndex.value + batchSize, items.length)
    const batch = items.slice(currentIndex.value, endIndex)
    
    renderedItems.value.push(...batch)
    currentIndex.value = endIndex

    if (currentIndex.value < items.length) {
      setTimeout(renderBatch, delay)
    } else {
      isRendering.value = false
    }
  }

  const startRendering = () => {
    if (isRendering.value) return
    
    isRendering.value = true
    currentIndex.value = 0
    renderedItems.value = []
    renderBatch()
  }

  const resetRendering = () => {
    renderedItems.value = []
    currentIndex.value = 0
    isRendering.value = false
  }

  // Автоматически начинаем рендеринг при изменении items
  watch(() => items, () => {
    resetRendering()
    startRendering()
  }, { immediate: true })

  return {
    renderedItems,
    isRendering,
    startRendering,
    resetRendering
  }
}

/**
 * Composable для оптимизации поиска
 */
export function useSearchOptimization<T>(
  items: T[],
  searchFields: string[],
  options: {
    debounceMs?: number
    minLength?: number
    caseSensitive?: boolean
  } = {}
) {
  const { debounceMs = 300, minLength = 2, caseSensitive = false } = options
  
  const searchQuery = ref('')
  const filteredItems = ref<T[]>(items)
  const isSearching = ref(false)

  let searchTimeout: number | null = null

  const performSearch = (query: string) => {
    if (query.length < minLength) {
      filteredItems.value = items
      isSearching.value = false
      return
    }

    isSearching.value = true
    
    const normalizedQuery = caseSensitive ? query : query.toLowerCase()
    
    filteredItems.value = items.filter(item => {
      return searchFields.some(field => {
        const value = (item as any)[field]
        if (!value) return false
        
        const normalizedValue = caseSensitive ? value.toString() : value.toString().toLowerCase()
        return normalizedValue.includes(normalizedQuery)
      })
    })
    
    isSearching.value = false
  }

  const debouncedSearch = (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = window.setTimeout(() => {
      performSearch(query)
    }, debounceMs)
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    debouncedSearch(query)
  }

  const clearSearch = () => {
    searchQuery.value = ''
    filteredItems.value = items
    isSearching.value = false
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }

  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })

  return {
    searchQuery,
    filteredItems,
    isSearching,
    setSearchQuery,
    clearSearch
  }
}
