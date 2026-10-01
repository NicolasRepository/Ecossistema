import type { AgentRoleId } from '../types';

/**
 * Request passed to an {@link LLMProvider} to produce a completion for a given
 * agent role.
 */
export interface LLMCompletionRequest {
  /** Which role is asking (so the provider can shape the answer). */
  role: AgentRoleId;
  /** The role's system prompt (persona / responsibilities). */
  system: string;
  /** The concrete user/task prompt to complete. */
  prompt: string;
  /** Optional extra context (e.g. upstream artifacts) for the model. */
  context?: unknown;
}

/**
 * The provider boundary (seam) for language-model completions.
 *
 * ============================= EXTENSION POINT =============================
 * This is the single place where a REAL backend plugs in. In this sandbox we
 * run under INTEGRATIONS_ONLY, so no external LLM API (OpenAI, Anthropic, etc.)
 * is reachable; the app ships with a deterministic `MockLLMProvider`.
 *
 * To use a real model, implement this interface. A ready-to-use real backend
 * ships in `OpenAILLMProvider.ts` (OpenAI-compatible chat-completions). Build
 * it with a user-provided key and pass it to the Orchestrator instead of the
 * mock -- no other code needs to change:
 *
 *   import { OpenAILLMProvider } from './OpenAILLMProvider';
 *   const provider = new OpenAILLMProvider(apiKey, { model: 'gpt-4o-mini' });
 *   new Orchestrator(provider).run(prompt);
 *
 * Both the mock and the real provider emit files in the same delimited format
 * (see `fileFormat.ts`), parsed into GeneratedFile[] by one shared parser.
 * ===========================================================================
 */
export interface LLMProvider {
  /** Stable identifier for the provider implementation. */
  readonly name: string;
  /** Produce a completion for the given request. */
  complete(req: LLMCompletionRequest): Promise<string>;
}
