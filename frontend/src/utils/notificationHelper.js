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
    return t(text);
};
