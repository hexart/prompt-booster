// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 首先检查localStorage中是否已有语言设置
const currentLanguage = localStorage.getItem('i18nextLng');

if (!currentLanguage) {
    // 预处理系统语言，只有在没有已保存的语言时才进行
    const systemLang = navigator.language;
    
    // 对于简体中文和繁体中文的特殊处理
    if (systemLang.includes('zh-CN') || systemLang.includes('zh-Hans') || systemLang === 'zh') {
        localStorage.setItem('i18nextLng', 'zh-CN');
    } else if (systemLang.includes('zh-TW') || systemLang.includes('zh-HK') || systemLang.includes('zh-Hant')) {
        localStorage.setItem('i18nextLng', 'zh-Hant');
    }
}

// 确保initReactI18next在use链中，这样才能让react-i18next识别到i18n实例
i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next) // 这一步很关键，必须在init之前调用
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
            loadPath: './locales/{{lng}}.json',
            // 添加跨域支持
            crossDomain: false,
            // 异步加载
            requestOptions: {
                mode: 'cors',
                credentials: 'same-origin',
                cache: 'default'
            }
        },
        // 确保react集成
        react: {
            useSuspense: true
        }
    });

// 简单记录初始化完成
i18n.on('initialized', () => {
    // console.log('i18next初始化完成，当前语言:', i18n.language);
});

export default i18n;