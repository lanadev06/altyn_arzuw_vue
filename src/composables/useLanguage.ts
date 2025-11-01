import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type SupportedLocale = 'ru' | 'tm'

const SUPPORTED_LOCALES: SupportedLocale[] = ['ru', 'tm']
const DEFAULT_LOCALE: SupportedLocale = 'ru'
const STORAGE_KEY = 'app_language'

export function useLanguage() {
  const { locale, t } = useI18n()

  const currentLocale = computed<SupportedLocale>({
    get: () => locale.value as SupportedLocale,
    set: (value: SupportedLocale) => {
      locale.value = value
      localStorage.setItem(STORAGE_KEY, value)
    },
  })

  const availableLocales = computed(() => SUPPORTED_LOCALES)

  const localeNames: Record<SupportedLocale, string> = {
    ru: 'Русский',
    tm: 'Türkmen',
  }

  function setLocale(localeCode: SupportedLocale) {
    if (SUPPORTED_LOCALES.includes(localeCode)) {
      currentLocale.value = localeCode
    } else {
      currentLocale.value = DEFAULT_LOCALE
    }
  }

  function getLocaleName(localeCode: SupportedLocale): string {
    return localeNames[localeCode] || localeCode
  }

  // Инициализация при первом запуске
  function initLocale() {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      currentLocale.value = stored
    } else {
      // Определяем язык браузера
      const browserLang = navigator.language.split('-')[0] as SupportedLocale
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        currentLocale.value = browserLang
      } else {
        currentLocale.value = DEFAULT_LOCALE
      }
    }
  }

  return {
    currentLocale,
    availableLocales,
    localeNames,
    setLocale,
    getLocaleName,
    initLocale,
    t,
  }
}

