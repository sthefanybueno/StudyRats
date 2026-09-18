# Estudo 09 — Diagramas de Atividades — StudyRats

> **Prompt de origem:** `criacoes/10-prompts-engenharia-software.md` → Prompt 09
> **Projeto:** StudyRats · **Equipe:** Maria Clara Miguel, Sthefany Bueno · **Data:** 17 de Setembro de 2026

---

## Atividade 1 — UC08 Registrar Sessão de Estudo (decisões de permissão + conectividade)

### Raias (descrição textual)

- **Raia Estudante:** preenche o formulário (disciplina + tópico + duração), opta por anexar foto e recebe o feedback final.
- **Raia Sistema:** solicita permissões ao SO, captura GPS/foto, cria a `SessaoEstudo`, salva em SQLite, calcula XP/streak, enfileira e sincroniza com Supabase.

```mermaid
flowchart TD
    Start((Início)) --> A1[Estudante preenche formulário\ndisciplina + tópico + duração]
    A1 --> D1{Permissão de\nlocalização concedida?}

    D1 -- Não --> A2[Solicitar permissão ao SO]
    A2 --> D1b{Concedida agora?}
    D1b -- Sim --> A3[Capturar localização GPS]
    D1b -- Não --> A3b[Prosseguir SEM coordenadas\nlat/lng = null]
    D1 -- Sim --> A3

    A3 --> D4{Estudante quer\nanexar foto?}
    A3b --> D4

    D4 -- Sim --> D5{Permissão de\ncâmera concedida?}
    D5 -- Não --> A6[Solicitar permissão ao SO]
    A6 --> D5b{Concedida agora?}
    D5b -- Sim --> A7[Capturar foto via câmera]
    D5b -- Não --> A7b[Prosseguir SEM foto]
    D5 -- Sim --> A7
    D4 -- Não --> A8

    A7 --> A8[Criar SessaoEstudo com UUID]
    A7b --> A8

    A8 --> A9[Salvar localmente em SQLite\nsync_status = pending]
    A9 --> A10[Calcular XP + atualizar streak]
    A10 --> A11[Enfileirar na sync_queue]
    A11 --> A12[Exibir feedback\n'Sessão registrada ✓ +10 XP']

    A12 --> D6{Há conexão\nde rede?}
    D6 -- Não --> A13[Aguardar reconexão\nlistener NetInfo]
    A13 --> D6
    D6 -- Sim --> A14[Enviar para Supabase]
    A14 --> D7{Envio\nconfirmado?}
    D7 -- Sim --> A15[Marcar como synced]
    D7 -- Não --> A16[Reagendar retry\nbackoff exponencial]
    A16 --> D6
    A15 --> End((Fim))
```

---

## Atividade 2 — Processo de Sincronização Ponta-a-Ponta (Sync Engine)

### Raias (descrição textual)

- **Raia SyncEngine:** detecta conectividade, lê a `sync_queue`, processa dados (com retry/backoff e resolução de conflito) e depois processa fotos pendentes (compressão + agendamento de upload).
- **Raia Supabase:** recebe e confirma as requisições de dados (REST) e de mídia (Storage).

```mermaid
flowchart TD
    Start((NetInfo detecta\nconexão)) --> A1[Consultar sync_queue\nORDER BY created_at]
    A1 --> D1{Fila vazia?}
    D1 -- Sim --> End1((Fim — nada a sincronizar))
    D1 -- Não --> A2[Pegar próximo item da fila]
    A2 --> A3[Enviar para Supabase]
    A3 --> D2{Resposta?}

    D2 -- 2xx OK --> A4[Marcar entidade como synced]
    A4 --> A5[Remover item da sync_queue]
    A5 --> D1

    D2 -- 409 Conflito --> A6[Comparar updated_at\nlocal vs remoto]
    A6 --> A7[Aplicar last-write-wins]
    A7 --> A5

    D2 -- 5xx/Timeout --> A8[Incrementar tentativas]
    A8 --> D3{tentativas > 5?}
    D3 -- Sim --> A9[Marcar como error\nnotificar usuário]
    A9 --> D1
    D3 -- Não --> A10[Reagendar com backoff\n2^tentativas segundos]
    A10 --> D1

    D1 -- Fotos pendentes --> A11[Comprimir foto\n800px, 70%]
    A11 --> A12[Upload para Supabase Storage]
    A12 --> D4{Upload OK?}
    D4 -- Sim --> A13[Atualizar url_remota + upload_status=synced]
    A13 --> End2((Fim))
    D4 -- Não --> A14[Reagendar upload\nbackoff]
    A14 --> A11
```

---

## Tabela de Rastreabilidade

| Diagrama | UC | Decisões modeladas |
|----------|-----|-------------------|
| Atividade 1 | UC08 | Permissão GPS, Permissão Câmera, Conectividade, Confirmação sync |
| Atividade 2 | UC14 | Fila vazia, Resposta servidor (2xx/409/5xx), Max tentativas, Upload OK |

> Os fluxos são 1:1 com os diagramas de sequência do Estudo 08 (mesmos gateways: `CameraGateway`, `LocationGateway`, `SyncGateway`, `SyncQueue`, `StorageGateway`).