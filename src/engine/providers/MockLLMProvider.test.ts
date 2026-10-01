import { describe, expect, test } from 'bun:test';
import { MockLLMProvider } from './MockLLMProvider';
import { ALL_ROLES, type AgentRoleId } from '../types';

const PROMPT = 'Crie um site de lista de tarefas com login de usuario.';

/** Marker text that must appear for each role's output. */
const ROLE_MARKERS: Record<AgentRoleId, string> = {
  ceo: 'Plano de Projeto (CEO)',
  architect: 'Arquitetura & Banco de Dados',
  frontend: 'Front-end',
  backend: 'Back-end / API',
  integrator: 'Integracao & Verificacao',
};

describe('MockLLMProvider', () => {
  test('returns role-specific content for each role', async () => {
    const provider = new MockLLMProvider();
    for (const role of ALL_ROLES) {
      const out = await provider.complete({
        role,
        system: 'sys',
        prompt: PROMPT,
      });
      expect(out).toContain(ROLE_MARKERS[role]);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  test('is deterministic for the same input', async () => {
    const provider = new MockLLMProvider();
    const a = await provider.complete({ role: 'ceo', system: 's', prompt: PROMPT });
    const b = await provider.complete({ role: 'ceo', system: 's', prompt: PROMPT });
    expect(a).toBe(b);
  });

  test('ceo plan references the four execution roles', async () => {
    const out = await new MockLLMProvider().complete({
      role: 'ceo',
      system: 's',
      prompt: PROMPT,
    });
    for (const role of ['architect', 'frontend', 'backend', 'integrator']) {
      expect(out).toContain(role);
    }
  });

  test('integrator reports success', async () => {
    const out = await new MockLLMProvider().complete({
      role: 'integrator',
      system: 's',
      prompt: PROMPT,
    });
    expect(out).toContain('TUDO FUNCIONANDO');
  });
});
