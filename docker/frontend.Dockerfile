# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/

# Install pnpm using corepack (more secure than npm global install)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the app
RUN pnpm build

# Production stage - use clean alpine base and install nginx manually
FROM alpine:latest

# Install nginx and required dependencies
RUN apk add --no-cache nginx wget

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html /var/log/nginx /var/lib/nginx/tmp

# Copy built files to nginx
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Use healthcheck to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]