FROM node:22-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production


FROM node:22-bookworm-slim
WORKDIR /app

# Install ImageMagick
RUN apt-get update \
  && apt-get install -y imagemagick \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
COPY server.js server.js

EXPOSE 3000
ENV NODE_ENV=production

ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

CMD ["node", "server.js"]
