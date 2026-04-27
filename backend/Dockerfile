FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache curl && npm install

COPY . .

RUN chmod +x ./entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
