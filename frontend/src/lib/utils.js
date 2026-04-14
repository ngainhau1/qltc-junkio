import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { store } from "@/store"
import i18n from "i18next"
import { vi, enUS } from 'date-fns/locale'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
    // Lấy config tiền tệ từ Store (mặc định VND)
    const state = store.getState();
    const currency = state.settings?.currency || 'VND';

    const locale = currency === 'USD' ? 'en-US' : 'vi-VN';
    const curr = currency === 'USD' ? 'USD' : 'VND';

    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
    }).format(numericAmount);
}

export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // \u0300, \u0301, \u0303, \u0309, \u0323
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣ 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
}

// --- Date/Time Utils ---

export const getDateLocale = () => {
    return i18n.language?.startsWith('vi') ? vi : enUS;
}

export function formatShortDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const localeStr = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return new Intl.DateTimeFormat(localeStr, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

export function formatDateString(dateString, options = {}) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const localeStr = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return new Intl.DateTimeFormat(localeStr, options).format(date);
}
