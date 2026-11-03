# Node 26 is the current LTS. Pinned so every build uses the same runtime; bump the tag to upgrade.
FROM node:26.13.0-trixie-slim AS base

# Client: copy the lockfile and install first, so source-only changes reuse the cached npm ci layer
FROM base AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Server: same pattern. tsc compiles all of src/, including scripts/seed.ts
FROM base AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Runtime: production dependencies and compiled output only
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
# argon2 loads its prebuilt glibc binary, so no compiler toolchain is needed
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=server-build /app/server/dist ./dist
# app.ts serves ../../client/dist relative to dist/, i.e. /app/client/dist
COPY --from=client-build /app/client/dist ../client/dist

# Files stay owned by root, so the app can read its code but not change it
USER node
EXPOSE 5000
# The slim image has no curl, so the check uses Node's built-in fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --start-interval=2s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]
# node, not npm start: node runs as PID 1 and receives SIGTERM, so the graceful shutdown runs
CMD ["node", "dist/server.js"]
