import { describe, expect, test } from 'bun:test';
import { MockLLMProvider } from './MockLLMProvider';
import { parseGeneratedFiles } from './fileFormat';
import { ALL_ROLES, type AgentRoleId } from '../types';

const PROMPT = 'Crie um site de lista de tarefas com login de usuario.';

/** Marker text that must appear somewhere in each role's output. */
const ROLE_MARKERS: Record<AgentRoleId, string> = {
  ceo: 'Plano de Projeto (CEO)',
  architect: 'Arquitetura & Banco de Dados',
  frontend: '<div id="root"></div>',
  backend: 'Back-end / API',
  integrator: 'Integracao & Verificacao',
};

/** An expected file path/extension per role, proving role-appropriateness. */
const ROLE_EXPECTED_PATH: Record<AgentRoleId, RegExp> = {
  ceo: /package\.json$/,
  architect: /\.sql$/,
  frontend: /\.(html|tsx)$/,
  backend: /server\/.*\.ts$/,
  integrator: /README\.md$/,
};

async function complete(role: AgentRoleId): Promise<string> {
  return new MockLLMProvider().complete({ role, system: 'sys', prompt: PROMPT });
}

describe('MockLLMProvider', () => {
  test('returns role-specific content for each role', async () => {
    for (const role of ALL_ROLES) {
      const out = await complete(role);
      expect(out).toContain(ROLE_MARKERS[role]);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  test('each role emits >=1 parseable file with a real, role-appropriate path', async () => {
    for (const role of ALL_ROLES) {
      const out = await complete(role);
      const files = parseGeneratedFiles(out);
      expect(files.length).toBeGreaterThanOrEqual(1);
      for (const f of files) {
        expect(f.path.length).toBeGreaterThan(0);
        expect(f.content.length).toBeGreaterThan(0);
      }
      // At least one file matches the role's responsibility (path/extension).
      expect(files.some((f) => ROLE_EXPECTED_PATH[role].test(f.path))).toBe(true);
    }
  });

  test('ceo emits a package.json that parses as valid JSON', async () => {
    const files = parseGeneratedFiles(await complete('ceo'));
    const pkg = files.find((f) => f.path === 'package.json');
    expect(pkg).toBeDefined();
    const parsed = JSON.parse(pkg!.content) as { name: string; version: string };
    expect(typeof parsed.name).toBe('string');
    expect(parsed.version).toBe('0.1.0');
  });

  test('is deterministic for the same input', async () => {
    const a = await complete('ceo');
    const b = await complete('ceo');
    expect(a).toBe(b);
  });

  test('ceo plan references the four execution roles', async () => {
    const out = await complete('ceo');
    for (const role of ['architect', 'frontend', 'backend', 'integrator']) {
      expect(out).toContain(role);
    }
  });

  test('integrator reports success', async () => {
    const out = await complete('integrator');
    expect(out).toContain('TUDO FUNCIONANDO');
  });
});
