# Ecossistema

**Ecossistema** e uma pagina web que gerencia uma equipe de **agentes de IA** que,
a partir de um unico prompt, planejam e constroem um **projeto de programacao web**.
Voce descreve o que quer ("crie um app de lista de tarefas com login...") e a equipe
de agentes divide o trabalho, executa cada etapa e entrega um relatorio final de
integracao.

## Conceito: a equipe de agentes

O trabalho e organizado como um pipeline onde cada papel tem uma responsabilidade
clara:

| Papel          | Nome na UI    | Responsabilidade                                               |
| -------------- | ------------- | -------------------------------------------------------------- |
| **CEO**        | IA CEO        | Interpreta o prompt e divide o trabalho em tarefas por equipe. |
| **Arquiteto**  | IA Arquiteto  | Define a arquitetura do projeto e o modelo de banco de dados.  |
| **Front-end**  | IA Front-end  | Constroi a interface web e seus componentes.                   |
| **Back-end**   | IA Back-end   | Implementa a API e a logica de servidor.                       |
| **Integrador** | IA Integrador | Junta tudo no final e garante que o sistema esta funcionando.  |

O fluxo e: **CEO → Arquiteto → Front-end → Back-end → Integrador**.

### Uma IA pode ter mais de uma funcao

Os papeis sao **dirigidos por dados** (`src/engine/agents.ts`), entao um unico agente
pode acumular varios papeis. No elenco padrao, a agente **"Ada"** atua ao mesmo tempo
como **CEO** e como **Integrador**, enquanto os demais sao especialistas de papel
unico. Isso demonstra o requisito de que uma IA pode exercer mais de uma funcao: basta
adicionar o papel ao array `roles` do agente.

## Como rodar

