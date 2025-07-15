FROM node:18-alpine AS builder

RUN apk add --no-cache python3 make g++ busybox coreutils

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine AS runner

RUN apk add --no-cache python3 make g++ \
    && adduser -D -u 1001 sandboxuser \
    && mkdir /sandbox \
    && chown sandboxuser:sandboxuser /sandbox

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

USER sandboxuser

CMD ["node", "dist/main.js"]

# RUN mkdir /sandbox

# make a user w/ limited permissions ( cd mod ) w/ only read write executable permissions (chmod 777 /sandbox/*)
