# Multi-stage build for Next.js customer frontend

# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy customer-frontend package.json
COPY customer-frontend/package.json ./customer-frontend/

# Install dependencies
RUN yarn workspaces focus customer-frontend

# Stage 2: Builder
FROM node:20-alpine AS builder

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app ./

# Copy customer-frontend source
COPY customer-frontend ./customer-frontend

# Build the application
RUN yarn workspace customer-frontend build

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
COPY --from=builder /app/customer-frontend/public ./customer-frontend/public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/customer-frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/customer-frontend/.next/static ./customer-frontend/.next/static

USER nextjs

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "customer-frontend/server.js"]
