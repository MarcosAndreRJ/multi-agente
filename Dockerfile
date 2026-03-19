# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências nativas necessárias pelo better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Dependências nativas para better-sqlite3 no runtime
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# Copia o build compilado
COPY --from=builder /app/dist ./dist

# Copia assets estáticos do frontend (HTMX/Alpine.js)
COPY public/ ./public/

# Volumes persistentes
VOLUME ["/app/data", "/app/output"]

EXPOSE 3000

CMD ["node", "dist/main.js"]
