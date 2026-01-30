# 1. Chọn nền Node.js
FROM node:18-alpine

# 2. Thư mục làm việc
WORKDIR /app

# 3. Copy và cài thư viện
COPY package*.json ./
RUN npm install

# 4. Copy code nguồn
COPY . .

# 5. Mở cổng 5173 (Cổng mặc định của Vite React)
EXPOSE 5173

# 6. Lệnh chạy dev server (để nhận diện hot-reload khi code)
# Lưu ý: Trong package.json của Frontend, lệnh dev cần thêm --host
# Ví dụ: "dev": "vite --host"
CMD ["npm", "run", "dev"]