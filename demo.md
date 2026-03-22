# Demo kiá»ƒm thá»­ API vá»›i Postman (Junkio Expense Tracker)

## Chuáº©n bá»‹
- Backend cháº¡y táº¡i `http://localhost:5000`  
  ```bash
  cd D:\Junkio-Expense-Tracker\backend
  npm install
  npm run dev
  ```
- Postman desktop Ä‘Ã£ cÃ i.

## Import collection & environment
1. Má»Ÿ Postman â†’ **Import** â†’ tab *File*.
2. KÃ©o/ chá»n 2 file:
   - `D:\Junkio-Expense-Tracker\doc\Junkio.postman_collection.json`
   - `D:\Junkio-Expense-Tracker\doc\Junkio.postman_environment.json`
3. á»ž gÃ³c pháº£i, chá»n environment **Junkio Dev** (baseUrl = `http://localhost:5000`).

## Chuá»—i thao tÃ¡c giáº£ láº­p demo
1. **Login**  
   - Collections â†’ *Junkio Expense Tracker API* â†’ **Auth** â†’ `POST /api/auth/login`.  
   - Body JSON: `{"email":"<your-email>","password":"<your-password>"}`.  
   - Send. Biáº¿n `accessToken` Ä‘Æ°á»£c lÆ°u tá»± Ä‘á»™ng trong environment.
2. **Xem thÃ´ng tin phiÃªn**  
   - `GET /api/users/me` â†’ Send â†’ xÃ¡c nháº­n 200 vÃ  tháº¥y email.
3. **Láº¥y vÃ­**  
   - Folder **Wallets** â†’ `GET /api/wallets` â†’ Send â†’ copy má»™t `id` vÃ­ Ä‘á»ƒ dÃ¹ng bÆ°á»›c 4.
4. **Táº¡o giao dá»‹ch**  
   - Folder **Transactions** â†’ `POST /api/transactions` â†’ Body (raw JSON):  
     ```json
     {
       "wallet_id": "<paste-wallet-id>",
       "amount": 120000,
       "type": "EXPENSE",
       "description": "Cafe team"
     }
     ```
   - Send â†’ lÆ°u `id` tráº£ vá» (gá»i lÃ  `txId`).
5. **Danh sÃ¡ch giao dá»‹ch**  
   - `GET /api/transactions` â†’ Send â†’ tháº¥y record vá»«a táº¡o.
6. **Chi tiáº¿t giao dá»‹ch**  
   - `GET /api/transactions/:id` â†’ thay `:id` báº±ng `txId` â†’ Send â†’ xem Wallet/Category/Shares.
7. **XÃ³a giao dá»‹ch**  
   - `DELETE /api/transactions/:id` â†’ dÃ¹ng `txId` â†’ Send â†’ nháº­n 200.  
   - (TÃ¹y chá»n) Gá»­i láº¡i `GET /api/transactions` Ä‘á»ƒ xÃ¡c nháº­n Ä‘Ã£ xÃ³a.
8. **Admin analytics** (chá»‰ khi login báº±ng tÃ i khoáº£n role=admin)  
   - Folder **Admin** â†’ `GET /api/admin/analytics` â†’ Send â†’ xem sá»‘ liá»‡u thá»‘ng kÃª.

## Xá»­ lÃ½ nhanh lá»—i thÆ°á»ng gáº·p
- 401: kiá»ƒm tra Ä‘Ã£ chá»n env **Junkio Dev** vÃ  biáº¿n `accessToken` cÃ³ giÃ¡ trá»‹; náº¿u trá»‘ng hÃ£y login láº¡i.
- 400 khi táº¡o giao dá»‹ch: cháº¯c cháº¯n `wallet_id` há»£p lá»‡, `amount` > 0, `type` âˆˆ {`INCOME`, `EXPENSE`}.
- 404 chi tiáº¿t: kiá»ƒm tra `txId` Ä‘Ãºng vÃ  giao dá»‹ch chÆ°a bá»‹ xÃ³a.

## Seed & Demo Accounts
- Cháº¡y migrate + seed:
  ```bash
  cd D:\Junkio-Expense-Tracker\backend
  npx sequelize-cli db:migrate
  npx sequelize-cli db:seed:all
  ```
- Admin: demo_admin@junkio.com / demo123
- User:  demo_user@junkio.com / demo123


