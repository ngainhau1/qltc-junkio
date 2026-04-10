# ==========================================
# STAGE 1: Build React app
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files và cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build React → /app/dist
RUN npm run build

# ==========================================
# STAGE 2: Serve với Nginx (nhẹ ~25MB)
# ==========================================
FROM nginx:alpine AS runner

# Copy static files từ stage build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx custom (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]