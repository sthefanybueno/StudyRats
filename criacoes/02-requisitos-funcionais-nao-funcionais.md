# Estudo 02 — Levantamento de Requisitos Funcionais e Não Funcionais — StudyRats

> **Prompt de origem:** `criacoes/10-prompts-engenharia-software.md` → Prompt 02
> **Projeto:** StudyRats · **Equipe:** Maria Clara Miguel, Sthefany Bueno
> **Disciplina:** Laboratório de Desenvolvimento de Aplicações Mobile — 2026.2
> **Padrão:** IEEE 830 adaptado para mobile offline-first
> **Data:** 17 de Setembro de 2026

---

## 1. Requisitos Funcionais (RF)

| ID | Descrição | Prioridade | Ator/Origem | Observação |
|----|-----------|-----------|-------------|------------|
| RF01 | App deve permitir cadastro de novo usuário com email, senha e nome de exibição via Supabase Auth | Alta (Must) | Visitante | Apenas online |
| RF02 | App deve exibir fluxo de onboarding de 3 telas após primeiro cadastro (escolher disciplinas, definir meta de estudo, tutorial rápido) | Alta (Must) | Estudante | — |
| RF03 | App deve permitir login de usuário com email e senha, persistindo sessão localmente | Alta (Must) | Visitante | Token em `expo-secure-store` |
| RF04 | App deve permitir logout de usuário autenticado, limpando credenciais seguras | Alta (Must) | Estudante | — |
| RF05 | App deve permitir criar, editar e excluir (soft delete) disciplinas com nome em texto livre | Alta (Must) | Estudante | 100% offline |
| RF06 | App deve permitir criar, editar e excluir (soft delete) tópicos vinculados a uma disciplina | Alta (Must) | Estudante | 100% offline |
| RF07 | App deve permitir geração de resumo textual via IA a partir de tópico selecionado, exigindo conexão com a internet | Alta (Must) | Estudante | Limite de 10/dia |
| RF08 | App deve salvar resumo gerado pela IA localmente em SQLite para consulta offline posterior | Alta (Must) | Sistema | — |
| RF09 | App deve limitar a geração de resumos via IA a no máximo 10 por dia por usuário | Média (Should) | Sistema | Controle de custo |
| RF10 | App deve permitir consulta de resumos já gerados, mesmo sem conexão com a internet | Alta (Must) | Estudante | — |
| RF11 | App deve permitir registro de sessão de estudo com: disciplina, tópico e duração (em minutos) | Alta (Must) | Estudante | 100% offline |
| RF12 | App deve capturar foto via câmera do dispositivo como evidência **opcional** da sessão de estudo, armazenando-a localmente | Alta (Must) | Estudante | Upload assíncrono |
| RF13 | App deve capturar coordenadas GPS (latitude/longitude) do dispositivo ao registrar sessão de estudo | Alta (Must) | Estudante | Foreground only |
| RF14 | App deve calcular e exibir o streak de dias consecutivos com pelo menos 1 sessão concluída | Alta (Must) | Estudante | Lógica local |
| RF15 | App deve calcular XP por sessão concluída (+10 XP por sessão, +50 XP bônus a cada streak de 7 dias) | Alta (Must) | Sistema | Lógica local |
| RF16 | App deve exibir ranking global (Top 50) de estudantes ordenado por XP semanal, exigindo conexão | Média (Should) | Estudante | Sem amizades |
| RF17 | App deve resetar o XP semanal do ranking toda segunda-feira à 00:00 UTC | Média (Should) | Sistema | Supabase |
| RF18 | App deve exibir perfil do usuário contendo: nome de exibição, XP total acumulado e streak atual | Média (Should) | Estudante | — |
| RF19 | App deve funcionar sem conexão, enfileirando todas as alterações (criação, edição, exclusão) para sincronizar quando houver rede | Alta (Must) | Sistema | Outbox pattern |
| RF20 | App deve sincronizar automaticamente a fila de pendências com o Supabase quando detectar conexão disponível | Alta (Must) | Sistema de Sincronização | NetInfo listener |
| RF21 | App deve exibir histórico de sessões de estudo registradas, incluindo data, disciplina, tópico, duração, foto e localização | Média (Should) | Estudante | — |

---

## 2. Requisitos Não Funcionais (RNF)

