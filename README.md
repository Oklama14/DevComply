# DevComply

**Checklist de LGPD para quem desenvolve software.** A equipe responde, item por item,
o que o sistema já faz para cumprir a Lei Geral de Proteção de Dados (Lei
13.709/2018), e o DevComply gera um relatório de conformidade com as lacunas
ordenadas por gravidade e o que fazer em cada uma.

**Acesse: [dev-comply.vercel.app](https://dev-comply.vercel.app)**

## O que ele faz

- **Checklist baseado em pesquisa.** As perguntas vêm do LGPD-Check, o checklist de
  inspeção de [Mendes, Viana e Rivero (SBES 2021)](https://sol.sbc.org.br/index.php/sbes/article/view/18822),
  avaliado num órgão público por [Neitzke et al. (SBQS 2023)](https://sol.sbc.org.br/index.php/sbqs/article/view/27108).
  O catálogo tem os 61 itens, em seis seções: Transparência, Processamento de dados,
  Consentimento, Direitos dos usuários, Segurança de dados e Responsabilidade do
  controlador; o checklist pergunta 18 deles, três por seção.
- **Relatório em PDF.** Índice de conformidade de 0 a 100%, cada lacuna classificada
  por gravidade (catastrófica, grave, leve ou não implementada) e um plano de ação
  nessa ordem. A avaliação é feita pelo Google Gemini, com a chave do serviço ou a do
  próprio usuário.
- **Histórico por projeto.** Cada relatório fica guardado: a página de relatórios do
  projeto mostra a evolução do índice e o que foi resolvido de um para o outro.
- **Declarado × código.** As respostas do checklist são o que a equipe *diz* ter
  feito. A [lgpd-scan](https://github.com/Oklama14/lgpd-scan), uma skill de agente
  (Claude Code, Codex, Gemini CLI, Cursor, OpenCode) que audita a LGPD lendo o
  código-fonte, recebe essas declarações exportadas pelo DevComply e mostra onde o
  código desmente o que foi declarado.

O relatório é apoio técnico para a equipe, não parecer jurídico nem atestado de
conformidade. O DevComply é um artefato de pesquisa desenvolvido como Trabalho de
Conclusão de Curso.

## Referências

- MENDES, J.; VIANA, D.; RIVERO, L. Developing an Inspection Checklist for the
  Adequacy Assessment of Software Systems to Quality Attributes of the Brazilian
  General Data Protection Law: An Initial Proposal. In: Simpósio Brasileiro de
  Engenharia de Software (SBES), 35., 2021, Joinville. Porto Alegre: SBC, 2021.
  <https://sol.sbc.org.br/index.php/sbes/article/view/18822>
- NEITZKE, C.; MENDES, J.; RIVERO, L.; TEIXEIRA, M.; VIANA, D. Enhancing LGPD
  Compliance: Evaluating a Checklist for LGPD Quality Attributes within a Government
  Office. In: Simpósio Brasileiro de Qualidade de Software (SBQS), 22., 2023,
  Brasília. Porto Alegre: SBC, 2023. p. 218-227.
  <https://sol.sbc.org.br/index.php/sbqs/article/view/27108>

---

O restante deste documento é para quem vai rodar ou modificar o código.

## Stack

- **API** (`/api`): NestJS 11 + TypeORM + PostgreSQL. Deploy: Railway (Docker).
- **Cliente** (`/client`): Angular 20, com as páginas públicas pré-renderizadas. Deploy: Vercel.
- **IA**: Google Gemini (`gemini-3.8-flash`, com `gemini-3.5-flash-lite` como alternativa), chave global ou por usuário.

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
| `GEMINI_MODEL`   | opcional    | Modelos do Gemini em ordem de tentativa, separados por vírgula. Padrão: `gemini-3.8-flash,gemini-3.5-flash-lite`. |
| `REPORTS_PER_HOUR` | opcional  | Quantos relatórios cada usuário pode gerar por hora (janela móvel). Acima disso a API responde 429. Padrão: `10`. |
| `NODE_ENV`       | sim (prod)  | `production` em produção (ativa migrations e desativa `synchronize`). |
| `APP_ENCRYPTION_KEY` | recomendada | Segredo para cifrar dados sensíveis em repouso (ex.: chave Gemini do usuário). Sem ela, guarda em texto (com aviso). |
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

## Checklist LGPD (LGPD-Check)

O catálogo do checklist fica em `api/src/checklist/catalog/lgpd-check.catalog.ts`,
com os 61 itens do LGPD-Check (Mendes, Viana e Rivero, SBES 2021; Neitzke et al.,
SBQS 2023). O checklist exibe 3 perguntas obrigatórias por seção
(`CODIGOS_NO_CHECKLIST`), em 6 seções — Transparência, Processamento de dados,
Consentimento, Direitos dos usuários, Segurança de dados e Responsabilidade do
controlador.

- Produção: a migration `LgpdCheckCatalog` aplica o catálogo (idempotente).
  Para mudar o catálogo depois, crie uma nova migration que chame
  `aplicarCatalogoLgpdCheck`.
- Desenvolvimento: o catálogo é aplicado no boot da API (nada é semeado
  durante requisições).

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
- **Cliente (Vercel):** build estático (`outputMode: "static"`). A landing, a política
  de privacidade e os termos saem pré-renderizados, com o texto no HTML para quem não
  roda JavaScript (buscadores e robôs de IA); o `vercel.json` manda as demais rotas
  para `index.csr.html`.

## Segurança (notas)

- Senhas com `bcryptjs`; JWT com expiração de 1 dia.
- Rotas de perfil derivam o usuário do token (sem IDOR).
- Rate limit global + reforçado em `/auth`.
- A chave Gemini do usuário fica com `select: false` (não retornada pela API) e é
  cifrada em repouso quando `APP_ENCRYPTION_KEY` está definida.
