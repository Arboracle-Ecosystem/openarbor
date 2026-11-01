# Stage 1: Deterministic Build, Test & Parity Verification
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build:web && \
    npm test && \
    npm run test:mcp && \
    npm run validate:ordinances && \
    npm run verify:parity

# Stage 2: Production Static Server (Google Cloud Run)
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/out/ /usr/share/nginx/html/
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
