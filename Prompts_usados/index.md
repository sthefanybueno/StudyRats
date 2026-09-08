Você é um engenheiro de software sênior e analista de sistemas com ampla experiência em documentação de projetos mobile, UML, DDD, Clean Architecture, e gestão de projetos ágeis. Também domina Expo/React Native, Supabase (BaaS), SQLite e arquiteturas offline-first. Você é meticuloso: não aceita prosseguir com documentação de um projeto que tenha furos de escopo, regras de negócio vagas ou fluxos indefinidos.

---

## FASE 0 — ANÁLISE CRÍTICA DA IDEAÇÃO (OBRIGATÓRIA, ANTES DE QUALQUER DOCUMENTAÇÃO)

Antes de começar a documentação, você DEVE consultar e analisar todos os arquivos do projeto na pasta `projeto2026-SKILLs/`. Esses arquivos contêm a documentação de gestão já produzida, os guias de design e o planejamento existente:

### Arquivos para consultar:

1. **`PlanejamentoNotion/Acsa, Maria, Sthefany - Atividade 05 Ferramentas d 3510172348a280d382e2df7e4e8aed61.md`**
   → Descrição do projeto, stakeholders, Matriz 5W2H, cronograma, Matriz RACI, Plano de Comunicação, MoSCoW.
   → As imagens referenciadas neste arquivo (image.png, image 1.png ... image 5.png) contêm as matrizes visuais — analise-as.

2. **`PlanejamentoNotion/GERENC PROJETOS Atividade 08 - Tailoring 36d0172348a280b7aa89f99e0441fa34.md`**
   → Tailoring de processos por fase (Iniciação → Encerramento), com justificativas, ferramentas e saídas por processo.

3. **`software-design-doc/SKILL.md`**
   → Guia completo de como produzir documento de especificação de software (requisitos, UML, DDD, Clean Architecture, TDD). Use como referência metodológica.

4. **`mobile-design-doc/SKILL.md`**
   → Especialização do guia acima para app mobile Expo/React Native offline-first (sync engine, gateways nativos, dois DERs, permissões). Use como referência para a especificação mobile.

5. **`prompts/SKILL.md`**
   → Técnicas de engenharia de prompt (Tree-of-Thought, Few-Shot, Prompt Chaining). Referência sobre como você deve estruturar seu próprio raciocínio.

### O que você deve fazer nesta fase:

Após ler todos os arquivos acima, **NÃO comece a documentação imediatamente**. Em vez disso:

1. **Apresente um resumo analítico** do que você entendeu sobre o projeto StudyRats a partir de toda a documentação existente — escopo, público-alvo, funcionalidades core, stack, modelo de gestão.

2. **Identifique e liste TODAS as lacunas, ambiguidades e pontos sem definição clara**, organizados por categoria. Seja rigoroso e exaustivo. Exemplos do tipo de pergunta esperada:
   - **Regras de negócio vagas:** "O sistema de rankings funciona como? Ranking global? Por disciplina? Por período? Qual a métrica — horas estudadas, questões respondidas, dias consecutivos? Como se evita manipulação?"
   - **Fluxos indefinidos:** "O que acontece quando o estudante atinge o topo do ranking? Há recompensas reais ou virtuais? O cronograma inteligente se adapta automaticamente ou o estudante precisa aprovar mudanças?"
   - **Escopo vs. viabilidade:** "Geração de questões via IA — é múltipla escolha, dissertativa, ambas? Qual LLM? Há curadoria humana antes de exibir ao estudante? Como garantir qualidade pedagógica?"
   - **Dependências não mapeadas:** "O app funciona sem cadastro (modo visitante)? Há onboarding? Quais dados são obrigatórios no cadastro?"
   - **Contradições:** "O MoSCoW prioriza X como Must, mas o cronograma não aloca tempo suficiente para isso — como resolver?"
   - **Decisões técnicas pendentes:** "Geolocalização está como 'opcional' — em que cenário seria usada? Se não tiver caso de uso claro, devemos removê-la do escopo?"

3. **Para cada lacuna, proponha alternativas** (quando possível) para que eu possa escolher, em vez de me deixar com pergunta aberta sem direção.

4. **Classifique cada lacuna por gravidade:**
   - 🔴 **Bloqueante** — Não dá para avançar na documentação sem definir isso.
   - 🟡 **Importante** — Precisa de definição, mas posso assumir um default e ajustar depois.
   - 🟢 **Desejável** — Detalhe fino que pode ser decidido durante a implementação.

5. **Não prossiga para a documentação (Fase 1) até que eu responda TODAS as lacunas bloqueantes.** As lacunas importantes e desejáveis podem ser tratadas ao longo da documentação, mas as bloqueantes precisam estar resolvidas primeiro.

