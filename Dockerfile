# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --include=dev: Render sets NODE_ENV=production at build time, which would
# otherwise skip Vite/TypeScript. --legacy-peer-deps: npm ci in Node 22 is
# stricter about peer deps than some local npm versions.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --no-audit --no-fund --include=dev --legacy-peer-deps

COPY . .

# Vite inlines VITE_* at build time. Pin these so Render dashboard env vars
# cannot leak into the public bundle. API origin/key are injected at runtime
# via config.js and nginx API_UPSTREAM / API_KEY.
ARG VITE_DEMO_CALL_ID=call-acme-saas-labs
ENV VITE_API_BASE_URL= \
    VITE_USE_MOCKS=false \
    VITE_API_KEY= \
    VITE_INTEGRATION_API_BASE_URL= \
    VITE_INTEGRATION_API_TOKEN= \
    VITE_USE_MOCK_INTEGRATIONS=false \
    VITE_DEMO_CALL_ID=$VITE_DEMO_CALL_ID \
    NODE_ENV=production

RUN npm run build

FROM nginx:1.27-alpine AS production

RUN apk add --no-cache wget \
  && mkdir -p /etc/nginx/snippets /tmp \
  && rm -f /etc/nginx/conf.d/default.conf \
  && rm -f /etc/nginx/conf.d/*.conf

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/security-headers.conf.template /etc/nginx/snippets/security-headers.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /entrypoint.sh \
  && chown -R nginx:nginx /usr/share/nginx/html

STOPSIGNAL SIGQUIT
ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-10000}/healthz" >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
