# Ty_Zah Sistema — Agenda para barbearia

MVP: agenda real (slots + bloqueio), confirmação/lembrete WhatsApp, painel Hoje, schema Google, ficha de cliente.

## Setup

```bash
cp .env.example .env.local
npm install
npx drizzle-kit push
npm run dev
```

## Rotas

- `/` landing + SEO schema
- `/agendar` fluxo cliente
- `/admin` login
- `/admin/hoje` agenda + lembretes + bloqueio
- `/admin/clientes` fichas

Repo completo no código-fonte deste repositório.