O projeto precisa estar "fechadinho" — sem furos, sem suposições, sem "vou definir depois". Seja exigente.

---

## FASE 1 — DOCUMENTAÇÃO DE ESPECIFICAÇÃO (SÓ APÓS APROVAÇÃO DA FASE 0)

Após resolvermos todas as lacunas bloqueantes da Fase 0, produza o **Documento de Especificação de Software** completo do StudyRats, seguindo rigorosamente esta estrutura (cada seção alimenta a próxima):

1. **Levantamento de Requisitos** — Tabela de RFs e RNFs numerados e rastreáveis, incluindo categorias mobile obrigatórias: offline-first, permissões de dispositivo, uso de bateria/dados, armazenamento local, sincronização/consistência, segurança (expo-secure-store, RLS no Supabase), compatibilidade iOS/Android, usabilidade de feedback de sync.

2. **Diagrama de Casos de Uso** — Com atores (Estudante, Estudante Autenticado, Sistema de Sincronização, Supabase, IA/LLM), herança de ator, «include» e «extend». Descrição textual dos casos de uso principais (pré/pós-condição, fluxo principal, fluxos alternativos incluindo fluxo sem rede e permissão negada).

3. **Diagrama de Classes** — Extraído dos substantivos dos casos de uso. Composição, agregação, herança, multiplicidades. Atributos de controle de sync (id UUID, updated_at, deleted_at, sync_status). Tabela de persistência local (SQLite) vs remota (Supabase) por entidade.

4. **Diagrama Entidade-Relacionamento (DER)** — Dois DERs: schema local SQLite e schema remoto Supabase/Postgres, com RLS documentado.

5. **Diagrama de Objetos** — Instâncias concretas validando cenário de estado misto (parcialmente sincronizado).

6. **Diagrama de Estados** — Ciclo de vida de sincronização (pending → syncing → synced → error). Ciclos de negócio adicionais (status de cronograma, desafio, etc.).

7. **Classes de Fronteira/Controle/Entidade (BCE)** — Boundary de UI (telas Expo Router) separado de Boundary de recurso nativo (CameraGateway, AuthGateway, SyncGateway, AIGateway). Control = Use Cases. Entity = domínio.

8. **Diagrama de Sequência** — Por caso de uso principal, mostrando (1) gravação local imediata e (2) sincronização remota assíncrona condicionada a rede.

9. **Diagrama de Atividades** — Cobrindo decisões de permissão e conectividade.

10. **Diagrama de Componentes** — Materialização das camadas Clean Architecture (Domain, Application, Adapters, Infra).

11. **Implementação: DDD + Clean Architecture + TDD** — Mapeamento de aggregates, entidades, value objects, repositories, gateways. Estrutura de pastas. Plano de testes TDD por caso de uso.

---

## INSTRUÇÕES DE PROCESSO

- **Consulte os arquivos do projeto antes de tudo.** Não invente requisitos genéricos — use o contexto real que está nos documentos.
- **Todos os diagramas devem ser em Mermaid** (renderizam nativamente no GitHub e em artifacts).
- **Rastreabilidade completa:** cada RF → caso de uso → tabela BCE → diagrama de sequência → teste TDD.
- **Entregue seção por seção**, aguardando minha validação antes de avançar para a próxima. Comece pela Fase 0 (Análise Crítica).
- Para cada seção, ao final, apresente um checklist do que foi coberto e pergunte se posso aprovar ou se preciso de ajustes.

---

## FORMATO DE RESPOSTA

- Markdown estruturado
- Diagramas em blocos ```mermaid```
- Tabelas para requisitos, mapeamentos e checklists
- Lacunas classificadas com emojis de gravidade (🔴🟡🟢)
- Tom direto e técnico, sem rodeios — mas assertivo ao questionar

-----------------------------------------------------------------------

Decisões Bloqueantes — StudyRats
Instruções: Para cada lacuna abaixo, preencha o campo RESPOSTA com a alternativa escolhida (ex: Opção B) ou escreva sua própria resposta. Quando terminar todas, me avise para prosseguirmos à Fase 1.

LAC-01 🔴 Perfis de Usuário e Cadastro
Problema: Quais dados são coletados no cadastro? Há onboarding? Existe modo visitante?

Opção	Descrição
A	Cadastro mínimo: email + senha (Supabase Auth), nome de exibição. Onboarding de 3 telas (escolher disciplinas, definir meta de estudo, tutorial rápido). Sem modo visitante.
B	Cadastro com login social (Google/Apple) + email/senha, mesmos dados mínimos. Modo visitante limitado (vê telas, mas não salva nada).
C	Cadastro com dados acadêmicos obrigatórios (instituição, curso, semestre) para personalização de IA.
RESPOSTA LAC-01: (escreva aqui)

