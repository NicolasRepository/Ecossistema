import type { FC } from 'react';
import { getRoleDefinition } from '../engine/agents';
import type { LogEntry } from '../engine/types';

export interface ActivityLogProps {
  logs: LogEntry[];
}

/**
 * Registro de atividade em streaming. Mostra as entradas mais recentes no topo,
 * com o papel do agente, a mensagem e o nivel (cor).
 */
export const ActivityLog: FC<ActivityLogProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="activity-log activity-log--empty">
        <p>O registro de atividade aparecera aqui durante a execucao.</p>
      </div>
    );
  }

  // Mais recentes primeiro.
  const ordered = logs.slice().reverse();

  return (
    <ul className="activity-log">
      {ordered.map((entry) => (
        <li key={entry.ts} className={`log-entry log-entry--${entry.level}`}>
          <span className={`log-level log-level--${entry.level}`} aria-hidden="true" />
          <span className="log-entry__role">{getRoleDefinition(entry.role).name}</span>
          <span className="log-entry__message">{entry.message}</span>
        </li>
      ))}
    </ul>
  );
};
