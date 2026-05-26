# HazardMap API — Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy root package files for shared dependencies (e.g., @turf/circle)
COPY package.json package-lock.json* ./

# Copy server package files
COPY server/package.json server/package-lock.json* ./server/

# Copy shared frontend simulation engine (imported by server)
COPY src/services/simulationEngine.js ./src/services/simulationEngine.js

# Install root dependencies (shared modules)
RUN npm install --production

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy server source
COPY server/ ./

# Copy migration and seed files
COPY server/migrations/ ./migrations/
COPY server/seeds/ ./seeds/

EXPOSE 5001

CMD ["node", "src/index.js"]
