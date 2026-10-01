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
 * To use a real model later, implement this interface, for example:
 *
 *   class OpenAIProvider implements LLMProvider {
 *     name = 'openai';
 *     async complete(req: LLMCompletionRequest): Promise<string> {
 *       const res = await fetch('https://api.openai.com/v1/chat/completions', {
 *         method: 'POST',
 *         headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
 *         body: JSON.stringify({
 *           model: 'gpt-4o-mini',
 *           messages: [
 *             { role: 'system', content: req.system },
 *             { role: 'user', content: req.prompt },
 *           ],
 *         }),
 *       });
 *       const data = await res.json();
 *       return data.choices[0].message.content;
 *     }
 *   }
 *
 * Then pass `new OpenAIProvider()` to the Orchestrator instead of the mock.
 * No other code needs to change.
 * ===========================================================================
 */
export interface LLMProvider {
  /** Stable identifier for the provider implementation. */
  readonly name: string;
  /** Produce a completion for the given request. */
  complete(req: LLMCompletionRequest): Promise<string>;
}
