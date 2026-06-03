# Build stage
FROM node:24-alpine AS builder

ARG NODE_ENV
RUN test "$NODE_ENV" = "production" || (echo "ERROR: Use docker-compose.prod.yml" && exit 1)

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline

RUN pnpm run build

# Runtime stage
FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm fetch --prod

RUN pnpm install --frozen-lockfile --offline --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]