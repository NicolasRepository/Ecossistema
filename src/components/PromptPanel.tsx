import type { ChangeEvent, FC, FormEvent } from 'react';

/** Exemplos de prompts de projetos web para preencher rapidamente o campo. */
export const EXAMPLE_PROMPTS: string[] = [
  'Crie um app web de lista de tarefas com login de usuario e sincronizacao.',
  'Crie um blog com painel administrativo, posts em markdown e comentarios.',
  'Crie uma loja virtual com catalogo de produtos, carrinho e checkout.',
  'Crie um painel de analytics com graficos e autenticacao por token.',
];

export interface PromptPanelProps {
  prompt: string;
  running: boolean;
  apiKey: string;
  model: string;
  onPromptChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onStart: () => void;
}

/**
 * Painel de entrada do prompt + botao "Iniciar". Inclui alguns exemplos de
 * projetos web, alem dos campos de chave de API e modelo (com um aviso de
 * seguranca) usados para plugar o provider real da OpenAI.
 */
export const PromptPanel: FC<PromptPanelProps> = ({
  prompt,
  running,
  apiKey,
  model,
  onPromptChange,
  onApiKeyChange,
  onModelChange,
  onStart,
}) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!running && prompt.trim().length > 0) {
      onStart();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onPromptChange(event.target.value);
  };

  const usingReal = apiKey.trim().length > 0;

  return (
    <form className="prompt-panel" onSubmit={handleSubmit}>
      <label className="prompt-panel__label" htmlFor="prompt-input">
        Descreva o projeto web que a equipe de IA deve construir
      </label>
      <textarea
        id="prompt-input"
        className="prompt-panel__input"
        rows={4}
        placeholder="Ex.: Crie um app web de lista de tarefas com login de usuario..."
        value={prompt}
        disabled={running}
        onChange={handleChange}
      />

      <div className="prompt-panel__examples">
        <span className="prompt-panel__examples-label">Exemplos:</span>
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            className="example-chip"
            disabled={running}
            onClick={() => onPromptChange(example)}
          >
            {example}
          </button>
        ))}
      </div>

      <fieldset className="prompt-panel__provider" disabled={running}>
        <legend className="prompt-panel__provider-legend">
          Modelo real (opcional)
        </legend>
        <div className="prompt-panel__fields">
          <div className="field">
            <label className="field__label" htmlFor="api-key-input">
              Chave de API da OpenAI
            </label>
            <input
              id="api-key-input"
              className="field__input"
              type="password"
              autoComplete="off"
              placeholder="sk-... (deixe vazio para usar a demo offline)"
              value={apiKey}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onApiKeyChange(event.target.value)
              }
            />
          </div>
          <div className="field field--model">
            <label className="field__label" htmlFor="model-input">
              Modelo
            </label>
            <input
              id="model-input"
              className="field__input"
              type="text"
              autoComplete="off"
              placeholder="gpt-4o-mini"
              value={model}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onModelChange(event.target.value)
              }
            />
          </div>
        </div>

        <p className="prompt-panel__provider-mode">
          {usingReal
            ? 'Modo atual: provider REAL (OpenAI) — fara chamadas de rede com sua chave.'
            : 'Modo atual: demo OFFLINE deterministica (MockLLMProvider).'}
        </p>

        <p className="prompt-panel__warning" role="note">
          <strong>Aviso de seguranca:</strong> a chave fica somente no seu navegador
          (site estatico, 100% client-side), e visivel por qualquer um com o DevTools,
          a chamada navegador → OpenAI pode esbarrar em CORS e a chave NAO e salva (so
          dura esta sessao). Para producao, use um backend/proxy que guarde a chave no
          servidor. Deixe o campo vazio para rodar a demo offline deterministica (mock).
        </p>
      </fieldset>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={running || prompt.trim().length === 0}
      >
        {running ? 'Executando...' : 'Iniciar'}
      </button>
    </form>
  );
};
