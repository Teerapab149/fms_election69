# Node 22 LTS. Node 20 went EOL in April 2026 — it stopped getting security
# patches, which is not a base image to run an election on. Next 15.5 requires
# Node 18.18+ and supports 20 and 22; 22 is the current LTS with support into 2027.
# If you bump this, run `docker build` + smoke + e2e before deploying.
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Arguments for build time
ARG BASE_PATH
ARG ASSET_PREFIX

# Environment variables for build time
# NOTE: NEXT_PUBLIC_ADMIN_PUBLIC_KEY / NEXT_PUBLIC_ADMIN_AUTH_SECRET were REMOVED
# (P0-1 security fix) — admin auth is now the httpOnly admin_token JWT cookie,
# verified server-side. No admin secret is shipped to the client bundle.
ENV BASE_PATH=${BASE_PATH}
ENV ASSET_PREFIX=${ASSET_PREFIX}
ENV NEXT_PUBLIC_BASE_PATH=${BASE_PATH}

# Generate Prisma Client
RUN npx prisma generate

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
