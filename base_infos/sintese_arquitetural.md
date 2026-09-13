# Síntese de Alinhamento Arquitetural — StudyRats

> **Papel:** Arquiteto Líder  
> **Objetivo:** Validar entendimento antes de gerar diagramas e documentação formal  
> **Fontes consultadas:** `implementation_plan.md`, `status.md`, `docs_ref/Prompts_usados/fase0_analise_critica.md`, `docs_ref/PlanejamentoNotion/*`, `projeto2026-SKILLs/mobile-design-doc/SKILL.md`

---

## 1. Proposta Central & Problema

### A Dor
O estudante brasileiro (ensino médio e universitário, faixa etária +16) sofre de dois problemas crônicos e interdependentes:

| Problema | Manifestação |
|---|---|
| **Desmotivação** | Abandono de rotinas de estudo em poucos dias; ausência de incentivo externo contínuo |
| **Falta de organização** | Estudo reativo (só antes de prova), sem plano estruturado; dificuldade de distribuir tempo entre disciplinas |

### A Proposta
**StudyRats** é um app mobile que combina **IA generativa** e **gamificação social leve** para transformar o estudo diário numa experiência:

1. **Estruturada** — O estudante cadastra seus tópicos/disciplinas e recebe material gerado por IA (resumos) para guiar seus estudos.
2. **Registrada** — Toda sessão de estudo é logada, criando histórico e alimentando métricas (XP, streaks).
3. **Socialmente motivadora** — Um ranking global (leaderboard) cria pressão social positiva pela constância, sem a complexidade de um sistema de amizades.

> [!IMPORTANT]
> O valor central não é "ser mais um app de flashcard". É **automatizar a produção de material de revisão** (resumos via IA a partir de tópicos) e **criar accountability social** (ranking) para que o estudante mantenha a constância dia após dia.

---

## 2. Decisões de Escopo do MVP (Limite de ~60h-aula, 2 devs)

### 2.1 O que foi cortado em relação à ideação original

