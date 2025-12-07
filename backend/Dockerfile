FROM node:18

WORKDIR /app

# Install dependencies including devDependencies for build
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Prune dev dependencies to save space (optional, but good practice)
# RUN npm prune --production

# Expose port
EXPOSE 5000

# Start command (ensure migrations run and seed data)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
