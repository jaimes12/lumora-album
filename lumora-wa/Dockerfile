FROM node:20-slim

# git required by Baileys transitive deps; python3/make/g++ for native addons
RUN apt-get update && apt-get install -y --no-install-recommends \
    git python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && git config --global url."https://github.com/".insteadOf ssh://git@github.com/ \
    && git config --global url."https://github.com/".insteadOf git@github.com:

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY index.js ./

EXPOSE 3001
CMD ["node", "index.js"]
