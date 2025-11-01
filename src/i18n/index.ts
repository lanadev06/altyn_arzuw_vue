import { createI18n } from 'vue-i18n'
import ru from './locales/ru.json'
import tm from './locales/tm.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('app_language') || 'ru',
  fallbackLocale: 'ru',
  messages: {
    ru,
    tm,
  },
})

export default i18n

