// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources: {
        en: { translation: en },
        zh: { translation: zh },
    },
    lng: 'en', // 默认语言
    fallbackLng: 'zh', // 备用语言
    interpolation: {
        escapeValue: false, // React 已经自动防止XSS
    },
});

export default i18n;
