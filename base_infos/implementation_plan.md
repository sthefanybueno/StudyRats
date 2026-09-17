# Plano de Implementação da Documentação (StudyRats)

Com as decisões tomadas (foco em Mobile, IA apenas para Resumos, e Manutenção do Ranking Social), temos o direcionamento exato para criar o **Documento de Software**. 

## O Melhor Caminho para o Ranking Social (MVP 60h)
> [!TIP]
> Para viabilizar o ranking com **duas pessoas** sem estourar o prazo, o segredo é **não criar um sistema de amizades**. Fazer um sistema de "adicionar amigos", enviar convites e aceitar é muito demorado. 

**A Estratégia Recomendada:**
Usar um **Ranking Global (Leaderboard)** utilizando o Supabase:
1. **Sincronização Simples:** O app funciona offline com SQLite. Quando o usuário se conecta à internet, ele envia seus pontos de ofensiva para a tabela `Usuario` no Supabase.
2. **Consulta Enxuta:** A tela de Ranking apenas faz um `SELECT TOP 50` ordenado por pontos no Supabase. 
3. **Sem backend complexo:** Não precisamos construir servidores em NodeJS/Python, usamos o BaaS (Supabase) direto do React Native.

---

## Proposed Changes (Estrutura do Documento de Software)

Iremos gerar a documentação completa exigida no padrão `SKILL.md` criando o arquivo `docs/documento-software.md` na raiz do seu projeto. O documento será construído em etapas (entregas iterativas):

### Fase 1: Fundações
* **Levantamento de Requisitos:** RFs e RNFs detalhando a gestão de tópicos, sincronização Supabase, geração de resumos via IA e sistema de ranking global.
* **Diagrama de Casos de Uso (UML):** Mapeamento do ator (Estudante), interações principais (Cadastrar Tópico, Sincronizar Ranking, Gerar Resumo) com `<<includes>>` e `<<extends>>`.

### Fase 2: Modelagem de Dados
* **Diagrama de Classes & DER:** Definir as entidades principais (`Usuario`, `Topico`, `ResumoIA`) com foco na arquitetura que suportará o offline (SQLite) + online (Supabase).
* **Diagrama de Objetos:** Para exemplificar o formato de um Resumo gerado e de uma pontuação de ranking.

### Fase 3: Arquitetura e Fluxos
* **Classes BCE (Boundary-Control-Entity):** Mapear as telas (Boundary), os serviços/casos de uso (Control) e as tabelas (Entity).
* **Diagrama de Sequência:** Essencial para detalhar o fluxo crítico: como o usuário aciona a IA, como o app salva localmente e como/quando sincroniza com o Supabase.
* **Diagrama de Componentes:** Clean Architecture voltada para o React Native.
