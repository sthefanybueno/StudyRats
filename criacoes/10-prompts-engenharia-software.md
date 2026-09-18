# 10 Prompts de Engenharia de Software — StudyRats (Preenchidos)

> **Projeto:** StudyRats  
> **Equipe:** Maria Clara Miguel, Sthefany Bueno  
> **Disciplina:** Laboratório de Desenvolvimento de Aplicações Mobile — 2026.2  
> **Status:** Todos os prompts preenchidos com dados reais do projeto. Pronto para copiar e colar.

---

## Prompt 01 — Definição da Stack de Referência

```
Aja como um Arquiteto de Software Sênior e Especialista em Tecnologias Mobile.

Seu objetivo é definir e documentar a Stack de Referência completa para o projeto descrito abaixo. A stack deve cobrir todas as camadas — desde o framework de UI até a infraestrutura de backend, persistência, autenticação, recursos nativos, sincronização e testes.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Resumo:** StudyRats é um aplicativo mobile que combina inteligência artificial generativa e gamificação social para transformar o estudo diário de estudantes brasileiros (+16 anos, ensino médio e universitário) em uma experiência estruturada, registrada e socialmente motivadora. O app automatiza a produção de material de revisão (resumos via IA a partir de tópicos cadastrados) e cria accountability social através de um ranking global semanal que recompensa a constância. Opera em 3 pilares: Estruturar (IA gera resumos), Registrar (sessão de estudo com foto + GPS como evidência) e Competir (ranking + streaks + XP).
- **Plataformas-alvo:** iOS e Android (ambas)
- **Workflow Expo:** managed workflow (com possibilidade de dev client para módulos nativos)
- **Grau de offline-first:** 100% offline com sync assíncrono — CRUD de tópicos, disciplinas, sessões, streaks e resumos já gerados funcionam offline. Geração de resumo via IA e consulta ao ranking exigem rede. Login/cadastro exige rede.
- **Recursos nativos obrigatórios:**
  - **Câmera:** `expo-camera` / `expo-image-picker` — foto vinculada à sessão de estudo como evidência visual do material/caderno. Foto armazenada localmente, upload assíncrono via Supabase Storage.
  - **Geolocalização:** `expo-location` (foreground only) — captura lat/lng ao registrar sessão para registrar onde o estudante estudou. Armazenado localmente, sincronizado com Supabase.
  - **Autenticação:** Supabase Auth (email + senha) + `expo-secure-store` para persistência segura de token. Sem modo visitante.
- **Número de desenvolvedores e prazo:** 2 devs (Maria Clara e Sthefany), ~60 horas-aula
- **Orçamento para serviços externos:** Zero — priorizar BaaS gratuitos (Supabase free-tier) e APIs de LLM com free-tier (Gemini Flash ou equivalente). MVP 100% gratuito com limite de ~10 gerações de resumo/dia.

### Restrições e Heurísticas Obrigatórias
1. Siga os princípios de **Clean Architecture**: a stack escolhida NÃO deve forçar acoplamento entre Domain/Application e frameworks/SDKs de infraestrutura. Cada SDK nativo deve ser isolável via interface (Gateway/Port).
2. Priorize ferramentas com **tipagem forte** e **schema tipado** (ex: ORM com geração de tipos, SDK com TypeScript nativo).
3. Para persistência local em app offline-first, justifique a escolha entre SQLite (via `expo-sqlite` + Drizzle ORM) e WatermelonDB considerando o tamanho esperado do dataset e a necessidade de reatividade.
4. Para backend, justifique a escolha entre BaaS (Supabase, Firebase) e backend custom (Node.js/Python). Considere que BaaS elimina a necessidade de servidor custom para MVP.
5. Para autenticação, exija armazenamento seguro de tokens (ex: `expo-secure-store`, nunca `AsyncStorage` puro para credenciais).
6. Documente **alternativas viáveis** para cada camada, não apenas a escolha principal.

### Formato de Saída Exigido

Entregar em Markdown contendo:

1. **Tabela de Stack** com colunas: `Camada | Escolha Principal | Alternativa Viável | Justificativa`
   - Camadas obrigatórias: Framework, Persistência Local, Backend/BaaS, Autenticação, IA/LLM, Câmera, Geolocalização, Sincronização, Testes Unitários, Testes E2E (opcional).

2. **Matriz Offline vs. Online** — tabela listando cada funcionalidade core do app e marcando se funciona offline (✅), exige rede (❌) ou opera de forma enfileirada (⏳):
   - Funcionalidades a cobrir: Cadastrar/editar tópicos e disciplinas, Registrar sessão de estudo, Capturar foto da sessão, Capturar localização, Calcular streak e XP, Ler resumos já gerados, Ver perfil, Gerar resumo via IA, Consultar ranking, Login/Cadastro, Sincronizar dados pendentes.

3. **Diagrama de Componentes de Alto Nível** em Mermaid.js (`flowchart TB` com `subgraph` por camada) mostrando:
   - UI / Expo Router (11 telas: LoginScreen, CadastroScreen, OnboardingScreen, DisciplinaFormScreen, TopicoFormScreen, ResumoScreen, SessaoFormScreen, HistoricoSessoesScreen, StreakXPScreen, RankingScreen, PerfilScreen)
   - Application (Use Cases: AutenticarUsuarioUseCase, CadastrarDisciplinaUseCase, CadastrarTopicoUseCase, GerarResumoUseCase, RegistrarSessaoUseCase, ConsultarRankingUseCase, SincronizarFilaUseCase)
   - Domain (Entities: Usuario, Disciplina, Topico, ResumoIA, SessaoEstudo, FotoSessao + Interfaces/Ports: TopicoRepository, SessaoRepository, DisciplinaRepository, CameraGateway, LocationGateway, AuthGateway, SyncGateway, AIGateway)
   - Adapters (implementações: TopicoRepositorySQLite, SessaoRepositorySQLite, DisciplinaRepositorySQLite, CameraGatewayExpo, LocationGatewayExpo, AuthGatewaySupabase, SyncGatewaySupabase, AIGatewayLLM)
   - Infra/Drivers (expo-sqlite + Drizzle, expo-camera, expo-location, supabase-js, NetInfo, SyncEngine)
   - Setas respeitando a regra de dependência (camada externa → interna, nunca o contrário)

4. **Seção de riscos técnicos** (lista com 3–5 riscos da stack escolhida e mitigação proposta).
```

---

## Prompt 02 — Levantamento de Requisitos Funcionais e Não Funcionais

