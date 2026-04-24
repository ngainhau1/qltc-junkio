# ==========================================
# STAGE 1: Build React app
# ==========================================
# GHI CHÚ HỌC TẬP - Phần hạ tầng của Thành Đạt:
# Dockerfile frontend dùng hai giai đoạn. Giai đoạn đầu build React thành file tĩnh,
# giai đoạn sau dùng Nginx phục vụ các file đó nhẹ và ổn định hơn.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files và cài dependencies.
# Tách bước này giúp Docker tận dụng cache nếu source đổi nhưng package không đổi.
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build React → /app/dist. Thư mục dist là phần Nginx sẽ phục vụ cho trình duyệt.
RUN npm run build

# ==========================================
# STAGE 2: Serve với Nginx (nhẹ ~25MB)
# ==========================================
FROM nginx:alpine AS runner

# Copy static files từ stage build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx custom (SPA routing).
# Cấu hình này giúp reload trực tiếp các trang con của React không bị 404.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
