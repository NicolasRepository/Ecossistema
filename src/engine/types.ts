/**
 * Core domain types for the Ecossistema agent engine.
 *
 * These types are framework-agnostic (no React) so the orchestration logic can
 * be unit-tested with `bun test` and consumed by any UI.
 */

/** The five roles an AI agent can perform in the pipeline. */
export type AgentRoleId = 'ceo' | 'architect' | 'frontend' | 'backend' | 'integrator';

/** Lifecycle status shared by agents and tasks. */
export type AgentStatus = 'idle' | 'working' | 'done' | 'error';

/** Severity level for activity-log entries. */
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

/** High-level phase of the overall pipeline run. */
export type PipelinePhase =
  | 'idle'
  | 'planning'
  | 'architecting'
  | 'frontend'
  | 'backend'
  | 'integrating'
  | 'done'
  | 'error';

/**
 * Static, data-driven definition of a role. Roles are data (not hard-coded
 * branches) so a single agent can hold several of them.
 */
export interface RoleDefinition {
  id: AgentRoleId;
  /** Human-readable name shown in the UI (pt-BR). */
  name: string;
  /** Short description of what this role is responsible for. */
  description: string;
  /** System prompt passed to the LLM provider for this role. */
  systemPrompt: string;
}

/** A worker that can hold one or more roles. */
export interface Agent {
  id: string;
  name: string;
  roles: AgentRoleId[];
  status: AgentStatus;
  /** Title of the task currently being executed, if any. */
  currentTask?: string;
  /** Latest textual output produced by the agent. */
  output?: string;
}

/** A unit of work produced by the CEO and executed by a role agent. */
export interface Task {
  id: string;
  title: string;
  assignedRole: AgentRoleId;
  assignedAgentId: string;
  status: AgentStatus;
  /** Output produced when the task completes. */
  result?: string;
}

/** A single entry in the streaming activity log. */
export interface LogEntry {
  ts: number;
  agentId: string;
  role: AgentRoleId;
  message: string;
  level: LogLevel;
}

/** Kinds of artifacts the agents can produce. */
export type ArtifactKind =
  'plan' | 'architecture' | 'frontend' | 'backend' | 'integration';

/**
 * Um unico arquivo de projeto gerado por um agente.
 *
 * Esta e a unidade autoritativa de saida: cada papel pode produzir varios
 * arquivos, cada um com seu proprio caminho e conteudo reais (codigo de
 * verdade, nao prosa). O `language` e opcional e serve apenas para dicas de
 * realce/UI (inferido da extensao quando ausente).
 */
export interface GeneratedFile {
  /** Caminho relativo do arquivo dentro do projeto gerado (ex.: src/App.tsx). */
  path: string;
  /** Conteudo textual completo do arquivo. */
  content: string;
  /** Linguagem opcional (ex.: 'ts', 'tsx', 'json') para realce na UI. */
  language?: string;
}

/**
 * A deliverable produced by an agent during the pipeline.
 *
 * A fonte de verdade e o array `files`: cada papel pode emitir VARIOS arquivos
 * reais (cada um com caminho + conteudo proprios). O campo `content` e mantido
 * por compatibilidade como uma visualizacao concatenada legivel dos arquivos.
 */
export interface ProjectArtifact {
  /** Caminho principal/representativo do artefato (primeiro arquivo). */
  path: string;
  kind: ArtifactKind;
  producedByRole: AgentRoleId;
  /** Arquivos reais produzidos por este papel (dado autoritativo). */
  files: GeneratedFile[];
  /** Previa concatenada legivel dos arquivos (compat. retroativa / UI). */
  content: string;
  /** Short one-line summary for compact UI display. */
  summary: string;
}

/** The complete, serializable state of a pipeline run. */
export interface PipelineState {
  phase: PipelinePhase;
  prompt: string;
  tasks: Task[];
  agents: Agent[];
  logs: LogEntry[];
  artifacts: ProjectArtifact[];
  startedAt?: number;
  finishedAt?: number;
  done: boolean;
}

/** Ordered sequence of execution roles after the CEO planning phase. */
export const EXECUTION_ROLES: AgentRoleId[] = [
  'architect',
  'frontend',
  'backend',
  'integrator',
];

/** All roles including the CEO, in pipeline order. */
export const ALL_ROLES: AgentRoleId[] = ['ceo', ...EXECUTION_ROLES];
