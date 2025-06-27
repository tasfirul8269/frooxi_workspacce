import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  AlertCircle,
  CheckSquare,
  User
} from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const { users } = useApp();
  const assignee = users.find(u => u.id === task.assigneeId);

  if (isDragging || isSortableDragging) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 opacity-50 rotate-3 transform">
        <h4 className="font-medium text-white truncate">{task.title}</h4>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-purple-500 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 group"
    >
      {/* Priority indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}></div>
        <div className="flex items-center space-x-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Task title */}
      <h4 className="font-medium text-white mb-2 group-hover:text-purple-300 transition-colors">
        {task.title}
      </h4>

      {/* Task description */}
      {task.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Subtasks progress */}
      {totalSubtasks > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-400">
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Comments */}
          {task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">{task.comments.length}</span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee avatar */}
        {assignee && assignee.avatar ? (
          <img
            src={assignee.avatar}
            alt={assignee.name}
            className="w-6 h-6 rounded-full object-cover border-2 border-gray-800"
          />
        ) : (
        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-white" />
        </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;