#!/bin/sh
set -eu

DEFAULT_PORT="10000"
DEFAULT_UPLOAD_MAX_BODY_SIZE="100m"
DEFAULT_RESOLVER="8.8.8.8"
PROXY_CONNECT_TIMEOUT="10s"
PROXY_SEND_TIMEOUT="300s"
PROXY_READ_TIMEOUT="3600s"

PORT="${PORT:-$DEFAULT_PORT}"
UPLOAD_MAX_BODY_SIZE="${UPLOAD_MAX_BODY_SIZE:-$DEFAULT_UPLOAD_MAX_BODY_SIZE}"
API_UPSTREAM="${API_UPSTREAM:-${VITE_API_BASE_URL:-}}"
API_BASE_URL="${API_BASE_URL:-}"
API_KEY="${API_KEY:-${VITE_API_KEY:-}}"
INTEGRATION_UPSTREAM="${INTEGRATION_UPSTREAM:-}"
INTEGRATION_API_BASE_URL="${INTEGRATION_API_BASE_URL:-${VITE_INTEGRATION_API_BASE_URL:-}}"
INTEGRATION_API_TOKEN="${INTEGRATION_API_TOKEN:-${VITE_INTEGRATION_API_TOKEN:-}}"

NGINX_CONF_TEMPLATE="/etc/nginx/nginx.conf.template"
SECURITY_HEADERS_TEMPLATE="/etc/nginx/snippets/security-headers.conf.template"
NGINX_CONF="/etc/nginx/nginx.conf"
SECURITY_HEADERS="/etc/nginx/snippets/security-headers.conf"
RUNTIME_CONFIG="/usr/share/nginx/html/config.js"

fail() {
  echo "entrypoint: $1" >&2
  exit 1
}

