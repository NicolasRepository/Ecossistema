import type { FC } from 'react';
import { getRoleDefinition } from '../engine/agents';
import type { AgentStatus, Task } from '../engine/types';

/** Rotulo em pt-BR para cada status de tarefa. */
const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Pendente',
  working: 'Em andamento',
  done: 'Concluida',
  error: 'Erro',
};

export interface TaskBoardProps {
  tasks: Task[];
}

/**
 * Quadro de tarefas geradas pelo CEO, ordenadas pela ordem de execucao do
 * pipeline, com indicadores de status.
 */
export const TaskBoard: FC<TaskBoardProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="task-board task-board--empty">
        <p>As tarefas aparecerao aqui depois que o CEO dividir o trabalho.</p>
      </div>
    );
  }

  return (
    <ul className="task-board">
      {tasks.map((task) => (
        <li key={task.id} className={`task-row status-${task.status}`}>
          <span className={`task-dot status-dot--${task.status}`} aria-hidden="true" />
          <div className="task-row__body">
            <span className="task-row__role">
              {getRoleDefinition(task.assignedRole).name}
            </span>
            <span className="task-row__title">{task.title}</span>
          </div>
          <span className={`status-badge status-badge--${task.status}`}>
            {STATUS_LABEL[task.status]}
          </span>
        </li>
      ))}
    </ul>
  );
};
