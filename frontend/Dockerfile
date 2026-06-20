FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code and config files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./

# Build production static assets
RUN npm run build

# ── Production Stage ──
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: custom nginx config for SPA routing
RUN echo 'server { listen 5173; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
