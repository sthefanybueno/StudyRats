# StudyRats — Proposta de Produto

> **Versão:** 1.0  
> **Data:** 13 de Setembro de 2026  
> **Equipe:** Maria Clara Miguel, Sthefany Bueno  
> **Disciplina:** Laboratório de Desenvolvimento de Aplicações Mobile — 2026.2  
> **Professor:** Lázaro Eduardo da Silva

---

## 1. Visão do Produto & Missão

### Pitch

> **Para** estudantes universitários e de ensino médio brasileiros (+16 anos)  
> **que** sofrem com procrastinação, falta de rotina e ausência de incentivo externo para estudar,  
> **o StudyRats é** um aplicativo mobile que combina inteligência artificial generativa e gamificação social  
> **que** transforma o estudo diário em uma experiência estruturada, registrada e socialmente motivadora.  
> **Diferente de** apps de flashcard ou timer genéricos,  
> **nosso produto** automatiza a produção de material de revisão personalizado (resumos via IA) e cria accountability social através de um ranking global semanal que recompensa a constância.

### Missão

Combater a desmotivação e a desorganização do estudante brasileiro, tornando o ato de estudar uma atividade com feedback imediato, progresso visível e reconhecimento social.

### Valores-Chave

| Valor | Manifestação no App |
|---|---|
| **Simplicidade** | Cadastro em segundos, geração de resumo em 1 toque, registro de sessão em 3 campos |
| **Constância > Intensidade** | Sistema de streaks que premia quem estuda todos os dias, não quem estuda 12h de véspera |
| **Autonomia offline** | Tudo funciona sem internet, exceto geração de IA e consulta ao ranking |
| **Evidência verificável** | Foto + localização tornam a sessão de estudo um registro concreto e auditável |

---

## 2. Público-Alvo & Dores Mapeadas

### Perfil do Usuário

| Atributo | Descrição |
|---|---|
| **Faixa etária** | +16 anos |
| **Perfil** | Estudantes de ensino médio e universitários, primariamente de instituições como CEFET e similares |
| **Contexto** | Estudante brasileiro com acesso a smartphone, conectividade intermitente, rotina desorganizada |
| **Motivação** | Precisa de ajuda para criar e manter rotina de estudos; responde bem a incentivos sociais |

### Dores Mapeadas

| # | Dor | Descrição | Como o StudyRats resolve |
|---|---|---|---|
| D1 | **Procrastinação crônica** | O estudante sabe que precisa estudar mas adia indefinidamente por falta de estrutura e incentivo | Streaks e ranking global criam urgência diária ("não quero perder minha sequência / posição") |
| D2 | **Falta de rotina** | Estudo acontece de forma reativa (véspera de prova), sem distribuição ao longo da semana | Registro de sessões com XP transforma estudo em hábito metrificado e visível |
| D3 | **Dificuldade em produzir material de revisão** | Estudante não sabe resumir ou perde tempo criando resumos de baixa qualidade | IA gera resumos a partir do tópico cadastrado, automatizando a produção de material de estudo |
| D4 | **Ausência de incentivo externo** | Estudar sozinho é isolado e desmotivador; não há "recompensa" visível pelo esforço diário | Ranking semanal global e sistema de XP/streaks criam competição saudável e reconhecimento |
| D5 | **Estudo sem registro** | Estudante não tem histórico do que, onde e quando estudou | Sessões registradas com foto + GPS criam evidência concreta e histórico consultável |

---

## 3. Proposta de Valor & Mecânica Central

O StudyRats opera em **três pilares** que se retroalimentam:

