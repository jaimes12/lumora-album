FROM node:20-slim

# Required for Baileys / sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

# Sessions are stored in a volume for persistence
VOLUME ["/app/sessions"]

EXPOSE 3001
CMD ["node", "index.js"]
