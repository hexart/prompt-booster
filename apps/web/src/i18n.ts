// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 安全地访问localStorage（防止SSR问题）
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('i18nextLng');
  }
  return null;
};

const setLanguagePreference = () => {
  if (typeof window === 'undefined') return;

  const currentLanguage = getStoredLanguage();

  if (!currentLanguage) {
    const systemLang = navigator.language;

    if (systemLang.includes('zh-CN') || systemLang.includes('zh-Hans') || systemLang === 'zh') {
      localStorage.setItem('i18nextLng', 'zh-CN');
    } else if (systemLang.includes('zh-TW') || systemLang.includes('zh-HK') || systemLang.includes('zh-Hant')) {
      localStorage.setItem('i18nextLng', 'zh-Hant');
    }
  }
};

setLanguagePreference();

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: [
      'zh-CN', 'zh-Hant', 'en-US', 'ja-JP', 'ko-KR', 'de-DE',
      'tr-TR', 'ru-RU', 'es-ES', 'fr-FR', 'ar-SA', 'pt-BR', 'hi-IN',
      'it-IT', 'id-ID', 'ur-PK', 'fa-IR'
    ],

    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    backend: {
      loadPath: './locales/{{lng}}.json'
    },
    react: {
      useSuspense: false,  // 关键：React 19 兼容性
      bindI18n: 'languageChanged loaded',  // 添加：确保事件绑定
      bindI18nStore: 'added removed'  // 添加：确保存储事件绑定
    }
  });

export default i18n;