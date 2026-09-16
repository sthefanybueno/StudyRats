# Diário de Bordo do Aplicativo StudyRats

*Alunas:* Maria Clara Miguel, Sthefany Bueno
*Turma:* 2026.2
*Matéria:* Laboratório de Desenvolvimento de Aplicações Mobile
*Professor(a):* Lázaro Eduardo da Silva

## Do que se trata este arquivo?

Este arquivo registra as atividades realizadas pelas alunas Maria Clara Miguel e Sthefany Bueno no desenvolvimento do aplicativo StudyRats. Ele documenta o processo de criação do aplicativo, desde a ideação até a implementação, seguindo as diretrizes estabelecidas pelo curso e pelo professor.

---

## Convenções de Registro

> **Regra:** A cada commit, a IA deve registrar neste arquivo o que foi feito desde o último commit até o commit atual, seguindo o formato abaixo.

### Formato do registro

```
### [Título descritivo do que foi feito]

- **Quando:** Data do commit (ex: 13/09/2026)
- **Quem:** Nome da aluna responsável (determinado pela branch Git ativa)
- **O que:** Resumo claro e conciso das alterações realizadas
- **Resultados:**
  - `nome_do_arquivo.ext` — descrição da função/utilidade do artefato
  - `outro_arquivo.ext` — descrição da função/utilidade do artefato

> **Prompt de retomada:**
> *(Prompt que contextualiza a IA para continuar exatamente de onde paramos)*
```

### Regra de autoria por branch

| Branch Git | Quem |
|---|---|
| `sthefany` | Sthefany |
| `clara` | Clara |

### Automação via Git Hook

Um hook `post-commit` em `.git/hooks/post-commit` registra automaticamente os metadados de cada commit numa fila em `.git/pending_diary_entries.jsonl`. Quando a IA iniciar uma nova conversa, deve:

1. Verificar se existe `.git/pending_diary_entries.jsonl`
2. Se existir, processar cada entrada pendente e criar os registros correspondentes neste diário
3. Após processar, limpar o arquivo de fila

Dentro de uma conversa ativa, a IA deve reagir diretamente aos commits que observar nas ações do usuário, sem depender da fila.

---

## Atividades

*(Seção reservada para registros de atividades avaliativas e entregas formais)*

## Atividade 01 - Definição e apresentação da proposta do aplicativo (Avaliação 01 de Laboratório)

*(a preencher)*

---

## Logs de ações (o que foi feito em cada dia e por quem)

### Alinhamento arquitetural e definição de escopo do MVP

- **Quando:** 13/09/2026
- **Quem:** Clara
- **O que:** Realizado o alinhamento arquitetural completo do projeto StudyRats com a IA atuando como Arquiteto Líder. Foram sintetizados e validados 4 pontos fundamentais: (1) Proposta Central e problema resolvido, (2) Decisões de escopo do MVP para ~60h-aula com 2 devs, (3) Arquitetura Técnica offline-first com stack de referência, e (4) Fronteira de responsabilidades via Clean Architecture. Além disso, foram tomadas 7 decisões de escopo que estavam pendentes: cadastro mínimo com onboarding, ranking semanal com reset, LLM abstraída via gateway, MVP gratuito com limite de gerações/dia, sessões de estudo manuais, câmera para evidência de sessão e geolocalização para registro de local de estudo.
- **Resultados:**
  - `implementation_plan.md` — plano de implementação da documentação (já existia, serviu como insumo)
  - `status.md` — registro de decisões tomadas em 11/Set (já existia, serviu como insumo)
  - `docs_ref/Prompts_usados/fase0_analise_critica.md` — análise crítica com LACs bloqueantes (já existia, serviu como insumo)
  - `sintese_alinhamento_arquitetural.md` *(artefato de conversa)* — síntese completa dos 4 pontos validados + 7 decisões consolidadas, pronta para alimentar a Fase 1 da documentação

> **Prompt de retomada:**
> Olá! Retomando o projeto StudyRats. Na nossa última sessão (13/Set/2026), validamos o alinhamento arquitetural completo do MVP. As decisões consolidadas são:
> 1. App Mobile-only (Expo + React Native + SQLite/Drizzle + Supabase).
> 2. IA gera apenas resumos de tópicos (abstraída via AIGateway, LLM a definir, limite ~10/dia).
> 3. Ranking Global semanal com reset (Leaderboard no Supabase, sem sistema de amizades).
> 4. Sessões de estudo com cadastro manual livre + captura de foto (CameraGateway) e localização (LocationGateway).
> 5. Cadastro mínimo (email+senha+nome) com onboarding de 3 telas.
> 6. Offline-first: tópicos, sessões, streaks e resumos já gerados funcionam 100% offline. IA e ranking exigem rede.
> 7. Clean Architecture: Domain e Application puros; SDKs nativos isolados em adapters/infra.
>
> O próximo passo é iniciar a **Fase 1 — Fundações** do Documento de Software (`docs/documento-software.md`): tabela de Requisitos Funcionais (RF) e Não Funcionais (RNF) + Diagrama de Casos de Uso (UML Mermaid). Use as diretrizes do `projeto2026-SKILLs/mobile-design-doc/SKILL.md` para formatação.

---

### Criação da proposta de produto e Fase 1 (Requisitos + Casos de Uso)

