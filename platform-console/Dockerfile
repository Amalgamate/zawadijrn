FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY auth-config.js server.js ./
COPY index.html styles.css app.js login.css login.js ./

EXPOSE 3100

CMD ["node", "server.js"]
