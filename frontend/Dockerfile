# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set API URL to relative path for Nginx proxying
ENV VITE_API_URL=/api

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for Nginx to access files
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Install OpenSSL and generate self-signed certificate
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=NL/ST=State/L=City/O=EasyData/CN=localhost"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
