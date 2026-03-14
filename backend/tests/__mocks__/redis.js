const fakeClient = () => {
    const noop = async () => {};
    const store = new Map();
    return {
        connect: noop,
        on: () => {},
        get: async (k) => store.get(k) || null,
        setEx: async (k, _ttl, v) => { store.set(k, v); },
        keys: async (pattern) => {
            if (pattern.endsWith('*')) {
                const prefix = pattern.slice(0, -1);
                return [...store.keys()].filter(k => k.startsWith(prefix));
            }
            return store.has(pattern) ? [pattern] : [];
        },
        del: async (...keys) => { keys.flat().forEach(k => store.delete(k)); },
        ping: async () => 'PONG'
    };
};

module.exports = {
    createClient: fakeClient
};
