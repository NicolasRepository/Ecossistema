import type { Agent, AgentRoleId, RoleDefinition } from './types';

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
      'Voce e o CEO de uma equipe de engenharia de software. Divida o pedido ' +
      'do usuario em tarefas claras para arquiteto, front-end, back-end e integrador.',
  },
  architect: {
    id: 'architect',
    name: 'IA Arquiteto',
    description: 'Define a arquitetura do projeto e o modelo de banco de dados.',
    systemPrompt:
      'Voce e o arquiteto de software. Projete a estrutura de pastas e o ' +
      'esquema de banco de dados do projeto web.',
  },
  frontend: {
    id: 'frontend',
    name: 'IA Front-end',
    description: 'Constroi a interface web e seus componentes.',
    systemPrompt:
      'Voce e o engenheiro de front-end. Liste os componentes de UI e como ' +
      'eles consomem a API.',
  },
  backend: {
    id: 'backend',
    name: 'IA Back-end',
    description: 'Implementa a API e a logica de servidor.',
    systemPrompt:
      'Voce e o engenheiro de back-end. Especifique os endpoints da API e as ' +
      'regras de negocio.',
  },
  integrator: {
    id: 'integrator',
    name: 'IA Integrador',
    description: 'Junta tudo no final e garante que o sistema esta funcionando.',
    systemPrompt:
      'Voce e o integrador. Monte front-end e back-end juntos e produza um ' +
      'relatorio de verificacao do sistema.',
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
