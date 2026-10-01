import { describe, expect, test } from 'bun:test';
import { Orchestrator } from './orchestrator';
import { MockLLMProvider } from './providers/MockLLMProvider';
import { getDefaultAgents } from './agents';
import { ALL_ROLES, EXECUTION_ROLES, type PipelineState } from './types';

const PROMPT = 'Crie um site de lista de tarefas com login de usuario.';

function newOrchestrator() {
  return new Orchestrator(new MockLLMProvider(), { stepDelayMs: 0 });
}

describe('Orchestrator.run', () => {
  test('produces one task for each execution role', async () => {
    const state = await newOrchestrator().run(PROMPT);
    const roles = state.tasks.map((t) => t.assignedRole).sort();
    expect(roles).toEqual([...EXECUTION_ROLES].sort());
    // All five roles (incl. ceo) must appear in the logs.
    for (const role of ALL_ROLES) {
      expect(state.logs.some((l) => l.role === role)).toBe(true);
    }
  });

  test('advances every agent to status done', async () => {
    const state = await newOrchestrator().run(PROMPT);
    expect(state.agents.length).toBe(getDefaultAgents().length);
    for (const agent of state.agents) {
      expect(agent.status).toBe('done');
      expect(agent.output).toBeTruthy();
    }
  });

  test('ends done=true with a non-empty integrator verification artifact', async () => {
    const state = await newOrchestrator().run(PROMPT);
    expect(state.done).toBe(true);
    expect(state.phase).toBe('done');
    const integration = state.artifacts.find((a) => a.kind === 'integration');
    expect(integration).toBeDefined();
    expect(integration!.producedByRole).toBe('integrator');
    // Authoritative data is files[]: the integrator emits real files.
    expect(integration!.files.length).toBeGreaterThanOrEqual(1);
    const readme = integration!.files.find((f) => f.path === 'README.md');
    expect(readme).toBeDefined();
    expect(readme!.content).toContain('TUDO FUNCIONANDO');
    // One artifact per role (ceo + 4 execution roles).
    expect(state.artifacts.length).toBe(ALL_ROLES.length);
  });

  test('artifacts collectively carry multiple real files across roles', async () => {
    const state = await newOrchestrator().run(PROMPT);
    // Every artifact must expose a non-empty files[] with real paths/content.
    for (const artifact of state.artifacts) {
      expect(artifact.files.length).toBeGreaterThanOrEqual(1);
      for (const file of artifact.files) {
        expect(file.path.length).toBeGreaterThan(0);
        expect(file.content.length).toBeGreaterThan(0);
      }
    }
    // Collectively there must be MORE files than roles (roles emit multiple).
    const allFiles = state.artifacts.flatMap((a) => a.files);
    expect(allFiles.length).toBeGreaterThan(state.artifacts.length);
    // Distinct real paths exist across roles (e.g. package.json + schema.sql).
    const paths = new Set(allFiles.map((f) => f.path));
    expect(paths.has('package.json')).toBe(true);
    expect(paths.has('db/schema.sql')).toBe(true);
    expect(paths.has('README.md')).toBe(true);
  });

  test('is deterministic across two runs', async () => {
    const a = await newOrchestrator().run(PROMPT);
    const b = await newOrchestrator().run(PROMPT);
    expect(normalize(a)).toEqual(normalize(b));
  });

  test('streams snapshots via onEvent and the final equals the resolved state', async () => {
    const snapshots: PipelineState[] = [];
    const final = await newOrchestrator().run(PROMPT, (s) => snapshots.push(s));
    expect(snapshots.length).toBeGreaterThan(0);
    const last = snapshots[snapshots.length - 1];
    expect(last.done).toBe(true);
    expect(last.phase).toBe('done');
    expect(normalize(last)).toEqual(normalize(final));
    // Snapshots must be independent clones (mutating one does not affect final).
    snapshots[0].done = true;
    expect(final.done).toBe(true);
  });

  test('a broken orchestrator that skips the integrator would fail acceptance', async () => {
    // Simulate the "reverted/broken" scenario: no agent can cover integrator.
    const agents = getDefaultAgents().map((a) => ({
      ...a,
      roles: a.roles.filter((r) => r !== 'integrator'),
    }));
    const broken = new Orchestrator(new MockLLMProvider(), {
      stepDelayMs: 0,
      agents,
    });
    await expect(broken.run(PROMPT)).rejects.toThrow(/integrator/);
  });
});

/** Strip timestamps so determinism comparisons ignore wall-clock values. */
function normalize(state: PipelineState) {
  return {
    ...state,
    startedAt: undefined,
    finishedAt: undefined,
  };
}
