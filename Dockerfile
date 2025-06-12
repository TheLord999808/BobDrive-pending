# Dockerfile pour l'application Next.js File Manager
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat curl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./
COPY yarn.lock* ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Étape de build
FROM base AS builder
WORKDIR /app

# Copier tout le code source
COPY . .

# Installer toutes les dépendances (dev incluses)
RUN npm ci

# Build l'application Next.js
RUN npm run build

# Étape de production
FROM node:18-alpine AS runner
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Créer les répertoires nécessaires
RUN mkdir -p /app/uploads /app/logs /app/config
RUN chown -R nextjs:nodejs /app

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"]