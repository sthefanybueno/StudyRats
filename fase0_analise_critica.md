# FASE 0 — Análise Crítica do Projeto StudyRats

> **Status:** Aguardando respostas das LACs bloqueantes para avançar para a Fase 1.

---

## 1. Resumo Analítico — O que eu entendi

### Identidade do Projeto
**StudyRats** é um app mobile (iOS + Android) que combina IA generativa e gamificação para resolver dois problemas centrais do estudante brasileiro: **desmotivação** e **falta de organização**. A proposta de valor é transformar o estudo diário em uma experiência estruturada, automática e socialmente motivadora.

### Público-Alvo
Estudantes universitários e de ensino médio, primariamente do CEFET e instituições parceiras, com potencial de expansão. Faixa etária +16. Contexto brasileiro (LGPD aplicável).

### Funcionalidades Core (extraídas do MoSCoW)

| Prioridade | Feature | Descrição |
|---|---|---|
| P1 — Must | Integração com APIs de LLMs | Base para geração de resumos e questões |
| P1 — Must | Cronograma Inteligente | Organização automática do plano de estudos |
| P1 — Must | Registro de Conteúdo Estudado | Acompanhamento e registro acadêmico |
| P2 — Should | Sistema de Ranking (Leaderboard) | Engajamento social e competição |
| P2 — Should | Sistema de Recompensas | Badges/conquistas para constância |
| P2 — Should | Geração de Questões via IA | Diferencial pedagógico |
| P3 — Could | Feedback Detalhado Premium | Estatísticas avançadas de desempenho |
| P3 — Could | Notificações Motivacionais | Lembretes e mensagens |
| P3 — Could | Comunidades / Fóruns | Discord ou chat in-app |
| P4 — Won't | Portal B2B para Instituições | Fora do MVP |

### Stack Inferida (incompleta nos docs)
- **Frontend:** Expo + React Native + Expo Router
- **Backend/BaaS:** Supabase (Postgres, Auth, Storage)
- **Persistência local:** SQLite via expo-sqlite + Drizzle ORM
- **IA:** API de LLM (OpenAI ou Google Gemini — não definido)
- **Autenticação:** Supabase Auth + expo-secure-store

### Modelo de Gestão
- 3 desenvolvedoras (Acsa, Maria Clara, Sthefany) com papéis RACI distintos por feature
- Cronograma de **4 meses** em 4 fases: Setup → Core/MVP → Testes → Lançamento
- Financiamento via CNPq/FAPEMIG (fundações de pesquisa)
- Processo ágil leve: kanban, daily, retrospectiva, sem burocracia de PMBoK formal
- Validação com usuários beta do CEFET no Mês 3

### Contradição Central identificada
O **cronograma de 4 meses** prevê:
- Mês 1: Infraestrutura + APIs de LLMs
- Mês 2: Cronograma Inteligente + **Gamificação (Rankings)**
- Mês 3: Testes alfa/beta
- Mês 4: Lançamento + Monetização

Mas o MoSCoW lista 3 Must Have + 3 Should Have = **6 features de alta complexidade** para 2 meses de desenvolvimento com 3 devs. Isso é inviável sem corte de escopo explícito.

---

## 2. Decisões Bloqueantes — Respostas Necessárias

> ⚠️ **Preencha cada campo RESPOSTA abaixo. Quando terminar, me avise.**

---

### LAC-01 🔴 Perfis de Usuário e Cadastro
**Problema:** Quais dados são coletados no cadastro? Há onboarding? Existe modo visitante?

| Opção | Descrição |
|---|---|
| **A** | Cadastro mínimo: email + senha (Supabase Auth) + nome de exibição. Onboarding de 3 telas (escolher disciplinas, definir meta de estudo, tutorial rápido). Sem modo visitante. |
| **B** | Cadastro com login social (Google/Apple) + email/senha. Modo visitante limitado (navega mas não salva nada). |
| **C** | Dados acadêmicos obrigatórios no cadastro (instituição, curso, semestre) para personalização da IA. |

> **RESPOSTA LAC-01:** *(escreva aqui — ex: "Opção A" ou descrição personalizada)*

---

### LAC-04 🔴 Definição de "Cronograma Inteligente"
**Problema:** Feature #1 do app (P1-Must) sem regra de negócio definida.

| Opção | Descrição |
|---|---|
| **A — Simples** | Estudante cadastra disciplinas + horários livres. Sistema distribui sessões uniformemente. Sem adaptação automática. Estudante marca sessão como "concluída" manualmente. |
| **B — Intermediário** | Estudante cadastra disciplinas + datas de provas/entregas + horários livres. IA prioriza matérias com deadline próximo. Redistribuição automática de sessões não cumpridas. |
| **C — Avançado** | Tudo do B + IA analisa desempenho em questões e ajusta prioridade (mais erros = mais tempo). Integração com calendário do dispositivo. |

