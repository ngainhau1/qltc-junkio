<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wallet.svg" alt="Junkio Logo" width="120" />
  <h1>Junkio Expense Tracker</h1>
  <p><strong>á»¨ng dá»¥ng Quáº£n lÃ½ TÃ i chÃ­nh CÃ¡ nhÃ¢n &amp; Gia Ä‘Ã¬nh â€” Full-Stack</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux&logoColor=white" alt="Redux" />
    <img src="https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white" alt="Jest" />
  </p>
</div>

---

## Giá»›i Thiá»‡u

**Junkio Expense Tracker** lÃ  á»©ng dá»¥ng quáº£n lÃ½ tÃ i chÃ­nh toÃ n diá»‡n dáº¡ng **Full-Stack** dÃ nh cho cÃ¡ nhÃ¢n vÃ  gia Ä‘Ã¬nh.

- **Frontend**: React 19 + Vite, Mobile-First, Progressive Web App
- **Backend**: Node.js/Express REST API, JWT Auth, Socket.IO real-time
- **Database**: PostgreSQL vá»›i Sequelize ORM

---

## CÃ´ng Nghá»‡ Sá»­ Dá»¥ng

### Frontend
| ThÆ° viá»‡n | MÃ´ táº£ |
|---|---|
| React 19 + Vite 6 | Core framework + build tool |
| React Router DOM v7 | Äiá»u hÆ°á»›ng client-side |
| Redux Toolkit | Quáº£n lÃ½ state (Auth, Wallets, Transactions...) |
| TailwindCSS v3 + Shadcn/UI | Giao diá»‡n + component library |
| Recharts | Biá»ƒu Ä‘á»“ Area, Donut |
| i18next | Äa ngÃ´n ngá»¯ (Tiáº¿ng Viá»‡t / English) |
| date-fns | Format ngÃ y giá» theo locale |
| socket.io-client | Nháº­n real-time notifications |

### Backend
| ThÆ° viá»‡n | MÃ´ táº£ |
|---|---|
| Node.js 18+ / Express 4 | REST API server |
| Sequelize + PostgreSQL | ORM + database |
| JWT (jsonwebtoken) | Access Token (15m) + Refresh Token (7d) |
| bcrypt | MÃ£ hÃ³a máº­t kháº©u |
| Socket.IO | Real-time push notifications |
| Nodemailer | Gá»­i email reset máº­t kháº©u |
| express-validator | Validate & sanitize input |
| jest + supertest | Backend testing |
| json2csv, pdfkit | Export CSV/PDF server-side |

---

## TÃ­nh NÄƒng ChÃ­nh

### Quáº£n lÃ½ TÃ i chÃ­nh
- **Giao dá»‹ch**: Táº¡o/xem/xÃ³a thu chi, import CSV, export CSV/PDF/Excel
- **Chi tiáº¿t giao dá»‹ch**: Click vÃ o báº¥t ká»³ giao dá»‹ch nÃ o Ä‘á»ƒ xem Ä‘áº§y Ä‘á»§ thÃ´ng tin, vÃ­, danh má»¥c vÃ  tráº¡ng thÃ¡i chia tiá»n
- **VÃ­ tiá»n**: Quáº£n lÃ½ nhiá»u vÃ­ (tiá»n máº·t, tháº», tiáº¿t kiá»‡m), tá»± Ä‘á»™ng cáº­p nháº­t sá»‘ dÆ°
- **Danh má»¥c**: PhÃ¢n loáº¡i thu chi
- **TÃ¬m kiáº¿m & PhÃ¢n trang**: Filter theo ngÃ y, loáº¡i, danh má»¥c; phÃ¢n trang server-side

### Gia ÄÃ¬nh & Chia Ná»£
- **Family Hub**: Quáº£n lÃ½ chi tiÃªu nhÃ³m, má»i thÃ nh viÃªn
- **Thuáº­t toÃ¡n Greedy**: Tá»± Ä‘á»™ng tá»‘i Æ°u hÃ³a cÃ¡c khoáº£n ná»£ trong nhÃ³m (A ná»£ B, B ná»£ C â†’ A tráº£ tháº³ng C)
- **Chia giao dá»‹ch**: Táº¡o giao dá»‹ch chia Ä‘á»u/tÃ¹y chá»‰nh giá»¯a cÃ¡c thÃ nh viÃªn

