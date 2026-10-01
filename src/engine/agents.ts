import type { Agent, AgentRoleId, RoleDefinition } from './types';

/**
 * Instrucao, compartilhada por todos os papeis, sobre COMO emitir arquivos.
 *
 * Um papel pode emitir VARIOS arquivos. Cada arquivo deve ser delimitado por
 * uma linha de cabecalho `=== FILE: caminho/do/arquivo.ext ===` seguida pelo
 * conteudo do arquivo, para que a saida do provider real seja convertida em
 * GeneratedFile[] pelo mesmo parser usado pelo mock (ver providers/fileFormat).
 */
const FILE_FORMAT_INSTRUCTIONS =
  'Voce pode emitir varios arquivos. Delimite CADA arquivo com uma linha de ' +
  'cabecalho exatamente no formato "=== FILE: caminho/do/arquivo.ext ===" e, ' +
  'logo abaixo, o conteudo do arquivo. Emita apenas os arquivos (codigo real), ' +
  'sem explicacoes fora dos arquivos.';

/**
 * Data-driven role catalog. Each role is a plain object with a name,
 * description and system prompt. Because roles are data, a single {@link Agent}
 * can reference several of them (see {@link getDefaultAgents}).
 */
export const ROLE_DEFINITIONS: Record<AgentRoleId, RoleDefinition> = {
  ceo: {
    id: 'ceo',
    name: 'IA CEO',
    description: 'Interpreta o prompt e divide o trabalho em tarefas por equipe.',
    systemPrompt:
      'Voce e o CEO de uma equipe de engenharia de software. Interprete o ' +
      'pedido do usuario e gere ARQUIVOS REAIS que estabelecem o projeto: um ' +
      'package.json valido (JSON) e um PLAN.md dividindo o trabalho em tarefas ' +
      'claras para arquiteto, front-end, back-end e integrador. ' +
      FILE_FORMAT_INSTRUCTIONS,
  },
  architect: {
    id: 'architect',
    name: 'IA Arquiteto',
    description: 'Define a arquitetura do projeto e o modelo de banco de dados.',
    systemPrompt:
      'Voce e o arquiteto de software. Gere ARQUIVOS REAIS: um esquema de ' +
      'banco de dados (ex.: db/schema.sql) e um documento de arquitetura ' +
      '(ex.: ARCHITECTURE.md) com a estrutura de pastas do projeto web. ' +
      FILE_FORMAT_INSTRUCTIONS,
  },
  frontend: {
    id: 'frontend',
    name: 'IA Front-end',
    description: 'Constroi a interface web e seus componentes.',
    systemPrompt:
      'Voce e o engenheiro de front-end. Gere ARQUIVOS REAIS da interface ' +
      '(ex.: index.html e componentes .tsx/.ts/.css) que consomem a API via ' +
      'fetch. Escreva codigo valido, nao descricoes. ' +
      FILE_FORMAT_INSTRUCTIONS,
  },
  backend: {
    id: 'backend',
    name: 'IA Back-end',
    description: 'Implementa a API e a logica de servidor.',
    systemPrompt:
      'Voce e o engenheiro de back-end. Gere ARQUIVOS REAIS do servidor e da ' +
      'API (ex.: server/index.ts e server/routes/*.ts) com os endpoints e as ' +
      'regras de negocio implementados em codigo. ' +
      FILE_FORMAT_INSTRUCTIONS,
  },
  integrator: {
    id: 'integrator',
    name: 'IA Integrador',
    description: 'Junta tudo no final e garante que o sistema esta funcionando.',
    systemPrompt:
      'Voce e o integrador. Gere ARQUIVOS REAIS de cola/configuracao (ex.: ' +
      'README.md com instrucoes de execucao e um .env.example) e inclua uma ' +
      'nota curta de verificacao confirmando que o sistema esta funcionando. ' +
      FILE_FORMAT_INSTRUCTIONS,
  },
};

/** Ordered list of all role definitions. */
export const ALL_ROLE_DEFINITIONS: RoleDefinition[] = [
  ROLE_DEFINITIONS.ceo,
  ROLE_DEFINITIONS.architect,
  ROLE_DEFINITIONS.frontend,
  ROLE_DEFINITIONS.backend,
  ROLE_DEFINITIONS.integrator,
];

/** Look up a role definition by id. */
export function getRoleDefinition(role: AgentRoleId): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

/**
 * Default roster of agents.
 *
 * Demonstrates the multi-role requirement: "Ada" acts as BOTH the CEO and the
 * final integrator (one AI with more than one function), while the other
 * agents are single-role specialists.
 */
export function getDefaultAgents(): Agent[] {
  return [
    {
      id: 'agent-ada',
      name: 'Ada',
      roles: ['ceo', 'integrator'],
      status: 'idle',
    },
    {
      id: 'agent-linus',
      name: 'Linus',
      roles: ['architect'],
      status: 'idle',
    },
    {
      id: 'agent-grace',
      name: 'Grace',
      roles: ['frontend'],
      status: 'idle',
    },
    {
      id: 'agent-dennis',
      name: 'Dennis',
      roles: ['backend'],
      status: 'idle',
    },
  ];
}

/** Find the agent in the roster responsible for a given role. */
export function findAgentForRole(agents: Agent[], role: AgentRoleId): Agent | undefined {
  return agents.find((a) => a.roles.includes(role));
}
