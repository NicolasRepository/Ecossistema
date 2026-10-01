# Ecossistema

**Ecossistema** e uma pagina web que gerencia uma equipe de **agentes de IA** que,
a partir de um unico prompt, planejam e constroem um **projeto de programacao web**.
Voce descreve o que quer ("crie um app de lista de tarefas com login...") e a equipe
de agentes divide o trabalho, executa cada etapa e entrega **arquivos de codigo reais**
(cada papel pode produzir varios arquivos, com caminho e conteudo proprios), que podem
ser baixados em um `.zip`.

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

## Chave de API e escolha de modelo

O painel de prompt tem dois campos (opcionais) para plugar um modelo **real**
compativel com a OpenAI:

- **Chave de API da OpenAI** (campo de senha).
- **Modelo** (padrao `gpt-4o-mini`).

Comportamento:

- **Chave preenchida** → o app usa o `OpenAILLMProvider`, que faz chamadas de rede
  reais com a sua chave e o modelo escolhido.
- **Chave vazia** → o app roda a **demo offline deterministica** com o
  `MockLLMProvider` (sem rede, reproduzivel).

> ### ⚠️ Aviso de seguranca (leia antes de colar uma chave)
>
> Este e um site **estatico e 100% client-side** (GitHub Pages). Isso significa que:
>
> - A chave fica **somente no seu navegador**, em estado de sessao em memoria. Ela
>   **NAO** e persistida (sem `localStorage`) e **NAO** e commitada em lugar nenhum do
>   repositorio.
> - Qualquer pessoa com o **DevTools** aberto na propria maquina consegue ver a chave
>   enquanto ela esta na memoria da pagina.
> - A chamada **navegador → OpenAI** pode esbarrar em **CORS**, dependendo do endpoint.
> - Para um deploy **publico/producao**, o caminho seguro e um **backend/proxy** que
>   guarde a chave no servidor e nunca a exponha ao cliente.
>
> Em resumo: use a chave aqui apenas para testes locais/pessoais; nunca comite uma
> chave e prefira um proxy de backend em producao.

## Baixar o projeto gerado (.zip)

Quando o pipeline termina e ha pelo menos um arquivo gerado, o botao
**"Baixar projeto (.zip)"** (no topo da pagina) fica habilitado. Ao clicar, o app
coleta **todos** os arquivos reais produzidos pelos agentes (preservando os caminhos,
inclusive subdiretorios como `src/App.tsx`), monta um `.zip` **inteiramente no
navegador** e dispara o download (`ecossistema-projeto.zip`).

O empacotador de ZIP e uma implementacao **sem dependencias e em repositorio**
(`src/engine/zip.ts`), do tipo *store-only* (sem compressao, metodo 0): escreve os
*local file headers*, calcula o **CRC32** por arquivo e monta o *central directory* +
*end-of-central-directory*. Como nao depende de nenhuma lib externa, funciona offline
(no sandbox e no navegador) e nao exige entradas no *import map* nem na lista de
`--external` do build.

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

2. **Chamadas a APIs reais de LLM dependem de rede.** No sandbox nao ha acesso a
   OpenAI, Anthropic ou similares, entao, por padrao (chave vazia), a aplicacao usa um
   **`MockLLMProvider`** deterministico (`src/engine/providers/MockLLMProvider.ts`):
   dado um papel e o prompt, ele devolve **arquivos** estruturados e previsiveis, sem
   rede e sem aleatoriedade. E isso que torna os testes reproduziveis e permite ver o
   pipeline funcionando de ponta a ponta offline. Quando ha uma chave de API, o
   `OpenAILLMProvider` passa a ser usado e faz as chamadas reais (veja a secao
   "Chave de API e escolha de modelo" acima).

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
nao conhece nenhum detalhe de modelo. **O provider real ja vem incluido**:
`OpenAILLMProvider` (`src/engine/providers/OpenAILLMProvider.ts`) implementa
`LLMProvider` e faz a chamada HTTP a um endpoint compativel com a OpenAI
(`/v1/chat/completions`), com autenticacao `Bearer <chave>` e modelo configuravel
(padrao `gpt-4o-mini`).

A propria UI (`src/ui/App.tsx`) ja faz a selecao do provider com base na chave digitada:

```ts
const key = apiKey.trim();
const provider = key.length > 0
  ? new OpenAILLMProvider(key, { model })      // chave preenchida → modelo real
  : new MockLLMProvider();                      // chave vazia → demo offline
new Orchestrator(provider, { stepDelayMs: key.length > 0 ? 0 : 500 });
```

Nenhuma outra parte do codigo precisa mudar: toda a orquestracao, o quadro de tarefas,
os cartoes de agente e o registro de atividade continuam funcionando igual. Lembre-se
do aviso de seguranca: a chave fica no navegador e, para producao, o recomendado e um
backend/proxy (veja a secao "Chave de API e escolha de modelo").

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
    types.ts                       # tipos do dominio (GeneratedFile, ProjectArtifact...)
    agents.ts                      # elenco e definicoes de papel (dirigidos por dados)
    orchestrator.ts                # pipeline CEO -> ... -> Integrador
    collectFiles.ts                # achata os arquivos gerados (regra de colisao)
    zip.ts                         # escritor de ZIP store-only sem dependencias
    zip.test.ts                    # testes deterministicos do escritor de ZIP
    providers/
      LLMProvider.ts               # interface (ponto de extensao)
      MockLLMProvider.ts           # implementacao deterministica offline (emite arquivos)
      OpenAILLMProvider.ts         # provider real (OpenAI); precisa de rede + chave
      fileFormat.ts                # formato delimitado + parser para GeneratedFile[]
  types/react-shim.d.ts            # tipos locais do React (tsc offline sem @types)
```
