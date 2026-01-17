# Multi-stage build for Next.js admin frontend

# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy admin-frontend package.json
COPY admin-frontend/package.json ./admin-frontend/

# Install dependencies
RUN yarn workspaces focus admin-frontend

# Stage 2: Builder
FROM node:20-alpine AS builder

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app ./

# Copy admin-frontend source
COPY admin-frontend ./admin-frontend

# Build the application
RUN yarn workspace admin-frontend build

# Stage 3: Runner
FROM node:20-alpine AS runner

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/admin-frontend/public ./admin-frontend/public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/admin-frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/admin-frontend/.next/static ./admin-frontend/.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "admin-frontend/server.js"]
