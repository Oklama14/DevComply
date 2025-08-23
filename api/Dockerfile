 FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando padrão (será sobrescrito pelo docker-compose)
CMD ["npm", "run", "start:prod"]