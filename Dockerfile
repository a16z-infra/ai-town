FROM node:18-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

EXPOSE 5174

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5174"]