LAC-04 🔴 Definição de "Cronograma Inteligente"
Problema: Feature #1 do app (P1-Must) sem nenhuma regra de negócio definida. Como funciona?

Opção	Descrição
A — Simples	Estudante cadastra disciplinas + horários livres. Sistema distribui sessões de estudo uniformemente. Sem adaptação automática. Estudante marca sessão como "concluída" manualmente.
B — Intermediário	Estudante cadastra disciplinas, datas de provas/entregas e horários livres. IA prioriza matérias com deadline próximo. Redistribuição automática de sessões não cumpridas. Duração sugerida por carga.
C — Avançado	Tudo do B + IA analisa desempenho em questões e ajusta prioridade (matéria com mais erros = mais tempo). Integração com calendário do dispositivo.
RESPOSTA LAC-04: (escreva aqui)

LAC-05 🔴 Input do Cronograma
Problema: Quais dados o estudante fornece para gerar o cronograma?

Opção	Descrição
A	Lista de disciplinas (texto livre) + horários disponíveis (calendário semanal simples)
B	Disciplinas de lista pré-cadastrada (por curso) + horários + datas de provas
C	Texto livre descrevendo rotina ("Estudo segunda e quarta à tarde"), processado por IA
RESPOSTA LAC-05: (escreva aqui)

LAC-06 🔴 Escopo da Geração de Conteúdo por IA
Problema: "Geração de resumos e questões" — mas a partir de quê? Para quê? Em qual formato?

Opção	Descrição
A — Baseado em tópico	Estudante seleciona disciplina + tópico (texto livre ou lista). IA gera resumo + N questões de múltipla escolha. Sem upload de material. Feedback simples ("reportar erro").
B — Baseado em conteúdo do aluno	Estudante cola texto/notas de aula. IA gera resumo do texto colado + questões. Mais preciso, depende de input.
C — Multimodal	Estudante pode colar texto OU tirar foto de caderno/slide (OCR via IA). Mais complexo, mais custo.
RESPOSTA LAC-06: (escreva aqui)

LAC-07 🔴 Qual LLM + Gestão de Custo
Problema: Qual API de IA? Há limite de uso? Free vs. Premium?

Opção	Descrição
A	Gemini Flash (custo baixo) para todos. Limite de 20 gerações/dia free. Premium = ilimitado + modelo mais potente (Gemini Pro).
B	OpenAI GPT-4o-mini free (10 gerações/dia). GPT-4o para premium.
C	Misto: Gemini Flash free, OpenAI GPT-4o premium. Fallback automático entre provedores.
RESPOSTA LAC-07: (escreva aqui)

LAC-09 🔴 O que é "Registro de Conteúdo Estudado"?
Problema: O que o estudante registra? É manual? Automático? Tem timer?

Opção	Descrição
A — Log manual	Estudante seleciona disciplina + tópico + duração estimada. Marca como "estudei". Sem timer.
B — Timer de sessão	Estudante inicia um timer ao estudar. Ao finalizar, registra automaticamente disciplina, tópico e duração real. Pode adicionar notas.
C — Integrado ao cronograma	Sessões do cronograma servem como checklist. Estudante marca cada uma como concluída (com ou sem timer). Sessões extras adicionadas manualmente.
RESPOSTA LAC-09: (escreva aqui)

LAC-10 🔴 Mecânica do Ranking
Problema: Qual métrica? Ranking global ou entre amigos? Qual período? Como evitar manipulação?

Opção	Descrição
A — Simples	Ranking semanal global por XP. Top 10 exibido. Reset toda segunda. Username, não nome real.
B — Social	Ranking entre amigos (conexões no app) + ranking global. Streak de dias consecutivos com bônus multiplicador.
C — Ligas	Ligas semanais (Bronze → Prata → Ouro → Diamante) estilo Duolingo. Top 3 sobem, últimos 3 descem.
RESPOSTA LAC-10: (escreva aqui)

LAC-12 🔴 Definição Free vs. Premium
Problema: O que é gratuito e o que é pago? Isso impacta TODA a modelagem.

Opção	Descrição
A — Freemium por limite	Free: todas as features core com limites (ex: 5 gerações IA/dia, ranking básico). Premium: limites removidos + estatísticas avançadas + temas.
B — Freemium por funcionalidade	Free: cronograma + registro. Premium: IA + ranking + recompensas. ⚠️ Perigoso: elimina core value para users free.
C — MVP 100% grátis	Tudo gratuito no MVP. Monetização decidida pós-validação de mercado. Mês 4 = só infraestrutura de pagamento.
RESPOSTA LAC-12: (escreva aqui)

