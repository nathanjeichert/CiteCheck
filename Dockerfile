# Use Node 20 LTS
FROM node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# Install deps separately to leverage Docker cache
FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
  else npm i; fi

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image
FROM base AS runner
ENV PORT=8080 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Copy only what we need to run
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
# Remove dev deps for runtime
RUN npm prune --omit=dev || true

EXPOSE 8080
CMD ["npx", "next", "start", "-p", "8080"]
