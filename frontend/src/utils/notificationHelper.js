/**
 * Parse notification text that may contain i18n JSON payload.
 * Backend stores notifications as JSON with { key, params } for i18n support.
 * This helper detects and translates them, or returns raw text as fallback.
 *
 * @param {string} text - Raw notification text or JSON payload
 * @param {Function} t - i18next translation function
 * @returns {string} Translated notification text
 */
export const parseNotificationText = (text, t) => {
    if (!text) return '';
    if (typeof text === 'string' && text.startsWith('{') && text.includes('"key"')) {
        try {
            const parsed = JSON.parse(text);
            return t(parsed.key, parsed.params || {});
        } catch {
            return t(text);
        }
    }
    // If it's a known key or fallback raw string
    return t(text);
};
