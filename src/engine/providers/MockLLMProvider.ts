import type { AgentRoleId } from '../types';
import type { LLMCompletionRequest, LLMProvider } from './LLMProvider';

/**
 * Deterministic, fully offline implementation of {@link LLMProvider}.
 *
 * It produces role-appropriate, structured text purely from the role + the
 * user prompt, with NO network access and NO randomness. The same input always
 * yields the same output, which is what makes the engine tests reproducible.
 *
 * This mock is the stand-in for a real model while the sandbox has no access to
 * external LLM APIs. See {@link LLMProvider} for how to swap in a real backend.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';

  async complete(req: LLMCompletionRequest): Promise<string> {
    const prompt = req.prompt.trim();
    const builder = RESPONSES[req.role];
    return builder(prompt);
  }
}

/** Normalize a prompt into a short, slug-ish project label. */
function projectLabel(prompt: string): string {
  const firstLine = prompt.split('\n')[0]?.trim() ?? '';
  if (firstLine.length === 0) return 'Projeto Web';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}

/**
 * One deterministic text builder per role. Each embeds the user prompt so tests
 * can assert the output is derived from the request, and includes a role-unique
 * marker/heading so role-specific content can be verified.
 */
const RESPONSES: Record<AgentRoleId, (prompt: string) => string> = {
  ceo: (prompt) =>
    [
      `# Plano de Projeto (CEO)`,
      `Objetivo: ${projectLabel(prompt)}`,
      ``,
      `Divisao de tarefas por equipe:`,
      `1. [architect] Definir arquitetura e modelo de banco de dados.`,
      `2. [frontend] Construir a interface web e os componentes.`,
      `3. [backend] Implementar a API e a logica de servidor.`,
      `4. [integrator] Integrar front-end e back-end e validar o sistema.`,
    ].join('\n'),

  architect: (prompt) =>
    [
      `# Arquitetura & Banco de Dados`,
      `Projeto: ${projectLabel(prompt)}`,
      ``,
      `Estrutura de pastas sugerida:`,
      `- /src/components  (UI)`,
      `- /src/pages       (rotas)`,
      `- /server/api      (endpoints)`,
      `- /server/db       (acesso a dados)`,
      ``,
      `Esquema de banco de dados (sketch):`,
      `- users(id, name, email, created_at)`,
      `- sessions(id, user_id, token, expires_at)`,
      `- items(id, title, description, owner_id, created_at)`,
    ].join('\n'),

  frontend: (prompt) =>
    [
      `# Front-end`,
      `Projeto: ${projectLabel(prompt)}`,
      ``,
      `Lista de componentes:`,
      `- <AppShell /> layout principal`,
      `- <AuthForm /> login e cadastro`,
      `- <ItemList /> e <ItemCard /> listagem`,
      `- <ItemEditor /> formulario de criacao/edicao`,
      ``,
      `Stack: HTML + CSS + componentes React, consumindo a API via fetch.`,
    ].join('\n'),

  backend: (prompt) =>
    [
      `# Back-end / API`,
      `Projeto: ${projectLabel(prompt)}`,
      ``,
      `Endpoints da API:`,
      `- POST /api/auth/login`,
      `- POST /api/auth/register`,
      `- GET  /api/items`,
      `- POST /api/items`,
      `- PUT  /api/items/:id`,
      `- DELETE /api/items/:id`,
      ``,
      `Regras: autenticacao por token, validacao de entrada, respostas JSON.`,
    ].join('\n'),

  integrator: (prompt) =>
    [
      `# Integracao & Verificacao`,
      `Projeto: ${projectLabel(prompt)}`,
      ``,
      `Montagem final:`,
      `- Front-end conectado aos endpoints da API.`,
      `- Variaveis de ambiente e build configurados.`,
      ``,
      `Relatorio de verificacao:`,
      `- [ok] Rotas da API respondem conforme especificado.`,
      `- [ok] Interface renderiza e consome dados reais.`,
      `- [ok] Fluxo de autenticacao validado ponta a ponta.`,
      `- [ok] Build de producao concluido sem erros.`,
      `Status final: TUDO FUNCIONANDO.`,
    ].join('\n'),
};
