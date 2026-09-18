# Estudo 06 — Diagrama de Objetos e Diagramas de Estado — StudyRats

> **Prompt de origem:** `criacoes/10-prompts-engenharia-software.md` → Prompt 06
> **Projeto:** StudyRats · **Equipe:** Maria Clara Miguel, Sthefany Bueno · **Data:** 17 de Setembro de 2026

---

## 1. Diagrama de Objetos (Cenário de Sincronização Parcial)

**Cenário:** A estudante Clara está offline. Tem a disciplina "Matemática" (synced) com o tópico "Derivadas" (synced) e um resumo gerado anteriormente (synced). Acabou de criar a disciplina "Física" (pending) e registrou uma sessão de 60min sobre "Derivadas" com foto e GPS. A sessão (pending) tem foto (pending, sem `url_remota`). Há 2 itens na `SyncQueue`. XP total 120, streak 5 dias.

```mermaid
classDiagram
    class Clara {
        <<instance>>
        id = "user-uuid-123"
        xp_total = 120
        streak = 5
        conexao = "offline"
    }

    class Disciplina_Matematica {
        <<instance>>
        id = "disc-uuid-001"
        nome = "Matemática"
        sync_status = "synced"
    }

    class Disciplina_Fisica {
        <<instance>>
        id = "disc-uuid-002"
        nome = "Física"
        sync_status = "pending"
    }

    class Topico_Derivadas {
        <<instance>>
        id = "topico-uuid-101"
        nome = "Derivadas"
        disciplina_id = "disc-uuid-001"
        sync_status = "synced"
    }

    class Resumo_Derivadas {
        <<instance>>
        id = "resumo-uuid-201"
        topico_id = "topico-uuid-101"
        conteudo = "Resumo sobre limites e derivadas..."
        sync_status = "synced"
    }

    class Sessao_Derivadas {
        <<instance>>
        id = "sessao-uuid-301"
        disciplina_id = "disc-uuid-001"
        topico_id = "topico-uuid-101"
        duracao_minutos = 60
        latitude = -23.5505
        longitude = -46.6333
        sync_status = "pending"
    }

    class Foto_Sessao {
        <<instance>>
        id = "foto-uuid-401"
        sessao_id = "sessao-uuid-301"
        uri_local = "file:///data/user/0/app/foto.jpg"
        url_remota = null
        upload_status = "pending"
    }

    class SyncItem_Disciplina {
        <<instance>>
        id = "queue-uuid-501"
        entidade = "disciplinas"
        operacao = "INSERT"
        status = "pending"
    }

    class SyncItem_Sessao {
        <<instance>>
        id = "queue-uuid-502"
        entidade = "sessoes_estudo"
        operacao = "INSERT"
        status = "pending"
    }

    Clara -- Disciplina_Matematica : possui
    Clara -- Disciplina_Fisica : possui
    Disciplina_Matematica -- Topico_Derivadas : contem
    Topico_Derivadas -- Resumo_Derivadas : possui
    Clara -- Sessao_Derivadas : realiza
    Sessao_Derivadas -- Foto_Sessao : evidencia
    SyncItem_Disciplina -- Disciplina_Fisica : aponta_para
    SyncItem_Sessao -- Sessao_Derivadas : aponta_para
```

**Validações do cenário:**
- **Estado misto**: entidades `synced` (Matemática, Derivadas, Resumo) coexistem com `pending` (Física, Sessão, Foto) — corpus clássico de teste do sync engine.
- **Multiplicidades**: Disciplina 1-N Tópicos; SessaoEstudo 0..1 FotoSessao; Topico 0..1 ResumoIA.

---

## 2. Diagrama de Estados — Ciclo de Sincronização

Aplica-se às entidades sincronizáveis `Disciplina`, `Topico`, `ResumoIA`, `SessaoEstudo` (atributo `sync_status`).

```mermaid
stateDiagram-v2
    [*] --> Pendente : criado/editado localmente
    Pendente --> Sincronizando : conexão disponível + worker processa fila
    Sincronizando --> Sincronizado : servidor confirma (2xx)
    Sincronizando --> Erro : falha de rede / erro de validação
    Erro --> Sincronizando : retry automático (backoff exponencial)
    Sincronizado --> Pendente : nova edição local pelo estudante
    Pendente --> ExcluidoLocalmente : estudante exclui (soft delete)
    ExcluidoLocalmente --> Sincronizando : propaga DELETE para Supabase
    Sincronizando --> [*] : delete confirmado no servidor → remove sync_queue item
```

---

## 3. Diagrama de Estados — Upload de Foto

Aplica-se a `FotoSessao` (atributo `upload_status`). Upload é separado do sync de dados tabulares.

```mermaid
stateDiagram-v2
    [*] --> Capturada : foto tirada via câmera, salva localmente
    Capturada --> ComprimindoUpload : conexão disponível + worker de mídia
    ComprimindoUpload --> Enviando : foto comprimida (≤800px, 70%)
    Enviando --> Enviada : Supabase Storage confirma upload
    Enviada --> URLAtualizada : url_remota preenchida no registro local
    URLAtualizada --> [*]
    Enviando --> ErroUpload : falha de rede / timeout
    ErroUpload --> ComprimindoUpload : retry (backoff)
    Capturada --> ExcluidaLocal : estudante remove foto antes de upload
    ExcluidaLocal --> [*]
```

---

## 4. Tabela de Correlação

| Entidade | Atributo | Diagrama | Valores |
|----------|---------|----------|---------|
| Disciplina, Topico, ResumoIA, SessaoEstudo | `sync_status` | Ciclo de Sincronização | `pending`, `synced`, `error` |
| FotoSessao | `upload_status` | Ciclo de Upload | `pending`, `uploading`, `synced`, `error` |

---

## 5. Registro de Avaliação

> **Avaliado** — nenhuma entidade possui ciclo de vida de negócio adicional além do ciclo de sincronização (não há entidade com status de negócio tipo "Aberto→Pago→Enviado"). O único ciclo modelado é o de sincronização/upload. Na implementação (Fase 4), a máquina de estados vira validação dentro da entidade de domínio e do service de sincronização — nunca troca de status "solta".