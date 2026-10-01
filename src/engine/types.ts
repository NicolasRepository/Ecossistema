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

/** A deliverable produced by an agent during the pipeline. */
export interface ProjectArtifact {
  path: string;
  kind: ArtifactKind;
  producedByRole: AgentRoleId;
  /** Full generated content (mock text in the offline engine). */
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