```
Aja como um Analista de Requisitos Especialista com experiência em aplicações mobile offline-first.

Seu objetivo é produzir o levantamento completo de Requisitos Funcionais (RF) e Não Funcionais (RNF) para o projeto descrito abaixo, seguindo padrões IEEE 830 adaptados para mobile.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Resumo:** App mobile que combina IA generativa (geração de resumos a partir de tópicos) e gamificação social (ranking global semanal + streaks + XP) para combater a procrastinação e falta de rotina de estudantes brasileiros (+16 anos). Opera offline-first com sincronização assíncrona via Supabase.
- **Stack de Referência:**

| Camada | Tecnologia |
|--------|-----------|
| Framework | Expo + React Native + Expo Router |
| Persistência Local | SQLite via `expo-sqlite` + Drizzle ORM |
| Backend/BaaS | Supabase (Postgres, Auth, Storage) |
| IA/LLM | API de LLM (Gemini Flash / a definir, custo zero) via AIGateway |
| Câmera | `expo-camera` / `expo-image-picker` |
| Geolocalização | `expo-location` (foreground) |
| Autenticação | Supabase Auth + `expo-secure-store` |
| Sincronização | Outbox pattern + `@react-native-community/netinfo` |
| Testes | Jest (`jest-expo`) + `@testing-library/react-native` |
| Arquitetura | Clean Architecture (DDD) |

- **Funcionalidades do MVP (11 features):**
  1. Cadastro (email+senha+nome de exibição) + Onboarding 3 telas
  2. Login/Logout com persistência de sessão
  3. CRUD de Disciplinas e Tópicos (100% offline)
  4. Geração de Resumos via IA (~10/dia, exige rede)
  5. Registro de Sessão de Estudo (manual: disciplina + tópico + duração)
  6. Captura de Foto da Sessão (câmera, evidência visual, opcional)
  7. Captura de Localização GPS (auto-captura ao registrar sessão)
  8. Sistema de XP (+10/sessão, +50 bônus a cada streak de 7 dias)
  9. Sistema de Streaks (dias consecutivos com ≥1 sessão)
  10. Ranking Global Semanal (Top 50, reset toda segunda, exige rede)
  11. Sincronização Offline (Outbox Pattern)

- **Funcionalidades ADIADAS (fora do MVP):**
  - Versão Web (foco 100% mobile)
  - Cronograma Inteligente por IA (complexidade inviável para 2 devs/60h)
  - Geração de Questões/Quiz (validação pedagógica complexa)
  - Sistema de Amizades (estouraria o prazo)
  - Sistema de Recompensas/Badges (pós-MVP)
  - Comunidades/Fóruns (escopo v2.0)
  - Feedback Detalhado Premium (depende de massa de dados)
  - Portal B2B para Instituições (fora de escopo acadêmico)

- **Recursos nativos obrigatórios:**
  - Câmera — uso: foto vinculada à sessão de estudo como evidência visual do caderno/material
  - Geolocalização — uso: captura lat/lng ao registrar sessão para registrar onde o estudante estudou
  - Autenticação — uso: Supabase Auth (email+senha), multiusuário com RLS

- **Grau de offline-first:** CRUD de tópicos, disciplinas, sessões, streaks e resumos já gerados = 100% offline. Geração de resumo IA e ranking = exigem rede. Login/cadastro = exige rede. Sync = enfileirado, automático quando há rede.

- **Restrições de prazo/equipe:** 2 devs (Maria Clara e Sthefany), ~60h-aula, MVP 100% gratuito, sem compra in-app.

### Restrições e Heurísticas Obrigatórias
1. **Formato de RF:** `RFxx — O sistema deve [verbo no infinitivo] + [objeto] + [condição/contexto]`. Prioridade: Must (Alta) | Should (Média) | Could (Baixa).
2. **Formato de RNF:** `RNFxx — [Categoria]: [Descrição] + [Critério mensurável]`.
3. **Categorias RNF obrigatórias para mobile** (mesmo que "não se aplica", registrar explicitamente):
   - Offline-first (quais telas/ações funcionam sem rede)
   - Permissões de dispositivo (câmera e localização — solicitadas no momento do uso, nunca no cold start; comportamento se negadas: sessão registrada sem foto/sem coordenadas, com feedback claro)
   - Uso de bateria/dados (GPS foreground only; fotos comprimidas ≤800px largura, qualidade 70%, ≤500KB)
   - Armazenamento local (SQLite ≤100MB; cleanup de dados sincronizados >90 dias)
   - Sincronização/consistência (last-write-wins por `updated_at`; ≤50 registros em ≤30s sob 4G; retry com backoff exponencial)
   - Segurança (token em `expo-secure-store`; RLS `usuario_id = auth.uid()` em todas as tabelas remotas; HTTPS)
   - Compatibilidade (iOS 15+ e Android 10+ / API 29)
   - Usabilidade (indicador visual de sync: pendente 🟡 / sincronizado 🟢 / erro 🔴; feedback imediato "Salvo localmente ✓")
4. Cada RF deve ser **rastreável** — ele será transformado em um Caso de Uso na próxima fase.
5. Não invente requisitos que não estejam alinhados com o escopo do MVP fornecido.

### Formato de Saída Exigido

Entregar em Markdown contendo:

1. **Tabela de Requisitos Funcionais:**

| ID | Descrição | Prioridade | Ator/Origem | Observação |
|----|-----------|-----------|-------------|------------|
| RF01 | ... | Alta | Visitante | ... |

2. **Tabela de Requisitos Não Funcionais:**

| ID | Categoria | Descrição | Critério Mensurável | Prioridade |
|----|-----------|-----------|---------------------|-----------|
| RNF01 | Offline-first | ... | ... | Alta |

3. **Matriz de Rastreabilidade RF → Feature do MVP** (tabela mostrando qual feature do MVP cada RF atende).

4. **Seção de premissas e restrições** — liste explicitamente as premissas assumidas (ex: "assumimos que o usuário terá GPS ativo") e restrições de projeto (ex: "MVP 100% gratuito, sem compra in-app").

Numerar RFs sequencialmente a partir de RF01. Numerar RNFs sequencialmente a partir de RNF01. Não pular numeração.
```

---

## Prompt 03 — Diagrama de Casos de Uso (UML)