- **Quando:** 13/09/2026
- **Quem:** Clara
- **O que:** Criação do documento centralizador de proposta de produto (`docs/proposta-produto.md`) com visão executiva, público-alvo, dores mapeadas, 3 pilares de valor (IA + gamificação + evidência nativa) e matriz de escopo do MVP. Em seguida, geração da Fase 1 completa do documento de software (`docs/documento-software.md`) contendo: 21 Requisitos Funcionais rastreáveis (RF01–RF21), 8 Requisitos Não Funcionais com categorias mobile obrigatórias (RNF01–RNF08), Diagrama de Casos de Uso em Mermaid com 6 atores e relacionamentos include/extend, e descrição textual de 5 casos de uso críticos com fluxos alternativos (offline e permissão negada). Também reorganizada a estrutura de pastas do repositório (movidos arquivos de referência para `docs_ref/` e `base_infos/`).
- **Resultados:**
  - `docs/proposta-produto.md` — visão executiva e conceitual do StudyRats (pitch, dores, mecânicas, escopo MVP)
  - `docs/documento-software.md` — Fase 1: engenharia de requisitos (RF01–RF21 + RNF01–RNF08) + diagrama de casos de uso UML + descrição textual de 5 UCs críticos
  - `base_infos/implementation_plan.md` — plano de implementação (movido de raiz para `base_infos/`)
  - `base_infos/sintese_arquitetural.md` — síntese de alinhamento arquitetural consolidada
  - `diario_bordo.md` — diário de bordo com convenções de registro definidas

> **Prompt de retomada:**
> Olá! Retomando o projeto StudyRats. Na sessão de 13/Set/2026, concluímos a **Fase 1 — Fundações** do Documento de Software. Os entregáveis foram:
> 1. `docs/proposta-produto.md` — proposta conceitual e executiva completa.
> 2. `docs/documento-software.md` — Fase 1 com 21 RFs, 8 RNFs e Diagrama de Casos de Uso (Mermaid) com 6 atores e 5 UCs detalhados.
>
> O próximo passo é a **Fase 2 — Modelagem de Dados**: Diagrama de Classes (com atributos de sync: UUID, updated_at, deleted_at, sync_status), DER local (SQLite) e DER remoto (Supabase/Postgres com RLS), e Diagrama de Objetos validando cenário de estado misto (parcialmente sincronizado). Use `docs/documento-software.md` como destino e as diretrizes de `projeto2026-SKILLs/mobile-design-doc/SKILL.md`.

---

### Fase 2: Modelagem de Dados

- **Quando:** 13/09/2026
- **Quem:** Clara
- **O que:** add: fase 2 de modelagem de dados. Adicionadas as modelagens de dados ao `docs/documento-software.md`. Isso inclui o Diagrama de Classes (Domínio), Modelo Relacional Local (DER SQLite) garantindo suporte ao offline-first, Modelo Relacional Remoto (DER Supabase) com foco em segurança (RLS) e o Diagrama de Objetos evidenciando cenário de estado misto de sincronização.
- **Resultados:**
  - `docs/documento-software.md` — atualização com inserção da Seção 3 (Fase 2).

> **Prompt de retomada:**
> Olá! Retomando o projeto StudyRats. Na última sessão (13/Set/2026), concluímos a **Fase 2 — Modelagem de Dados** no `docs/documento-software.md`.
>
> O próximo passo é a **Fase 3 — Arquitetura e UI**. Precisamos iniciar a elaboração da arquitetura limpa e da interface do usuário de acordo com as diretrizes do projeto.

---

### Fase 3: Arquitetura — Estados, BCE, Sequência, Atividades e Componentes

- **Quando:** 16/09/2026
- **Quem:** Clara
- **O que:** Adicionadas 5 seções ao `docs/documento-software.md` cobrindo toda a Fase 3 do SKILL.md: (1) Diagrama de Estados com dois ciclos — sincronização de dados e upload de foto, (2) Classificação BCE com tabela de mapeamento para 14 casos de uso e diagramas de robustez para UC08 e UC06, (3) Três diagramas de sequência (Registrar Sessão com par/alt/opt, Gerar Resumo com limite diário, Sincronizar Fila com loop/conflito/retry), (4) Dois diagramas de atividades (Registrar Sessão com decisões de permissão + conectividade, Sync Engine ponta-a-ponta), (5) Diagrama de Componentes mapeando todas as 5 camadas Clean Architecture com 11 telas, 7 use cases, 8 ports e 8 adapters. Versão do documento atualizada para 1.3. Sumário expandido com todas as subseções novas.
- **Resultados:**
  - `docs/documento-software.md` — atualizado com Seções 4 a 8 (Fase 3), versão 1.3, ~1100 linhas totais

> **Prompt de retomada:**
> Olá! Retomando o projeto StudyRats. Na sessão de 16/Set/2026, concluímos a **Fase 3 — Arquitetura** no `docs/documento-software.md` (versão 1.3). Todas as seções exigidas pelo SKILL.md foram produzidas:
> - §4: Diagrama de Estados (sync de dados + upload de foto)
> - §5: BCE — tabela de 14 UCs + diagramas de robustez (UC08, UC06)
> - §6: 3 Diagramas de Sequência (UC08, UC06, UC14) com fluxo offline/online
> - §7: 2 Diagramas de Atividades (UC08 com permissões, Sync Engine)
> - §8: Diagrama de Componentes (Clean Architecture completa)
>
> O próximo passo é a **Fase 4 — Implementação (DDD + Clean Architecture + TDD)**: mapeamento de Aggregates/Value Objects/Repositories/Gateways, estrutura de diretórios `src/` com camadas, e plano de testes TDD (domínio → use case → adapter → componente). Use `docs/documento-software.md` como destino e a seção 10 do `projeto2026-SKILLs/mobile-design-doc/SKILL.md` como referência.
