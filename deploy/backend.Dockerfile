# BestDeal API. Build context: backend/
FROM node:22-bookworm-slim

# Prisma's query engine needs OpenSSL
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Dev dependencies included: the deploy runs `prisma db push`, and the Prisma CLI is a dev dependency
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["node", "server.js"]
