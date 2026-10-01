import type { LLMCompletionRequest, LLMProvider } from './LLMProvider';

/** Opcoes de configuracao do {@link OpenAILLMProvider}. */
export interface OpenAIProviderOptions {
  /** Modelo a usar. Padrao: 'gpt-4o-mini' (moderno e barato). */
  model?: string;
  /** Endpoint compativel com OpenAI. Padrao: API oficial da OpenAI. */
  baseUrl?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Provider REAL que fala com um endpoint de chat-completions compativel com a
 * OpenAI.
 *
 * NOTA / NOTE: este provider precisa de REDE e de uma chave fornecida pelo
 * usuario em tempo de execucao. No sandbox (INTEGRATIONS_ONLY) ele NAO roda:
 * so e verificado por typecheck/compilacao. A chave nunca e lida de uma fonte
 * commitada nem de variavel de ambiente padrao -- ela e passada pelo chamador.
 *
 * This real provider requires network access and a user-provided API key at
 * runtime; it will NOT run in the sandbox (verified only by typecheck).
 */
export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, options: OpenAIProviderOptions = {}) {
    this.apiKey = apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  async complete(req: LLMCompletionRequest): Promise<string> {
    const res: Response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `OpenAILLMProvider: resposta HTTP ${res.status} ${res.statusText}` +
          (detail ? ` - ${detail}` : ''),
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('OpenAILLMProvider: resposta sem conteudo de mensagem.');
    }
    return content;
  }
}
