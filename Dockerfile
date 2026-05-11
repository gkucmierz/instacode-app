# Stage 1: Build the static site
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install nano-ui@latest --registry=https://gitea.7u.pl/api/packages/gkucmierz/npm/ --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve the static site using Nginx
FROM nginx:alpine

# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Vite files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