```
Aja como um Analista de Sistemas UML Sênior especializado em aplicações mobile offline-first.

Seu objetivo é criar o Diagrama de Casos de Uso completo e as descrições textuais dos casos de uso críticos para o projeto StudyRats.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Resumo:** App mobile offline-first para estudantes brasileiros que combina IA (geração de resumos) + gamificação social (ranking semanal, streaks, XP) + evidência nativa (foto + GPS).

- **Requisitos Funcionais:**

| ID | Descrição | Prioridade | Ator |
|----|-----------|-----------|------|
| RF01 | Cadastro de novo usuário com email, senha e nome de exibição via Supabase Auth | Alta | Visitante |
| RF02 | Fluxo de onboarding de 3 telas após primeiro cadastro | Alta | Estudante |
| RF03 | Login com email e senha, persistindo sessão localmente | Alta | Visitante |
| RF04 | Logout limpando credenciais seguras | Alta | Estudante |
| RF05 | CRUD de disciplinas com nome em texto livre (soft delete) | Alta | Estudante |
| RF06 | CRUD de tópicos vinculados a disciplina (soft delete) | Alta | Estudante |
| RF07 | Geração de resumo textual via IA a partir de tópico selecionado (exige conexão) | Alta | Estudante |
| RF08 | Salvar resumo gerado pela IA localmente em SQLite para consulta offline | Alta | Sistema |
| RF09 | Limitar geração de resumos via IA a no máximo 10/dia/usuário | Média | Sistema |
| RF10 | Consulta de resumos já gerados offline | Alta | Estudante |
| RF11 | Registro de sessão de estudo: disciplina + tópico + duração (minutos) | Alta | Estudante |
| RF12 | Captura de foto via câmera como evidência opcional da sessão | Alta | Estudante |
| RF13 | Captura de coordenadas GPS ao registrar sessão | Alta | Estudante |
| RF14 | Calcular e exibir streak de dias consecutivos com ≥1 sessão | Alta | Estudante |
| RF15 | Calcular XP: +10/sessão, +50 bônus a cada streak de 7 dias | Alta | Sistema |
| RF16 | Ranking global Top 50 por XP semanal (exige conexão) | Média | Estudante |
| RF17 | Resetar XP semanal do ranking toda segunda-feira 00:00 UTC | Média | Sistema |
| RF18 | Perfil do usuário: nome, XP total, streak atual | Média | Estudante |
| RF19 | Funcionar sem conexão enfileirando alterações para sync | Alta | Sistema |
| RF20 | Sincronização automática da fila quando detectar conexão | Alta | Sist. Sync |
| RF21 | Histórico de sessões: data, disciplina, tópico, duração, foto, localização | Média | Estudante |

- **Recursos nativos:** Câmera (foto evidência de sessão), GPS (lat/lng de onde estudou), Autenticação (Supabase Auth email+senha)
- **Grau de offline-first:** CRUD + sessões + streaks + resumos já gerados = offline. IA + ranking + login = online.

### Restrições e Heurísticas Obrigatórias
1. **Atores obrigatórios:**
   - `Visitante` — ator primário humano (não autenticado, apenas cadastro/login)
   - `Estudante` — herda de Visitante (autenticado, acesso completo)
   - `Sistema de Sincronização` — ator de tempo/background que processa a fila offline
   - `Gateway de IA` — sistema externo (API de LLM)
   - `Câmera do Dispositivo` — ator de hardware
   - `GPS do Dispositivo` — ator de hardware
2. **Herança de ator:** `Estudante --|> Visitante`
3. **`<<include>>`:** Comportamento **sempre** necessário (seta tracejada: caso-base → caso incluído):
   - UC06 (Gerar Resumo) includes: Verificar Limite Diário, Salvar Resumo Localmente
   - UC08 (Registrar Sessão) includes: Capturar Localização Atual, Calcular XP, Enfileirar para Sincronização
   - UC14 (Sincronizar Fila) includes: Resolver Conflito de Dados
4. **`<<extend>>`:** Comportamento **opcional** (seta tracejada: caso-extensão → caso-base):
   - Anexar Foto da Sessão extends UC08
5. Todo caso de uso de **escrita** deve considerar o fluxo de sincronização.

### Formato de Saída Exigido

1. **Diagrama de Casos de Uso em Mermaid.js** (`flowchart LR`) com todos os 14 UCs (UC01–UC14), 6 atores, relacionamentos include/extend, e herança de ator.

2. **Notação textual alternativa** listando todos os UCs com include/extend.

3. **Descrição textual detalhada** dos **5 UCs mais críticos** (UC01 Fazer Cadastro, UC06 Gerar Resumo via IA, UC08 Registrar Sessão de Estudo, UC11 Consultar Ranking Global, UC14 Sincronizar Fila Pendente), cada um com:

| Campo | Conteúdo |
|-------|----------|
| **UC** | UCxx — Nome |
| **Ator(es)** | ... |
| **Pré-condição** | ... |
| **Fluxo Principal** | 1. ... 2. ... 3. ... |
| **Fluxo Alternativo — Sem Rede** | (obrigatório para UCs de escrita/IA/ranking) |
| **Fluxo Alternativo — Permissão Negada** | (obrigatório para UC08 — câmera e GPS) |
| **Pós-condição** | ... |

4. **Tabela de rastreabilidade UC → RF**.
```

---

## Prompt 04 — Diagrama de Classes e Persistência

