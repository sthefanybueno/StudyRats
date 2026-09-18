# Estudo 08 — Diagramas de Sequência — StudyRats

> **Prompt de origem:** `criacoes/10-prompts-engenharia-software.md` → Prompt 08
> **Projeto:** StudyRats · **Equipe:** Maria Clara Miguel, Sthefany Bueno · **Data:** 17 de Setembro de 2026

---

## Fluxo 1 — UC08 Registrar Sessão de Estudo (fluxo offline/online)

```mermaid
sequenceDiagram
    actor Estudante
    participant B as SessaoFormScreen<br/>«boundary»
    participant Loc as LocationGateway<br/>«boundary»
    participant Cam as CameraGateway<br/>«boundary»
    participant C as RegistrarSessaoUseCase<br/>«control»
    participant E as SessaoEstudo<br/>«entity»
    participant R as SessaoRepository<br/>«local, SQLite»
    participant Q as SyncQueue<br/>«local»
    participant S as SyncGateway<br/>«Supabase»

    Estudante ->> B: preencher (disciplina, tópico, duração) e confirmar
    B ->> Loc: obterLocalizacaoAtual()
    alt Permissão concedida + GPS ativo
        Loc -->> B: {lat, lng}
    else Permissão negada ou timeout
        Loc -->> B: null (sessão sem coordenadas)
    end

    opt Estudante opta por anexar foto
        B ->> Cam: capturarFoto()
        alt Permissão concedida
            Cam -->> B: {uri_local}
        else Permissão negada
            Cam -->> B: null (sessão sem foto)
        end
    end

    B ->> C: registrar(dados, coordenada, foto)
    C ->> E: criar(UUID, dados, lat, lng)
    E -->> C: sessaoEstudo (sync_status=pending)
    C ->> C: calcularXP(+10 XP, checar streak 7d → +50 bônus)
    C ->> R: salvar(sessaoEstudo)
    R -->> C: ok
    C ->> Q: enfileirar(sessaoEstudo)
    C -->> B: sucesso
    B -->> Estudante: "Sessão registrada ✓ +10 XP"

    par Processamento assíncrono da fila (quando há rede)
        Q ->> S: enviar(sessaoEstudo)
        alt Sync bem-sucedido
            S -->> Q: 200 ok
            Q ->> R: marcarSincronizado(sessaoEstudo.id)
        else Falha (sem rede / erro servidor)
            S -->> Q: erro
            Q ->> Q: reagendar retry (backoff 2^n, max 5min)
        end
    end
```

---

## Fluxo 2 — UC06 Gerar Resumo via IA

```mermaid
sequenceDiagram
    actor Estudante
    participant B as ResumoScreen<br/>«boundary»
    participant C as GerarResumoUseCase<br/>«control»
    participant R as ResumoRepository<br/>«local, SQLite»
    participant AI as AIGateway<br/>«externo»

    Estudante ->> B: selecionar tópico + "Gerar Resumo"
    B ->> C: gerarResumo(topicoId)

    C ->> C: verificarLimiteDiario()
    alt Limite atingido (≥10/dia)
        C -->> B: erro "Limite de 10 resumos/dia atingido"
        B -->> Estudante: feedback de limite
    else Dentro do limite
        C ->> C: verificarConexao()
        alt Sem conexão
            C -->> B: erro "Sem internet"
            B -->> Estudante: "Conecte-se para gerar resumo"
        else Com conexão
            C ->> AI: gerarResumo(topico.nome, disciplina.nome)
            AI -->> C: resumoTexto
            C ->> R: salvarResumo(topicoId, resumoTexto)
            R -->> C: ok
            C -->> B: resumoGerado
            B -->> Estudante: exibe resumo
        end
    end
```

---

## Fluxo 3 — UC14 Sincronizar Fila Pendente

```mermaid
sequenceDiagram
    participant NI as NetInfo<br/>«listener»
    participant SE as SyncEngine<br/>«infra»
    participant Q as SyncQueue<br/>«local»
    participant R as Repository<br/>«local, SQLite»
    participant S as SyncGateway<br/>«Supabase»
    participant ST as StorageGateway<br/>«Supabase Storage»

    NI ->> SE: onConectado()
    SE ->> Q: obterPendentes(orderBy: created_at)
    Q -->> SE: [item1, item2, ..., itemN]

    loop Para cada item da fila
        SE ->> S: enviar(item.entidade, item.operacao, item.payload)
        alt 2xx — sucesso
            S -->> SE: ok
            SE ->> R: atualizarSyncStatus(item.entidadeId, "synced")
            SE ->> Q: remover(item.id)
        else Conflito (409)
            S -->> SE: conflito(remote_updated_at)
            SE ->> SE: compararUpdatedAt(local vs remoto)
            Note over SE: Last-write-wins: updated_at mais recente prevalece
            SE ->> R: resolver(item, vencedor)
            SE ->> Q: remover(item.id)
        else Erro (5xx / timeout)
            S -->> SE: erro
            SE ->> Q: incrementarTentativas(item.id)
            SE ->> SE: reagendar(backoff = 2^tentativas, max 5min)
        end
    end

    SE ->> Q: obterFotosPendentes()
    Q -->> SE: [foto1, foto2, ...]

    loop Para cada foto pendente
        SE ->> SE: comprimir(foto, maxWidth=800, quality=0.7)
        SE ->> ST: upload(foto.uri_local)
        alt Upload OK
            ST -->> SE: url_remota
            SE ->> R: atualizarFoto(foto.id, url_remota, "synced")
        else Falha
            ST -->> SE: erro
            SE ->> Q: reagendar upload (backoff)
        end
    end
```

---

## Tabela de Rastreabilidade

| Diagrama | UC | RFs cobertos | Fluxos modelados |
|----------|-----|-------------|-----------------|
| Fluxo 1 | UC08 | RF11, RF12, RF13, RF14, RF15, RF19 | Principal + Permissão negada + Offline |
| Fluxo 2 | UC06 | RF07, RF08, RF09, RF10 | Principal + Limite atingido + Sem rede |
| Fluxo 3 | UC14 | RF19, RF20 | Loop de processamento + Conflito + Retry + Upload de fotos |

> **Nota de conformidade:** todo diagrama de escrita mostra os dois momentos do offline-first — (1) gravação local imediata (síncrona, sempre bem-sucedida para o usuário) e (2) sync remota assíncrona em `par`. Nomes dos participantes derivam da tabela BCE (Estudo 07).