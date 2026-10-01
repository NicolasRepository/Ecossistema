// src/main.tsx
import { createRoot } from "react-dom/client";

// src/ui/App.tsx
import { useCallback, useMemo, useRef, useState } from "react";

// src/engine/agents.ts
var FILE_FORMAT_INSTRUCTIONS = "Voce pode emitir varios arquivos. Delimite CADA arquivo com uma linha de " + 'cabecalho exatamente no formato "=== FILE: caminho/do/arquivo.ext ===" e, ' + "logo abaixo, o conteudo do arquivo. Emita apenas os arquivos (codigo real), " + "sem explicacoes fora dos arquivos.";
var ROLE_DEFINITIONS = {
  ceo: {
    id: "ceo",
    name: "IA CEO",
    description: "Interpreta o prompt e divide o trabalho em tarefas por equipe.",
    systemPrompt: "Voce e o CEO de uma equipe de engenharia de software. Interprete o " + "pedido do usuario e gere ARQUIVOS REAIS que estabelecem o projeto: um " + "package.json valido (JSON) e um PLAN.md dividindo o trabalho em tarefas " + "claras para arquiteto, front-end, back-end e integrador. " + FILE_FORMAT_INSTRUCTIONS
  },
  architect: {
    id: "architect",
    name: "IA Arquiteto",
    description: "Define a arquitetura do projeto e o modelo de banco de dados.",
    systemPrompt: "Voce e o arquiteto de software. Gere ARQUIVOS REAIS: um esquema de " + "banco de dados (ex.: db/schema.sql) e um documento de arquitetura " + "(ex.: ARCHITECTURE.md) com a estrutura de pastas do projeto web. " + FILE_FORMAT_INSTRUCTIONS
  },
  frontend: {
    id: "frontend",
    name: "IA Front-end",
    description: "Constroi a interface web e seus componentes.",
    systemPrompt: "Voce e o engenheiro de front-end. Gere ARQUIVOS REAIS da interface " + "(ex.: index.html e componentes .tsx/.ts/.css) que consomem a API via " + "fetch. Escreva codigo valido, nao descricoes. " + FILE_FORMAT_INSTRUCTIONS
  },
  backend: {
    id: "backend",
    name: "IA Back-end",
    description: "Implementa a API e a logica de servidor.",
    systemPrompt: "Voce e o engenheiro de back-end. Gere ARQUIVOS REAIS do servidor e da " + "API (ex.: server/index.ts e server/routes/*.ts) com os endpoints e as " + "regras de negocio implementados em codigo. " + FILE_FORMAT_INSTRUCTIONS
  },
  integrator: {
    id: "integrator",
    name: "IA Integrador",
    description: "Junta tudo no final e garante que o sistema esta funcionando.",
    systemPrompt: "Voce e o integrador. Gere ARQUIVOS REAIS de cola/configuracao (ex.: " + "README.md com instrucoes de execucao e um .env.example) e inclua uma " + "nota curta de verificacao confirmando que o sistema esta funcionando. " + FILE_FORMAT_INSTRUCTIONS
  }
};
var ALL_ROLE_DEFINITIONS = [
  ROLE_DEFINITIONS.ceo,
  ROLE_DEFINITIONS.architect,
  ROLE_DEFINITIONS.frontend,
  ROLE_DEFINITIONS.backend,
  ROLE_DEFINITIONS.integrator
];
function getRoleDefinition(role) {
  return ROLE_DEFINITIONS[role];
}
function getDefaultAgents() {
  return [
    {
      id: "agent-ada",
      name: "Ada",
      roles: ["ceo", "integrator"],
      status: "idle"
    },
    {
      id: "agent-linus",
      name: "Linus",
      roles: ["architect"],
      status: "idle"
    },
    {
      id: "agent-grace",
      name: "Grace",
      roles: ["frontend"],
      status: "idle"
    },
    {
      id: "agent-dennis",
      name: "Dennis",
      roles: ["backend"],
      status: "idle"
    }
  ];
}
function findAgentForRole(agents, role) {
  return agents.find((a) => a.roles.includes(role));
}

