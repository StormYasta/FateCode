# FateCode — Plataforma Acadêmica Gamificada de Programação

> **"O Codewars fornece os desafios. O FateCode fornece toda a experiência educacional."**

FateCode é uma plataforma web educacional e gamificada desenvolvida para instituições de ensino superior de tecnologia (como as FATECs). A plataforma combina práticas reais de programação em JavaScript, TypeScript e Python com um ambiente acadêmico completo: hierarquia institucional (Faculdade / Cursos / Turmas), trilhas curriculares com módulos e tópicos, editor Monaco integrado, execução em sandbox isolado, gamificação em 3 níveis (Faculdade, Curso, Turma), comunidade colaborativa com soluções desbloqueáveis pós-resolução e monitoramento de integridade acadêmica.

---

## 🏛️ Arquitetura do Sistema

O projeto é organizado como um **Monorepo moderno (npm workspaces)** em TypeScript:

```text
FateCode/
├── apps/
│   ├── api/             # Backend Fastify + TypeScript + Prisma + JWT + RBAC + OpenAPI
│   ├── web/             # Frontend React (Vite + Tailwind CSS + Monaco Editor + Lucide)
│   └── worker/          # Execution Worker assíncrono conectado ao Redis
│
├── packages/
│   ├── shared/          # DTOs, Enums e Schemas de validação Zod compartilhados
│   └── config/          # Configurações TypeScript e ESLint compartilhadas
│
├── prisma/
│   ├── schema.prisma    # Modelagem relacional completa (Fases 1 a 9)
│   └── seed.ts          # Seed realista com dados da FATEC-SP (19 usuários, trilhas, desafios)
│
├── docker/
│   ├── Dockerfile.api   # Container multi-stage da API Fastify
│   ├── Dockerfile.web   # Container Nginx com SPA React
│   ├── Dockerfile.worker# Container do Worker
│   └── nginx.conf       # Configuração Nginx com suporte a SPA
│
├── docker-compose.yml   # Orquestração local (PostgreSQL 16, Redis 7, API, Web, Worker)
└── package.json         # Workspace root scripts
```

---

## 🚀 Funcionalidades Principais Implementadas

### 1. Autenticação & Hierarquia Acadêmica (Fases 1 e 2)
- **RBAC**: Permissões estritas para `ADMIN`, `PROFESSOR` e `STUDENT`.
- **Estrutura Institucional**: Faculdade (FATEC-SP) $\rightarrow$ Cursos (ADS, GTI) $\rightarrow$ Turmas $\rightarrow$ Matrículas com papéis de Estudante ou Docente.
- **Trilhas Pedagógicas**: Trilhas de Aprendizagem compostas por Módulos e Tópicos Curriculares.
- **Atividades das Turmas**: Atribuição de desafios a turmas com prazos de entrega (`dueDate`).

### 2. Integração Codewars & Cache Redis (Fase 3)
- **`CodewarsService`**: Consulta a API pública do Codewars com **cache de 24h no Redis** (e fallback resiliente).
- **Importador Docente**: Professores podem pesquisar desafios pelo ID ou Slug do Codewars, visualizar o enunciado e transformá-los em exercícios pedagógicos internos com casos de testes personalizados.
- **Segurança**: O frontend **nunca** acessa a API do Codewars diretamente; todos os acessos passam pelo backend.

### 3. Editor Monaco & Resolução no Navegador (Fase 4)
- **Monaco Editor Integrado**: Syntax highlighting, autocompletion, auto-salvamento em `localStorage` e suporte a JavaScript, TypeScript e Python.
- **Split View**: Enunciado formatado, abas de submissões e histórico.
- **Execução & Submissão**:
  - `⚡ Executar Testes`: Executa os testes públicos rápidos.
  - `🚀 Submeter Solução`: Valida testes públicos e ocultos em sandbox seguro isolado.
- **Celebração Gamificada**: Confetes e modal comemorativo com concessão de XP e cálculo de sequência diária (`Streak`).

