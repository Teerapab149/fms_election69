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
# หมายเหตุ: `adduser --system` ที่ไม่ระบุ --ingroup จะไม่ใส่ nextjs เข้ากลุ่ม nodejs
# ผู้ใช้จริงในคอนเทนเนอร์คือ uid=1001(nextjs) gid=65533(nogroup) — ยืนยันด้วย `docker exec ... id`
# เพราะงั้นสิทธิ์บนโฟลเดอร์ที่ bind-mount เข้ามา ต้องให้ที่ **เจ้าของ (uid 1001)** ไม่ใช่ที่กลุ่ม:
#   sudo chown -R 1001 public/images
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

# Docker ต้องรู้ได้เองว่าคอนเทนเนอร์นี้ "ยังใช้งานได้" ไม่ใช่แค่ "โปรเซสยังไม่ตาย"
#
# ก่อนหน้านี้ไม่มี HEALTHCHECK เลย docker จึงถือว่า running = healthy เสมอ
# แอปที่ต่อฐานข้อมูลไม่ได้ (/api/health คืน 503) ยังถูกนับว่าปกติ · restart: always
# ก็ไม่ช่วยเพราะโปรเซสไม่ได้ตาย · ผลคือคืนก่อนเลือกตั้งระบบล่มได้โดยไม่มีสัญญาณอะไรเลย
#
# /api/health ยิง SELECT 1 เข้าฐานข้อมูลจริง (route.js) 200 = ต่อได้ · 503 = ต่อไม่ได้
# start-period 40s เผื่อ Next boot + Prisma ต่อครั้งแรก ช่วงนั้นล้มเหลวไม่นับเป็น unhealthy
# ใช้ node แทน curl เพราะ image เป็น alpine ที่ไม่มี curl ติดมา และไม่อยากลงเพิ่มแค่เรื่องนี้
# ⚠️ ต้องต่อไปที่ HOSTNAME ไม่ใช่ 127.0.0.1
#
# next standalone server.js bind ไปที่ `process.env.HOSTNAME || "0.0.0.0"` และ docker ตั้ง
# HOSTNAME ให้เป็น container id เสมอ แปลว่าเซิร์ฟเวอร์ฟังที่ IP ของคอนเทนเนอร์
# **ไม่ได้ฟังที่ 127.0.0.1** · เวอร์ชันแรกของด่านนี้ยิงไป 127.0.0.1 แล้วได้ ECONNREFUSED
# ทั้งที่แอปตอบ 200 ปกติจากข้างนอก — docker จึงมาร์กคอนเทนเนอร์ที่แข็งแรงดีว่า unhealthy
# ซึ่งอันตรายกว่าไม่มีด่านเลย เพราะ orchestrator จะรีสตาร์ตวนไม่จบ (จับได้ตอนทดสอบจริง)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const h=process.env.HOSTNAME||'127.0.0.1';require('http').get('http://'+h+':'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