```
Aja como um Arquiteto de Domínio Sênior com expertise em DDD (Domain-Driven Design) e modelagem orientada a objetos.

Seu objetivo é criar o Diagrama de Classes completo do domínio do projeto StudyRats, incluindo marcação de persistência local (SQLite) e remota (Supabase).

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Resumo:** App mobile offline-first para estudantes. IA gera resumos de tópicos. Sessões de estudo registradas com foto (câmera) e localização (GPS). XP + streaks + ranking global semanal.
- **Casos de Uso (14):**
  - UC01 Fazer Cadastro | UC02 Fazer Login | UC03 Completar Onboarding
  - UC04 Gerenciar Disciplinas | UC05 Gerenciar Tópicos | UC06 Gerar Resumo via IA
  - UC07 Consultar Resumos | UC08 Registrar Sessão de Estudo | UC09 Consultar Histórico
  - UC10 Visualizar Streak e XP | UC11 Consultar Ranking Global | UC12 Visualizar Perfil
  - UC13 Fazer Logout | UC14 Sincronizar Fila Pendente
- **Stack de persistência:** SQLite via `expo-sqlite` + Drizzle ORM (local) / Supabase Postgres (remoto)
- **Grau de offline-first:** 100% offline com sync assíncrono. UUID gerado no cliente para todos os IDs.
- **Entidades já identificadas:**
  - `Usuario` (id, email, nome_exibicao, xp_total, xp_semanal, streak_atual)
  - `Disciplina` (id, usuario_id, nome, timestamps, sync_status)
  - `Topico` (id, disciplina_id, nome, timestamps, sync_status)
  - `ResumoIA` (id, topico_id, conteudo, gerado_em, sync_status)
  - `SessaoEstudo` (id, usuario_id, disciplina_id, topico_id, duracao_minutos, latitude, longitude, created_at, sync_status)
  - `FotoSessao` (id, sessao_id, uri_local, url_remota, upload_status)
  - `SyncQueueItem` (id, entidade, operacao, payload_json, tentativas, erro_msg, status, created_at)

### Restrições e Heurísticas Obrigatórias
1. **Extrair classes candidatas** dos substantivos dos casos de uso. Não inventar entidades sem correspondência no domínio.
2. **Princípios DDD obrigatórios:**
   - Aggregates e Aggregate Roots: `SessaoEstudo` é raiz (contém `FotoSessao`); `Disciplina` é raiz (contém `Topico`); `Topico` contém `ResumoIA`
   - Value Objects: `Coordenada` (lat/lng com validação -90/90 e -180/180), `StatusSincronizacao` (enum pending|synced|error), `Email` (validação de formato)
   - Nunca referenciar `FotoSessao` diretamente de fora do agregado `SessaoEstudo`
3. **Atributos de controle de sync** (obrigatórios para Disciplina, Topico, ResumoIA, SessaoEstudo):
   - `id: UUID` (gerado no cliente)
   - `updated_at: DateTime` (last-write-wins)
   - `deleted_at: DateTime?` (soft delete)
   - `sync_status: SyncStatus` (pending | synced | error)
4. **Relações:**
   - `Usuario "1" -- "*" Disciplina : possui`
   - `Disciplina "1" -- "*" Topico : contem`
   - `Topico "1" -- "0..1" ResumoIA : possui`
   - `Usuario "1" -- "*" SessaoEstudo : realiza`
   - `Disciplina "1" -- "*" SessaoEstudo : categoriza`
   - `Topico "1" -- "*" SessaoEstudo : foca`
   - `SessaoEstudo "1" -- "0..1" FotoSessao : evidencia`
5. **SOLID**: classes com responsabilidade única.

### Formato de Saída Exigido

1. **Diagrama de Classes em Mermaid.js** (`classDiagram`) com todas as 7 entidades, visibilidade de atributos, métodos de domínio, e relações com multiplicidade.

2. **Tabela de Persistência:**

| Classe | Local (SQLite) | Remota (Supabase) | Estratégia | Observação |
|--------|---------------|------------------|-----------|-----------|
| Usuario | Sim (cache de sessão) | Sim (`auth.users` + `profiles`) | Fonte da verdade: Supabase Auth; cache local para sessão offline | |
| Disciplina | Sim (`disciplinas`) | Sim (`disciplinas`) | Fonte da verdade: local até sync, depois remota; `updated_at` decide conflito | |
| Topico | Sim (`topicos`) | Sim (`topicos`) | Idem Disciplina | |
| ResumoIA | Sim (`resumos_ia`) | Sim (`resumos_ia`) | Gerado online, salvo localmente após geração | |
| SessaoEstudo | Sim (`sessoes_estudo`) | Sim (`sessoes_estudo`) | Idem Disciplina | |
| FotoSessao | Sim (arquivo local + `fotos_sessao`) | Sim (Supabase Storage + `fotos_sessao`) | Upload de binário assíncrono, separado do sync tabular | |
| SyncQueueItem | Sim (`sync_queue`) | Não | Efêmera, só local, apagada após sync confirmado | |

3. **Tabela de Mapeamento DDD:**

| Aggregate Root | Entidades Internas | Value Objects | Repository (interface) | Gateways |
|----------------|-------------------|---------------|----------------------|----------|
| SessaoEstudo | FotoSessao | Coordenada, StatusSincronizacao | SessaoRepository | CameraGateway, LocationGateway, SyncGateway |
| Disciplina | Topico, ResumoIA | StatusSincronizacao | DisciplinaRepository, TopicoRepository | — |
| Usuario | — | Email | UsuarioRepository (cache local) | AuthGateway |

4. **Glossário de Linguagem Ubíqua:** Estudante, Disciplina, Tópico, Resumo, Sessão de Estudo, Foto de Sessão, Streak, XP, Ranking, Sincronização.
```

---

## Prompt 05 — Modelo Entidade-Relacionamento (Local/Remoto) e Políticas RLS

```
Aja como um Arquiteto de Banco de Dados Sênior especializado em aplicações mobile offline-first com persistência dual (SQLite local + PostgreSQL remoto via Supabase).

Seu objetivo é criar os Diagramas Entidade-Relacionamento (DER) para os dois schemas — local e remoto — e documentar as políticas de Row-Level Security (RLS) do schema remoto para o projeto StudyRats.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Diagrama de Classes (7 entidades):**
  - `Usuario` (id UUID, email, nome_exibicao, xp_total, xp_semanal, streak_atual)
  - `Disciplina` (id UUID, usuario_id FK, nome, created_at, updated_at, deleted_at, sync_status)
  - `Topico` (id UUID, disciplina_id FK, nome, created_at, updated_at, deleted_at, sync_status)
  - `ResumoIA` (id UUID, topico_id FK, conteudo TEXT, gerado_em, sync_status)
  - `SessaoEstudo` (id UUID, usuario_id FK, disciplina_id FK, topico_id FK, duracao_minutos INT, latitude FLOAT nullable, longitude FLOAT nullable, created_at, sync_status)
  - `FotoSessao` (id UUID, sessao_id FK, uri_local, url_remota nullable, upload_status)
  - `SyncQueueItem` (id UUID, entidade, operacao, payload_json, tentativas INT, erro_msg, status, created_at) — **SÓ LOCAL**

- **Persistência:**

| Classe | Local (SQLite)? | Remota (Supabase)? |
|--------|----------------|-------------------|
| Usuario | Sim (cache) | Sim (`profiles` + `auth.users`) |
| Disciplina | Sim | Sim |
| Topico | Sim | Sim |
| ResumoIA | Sim | Sim |
| SessaoEstudo | Sim | Sim |
| FotoSessao | Sim (arquivo + tabela) | Sim (Storage + tabela) |
| SyncQueueItem | Sim | Não |

- **Stack de persistência local:** SQLite via `expo-sqlite` + Drizzle ORM (tipos: text, integer, real)
- **Stack de persistência remota:** Supabase (PostgreSQL — tipos: uuid, text, timestamptz, double precision, int)
- **Estratégia de sync:** Outbox pattern + NetInfo listener
- **Estratégia de conflito:** Last-write-wins por `updated_at`
- **Upload de mídia:** Fotos armazenadas localmente (`uri_local`), upload assíncrono para Supabase Storage, URL remota preenchida após confirmação

### Restrições e Heurísticas Obrigatórias
1. **Dois DERs:**
   - **DER Local (SQLite):** Inclui `SYNC_QUEUE` (efêmera). Tipos SQLite.
   - **DER Remoto (Supabase):** NÃO inclui `SYNC_QUEUE`. Tipos Postgres. Tabela `PROFILES` com FK para `auth.users(id)`. Todas as tabelas filhas têm `profile_id FK` para aplicar RLS.
2. **Regras de conversão:**
   - Composição 1-N → FK no lado "muitos"
   - Value Object → colunas embutidas (não tabela separada)
   - `SyncQueueItem` → só no DER local
3. **Cardinalidades idênticas** nos dois DERs.
4. **Todas as tabelas remotas** com política RLS: `profile_id = auth.uid()` (SELECT, INSERT, UPDATE, DELETE).
5. **Upload de mídia:** No schema local: `uri_local` + `url_remota` (nullable). No schema remoto: `url_remota` (caminho no Storage).

### Formato de Saída Exigido

1. **DER Local (SQLite)** em Mermaid.js `erDiagram` — incluindo `SYNC_QUEUE`, relações entre DISCIPLINAS, TOPICOS, RESUMOS_IA, SESSOES_ESTUDO, FOTOS_SESSAO.

2. **DER Remoto (Supabase)** em Mermaid.js `erDiagram` — incluindo PROFILES (FK para auth.users), DISCIPLINAS, TOPICOS, RESUMOS_IA, SESSOES_ESTUDO, FOTOS_SESSAO — sem SYNC_QUEUE.

3. **Tabela de Políticas RLS:**

| Tabela | Operação | Policy Name | Expressão | Observação |
|--------|----------|-------------|-----------|-----------|
| profiles | ALL | own_profile | `id = auth.uid()` | Usuário só acessa seu próprio perfil |
| disciplinas | ALL | own_disciplinas | `profile_id = auth.uid()` | ... |
| topicos | ALL | own_topicos | `profile_id = auth.uid()` | ... |
| resumos_ia | ALL | own_resumos | `profile_id = auth.uid()` | ... |
| sessoes_estudo | ALL | own_sessoes | `profile_id = auth.uid()` | ... |
| fotos_sessao | ALL | own_fotos | `profile_id = auth.uid()` | ... |

4. **Tabela de Upload de Mídia:**

| Entidade | Campo Local | Campo Remoto | Bucket Supabase | Policy de Storage |
|----------|-----------|-------------|----------------|-----------------|
| FotoSessao | uri_local | url_remota / storage_path | `sessao-fotos` | Usuário só acessa arquivos em `{auth.uid()}/` |

5. **Checklist de consistência** (cardinalidades Local ↔ Remoto ↔ Diagrama de Classes).
```

