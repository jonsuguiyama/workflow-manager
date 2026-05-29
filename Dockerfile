FROM node:22-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/

COPY --from=frontend-builder /app/client/dist/client ./server/public

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server/src/index.js"]