### 4. Gamificação em 3 Níveis (Fase 6)
- **Rankings Dinâmicos**:
  - 🏆 **Faculdade**: Classificação geral entre todos os alunos da instituição.
  - 💻 **Curso**: Classificação entre estudantes do mesmo curso (ex: ADS).
  - 📚 **Turma**: Classificação interna da turma (ex: ADS - 4º Semestre).
- **Filtros Temporais**: Geral (All Time), Temporada (Championship 2026.2) e Mensal.
- **Pódio Visual Top 3**: Destaque com coroas e medalhas.
- **Conquistas & Streaks**: Desbloqueio automático de badges e extrato de transações de XP auditáveis e imutáveis.

### 5. Comunidade & Soluções Desbloqueáveis (Fase 7)
- **Regra Estrita de Desbloqueio**: As soluções de outros alunos ficam **estritamente bloqueadas** até o estudante submeter sua primeira solução aceita.
- **Discussões**: Aba de comentários e dúvidas em cada desafio com moderação docente.

### 6. Integridade Acadêmica & Histórico de Desenvolvimento (Fase 8)
- **Registro de Eventos**: Captura do ciclo de vida da resolução (sessão iniciada, código alterado, testes executados, submissão).
- **`IntegrityAnalysisService`**: Análise heurística neutra (*"A submissão apresenta indicadores atípicos"*) avaliando:
  - *Paste burst* (inserção de blocos maciços de código em iteração única);
  - *Zero iterações* de teste prévias;
  - *Duração atípica* para a complexidade da atividade.
- **Classificação**: `NORMAL`, `ATENÇÃO` ou `ALTO`.

### 7. Dashboards Especializados (Fase 9)
- **Dashboard do Aluno**: Central com streaks diários, desafio do dia, posição nos rankings e trilhas ativas.
- **Dashboard do Professor (`/teacher/dashboard`)**: Gestão de turmas, acompanhamento de submissões recentes e painel de inspeção detalhada de indicadores de integridade.

---

## 🔑 Credenciais de Acesso de Demonstração (Seed)

| Papel | Nome | E-mail | Senha |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | Administrador FateCode | `admin@fatecode.edu.br` | `Admin@123456` |
| **👨‍🏫 PROFESSOR** | Prof. Carlos Silva (ADS) | `prof.silva@fatecode.edu.br` | `Prof@123456` |
| **👨‍🏫 PROFESSOR** | Profa. Mariana Santos (ADS) | `prof.santos@fatecode.edu.br` | `Prof@123456` |
| **👨‍🏫 PROFESSOR** | Prof. Roberto Oliveira (GTI) | `prof.oliveira@fatecode.edu.br` | `Prof@123456` |
| **🎓 ALUNO** | João Silva | `joao.silva@fatecode.edu.br` | `Student@123456` |
| **🎓 ALUNA** | Maria Souza | `maria.souza@fatecode.edu.br` | `Student@123456` |
| **🎓 ALUNO** | Carlos Eduardo | `carlos.eduardo@fatecode.edu.br` | `Student@123456` |
| *+ 12 Alunos* | *(demais alunos do seed)* | `*@fatecode.edu.br` | `Student@123456` |

*(Na tela de login há botões de 1-clique para preenchimento rápido de todas as credenciais de teste).*

---

## 💻 Como Executar a Aplicação

### Pré-requisitos
- Node.js v20+ ou v22+
- NPM v10+
- Docker (opcional para Postgres/Redis ou deploy completo)

### Execução Local (Frontend + Backend)

```bash
# 1. Iniciar o Frontend React (Vite na porta 5173)
npm run dev:web

# 2. Iniciar a API Fastify Backend (porta 3001)
npm run dev:api

# 3. Iniciar o Worker
npm run dev:worker
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Backend**: [http://localhost:3001](http://localhost:3001)
- **Documentação Swagger/OpenAPI**: [http://localhost:3001/docs](http://localhost:3001/docs)
- **Healthcheck**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

### Execução via Docker Compose (Full Stack)

```bash
docker compose up --build
```

---

## 🧪 Testes Automatizados

Para rodar a suíte completa de testes unitários e de integração:

```bash
npm run test
```
