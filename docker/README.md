# Docker Configuration

This folder contains all Docker-related configuration files for CBCT.

## Files

- **Dockerfile** — Production image (multi-stage build)
- **Dockerfile.dev** — Development image with hot reload support
- **docker-compose.yml** — Docker Compose orchestration for both production and development

## Quick Start

### Run from Project Root

All docker commands should be run from the **project root** directory (parent of this folder):

#### Production Deployment
```bash
docker-compose -f docker/docker-compose.yml up
```

This will:
- Build the production image
- Start the CBCT server on port 5000
- Mount persistent volume for cloned repositories

#### Development with Hot Reload
```bash
docker-compose -f docker/docker-compose.yml --profile dev up
```

This will:
- Build the development image
- Start both frontend (port 3000) and backend (port 5000)
- Mount local source directories for live code updates
- Enable hot reload for both client and server

## Image Architecture

### Production Image (Dockerfile)

**Multi-stage build:**
1. **Stage 1: Client Builder**
   - Builds React frontend with Vite
   - Creates optimized bundle in `/app/client/dist`

2. **Stage 2: Production Server**
   - Copies built client to server
   - Installs production dependencies only
   - Includes git for repository cloning

**Build Time:** ~3-5 minutes  
**Image Size:** ~400MB

### Development Image (Dockerfile.dev)

**Single stage build:**
- Installs all dependencies (dev + prod)
- Mounts source directories for live reload
- No build step needed
- Includes both frontend dev server and backend

**Build Time:** ~2 minutes  
**Image Size:** ~600MB

## Environment Configuration

### Production Environment
```yaml
NODE_ENV: production
PORT: 5000
```

### Development Environment
```yaml
NODE_ENV: development
```

Additional dev config in `docker-compose.yml::cbct-dev` service.

## Build Context

- **Build Context**: `..` (project root)
- **Dockerfile paths**: `docker/Dockerfile` and `docker/Dockerfile.dev`
- **Volume paths**: `./client` and `./server` (relative to root)

This allows the Dockerfiles to access all project files using relative paths from the root directory.

## Health Checks

The production service includes a health check:

```bash
# Manual health check
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "CBCT Server is running",
  "cache": "connected"
}
```

## Volumes

### Production
- **cbct-clones** — Persistent storage for cloned repositories

### Development
- **./client** → `/app/client` — Frontend source (live reload)
- **./server** → `/app/server` — Backend source (live reload)
- **/app/client/node_modules** — Docker internal (prevents mount override)
- **/app/server/node_modules** — Docker internal (prevents mount override)
- **cbct-clones** → `/tmp/cbct-clones` — Shared clone cache

## Common Commands

### Build custom image
```bash
docker build -f docker/Dockerfile -t cbct:latest .
```

### View running containers
```bash
docker ps
```

### View logs
```bash
# Production
docker-compose -f docker/docker-compose.yml logs cbct

# Development
docker-compose -f docker/docker-compose.yml logs cbct-dev
```

### Stop containers
```bash
docker-compose -f docker/docker-compose.yml down
```

### Remove volumes
```bash
docker-compose -f docker/docker-compose.yml down -v
```

## Troubleshooting

### Container exits immediately

Check logs:
```bash
docker-compose -f docker/docker-compose.yml logs
```

### Port already in use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8000:5000"  # Change 8000 to available port
```

### Git operations fail

Ensure git is available in the container:
```bash
docker exec CONTAINER_ID git --version
```

Both Dockerfiles include `RUN apk add --no-cache git`, so git should be available.

### Hot reload not working (dev)

1. Verify volumes are mounted:
   ```bash
   docker inspect CONTAINER_ID | grep Mounts
   ```

2. Check environment is set to `development`:
   ```bash
   docker-compose -f docker/docker-compose.yml logs | grep NODE_ENV
   ```

## Docker Networking

Services are on a shared Docker network. The internal service names are:

- **Production**: `cbct` (accessible as `http://cbct:5000` from other containers)
- **Development**: `cbct-dev` (accessible as `http://cbct-dev:5000` from other containers)

## Performance Notes

- **Build cache**: Docker caches layers. Rebuilds are fast if dependencies haven't changed
- **Development mode**: Live reload adds ~1-2 seconds per change, but no rebuild needed
- **Memory**: Allocate at least 2GB to Docker for smooth builds

## Related Files

- See [docker-compose.yml](docker-compose.yml) for full orchestration config
- See [Dockerfile](Dockerfile) for production build steps
- See [Dockerfile.dev](Dockerfile.dev) for development build steps
- See root [README.md](../README.md) for overall project overview

---

**Last Updated**: March 28, 2026

**Note**: Always run docker commands from the project root, not from this folder.
