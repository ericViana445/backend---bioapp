# BioApp Backend

Backend Node.js/Express/TypeScript do BioApp, preparado para deploy com Supabase PostgreSQL e Supabase Storage.

## Instalar

```bash
npm install
```

## Configurar ambiente

Copie `.env.example` para `.env` e preencha os valores reais:

```bash
PORT=3333
NODE_ENV=development
JWT_SECRET=uma_chave_forte
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_SECRET_KEY=somente_no_backend
SUPABASE_PUBLISHABLE_KEY=opcional_para_referencia
SUPABASE_STORAGE_BUCKET=bioapp-pdfs
GOOGLE_CLIENT_ID=client_id_web_do_google
GEMINI_API_KEY=sua_chave_do_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash
AI_API_KEY=opcional_legado
FRONTEND_URL=app://bioapp
EMAIL_USER=
EMAIL_PASS=
```

Nunca use `SUPABASE_SECRET_KEY` nem `SUPABASE_SERVICE_ROLE_KEY` no frontend. O app mobile deve consumir apenas a URL publica deste backend.
Tambem nao coloque `GEMINI_API_KEY` no app mobile; a chamada ao Gemini e feita pelo backend.

`SUPABASE_URL` precisa ser a Project URL base do Supabase, por exemplo `https://abcdefghijklmno.supabase.co`. Nao use a URL do dashboard nem uma URL terminada em `/rest/v1`.

## Criar Supabase

No SQL Editor do Supabase, execute o arquivo [supabase.sql](./supabase.sql). Ele cria:

- `public.users`, equivalente a tabela SQLite antiga.
- `public.pdf_uploads`, para metadados dos PDFs enviados.
- `public.ai_analyses`, para historico de analises.
- Bucket `bioapp-pdfs` no Supabase Storage.

As tabelas ficam com RLS habilitado. Como este backend usa service role no servidor, ele consegue operar sem policies abertas. Se o app passar a acessar Supabase diretamente no futuro, crie policies especificas por usuario.

## Rodar localmente

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3333/health
```

## Build e start

```bash
npm run build
npm start
```

O servidor escuta em `0.0.0.0`, adequado para Render, Railway, Fly.io ou VPS.

## Deploy no Render ou Railway

Configure:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Root directory: este repositorio do backend
- Variaveis: todas as do `.env.example`, com valores reais

Em producao, defina:

```bash
NODE_ENV=production
FRONTEND_URL=app://bioapp
```

O CORS esta configurado para aceitar chamadas mobile sem `Origin` e tambem origens HTTP quando necessario. `FRONTEND_URL` fica apenas como referencia de configuracao.

## Checklist de publicacao

- Executar `supabase.sql` no projeto Supabase.
- Criar/preencher `.env` local.
- Rodar `npm run build`.
- Testar `GET /health`.
- Publicar backend e copiar a URL publica.
- Configurar o app Expo com `EXPO_PUBLIC_API_URL=https://sua-api`.
- Gerar build EAS do Android.
