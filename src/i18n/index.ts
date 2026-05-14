import { createI18n } from 'vue-i18n'
import zh_TW from './zh_TW'
import zh_CN from './zh_CN'
import en_US from './en_US'
import ja_JP from './ja_JP'

export const LOCALE_OPTIONS = [
  { label: '繁體中文', value: 'zh_TW' },
  { label: '简体中文', value: 'zh_CN' },
  { label: 'English', value: 'en_US' },
  { label: '日本語', value: 'ja_JP' },
]

export const i18n = createI18n({
  legacy: false,
  locale: 'zh_TW',
  fallbackLocale: 'en_US',
  messages: {
    zh_TW,
    zh_CN,
    en_US,
    ja_JP,
  },
})

export default i18n
