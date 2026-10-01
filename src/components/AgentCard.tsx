import type { FC } from 'react';
import { getRoleDefinition } from '../engine/agents';
import type { Agent, AgentStatus } from '../engine/types';

/** Rotulo em pt-BR para cada status de agente. */
const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Aguardando',
  working: 'Trabalhando',
  done: 'Concluido',
  error: 'Erro',
};

export interface AgentCardProps {
  agent: Agent;
}

/**
 * Cartao de um agente: nome, os selos dos papeis que ele acumula (suporta
 * multiplos papeis), status com cor, tarefa atual e a ultima saida produzida.
 */
export const AgentCard: FC<AgentCardProps> = ({ agent }) => {
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

      {agent.output ? (
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
