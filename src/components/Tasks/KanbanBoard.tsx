import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Filter, Search } from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskDetailSidebar from './TaskDetailSidebar';
import CreateTaskModal from './CreateTaskModal';

const KanbanBoard: React.FC = () => {
  const { tasks, updateTask } = useApp();
  const { user } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectAttachment, setRejectAttachment] = useState<File | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-600' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-600' },
    { id: 'review', title: 'Review', color: 'bg-yellow-600' },
    { id: 'completed', title: 'Completed', color: 'bg-green-600' },
  ];

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (columns.some(col => col.id === newStatus)) {
      updateTask(taskId, { status: newStatus as Task['status'] });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const canCreateTask = user?.role === 'admin' || user?.role === 'super_admin';

  const handleRejectTask = async (task: Task) => {
    setShowRejectModal(true);
    setActiveTask(task);
  };

  const handleSubmitReject = async () => {
    if (!activeTask) return;
    setRejectLoading(true);
    let attachmentUrl = '';
    if (rejectAttachment) {
      const formData = new FormData();
      formData.append('attachment', rejectAttachment);
      const token = localStorage.getItem('frooxi_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/attachment`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      } as any);
      if (res.ok) {
        const data = await res.json();
        attachmentUrl = data.url;
      }
    }
    // Add a rejection comment and set status to 'todo'
    const rejectionComment = {
      id: Date.now().toString(),
      content: `Task rejected: ${rejectReason}` + (attachmentUrl ? ` [Attachment](${attachmentUrl})` : ''),
      authorId: user?.id || '',
      createdAt: new Date(),
    };
    await updateTask(activeTask.id, {
      status: 'todo',
      comments: [...(activeTask.comments || []), rejectionComment],
    });
    setShowRejectModal(false);
    setRejectReason('');
    setRejectAttachment(null);
    setRejectLoading(false);
    setActiveTask(null);
  };

  // Only allow drag and drop for admin/super_admin
  const canDrag = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-gray-400">Manage and track your team's progress</p>
        </div>
        
        {canCreateTask && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
          />
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        {canDrag ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-6 min-w-max pb-6">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
        ) : (
          <div className="flex space-x-6 min-w-max pb-6">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <TaskDetailSidebar
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updates) => {
            // If admin is rejecting (status change to 'todo' from review/completed), show modal
            if (
              user?.role === 'admin' &&
              selectedTask.status === 'review' &&
              updates.status === 'todo'
            ) {
              setShowRejectModal(true);
              setActiveTask(selectedTask);
              return;
            }
            await updateTask(selectedTask.id, updates);
            setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(taskData) => {
            // This would be handled by the createTask function from context
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Reject Task</h2>
            <label className="block text-sm text-gray-300 mb-2">Reason for rejection</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
            />
            <label className="block text-sm text-gray-300 mb-2">Attach file/image (optional)</label>
            <input
              type="file"
              className="mb-4"
              onChange={e => setRejectAttachment(e.target.files?.[0] || null)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectAttachment(null); }}
                disabled={rejectLoading}
              >Cancel</button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleSubmitReject}
                disabled={rejectLoading || !rejectReason.trim()}
              >Reject Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;