# 1. Chọn Hệ điều hành nền: Node.js bản nhẹ (Alpine)
FROM node:18-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file khai báo thư viện trước (để tận dụng bộ nhớ đệm)
COPY package*.json ./

# 4. Cài đặt thư viện
RUN npm install

# 5. Copy toàn bộ code còn lại vào container
COPY . .

# 6. Mở cổng 5000 (Cổng mặc định của Backend)
EXPOSE 5000

# 7. Lệnh chạy server khi container khởi động (sửa lại theo file chính của bạn)
CMD ["npm", "start"]