### Má»¥c TiÃªu & NgÃ¢n sÃ¡ch
- **Goals**: HÅ© tiáº¿t kiá»‡m vá»›i thanh tiáº¿n Ä‘á»™, náº¡p tiá»n tá»«ng Ä‘á»£t
- **Budget**: Äáº·t háº¡n má»©c chi tiÃªu theo danh má»¥c, cáº£nh bÃ¡o real-time khi vÆ°á»£t

### ThÃ´ng BÃ¡o Real-time
- Socket.IO gá»­i push notification Ä‘áº¿n browser khi cÃ³ cáº£nh bÃ¡o ngÃ¢n sÃ¡ch, ná»£ má»›i
- Toast notification tá»©c thÃ¬, khÃ´ng cáº§n refresh trang

### XÃ¡c Thá»±c & Báº£o Máº­t
- ÄÄƒng kÃ½/Ä‘Äƒng nháº­p vá»›i JWT (Access 15m + Refresh 7d trong httpOnly cookie)
- **QuÃªn máº­t kháº©u**: Gá»­i email reset link qua Nodemailer
- Role-based access: `member` / `staff` / `admin`
- Input validation vá»›i express-validator

### Admin Dashboard
- Thá»‘ng kÃª tá»•ng quan: users, wallets, goals, budgets
- Biá»ƒu Ä‘á»“: User Growth, Top Categories, Weekly Activity
- Quáº£n lÃ½ ngÆ°á»i dÃ¹ng: filter, Ä‘á»•i role, xÃ³a tÃ i khoáº£n
- Financial Overview: Revenue Trends, Top Spenders, Budget Compliance

### Tráº£i Nghiá»‡m Di Äá»™ng
- Bottom navigation bar dÃ¡n mÃ©p dÆ°á»›i mÃ n hÃ¬nh
- FAB (Floating Action Button) thÃªm giao dá»‹ch 1 cháº¡m
- Form dáº¡ng Bottom Sheet (kÃ©o tá»« dÆ°á»›i lÃªn nhÆ° iOS)
- Responsive hoÃ n toÃ n tá»« 320px Ä‘áº¿n 4K

---

## HÆ°á»›ng Dáº«n CÃ i Äáº·t