---

## Prompt 06 — Diagrama de Objetos e Diagramas de Estado

```
Aja como um Modelador UML Sênior especializado em validação de modelos de domínio e máquinas de estado.

Seu objetivo é criar (A) um Diagrama de Objetos que valide as relações do Diagrama de Classes com instâncias concretas, e (B) Diagramas de Estado para todas as entidades com ciclo de vida complexo do projeto StudyRats.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Diagrama de Classes (relações):**
  - `Usuario "1" -- "*" Disciplina` | `Disciplina "1" -- "*" Topico` | `Topico "1" -- "0..1" ResumoIA`
  - `Usuario "1" -- "*" SessaoEstudo` | `Disciplina "1" -- "*" SessaoEstudo` | `Topico "1" -- "*" SessaoEstudo`
  - `SessaoEstudo "1" -- "0..1" FotoSessao`
- **Grau de offline-first:** 100% offline com sync assíncrono
- **Entidades sincronizáveis (possuem `sync_status`):** Disciplina, Topico, ResumoIA, SessaoEstudo
- **Entidade com upload assíncrono:** FotoSessao (possui `upload_status`)
- **Entidades com ciclo de vida de negócio adicional:** Nenhuma identificada (não há entidade com status de negócio como "Aberto→Pago→Enviado"; o único ciclo é o de sincronização)

- **Cenário de validação para o diagrama de objetos:**
  A estudante Clara está offline. Ela tem a disciplina "Matemática" (synced) com o tópico "Derivadas" (synced) que já possui um resumo gerado anteriormente (synced). Ela acabou de criar uma nova disciplina "Física" (pending) e registrou uma sessão de estudo de 60 minutos sobre "Derivadas", com foto e localização GPS. A sessão (pending) tem uma foto (pending, sem url_remota). Há 2 itens na SyncQueue (um para a disciplina Física e outro para a sessão). O XP total da Clara é 120, streak 5 dias.

### Restrições e Heurísticas Obrigatórias

**Diagrama de Objetos:**
1. Usar `classDiagram` com `<<instance>>` (Mermaid não tem diagrama de objetos nativo).
2. Valores realistas do domínio StudyRats (nomes de disciplinas, durações, coordenadas de São Paulo).
3. Validar **estado misto**: parte `synced`, parte `pending`.
4. Validar multiplicidades: Disciplina com Topicos (1-N), SessaoEstudo com FotoSessao (0..1), Topico com ResumoIA (0..1).

**Diagramas de Estado:**
1. **Ciclo de Sincronização** (aplica-se a Disciplina, Topico, ResumoIA, SessaoEstudo):
   `Pendente → Sincronizando → Sincronizado | Erro → retry → Sincronizando`
   Incluir soft delete no ciclo: `Pendente → ExcluidoLocalmente → Sincronizando → [*]`
2. **Ciclo de Upload de Foto** (aplica-se a FotoSessao):
   `Capturada → ComprimindoUpload → Enviando → Enviada/URLAtualizada | ErroUpload → retry`
   Incluir exclusão local antes de upload.
3. Cada estado com transição nomeada: `evento [guarda] / ação`.

### Formato de Saída Exigido

1. **Diagrama de Objetos** em Mermaid.js `classDiagram` com `<<instance>>` — instâncias: Clara, disciplina Matemática (synced), disciplina Física (pending), tópico Derivadas (synced), resumo de Derivadas (synced), sessão de 60min (pending), foto da sessão (pending), 2 SyncQueueItems.

2. **Diagrama de Estados — Ciclo de Sincronização** em `stateDiagram-v2`:
   `[*] → Pendente → Sincronizando → Sincronizado / Erro → retry → Sincronizando`
   `Pendente → ExcluidoLocalmente → Sincronizando → [*]`

3. **Diagrama de Estados — Upload de Foto** em `stateDiagram-v2`:
   `[*] → Capturada → ComprimindoUpload → Enviando → Enviada → URLAtualizada → [*]`
   `Enviando → ErroUpload → ComprimindoUpload`

4. **Tabela de correlação:**

| Entidade | Atributo | Diagrama | Valores |
|----------|---------|----------|---------|
| Disciplina, Topico, ResumoIA, SessaoEstudo | sync_status | Ciclo de Sincronização | pending, synced, error |
| FotoSessao | upload_status | Ciclo de Upload | pending, uploading, synced, error |

5. Registrar: "Avaliado — nenhuma entidade possui ciclo de vida de negócio adicional além do ciclo de sincronização."
```

---

## Prompt 07 — Modelagem Boundary-Control-Entity (BCE)

