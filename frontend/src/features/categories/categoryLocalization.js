const CATEGORY_TRANSLATION_KEY_MAP = {
    'an uong': 'categories.labels.food',
    'food': 'categories.labels.food',
    'food dining': 'categories.labels.food',
    'di chuyen': 'categories.labels.transport',
    'transport': 'categories.labels.transport',
    'transportation': 'categories.labels.transport',
    'nha cua': 'categories.labels.housing',
    'housing': 'categories.labels.housing',
    'home': 'categories.labels.housing',
    'giai tri': 'categories.labels.entertainment',
    'entertainment': 'categories.labels.entertainment',
    'mua sam': 'categories.labels.shopping',
    'shopping': 'categories.labels.shopping',
    'suc khoe': 'categories.labels.health',
    'health': 'categories.labels.health',
    'health fitness': 'categories.labels.health',
    'giao duc': 'categories.labels.education',
    'education': 'categories.labels.education',
    'dich vu so': 'categories.labels.digitalServices',
    'digital services': 'categories.labels.digitalServices',
    'digital service': 'categories.labels.digitalServices',
    'hoa don tien ich': 'categories.labels.utilities',
    'utilities': 'categories.labels.utilities',
    'bills utilities': 'categories.labels.utilities',
    'luong': 'categories.labels.salary',
    'salary': 'categories.labels.salary',
    'thuong': 'categories.labels.bonus',
    'bonus': 'categories.labels.bonus',
    'dau tu': 'categories.labels.investment',
    'investment': 'categories.labels.investment',
    'thu nhap phu': 'categories.labels.sideIncome',
    'side income': 'categories.labels.sideIncome',
    'extra income': 'categories.labels.sideIncome',
};

const normalizeCategoryName = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' ')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');

export const getCategoryTranslationKey = (categoryName) =>
    CATEGORY_TRANSLATION_KEY_MAP[normalizeCategoryName(categoryName)] || null;

export const localizeCategoryName = (categoryName, translate) => {
    if (!categoryName) {
        return categoryName;
    }

    const translationKey = getCategoryTranslationKey(categoryName);

    if (!translationKey) {
        return categoryName;
    }

    return translate(translationKey, { defaultValue: categoryName });
};
