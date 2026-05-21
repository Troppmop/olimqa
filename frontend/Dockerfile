# ── stage 1: install deps ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ── stage 2: dev (docker-compose uses --target dev) ───────────────
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── stage 3: build ────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── stage 4: production nginx (default — Railway uses this) ───────
FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV BACKEND_URL=http://backend:8000
# PORT is injected by Railway at runtime — don't set a default here.
# For local docker-compose the entrypoint falls back to 80.

EXPOSE 8080
CMD ["/docker-entrypoint.sh"]
