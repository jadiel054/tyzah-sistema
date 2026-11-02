# Proposta Técnica: Arquitetura Multi-Tenant para Comercialização SaaS

Este documento apresenta o diagnóstico e a proposta arquitetural para transformar o **Ty_Zah Sistema** em uma plataforma SaaS capaz de atender múltiplas barbearias e estabelecimentos de forma isolada, escalável e segura.

---

## 1. Diagnóstico do Estado Atual (Single-Tenant)

Atualmente, o sistema foi projetado para operar como uma única instância dedicada:
- Configurações do estabelecimento (nome, telefone, endereço, horários) são lidas de variáveis de ambiente (`SHOP_NAME`, `SHOP_PHONE`, `SHOP_HOURS_JSON`).
- As tabelas do banco de dados (`clients`, `services`, `appointments`, `blocked_slots`, `waitlist`) não possuem segregação por organização ou filial.
- Existe apenas uma credencial administrativa (`ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH`).

---

## 2. Estratégia de Isolamento Recomendada

Recomendamos o modelo **Multi-Tenant com Banco Compartilhado e Segregação por Tenant ID com Row-Level Security (RLS)** no PostgreSQL.

### Vantagens:
- **Custo-Benefício e Manutenção Unificada**: Uma única base de dados reduz os custos de infraestrutura no Neon DB e simplifica as migrações de esquema.
- **Segurança Robusta com PostgreSQL RLS**: A segurança não depende unicamente da cláusula `WHERE tenant_id = ?` na aplicação; o próprio banco rejeita leituras/escritas fora do contexto da barbearia autenticada.

---

## 3. Entidades e Modelo de Dados

### 3.1. Tabela de Tenants (Organizações)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- ex: 'tyzah', 'vintage-barber'
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    maps_url TEXT,
    slot_minutes INTEGER DEFAULT 30,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    hours_json JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);
```

### 3.2. Tabela de Usuários / Barbeiros
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'barber', -- 'owner' | 'barber'
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);
```

### 3.3. Segregação nas Tabelas Existentes
Adicionar a coluna `organization_id UUID NOT NULL REFERENCES organizations(id)` em:
- `services`
- `clients`
- `appointments` (com opção adicional de `barber_id UUID REFERENCES users(id)` para barbearias com múltiplos profissionais)
- `blocked_slots`
- `waitlist`

---

## 4. Roteamento e Identificação do Tenant

1. **Subdomínio ou Rota Dinâmica**:
   - URL do cliente: `https://tyzah.app/[slug]/agendar` ou `https://[slug].tyzah.app/agendar`
   - O Next.js middleware identifica o `slug`, busca o ID da organização e injeta nos cabeçalhos da requisição (`x-tenant-id`).
2. **Contexto de Autenticação**:
   - O JWT gerado inclui `{ role: 'admin', organizationId: 'uuid...', userId: 'uuid...' }`.
   - Cada consulta do Drizzle ORM aplica automaticamente o filtro do `organizationId`.

---

## 5. Roteiro de Implementação Faseada

1. **Fase 1 (Preparação)**: Adicionar as tabelas `organizations` e `users` e criar a organização padrão "Barbearia Ty_Zah" com migração de dados retrocompatível.
2. **Fase 2 (Abstração)**: Migrar leitura de configurações de `config.ts` (variáveis de ambiente) para uma consulta em cache no banco via `organization_id`.
3. **Fase 3 (Subdomínios / Rotas)**: Configurar middleware para resolução dinâmica do tenant.
4. **Fase 4 (Onboarding)**: Criar página de cadastro e checkout para novas barbearias.