A análise crítica (registrada em [`fase0_analise_critica.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/docs_ref/Prompts_usados/fase0_analise_critica.md)) identificou que o escopo original (3 devs, 4 meses, 6 features de alta complexidade) era inviável. As seguintes decisões de corte foram tomadas e registradas em [`status.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/status.md) e [`implementation_plan.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/implementation_plan.md):

| Item | Status no MVP | Justificativa |
|---|---|---|
| Versão Web | ❌ Removida | Foco 100% mobile (iOS + Android via Expo) |
| Cronograma Inteligente gerado por IA | ❌ Removido/Simplificado | Complexidade alta demais; substituído por cadastro manual de tópicos |
| Geração de Questões (Quiz) via IA | ❌ Removida do MVP | Should Have (P2); complexidade de validação pedagógica |
| Gamificação social complexa (amigos, conexões) | ❌ Removida | Sistema de amizades estouraria o prazo |
| Comunidades/Fóruns | ❌ Removido | P3-Could, fora do MVP |
| Portal B2B | ❌ Removido | P4-Won't |
| Geolocalização | ✅ **Reincluída** | Vinculada a "Registrar Sessão de Estudo" — registra coordenadas do local de estudo |

### 2.2 O que ENTRA no MVP

| Feature | Escopo no MVP |
|---|---|
| **Cadastro & Onboarding** | ✅ Email + senha + nome de exibição (Supabase Auth). Onboarding de 3 telas (disciplinas, meta, tutorial). Sem modo visitante. |
| **Autenticação** | Email + senha via Supabase Auth. Sessão persistida em `expo-secure-store`. |
| **Cadastro de Tópicos** | Estudante cadastra disciplinas e tópicos manualmente (texto livre). Funciona 100% offline. |
| **Geração de Resumos via IA** | Estudante seleciona tópico → IA gera resumo textual. **Exige conexão.** Resumo salvo localmente após geração. **Limite: ~10 gerações/dia** para controle de custos. MVP 100% gratuito. |
| **Registro de Sessões de Estudo** | **Cadastro manual livre** — estudante cria sessões avulsas (disciplina + tópico + duração). **Captura localização** (lat/lng) e **foto da sessão** como evidência. Gera XP. Funciona offline. |
| **Câmera** | `expo-camera` / `expo-image-picker` — foto vinculada à sessão de estudo (evidência visual). Foto armazenada localmente, upload assíncrono via Supabase Storage. |
| **Geolocalização** | `expo-location` (foreground) — captura lat/lng ao registrar sessão. Armazenado localmente, sincronizado com Supabase. |
| **Sistema de Streaks** | 1 sessão concluída = 1 dia ativo. Streak de dias consecutivos com bônus de XP. Calculado localmente. |
| **Ranking Global (Leaderboard)** | `SELECT TOP 50` por XP no Supabase. Exige conexão para consultar. |

### 2.3 Fluxo de IA — Decisão de simplificação

```
Estudante seleciona Tópico cadastrado
        ↓
    [Há conexão?]
     ├── NÃO → Exibe mensagem "Conecte-se para gerar resumo"
     └── SIM → Envia tópico para API de LLM (Gemini Flash / a definir)
                    ↓
              Recebe resumo textual
                    ↓
              Salva resumo localmente (SQLite)
                    ↓
              Resumo disponível offline a partir daqui
```

> [!NOTE]
> A geração de IA é a **única** funcionalidade core que exige conexão ativa no momento da ação. Após gerado, o resumo é persistido localmente e fica disponível offline.

### 2.4 Ranking Social — Decisão de simplificação

Registrada em [`implementation_plan.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/implementation_plan.md):

| Aspecto | Decisão |
|---|---|
| **Modelo** | Leaderboard Global — sem sistema de amizades, sem convites, sem aceitação |
| **Métrica** | XP (pontos de ofensiva/streaks) |
| **Mecanismo** | App calcula XP localmente → sincroniza campo `xp_semanal` da tabela `profiles` no Supabase quando há rede → Tela de Ranking faz `SELECT TOP 50 ORDER BY xp_semanal DESC` |
| **Complexidade de backend** | Zero servidores custom. Tudo via BaaS (Supabase): uma query direta no Postgres com RLS |
| **Período** | ✅ **Semanal com reset** (toda segunda-feira zera o XP do ranking). Mais competitivo, incentiva constância contínua. |

> [!WARNING]
> **Ponto em aberto:** As LACs bloqueantes da fase 0 (LAC-01, 04, 05, 06, 07, 09, 10, 12, 13, 17, 18, 22, 27) ainda constam como "aguardando resposta" no documento [`fase0_analise_critica.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/docs_ref/Prompts_usados/fase0_analise_critica.md). Contudo, o [`status.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/status.md) e o [`implementation_plan.md`](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/implementation_plan.md) já registram decisões tomadas verbalmente para as mais críticas (IA = apenas resumos; Ranking = global simples; Mobile-only). **Recomendo consolidar formalmente essas respostas** antes da Fase 1.

---

## 3. Arquitetura Técnica & Offline-First

### 3.1 Stack de Referência

| Camada | Tecnologia | Observação |
|---|---|---|
| **Framework** | Expo (managed/dev client) + React Native + Expo Router | Mobile-only (iOS + Android) |
| **Persistência local** | SQLite via `expo-sqlite` + **Drizzle ORM** | Schema tipado, migrations automáticas |
| **Backend/BaaS** | **Supabase** (Postgres, Auth, Storage) | Sem servidor custom. BaaS direto do React Native |
| **Autenticação** | Supabase Auth + `expo-secure-store` | Token nunca em AsyncStorage puro |
| **IA/LLM** | API de LLM — **a definir** (preferência por custo zero; abstraída via `AIGateway`) | Chamada direta do app ou via Edge Function. Gateway permite trocar provider sem alterar domínio |
| **Câmera** | `expo-camera` / `expo-image-picker` | Foto de sessão de estudo (evidência). Gateway completo (`CameraGateway`) |
| **Geolocalização** | `expo-location` (foreground) | Captura coordenadas ao registrar sessão. Gateway completo (`LocationGateway`) |
| **Sincronização** | Outbox pattern + `@react-native-community/netinfo` | Fila local (`sync_queue`) processada quando há rede |
| **Testes** | Jest (`jest-expo`) + `@testing-library/react-native` | Mocks de módulos nativos |

### 3.2 Matriz Offline vs. Online

| Funcionalidade | Offline (sem rede) | Online (com rede) | Observação |
|---|---|---|---|
| Cadastrar/editar tópicos | ✅ 100% | ✅ | Fonte da verdade: local até sync |
| Registrar sessão de estudo | ✅ 100% | ✅ | Grava XP, foto (local) e coordenadas localmente |
| Capturar foto da sessão | ✅ 100% | ✅ | Foto salva no filesystem local; upload assíncrono via sync queue |
| Capturar localização da sessão | ✅ 100%* | ✅ | *Requer GPS ativo, não rede. Coordenadas salvas em SQLite |
| Calcular streak | ✅ 100% | ✅ | Lógica puramente local |
| Ler resumos já gerados | ✅ 100% | ✅ | Persistidos em SQLite após geração |
| Ver perfil / configurações | ✅ 100% | ✅ | Cache local |
| **Gerar resumo via IA** | ❌ Bloqueado | ✅ Obrigatório | Requer chamada a API de LLM |
| **Consultar Ranking** | ❌ Bloqueado | ✅ Obrigatório | Requer query no Supabase |
| **Login/Cadastro** | ❌ Bloqueado | ✅ Obrigatório | Requer Supabase Auth |
| Sincronizar dados pendentes | ⏳ Enfileirado | ✅ Automático | Outbox pattern + NetInfo listener |

### 3.3 Sync Queue (Fila de Sincronização)

**Padrão:** Outbox Pattern conforme definido no [SKILL.md](file:///c:/Desenvolvimento/MOBILE_StudyRats/StudyRats/projeto2026-SKILLs/mobile-design-doc/SKILL.md).

```
┌─────────────────────────────────────────────────────┐
│                  FLUXO DE ESCRITA                    │
│                                                      │
│  Usuário cria/edita dado                             │
│        ↓                                             │
│  Salva no SQLite local (status = 'pending')          │
│        ↓                                             │
│  Insere registro na tabela SYNC_QUEUE                │
│        ↓                                             │
│  Feedback imediato ao usuário: "Salvo ✓"             │
│                                                      │
│  ─── assíncrono (background) ────────────────        │
│        ↓                                             │
│  NetInfo detecta conexão disponível?                 │
│  ├── NÃO → Aguarda reconexão (listener ativo)        │
│  └── SIM → Processa fila SYNC_QUEUE:                 │
│              ↓                                       │
│         Envia para Supabase                          │
│         ├── 2xx OK → marca 'synced', remove da fila  │
│         └── Erro → incrementa tentativas,            │
│                     reagenda com backoff exponencial  │
└─────────────────────────────────────────────────────┘
```

| Aspecto | Decisão |
|---|---|
| **Resolução de conflito** | Last-write-wins por `updated_at` (LAC-14 ✅) |
| **Soft delete** | `deleted_at` nullable; nunca deletar fisicamente antes de confirmar sync |
| **IDs** | UUID gerado no cliente (evita colisão ao criar offline) |
| **Tabela `sync_queue`** | Só existe localmente (SQLite). Efêmera — registros apagados após sync confirmado |
| **Upload de mídia** | Assíncrono e separado do sync de dados tabulares. Fotos de sessão: armazenadas localmente (`uri_local`), upload para Supabase Storage quando há rede, URL remota preenchida após confirmação |

---

## 4. Fronteira de Responsabilidades (Clean Architecture)

### 4.1 Princípio Cardinal

> **Camada externa depende da interna, NUNCA o contrário.**  
> `Domain` e `Application` jamais importam `expo-sqlite`, `expo-camera`, `expo-image-picker`, `drizzle-orm` ou `@supabase/supabase-js`.

### 4.2 Mapeamento de Camadas

| Camada | Responsabilidade | O que contém | O que NÃO contém |
|---|---|---|---|
| **Domain** | Regras de negócio puras | Entidades (`Usuario`, `Topico`, `ResumoIA`, `SessaoEstudo`, `FotoSessao`), Value Objects (`StatusSincronizacao`, `Email`, `Coordenada`), **interfaces** de Repository e Gateway | Nenhum import de SDK nativo, ORM ou Supabase |
| **Application** | Orquestração de casos de uso | `CadastrarTopicoUseCase`, `GerarResumoUseCase`, `RegistrarSessaoUseCase`, `SincronizarFilaUseCase` | Nenhum import de SDK nativo, ORM ou Supabase |
| **Adapters (entrada)** | Telas e hooks React | Screens Expo Router, hooks de apresentação (`useTopicos`, `useAuth`) que adaptam use cases ao ciclo de vida React | Lógica de negócio; acesso direto a banco |
| **Adapters (saída)** | Implementações concretas de interfaces | `TopicoRepositorySQLite`, `SessaoRepositorySQLite`, `AuthGatewaySupabase`, `SyncGatewaySupabase`, `AIGatewayLLM`, `CameraGatewayExpo`, `LocationGatewayExpo` | Lógica de negócio |
| **Infra** | Drivers e configuração | Setup `expo-sqlite` + Drizzle, client Supabase, sync engine (loop de fila + NetInfo + retry), schema de migrations | Lógica de negócio; UI |

### 4.3 Isolamento — Interfaces no Domínio, Implementações no Adapter

```
domain/
  gateways/
    AuthGateway.ts        ← interface: login(email, senha): Promise<Usuario>
    SyncGateway.ts        ← interface: enviar(entidade): Promise<void>
    AIGateway.ts          ← interface: gerarResumo(topico): Promise<string>
    CameraGateway.ts      ← interface: capturarFoto(): Promise<FotoSessao>
    LocationGateway.ts    ← interface: obterLocalizacaoAtual(): Promise<Coordenada>
  repositories/
    TopicoRepository.ts   ← interface: salvar(topico), listar(), buscarPorId()
    SessaoRepository.ts   ← interface: registrar(sessao), calcularStreak()

adapters/gateways/
    auth/
      AuthGatewaySupabase.ts    ← implementa AuthGateway usando @supabase/supabase-js
    sync/
      SyncGatewaySupabase.ts    ← implementa SyncGateway usando supabase-js
    ai/
      AIGatewayLLM.ts           ← implementa AIGateway usando API de LLM (fetch/SDK)
    camera/
      CameraGatewayExpo.ts      ← implementa CameraGateway usando expo-camera/expo-image-picker
    location/
      LocationGatewayExpo.ts    ← implementa LocationGateway usando expo-location
```

> [!TIP]
> **Regra prática de checagem:** Se um arquivo dentro de `domain/` ou `application/` tiver `import` de `expo-camera`, `expo-location`, `expo-sqlite`, `drizzle-orm` ou `@supabase/supabase-js` → é uma **violação arquitetural**. A chamada deve ser movida para o adapter correspondente, expondo apenas a interface.

### 4.4 BCE (Boundary-Control-Entity) mapeado para o StudyRats

| Caso de Uso | Boundary (UI) | Boundary (Externo/Gateway) | Control (Use Case) | Entities |
|---|---|---|---|---|
| Cadastrar Tópico | `TopicoFormScreen` | — | `CadastrarTopicoUseCase` | `Topico` |
| Gerar Resumo via IA | `ResumoScreen` | `AIGateway` | `GerarResumoUseCase` | `Topico`, `ResumoIA` |
| Registrar Sessão | `SessaoScreen` | `CameraGateway`, `LocationGateway` | `RegistrarSessaoUseCase` | `SessaoEstudo`, `FotoSessao`, `Coordenada` |
| Fazer Login | `LoginScreen` | `AuthGateway` | `AutenticarUsuarioUseCase` | `Usuario` |
| Consultar Ranking | `RankingScreen` | `SyncGateway` (query Supabase) | `ConsultarRankingUseCase` | `Usuario` (perfil público) |
| Sincronizar Fila | *(background, sem UI direta)* | `SyncGateway` | `SincronizarFilaUseCase` | `Topico`, `SessaoEstudo`, `FotoSessao`, `SyncQueueItem` |

---

## Checklist de Alinhamento

- [x] **Proposta Central:** App mobile que combina IA (resumos) + gamificação social (ranking global) para combater desmotivação e desorganização do estudante
- [x] **Escopo MVP:** IA apenas para resumos; ranking global sem amizades; sem cronograma inteligente por IA; sem quiz; sem web; **com geolocalização e câmera** (vinculadas a sessão de estudo)
- [x] **Stack:** Expo + React Native + SQLite/Drizzle + Supabase (BaaS) + API de LLM
- [x] **Offline-First:** CRUD de tópicos, sessões e streaks 100% offline; IA e ranking exigem rede; sync via outbox pattern
- [x] **Clean Architecture:** Domain e Application puros; interfaces no domínio; SDKs nativos isolados em adapters/infra

> [!NOTE]
> ### Decisões Consolidadas (validadas em 13/Set/2026)
> 1. ✅ **Cadastro:** Email + senha + nome de exibição. Onboarding 3 telas. Sem modo visitante. (LAC-01)
> 2. ✅ **Ranking:** Semanal com reset toda segunda-feira. (LAC-10)
> 3. ✅ **LLM:** A definir — preferência por custo zero. Abstraída via `AIGateway` (trocar provider = trocar 1 adapter). (LAC-07)
> 4. ✅ **Monetização:** MVP 100% gratuito COM limite de ~10 gerações de resumo/dia para controle de custos. (LAC-12)
> 5. ✅ **Sessões de Estudo:** Cadastro manual livre (disciplina + tópico + duração). Sem cronograma inteligente. (LAC-04/09)
> 6. ✅ **Câmera:** Foto vinculada à sessão de estudo como evidência visual. `expo-camera`/`expo-image-picker` + `CameraGateway`. (LAC-17 → mudou de "apenas perfil" para "evidência de sessão")
> 7. ✅ **Geolocalização:** Captura lat/lng ao registrar sessão (onde o estudante estudou). `expo-location` (foreground) + `LocationGateway`. (LAC-18 → reincluída com caso de uso concreto)
>
> ### LACs que ainda precisam formalização escrita
> As decisões acima resolvem as LACs mais críticas. As seguintes LACs da `fase0_analise_critica.md` ainda precisam de resposta formal para completude do registro:
> - **LAC-05** (Input do cronograma) — parcialmente respondida pelo corte do cronograma inteligente
> - **LAC-06** (Escopo IA) — respondida: apenas resumos baseados em tópico
> - **LAC-27** (Quiz) — respondida: cortado do MVP
