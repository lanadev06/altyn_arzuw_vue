import { ref, onMounted } from 'vue'

const LOGO_KEY = 'altyn_arzuw_logo'
const LOGO_URL = '/A-A_logotype (colorful) (1) copy.png'

export function useLogo() {
  const logoDataUrl = ref<string>('')
  const isLoading = ref(true)
  const error = ref<string>('')

  // Загружаем логотип в localStorage
  const loadLogoToStorage = async (): Promise<void> => {
    try {
      // Проверяем, есть ли уже логотип в localStorage
      const cached = localStorage.getItem(LOGO_KEY)
      if (cached) {
        logoDataUrl.value = cached
        isLoading.value = false
        return
      }

      // Если нет в кэше, загружаем и сохраняем
      const response = await fetch(LOGO_URL)
      if (!response.ok) {
        throw new Error('Не удалось загрузить логотип')
      }

      const blob = await response.blob()
      const reader = new FileReader()

      reader.onload = () => {
        const dataUrl = reader.result as string
        logoDataUrl.value = dataUrl

        // Сохраняем в localStorage
        try {
          localStorage.setItem(LOGO_KEY, dataUrl)
        } catch (e) {
          console.warn('Не удалось сохранить логотип в localStorage:', e)
        }

        isLoading.value = false
      }

      reader.onerror = () => {
        throw new Error('Ошибка чтения файла логотипа')
      }

      reader.readAsDataURL(blob)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
      isLoading.value = false
      console.error('Ошибка загрузки логотипа:', err)
    }
  }

  // Очищаем логотип из localStorage
  const clearLogoFromStorage = (): void => {
    try {
      localStorage.removeItem(LOGO_KEY)
      logoDataUrl.value = ''
    } catch (e) {
      console.warn('Не удалось очистить логотип из localStorage:', e)
    }
  }

  // Принудительно перезагружаем логотип
  const reloadLogo = async (): Promise<void> => {
    clearLogoFromStorage()
    isLoading.value = true
    error.value = ''
    await loadLogoToStorage()
  }

  // Получаем URL логотипа (из кэша или оригинальный)
  const getLogoUrl = (): string => {
    return logoDataUrl.value || LOGO_URL
  }

  onMounted(() => {
    loadLogoToStorage()
  })

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