```
Aja como um Analista de Sistemas Sênior especializado em modelagem Boundary-Control-Entity (BCE) adaptada para aplicações mobile com Clean Architecture.

Seu objetivo é reclassificar as classes do Diagrama de Classes nos 3 estereótipos de análise (Boundary, Control, Entity) e produzir a tabela de mapeamento por caso de uso, além de diagramas de robustez para os casos de uso críticos do projeto StudyRats.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats

- **Entidades do Diagrama de Classes:** Usuario, Disciplina, Topico, ResumoIA, SessaoEstudo, FotoSessao, SyncQueueItem

- **Casos de Uso (14):**
  UC01 Fazer Cadastro | UC02 Fazer Login | UC03 Completar Onboarding | UC04 Gerenciar Disciplinas | UC05 Gerenciar Tópicos | UC06 Gerar Resumo via IA | UC07 Consultar Resumos | UC08 Registrar Sessão de Estudo | UC09 Consultar Histórico de Sessões | UC10 Visualizar Streak e XP | UC11 Consultar Ranking Global | UC12 Visualizar Perfil | UC13 Fazer Logout | UC14 Sincronizar Fila Pendente

- **Stack de UI:** Expo Router com telas React Native

- **Telas identificadas (11):** LoginScreen, CadastroScreen, OnboardingScreen, DisciplinaFormScreen, TopicoFormScreen, ResumoScreen, SessaoFormScreen, HistoricoSessoesScreen, StreakXPScreen, RankingScreen, PerfilScreen

- **Recursos nativos:** expo-camera / expo-image-picker (CameraGateway), expo-location (LocationGateway), Supabase Auth (AuthGateway)
- **BaaS:** Supabase (SyncGateway para dados + StorageGateway para fotos)
- **IA:** API de LLM abstrata (AIGateway)

- **Use Cases identificados (7):** AutenticarUsuarioUseCase, CadastrarDisciplinaUseCase, CadastrarTopicoUseCase, GerarResumoUseCase, RegistrarSessaoUseCase, ConsultarRankingUseCase, SincronizarFilaUseCase

### Restrições e Heurísticas Obrigatórias

1. **Boundary (UI):** 1 por tela → `LoginScreen`, `CadastroScreen`, `OnboardingScreen`, `DisciplinaFormScreen`, `TopicoFormScreen`, `ResumoScreen`, `SessaoFormScreen`, `HistoricoSessoesScreen`, `StreakXPScreen`, `RankingScreen`, `PerfilScreen`
2. **Boundary (Nativo/Externo):** `CameraGateway`, `LocationGateway`, `AuthGateway`, `SyncGateway`, `AIGateway`
3. **Control:** `AutenticarUsuarioUseCase`, `CadastrarDisciplinaUseCase`, `CadastrarTopicoUseCase`, `GerarResumoUseCase`, `RegistrarSessaoUseCase`, `ConsultarRankingUseCase`, `SincronizarFilaUseCase`
4. **Entity:** `Usuario`, `Disciplina`, `Topico`, `ResumoIA`, `SessaoEstudo`, `FotoSessao`, `SyncQueueItem`
5. Boundary NUNCA acessa Entity diretamente — sempre via Control.
6. Control NUNCA importa SDK nativo — só interfaces de Gateway.

### Formato de Saída Exigido

1. **Tabela de Mapeamento BCE por Caso de Uso** (todos os 14 UCs):

| Caso de Uso | Boundary (UI) | Boundary (nativo/externo) | Control | Entities |
|-------------|--------------|--------------------------|---------|---------|

2. **Diagrama de Robustez em Mermaid.js** (`flowchart LR`) para 3 UCs críticos:
   - UC08 Registrar Sessão (com CameraGateway, LocationGateway, SessaoRepository, SyncQueue)
   - UC06 Gerar Resumo via IA (com AIGateway, ResumoRepository)
   - UC14 Sincronizar Fila Pendente (com SyncGateway, repositórios múltiplos)

3. **Lista organizada por estereótipo.**

4. **Tabela de transição BCE → Clean Architecture:**

| Estereótipo | Camada | Diretório |
|-------------|--------|----------|
| Boundary (UI) | adapters/screens | `src/adapters/screens/` |
| Boundary (Gateway) | adapters/gateways + domain/gateways (interface) | `src/adapters/gateways/` + `src/domain/gateways/` |
| Control | application/use-cases | `src/application/use-cases/` |
| Entity | domain/entities | `src/domain/entities/` |
```

---

## Prompt 08 — Diagramas de Sequência para os Principais Fluxos

```
Aja como um Arquiteto de Software Sênior especializado em modelagem de interações e fluxos de sistemas offline-first.

Seu objetivo é criar Diagramas de Sequência detalhados para os 3 principais fluxos do StudyRats.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats

- **Tabela BCE (mapeamento dos 3 fluxos):**

| UC | Boundary (UI) | Boundary (externo) | Control | Entities |
|----|---------------|-------------------|---------|---------|
| UC08 Registrar Sessão | SessaoFormScreen | CameraGateway, LocationGateway | RegistrarSessaoUseCase | SessaoEstudo, FotoSessao |
| UC06 Gerar Resumo IA | ResumoScreen | AIGateway | GerarResumoUseCase | Topico, ResumoIA |
| UC14 Sincronizar Fila | *(background)* | SyncGateway, StorageGateway | SincronizarFilaUseCase | Disciplina, Topico, SessaoEstudo, FotoSessao, SyncQueueItem |

- **Fluxos a modelar:**

**Fluxo 1 — UC08 Registrar Sessão de Estudo:**
1. Estudante preenche formulário (disciplina, tópico, duração)
2. Sistema solicita GPS → `alt` permissão concedida / negada (null)
3. `opt` Estudante anexa foto → `alt` permissão câmera concedida / negada (null)
4. Control cria entidade SessaoEstudo com UUID, sync_status=pending
5. Calcula XP (+10, verifica streak 7d → +50 bônus)
6. Salva em SQLite via SessaoRepository
7. Enfileira na SyncQueue
8. Feedback: "Sessão registrada ✓ +10 XP"
9. `par` assíncrono: SyncQueue → SyncGateway (Supabase) → `alt` 200 OK / erro com retry backoff

**Fluxo 2 — UC06 Gerar Resumo via IA:**
1. Estudante seleciona tópico + "Gerar Resumo"
2. Control verifica limite diário (≥10 → erro)
3. Control verifica conexão (sem rede → erro)
4. Control envia tópico para AIGateway → recebe resumo
5. Salva em SQLite via ResumoRepository
6. Exibe resumo ao estudante

**Fluxo 3 — UC14 Sincronizar Fila Pendente:**
1. NetInfo detecta conexão → aciona SyncEngine
2. SyncEngine consulta sync_queue (ORDER BY created_at)
3. `loop` para cada item: enviar para Supabase
4. `alt` 2xx OK → marcar synced → remover da fila | 409 Conflito → comparar updated_at (last-write-wins) | 5xx → incrementar tentativas → backoff
5. Após dados: processar fotos pendentes → comprimir → upload Supabase Storage → atualizar url_remota

- **Arquitetura de Sync:** Outbox pattern — sync_queue local → processamento assíncrono → envio para Supabase. Retry com backoff exponencial (2^n segundos, max 5min). Max 5 tentativas antes de marcar como error.

### Restrições e Heurísticas Obrigatórias
1. Todo diagrama de escrita mostra (1) gravação local imediata + (2) sync remota assíncrona em `par`.
2. Usar: `actor`, `participant`, `->>` / `-->>`, `alt`/`else`, `par`, `opt`, `loop`.
3. Nomes de participantes = nomes da tabela BCE.
4. Sem erros de sintaxe Mermaid — todo `alt`/`par`/`opt`/`loop` fechado com `end`.

### Formato de Saída Exigido

3 diagramas em blocos `sequenceDiagram` Mermaid.js, um por fluxo, seguidos de tabela de rastreabilidade:

| Diagrama | UC | RFs cobertos | Fluxos modelados |
|----------|-----|-------------|-----------------|
| Fluxo 1 | UC08 | RF11,RF12,RF13,RF14,RF15,RF19 | Principal + Permissão negada + Offline |
| Fluxo 2 | UC06 | RF07,RF08,RF09,RF10 | Principal + Limite atingido + Sem rede |
| Fluxo 3 | UC14 | RF19,RF20 | Loop de processamento + Conflito + Retry + Upload de fotos |
```

