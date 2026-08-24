# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /usr/src/goose
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /usr/src/goose
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
COPY package.json package-lock.json ./
COPY --from=builder /usr/src/goose/dist dist
COPY src/data/verification src/data/verification
COPY src/web/public src/web/public
RUN npm ci --omit=dev && npm cache clean --force

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT:-5000}/" || exit 1

CMD ["node", "dist/main.js"]
