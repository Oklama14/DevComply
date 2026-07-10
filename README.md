# DevComply

Ferramenta para apoiar desenvolvedores na conformidade com a LGPD durante o
desenvolvimento de software: cadastro de projetos, checklist LGPD e geração de
relatórios de conformidade assistidos por IA (Google Gemini).

## Stack

- **API** (`/api`): NestJS 11 + TypeORM + PostgreSQL. Deploy: Railway (Docker).
- **Cliente** (`/client`): Angular 20 (SPA). Deploy: Vercel.
- **IA**: Google Gemini (`gemini-2.5-flash`), chave global ou por usuário.

## Estrutura

```
api/     API NestJS (auth, users, projects, checklist, reports, health)
client/  SPA Angular
```

## Variáveis de ambiente (API)

| Variável         | Obrigatória | Descrição |
|------------------|-------------|-----------|
| `DATABASE_URL`   | sim*        | String de conexão Postgres. Alternativa: `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME`. |
| `JWT_SECRET`     | sim         | Segredo para assinar os JWT. Use um valor forte e aleatório. |
| `FRONTEND_URL`   | recomendada | Origem do frontend para o CORS (ex.: `https://dev-comply.vercel.app`). `*.vercel.app` já é liberado. |
| `GOOGLE_API_KEY` | opcional    | Chave padrão do Gemini. Sem ela, os relatórios só funcionam com a chave do próprio usuário. |
| `NODE_ENV`       | sim (prod)  | `production` em produção (ativa migrations e desativa `synchronize`). |
| `PORT`           | auto        | Injetada pelo Railway (o app usa `process.env.PORT`). |

\* `DATABASE_URL` **ou** o conjunto `DB_*`. A validação no boot falha rápido se faltar o essencial.

O frontend usa `client/src/environments/environment.prod.ts` (`apiUrl`) apontando para a API.

## Rodar localmente

Pré-requisitos: Node 20, um Postgres local.

```bash
# API
cd api
cp .env.example .env      # ajuste as variáveis
npm install
npm run start:dev         # http://localhost:3000

# Cliente
cd client
npm install
npm start                 # http://localhost:4200
```

Em desenvolvimento (`NODE_ENV` != production) o `synchronize` do TypeORM cria o
schema automaticamente. Em produção o schema é gerido por **migrations**.

## Migrations

O schema de produção é versionado. Comandos (na pasta `api`):

```bash
npm run migration:generate -- src/migrations/NomeDaMigration
npm run migration:run
npm run migration:revert
```

Em produção as migrations rodam sozinhas no boot (`migrationsRun`). A migration
inicial (`InitialSchema`) é idempotente, então é segura tanto em banco novo
quanto no banco já existente.

## Testes

```bash
cd api
npm test
```

Cobrem auth (login), users (cadastro/chave Gemini), projetos (ownership) e a
inicialização dos módulos de checklist/reports.

## Health check

`GET /health` → `{ "status": "ok", "db": "up" }` (503 se o banco estiver fora).

## Deploy

- **API (Railway):** build via `api/Dockerfile` (multi-stage). Root directory `/api`,
  branch `main`. Porta alvo do serviço = a porta que o app loga no boot (`PORT`, 8080).
- **Cliente (Vercel):** SPA estática; `vercel.json` faz o fallback de rotas para `index.html`.

## Segurança (notas)

- Senhas com `bcryptjs`; JWT com expiração de 1 dia.
- Rotas de perfil derivam o usuário do token (sem IDOR).
- Rate limit global + reforçado em `/auth`.
- A chave Gemini do usuário fica com `select: false` (não retornada pela API).
  Recomendação futura: cifrar em repouso.
