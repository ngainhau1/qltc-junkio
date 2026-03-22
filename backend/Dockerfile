# 1. Chọn Hệ điều hành nền: Node.js bản nhẹ (Alpine)
FROM node:18-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file khai báo thư viện trước (để tận dụng bộ nhớ đệm)
COPY package*.json ./

# 4. Cài đặt thư viện
RUN apk add --no-cache curl && npm install

# 5. Copy toàn bộ code còn lại vào container
COPY . .

# 5.5. Entrypoint chạy migrate/seed rồi khởi động server
RUN chmod +x ./entrypoint.sh

# 6. Mở cổng 5000 (Cổng mặc định của Backend)
EXPOSE 5000

# 7. Lệnh chạy server khi container khởi động (entrypoint lo migrate/seed)
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
