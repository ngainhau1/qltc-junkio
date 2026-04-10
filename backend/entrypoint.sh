#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx sequelize-cli db:migrate

if [ "$AUTO_SEED" = "true" ]; then
  echo "[entrypoint] Seeding demo data..."
  node scripts/seed-demo.js
else
  echo "[entrypoint] AUTO_SEED is not enabled, skipping seed."
fi

echo "[entrypoint] Starting API server..."
exec npm start
