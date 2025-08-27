import { ref, onMounted } from 'vue'

const LOGO_KEY = 'altyn_arzuw_logo'
const LOGO_URL = '/logo.png?v=' + Date.now()

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
      globalLogoDataUrl = cached
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
        globalLogoDataUrl = cached
        globalIsLoading = false
        logoDataUrl.value = cached
        isLoading.value = false
        return
      }

      // Если уже инициализированы, не загружаем повторно
      if (isInitialized) {
        return
      }

      globalIsLoading = true
      isLoading.value = true

      // Если нет в кэше, загружаем и сохраняем
      const response = await fetch(LOGO_URL)

      if (!response.ok) {
        throw new Error(`Не удалось загрузить логотип: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      const reader = new FileReader()

      reader.onload = () => {
        const dataUrl = reader.result as string
        globalLogoDataUrl = dataUrl
        logoDataUrl.value = dataUrl

        // Сохраняем в localStorage
        try {
          localStorage.setItem(LOGO_KEY, dataUrl)
        } catch (e) {
          console.warn('Не удалось сохранить логотип в localStorage:', e)
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
      console.error('Ошибка загрузки логотипа:', err)
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
      console.warn('Не удалось очистить логотип из localStorage:', e)
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

  return {
    logoDataUrl,
    isLoading,
    error,
    loadLogoToStorage,
    clearLogoFromStorage,
    reloadLogo,
    getLogoUrl,
  }
}