> **RESPOSTA LAC-04:** *(escreva aqui)*

---

### LAC-05 🔴 Input do Cronograma
**Problema:** Quais dados o estudante fornece para gerar o cronograma?

| Opção | Descrição |
|---|---|
| **A** | Lista de disciplinas (texto livre) + horários disponíveis (calendário semanal simples) |
| **B** | Disciplinas de lista pré-cadastrada por curso + horários + datas de provas |
| **C** | Texto livre descrevendo rotina, processado por IA |

> **RESPOSTA LAC-05:** *(escreva aqui)*

---

### LAC-06 🔴 Escopo da Geração de Conteúdo por IA
**Problema:** "Geração de resumos e questões" — a partir de quê? Em qual formato?

| Opção | Descrição |
|---|---|
| **A — Baseado em tópico** | Estudante seleciona disciplina + tópico (texto livre ou lista). IA gera resumo + N questões de múltipla escolha. Sem upload de material. Feedback simples ("reportar erro"). |
| **B — Baseado em conteúdo do aluno** | Estudante cola texto/notas de aula. IA gera resumo + questões a partir do texto colado. |
| **C — Multimodal** | Estudante pode colar texto OU fotografar caderno/slide (OCR via IA). Alta complexidade e custo. |

> **RESPOSTA LAC-06:** *(escreva aqui)*

---

### LAC-07 🔴 Qual LLM + Gestão de Custo
**Problema:** Qual API de IA? Há limite de uso?

| Opção | Descrição |
|---|---|
| **A** | Gemini Flash para todos. Limite de 20 gerações/dia no free. Premium = ilimitado + Gemini Pro. |
| **B** | GPT-4o-mini free (10/dia). GPT-4o para premium. |
| **C** | Misto: Gemini Flash free + OpenAI GPT-4o premium. Fallback automático. |

> **RESPOSTA LAC-07:** *(escreva aqui)*

---

### LAC-09 🔴 O que é "Registro de Conteúdo Estudado"?
**Problema:** Manual? Automático? Com timer?

| Opção | Descrição |
|---|---|
| **A — Log manual** | Estudante seleciona disciplina + tópico + duração estimada. Marca como "estudei". Sem timer. |
| **B — Timer de sessão** | Estudante inicia timer. Ao finalizar, registra disciplina, tópico e duração real automaticamente. |
| **C — Integrado ao cronograma** | Sessões do cronograma viram checklist. Estudante marca cada uma como concluída. Sessões extras adicionadas manualmente. |

> **RESPOSTA LAC-09:** *(escreva aqui)*

---

### LAC-10 🔴 Mecânica do Ranking
**Problema:** Qual métrica? Período? Global ou social? Como evitar manipulação?

| Opção | Descrição |
|---|---|
| **A — Simples** | Ranking semanal global por XP. Top 10 exibido. Reset toda segunda. Username, não nome real. |
| **B — Social** | Ranking entre amigos + global. Streak de dias consecutivos com bônus multiplicador. |
| **C — Ligas** | Ligas semanais (Bronze → Prata → Ouro → Diamante). Top 3 sobem, últimos 3 descem. |

> **RESPOSTA LAC-10:** *(escreva aqui)*

---

### LAC-12 🔴 Definição Free vs. Premium
**Problema:** O que é gratuito e o que é pago? Impacta toda a modelagem.

| Opção | Descrição |
|---|---|
| **A — Freemium por limite** | Free: todas as features core com limites (ex: 5 gerações IA/dia). Premium: sem limites + estatísticas avançadas + temas. |
| **B — Freemium por funcionalidade** | Free: cronograma + registro. Premium: IA + ranking + recompensas. ⚠️ Elimina core value para usuários free. |
| **C — MVP 100% grátis** | Tudo gratuito no MVP. Monetização decidida pós-validação de mercado. |

> **RESPOSTA LAC-12:** *(escreva aqui)*

---

### LAC-13 🔴 Grau de Offline-First
**Problema:** App funciona 100% sem rede (exceto IA) ou só tolera intermitência?

| Opção | Descrição |
|---|---|
| **A — Offline-first ⭐ Recomendado** | Cronograma, registros, questões já geradas, perfil: tudo offline. IA e sync de ranking exigem rede. Fila de sync com outbox pattern. |
| **B — Online com cache** | App exige rede para maioria das operações. Cache local só para leitura recente. |

> **RESPOSTA LAC-13:** *(escreva aqui)*

---

### LAC-17 🔴 Câmera — Uso real no domínio?
**Problema:** Nenhum caso de uso documentado exige câmera.

