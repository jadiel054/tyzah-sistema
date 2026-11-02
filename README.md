# Ty_Zah Sistema — Sistema de Gestão & Agendamento para Barbearia

Sistema completo para operação real de barbearia, desenvolvido em Next.js 15, React 19, Neon PostgreSQL e Drizzle ORM.

## Sumário
- [Recursos Principais](#recursos-principais)
- [Instalação e Configuração](#instalação-e-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Banco e Migrações](#estrutura-do-banco-e-migrações)
- [Executando Testes](#executando-testes)
- [Procedimento de Implantação (Deploy)](#procedimento-de-implantação-deploy)
- [Procedimento de Recuperação de Desastres](#procedimento-de-recuperação-de-desastres)
- [Conformidade LGPD](#conformidade-lgpd)
- [Expansão Multi-Tenant](#expansão-multi-tenant)

---

## Recursos Principais

1. **Agendamento Inteligente**:
   - Geração dinâmica de horários livres com respeito a durações reais dos serviços.
   - Proteção de integridade no servidor: preço e duração obtidos exclusivamente do banco/servidor (resistente a adulterações no navegador).
   - Prevenção de reservas concorrentes simultâneas (double-booking).
   - Bloqueio automático de datas passadas respeitando o fuso horário oficial `America/Sao_Paulo`.
   - Bloqueio de horários ou dias inteiros pelo barbeiro.
   - Cancelamento que libera instantaneamente o horário na grade.

2. **Segurança Reforçada**:
   - Remoção de qualquer fallback inseguro de senhas ou segredos JWT.
   - Comparação segura com hash bcrypt (`ADMIN_PASSWORD_HASH` ou `ADMIN_PASSWORD`).
   - Verificação rigorosa do papel (`role: 'admin'`) no JWT.
   - Limitação distribuída de tentativas de login e requisições públicas (Rate Limiting).
   - Cookies `HttpOnly`, `SameSite: Lax` e `Secure`.

3. **Gestão de Clientes e Fichas**:
   - Atualização e limpeza segura de campos opcionais (sem conversão para `"null"`).
   - Busca em tempo real por nome e telefone.
   - Histórico de serviços e última visita.

4. **WhatsApp e Transparência**:
   - Links diretos com mensagens formatadas para confirmação, avisos de vaga e lembretes.
   - Transparência entre links preparados versus mensagens confirmadas.

---

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+ (recomendado Node 20 ou 22)
- Banco de dados PostgreSQL (ex: Neon DB)

### Passos
```bash
# 1. Clonar repositório
git clone https://github.com/jadiel054/tyzah-sistema.git
cd tyzah-sistema

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Instalar dependências
npm install

# 4. Executar migrações no banco
npm run db:generate

# 5. Iniciar servidor local
npm run dev
```

---

## Variáveis de Ambiente

Configure o arquivo `.env.local`:

```env
# Conexão com o banco de dados PostgreSQL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Segurança e Autenticação Administrativa
# Opção recomendada: Gerar hash bcrypt (ex: npx bcrypt-cli hash "minhaSenhaSegura")
ADMIN_PASSWORD_HASH=$2a$10$...
# Ou senha em texto claro (se não usar hash):
ADMIN_PASSWORD=senha-super-segura-e-longa

# Segredo do Token JWT (mínimo de 32 caracteres)
JWT_SECRET=chave-super-secreta-longa-32-caracteres-minimo

# Dados do Estabelecimento
SHOP_NAME=Barbearia Ty_Zah
SHOP_PHONE=5533998301285
SHOP_ADDRESS=Centro, Braúnas - MG, CEP 35189-000
SHOP_MAPS_URL=https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a+Padre+Jos%C3%A9+Augusto+de+Oliveira,+Centro,+Bra%C3%BAnas+-+MG
SHOP_SLOT_MINUTES=30
SHOP_TIMEZONE=America/Sao_Paulo
NEXT_PUBLIC_APP_URL=https://tyzah-sistema.vercel.app
```

---

## Estrutura do Banco e Migrações

O banco utiliza as seguintes tabelas estruturadas:
- `clients`: Dados do cliente, telefone único, histórico e anotações.
- `services`: Catálogo oficial de serviços, durações e preços.
- `appointments`: Agendamentos com chaves estrangeiras, status e controle de lembretes.
- `blocked_slots`: Bloqueios manuais parciais ou de dias inteiros.
- `waitlist`: Lista de espera com status (`waiting`, `notified`, `booked`, `cancelled`).

### Regras de Migração
- **NUNCA** execute `drizzle-kit push` em banco de produção.
- Sempre gere as migrações versionadas com:
  ```bash
  npm run db:generate
  ```
- Os arquivos SQL gerados residem em `drizzle/` e devem ser revisados antes de aplicados.

---

## Executando Testes

O projeto conta com bateria de testes automatizados com Vitest:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch durante desenvolvimento
npm run test:watch

# Checagem de tipos TypeScript
npx tsc --noEmit

# Testar build de produção
npm run build
```

---

## Procedimento de Implantação (Deploy)

1. Validação pré-deploy:
   ```bash
   npm test
   npx tsc --noEmit
   npm run build
   ```
2. Configurar todas as variáveis de ambiente obrigatórias no painel da Vercel (`DATABASE_URL`, `ADMIN_PASSWORD_HASH` ou `ADMIN_PASSWORD`, `JWT_SECRET`).
3. Aplicar as migrações SQL no banco Neon de produção.
4. Executar deploy na Vercel a partir da branch principal.

---

## Procedimento de Recuperação de Desastres

1. **Falha de Conexão com o Banco**:
   - Verificar status do Neon DB e pooler de conexões.
   - Confirmar se `DATABASE_URL` contém parâmetro `?sslmode=require`.
2. **Bloqueio de Tentativas de Login**:
   - O rate limiter por IP expira automaticamente em 15 minutos. Em caso de necessidade emergencial, reiniciar a instância serverless ou logar a partir de outro endereço IP.
3. **Corrupção ou Erro de Migração**:
   - O Neon PostgreSQL permite restauração point-in-time através do painel de branches do Neon.
   - Restaurar o branch do banco para o timestamp anterior ao incidente.

---

## Conformidade LGPD

Consulte o documento completo em [`LGPD.md`](./LGPD.md) com as diretrizes de tratamento, consentimento e direitos dos titulares conforme a Lei Geral de Proteção de Dados.

---

## Expansão Multi-Tenant

Para detalhes sobre a evolução do sistema para atender múltiplas barbearias e estabelecimentos (SaaS), consulte a proposta arquitetural em [`ARCHITECTURE.md`](./ARCHITECTURE.md).
