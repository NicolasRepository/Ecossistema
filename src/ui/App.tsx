import { useCallback, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { AgentCard } from '../components/AgentCard';
import { ActivityLog } from '../components/ActivityLog';
import { PromptPanel } from '../components/PromptPanel';
import { TaskBoard } from '../components/TaskBoard';
import { getDefaultAgents } from '../engine/agents';
import { Orchestrator } from '../engine/orchestrator';
import { MockLLMProvider } from '../engine/providers/MockLLMProvider';
import type { PipelinePhase, PipelineState } from '../engine/types';

/** Rotulo em pt-BR para cada fase do pipeline. */
const PHASE_LABEL: Record<PipelinePhase, string> = {
  idle: 'Aguardando prompt',
  planning: 'CEO planejando',
  architecting: 'Arquitetando',
  frontend: 'Front-end',
  backend: 'Back-end',
  integrating: 'Integrando',
  done: 'Concluido',
  error: 'Erro',
};

/** Estado inicial: agentes ociosos, sem tarefas nem logs. */
function createInitialState(): PipelineState {
  return {
    phase: 'idle',
    prompt: '',
    tasks: [],
    agents: getDefaultAgents(),
    logs: [],
    artifacts: [],
    done: false,
  };
}

/** Progresso aproximado (0..100) com base nas tarefas concluidas. */
function computeProgress(state: PipelineState): number {
  if (state.done) return 100;
  if (state.tasks.length === 0) return state.phase === 'planning' ? 10 : 0;
  const completed = state.tasks.filter((t) => t.status === 'done').length;
  // Reserva ~15% para a fase de planejamento do CEO.
  return Math.round(15 + (completed / state.tasks.length) * 85);
}

export const App: FC = () => {
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<PipelineState>(createInitialState);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const progress = useMemo(() => computeProgress(state), [state]);

  const handleStart = useCallback(() => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || runningRef.current) return;

    runningRef.current = true;
    setRunning(true);
    setState({ ...createInitialState(), phase: 'planning', prompt: trimmed });

    // stepDelayMs faz o progresso animar no navegador (nos testes o delay e 0).
    const orchestrator = new Orchestrator(new MockLLMProvider(), {
      stepDelayMs: 500,
    });

    orchestrator
      .run(trimmed, (snapshot) => setState(snapshot))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setState((prev) => ({
          ...prev,
          phase: 'error',
          logs: [
            ...prev.logs,
            {
              ts: prev.logs.length,
              agentId: 'system',
              role: 'ceo',
              message: `Falha na execucao: ${message}`,
              level: 'error',
            },
          ],
        }));
      })
      .finally(() => {
        runningRef.current = false;
        setRunning(false);
      });
  }, [prompt]);

  const handleReset = useCallback(() => {
    if (runningRef.current) return;
    setPrompt('');
    setState(createInitialState());
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1>Ecossistema</h1>
          <p className="app__tagline">
            Uma equipe de agentes de IA que constroi um projeto web a partir de um unico
            prompt.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleReset}
          disabled={running}
        >
          Novo projeto
        </button>
      </header>

      <section className="app__status">
        <div className="status-line">
          <span className="status-line__label">Fase:</span>
          <span className="status-line__value">{PHASE_LABEL[state.phase]}</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={progress}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <PromptPanel
        prompt={prompt}
        running={running}
        onPromptChange={setPrompt}
        onStart={handleStart}
      />

      <main className="app__grid">
        <section className="panel panel--agents">
          <h2 className="panel__title">Agentes</h2>
          <div className="agent-grid">
            {state.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        <section className="panel panel--tasks">
          <h2 className="panel__title">Quadro de tarefas</h2>
          <TaskBoard tasks={state.tasks} />
        </section>

        <section className="panel panel--log">
          <h2 className="panel__title">Registro de atividade</h2>
          <ActivityLog logs={state.logs} />
        </section>
      </main>
    </div>
  );
};
