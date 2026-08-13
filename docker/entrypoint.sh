#!/bin/sh
set -eu

DEFAULT_PORT="10000"
DEFAULT_UPLOAD_MAX_BODY_SIZE="100m"
PROXY_CONNECT_TIMEOUT="10s"
PROXY_SEND_TIMEOUT="300s"
PROXY_READ_TIMEOUT="3600s"

PORT="${PORT:-$DEFAULT_PORT}"
UPLOAD_MAX_BODY_SIZE="${UPLOAD_MAX_BODY_SIZE:-$DEFAULT_UPLOAD_MAX_BODY_SIZE}"
API_UPSTREAM="${API_UPSTREAM:-}"
API_BASE_URL="${API_BASE_URL:-}"
API_KEY="${API_KEY:-}"

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

is_safe_api_key() {
  echo "$1" | grep -Eq '^[A-Za-z0-9._~+/-]+$'
}

strip_trailing_slash() {
  echo "$1" | sed 's:/*$::'
}

read_resolver() {
  if [ -n "${NGINX_RESOLVER:-}" ]; then
    echo "$NGINX_RESOLVER"
    return
  fi
  awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf
}

quote_csp_origin() {
  # Origins already validated as http(s)://host[:port]
  echo "$1"
}

if ! is_port "$PORT"; then
  fail "PORT must be an integer between 1 and 65535"
fi

if ! is_body_size "$UPLOAD_MAX_BODY_SIZE"; then
  fail "UPLOAD_MAX_BODY_SIZE must look like 100m or 512k"
fi

if [ -n "$API_UPSTREAM" ]; then
  API_UPSTREAM="$(strip_trailing_slash "$API_UPSTREAM")"
  if ! is_http_origin "$API_UPSTREAM"; then
    fail "API_UPSTREAM must be an origin like https://deal-truth-api.onrender.com"
  fi
fi

if [ -n "$API_BASE_URL" ]; then
  API_BASE_URL="$(strip_trailing_slash "$API_BASE_URL")"
  if ! is_http_origin "$API_BASE_URL"; then
    fail "API_BASE_URL must be an origin like https://deal-truth-api.onrender.com"
  fi
fi

if [ -n "$API_KEY" ] && ! is_safe_api_key "$API_KEY"; then
  fail "API_KEY contains unsupported characters"
fi

CONNECT_SRC="'self'"
MEDIA_SRC="'self' blob:"
if [ -n "$API_BASE_URL" ]; then
  CONNECT_SRC="${CONNECT_SRC} $(quote_csp_origin "$API_BASE_URL")"
  MEDIA_SRC="${MEDIA_SRC} $(quote_csp_origin "$API_BASE_URL")"
fi

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src ${MEDIA_SRC}; connect-src ${CONNECT_SRC}; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"

if [ -n "$API_UPSTREAM" ]; then
  RESOLVER="$(read_resolver)"
  if [ -z "$RESOLVER" ]; then
    fail "could not determine DNS resolver; set NGINX_RESOLVER"
  fi

  API_KEY_HEADER=""
  if [ -n "$API_KEY" ]; then
    API_KEY_HEADER="proxy_set_header X-API-Key ${API_KEY};"
  fi

  API_LOCATION=$(
    cat <<EOF
    location /api/ {
      resolver ${RESOLVER} valid=30s ipv6=off;
      set \$deal_truth_api "${API_UPSTREAM}";
      proxy_pass \$deal_truth_api;
      proxy_http_version 1.1;
      proxy_set_header Host \$proxy_host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$forwarded_proto;
      proxy_set_header X-Request-ID \$request_id;
      ${API_KEY_HEADER}
      proxy_buffering off;
      proxy_request_buffering off;
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
      return 503 '{"error":{"code":"API_UNAVAILABLE","message":"Set API_UPSTREAM (or API_BASE_URL) so the UI can reach the Deal Truth API.","retryable":false}}';
    }
EOF
  )
fi

# Replace placeholders without feeding nginx $vars through envsubst.
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
printf 'window.__APP_CONFIG__ = { apiBaseUrl: "%s" };\n' "$API_BASE_URL" > "$RUNTIME_CONFIG"
chmod 644 "$RUNTIME_CONFIG"

echo "entrypoint: listening on ${PORT}"
if [ -n "$API_UPSTREAM" ]; then
  echo "entrypoint: proxying /api/ to ${API_UPSTREAM}"
else
  echo "entrypoint: /api/ proxy disabled"
fi
if [ -n "$API_BASE_URL" ]; then
  echo "entrypoint: browser API origin ${API_BASE_URL}"
fi
if [ -n "$API_KEY" ]; then
  echo "entrypoint: X-API-Key header enabled for proxied requests"
fi

exec "$@"
