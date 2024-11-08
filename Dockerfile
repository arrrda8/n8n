FROM n8nio/n8n:latest-debian

# Install necessary system libraries and Chromium
USER root
RUN apt-get update && apt-get install -y \
    chromium \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Erstelle einen Symlink von chromium zu chromium-browser
RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser

# Setze das Arbeitsverzeichnis zu deinem Skriptverzeichnis
WORKDIR /home/node/custom-scripts

# Kopiere deine Skripte und package.json
COPY --chown=node:node ./custom-scripts /home/node/custom-scripts

# Setze Umgebungsvariable, um den Chromium-Download zu überspringen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Installiere die Abhängigkeiten aus package.json
RUN npm install

# Stelle sicher, dass node_modules dem Benutzer 'node' gehören
RUN chown -R node:node /home/node/custom-scripts/node_modules

# Setze das Arbeitsverzeichnis zurück
WORKDIR /home/node

# Exponiere den Port
EXPOSE 5678

# Starten der Anwendung
CMD ["n8n"]
