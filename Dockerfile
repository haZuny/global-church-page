FROM node:22-bookworm-slim AS dependencies

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-distutils make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# npm 7+ can run package lifecycle scripts in the background. Run them in the
# foreground so esbuild's binary is never executed while it is being installed.
RUN npm ci --foreground-scripts

FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL
ARG GOOGLE_SITE_VERIFICATION
ARG NAVER_SITE_VERIFICATION
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION
ENV NAVER_SITE_VERIFICATION=$NAVER_SITE_VERIFICATION

RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
# public/assets is a repository symlink to ../assets. Keep its target in the
# runtime image so root-relative image URLs such as /assets/images/... work.
COPY --from=builder /app/assets ./assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/directus/sync-content-assets.mjs ./scripts/directus/sync-content-assets.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/directus/local-development.mjs ./scripts/directus/local-development.mjs
COPY --from=builder --chown=nextjs:nodejs /app/config/local-development.json ./config/local-development.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
