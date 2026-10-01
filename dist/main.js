// src/main.tsx
import { createRoot } from "react-dom/client";

// src/ui/App.tsx
import { useCallback, useMemo, useRef, useState } from "react";

// src/engine/agents.ts
var ROLE_DEFINITIONS = {
  ceo: {
    id: "ceo",
    name: "IA CEO",
    description: "Interpreta o prompt e divide o trabalho em tarefas por equipe.",
    systemPrompt: "Voce e o CEO de uma equipe de engenharia de software. Divida o pedido " + "do usuario em tarefas claras para arquiteto, front-end, back-end e integrador."
  },
  architect: {
    id: "architect",
    name: "IA Arquiteto",
    description: "Define a arquitetura do projeto e o modelo de banco de dados.",
    systemPrompt: "Voce e o arquiteto de software. Projete a estrutura de pastas e o " + "esquema de banco de dados do projeto web."
  },
  frontend: {
    id: "frontend",
    name: "IA Front-end",
    description: "Constroi a interface web e seus componentes.",
    systemPrompt: "Voce e o engenheiro de front-end. Liste os componentes de UI e como " + "eles consomem a API."
  },
  backend: {
    id: "backend",
    name: "IA Back-end",
    description: "Implementa a API e a logica de servidor.",
    systemPrompt: "Voce e o engenheiro de back-end. Especifique os endpoints da API e as " + "regras de negocio."
  },
  integrator: {
    id: "integrator",
    name: "IA Integrador",
    description: "Junta tudo no final e garante que o sistema esta funcionando.",
    systemPrompt: "Voce e o integrador. Monte front-end e back-end juntos e produza um " + "relatorio de verificacao do sistema."
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
var AgentCard = ({ agent }) => {
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
      agent.output ? /* @__PURE__ */ jsxDEV("details", {
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
  onPromptChange,
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
function addArtifact(state, role, content) {
  const meta = ROLE_ARTIFACT[role];
  const summary = content.split(`
`).find((l) => l.trim().length > 0) ?? "";
  state.artifacts.push({
    path: meta.path,
    kind: meta.kind,
    producedByRole: role,
    content,
    summary: summary.replace(/^#\s*/, "").trim()
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
    const builder = RESPONSES[req.role];
    return builder(prompt);
  }
}
function projectLabel(prompt) {
  const firstLine = prompt.split(`
`)[0]?.trim() ?? "";
  if (firstLine.length === 0)
    return "Projeto Web";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}
var RESPONSES = {
  ceo: (prompt) => [
    `# Plano de Projeto (CEO)`,
    `Objetivo: ${projectLabel(prompt)}`,
    ``,
    `Divisao de tarefas por equipe:`,
    `1. [architect] Definir arquitetura e modelo de banco de dados.`,
    `2. [frontend] Construir a interface web e os componentes.`,
    `3. [backend] Implementar a API e a logica de servidor.`,
    `4. [integrator] Integrar front-end e back-end e validar o sistema.`
  ].join(`
`),
  architect: (prompt) => [
    `# Arquitetura & Banco de Dados`,
    `Projeto: ${projectLabel(prompt)}`,
    ``,
    `Estrutura de pastas sugerida:`,
    `- /src/components  (UI)`,
    `- /src/pages       (rotas)`,
    `- /server/api      (endpoints)`,
    `- /server/db       (acesso a dados)`,
    ``,
    `Esquema de banco de dados (sketch):`,
    `- users(id, name, email, created_at)`,
    `- sessions(id, user_id, token, expires_at)`,
    `- items(id, title, description, owner_id, created_at)`
  ].join(`
`),
  frontend: (prompt) => [
    `# Front-end`,
    `Projeto: ${projectLabel(prompt)}`,
    ``,
    `Lista de componentes:`,
    `- <AppShell /> layout principal`,
    `- <AuthForm /> login e cadastro`,
    `- <ItemList /> e <ItemCard /> listagem`,
    `- <ItemEditor /> formulario de criacao/edicao`,
    ``,
    `Stack: HTML + CSS + componentes React, consumindo a API via fetch.`
  ].join(`
`),
  backend: (prompt) => [
    `# Back-end / API`,
    `Projeto: ${projectLabel(prompt)}`,
    ``,
    `Endpoints da API:`,
    `- POST /api/auth/login`,
    `- POST /api/auth/register`,
    `- GET  /api/items`,
    `- POST /api/items`,
    `- PUT  /api/items/:id`,
    `- DELETE /api/items/:id`,
    ``,
    `Regras: autenticacao por token, validacao de entrada, respostas JSON.`
  ].join(`
`),
  integrator: (prompt) => [
    `# Integracao & Verificacao`,
    `Projeto: ${projectLabel(prompt)}`,
    ``,
    `Montagem final:`,
    `- Front-end conectado aos endpoints da API.`,
    `- Variaveis de ambiente e build configurados.`,
    ``,
    `Relatorio de verificacao:`,
    `- [ok] Rotas da API respondem conforme especificado.`,
    `- [ok] Interface renderiza e consome dados reais.`,
    `- [ok] Fluxo de autenticacao validado ponta a ponta.`,
    `- [ok] Build de producao concluido sem erros.`,
    `Status final: TUDO FUNCIONANDO.`
  ].join(`
`)
};

// src/ui/App.tsx
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
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
var App = () => {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState(createInitialState);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const progress = useMemo(() => computeProgress(state), [state]);
  const handleStart = useCallback(() => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || runningRef.current)
      return;
    runningRef.current = true;
    setRunning(true);
    setState({ ...createInitialState(), phase: "planning", prompt: trimmed });
    const orchestrator = new Orchestrator(new MockLLMProvider, {
      stepDelayMs: 500
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
  }, [prompt]);
  const handleReset = useCallback(() => {
    if (runningRef.current)
      return;
    setPrompt("");
    setState(createInitialState());
  }, []);
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
          /* @__PURE__ */ jsxDEV5("button", {
            type: "button",
            className: "btn btn--ghost",
            onClick: handleReset,
            disabled: running,
            children: "Novo projeto"
          }, undefined, false, undefined, this)
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
        onPromptChange: setPrompt,
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
                  agent
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