| Opção | Descrição |
|---|---|
| **A** | Sem câmera no MVP. Remover do escopo. |
| **B** | Câmera apenas para foto de perfil (expo-image-picker, sem gateway complexo). |
| **C** | Câmera para OCR de material de estudo (fotografa caderno → IA gera resumo). Alta complexidade. |

> **RESPOSTA LAC-17:** *(escreva aqui)*

---

### LAC-18 🔴 Geolocalização — Caso de uso concreto?
**Problema:** Geolocalização não aparece no MoSCoW. Por que incluir?

| Opção | Descrição |
|---|---|
| **A ⭐ Recomendado** | Remover do escopo. Sem caso de uso = sem funcionalidade. |
| **B** | Uso futuro em "Comunidades" (P3-Could): encontrar estudantes próximos. Não é MVP. |
| **C** | Vincular a sessões de estudo: registrar onde o aluno estudou. Valor agregado questionável. |

> **RESPOSTA LAC-18:** *(escreva aqui)*

---

### LAC-22 🔴 Cronograma 4 meses vs. Escopo
**Problema:** 4 meses para 3 devs é inviável para o escopo completo.

| Opção | Descrição |
|---|---|
| **A — Reduzir escopo** | MVP = Must Have only (IA + Cronograma + Registro). Should Have (ranking, recompensas, questões) para v1.1. |
| **B — Esticar cronograma** | 6 meses: Core (1-2), Gamificação (3), Testes (4), Monetização + Lançamento (5-6). |
| **C — Manter 4 meses** | Could Have (P3) cortado totalmente. Should Have (P2) com implementação mínima. |

> **RESPOSTA LAC-22:** *(escreva aqui)*

---

### LAC-27 🔴 Fluxo de Questões (Quiz)
**Problema:** "Geração de Questões via IA" — quantas? Qual formato? Salva respostas?

| Opção | Descrição |
|---|---|
| **A — Quiz simples** | 5 questões de múltipla escolha por geração. Resposta correta + explicação curta. Salva para XP. |
| **B — Quiz adaptativo** | IA ajusta dificuldade com base no histórico. 5-10 questões. Estatísticas por tópico. |
| **C — Quiz + simulado** | A + modo simulado com tempo limite. Provavelmente P3. |

> **RESPOSTA LAC-27:** *(escreva aqui)*

---

## 3. Defaults Assumidos para LACs Importantes (🟡)

Marque com ❌ se discordar de algum item abaixo. Caso contrário, serão usados como estão.

| # | Lacuna | Default assumido | Concorda? |
|---|---|---|---|
| LAC-02 | Faixa etária | Maiores de 16, sem consentimento parental | ✅ |
| LAC-03 | Avatar/foto | Sem avatar no MVP, apenas nome de exibição | ✅ |
| LAC-08 | Conteúdo gerado (resumos/questões) | Salvos localmente (SQLite) + sync com Supabase | ✅ |
| LAC-11 | Recompensas | Badges/conquistas virtuais (sem recompensa financeira) | ✅ |
| LAC-14 | Resolução de conflito de sync | Last-write-wins por `updated_at` | ✅ |
| LAC-15 | Plataforma alvo | Mobile-only (iOS + Android) para o MVP | ✅ |
| LAC-19 | Push notifications | Push para lembretes de sessões de estudo | ✅ |
| LAC-20 | Tabela de XP | Sessão concluída: +10 XP; Quiz completo: +15 XP; Streak 7 dias: +50 XP | ✅ |
| LAC-21 | Critério de streak | 1 sessão concluída = dia ativo para o streak | ✅ |
| LAC-23 | LGPD | Definir política após consolidar LAC-01 e LAC-09 | ✅ |
| LAC-24 | RLS Supabase base | `user_id = auth.uid()` em todas as tabelas do usuário | ✅ |
| LAC-25 | Mapa de telas | Login → Onboarding → Home (cronograma) → Registro → IA (resumos/questões) → Ranking → Perfil | ✅ |

> **Discorda de algum default? Escreva aqui:** *(ou deixe em branco)*

---

## 4. Checklist da Fase 0

- [x] Lidos e analisados todos os 5 arquivos do projeto
- [x] Analisadas todas as 6 imagens (Stakeholders, 5W2H, Cronograma, RACI, Comunicação, MoSCoW)
- [x] Resumo analítico produzido
- [x] 12 lacunas bloqueantes identificadas e apresentadas com alternativas
- [x] 12 defaults para lacunas importantes propostos
- [ ] **AGUARDANDO:** Respostas de LAC-01, 04, 05, 06, 07, 09, 10, 12, 13, 17, 18, 22, 27

> ⚠️ **Não avançarei para a Fase 1 até receber as 12 respostas bloqueantes.**
