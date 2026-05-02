const swaggerJsdoc = require('swagger-jsdoc');

const apiDescription = `**Chào mừng đến với thư viện API của Junkio Expense Tracker!**

Dưới đây là tài liệu hướng dẫn sử dụng API dành cho lập trình viên, tester và admin hệ thống. Thiết kế tuân theo chuẩn RESTful, mọi endpoint JSON đều ưu tiên response envelope thống nhất.

---
### Hướng dẫn dành cho người dùng mới (Getting Started)

1. **Đăng nhập:** Mở route \`/api/auth/login\` và nhập email cùng mật khẩu.
2. **Lấy token:** Copy chuỗi \`token\` trả về trong object \`data\`.
3. **Cấp quyền:** Bấm **Authorize**, dán token vào ô **Value** theo dạng \`Bearer <token>\` hoặc chỉ dán token nếu Swagger UI đã tự thêm prefix.
4. **Gọi API:** Nhấn \`Try it out\` tại endpoint cần kiểm tra. Các endpoint có biểu tượng khóa sẽ gửi kèm Bearer token.

> **Mẹo:** Swagger UI đã được cấu hình lưu token khi tải lại trang (Persist Authorization).

---
### Response envelope

Các endpoint JSON trả về một trong hai dạng chuẩn:

\`\`\`json
{ "status": "success", "message": "MESSAGE_CODE", "data": {} }
\`\`\`

\`\`\`json
{ "status": "error", "message": "ERROR_CODE", "data": null }
\`\`\`

Endpoint xuất file như export CSV/PDF là ngoại lệ có chủ đích và trả về file/binary response.

---
### Mã lỗi (Error Codes)

Backend trả về mã lỗi ổn định như \`AUTH_TOKEN_MISSING\`, \`VALIDATION_ERROR\`, \`WALLET_NOT_FOUND\`, \`INSUFFICIENT_BALANCE\`, \`FAMILY_FORBIDDEN\`. Frontend có thể dùng các mã này để dịch thông báo theo ngôn ngữ hiện tại.`;

