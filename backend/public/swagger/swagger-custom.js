(function () {
    const LOGIN_PATH = '/api/auth/login';

    const parseResponseUrl = (input) => {
        if (typeof input === 'string') return input;
        if (input && typeof input.url === 'string') return input.url;
        return '';
    };

    const autoAuthorizeFromLogin = async (res, requestUrl) => {
        try {
            if (!res || !res.ok || !requestUrl.includes(LOGIN_PATH)) return;
            const cloned = res.clone();
            const payload = await cloned.json();
            const token = payload?.data?.token || payload?.token;
            if (token && window.ui && typeof window.ui.preauthorizeApiKey === 'function') {
                window.ui.preauthorizeApiKey('bearerAuth', token);
            }
        } catch {
            return;
        }
    };

    const installFetchInterceptor = () => {
        if (window.__junkioSwaggerPatched || typeof window.fetch !== 'function') return;
        window.__junkioSwaggerPatched = true;
        const originalFetch = window.fetch.bind(window);

        window.fetch = async function patchedFetch(input, init) {
            const requestUrl = parseResponseUrl(input);
            const res = await originalFetch(input, init);
            await autoAuthorizeFromLogin(res, requestUrl);
            return res;
        };
    };

    const waitForSwaggerUi = () => {
        const timer = window.setInterval(() => {
            if (!window.ui) return;
            window.clearInterval(timer);
            installFetchInterceptor();
        }, 100);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSwaggerUi);
    } else {
        waitForSwaggerUi();
    }
})();
