#!/bin/sh
set -e

# Prefer an IPv4 nameserver; if only IPv6 is available wrap it in brackets
# (nginx resolver directive requires brackets around IPv6 addresses).
RESOLVER=$(grep ^nameserver /etc/resolv.conf | awk '{print $2}' | grep -v ':' | head -1)
if [ -z "$RESOLVER" ]; then
    IPV6=$(grep ^nameserver /etc/resolv.conf | awk '{print $2}' | grep ':' | head -1)
    RESOLVER="[${IPV6}]"
fi
RESOLVER=${RESOLVER:-8.8.8.8}

sed \
  -e "s|PORT_PLACEHOLDER|${PORT:-8080}|g" \
  -e "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL:-http://backend:8000}|g" \
  -e "s|RESOLVER_PLACEHOLDER|${RESOLVER}|g" \
  /etc/nginx/conf.d/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "nginx: port=${PORT:-8080} backend=${BACKEND_URL:-http://backend:8000} resolver=${RESOLVER}"
exec nginx -g "daemon off;"
