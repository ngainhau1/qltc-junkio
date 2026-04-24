const basePath = import.meta.env.BASE_URL || '/';
const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
const robotoFontPath = `${normalizedBasePath}fonts/Roboto-Regular-normal.base64.txt`;

let robotoBase64Promise;

export const loadRobotoBase64 = async () => {
    if (!robotoBase64Promise) {
        robotoBase64Promise = fetch(robotoFontPath)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('PDF_FONT_LOAD_FAILED');
                }

                return response.text();
            })
            .then((text) => text.trim());
    }

    return robotoBase64Promise;
};
