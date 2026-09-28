FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5001
ENV PORT=5001
ENV NODE_ENV=production

CMD ["node", "server.js"]
