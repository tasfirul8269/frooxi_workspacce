import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
  };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="w-80 flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
          <h3 className="font-semibold text-white">{column.title}</h3>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 min-h-96 bg-gray-800/30 rounded-lg p-3 border-2 border-dashed border-gray-700 hover:border-gray-600 transition-colors"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;