// apps/web/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 预处理系统语言（可选）
const systemLang = navigator.language;
if (systemLang === 'zh' || systemLang === 'zh-CN' || systemLang === 'zh-Hans') {
    localStorage.setItem('i18nextLng', 'zh-CN');
} else if (systemLang === 'zh-TW' || systemLang === 'zh-HK' || systemLang === 'zh-Hant') {
    localStorage.setItem('i18nextLng', 'zh-Hant');
} else if (systemLang === 'en') {
    localStorage.setItem('i18nextLng', 'en-US');
} else if (systemLang === 'ja') {
    localStorage.setItem('i18nextLng', 'ja-JP');
} else if (systemLang === 'ko') {
    localStorage.setItem('i18nextLng', 'ko-KR');
} else if (systemLang === 'de') {
    localStorage.setItem('i18nextLng', 'de-DE');
} else if (systemLang === 'nl' || systemLang === 'nl-NL') {
    localStorage.setItem('i18nextLng', 'nl-NL');
} else if (systemLang === 'ru' || systemLang === 'ru-RU') {
    localStorage.setItem('i18nextLng', 'ru-RU');
} else if (systemLang === 'es' || systemLang === 'es-ES') {
    localStorage.setItem('i18nextLng', 'es-ES');
} else if (systemLang === 'fr' || systemLang === 'fr-FR') {
    localStorage.setItem('i18nextLng', 'fr-FR');
} else if (systemLang === 'ar' || systemLang === 'ar-SA') {
    localStorage.setItem('i18nextLng', 'ar-SA');
} else if (systemLang === 'pt' || systemLang === 'pt-BR') {
    localStorage.setItem('i18nextLng', 'pt-BR');
} else if (systemLang === 'hi' || systemLang === 'hi-IN') {
    localStorage.setItem('i18nextLng', 'hi-IN');
}

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'zh-CN',
        supportedLngs: [
            'zh-CN', 'zh-Hant', 'en-US', 'ja-JP', 'ko-KR', 'de-DE', 
            'nl-NL', 'ru-RU', 'es-ES', 'fr-FR', 'ar-SA', 'pt-BR', 'hi-IN'
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
        }
    });

// 添加事件监听器处理检测到的语言
i18n.on('initialized', () => {
    console.log('i18next初始化完成，当前语言:', i18n.language);

    // 处理简码映射
    const currentLang = i18n.language;
    if (currentLang === 'zh') {
        i18n.changeLanguage('zh-CN');
    } else if (currentLang === 'zh-TW' || currentLang === 'zh-HK' || currentLang === 'zh-Hant') {
        i18n.changeLanguage('zh-Hant');
    } else if (currentLang === 'en') {
        i18n.changeLanguage('en-US');
    } else if (currentLang === 'ja') {
        i18n.changeLanguage('ja-JP');
    } else if (currentLang === 'ko') {
        i18n.changeLanguage('ko-KR');
    } else if (currentLang === 'de') {
        i18n.changeLanguage('de-DE');
    } else if (currentLang === 'nl') {
        i18n.changeLanguage('nl-NL');
    } else if (currentLang === 'ru') {
        i18n.changeLanguage('ru-RU');
    } else if (currentLang === 'es') {
        i18n.changeLanguage('es-ES');
    } else if (currentLang === 'fr') {
        i18n.changeLanguage('fr-FR');
    } else if (currentLang === 'ar') {
        i18n.changeLanguage('ar-SA');
    } else if (currentLang === 'pt') {
        i18n.changeLanguage('pt-BR');
    } else if (currentLang === 'hi') {
        i18n.changeLanguage('hi-IN');
    }
});

export default i18n;