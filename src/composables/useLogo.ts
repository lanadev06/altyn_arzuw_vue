import { ref, onMounted } from 'vue'

const LOGO_VERSION = '3.0' // Версия для обхода кэша - увеличивайте при обновлении логотипа
const LOGO_URL = `/logo.svg?v=${LOGO_VERSION}&t=${Date.now()}` // URL с версией и timestamp

// Глобальные переменные для предотвращения повторной загрузки
let globalLogoDataUrl = ''
let globalIsLoading = false
let globalError = ''
let isInitialized = false

export function useLogo() {
  const logoDataUrl = ref<string>(globalLogoDataUrl)
  const isLoading = ref<boolean>(globalIsLoading)
  const error = ref<string>(globalError)

  // Автоматически очищаем старый кэш при инициализации
  if (typeof window !== 'undefined') {
    try {
      // Очищаем старый localStorage кэш
      localStorage.removeItem('altyn_arzuw_logo')
      
      // Очищаем старые версии в localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('logo') && key !== 'altyn_arzuw_logo') {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      // Игнорируем ошибки очистки localStorage
    }
  }

  // Загружаем логотип
  const loadLogo = async (): Promise<void> => {
    // Если уже загружаем или загружен, не делаем повторный запрос
    if (globalIsLoading || isInitialized) {
      return
    }

    try {
      globalIsLoading = true
      isLoading.value = true
      globalError = ''
      error.value = ''

      // Загружаем логотип с версией для обхода кэша
      const response = await fetch(LOGO_URL, {
        cache: 'no-cache', // Отключаем кэш для получения актуальной версии
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (!response.ok) {
        throw new Error(`Не удалось загрузить логотип: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      const reader = new FileReader()

      reader.onload = () => {
        const dataUrl = reader.result as string
        globalLogoDataUrl = dataUrl
        logoDataUrl.value = dataUrl

        globalIsLoading = false
        isLoading.value = false
        isInitialized = true
      }

      reader.onerror = () => {
        throw new Error('Ошибка чтения файла логотипа')
      }

      reader.readAsDataURL(blob)
    } catch (err) {
      globalError = err instanceof Error ? err.message : 'Неизвестная ошибка'
      globalIsLoading = false
      error.value = globalError
      isLoading.value = false
    }
  }

  // Очищаем логотип
  const clearLogo = (): void => {
    globalLogoDataUrl = ''
    logoDataUrl.value = ''
    globalIsLoading = false
    isLoading.value = false
    globalError = ''
    error.value = ''
    isInitialized = false
  }

  // Принудительно перезагружаем логотип
  const reloadLogo = async (): Promise<void> => {
    clearLogo()
    await loadLogo()
  }

  // Получаем URL логотипа (из кэша или оригинальный)
  const getLogoUrl = (): string => {
    return logoDataUrl.value || LOGO_URL
  }

  // Инициализируем только один раз
  if (!isInitialized) {
    onMounted(() => {
      loadLogo()
    })
  }

  // Принудительно обновляем логотип (для администраторов)
  const forceUpdateLogo = async (): Promise<void> => {
    // Очищаем localStorage
    try {
      localStorage.removeItem('altyn_arzuw_logo')
      // Очищаем все ключи связанные с логотипом
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('logo')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      // Игнорируем ошибки
    }

    // Очищаем кэш браузера
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          for (const request of requests) {
            if (request.url.includes('logo.svg') || request.url.includes('logo')) {
              await cache.delete(request)
            }
          }
        }
      } catch (e) {
        // Игнорируем ошибки кэша
      }
    }

    // Очищаем sessionStorage
    try {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.includes('logo')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    } catch (e) {
      // Игнорируем ошибки
    }
    
    // Очищаем и перезагружаем логотип
    clearLogo()
    
    // Принудительно обновляем глобальные переменные
    globalLogoDataUrl = ''
    globalIsLoading = false
    globalError = ''
    isInitialized = false
    
    await loadLogo()
  }

  return {
    logoDataUrl,
    isLoading,
    error,
    loadLogo,
    clearLogo,
    reloadLogo,
    getLogoUrl,
    forceUpdateLogo,
  }
}

// Глобальная функция для обновления логотипа (доступна в консоли браузера)
if (typeof window !== 'undefined') {
  (window as any).updateLogo = async () => {
    
    // Очищаем все кэши
    try {
      localStorage.removeItem('altyn_arzuw_logo')
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('logo')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      // Ошибка очистки localStorage
    }

    // Очищаем кэш браузера
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          for (const request of requests) {
            if (request.url.includes('logo.svg') || request.url.includes('logo')) {
              await cache.delete(request)
            }
          }
        }
      } catch (e) {
        // Ошибка очистки кэша
      }
    }

    window.location.reload()
  }
  
}