### YÃªu Cáº§u
- [Node.js](https://nodejs.org/) v18 trá»Ÿ lÃªn
- [PostgreSQL](https://www.postgresql.org/) v15 trá»Ÿ lÃªn
- [Git](https://git-scm.com/)

### 1. Clone MÃ£ Nguá»“n

```bash
git clone https://github.com/ngainhau1/qltc-junkio.git
cd qltc-junkio
```

### 2. CÃ i Äáº·t Backend

```bash
cd backend
npm install
```

Táº¡o file `.env` trong thÆ° má»¥c `backend/`:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=junkio
DB_USER=postgres
DB_PASS=yourpassword

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Email (Nodemailer - dÃ¹ng Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password_here

# Frontend URL (dÃ¹ng cho CORS vÃ  email reset link)
VITE_FRONTEND_URL=http://localhost:5173
```

Táº¡o database vÃ  cháº¡y migrations:

```bash
# Táº¡o database trong PostgreSQL trÆ°á»›c
createdb junkio

# Cháº¡y migrations
npx sequelize-cli db:migrate

# (TÃ¹y chá»n) Seed dá»¯ liá»‡u máº«u
npx sequelize-cli db:seed:all

# Khá»Ÿi Ä‘á»™ng backend server
npm run dev
# â†’ Server cháº¡y táº¡i http://localhost:5000
```

### 3. CÃ i Äáº·t Frontend

```bash
cd ../frontend
npm install
npm run dev
# â†’ App cháº¡y táº¡i http://localhost:5173
```

---

## API Endpoints

Dá»± Ã¡n cung cáº¥p sáºµn **Postman Collection** Ä‘á»ƒ test toÃ n bá»™ API:

```
doc/Junkio.postman_collection.json    â† 9 requests Ä‘áº§y Ä‘á»§
doc/Junkio.postman_environment.json   â† Environment variables
```

**Import vÃ o Postman**: File â†’ Import â†’ chá»n cáº£ 2 file trÃªn â†’ chá»n environment **"Junkio Dev"** â†’ cháº¡y **Login** trÆ°á»›c (token tá»± Ä‘á»™ng lÆ°u).

### CÃ¡c nhÃ³m API chÃ­nh

| NhÃ³m | Endpoint | MÃ´ táº£ |
|---|---|---|
| **Auth** | `POST /api/auth/register` | ÄÄƒng kÃ½ |
| | `POST /api/auth/login` | ÄÄƒng nháº­p â†’ JWT |
| | `POST /api/auth/forgot-password` | Gá»­i email reset |
| | `POST /api/auth/reset-password` | Äáº·t máº­t kháº©u má»›i |
| **Transactions** | `GET /api/transactions?page=1&limit=10` | Danh sÃ¡ch + filter + phÃ¢n trang |
| | `POST /api/transactions` | Táº¡o giao dá»‹ch |
| | `GET /api/transactions/:id` | Chi tiáº¿t (kÃ¨m Wallet, Category, Shares) |
| | `DELETE /api/transactions/:id` | XÃ³a |
| | `GET /api/transactions/export` | Export CSV/PDF |
| | `POST /api/transactions/import` | Import CSV |
| **Wallets** | `GET /api/wallets` | Danh sÃ¡ch vÃ­ |
| **Admin** | `GET /api/admin/analytics` | Thá»‘ng kÃª tá»•ng quan |
| | `GET /api/admin/users` | Quáº£n lÃ½ users |

---

## Kiá»ƒm Thá»­

```bash
cd backend
npm test
# â†’ Cháº¡y 7 test suites, 24+ test cases vá»›i Jest + Supertest
```

Bao gá»“m:
- `tests/auth.test.js` â€” ÄÄƒng kÃ½, Ä‘Äƒng nháº­p, validation input
- `tests/transaction.test.js` â€” CRUD giao dá»‹ch, validation sá»‘ tiá»n Ã¢m
- `tests/admin.test.js` â€” Admin endpoints
- `tests/budgetAlertService.test.js` â€” Cáº£nh bÃ¡o ngÃ¢n sÃ¡ch
- `tests/cronJobs.test.js` â€” Recurring transactions

---

## CI/CD

GitHub Actions pipeline táº¡i `.github/workflows/ci.yml`:
- Lint backend vá»›i ESLint
- Cháº¡y Jest test suite tá»± Ä‘á»™ng khi push/PR

---

## ÄÃ³ng GÃ³p

Pull Request vÃ  Issues luÃ´n Ä‘Æ°á»£c chÃ o Ä‘Ã³n. CÃ¡c hÆ°á»›ng má»Ÿ rá»™ng tiá»m nÄƒng:
- Äá»“ng bá»™ ngÃ¢n hÃ ng qua Open Banking API
- Dá»‹ch thÃªm ngÃ´n ngá»¯ (Nháº­t, HÃ n, PhÃ¡p) qua `i18n json`
- Mobile app (React Native / Expo)

---

<div align="center">
  <sub>Sáº£n pháº©m Ä‘Æ°á»£c xÃ¢y dá»±ng vá»›i Ä‘am mÃª. Full-Stack â€” tá»« Database Ä‘áº¿n UI.</sub>
</div>

## Ki?m th? API
- K? ho?ch: doc/api-test-plan.md
- Smoke Jest: `cd backend && npm run test:smoke`
- Newman full: `cd backend && npm run test:newman` (BASE_URL/NEWMAN_ENV/REPORT_JUNIT có th? override)
- Ch?y t?t c?: `cd backend && npm run test:all-api`

