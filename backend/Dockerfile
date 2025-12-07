FROM node:18-alpine

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

# Start command (ensure this runs built code)
# Using 'node dist/server.js' assuming build output is 'dist'
CMD ["npm", "start"]
