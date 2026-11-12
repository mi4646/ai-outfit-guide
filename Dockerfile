FROM node:20-alpine AS build
WORKDIR /app

ARG NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/

RUN npm config set registry "$NPM_REGISTRY" \
 && npm config set fetch-retries 5 \
 && npm config set fetch-timeout 120000 \
 && npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml ./
ENV NO_UPDATE_NOTIFIER=1

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch --frozen-lockfile --network-concurrency=1 --fetch-retries=10 \
 && pnpm install --offline --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
