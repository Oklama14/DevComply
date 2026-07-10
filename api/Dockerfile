# --- Build (inclui devDependencies para compilar) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Dependencias de producao apenas ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Runtime (imagem enxuta) ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
COPY logo.png ./logo.png
EXPOSE 3000
CMD ["node", "dist/main"]
