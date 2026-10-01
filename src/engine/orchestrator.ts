import { findAgentForRole, getDefaultAgents, getRoleDefinition } from './agents';
import type { LLMProvider } from './providers/LLMProvider';
import {
  EXECUTION_ROLES,
  type Agent,
  type AgentRoleId,
  type ArtifactKind,
  type LogEntry,
  type LogLevel,
  type PipelinePhase,
  type PipelineState,
  type ProjectArtifact,
  type Task,
} from './types';

/** Function that pauses between steps; injectable so tests can run with 0ms. */
export type DelayFn = (ms: number) => Promise<void>;

/** Callback invoked with a fresh snapshot after every state change. */
export type PipelineEventHandler = (state: PipelineState) => void;

export interface OrchestratorOptions {
  /** Agent roster. Defaults to {@link getDefaultAgents}. */
  agents?: Agent[];
  /** Delay implementation. Defaults to a real setTimeout-based delay. */
  delay?: DelayFn;
  /** Milliseconds to wait between steps (passed to {@link DelayFn}). */
  stepDelayMs?: number;
}

const realDelay: DelayFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Map each execution role to the kind of artifact it produces. */
const ROLE_ARTIFACT: Record<AgentRoleId, { kind: ArtifactKind; path: string }> = {
  ceo: { kind: 'plan', path: 'docs/plano.md' },
  architect: { kind: 'architecture', path: 'docs/arquitetura.md' },
  frontend: { kind: 'frontend', path: 'docs/frontend.md' },
  backend: { kind: 'backend', path: 'docs/backend.md' },
  integrator: { kind: 'integration', path: 'docs/integracao.md' },
};

/** Map an execution role to the pipeline phase while it runs. */
const ROLE_PHASE: Record<AgentRoleId, PipelinePhase> = {
  ceo: 'planning',
  architect: 'architecting',
  frontend: 'frontend',
  backend: 'backend',
  integrator: 'integrating',
};

/**
 * Orchestrates the CEO -> architect -> frontend -> backend -> integrator
 * pipeline. Framework-agnostic and deterministic when driven by a deterministic
 * provider (e.g. MockLLMProvider) with `stepDelayMs: 0`.
 */
export class Orchestrator {
  private readonly provider: LLMProvider;
  private readonly delay: DelayFn;
  private readonly stepDelayMs: number;
  private readonly initialAgents: Agent[];

  constructor(provider: LLMProvider, options: OrchestratorOptions = {}) {
    this.provider = provider;
    this.delay = options.delay ?? realDelay;
    this.stepDelayMs = options.stepDelayMs ?? 0;
    this.initialAgents = options.agents ?? getDefaultAgents();
  }

