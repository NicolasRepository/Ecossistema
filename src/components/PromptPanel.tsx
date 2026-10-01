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
  onPromptChange: (value: string) => void;
  onStart: () => void;
}

/**
 * Painel de entrada do prompt + botao "Iniciar". Inclui alguns exemplos de
 * projetos web para facilitar o inicio.
 */
export const PromptPanel: FC<PromptPanelProps> = ({
  prompt,
  running,
  onPromptChange,
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
