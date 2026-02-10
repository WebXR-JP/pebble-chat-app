import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { ja } from './locales/ja'
import { en } from './locales/en'
import { ko } from './locales/ko'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      ko: { translation: ko }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export { i18n }