  /**
   * Run the full pipeline for a prompt. `onEvent` receives a snapshot of
   * {@link PipelineState} after every meaningful change so a UI can render live
   * progress. Resolves with the final state.
   */
  async run(prompt: string, onEvent?: PipelineEventHandler): Promise<PipelineState> {
    const state: PipelineState = {
      phase: 'idle',
      prompt,
      tasks: [],
      agents: this.initialAgents.map((a) => ({ ...a, status: 'idle' })),
      logs: [],
      artifacts: [],
      startedAt: Date.now(),
      finishedAt: undefined,
      done: false,
    };

    const emit = () => onEvent?.(cloneState(state));

    const log = (
      agentId: string,
      role: AgentRoleId,
      message: string,
      level: LogLevel = 'info',
    ) => {
      state.logs.push({
        ts: state.logs.length,
        agentId,
        role,
        message,
        level,
      });
    };

    emit();

    // ---- Phase 1: CEO decomposes the prompt into tasks per role. ----
    state.phase = 'planning';
    const ceoAgent = requireAgent(state.agents, 'ceo');
    setAgentStatus(ceoAgent, 'working', getRoleDefinition('ceo').name);
    log(ceoAgent.id, 'ceo', 'CEO analisando o prompt e dividindo as tarefas...');
    emit();
    await this.delay(this.stepDelayMs);

    const planText = await this.provider.complete({
      role: 'ceo',
      system: getRoleDefinition('ceo').systemPrompt,
      prompt,
    });
    ceoAgent.output = planText;
    addArtifact(state, 'ceo', planText);

    // Build one task per execution role, assigned to the responsible agent.
    for (const role of EXECUTION_ROLES) {
      const agent = requireAgent(state.agents, role);
      const def = getRoleDefinition(role);
      state.tasks.push({
        id: `task-${role}`,
        title: def.description,
        assignedRole: role,
        assignedAgentId: agent.id,
        status: 'idle',
      });
    }
    setAgentStatus(ceoAgent, 'done');
    log(ceoAgent.id, 'ceo', `Plano criado com ${state.tasks.length} tarefas.`, 'success');
    emit();

    // ---- Phases 2..n: each execution role runs its task. ----
    for (const role of EXECUTION_ROLES) {
      state.phase = ROLE_PHASE[role];
      const def = getRoleDefinition(role);
      const agent = requireAgent(state.agents, role);
      const task = state.tasks.find((t) => t.assignedRole === role)!;

      setAgentStatus(agent, 'working', def.description);
      task.status = 'working';
      log(agent.id, role, `${def.name} iniciando: ${def.description}`);
      emit();
      await this.delay(this.stepDelayMs);

      const output = await this.provider.complete({
        role,
        system: def.systemPrompt,
        prompt,
        context: { plan: planText, artifacts: state.artifacts },
      });

      task.result = output;
      task.status = 'done';
      agent.output = output;
      setAgentStatus(agent, 'done');
      addArtifact(state, role, output);
      log(agent.id, role, `${def.name} concluiu a tarefa.`, 'success');
      emit();
    }

    // ---- Finalize. ----
    state.phase = 'done';
    state.done = true;
    state.finishedAt = Date.now();
    const integrator = requireAgent(state.agents, 'integrator');
    log(
      integrator.id,
      'integrator',
      'Integracao finalizada: tudo funcionando.',
      'success',
    );
    emit();

    return cloneState(state);
  }
}

/** Convenience wrapper mirroring {@link Orchestrator.run}. */
export function runPipeline(
  provider: LLMProvider,
  prompt: string,
  options: OrchestratorOptions = {},
  onEvent?: PipelineEventHandler,
): Promise<PipelineState> {
  return new Orchestrator(provider, options).run(prompt, onEvent);
}

function setAgentStatus(
  agent: Agent,
  status: Agent['status'],
  currentTask?: string,
): void {
  agent.status = status;
  if (status === 'working') {
    agent.currentTask = currentTask;
  } else if (status === 'done' || status === 'error') {
    agent.currentTask = undefined;
  }
}

function addArtifact(state: PipelineState, role: AgentRoleId, content: string): void {
  const meta = ROLE_ARTIFACT[role];
  const summary = content.split('\n').find((l) => l.trim().length > 0) ?? '';
  state.artifacts.push({
    path: meta.path,
    kind: meta.kind,
    producedByRole: role,
    content,
    summary: summary.replace(/^#\s*/, '').trim(),
  });
}

function requireAgent(agents: Agent[], role: AgentRoleId): Agent {
  const agent = findAgentForRole(agents, role);
  if (!agent) {
    throw new Error(`Nenhum agente disponivel para o papel: ${role}`);
  }
  return agent;
}

/** Deep-ish clone so emitted snapshots are independent of mutable state. */
function cloneState(state: PipelineState): PipelineState {
  return {
    ...state,
    tasks: state.tasks.map((t) => ({ ...t })),
    agents: state.agents.map((a) => ({ ...a, roles: [...a.roles] })),
    logs: state.logs.map((l: LogEntry) => ({ ...l })),
    artifacts: state.artifacts.map((p: ProjectArtifact) => ({ ...p })),
  };
}