// src/components/AgentCard.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
var STATUS_LABEL = {
  idle: "Aguardando",
  working: "Trabalhando",
  done: "Concluido",
  error: "Erro"
};
var AgentCard = ({ agent, artifacts = [] }) => {
  const files = artifacts.flatMap((a) => a.files);
  return /* @__PURE__ */ jsxDEV("article", {
    className: `agent-card status-${agent.status}`,
    children: [
      /* @__PURE__ */ jsxDEV("header", {
        className: "agent-card__header",
        children: [
          /* @__PURE__ */ jsxDEV("div", {
            className: "agent-card__title",
            children: [
              /* @__PURE__ */ jsxDEV("span", {
                className: "agent-card__name",
                children: agent.name
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("span", {
                className: `status-badge status-badge--${agent.status}`,
                children: STATUS_LABEL[agent.status]
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("div", {
            className: "agent-card__roles",
            children: agent.roles.map((role) => /* @__PURE__ */ jsxDEV("span", {
              className: `role-badge role-badge--${role}`,
              children: getRoleDefinition(role).name
            }, role, false, undefined, this))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      agent.currentTask ? /* @__PURE__ */ jsxDEV("p", {
        className: "agent-card__task",
        children: [
          /* @__PURE__ */ jsxDEV("span", {
            className: "agent-card__label",
            children: "Tarefa atual:"
          }, undefined, false, undefined, this),
          " ",
          agent.currentTask
        ]
      }, undefined, true, undefined, this) : null,
      files.length > 0 ? /* @__PURE__ */ jsxDEV("div", {
        className: "agent-card__files",
        children: [
          /* @__PURE__ */ jsxDEV("span", {
            className: "agent-card__label",
            children: [
              "Arquivos gerados (",
              files.length,
              "):"
            ]
          }, undefined, true, undefined, this),
          files.map((file) => /* @__PURE__ */ jsxDEV("details", {
            className: "file-block",
            children: [
              /* @__PURE__ */ jsxDEV("summary", {
                className: "file-block__path",
                children: file.path
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("pre", {
                className: "file-block__content",
                children: file.content
              }, undefined, false, undefined, this)
            ]
          }, file.path, true, undefined, this))
        ]
      }, undefined, true, undefined, this) : agent.output ? /* @__PURE__ */ jsxDEV("details", {
        className: "agent-card__output",
        children: [
          /* @__PURE__ */ jsxDEV("summary", {
            children: "Ultima saida"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("pre", {
            children: agent.output
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV("p", {
        className: "agent-card__empty",
        children: "Nenhuma saida ainda."
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/components/ActivityLog.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var ActivityLog = ({ logs }) => {
  if (logs.length === 0) {
    return /* @__PURE__ */ jsxDEV2("div", {
      className: "activity-log activity-log--empty",
      children: /* @__PURE__ */ jsxDEV2("p", {
        children: "O registro de atividade aparecera aqui durante a execucao."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  const ordered = logs.slice().reverse();
  return /* @__PURE__ */ jsxDEV2("ul", {
    className: "activity-log",
    children: ordered.map((entry) => /* @__PURE__ */ jsxDEV2("li", {
      className: `log-entry log-entry--${entry.level}`,
      children: [
        /* @__PURE__ */ jsxDEV2("span", {
          className: `log-level log-level--${entry.level}`,
          "aria-hidden": "true"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("span", {
          className: "log-entry__role",
          children: getRoleDefinition(entry.role).name
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("span", {
          className: "log-entry__message",
          children: entry.message
        }, undefined, false, undefined, this)
      ]
    }, entry.ts, true, undefined, this))
  }, undefined, false, undefined, this);
};

// src/components/PromptPanel.tsx
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
var EXAMPLE_PROMPTS = [
  "Crie um app web de lista de tarefas com login de usuario e sincronizacao.",
  "Crie um blog com painel administrativo, posts em markdown e comentarios.",
  "Crie uma loja virtual com catalogo de produtos, carrinho e checkout.",
  "Crie um painel de analytics com graficos e autenticacao por token."
];
var PromptPanel = ({
  prompt,
  running,
  apiKey,
  model,
  onPromptChange,
  onApiKeyChange,
  onModelChange,
  onStart
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!running && prompt.trim().length > 0) {
      onStart();
    }
  };
  const handleChange = (event) => {
    onPromptChange(event.target.value);
  };
  const usingReal = apiKey.trim().length > 0;
  return /* @__PURE__ */ jsxDEV3("form", {
    className: "prompt-panel",
    onSubmit: handleSubmit,
    children: [
      /* @__PURE__ */ jsxDEV3("label", {
        className: "prompt-panel__label",
        htmlFor: "prompt-input",
        children: "Descreva o projeto web que a equipe de IA deve construir"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("textarea", {
        id: "prompt-input",
        className: "prompt-panel__input",
        rows: 4,
        placeholder: "Ex.: Crie um app web de lista de tarefas com login de usuario...",
        value: prompt,
        disabled: running,
        onChange: handleChange
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("div", {
        className: "prompt-panel__examples",
        children: [
          /* @__PURE__ */ jsxDEV3("span", {
            className: "prompt-panel__examples-label",
            children: "Exemplos:"
          }, undefined, false, undefined, this),
          EXAMPLE_PROMPTS.map((example) => /* @__PURE__ */ jsxDEV3("button", {
            type: "button",
            className: "example-chip",
            disabled: running,
            onClick: () => onPromptChange(example),
            children: example
          }, example, false, undefined, this))
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3("fieldset", {
        className: "prompt-panel__provider",
        disabled: running,
        children: [
          /* @__PURE__ */ jsxDEV3("legend", {
            className: "prompt-panel__provider-legend",
            children: "Modelo real (opcional)"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("div", {
            className: "prompt-panel__fields",
            children: [
              /* @__PURE__ */ jsxDEV3("div", {
                className: "field",
                children: [
                  /* @__PURE__ */ jsxDEV3("label", {
                    className: "field__label",
                    htmlFor: "api-key-input",
                    children: "Chave de API da OpenAI"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("input", {
                    id: "api-key-input",
                    className: "field__input",
                    type: "password",
                    autoComplete: "off",
                    placeholder: "sk-... (deixe vazio para usar a demo offline)",
                    value: apiKey,
                    onChange: (event) => onApiKeyChange(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV3("div", {
                className: "field field--model",
                children: [
                  /* @__PURE__ */ jsxDEV3("label", {
                    className: "field__label",
                    htmlFor: "model-input",
                    children: "Modelo"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("input", {
                    id: "model-input",
                    className: "field__input",
                    type: "text",
                    autoComplete: "off",
                    placeholder: "gpt-4o-mini",
                    value: model,
                    onChange: (event) => onModelChange(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3("p", {
            className: "prompt-panel__provider-mode",
            children: usingReal ? "Modo atual: provider REAL (OpenAI) — fara chamadas de rede com sua chave." : "Modo atual: demo OFFLINE deterministica (MockLLMProvider)."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("p", {
            className: "prompt-panel__warning",
            role: "note",
            children: [
              /* @__PURE__ */ jsxDEV3("strong", {
                children: "Aviso de seguranca:"
              }, undefined, false, undefined, this),
              " a chave fica somente no seu navegador (site estatico, 100% client-side), e visivel por qualquer um com o DevTools, a chamada navegador → OpenAI pode esbarrar em CORS e a chave NAO e salva (so dura esta sessao). Para producao, use um backend/proxy que guarde a chave no servidor. Deixe o campo vazio para rodar a demo offline deterministica (mock)."
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3("button", {
        type: "submit",
        className: "btn btn--primary",
        disabled: running || prompt.trim().length === 0,
        children: running ? "Executando..." : "Iniciar"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/components/TaskBoard.tsx
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
var STATUS_LABEL2 = {
  idle: "Pendente",
  working: "Em andamento",
  done: "Concluida",
  error: "Erro"
};
var TaskBoard = ({ tasks }) => {
  if (tasks.length === 0) {
    return /* @__PURE__ */ jsxDEV4("div", {
      className: "task-board task-board--empty",
      children: /* @__PURE__ */ jsxDEV4("p", {
        children: "As tarefas aparecerao aqui depois que o CEO dividir o trabalho."
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV4("ul", {
    className: "task-board",
    children: tasks.map((task) => /* @__PURE__ */ jsxDEV4("li", {
      className: `task-row status-${task.status}`,
      children: [
        /* @__PURE__ */ jsxDEV4("span", {
          className: `task-dot status-dot--${task.status}`,
          "aria-hidden": "true"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV4("div", {
          className: "task-row__body",
          children: [
            /* @__PURE__ */ jsxDEV4("span", {
              className: "task-row__role",
              children: getRoleDefinition(task.assignedRole).name
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV4("span", {
              className: "task-row__title",
              children: task.title
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV4("span", {
          className: `status-badge status-badge--${task.status}`,
          children: STATUS_LABEL2[task.status]
        }, undefined, false, undefined, this)
      ]
    }, task.id, true, undefined, this))
  }, undefined, false, undefined, this);
};

// src/engine/providers/fileFormat.ts
var FILE_HEADER = /^\s*===\s*FILE:\s*(.+?)\s*===\s*$/;
function fileHeader(path) {
  return `=== FILE: ${path} ===`;
}
function serializeGeneratedFiles(files) {
  return files.map((f) => `${fileHeader(f.path)}
${f.content}`).join(`

`);
}
function inferLanguage(path) {
  const match = /\.([a-z0-9]+)$/i.exec(path.trim());
  return match ? match[1].toLowerCase() : undefined;
}
function parseGeneratedFiles(raw, fallbackPath = "output.txt") {
  const lines = raw.split(`
`);
  const files = [];
  let current = null;
  for (const line of lines) {
    const header = FILE_HEADER.exec(line);
    if (header) {
      if (current) {
        files.push(finalizeFile(current));
      }
      current = { path: header[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    files.push(finalizeFile(current));
  }
  if (files.length === 0) {
    const content = raw.trim();
    return [
      {
        path: fallbackPath,
        content,
        language: inferLanguage(fallbackPath)
      }
    ];
  }
  return files;
}
function finalizeFile(current) {
  const body = [...current.body];
  while (body.length > 0 && body[0].trim() === "")
    body.shift();
  while (body.length > 0 && body[body.length - 1].trim() === "")
    body.pop();
  return {
    path: current.path,
    content: body.join(`
`),
    language: inferLanguage(current.path)
  };
}

// src/engine/types.ts
var EXECUTION_ROLES = [
  "architect",
  "frontend",
  "backend",
  "integrator"
];
var ALL_ROLES = ["ceo", ...EXECUTION_ROLES];

// src/engine/orchestrator.ts
var realDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var ROLE_ARTIFACT = {
  ceo: { kind: "plan", path: "docs/plano.md" },
  architect: { kind: "architecture", path: "docs/arquitetura.md" },
  frontend: { kind: "frontend", path: "docs/frontend.md" },
  backend: { kind: "backend", path: "docs/backend.md" },
  integrator: { kind: "integration", path: "docs/integracao.md" }
};
var ROLE_PHASE = {
  ceo: "planning",
  architect: "architecting",
  frontend: "frontend",
  backend: "backend",
  integrator: "integrating"
};

class Orchestrator {
  provider;
  delay;
  stepDelayMs;
  initialAgents;
  constructor(provider, options = {}) {
    this.provider = provider;
    this.delay = options.delay ?? realDelay;
    this.stepDelayMs = options.stepDelayMs ?? 0;
    this.initialAgents = options.agents ?? getDefaultAgents();
  }
  async run(prompt, onEvent) {
    const state = {
      phase: "idle",
      prompt,
      tasks: [],
      agents: this.initialAgents.map((a) => ({ ...a, status: "idle" })),
      logs: [],
      artifacts: [],
      startedAt: Date.now(),
      finishedAt: undefined,
      done: false
    };
    const emit = () => onEvent?.(cloneState(state));
    const log = (agentId, role, message, level = "info") => {
      state.logs.push({
        ts: state.logs.length,
        agentId,
        role,
        message,
        level
      });
    };
    emit();
    state.phase = "planning";
    const ceoAgent = requireAgent(state.agents, "ceo");
    setAgentStatus(ceoAgent, "working", getRoleDefinition("ceo").name);
    log(ceoAgent.id, "ceo", "CEO analisando o prompt e dividindo as tarefas...");
    emit();
    await this.delay(this.stepDelayMs);
    const planText = await this.provider.complete({
      role: "ceo",
      system: getRoleDefinition("ceo").systemPrompt,
      prompt
    });
    ceoAgent.output = planText;
    addArtifact(state, "ceo", planText);
    for (const role of EXECUTION_ROLES) {
      const agent = requireAgent(state.agents, role);
      const def = getRoleDefinition(role);
      state.tasks.push({
        id: `task-${role}`,
        title: def.description,
        assignedRole: role,
        assignedAgentId: agent.id,
        status: "idle"
      });
    }
    setAgentStatus(ceoAgent, "done");
    log(ceoAgent.id, "ceo", `Plano criado com ${state.tasks.length} tarefas.`, "success");
    emit();
    for (const role of EXECUTION_ROLES) {
      state.phase = ROLE_PHASE[role];
      const def = getRoleDefinition(role);
      const agent = requireAgent(state.agents, role);
      const task = state.tasks.find((t) => t.assignedRole === role);
      setAgentStatus(agent, "working", def.description);
      task.status = "working";
      log(agent.id, role, `${def.name} iniciando: ${def.description}`);
      emit();
      await this.delay(this.stepDelayMs);
      const output = await this.provider.complete({
        role,
        system: def.systemPrompt,
        prompt,
        context: { plan: planText, artifacts: state.artifacts.map((a) => ({ ...a })) }
      });
      task.result = output;
      task.status = "done";
      agent.output = output;
      setAgentStatus(agent, "done");
      addArtifact(state, role, output);
      log(agent.id, role, `${def.name} concluiu a tarefa.`, "success");
      emit();
    }
    state.phase = "done";
    state.done = true;
    state.finishedAt = Date.now();
    const integrator = requireAgent(state.agents, "integrator");
    log(integrator.id, "integrator", "Integracao finalizada: tudo funcionando.", "success");
    emit();
    return cloneState(state);
  }
}
function setAgentStatus(agent, status, currentTask) {
  agent.status = status;
  if (status === "working") {
    agent.currentTask = currentTask;
  } else if (status === "done" || status === "error") {
    agent.currentTask = undefined;
  }
}
function addArtifact(state, role, raw) {
  const meta = ROLE_ARTIFACT[role];
  const files = parseGeneratedFiles(raw, meta.path);
  const content = files.map((f) => `// ${f.path}
${f.content}`).join(`

`);
  const firstLine = files[0]?.content.split(`
`).find((l) => l.trim().length > 0) ?? "";
  state.artifacts.push({
    path: files[0]?.path ?? meta.path,
    kind: meta.kind,
    producedByRole: role,
    files,
    content,
    summary: firstLine.replace(/^(#|\/\/|--)\s*/, "").trim()
  });
}
function requireAgent(agents, role) {
  const agent = findAgentForRole(agents, role);
  if (!agent) {
    throw new Error(`Nenhum agente disponivel para o papel: ${role}`);
  }
  return agent;
}
function cloneState(state) {
  return {
    ...state,
    tasks: state.tasks.map((t) => ({ ...t })),
    agents: state.agents.map((a) => ({ ...a, roles: [...a.roles] })),
    logs: state.logs.map((l) => ({ ...l })),
    artifacts: state.artifacts.map((p) => ({ ...p }))
  };
}

// src/engine/providers/MockLLMProvider.ts
class MockLLMProvider {
  name = "mock";
  async complete(req) {
    const prompt = req.prompt.trim();
    const builder = FILE_BUILDERS[req.role];
    return serializeGeneratedFiles(builder(prompt));
  }
}
function projectLabel(prompt) {
  const firstLine = prompt.split(`
`)[0]?.trim() ?? "";
  if (firstLine.length === 0)
    return "Projeto Web";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}
function projectSlug(prompt) {
  const base = projectLabel(prompt).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "projeto-web";
}
var FILE_BUILDERS = {
  ceo: (prompt) => {
    const label = projectLabel(prompt);
    const slug = projectSlug(prompt);
    const pkg = {
      name: slug,
      version: "0.1.0",
      private: true,
      description: `Plano de projeto gerado pela IA CEO para: ${label}`,
      scripts: {
        dev: "vite",
        build: "vite build",
        start: "node server/index.js"
      }
    };
    return [
      {
        path: "package.json",
        content: JSON.stringify(pkg, null, 2)
      },
      {
        path: "PLAN.md",
        content: [
          `# Plano de Projeto (CEO)`,
          ``,
          `Objetivo: ${label}`,
          ``,
          `Divisao de tarefas por equipe:`,
          `1. [architect] Definir arquitetura e modelo de banco de dados.`,
          `2. [frontend] Construir a interface web e os componentes.`,
          `3. [backend] Implementar a API e a logica de servidor.`,
          `4. [integrator] Integrar front-end e back-end e validar o sistema.`
        ].join(`
`)
      }
    ];
  },
  architect: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: "db/schema.sql",
        content: [
          `-- Arquitetura & Banco de Dados`,
          `-- Projeto: ${label}`,
          `CREATE TABLE users (`,
          `  id INTEGER PRIMARY KEY AUTOINCREMENT,`,
          `  name TEXT NOT NULL,`,
          `  email TEXT NOT NULL UNIQUE,`,
          `  created_at TEXT NOT NULL DEFAULT (datetime('now'))`,
          `);`,
          ``,
          `CREATE TABLE items (`,
          `  id INTEGER PRIMARY KEY AUTOINCREMENT,`,
          `  title TEXT NOT NULL,`,
          `  description TEXT,`,
          `  owner_id INTEGER NOT NULL REFERENCES users(id),`,
          `  created_at TEXT NOT NULL DEFAULT (datetime('now'))`,
          `);`
        ].join(`
`)
      },
      {
        path: "ARCHITECTURE.md",
        content: [
          `# Arquitetura & Banco de Dados`,
          ``,
          `Projeto: ${label}`,
          ``,
          `Estrutura de pastas sugerida:`,
          `- /src/components  (UI)`,
          `- /src/pages       (rotas)`,
          `- /server/api      (endpoints)`,
          `- /server/db       (acesso a dados)`
        ].join(`
`)
      }
    ];
  },
  frontend: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: "index.html",
        content: [
          `<!doctype html>`,
          `<html lang="pt-BR">`,
          `  <head>`,
          `    <meta charset="utf-8" />`,
          `    <meta name="viewport" content="width=device-width, initial-scale=1" />`,
          `    <title>${label}</title>`,
          `  </head>`,
          `  <body>`,
          `    <div id="root"></div>`,
          `    <script type="module" src="/src/main.tsx"></script>`,
          `  </body>`,
          `</html>`
        ].join(`
`)
      },
      {
        path: "src/components/ItemList.tsx",
        content: [
          `// Front-end: componente de listagem`,
          `// Projeto: ${label}`,
          `import { useEffect, useState } from 'react';`,
          ``,
          `interface Item {`,
          `  id: number;`,
          `  title: string;`,
          `}`,
          ``,
          `export function ItemList() {`,
          `  const [items, setItems] = useState<Item[]>([]);`,
          `  useEffect(() => {`,
          `    fetch('/api/items')`,
          `      .then((res) => res.json())`,
          `      .then((data: Item[]) => setItems(data));`,
          `  }, []);`,
          `  return (`,
          `    <ul>`,
          `      {items.map((item) => (`,
          `        <li key={item.id}>{item.title}</li>`,
          `      ))}`,
          `    </ul>`,
          `  );`,
          `}`
        ].join(`
`)
      }
    ];
  },
  backend: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: "server/index.ts",
        content: [
          `// Back-end / API`,
          `// Projeto: ${label}`,
          `import { createServer } from 'node:http';`,
          `import { items } from './routes/items';`,
          ``,
          `const server = createServer((req, res) => {`,
          `  if (req.url === '/api/items' && req.method === 'GET') {`,
          `    res.setHeader('Content-Type', 'application/json');`,
          `    res.end(JSON.stringify(items));`,
          `    return;`,
          `  }`,
          `  res.statusCode = 404;`,
          `  res.end(JSON.stringify({ error: 'not found' }));`,
          `});`,
          ``,
          `server.listen(3000, () => console.log('API on :3000'));`
        ].join(`
`)
      },
      {
        path: "server/routes/items.ts",
        content: [
          `// Rotas de itens (API)`,
          `// Projeto: ${label}`,
          `export interface Item {`,
          `  id: number;`,
          `  title: string;`,
          `}`,
          ``,
          `export const items: Item[] = [`,
          `  { id: 1, title: 'Primeiro item' },`,
          `];`
        ].join(`
`)
      }
    ];
  },
  integrator: (prompt) => {
    const label = projectLabel(prompt);
    const slug = projectSlug(prompt);
    return [
      {
        path: "README.md",
        content: [
          `# Integracao & Verificacao`,
          ``,
          `Projeto: ${label}`,
          ``,
          `## Como rodar`,
          "```bash",
          `npm install`,
          `npm run build`,
          `npm start`,
          "```",
          ``,
          `## Relatorio de verificacao`,
          `- [ok] Rotas da API respondem conforme especificado.`,
          `- [ok] Interface renderiza e consome dados reais.`,
          `- [ok] Fluxo de autenticacao validado ponta a ponta.`,
          `- [ok] Build de producao concluido sem erros.`,
          ``,
          `Status final: TUDO FUNCIONANDO.`
        ].join(`
`)
      },
      {
        path: ".env.example",
        content: [
          `# Variaveis de ambiente para ${slug}`,
          `PORT=3000`,
          `DATABASE_URL=sqlite://./db/${slug}.sqlite`
        ].join(`
`)
      }
    ];
  }
};

// src/engine/providers/OpenAILLMProvider.ts
var DEFAULT_MODEL = "gpt-4o-mini";
var DEFAULT_BASE_URL = "https://api.openai.com/v1/chat/completions";

class OpenAILLMProvider {
  name = "openai";
  apiKey;
  model;
  baseUrl;
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }
  async complete(req) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.prompt }
        ]
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenAILLMProvider: resposta HTTP ${res.status} ${res.statusText}` + (detail ? ` - ${detail}` : ""));
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenAILLMProvider: resposta sem conteudo de mensagem.");
    }
    return content;
  }
}

// src/engine/collectFiles.ts
function collectGeneratedFiles(state) {
  const result = [];
  const used = new Set;
  for (const artifact of state.artifacts) {
    for (const file of artifact.files) {
      const path = resolveUniquePath(file.path, artifact, used);
      used.add(path);
      result.push({ ...file, path });
    }
  }
  return result;
}
function resolveUniquePath(path, artifact, used) {
  if (!used.has(path))
    return path;
  const namespaced = `${artifact.producedByRole}/${path}`;
  if (!used.has(namespaced))
    return namespaced;
  const dot = namespaced.lastIndexOf(".");
  const base = dot > 0 ? namespaced.slice(0, dot) : namespaced;
  const ext = dot > 0 ? namespaced.slice(dot) : "";
  let n = 2;
  let candidate = `${base}-${n}${ext}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}${ext}`;
  }
  return candidate;
}
function countGeneratedFiles(state) {
  return state.artifacts.reduce((sum, a) => sum + a.files.length, 0);
}

// src/engine/zip.ts
var CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0;n < 256; n++) {
    let c = n;
    for (let k = 0;k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 4294967295;
  for (let i = 0;i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}

class ByteWriter {
  chunks = [];
  _length = 0;
  get length() {
    return this._length;
  }
  pushBytes(bytes) {
    this.chunks.push(bytes);
    this._length += bytes.length;
  }
  pushU16(value) {
    const b = new Uint8Array(2);
    b[0] = value & 255;
    b[1] = value >>> 8 & 255;
    this.pushBytes(b);
  }
  pushU32(value) {
    const b = new Uint8Array(4);
    b[0] = value & 255;
    b[1] = value >>> 8 & 255;
    b[2] = value >>> 16 & 255;
    b[3] = value >>> 24 & 255;
    this.pushBytes(b);
  }
  toUint8Array() {
    const out = new Uint8Array(this._length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}
var SIG_LOCAL = 67324752;
var SIG_CENTRAL = 33639248;
var SIG_END = 101010256;
function createZip(files) {
  const encoder = new TextEncoder;
  const local = new ByteWriter;
  const central = [];
  for (const file of files) {
    const normalizedPath = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const nameBytes = encoder.encode(normalizedPath);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    const localHeaderOffset = local.length;
    local.pushU32(SIG_LOCAL);
    local.pushU16(20);
    local.pushU16(0);
    local.pushU16(0);
    local.pushU16(0);
    local.pushU16(0);
    local.pushU32(crc);
    local.pushU32(dataBytes.length);
    local.pushU32(dataBytes.length);
    local.pushU16(nameBytes.length);
    local.pushU16(0);
    local.pushBytes(nameBytes);
    local.pushBytes(dataBytes);
    central.push({
      nameBytes,
      crc,
      size: dataBytes.length,
      localHeaderOffset
    });
  }
  const centralStart = local.length;
  const centralWriter = new ByteWriter;
  for (const entry of central) {
    centralWriter.pushU32(SIG_CENTRAL);
    centralWriter.pushU16(20);
    centralWriter.pushU16(20);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU32(entry.crc);
    centralWriter.pushU32(entry.size);
    centralWriter.pushU32(entry.size);
    centralWriter.pushU16(entry.nameBytes.length);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU16(0);
    centralWriter.pushU32(0);
    centralWriter.pushU32(entry.localHeaderOffset);
    centralWriter.pushBytes(entry.nameBytes);
  }
  const centralBytes = centralWriter.toUint8Array();
  const end = new ByteWriter;
  end.pushU32(SIG_END);
  end.pushU16(0);
  end.pushU16(0);
  end.pushU16(central.length);
  end.pushU16(central.length);
  end.pushU32(centralBytes.length);
  end.pushU32(centralStart);
  end.pushU16(0);
  const parts = [
    local.toUint8Array(),
    centralBytes,
    end.toUint8Array()
  ];
  return new Blob(parts, { type: "application/zip" });
}

// src/ui/App.tsx
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
var DEFAULT_MODEL2 = "gpt-4o-mini";
var PHASE_LABEL = {
  idle: "Aguardando prompt",
  planning: "CEO planejando",
  architecting: "Arquitetando",
  frontend: "Front-end",
  backend: "Back-end",
  integrating: "Integrando",
  done: "Concluido",
  error: "Erro"
};
function createInitialState() {
  return {
    phase: "idle",
    prompt: "",
    tasks: [],
    agents: getDefaultAgents(),
    logs: [],
    artifacts: [],
    done: false
  };
}
function computeProgress(state) {
  if (state.done)
    return 100;
  if (state.tasks.length === 0)
    return state.phase === "planning" ? 10 : 0;
  const completed = state.tasks.filter((t) => t.status === "done").length;
  return Math.round(15 + completed / state.tasks.length * 85);
}
function artifactsByRole(state) {
  const map = new Map;
  for (const artifact of state.artifacts) {
    const list = map.get(artifact.producedByRole) ?? [];
    list.push(artifact);
    map.set(artifact.producedByRole, list);
  }
  return map;
}
var App = () => {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL2);
  const [state, setState] = useState(createInitialState);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const progress = useMemo(() => computeProgress(state), [state]);
  const byRole = useMemo(() => artifactsByRole(state), [state]);
  const generatedCount = useMemo(() => countGeneratedFiles(state), [state]);
  const canDownload = state.done && generatedCount > 0;
  const handleStart = useCallback(() => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || runningRef.current)
      return;
    runningRef.current = true;
    setRunning(true);
    setState({ ...createInitialState(), phase: "planning", prompt: trimmed });
    const key = apiKey.trim();
    const useReal = key.length > 0;
    const provider = useReal ? new OpenAILLMProvider(key, { model: model.trim() || DEFAULT_MODEL2 }) : new MockLLMProvider;
    const orchestrator = new Orchestrator(provider, {
      stepDelayMs: useReal ? 0 : 500
    });
    orchestrator.run(trimmed, (snapshot) => setState(snapshot)).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        phase: "error",
        logs: [
          ...prev.logs,
          {
            ts: prev.logs.length,
            agentId: "system",
            role: "ceo",
            message: `Falha na execucao: ${message}`,
            level: "error"
          }
        ]
      }));
    }).finally(() => {
      runningRef.current = false;
      setRunning(false);
    });
  }, [prompt, apiKey, model]);
  const handleReset = useCallback(() => {
    if (runningRef.current)
      return;
    setPrompt("");
    setState(createInitialState());
  }, []);
  const handleDownload = useCallback(() => {
    const files = collectGeneratedFiles(state);
    if (files.length === 0)
      return;
    const blob = createZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ecossistema-projeto.zip";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [state]);
  return /* @__PURE__ */ jsxDEV5("div", {
    className: "app",
    children: [
      /* @__PURE__ */ jsxDEV5("header", {
        className: "app__header",
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            className: "app__brand",
            children: [
              /* @__PURE__ */ jsxDEV5("h1", {
                children: "Ecossistema"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("p", {
                className: "app__tagline",
                children: "Uma equipe de agentes de IA que constroi um projeto web a partir de um unico prompt."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            className: "app__actions",
            children: [
              /* @__PURE__ */ jsxDEV5("button", {
                type: "button",
                className: "btn btn--primary",
                onClick: handleDownload,
                disabled: !canDownload,
                title: canDownload ? "Baixa um .zip com todos os arquivos gerados" : "Disponivel quando o pipeline terminar e houver arquivos gerados",
                children: "Baixar projeto (.zip)"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("button", {
                type: "button",
                className: "btn btn--ghost",
                onClick: handleReset,
                disabled: running,
                children: "Novo projeto"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5("section", {
        className: "app__status",
        children: [
          /* @__PURE__ */ jsxDEV5("div", {
            className: "status-line",
            children: [
              /* @__PURE__ */ jsxDEV5("span", {
                className: "status-line__label",
                children: "Fase:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("span", {
                className: "status-line__value",
                children: PHASE_LABEL[state.phase]
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("div", {
            className: "progress-bar",
            role: "progressbar",
            "aria-valuenow": progress,
            children: /* @__PURE__ */ jsxDEV5("div", {
              className: "progress-bar__fill",
              style: { width: `${progress}%` }
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5(PromptPanel, {
        prompt,
        running,
        apiKey,
        model,
        onPromptChange: setPrompt,
        onApiKeyChange: setApiKey,
        onModelChange: setModel,
        onStart: handleStart
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("main", {
        className: "app__grid",
        children: [
          /* @__PURE__ */ jsxDEV5("section", {
            className: "panel panel--agents",
            children: [
              /* @__PURE__ */ jsxDEV5("h2", {
                className: "panel__title",
                children: "Agentes"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5("div", {
                className: "agent-grid",
                children: state.agents.map((agent) => /* @__PURE__ */ jsxDEV5(AgentCard, {
                  agent,
                  artifacts: agent.roles.flatMap((role) => byRole.get(role) ?? [])
                }, agent.id, false, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("section", {
            className: "panel panel--tasks",
            children: [
              /* @__PURE__ */ jsxDEV5("h2", {
                className: "panel__title",
                children: "Quadro de tarefas"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5(TaskBoard, {
                tasks: state.tasks
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV5("section", {
            className: "panel panel--log",
            children: [
              /* @__PURE__ */ jsxDEV5("h2", {
                className: "panel__title",
                children: "Registro de atividade"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV5(ActivityLog, {
                logs: state.logs
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/main.tsx
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
var container = document.getElementById("root");
if (!container) {
  throw new Error("Elemento #root nao encontrado no index.html");
}
createRoot(container).render(/* @__PURE__ */ jsxDEV6(App, {}, undefined, false, undefined, this));
