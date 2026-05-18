FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências temporariamente (necessário para o build)
RUN npm install

# Copiar o código fonte para dentro do container
COPY . .

# EXECUTAR O BUILD (Isso vai criar a pasta /app/dist que estava faltando)
RUN npm run build

# Opcional: Limpar as devDependencies para deixar a imagem leve em produção
RUN npm prune --production

# Expor porta
EXPOSE 3000

# Comando padrão de inicialização em produção
CMD ["npm", "run", "start:prod"]