FROM node:20-slim

# Required for Baileys / sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

# For session persistence, mount a Railway Volume at /app/sessions via the dashboard

EXPOSE 3001
CMD ["node", "index.js"]
