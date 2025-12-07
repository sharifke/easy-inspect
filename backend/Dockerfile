FROM node:18

WORKDIR /app

# Install dependencies for Puppeteer/Chrome
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.deb.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies including devDependencies for build
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose portdev dependencies to save space (optional, but good practice)
# RUN npm prune --production

# Expose port
EXPOSE 5000

# Start command (ensure migrations run and seed data)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
