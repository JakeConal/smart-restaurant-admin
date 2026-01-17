# Multi-stage build for NestJS backend

# Stage 1: Build
FROM node:20-alpine AS builder

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy backend package.json
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn workspaces focus backend

# Copy backend source
COPY backend ./backend

# Build the application
RUN yarn workspace backend build

# Stage 2: Production
FROM node:20-alpine

# Enable Corepack and set Yarn version
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY backend/package.json ./backend/

# Install only production dependencies
RUN yarn workspaces focus backend --production

# Copy built application from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Expose the port
EXPOSE 3000

# Start the application
CMD ["yarn", "workspace", "backend", "start:prod"]
