FROM node:18-alpine

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 4200

# Comando padrão (será sobrescrito pelo docker-compose)
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