```
┌──────────────────────────────────────────────────────────────┐
│                    CICLO DO STUDYRATS                         │
│                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌──────────────┐  │
│   │  ESTRUTURAR │ ──► │  REGISTRAR  │ ──► │   COMPETIR   │  │
│   │  (IA gera   │     │  (Sessão +  │     │  (Ranking +  │  │
│   │   resumos)  │     │  foto + GPS)│     │   streaks)   │  │
│   └──────┬──────┘     └──────┬──────┘     └──────┬───────┘  │
│          │                   │                   │           │
│          └───────────────────┴───────────────────┘           │
│                    ▲ Retroalimentação ▲                       │
│           Mais estudo → Mais XP → Melhor ranking             │
│           Melhor ranking → Mais motivação → Mais estudo      │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Pilar 1 — Geração de Resumos Inteligentes via IA

| Aspecto | Detalhe |
|---|---|
| **Input** | Estudante seleciona tópico previamente cadastrado (texto livre, vinculado a disciplina) |
| **Processamento** | Tópico é enviado à API de LLM (provider a definir, preferência por custo zero) |
| **Output** | Resumo textual gerado pela IA, salvo localmente em SQLite |
| **Limite** | ~10 gerações por dia (controle de custo no MVP gratuito) |
| **Requisito de rede** | ⚠️ Geração exige conexão. Resumo fica disponível offline após gerado |
| **Abstração** | LLM abstraída via `AIGateway` — trocar de provider = trocar 1 arquivo adapter |

### 3.2 Pilar 2 — Gamificação & Consistência

#### Sistema de XP

| Ação | XP |
|---|---|
| Sessão de estudo concluída | +10 XP |
| Streak de 7 dias consecutivos | +50 XP (bônus) |

#### Sistema de Streaks

- **Critério:** 1 sessão concluída = 1 dia ativo
- **Streak:** Contagem de dias consecutivos com pelo menos 1 sessão
- **Cálculo:** 100% local (funciona offline)
- **Visibilidade:** Exibido no perfil e na tela principal

#### Ranking Global (Leaderboard)

| Aspecto | Detalhe |
|---|---|
| **Modelo** | Leaderboard global — sem sistema de amizades |
| **Métrica** | XP semanal |
| **Exibição** | Top 50 estudantes, ordenados por `xp_semanal DESC` |
| **Reset** | Toda segunda-feira (zera XP semanal) |
| **Mecanismo** | App calcula XP localmente → sincroniza com Supabase → Tela de Ranking consulta direto no Postgres |
| **Identificação** | Nome de exibição (não nome real) |
| **Requisito de rede** | ⚠️ Consulta ao ranking exige conexão |

### 3.3 Pilar 3 — Registro de Sessão com Evidência Nativa

Ao registrar uma sessão de estudo, o estudante fornece:

| Campo | Tipo | Obrigatório | Funciona Offline |
|---|---|---|---|
| Disciplina | Seleção (das cadastradas) | ✅ Sim | ✅ |
| Tópico | Seleção (dos cadastrados) | ✅ Sim | ✅ |
| Duração | Número (minutos) | ✅ Sim | ✅ |
| **Foto do material/caderno** | Imagem via câmera | ❌ Opcional | ✅ (salva localmente, upload assíncrono) |
| **Coordenadas de foco (GPS)** | Lat/Lng via GPS | ✅ Auto-captura | ✅ (requer GPS ativo, não rede) |

**Fluxo de permissões:**
- Câmera e localização são solicitadas **no momento do uso** (nunca no cold start)
- Se permissão negada: sessão é registrada normalmente, sem foto e/ou sem coordenadas
- Feedback claro ao usuário sobre o motivo da ausência dos dados

---

## 4. Matriz de Escopo do MVP (60h-aula, 2 devs)

### ✅ O que ENTRA no MVP

| # | Feature | Complexidade | Justificativa |
|---|---|---|---|
| 1 | Cadastro (email+senha+nome) + Onboarding 3 telas | Baixa | Base para multiusuário e RLS |
| 2 | Login/Logout com persistência de sessão | Baixa | Supabase Auth + SecureStore |
| 3 | CRUD de Disciplinas e Tópicos | Baixa | Cadastro manual livre, 100% offline |
| 4 | Geração de Resumos via IA (~10/dia) | Média | Core do diferencial; abstração via AIGateway |
| 5 | Registro de Sessão de Estudo (manual) | Média | Alimenta XP, streaks e histórico |
| 6 | Captura de Foto da Sessão (câmera) | Média | Evidência visual; recurso nativo exigido |
| 7 | Captura de Localização (GPS) | Baixa | Registro de local; recurso nativo exigido |
| 8 | Sistema de XP + Streaks | Baixa | Lógica local pura, sem backend |
| 9 | Ranking Global Semanal (Leaderboard) | Baixa | 1 query no Supabase, sem backend custom |
| 10 | Sincronização Offline (Outbox Pattern) | Alta | Fundação da arquitetura offline-first |
| 11 | Perfil do Usuário | Baixa | Nome, XP total, streak atual |

### ❌ O que foi ADIADO (fora do MVP)

| Feature | Prioridade Original | Motivo do Corte |
|---|---|---|
| Versão Web | — | Foco 100% mobile |
| Cronograma Inteligente por IA | P1-Must → Cortado | Complexidade inviável para 2 devs/60h |
| Geração de Questões (Quiz) | P2-Should | Validação pedagógica complexa |
| Sistema de Amizades | P2-Should | Estouraria o prazo (convites, aceitação, listas) |
| Sistema de Recompensas/Badges | P2-Should | Pode ser adicionado pós-MVP sem impacto arquitetural |
| Comunidades/Fóruns | P3-Could | Escopo de v2.0 |
| Feedback Detalhado Premium | P3-Could | Depende de massa de dados |
| Portal B2B para Instituições | P4-Won't | Fora de escopo acadêmico |

### Stack Técnica Resumida

| Camada | Tecnologia |
|---|---|
| Framework | Expo + React Native + Expo Router |
| Persistência Local | SQLite via `expo-sqlite` + Drizzle ORM |
| Backend/BaaS | Supabase (Postgres, Auth, Storage) |
| IA | API de LLM (a definir, custo zero) via AIGateway |
| Câmera | `expo-camera` / `expo-image-picker` |
| Geolocalização | `expo-location` (foreground) |
| Autenticação | Supabase Auth + `expo-secure-store` |
| Sincronização | Outbox pattern + NetInfo |
| Arquitetura | Clean Architecture (DDD) |

---

> **Nota:** Este documento serve como referência conceitual e executiva. Os detalhes técnicos (requisitos formais, diagramas UML, modelagem de dados, arquitetura de camadas) estão no [Documento de Software](documento-software.md).
