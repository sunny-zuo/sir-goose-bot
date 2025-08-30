# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /usr/src/goose
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:22-alpine as runner

WORKDIR /usr/src/goose
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
COPY package.json package-lock.json ./
COPY --from=builder /usr/src/goose/dist dist
COPY src/data/verification src/data/verification
COPY src/web/public src/web/public
RUN npm ci
RUN npm install pm2 -g
CMD ["pm2-runtime", "dist/main.js"]