const bearerSecurity = [{ bearerAuth: [] }];

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Junkio Expense Tracker API',
            version: '1.0.0',
            description: apiDescription,
        },
        servers: [{ url: '/' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
            schemas: {
                ApiSuccessEnvelope: {
                    type: 'object',
                    required: ['status', 'message', 'data'],
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'REQUEST_SUCCESS' },
                        data: { nullable: true },
                    },
                },
                ApiErrorEnvelope: {
                    type: 'object',
                    required: ['status', 'message', 'data'],
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'ERROR_CODE' },
                        data: { nullable: true, example: null },
                    },
                },
                ValidationErrorEnvelope: {
                    allOf: [
                        { $ref: '#/components/schemas/ApiErrorEnvelope' },
                        {
                            type: 'object',
                            properties: {
                                message: { type: 'string', example: 'VALIDATION_ERROR' },
                                data: {
                                    type: 'object',
                                    properties: {
                                        errors: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    field: { type: 'string', example: 'email' },
                                                    message: { type: 'string', example: 'email.INVALID_EMAIL' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Nguyen Van Demo' },
                        email: { type: 'string', format: 'email', example: 'demo@junkio.com' },
                        role: { type: 'string', example: 'member' },
                        avatar: { type: 'string', nullable: true, example: null },
                        phone: { type: 'string', nullable: true, example: '+84 901 234 567' },
                        dateOfBirth: { type: 'string', format: 'date', nullable: true, example: '1995-05-20' },
                    },
                },
                Wallet: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Ví MB Bank' },
                        balance: { type: 'string', example: '10000000.00' },
                        currency: { type: 'string', example: 'VND' },
                        user_id: { type: 'string', format: 'uuid', nullable: true },
                        family_id: { type: 'string', format: 'uuid', nullable: true },
                    },
                },
                Family: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Gia Đình Demo' },
                        owner_id: { type: 'string', format: 'uuid' },
                        my_role: { type: 'string', example: 'ADMIN' },
                        members: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/UserProfile' },
                        },
                    },
                },
                FamilyInvitation: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        family_id: { type: 'string', format: 'uuid' },
                        code: { type: 'string', example: 'AB12CD34' },
                        role: { type: 'string', enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' },
                        expires_at: { type: 'string', format: 'date-time' },
                        used_at: { type: 'string', format: 'date-time', nullable: true },
                        used_by: { type: 'string', format: 'uuid', nullable: true },
                    },
                },
                DashboardStats: {
                    type: 'object',
                    properties: {
                        stats: { type: 'object' },
                        recentTransactions: { type: 'array', items: { type: 'object' } },
                        cashflowSeries: { type: 'array', items: { type: 'object' } },
                    },
                },
                GoldPrice: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', example: 'sjc' },
                        branch: { type: 'string', example: 'Hồ Chí Minh' },
                        productName: { type: 'string', example: 'Vàng SJC 1L, 10L, 1KG' },
                        buy: { type: 'number', example: 163600000 },
                        sell: { type: 'number', example: 166600000 },
                        currency: { type: 'string', example: 'VND' },
                        unit: { type: 'string', example: 'VND_PER_LUONG' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        updatedLabel: { type: 'string', example: '08:30 04/05/2026' },
                    },
                },
                GoldHistory: {
                    type: 'object',
                    properties: {
                        range: { type: 'string', enum: ['24H', '7D'], example: '24H' },
                        source: { type: 'string', example: 'sjc' },
                        branch: { type: 'string', example: 'Hồ Chí Minh' },
                        productName: { type: 'string', example: 'Vàng SJC 1L, 10L, 1KG' },
                        points: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    capturedAt: { type: 'string', format: 'date-time' },
                                    buy: { type: 'number', example: 163600000 },
                                    sell: { type: 'number', example: 166600000 },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./routes/*.js'],
};

function isHttpMethod(method) {
    return ['get', 'post', 'put', 'patch', 'delete'].includes(method);
}

function responseCodeNumber(code) {
    const parsed = Number.parseInt(code, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function isJsonFileResponse(pathName, code, response) {
    if (responseCodeNumber(code) >= 400) {
        return false;
    }

    const content = response.content || {};
    const contentTypes = Object.keys(content);

    return pathName.includes('/export') ||
        contentTypes.some((type) => type !== 'application/json' && !type.includes('+json'));
}

function defaultMessageForStatus(code, successMessage) {
    const status = responseCodeNumber(code);
    if (status >= 200 && status < 300) {
        return successMessage || 'REQUEST_SUCCESS';
    }

    const messages = {
        400: 'BAD_REQUEST',
        401: 'AUTH_TOKEN_MISSING',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'VALIDATION_ERROR',
        423: 'ACCOUNT_LOCKED',
        429: 'RATE_LIMITED',
        500: 'INTERNAL_SERVER_ERROR',
        502: 'UPSTREAM_SERVICE_UNAVAILABLE',
    };

    return messages[status] || 'ERROR_CODE';
}

function normalizeExample(example, code, successMessage) {
    const status = responseCodeNumber(code);

    if (status >= 400) {
        return {
            status: 'error',
            message: defaultMessageForStatus(code),
            data: null,
        };
    }

    if (example && typeof example === 'object' && !Array.isArray(example)) {
        if (example.status) {
            return {
                status: example.status,
                message: example.message || successMessage || 'REQUEST_SUCCESS',
                data: Object.prototype.hasOwnProperty.call(example, 'data') ? example.data : null,
            };
        }

        return {
            status: 'success',
            message: successMessage || 'REQUEST_SUCCESS',
            data: example,
        };
    }

    return {
        status: 'success',
        message: successMessage || 'REQUEST_SUCCESS',
        data: example === undefined ? {} : example,
    };
}

function envelopeSchemaFor(code) {
    return responseCodeNumber(code) >= 400
        ? { $ref: '#/components/schemas/ApiErrorEnvelope' }
        : { $ref: '#/components/schemas/ApiSuccessEnvelope' };
}

function ensureJsonResponse(pathName, operation, code) {
    const response = operation.responses[code];
    if (!response || isJsonFileResponse(pathName, code, response)) {
        return;
    }

    const successMessage = operation.summary
        ? operation.summary.toUpperCase().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '')
        : 'REQUEST_SUCCESS';

    response.content = response.content || {};
    const json = response.content['application/json'] || {};
    json.schema = json.schema || envelopeSchemaFor(code);

    if (json.example !== undefined) {
        json.example = normalizeExample(json.example, code, successMessage);
    } else if (json.examples) {
        Object.keys(json.examples).forEach((exampleName) => {
            if (json.examples[exampleName]?.value !== undefined) {
                json.examples[exampleName].value = normalizeExample(
                    json.examples[exampleName].value,
                    code,
                    successMessage
                );
            }
        });
    } else {
        json.example = normalizeExample(undefined, code, successMessage);
    }

    response.content['application/json'] = json;
}

function ensureErrorResponse(operation, code, description) {
    operation.responses[code] = operation.responses[code] || {
        description,
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
                example: {
                    status: 'error',
                    message: defaultMessageForStatus(code),
                    data: null,
                },
            },
        },
    };
}

function isAuthEndpoint(pathName) {
    return pathName.startsWith('/api/auth/');
}

function isPublicAuthEndpoint(pathName) {
    return [
        '/api/auth/register',
        '/api/auth/login',
        '/api/auth/forgot-password',
    ].includes(pathName) || pathName.startsWith('/api/auth/reset-password');
}

function isProtectedEndpoint(pathName, operation) {
    if (Array.isArray(operation.security)) {
        return operation.security.some((item) => item.bearerAuth !== undefined);
    }

    return !isPublicAuthEndpoint(pathName) && !isAuthEndpoint(pathName);
}

function addNoBodyNote(operation) {
    if (operation.requestBody) {
        return;
    }

    const noBodyMethods = ['post', 'put', 'patch'];
    if (!noBodyMethods.includes(operation.__method)) {
        return;
    }

    const note = 'Không cần request body.';
    operation.description = operation.description
        ? `${operation.description}\n\n${note}`
        : note;
}

function applySpecificDescriptions(pathName, method, operation) {
    const key = `${method.toUpperCase()} ${pathName}`;
    const descriptions = {
        'GET /api/wallets': 'Trả về danh sách ví cá nhân và ví gia đình mà user hiện tại có quyền truy cập. Có thể lọc theo context cá nhân hoặc gia đình.',
        'PUT /api/wallets/{id}': 'Cập nhật thông tin ví mà user có quyền quản lý. Không dùng endpoint này để chuyển tiền; hãy dùng API transfer khi cần đổi số dư qua giao dịch.',
        'DELETE /api/wallets/{id}': 'Xóa ví khi user có quyền và ví thỏa điều kiện nghiệp vụ. Hành động này không phải endpoint export hay download.',
    };

    if (!operation.description && descriptions[key]) {
        operation.description = descriptions[key];
    }

    if (key === 'GET /api/users/me') {
        operation.responses['200'].content['application/json'].example = {
            status: 'success',
            message: 'PROFILE_FETCH_SUCCESS',
            data: {
                id: 'b2df0d5d-1234-4abc-9def-bbbd02910001',
                name: 'Nguyen Van Demo',
                email: 'demo@junkio.com',
                avatar: null,
                role: 'member',
                phone: null,
                dateOfBirth: null,
            },
        };
    }

    if (key === 'PUT /api/users/me') {
        operation.responses['200'].content['application/json'].example = {
            status: 'success',
            message: 'PROFILE_UPDATE_SUCCESS',
            data: {
                id: 'b2df0d5d-1234-4abc-9def-bbbd02910001',
                name: 'Nguyen Van Demo',
                email: 'demo@junkio.com',
                avatar: null,
                role: 'member',
                phone: '+84 901 234 567',
                dateOfBirth: '1995-05-20',
            },
        };
    }

    if (key === 'POST /api/auth/login') {
        operation.responses['200'].content['application/json'].example = {
            status: 'success',
            message: 'LOGIN_SUCCESS',
            data: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                    id: 'b2df0d5d-1234-4abc-9def-bbbd02910001',
                    name: 'Nguyen Van Demo',
                    email: 'demo@junkio.com',
                    role: 'member',
                    avatar: null,
                    phone: null,
                    dateOfBirth: null,
                },
            },
        };
    }
}

function normalizeOperation(pathName, method, operation) {
    operation.__method = method;

    if (isPublicAuthEndpoint(pathName)) {
        operation.security = [];
    } else if (!isAuthEndpoint(pathName) && !operation.security) {
        operation.security = bearerSecurity;
    }

    operation.responses = operation.responses || {};

    if (isProtectedEndpoint(pathName, operation)) {
        ensureErrorResponse(operation, '401', 'Chưa đăng nhập, thiếu Bearer token hoặc token không hợp lệ');
    }

    if (operation.requestBody) {
        ensureErrorResponse(operation, '422', 'Dữ liệu request không hợp lệ');
    }

    Object.keys(operation.responses).forEach((code) => {
        ensureJsonResponse(pathName, operation, code);
    });

    addNoBodyNote(operation);
    applySpecificDescriptions(pathName, method, operation);

    delete operation.__method;
}

function normalizeSwaggerSpec(spec) {
    Object.entries(spec.paths || {}).forEach(([pathName, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
            if (isHttpMethod(method) && operation && typeof operation === 'object') {
                normalizeOperation(pathName, method, operation);
            }
        });
    });

    return spec;
}

const swaggerSpec = normalizeSwaggerSpec(swaggerJsdoc(options));

module.exports = swaggerSpec;
