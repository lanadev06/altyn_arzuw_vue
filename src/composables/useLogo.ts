import { ref, onMounted } from 'vue'

const LOGO_KEY = 'altyn_arzuw_logo'
const LOGO_URL = '/logo.svg' // Убираем Date.now() для стабильного кэширования

// Глобальные переменные для предотвращения повторной загрузки
let globalLogoDataUrl = ''
let globalIsLoading = false
let globalError = ''
let isInitialized = false

export function useLogo() {
  // Синхронно загружаем из localStorage при инициализации
  if (!globalLogoDataUrl && !isInitialized) {
    const cached = localStorage.getItem(LOGO_KEY)
    if (cached) {
      try {
        // Пытаемся распарсить как JSON (новая версия)
        const logoData = JSON.parse(cached)
        if (logoData.dataUrl) {
          globalLogoDataUrl = logoData.dataUrl
        } else {
          // Fallback для старого формата
          globalLogoDataUrl = cached
        }
      } catch {
        // Fallback для старого формата (просто строка)
        globalLogoDataUrl = cached
      }
      globalIsLoading = false
      isInitialized = true
    }
  }

  const logoDataUrl = ref<string>(globalLogoDataUrl)
  const isLoading = ref<boolean>(globalIsLoading)
  const error = ref<string>(globalError)

  // Загружаем логотип в localStorage
  const loadLogoToStorage = async (): Promise<void> => {
    // Если уже загружаем, не делаем повторный запрос
    if (globalIsLoading) {
      return
    }

    try {
      // Проверяем, есть ли уже логотип в localStorage
      const cached = localStorage.getItem(LOGO_KEY)
      if (cached) {
        try {
          // Пытаемся распарсить как JSON (новая версия)
          const logoData = JSON.parse(cached)
          if (logoData.dataUrl) {
            globalLogoDataUrl = logoData.dataUrl
            logoDataUrl.value = logoData.dataUrl
          } else {
            // Fallback для старого формата
            globalLogoDataUrl = cached
            logoDataUrl.value = cached
          }
        } catch {
          // Fallback для старого формата (просто строка)
          globalLogoDataUrl = cached
          logoDataUrl.value = cached
        }
        globalIsLoading = false
        isLoading.value = false
        isInitialized = true
        return
      }

      // Если уже инициализированы, не загружаем повторно
      if (isInitialized) {
        return
      }

      globalIsLoading = true
      isLoading.value = true
      globalError = ''
      error.value = ''

      // Если нет в кэше, загружаем и сохраняем
      const response = await fetch(LOGO_URL, {
        cache: 'force-cache', // Принудительное использование кэша браузера
        headers: {
          'Cache-Control': 'max-age=86400' // Кэш на 24 часа
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

        // Сохраняем в localStorage с меткой времени
        try {
          const logoData = {
            dataUrl,
            timestamp: Date.now(),
            version: '1.0'
          }
          localStorage.setItem(LOGO_KEY, JSON.stringify(logoData))
        } catch (e) {
          // Не удалось сохранить логотип в localStorage
        }

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

  // Очищаем логотип из localStorage
  const clearLogoFromStorage = (): void => {
    try {
      localStorage.removeItem(LOGO_KEY)
      globalLogoDataUrl = ''
      logoDataUrl.value = ''
      isInitialized = false
    } catch (e) {
      // Не удалось очистить логотип из localStorage
    }
  }

  // Принудительно перезагружаем логотип
  const reloadLogo = async (): Promise<void> => {
    clearLogoFromStorage()
    globalIsLoading = true
    isLoading.value = true
    globalError = ''
    error.value = ''
    await loadLogoToStorage()
  }

  // Получаем URL логотипа (из кэша или оригинальный)
  const getLogoUrl = (): string => {
    return logoDataUrl.value || LOGO_URL
  }

  // Инициализируем только один раз
  if (!isInitialized) {
    onMounted(() => {
      loadLogoToStorage()
    })
  }

  // Очищаем кэш для загрузки нового логотипа
  const clearCacheForNewLogo = (): void => {
    clearLogoFromStorage()
    globalIsLoading = false
    isLoading.value = false
    isInitialized = false
  }

  return {
    logoDataUrl,
    isLoading,
    error,
    loadLogoToStorage,
    clearLogoFromStorage,
    reloadLogo,
    getLogoUrl,
    clearCacheForNewLogo,
  }
}