Requisitos no ambiente: [Bun](https://bun.sh) (1.2.x) e TypeScript (`tsc`) disponiveis.
Nao ha etapa de `npm install` (veja a secao sobre a restricao offline abaixo).

> **Importante:** neste ambiente o `NODE_OPTIONS` precisa ser limpo em cada comando
> (o preload padrao esta quebrado). Por isso todos os comandos abaixo tem o prefixo
> `NODE_OPTIONS=`.

1. **Build** (transpila `src/main.tsx` para `dist/main.js`):

   ```sh
   NODE_OPTIONS= bun run build
   ```

2. **Servidor de desenvolvimento** (serve os arquivos estaticos offline):

   ```sh
   NODE_OPTIONS= bun run dev
   ```

3. **Abra a URL** impressa no terminal (por padrao `http://localhost:3000`).

Comandos uteis adicionais:

- `NODE_OPTIONS= bun run typecheck` — checagem de tipos com `tsc --noEmit`.
- `NODE_OPTIONS= bun test` — testes unitarios do motor de orquestracao.

## Deploy no GitHub Pages

O site e publicado como um **projeto** do GitHub Pages, servido sob o subcaminho
`https://NicolasRepository.github.io/Ecossistema/`. Tres detalhes garantem que ele
funcione tanto localmente quanto nesse subcaminho:

1. **Caminhos relativos.** O `index.html` referencia os assets de forma relativa
   (`./dist/main.js`, `./src/styles.css`) em vez de caminhos absolutos iniciando com
   `/`. Caminhos absolutos resolveriam contra a raiz do dominio e dariam 404 sob o
   subcaminho `/Ecossistema/`. As URLs `https://` do import map (esm.sh) permanecem
   absolutas, pois apontam para o CDN.
2. **`dist/main.js` versionado.** O GitHub Pages (publicando a partir de um branch)
   serve apenas arquivos commitados, entao o bundle construido e **commitado** no
   repositorio. Rode `NODE_OPTIONS= bun run build` para regenerar `dist/main.js` antes
   de commitar sempre que o codigo-fonte mudar.
3. **`.nojekyll`.** Um arquivo vazio `.nojekyll` na raiz desativa o processamento do
   Jekyll, fazendo o Pages servir os arquivos como estao.

## Restricao offline e o MockLLMProvider

Este projeto foi construido em um ambiente **sem acesso a internet em tempo de
execucao** e com o registro npm **bloqueado**. Isso tem duas consequencias:

1. **Nenhuma dependencia e instalada.** O React e o ReactDOM nao sao baixados via npm;
   eles sao carregados **pelo navegador** em tempo de execucao atraves de um
   [import map](https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap)
   no `index.html`, apontando para o CDN [esm.sh](https://esm.sh). O codigo da aplicacao
   mantem os imports de `react`/`react-dom` como **externos** no build.

2. **Nao ha chamadas a APIs reais de LLM.** Como o sandbox nao alcanca OpenAI, Anthropic
   ou similares, a aplicacao usa um **`MockLLMProvider`** deterministico
   (`src/engine/providers/MockLLMProvider.ts`): dado um papel e o prompt, ele devolve um
   texto estruturado e previsivel, sem rede e sem aleatoriedade. E isso que torna os
   testes reproduziveis e permite ver o pipeline funcionando de ponta a ponta offline.

> **O navegador precisa de internet para o import map.** Mesmo rodando o servidor
> localmente, o navegador busca o React no CDN (esm.sh) na primeira execucao. Em uma
> maquina com acesso a internet, basta abrir a URL. Sem internet no navegador, o React
> nao sera carregado.

## Ponto de extensao: plugar um backend de LLM real

A fronteira com o modelo de linguagem e isolada pela interface **`LLMProvider`**
(`src/engine/providers/LLMProvider.ts`):

```ts
export interface LLMProvider {
  name: string;
  complete(req: {
    role: AgentRoleId;
    system: string;
    prompt: string;
    context?: unknown;
  }): Promise<string>;
}
```

O `Orchestrator` (`src/engine/orchestrator.ts`) recebe um `LLMProvider` por injecao e
nao conhece nenhum detalhe de modelo. Para usar um backend real (ex.: OpenAI ou
Anthropic) quando houver acesso a rede:

1. Crie uma classe, por exemplo `OpenAILLMProvider`, que implemente `LLMProvider` e
   faca a chamada HTTP real dentro de `complete(...)`, retornando o texto gerado.
2. Troque o provider na UI em `src/ui/App.tsx`, de:

   ```ts
   new Orchestrator(new MockLLMProvider(), { stepDelayMs: 500 });
   ```

   para:

   ```ts
   new Orchestrator(new OpenAILLMProvider(apiKey), { stepDelayMs: 0 });
   ```

Nenhuma outra parte do codigo precisa mudar: toda a orquestracao, o quadro de tarefas,
os cartoes de agente e o registro de atividade continuam funcionando igual.

## Estrutura do projeto

```
index.html                         # import map (React via CDN) + #root + ./dist/main.js
.nojekyll                          # desativa o Jekyll no GitHub Pages
dist/main.js                       # bundle gerado por `bun run build` (commitado p/ Pages)
dev-server.ts                      # servidor estatico Bun (offline)
src/
  main.tsx                         # createRoot(<App/>)
  styles.css                       # layout do painel (CSS puro, sem framework)
  ui/App.tsx                       # componente raiz: prompt, fases, grid
  components/
    PromptPanel.tsx                # entrada do prompt + botao "Iniciar" + exemplos
    AgentCard.tsx                  # cartao de agente (papeis, status, tarefa, saida)
    TaskBoard.tsx                  # quadro de tarefas por papel
    ActivityLog.tsx                # registro de atividade em streaming
  engine/                          # motor independente de framework (testavel)
    types.ts                       # tipos do dominio
    agents.ts                      # elenco e definicoes de papel (dirigidos por dados)
    orchestrator.ts                # pipeline CEO -> ... -> Integrador
    providers/
      LLMProvider.ts               # interface (ponto de extensao)
      MockLLMProvider.ts           # implementacao deterministica offline
  types/react-shim.d.ts            # tipos locais do React (tsc offline sem @types)
```
