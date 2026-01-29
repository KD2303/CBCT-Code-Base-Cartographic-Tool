# Multi-stage build for CBCT
# Stage 1: Build the client
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production=false
COPY client/ ./
RUN npm run build

# Stage 2: Setup server with built client
FROM node:20-alpine AS production

# Install git for repository cloning functionality
RUN apk add --no-cache git

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server source
COPY server/src ./src

# Copy built client to serve statically
COPY --from=client-builder /app/client/dist /app/client/dist

# Create directory for cloned repos
RUN mkdir -p /tmp/cbct-clones

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "src/index.js"]
