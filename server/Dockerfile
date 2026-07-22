# Lean backend image for Railway.
# Postgres is a managed Railway add-on (DATABASE_URL) — no volume needed.
#
# Railway's build context is the repo root (rootDirectory is not a supported
# config field), so we COPY the server/ subdirectory into /app and run from it.
FROM node:20-slim

WORKDIR /app

# Install only production deps. sql.js/wilson-score-rank are WASM/JS-only;
# no native build toolchain required, so the slim image stays small.
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server/ .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
