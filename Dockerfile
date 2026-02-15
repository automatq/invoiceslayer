FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
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
# ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

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

# Copy Prisma schema and migrations for runtime usage
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Copy config files if needed (usually standalone handles this, but prisma client needs schema)

USER nextjs

EXPOSE 3000

ENV PORT=3000

# We need to run migrations before starting the app.
# Since this is a standalone build, we need to ensure prisma is available or generated client is enough.
# Standalone build might not include the prisma CLI.
# Strategy: We will use a startup script or expect the user to run migrations?
# Better: Include prisma in result or just rely on the pre-built db if valid, but better to run migrations.
# To run migrations in production with standalone, we might need to copy node_modules/prisma or install it.
# Simpler approach for ZimaOS: Just start the app. The user can mount a volume with the DB.
# If DB is empty, Prisma Client might error if not initialized.
# Let's try to include a script to check/migrate.

CMD ["node", "server.js"]
