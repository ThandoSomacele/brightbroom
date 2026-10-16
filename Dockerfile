# syntax=docker/dockerfile:1
#
# Self-hosted image: one container per cleaning company, deployed by Coolify
# (see docs/SELF_HOSTING.md). The Netlify demo does not use this file.
#
# Build-time variables: only values compiled into the bundle need build args
# (Coolify: tick "Build Variable" on them). Everything else, including the
# PUBLIC_* brand settings read via $env/dynamic/public, is read at runtime.

ARG NODE_VERSION=22

# ---- base: Node + pnpm (pinned by package.json "packageManager") ------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install

# ---- prod-deps: runtime node_modules only -------------------------------------
# adapter-node leaves package.json "dependencies" external, so the server needs
# them at runtime (also provides drizzle-orm/postgres for migrations and tsx
# for the seed script).
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ---- build -------------------------------------------------------------------
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
# Compiled into the bundle at build time, so they are build args (Coolify:
# mark them "Build Variable"). BRAND_PRIMARY/BRAND_SECONDARY (hex) feed the
# Tailwind palette; set them at runtime as well so emails match. Everything
# PUBLIC_* (brand, analytics) is read at runtime and is NOT a build arg.
ARG VITE_GOOGLE_MAPS_API_KEY=""
ARG VITE_SITE_URL=""
ARG BRAND_PRIMARY=""
ARG BRAND_SECONDARY=""
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_SITE_URL=$VITE_SITE_URL \
    BRAND_PRIMARY=$BRAND_PRIMARY \
    BRAND_SECONDARY=$BRAND_SECONDARY
RUN DEPLOY_TARGET=node pnpm run build

# ---- runtime -----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
# NODE_ENV=production is load-bearing: the PayFast ITN handler only rejects
# invalid signatures in production. (The cron endpoints always demand their token.)
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
# adapter-node settings (override in Coolify if needed). ORIGIN has no default:
# it must be the public URL, e.g. https://book.company.co.za, or every form post
# fails the origin check in hooks.server.ts.
#  - Real client IPs (rate limits) from Coolify's proxy; XFF_DEPTH = number of
#    proxies in front (1 = Traefik only; 2 if Cloudflare proxies as well).
#  - Uploads (ID documents, photos) exceed the 512K default request body limit.
ENV ADDRESS_HEADER=X-Forwarded-For \
    XFF_DEPTH=1 \
    BODY_SIZE_LIMIT=12M
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json ./
# Fresh-install migrations, container entrypoint, scheduled-task runner and the
# first-run seed (which imports the Drizzle schema).
COPY --chown=node:node drizzle/fresh ./drizzle/fresh
COPY --chown=node:node scripts/docker ./scripts/docker
COPY --chown=node:node scripts/cron.mjs ./scripts/cron.mjs
COPY --chown=node:node scripts/db/seed-client.ts ./scripts/db/seed-client.ts
COPY --chown=node:node src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts
RUN chmod +x scripts/docker/start.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./scripts/docker/start.sh"]
