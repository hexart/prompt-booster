// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: [
      'zh-CN', 'zh-Hant', 'en-US', 'ja-JP', 'ko-KR', 'de-DE',
      'tr-TR', 'ru-RU', 'es-ES', 'fr-FR', 'ar-SA', 'pt-BR', 'hi-IN',
      'it-IT', 'id-ID', 'ur-PK', 'fa-IR', 'nl-NL'
    ],

    debug: false,

    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng) => {
        // 处理中文语言代码的映射
        if (lng.includes('zh-CN') || lng.includes('zh-Hans') || lng === 'zh') {
          return 'zh-CN';
        }
        if (lng.includes('zh-TW') || lng.includes('zh-HK') || lng.includes('zh-Hant')) {
          return 'zh-Hant';
        }
        return lng;
      }
    },

    backend: {
      loadPath: './locales/{{lng}}.json'
    }
  });

export default i18n;