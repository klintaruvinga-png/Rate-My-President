# Lean backend image for Railway.
# Postgres is a managed Railway add-on (DATABASE_URL) — no volume needed.
#
# Railway sets the Docker build context to the Dockerfile's parent directory
# (server/), so all COPY paths here are relative to server/ (NOT repo root).
FROM node:20-slim

WORKDIR /app

# Install only production deps. sql.js/wilson-score-rank are WASM/JS-only;
# no native build toolchain required, so the slim image stays small.
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