is_port() {
  echo "$1" | grep -Eq '^[0-9]+$' || return 1
  [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

is_body_size() {
  echo "$1" | grep -Eq '^[0-9]+[kmgKMG]?$'
}

is_http_origin() {
  echo "$1" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'
}

is_docker_compose_api_host() {
  echo "$1" | grep -Eq '^https?://api(:[0-9]+)?$'
}

is_safe_api_key() {
  echo "$1" | grep -Eq '^[A-Za-z0-9._~+/-]+$'
}

strip_trailing_slash() {
  echo "$1" | sed 's:/*$::'
}

trim() {
  echo "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

normalize_origin() {
  value="$(trim "$1")"
  value="$(strip_trailing_slash "$value")"
  case "$value" in
    "" | http://* | https://*) ;;
    *) value="https://${value}" ;;
  esac
  echo "$value"
}

read_resolver() {
  if [ -n "${NGINX_RESOLVER:-}" ]; then
    echo "$NGINX_RESOLVER"
    return
  fi
  awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf
}

validate_origin() {
  name="$1"
  value="$2"
  if [ -z "$value" ]; then
    return 0
  fi
  if is_docker_compose_api_host "$value"; then
    fail "${name} is the Docker Compose hostname \"api\", which does not exist on Render. Set it to your API origin, e.g. https://deal-truth-api.onrender.com"
  fi
  if ! is_http_origin "$value"; then
    fail "${name} must be an origin like https://deal-truth-api.onrender.com"
  fi
}

# Stock nginx.conf includes conf.d/*.conf. The old image proxied to
# http://api:8000 there and crashed on Render. Never leave that file around.
rm -f /etc/nginx/conf.d/default.conf
find /etc/nginx/conf.d -type f -name '*.conf' -delete 2>/dev/null || true

if ! is_port "$PORT"; then
  fail "PORT must be an integer between 1 and 65535"
fi

if ! is_body_size "$UPLOAD_MAX_BODY_SIZE"; then
  fail "UPLOAD_MAX_BODY_SIZE must look like 100m or 512k"
fi

if [ -n "$API_UPSTREAM" ]; then
  API_UPSTREAM="$(normalize_origin "$API_UPSTREAM")"
  validate_origin "API_UPSTREAM" "$API_UPSTREAM"
fi

if [ -n "$API_BASE_URL" ]; then
  API_BASE_URL="$(normalize_origin "$API_BASE_URL")"
  validate_origin "API_BASE_URL" "$API_BASE_URL"
fi

if [ -n "$INTEGRATION_UPSTREAM" ]; then
  INTEGRATION_UPSTREAM="$(normalize_origin "$INTEGRATION_UPSTREAM")"
  validate_origin "INTEGRATION_UPSTREAM" "$INTEGRATION_UPSTREAM"
fi

if [ -n "$INTEGRATION_API_BASE_URL" ]; then
  INTEGRATION_API_BASE_URL="$(normalize_origin "$INTEGRATION_API_BASE_URL")"
  validate_origin "INTEGRATION_API_BASE_URL" "$INTEGRATION_API_BASE_URL"
fi

if [ -n "$API_KEY" ] && ! is_safe_api_key "$API_KEY"; then
  fail "API_KEY contains unsupported characters"
fi

if [ -n "$INTEGRATION_API_TOKEN" ] && ! is_safe_api_key "$INTEGRATION_API_TOKEN"; then
  fail "INTEGRATION_API_TOKEN contains unsupported characters"
fi

CONNECT_SRC="'self'"
MEDIA_SRC="'self' blob:"
if [ -n "$API_BASE_URL" ]; then
  CONNECT_SRC="${CONNECT_SRC} ${API_BASE_URL}"
  MEDIA_SRC="${MEDIA_SRC} ${API_BASE_URL}"
fi
if [ -n "$INTEGRATION_API_BASE_URL" ]; then
  CONNECT_SRC="${CONNECT_SRC} ${INTEGRATION_API_BASE_URL}"
fi

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src ${MEDIA_SRC}; connect-src ${CONNECT_SRC}; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"

if [ -n "$API_UPSTREAM" ]; then
  RESOLVER="$(read_resolver)"
  RESOLVER="${RESOLVER:-$DEFAULT_RESOLVER}"

  API_KEY_HEADER=""
  if [ -n "$API_KEY" ]; then
    API_KEY_HEADER="proxy_set_header X-API-Key ${API_KEY};"
  fi

  NGROK_HEADER=""
  case "$API_UPSTREAM" in
    *ngrok*) NGROK_HEADER="proxy_set_header ngrok-skip-browser-warning true;" ;;
  esac

  # Variable proxy_pass + resolver: nginx must not resolve the upstream at
  # startup (that is what crashed Render with host "api").
  API_LOCATION=$(
    cat <<EOF
    location /api/ {
      resolver ${RESOLVER} valid=30s ipv6=off;
      set \$deal_truth_api "${API_UPSTREAM}";
      proxy_pass \$deal_truth_api;
      proxy_http_version 1.1;
      proxy_ssl_server_name on;
      proxy_ssl_name \$proxy_host;
      proxy_set_header Host \$proxy_host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$forwarded_proto;
      proxy_set_header X-Request-ID \$request_id;
      proxy_set_header Connection "";
      ${API_KEY_HEADER}
      ${NGROK_HEADER}
      proxy_buffering off;
      proxy_request_buffering off;
      proxy_redirect off;
      proxy_connect_timeout ${PROXY_CONNECT_TIMEOUT};
      proxy_send_timeout ${PROXY_SEND_TIMEOUT};
      proxy_read_timeout ${PROXY_READ_TIMEOUT};
    }
EOF
  )
else
  API_LOCATION=$(
    cat <<'EOF'
    location /api/ {
      default_type application/json;
      add_header Cache-Control "no-store";
      return 503 '{"error":{"code":"API_UNAVAILABLE","message":"Set API_UPSTREAM on Render to your Deal Truth API origin, e.g. https://deal-truth-api.onrender.com.","retryable":false}}';
    }
EOF
  )
fi

if [ -n "$INTEGRATION_UPSTREAM" ]; then
  RESOLVER="$(read_resolver)"
  RESOLVER="${RESOLVER:-$DEFAULT_RESOLVER}"
  INTEGRATION_AUTH_HEADER=""
  if [ -n "$INTEGRATION_API_TOKEN" ]; then
    INTEGRATION_AUTH_HEADER="proxy_set_header Authorization \"Bearer ${INTEGRATION_API_TOKEN}\";"
  fi
  INTEGRATION_LOCATION=$(
    cat <<EOF
    location /integrations-api/ {
      resolver ${RESOLVER} valid=30s ipv6=off;
      set \$hubspot_api "${INTEGRATION_UPSTREAM}";
      rewrite ^/integrations-api/(.*) /\$1 break;
      proxy_pass \$hubspot_api;
      proxy_http_version 1.1;
      proxy_ssl_server_name on;
      proxy_ssl_name \$proxy_host;
      proxy_set_header Host \$proxy_host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$forwarded_proto;
      proxy_set_header X-Request-ID \$request_id;
      proxy_set_header Connection "";
      ${INTEGRATION_AUTH_HEADER}
      proxy_buffering off;
      proxy_request_buffering off;
      proxy_redirect off;
      proxy_connect_timeout ${PROXY_CONNECT_TIMEOUT};
      proxy_send_timeout ${PROXY_SEND_TIMEOUT};
      proxy_read_timeout ${PROXY_READ_TIMEOUT};
    }
EOF
  )
else
  INTEGRATION_LOCATION=$(
    cat <<'EOF'
    location /integrations-api/ {
      default_type application/json;
      add_header Cache-Control "no-store";
      return 503 '{"errorCode":"INVALID_REQUEST","message":"Set INTEGRATION_UPSTREAM to your HubSpot integration service origin. Do not send HubSpot tokens or Slack webhooks from the browser."}';
    }
EOF
  )
fi

API_LOCATION="${API_LOCATION}

${INTEGRATION_LOCATION}"

tmp_conf="$(mktemp)"
sed \
  -e "s/__LISTEN_PORT__/${PORT}/g" \
  -e "s/__UPLOAD_MAX_BODY_SIZE__/${UPLOAD_MAX_BODY_SIZE}/g" \
  "$NGINX_CONF_TEMPLATE" > "$tmp_conf"

{
  sed '/__API_LOCATION__/q' "$tmp_conf" | sed '$d'
  printf '%s\n' "$API_LOCATION"
  sed '1,/__API_LOCATION__/d' "$tmp_conf"
} > "$NGINX_CONF"
rm -f "$tmp_conf"

sed -e "s|__CSP__|${CSP}|g" "$SECURITY_HEADERS_TEMPLATE" > "$SECURITY_HEADERS"

umask 077
printf 'window.__APP_CONFIG__ = { apiBaseUrl: "%s", integrationApiBaseUrl: "%s" };\n' "$API_BASE_URL" "$INTEGRATION_API_BASE_URL" > "$RUNTIME_CONFIG"
chmod 644 "$RUNTIME_CONFIG"

echo "entrypoint: listening on ${PORT}"
if [ -n "$API_UPSTREAM" ]; then
  echo "entrypoint: proxying /api/ to ${API_UPSTREAM}"
else
  echo "entrypoint: /api/ proxy disabled — set API_UPSTREAM"
fi
if [ -n "$API_BASE_URL" ]; then
  echo "entrypoint: browser API origin ${API_BASE_URL}"
fi
if [ -n "$INTEGRATION_API_BASE_URL" ]; then
  echo "entrypoint: browser integration origin ${INTEGRATION_API_BASE_URL}"
fi
if [ -n "$INTEGRATION_UPSTREAM" ]; then
  echo "entrypoint: proxying /integrations-api/ to ${INTEGRATION_UPSTREAM}"
else
  echo "entrypoint: /integrations-api/ proxy disabled — set INTEGRATION_UPSTREAM"
fi
if [ -n "$API_KEY" ]; then
  echo "entrypoint: X-API-Key header enabled for proxied requests"
fi
if [ -n "$INTEGRATION_API_TOKEN" ]; then
  echo "entrypoint: integration Authorization header enabled for proxied requests"
fi

if [ "$#" -eq 0 ]; then
  set -- nginx -g "daemon off;"
fi

nginx -t
exec "$@"