---

## Prompt 09 — Diagrama de Atividades

```
Aja como um Analista de Processos Sênior com expertise em modelagem de fluxos de atividades UML para aplicações mobile.

Seu objetivo é criar Diagramas de Atividades para os 2 processos mais complexos do StudyRats, modelando explicitamente as decisões de conectividade e permissões de dispositivo.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats

- **Processos complexos a modelar:**

**Atividade 1 — UC08 Registrar Sessão de Estudo (decisões de permissão + conectividade):**
- Raias: Raia Estudante (preenche formulário, opta por foto) | Raia Sistema (solicita permissão, captura GPS/foto, salva, sincroniza)
- Decisões:
  1. "Permissão de localização concedida?" → Sim: captura GPS | Não: solicita permissão → "Concedida agora?" → Sim: captura | Não: prossegue sem coordenadas (null)
  2. "Estudante quer anexar foto?" → Sim: verifica permissão câmera (mesmo padrão) | Não: prossegue
  3. Após salvar + enfileirar + feedback: "Há conexão?" → Sim: enviar para Supabase → "Confirmado?" → Sim: marcar synced | Não: retry backoff | Não: aguardar reconexão (NetInfo listener)

**Atividade 2 — Processo de Sincronização Ponta-a-Ponta (Sync Engine):**
- Raias: Raia SyncEngine (processa fila) | Raia Supabase (recebe e confirma)
- Fluxo:
  1. NetInfo detecta conexão → consulta sync_queue ORDER BY created_at
  2. "Fila vazia?" → Sim: fim | Não: pegar próximo item
  3. Enviar para Supabase → "Resposta?" → 2xx OK: marcar synced, remover da fila | 409 Conflito: comparar updated_at, aplicar last-write-wins | 5xx/Timeout: incrementar tentativas → "tentativas > 5?" → Sim: marcar error | Não: reagendar backoff
  4. Loop volta para "Fila vazia?"
  5. Após dados: fotos pendentes → comprimir (800px, 70%) → upload Storage → "Upload OK?" → Sim: atualizar url_remota | Não: reagendar

- **Recursos nativos:** Câmera (expo-camera), GPS (expo-location foreground), Autenticação (Supabase Auth)
- **Permissões:** Solicitadas no momento do uso. Se negadas: sessão registrada sem foto/sem coordenadas.

### Restrições e Heurísticas Obrigatórias
1. Modelar explicitamente: decisão de **conectividade** e decisão de **permissão de dispositivo**.
2. Usar `flowchart TD` (top-down) do Mermaid.
3. Descrever raias (swimlanes) em texto antes do diagrama.
4. Não criar diagramas para fluxos triviais — focar nos processos com ramificações reais.

### Formato de Saída Exigido

2 diagramas em `flowchart TD` Mermaid.js, com raias descritas, seguidos de tabela de rastreabilidade:

| Diagrama | UC | Decisões modeladas |
|----------|-----|-------------------|
| Atividade 1 | UC08 | Permissão GPS, Permissão Câmera, Conectividade, Confirmação sync |
| Atividade 2 | UC14 | Fila vazia, Resposta servidor (2xx/409/5xx), Max tentativas, Upload OK |

Garantir correspondência com os diagramas de sequência do Prompt 08.
```

---

## Prompt 10 — Documentação de Arquitetura (DDD + Clean Architecture + TDD) e Cronograma

