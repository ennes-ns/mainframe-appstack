FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y git && npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
