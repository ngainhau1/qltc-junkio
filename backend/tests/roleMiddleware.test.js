const roleMiddleware = require('../middleware/roleMiddleware');

describe('roleMiddleware', () => {
    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    beforeEach(() => {
        next.mockClear();
        res.status.mockClear();
        res.json.mockClear();
    });

    it('từ chối khi thiếu user', () => {
        const req = {};
        roleMiddleware('admin')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'FORBIDDEN',
            data: null,
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('từ chối vai trò không phù hợp', () => {
        const req = { user: { role: 'member' } };
        roleMiddleware('admin')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'FORBIDDEN',
            data: null,
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('cho phép khi vai trò hợp lệ', () => {
        const req = { user: { role: 'admin' } };
        roleMiddleware('admin')(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
