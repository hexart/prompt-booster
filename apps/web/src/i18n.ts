// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 预处理系统语言（可选）
const systemLang = navigator.language;
if (systemLang === 'zh') {
    localStorage.setItem('i18nextLng', 'zh-CN');
} else if (systemLang === 'en') {
    localStorage.setItem('i18nextLng', 'en-US');
} else if (systemLang === 'ja') {
    localStorage.setItem('i18nextLng', 'ja-JP');
} else if (systemLang === 'de') {
    localStorage.setItem('i18nextLng', 'de-DE');
}

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'zh-CN',
        supportedLngs: ['zh-CN', 'en-US', 'ja-JP', 'de-DE'],

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
        }
    });

// 添加事件监听器处理检测到的语言
i18n.on('initialized', () => {
    console.log('i18next初始化完成，当前语言:', i18n.language);

    // 处理简码映射
    const currentLang = i18n.language;
    if (currentLang === 'zh') {
        i18n.changeLanguage('zh-CN');
    } else if (currentLang === 'en') {
        i18n.changeLanguage('en-US');
    } else if (currentLang === 'ja') {
        i18n.changeLanguage('ja-JP');
    } else if (currentLang === 'de') {
        i18n.changeLanguage('de-DE');
    }
});

export default i18n;