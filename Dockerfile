FROM n8nio/n8n:latest-debian

# Installieren von notwendigen Systembibliotheken
USER root
RUN apt-get update && apt-get install -y \
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
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Installieren von Puppeteer Extra und erforderlichen Plugins
RUN npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Optional: Kopieren deiner Skripte in das Image
COPY ./scripts /home/node/scripts

# Setzen der richtigen Berechtigungen
RUN chown -R node:node /home/node/scripts

USER node

# Exponieren des Ports
EXPOSE 5678

# Starten der Anwendung
CMD ["n8n"]
