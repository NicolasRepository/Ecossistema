import { useCallback, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { AgentCard } from '../components/AgentCard';
import { ActivityLog } from '../components/ActivityLog';
import { PromptPanel } from '../components/PromptPanel';
import { TaskBoard } from '../components/TaskBoard';
import { getDefaultAgents } from '../engine/agents';
import { Orchestrator } from '../engine/orchestrator';
import { MockLLMProvider } from '../engine/providers/MockLLMProvider';
import { OpenAILLMProvider } from '../engine/providers/OpenAILLMProvider';
import { collectGeneratedFiles, countGeneratedFiles } from '../engine/collectFiles';
import { createZip } from '../engine/zip';
import type { LLMProvider } from '../engine/providers/LLMProvider';
import type {
  AgentRoleId,
  PipelinePhase,
  PipelineState,
  ProjectArtifact,
} from '../engine/types';

/** Modelo padrao sugerido para o provider real da OpenAI. */
const DEFAULT_MODEL = 'gpt-4o-mini';

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

/** Agrupa os artefatos por papel que os produziu (para exibir no cartao). */
function artifactsByRole(state: PipelineState): Map<AgentRoleId, ProjectArtifact[]> {
  const map = new Map<AgentRoleId, ProjectArtifact[]>();
  for (const artifact of state.artifacts) {
    const list = map.get(artifact.producedByRole) ?? [];
    list.push(artifact);
    map.set(artifact.producedByRole, list);
  }
  return map;
}

export const App: FC = () => {
  const [prompt, setPrompt] = useState('');
  // Estado em memoria e por sessao (NAO persistido em localStorage).
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [state, setState] = useState<PipelineState>(createInitialState);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const progress = useMemo(() => computeProgress(state), [state]);
  const byRole = useMemo(() => artifactsByRole(state), [state]);
  const generatedCount = useMemo(() => countGeneratedFiles(state), [state]);
  const canDownload = state.done && generatedCount > 0;

  const handleStart = useCallback(() => {
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || runningRef.current) return;

    runningRef.current = true;
    setRunning(true);
    setState({ ...createInitialState(), phase: 'planning', prompt: trimmed });

    // Selecao de provider: uma chave nao-vazia ativa o provider REAL (OpenAI)
    // sem delay; a chave vazia mantem o mock deterministico com animacao.
    const key = apiKey.trim();
    const useReal = key.length > 0;
    const provider: LLMProvider = useReal
      ? new OpenAILLMProvider(key, { model: model.trim() || DEFAULT_MODEL })
      : new MockLLMProvider();
    const orchestrator = new Orchestrator(provider, {
      stepDelayMs: useReal ? 0 : 500,
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
  }, [prompt, apiKey, model]);

  const handleReset = useCallback(() => {
    if (runningRef.current) return;
    setPrompt('');
    setState(createInitialState());
  }, []);

  const handleDownload = useCallback(() => {
    const files = collectGeneratedFiles(state);
    if (files.length === 0) return;

    const blob = createZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ecossistema-projeto.zip';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [state]);

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
        <div className="app__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleDownload}
            disabled={!canDownload}
            title={
              canDownload
                ? 'Baixa um .zip com todos os arquivos gerados'
                : 'Disponivel quando o pipeline terminar e houver arquivos gerados'
            }
          >
            Baixar projeto (.zip)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={running}
          >
            Novo projeto
          </button>
        </div>
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
        apiKey={apiKey}
        model={model}
        onPromptChange={setPrompt}
        onApiKeyChange={setApiKey}
        onModelChange={setModel}
        onStart={handleStart}
      />

      <main className="app__grid">
        <section className="panel panel--agents">
          <h2 className="panel__title">Agentes</h2>
          <div className="agent-grid">
            {state.agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                artifacts={agent.roles.flatMap((role) => byRole.get(role) ?? [])}
              />
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
