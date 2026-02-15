FROM node:22-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsx build.mts
RUN npm prune --production

FROM node:22-bookworm-slim
WORKDIR /app

# Install ImageMagick
RUN apt-get update \
  && apt-get install -y imagemagick \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist dist/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