| ID | Categoria | Descrição | Critério Mensurável | Prioridade |
|----|-----------|-----------|---------------------|-----------|
| RNF01 | Offline-first | App deve permitir criar, editar e consultar tópicos, disciplinas, sessões, streaks e resumos já gerados com o dispositivo em modo avião. Geração de resumo via IA e consulta ao ranking ficam bloqueadas sem rede | Todas as telas de CRUD e consulta local devem funcionar sem nenhuma chamada de rede | Alta |
| RNF02 | Permissões de dispositivo | Permissões de câmera e localização devem ser solicitadas apenas no momento do uso (nunca no cold start). Se negadas, a sessão de estudo deve ser registrada normalmente, sem foto e/ou sem coordenadas, com feedback claro ao usuário | App não solicita nenhuma permissão antes da tela que a utiliza; registro de sessão completa sem permissões | Alta |
| RNF03 | Uso de bateria/dados | Geolocalização deve usar apenas modo foreground (nunca background tracking). Fotos de sessão devem ser comprimidas antes do upload (máx. 800px de largura, qualidade 70%) | Localização capturada em ≤ 3s; foto comprimida a ≤ 500KB antes de enfileirar upload | Média |
| RNF04 | Armazenamento local | Persistência local via SQLite (expo-sqlite) com ORM Drizzle. Banco local não deve exceder 100MB. Resumos e dados tabulares sincronizados com sucesso podem ter limpeza periódica após 90 dias | Monitoramento de tamanho do banco; política de cleanup configurável | Média |
| RNF05 | Sincronização/Consistência | Estratégia de resolução de conflito: last-write-wins por campo `updated_at`. Fila de sync (outbox) deve processar até 50 registros pendentes em ≤ 30 segundos sob rede 4G. Retry com backoff exponencial em caso de falha | Sync de 50 registros em ≤ 30s; nenhuma perda de dado em cenário de conflito | Alta |
| RNF06 | Segurança | Token de sessão Supabase Auth deve ser armazenado em `expo-secure-store` (nunca `AsyncStorage`). Todas as tabelas remotas devem ter Row Level Security (RLS) com policy `usuario_id = auth.uid()` | Auditoria de código: nenhuma credencial em storage inseguro; teste de RLS por tabela | Alta |
| RNF07 | Compatibilidade | App deve suportar iOS 15+ e Android 10+ (API 29). Expo SDK na versão mais recente estável | Testes em simulador iOS 15 e emulador Android 10 passam sem crash | Média |
| RNF08 | Usabilidade/Feedback de Sync | App deve exibir indicador visual de estado de sincronização em registros pendentes (ícone ou badge: pendente 🟡 / sincronizado 🟢 / erro 🔴). Feedback imediato ao salvar: "Salvo localmente ✓" | Todo registro com `sync_status != synced` exibe indicador visual correspondente | Alta |

### Categorias mobile avaliadas sem aplicação no MVP

| Categoria | Avaliação |
|---|---|
| Notificações push | Previsto (LAC-19 ✅), porém não incluído no MVP. Será adicionado como RF em fase posterior |
| Background sync | Não aplicável no MVP. Sync ocorre apenas com app em foreground + rede disponível |
| In-app purchases | Não aplicável. MVP 100% gratuito |

---

## 3. Matriz de Rastreabilidade RF → Feature do MVP

| Feature do MVP | RFs que satisfazem |
|---|---|
| 1. Cadastro + Onboarding (3 telas) | RF01, RF02 |
| 2. Login/Logout com persistência de sessão | RF03, RF04 |
| 3. CRUD de Disciplinas e Tópicos (100% offline) | RF05, RF06 |
| 4. Geração de Resumos via IA (~10/dia, exige rede) | RF07, RF08, RF09 |
| 5. Registro de Sessão de Estudo (manual) | RF11 |
| 6. Captura de Foto da Sessão (câmera, opcional) | RF12 |
| 7. Captura de Localização GPS (auto-captura) | RF13 |
| 8. Sistema de XP (+10/sessão, +50 bônus a cada 7 dias) | RF15 |
| 9. Sistema de Streaks (dias consecutivos com ≥1 sessão) | RF14 |
| 10. Ranking Global Semanal (Top 50, reset toda segunda) | RF16, RF17 |
| 11. Sincronização Offline (Outbox Pattern) | RF19, RF20 |
| — Complementos (perfil, histórico, consulta de resumos) | RF18, RF21, RF10 |

---

## 4. Premissas e Restrições

### Premissas assumidas
1. O estudante terá **GPS ativo** em pelo menos parte das sessões; quando indisponível, a sessão é registrada sem coordenadas.
2. A conectividade do usuário é **intermitente** — o app nunca assume rede disponível; tudo é pessimista com fallback offline.
3. A API de LLM escolhida (Gemini Flash ou equivalente) manterá **free-tier** suficiente para ~10 gerações/dia/usuário no período acadêmico.
4. O ranking global é anônimo/por nome de exibição — **sem sistema de amizades no MVP**.
5. Uma sessão concluída por dia é suficiente para manter o streak (não há múltiplos streaks por dia).
6. As permissões de câmera e localização podem ser negadas sem degradar a experiência central (registro de sessão).

### Restrições de projeto
1. **MVP 100% gratuito** — sem compra in-app, sem paywall.
2. **Orçamento de serviços externos = zero** — apenas free-tiers (Supabase free, Gemini free / similar).
3. **Prazo:** ~60 horas-aula com 2 desenvolvedoras (Maria Clara e Sthefany).
4. **Clean Architecture obrigatória** — `domain/` e `application/` não importam SDK nativo, ORM ou Supabase.
5. **Mobile-only** — iOS e Android; versão web fora do escopo.
6. Funcionalidades adiadas (fora do MVP): versão web, cronograma inteligente por IA, quiz, amizades, badges/recompensas, comunidades/fóruns, feedback premium, portal B2B.

---

*Rastreabilidade contínua: cada RF vira candidato a caso de uso na Fase seguinte (Prompt 03).*