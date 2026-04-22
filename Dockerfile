# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# ci is faster, stricter, and reproducible — better for production builds
RUN npm ci

COPY . .

RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:stable-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from builder stage
# ← Vite outputs to /dist, CRA outputs to /build — use whichever matches yours
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config into the image
# ← baked in so the image works standalone without relying on host bind-mount
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx runs on 443 for HTTPS and 80 for HTTP redirect
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]