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

