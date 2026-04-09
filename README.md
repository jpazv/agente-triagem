# Alivia — Agente de Triagem por IA

Sistema web de triagem fisioterapêutica inteligente. Pacientes conversam com **Clara**, uma IA especializada em musculoesquelético (coluna, joelho e quadril), que coleta sintomas, classifica urgência e recomenda o próximo passo clínico. Gestores acessam um dashboard com gráficos, histórico de triagens e gerenciamento de protocolos clínicos.

---

## Funcionalidades

### Landing page
- Hero com CTA direto para triagem por IA
- Seção de especialidades (Coluna, Joelho, Quadril) com profundidade clínica
- Seção "Como Funciona" em 3 passos
- Chat widget flutuante que abre o assistente Clara

### Assistente Clara (IA)
- Conversa em linguagem natural via chat
- Fluxo de triagem estruturado: região afetada → tempo de dor → intensidade (0-10) → sintomas associados
- Classificação de urgência: **ALTA / MÉDIA / BAIXA**
- Suporte a agendamento de consulta dentro da conversa
- RAG com protocolos clínicos: busca full-text em PostgreSQL (`plainto_tsquery` + ILIKE fallback)
- Streaming de resposta via SSE

### Dashboard do gestor
- **Visão Geral**: área chart de triagens por dia (14 dias), pie chart de distribuição de urgência, bar chart de mensagens por sessão
- **Triagens**: tabela com busca, filtro por urgência, badges coloridos
- **Protocolos**: listagem agrupada com preview completo em modal
- **Ingerir Protocolo**: upload de PDF (com chunking automático) ou colar texto diretamente

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Gráficos | Recharts |
| LLM | Groq — Llama 3.3 70B Versatile |
| Banco de dados | Supabase (PostgreSQL) |
| PDF parsing | pdf-parse v2 + pdfjs-dist |

---

## Estrutura

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── dashboard/page.tsx        # Dashboard do gestor
│   └── api/
│       ├── chat/route.ts         # SSE streaming + RAG
│       ├── dashboard/route.ts    # Dados de triagens e stats
│       ├── protocolos/route.ts   # CRUD de protocolos
│       ├── ingest-pdf/route.ts   # Upload e chunking de PDF
│       └── ingest/route.ts       # Ingestão de texto puro
├── lib/
│   ├── anthropic.ts              # Groq client + system prompt da Clara
│   └── supabase.ts               # Supabase service client
supabase_setup.sql                # Schema + função RPC match_protocolos
scripts/
└── seed-protocolos.ts            # Script de seed de protocolos iniciais
```

---

## Configuração

### 1. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
GROQ_API_KEY=sua_chave_groq
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Banco de dados

Execute o arquivo `supabase_setup.sql` no SQL Editor do Supabase. Ele cria:

- Tabela `protocolos` — armazena conteúdo clínico para RAG
- Tabela `conversas` — histórico de mensagens por sessão
- Função RPC `match_protocolos` — busca full-text em português

Após criar a tabela `protocolos`, adicione o campo de timestamp se necessário:

```sql
ALTER TABLE protocolos ADD COLUMN IF NOT EXISTS criado_em timestamp default now();
ALTER TABLE protocolos ALTER COLUMN criado_em SET DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo');
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` (landing) e `http://localhost:3000/dashboard` (painel).

---

## Ingestão de protocolos

PDFs longos são divididos automaticamente em chunks de 6.000 caracteres com overlap de 200 — cada parte é salva separadamente no Supabase. O dashboard agrupa e exibe todas as partes como um único protocolo.

Via dashboard (upload de PDF ou colar texto):
```
/dashboard → aba "Ingerir"
```

Via script de seed:
```bash
npm run seed
```

---

## Como a triagem funciona

1. Paciente abre o chat widget na landing page
2. Clara identifica se há sintoma e inicia o fluxo de triagem
3. Coleta: região → tempo de dor → intensidade (0-10) → dormência/formigamento/febre
4. Busca RAG nos protocolos clínicos para enriquecer o contexto da resposta
5. Emite bloco estruturado com nível de urgência, recomendação e motivo técnico
6. Conversa persiste por `sessao_id` (cookie de sessão)

---

## Licença

Projeto privado — jpazv
