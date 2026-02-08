FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY server/ server/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Install ClamAV for runtime scanning (optional; enabled via env CLAMAV_SCAN_ENABLED)
RUN apk add --no-cache clamav clamav-libunrar
# Update clamav DB at build time (best-effort; runtime freshclam is recommended)
RUN mkdir -p /var/lib/clamav && freshclam || echo "freshclam failed; ensure network or run at runtime"

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
