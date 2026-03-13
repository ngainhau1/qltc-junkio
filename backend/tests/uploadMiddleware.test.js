jest.mock('multer', () => {
    const multerFn = jest.fn(opts => ({ __opts: opts }));
    multerFn.diskStorage = jest.fn(() => ({}));
    return multerFn;
});

const uploadModule = require('../middleware/uploadMiddleware');

describe('uploadMiddleware fileFilter', () => {
    const { fileFilter } = uploadModule.uploadAvatar.__opts;

    it('chấp nhận file ảnh', done => {
        const file = { mimetype: 'image/png' };
        fileFilter({}, file, (err, accept) => {
            expect(err).toBeNull();
            expect(accept).toBe(true);
            done();
        });
    });

    it('từ chối file không phải ảnh', done => {
        const file = { mimetype: 'application/pdf' };
        fileFilter({}, file, (err, accept) => {
            expect(err).toBeInstanceOf(Error);
            expect(accept).toBe(false);
            done();
        });
    });
});
