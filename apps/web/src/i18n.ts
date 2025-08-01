// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 首先检查localStorage中是否已有语言设置
const currentLanguage = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;

if (!currentLanguage && typeof window !== 'undefined') {
    // 预处理系统语言，只有在没有已保存的语言时才进行
    const systemLang = navigator.language || navigator.languages?.[0] || 'zh-CN';
    
    // 对于简体中文和繁体中文的特殊处理
    if (systemLang.includes('zh-CN') || systemLang.includes('zh-Hans') || systemLang === 'zh') {
        localStorage.setItem('i18nextLng', 'zh-CN');
    } else if (systemLang.includes('zh-TW') || systemLang.includes('zh-HK') || systemLang.includes('zh-Hant')) {
        localStorage.setItem('i18nextLng', 'zh-Hant');
    } else if (systemLang.includes('en')) {
        localStorage.setItem('i18nextLng', 'en-US');
    } else {
        // 默认设置为中文
        localStorage.setItem('i18nextLng', 'zh-CN');
    }
}

// 关键：使用同步初始化以避免 React 19 并发问题
const initializeI18n = () => {
    if (!i18n.isInitialized) {
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
                
                // 基本的i18next配置
                debug: false,
                interpolation: {
                    escapeValue: false
                },
                detection: {
                    order: ['localStorage', 'navigator'],
                    caches: ['localStorage']
                },
                backend: {
                    loadPath: '/locales/{{lng}}.json'
                },
                react: {
                    useSuspense: false
                },
                // 删除内联资源，使用外部JSON文件
            });
    }
    return i18n;
};

// 立即同步初始化
const i18nInstance = initializeI18n();

// 简单记录初始化完成
i18nInstance.on('initialized', () => {
    console.log('i18next initialized successfully, current language:', i18nInstance.language);
});

// 添加错误处理
i18nInstance.on('failedLoading', (lng, ns, msg) => {
    console.error(`Failed to load language ${lng} namespace ${ns}:`, msg);
    console.error('Current loadPath:', '/locales/{{lng}}.json');
});

i18nInstance.on('loaded', (loaded) => {
    console.log('Loaded translations:', loaded);
});

i18nInstance.on('languageChanged', (lng) => {
    console.log('Language changed to:', lng);
});

// 确保 i18n 实例在生产环境中被正确引用
if (process.env.NODE_ENV === 'production') {
    console.log('i18next instance created:', typeof i18nInstance.changeLanguage);
}

export default i18nInstance;