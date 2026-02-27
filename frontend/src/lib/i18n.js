import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from '../locales/en/translation.json';
import translationVI from '../locales/vi/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    vi: {
        translation: translationVI
    }
};

// Cố gắng lấy ngôn ngữ đã lưu trong Settings Redux Store ra để làm default nếu chưa có gì
const getStoredLanguage = () => {
    try {
        const storedSettings = localStorage.getItem('app_settings');
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            if (parsed.language) return parsed.language;
        }
    } catch {
        // fail silently
    }
    return 'vi'; // Default to vietnamese
}

i18n
    // Phát hiện ngôn ngữ trình duyệt (optional, nhưng ta ghi đè bằng Redux)
    .use(LanguageDetector)
    // Truyền instance i18n vào react-i18next
    .use(initReactI18next)
    // Khởi tạo i18next
    .init({
        resources,
        lng: getStoredLanguage(), // Ngôn ngữ mặc định load nhanh từ localStorage trước khi store mount
        fallbackLng: 'vi',      // Ngôn ngữ dự phòng nếu ngôn ngữ chính bị lỗi
        debug: false,

        interpolation: {
            escapeValue: false, // React đã an toàn khỏi XSS
        }
    });

export default i18n;