LAC-13 🔴 Grau de Offline-First
Problema: O app funciona 100% sem rede (exceto IA) ou só tolera intermitência?

Opção	Descrição
A — Offline-first	Cronograma, registros, questões já geradas, perfil: tudo offline. IA e sync de ranking exigem rede. Fila de sync com outbox pattern. ⭐ Recomendado.
B — Online com cache	App exige rede para maioria das operações. Cache local só para leitura recente. Mais simples.
RESPOSTA LAC-13: (escreva aqui)

LAC-17 🔴 Câmera — Uso real no domínio?
Problema: Nenhum caso de uso documentado exige câmera. Vale incluir no MVP?

Opção	Descrição
A	Sem câmera no MVP. Remover do escopo.
B	Câmera apenas para foto de perfil — expo-image-picker, sem gateway complexo.
C	Câmera para OCR de material de estudo (aluno fotografa caderno → IA gera resumo). Complexidade alta.
RESPOSTA LAC-17: (escreva aqui)

LAC-18 🔴 Geolocalização — Caso de uso concreto?
Problema: Geolocalização não aparece em nenhum requisito do MoSCoW. Por que incluir?

Opção	Descrição
A	Remover do escopo. Sem caso de uso = sem funcionalidade. ⭐ Recomendado.
B	Uso futuro em "Comunidades" (P3-Could): encontrar estudantes próximos. Mas isso não é MVP.
C	Vincular a sessões de estudo: registrar onde o aluno estudou. Valor agregado questionável.
RESPOSTA LAC-18: (escreva aqui)

LAC-22 🔴 Cronograma 4 meses vs. Escopo
Problema: 4 meses para 3 devs é inviável para o escopo completo. Como resolver?

Opção	Descrição
A — Reduzir escopo	MVP = Must Have only (IA + Cronograma + Registro). Should Have (ranking, recompensas, questões) fica para v1.1 pós-lançamento.
B — Esticar cronograma	6 meses: Mês 1-2 Core, Mês 3 Gamificação, Mês 4 Testes, Mês 5-6 Monetização + Lançamento.
C — Manter 4 meses	Could Have (P3) cortado totalmente. Should Have (P2) com implementação mínima (ranking básico, badges simples).
RESPOSTA LAC-22: (escreva aqui)

LAC-27 🔴 Fluxo de Questões (Quiz)
Problema: "Geração de Questões via IA" (P2-Should) — quantas? Qual formato? Salva respostas?

Opção	Descrição
A — Quiz simples	5 questões de múltipla escolha por geração. Resposta correta + explicação curta. Resposta salva para XP. Sem dificuldade selecionável.
B — Quiz adaptativo	IA ajusta dificuldade com base no histórico de acertos. 5-10 questões. Estatísticas de acerto por tópico.
C — Quiz + simulado	A + modo simulado com tempo limite. Mais complexo, provavelmente P3.
RESPOSTA LAC-27: (escreva aqui)

✅ Lacunas Importantes (🟡) — Defaults Propostos
Abaixo estão as lacunas importantes com os defaults que vou assumir. Marque com ❌ apenas se discordar de algum:

#	Lacuna	Default que vou assumir	Concorda?
LAC-02	Faixa etária	Maiores de 16, sem consentimento parental	✅
LAC-03	Avatar	Sem avatar no MVP, apenas nome + foto	✅
LAC-08	Conteúdo gerado	Salvos localmente + sync com Supabase	✅
LAC-11	Recompensas	Badges/conquistas virtuais	✅
LAC-14	Conflitos de sync	Last-write-wins por updated_at	✅
LAC-15	Plataforma	Mobile-only (iOS + Android) para MVP	✅
LAC-19	Push notifications	Push para lembretes de sessão de estudo	✅
LAC-20	XP/Pontos	Tabela de XP proposta na análise	✅
LAC-21	Streak	1 sessão concluída = dia ativo	✅
LAC-23	LGPD	Definir após LAC-01 e LAC-09	✅
LAC-24	RLS base	user_id = auth.uid() em todas tabelas	✅
LAC-25	Mapa de telas	Mapa proposto na análise	✅
Se discordar de algum default 🟡, escreva aqui: (ou deixe em branco se está tudo ok)

NOTE

Quando terminar de preencher, clique em Proceed ou me envie uma mensagem. Vou consolidar suas respostas e iniciar a Fase 1 — Documentação de Especificação.