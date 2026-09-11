# Status do Projeto (StudyRats)

**Data:** 11 de Setembro de 2026

## Resumo das Atividades de Hoje
1. **Entendimento do Guia de Engenharia:** Análise das capacidades e diretrizes do documento `SKILL.md` focado em como construir a especificação de software do projeto de forma técnica (UML, Clean Architecture, TDD).
2. **Revisão da Ideação Inicial:** Análise dos documentos da fase de planejamento (`Atividade 05` e `Atividade 08 - Tailoring`) localizados na pasta `PlanejamentoNotion`.
3. **Análise Crítica e Redefinição de Escopo:**
   * Constatou-se que o escopo original era inexequível para o cenário apresentado.
   * Feita a transição do escopo de 3 pessoas para 2 pessoas.
   * Mudança de foco do gerenciamento para a viabilidade do desenvolvimento técnico.
   * Criação do artefato `analise_critica_escopo.md` contendo os cortes necessários no MVP (remoção da versão Web, gamificação social complexa e cronograma gerado por IA).
4. **Alinhamento e Tomada de Decisão Técnica:** 
   * A equipe decidiu manter um **Ranking Social**, mas simplificado (Ranking Global no Supabase, sem sistema de amizades).
   * A IA foi reescopada para gerar **apenas resumos** baseados nos tópicos cadastrados manualmente pelo usuário.
   * Criado o `implementation_plan.md` detalhando as fases de criação do Documento de Software.

---

## Próximos Passos (Onde Paramos)
O escopo está 100% definido e validado. O próximo passo imediato é iniciar a construção do documento oficial `docs/documento-software.md` começando pela **Fase 1: Fundações** (Requisitos Funcionais/Não Funcionais e Diagrama de Casos de Uso).

### Prompt Base para Retomada
*Copie e cole o prompt abaixo na próxima sessão de chat para que a IA retome exatamente do ponto onde paramos hoje:*

```text
Olá! Retomando o projeto StudyRats. No nosso último alinhamento, nós definimos o escopo do MVP para um time de duas pessoas em 60 horas. Decidimos que:
1. O app será apenas Mobile (React Native + SQLite + Supabase).
2. A IA vai gerar apenas resumos de tópicos cadastrados pelo usuário.
3. Teremos um Ranking Global (Leaderboard) simples usando Supabase, baseado em pontos de ofensiva/streaks.

Com base nisso, nós aprovamos o 'implementation_plan.md' que está na pasta projeto2026-SKILLs. Por favor, inicie a "Fase 1: Fundações" e crie o documento de software (`docs/documento-software.md`), escrevendo a tabela de Requisitos Funcionais (RF) e Não Funcionais (RNF), e elaborando o Diagrama de Casos de Uso (UML em formato Mermaid). Use as diretrizes do `projeto2026-SKILLs/software-design-doc/SKILL.md` para formatação.
```
