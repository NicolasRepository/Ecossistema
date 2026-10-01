import type { FC } from 'react';
import { getRoleDefinition } from '../engine/agents';
import type { Agent, AgentStatus, ProjectArtifact } from '../engine/types';

/** Rotulo em pt-BR para cada status de agente. */
const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Aguardando',
  working: 'Trabalhando',
  done: 'Concluido',
  error: 'Erro',
};

export interface AgentCardProps {
  agent: Agent;
  /** Artefatos (com arquivos reais) produzidos pelos papeis deste agente. */
  artifacts?: ProjectArtifact[];
}

/**
 * Cartao de um agente: nome, os selos dos papeis que ele acumula (suporta
 * multiplos papeis), status com cor, tarefa atual e os ARQUIVOS REAIS gerados
 * (caminho + conteudo) por seus papeis.
 */
export const AgentCard: FC<AgentCardProps> = ({ agent, artifacts = [] }) => {
  const files = artifacts.flatMap((a) => a.files);

  return (
    <article className={`agent-card status-${agent.status}`}>
      <header className="agent-card__header">
        <div className="agent-card__title">
          <span className="agent-card__name">{agent.name}</span>
          <span className={`status-badge status-badge--${agent.status}`}>
            {STATUS_LABEL[agent.status]}
          </span>
        </div>
        <div className="agent-card__roles">
          {agent.roles.map((role) => (
            <span key={role} className={`role-badge role-badge--${role}`}>
              {getRoleDefinition(role).name}
            </span>
          ))}
        </div>
      </header>

      {agent.currentTask ? (
        <p className="agent-card__task">
          <span className="agent-card__label">Tarefa atual:</span> {agent.currentTask}
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="agent-card__files">
          <span className="agent-card__label">
            Arquivos gerados ({files.length}):
          </span>
          {files.map((file) => (
            <details key={file.path} className="file-block">
              <summary className="file-block__path">{file.path}</summary>
              <pre className="file-block__content">{file.content}</pre>
            </details>
          ))}
        </div>
      ) : agent.output ? (
        <details className="agent-card__output">
          <summary>Ultima saida</summary>
          <pre>{agent.output}</pre>
        </details>
      ) : (
        <p className="agent-card__empty">Nenhuma saida ainda.</p>
      )}
    </article>
  );
};