```
Aja como um Arquiteto de Software Principal (Principal Architect) com 15+ anos de experiência em DDD, Clean Architecture e TDD, especializado em aplicações mobile offline-first.

Seu objetivo é produzir a documentação final de arquitetura de implementação do StudyRats, incluindo: mapeamento DDD completo, estrutura de diretórios Clean Architecture, plano de testes TDD por camada, e cronograma de sprints.

### Contexto do Projeto
- **Nome do Projeto:** StudyRats
- **Resumo:** App mobile offline-first (Expo + React Native) para estudantes brasileiros. IA gera resumos de tópicos. Sessões de estudo registradas com foto (câmera) + localização (GPS). XP + streaks + ranking global semanal via Supabase. Clean Architecture com DDD.
- **Stack:**

| Camada | Tecnologia |
|--------|-----------|
| Framework | Expo + React Native + Expo Router |
| Persistência Local | SQLite via `expo-sqlite` + Drizzle ORM |
| Backend/BaaS | Supabase (Postgres, Auth, Storage) |
| IA/LLM | API de LLM (Gemini Flash / a definir) via AIGateway |
| Câmera | `expo-camera` / `expo-image-picker` via CameraGateway |
| Geolocalização | `expo-location` (foreground) via LocationGateway |
| Autenticação | Supabase Auth + `expo-secure-store` via AuthGateway |
| Sincronização | Outbox pattern + NetInfo via SyncGateway |
| Testes | Jest (`jest-expo`) + `@testing-library/react-native` |

- **Diagrama de Classes (7 entidades):** Usuario, Disciplina, Topico, ResumoIA, SessaoEstudo, FotoSessao, SyncQueueItem
- **Value Objects:** Coordenada (lat/lng), StatusSincronizacao (enum), Email
- **Aggregates:** SessaoEstudo (raiz) → FotoSessao; Disciplina (raiz) → Topico → ResumoIA; Usuario (raiz)
- **Repositories (interfaces):** SessaoRepository, DisciplinaRepository, TopicoRepository, UsuarioRepository
- **Gateways (interfaces):** CameraGateway, LocationGateway, AuthGateway, SyncGateway, AIGateway

- **Tabela BCE (7 Use Cases):**

| Control | Entities | Gateways |
|---------|---------|----------|
| AutenticarUsuarioUseCase | Usuario | AuthGateway |
| CadastrarDisciplinaUseCase | Disciplina | — |
| CadastrarTopicoUseCase | Topico | — |
| GerarResumoUseCase | Topico, ResumoIA | AIGateway |
| RegistrarSessaoUseCase | SessaoEstudo, FotoSessao | CameraGateway, LocationGateway |
| ConsultarRankingUseCase | Usuario | SyncGateway |
| SincronizarFilaUseCase | Disciplina, Topico, SessaoEstudo, FotoSessao, SyncQueueItem | SyncGateway |

- **Telas (11):** LoginScreen, CadastroScreen, OnboardingScreen, DisciplinaFormScreen, TopicoFormScreen, ResumoScreen, SessaoFormScreen, HistoricoSessoesScreen, StreakXPScreen, RankingScreen, PerfilScreen

- **Adapters (8):** TopicoRepositorySQLite, SessaoRepositorySQLite, DisciplinaRepositorySQLite, CameraGatewayExpo, LocationGatewayExpo, AuthGatewaySupabase, SyncGatewaySupabase, AIGatewayLLM

- **Número de desenvolvedores:** 2 (Maria Clara e Sthefany)
- **Prazo total:** ~60 horas-aula (≈10 semanas de 6h cada)
- **Duração de cada sprint:** 1 semana (~6h de trabalho)

### Restrições e Heurísticas Obrigatórias

**DDD:**
1. Entidade = objeto puro, SEM import de SDK nativo, ORM ou Supabase.
2. Value Object = imutável, comparado por valor, validação interna. `Coordenada(-100, 200)` deve lançar erro.
3. 1 Repository por Aggregate Root: `SessaoRepository` (SessaoEstudo + FotoSessao), `DisciplinaRepository` (Disciplina), `TopicoRepository` (Topico + ResumoIA), `UsuarioRepository` (Usuario cache).
4. Gateway = interface no domínio, implementação no adapter.
5. Domain Service: `SincronizacaoService` (resolve conflito `updated_at` entre agregados).
6. Proibido: `Manager`, `Helper`, `Processor` genéricos.

**Clean Architecture:**
1. `domain/` e `application/` NUNCA importam `expo-camera`, `expo-location`, `expo-sqlite`, `drizzle-orm`, `@supabase/supabase-js`.
2. Interfaces (ports) em `domain/`. Implementações em `adapters/`.
3. Hooks React (`useXxx`) em `adapters/` ou `presentation/`.

**TDD (pirâmide):**
1. Domínio (muitos): `Coordenada(-100,200)` lança erro; `SessaoEstudo.calcularXP()` retorna 10; streak 7d retorna +50 bônus.
2. Use Case (muitos): `RegistrarSessaoUseCase` com fakes in-memory. Cobre: caminho feliz, permissão negada, GPS indisponível.
3. Gateway/Adapter (médios): `LocationGatewayExpo` com `jest.mock('expo-location')`. Confirma tradução correta da API nativa.
4. Repository (médios): `SessaoRepositorySQLite` contra SQLite real (in-memory). Cobre mapeamento ORM, soft delete.
5. Sync Engine (médios): Fila → SyncGateway mockado. Cobre retry, backoff, conflito.
6. Componente/Tela (poucos): `SessaoFormScreen` com use case fake. Cobre interação + estados loading/erro.
7. E2E (pouquíssimos, opcional): Login → registrar sessão offline → reconectar → confirmar sync.

**Cronograma:**
- Sprint 0: Setup (Expo + Supabase + Drizzle + CI + lint)
- Sprint 1: Domínio (entidades + VOs + interfaces)
- Sprint 2: Use Cases (application layer)
- Sprint 3: Infra (SQLite schema + Drizzle + Supabase client)
- Sprint 4: Adapters — Auth + Repositories
- Sprint 5: Adapters — Gateways nativos (câmera, GPS) + AIGateway
- Sprint 6: Sync Engine (outbox + NetInfo + retry)
- Sprint 7: UI — Auth + Onboarding + CRUD disciplinas/tópicos
- Sprint 8: UI — Sessão + Resumo + Histórico
- Sprint 9: UI — Ranking + Streak + Perfil + Polish
- Sprint 10: Integração, testes finais, documentação

### Formato de Saída Exigido

1. **Mapeamento DDD completo** (tabela com Aggregate Root, Entidades Internas, Value Objects, Repository, Gateways, Domain Services).

2. **Estrutura de diretórios Clean Architecture:**

```
src/
  domain/
    entities/          ← Usuario.ts, Disciplina.ts, Topico.ts, ResumoIA.ts, SessaoEstudo.ts, FotoSessao.ts
    value-objects/     ← Coordenada.ts, StatusSincronizacao.ts, Email.ts
    repositories/      ← SessaoRepository.ts, DisciplinaRepository.ts, TopicoRepository.ts, UsuarioRepository.ts (interfaces)
    gateways/          ← CameraGateway.ts, LocationGateway.ts, AuthGateway.ts, SyncGateway.ts, AIGateway.ts (interfaces)
    services/          ← SincronizacaoService.ts (interface)
  application/
    use-cases/         ← AutenticarUsuarioUseCase.ts, CadastrarDisciplinaUseCase.ts, CadastrarTopicoUseCase.ts, GerarResumoUseCase.ts, RegistrarSessaoUseCase.ts, ConsultarRankingUseCase.ts, SincronizarFilaUseCase.ts
  adapters/
    screens/           ← 11 telas Expo Router
    repositories/      ← TopicoRepositorySQLite.ts, SessaoRepositorySQLite.ts, DisciplinaRepositorySQLite.ts
    gateways/
      camera/          ← CameraGatewayExpo.ts
      location/        ← LocationGatewayExpo.ts
      auth/            ← AuthGatewaySupabase.ts
      sync/            ← SyncGatewaySupabase.ts
      ai/              ← AIGatewayLLM.ts
  infra/
    db/
      schema.ts        ← schema Drizzle (tabelas SQLite)
      client.ts        ← setup expo-sqlite + Drizzle
      migrations/
    supabase/
      client.ts        ← setup supabase-js
    sync/
      sync-engine.ts   ← loop de processamento sync_queue + NetInfo + retry/backoff
```

3. **Plano de Testes TDD** (tabela por camada).

4. **Cronograma de Sprints** (tabela: Sprint | Duração | Objetivo | Entregáveis | Critério de Aceitação | Horas estimadas) — 10 sprints de ~6h cada.

5. **Diagrama de Gantt em Mermaid.js** (`gantt`).

6. **Checklist de rastreabilidade final:**
- [ ] Cada RF tem ≥1 teste de aceitação
- [ ] Cada UC aparece na tabela BCE e no diagrama de sequência
- [ ] Cada entity sincronizável tem diagrama de estados
- [ ] Cada gateway tem interface no domínio e implementação no adapter
- [ ] Nenhum arquivo em `domain/` ou `application/` importa SDK externo
- [ ] Cada sprint tem critério de aceitação claro
```

---

> **Instruções de uso:**  
> Cada prompt está 100% preenchido com os dados do **StudyRats**. Basta copiar o prompt desejado e colar diretamente na IA.  
> Os prompts são **encadeados** — a saída de cada um complementa e valida o próximo.  
> **Ordem recomendada:** 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10