import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  MessageSquare, 
  Paperclip, 
  Plus,
  CheckSquare,
  Play,
  Send,
  Check,
  XIcon,
  Clock,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { Task, Comment, Subtask } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface TaskDetailSidebarProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({ task, onClose, onUpdate }) => {
  const { user } = useAuth();
  const { users, addComment, deleteComment, updateTask, fetchTasks, addActivity, deleteActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(task.comments);
  const [newSubtask, setNewSubtask] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<null | { attachment: any; timeoutId: any }>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [activityDescription, setActivityDescription] = useState('');
  const [activityType, setActivityType] = useState('custom');
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  useEffect(() => {
    setLocalComments(task.comments);
  }, [task.comments]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isAssignee = user?.id === task.assigneeId;
  const canEdit = isAdmin;
  const canStart = isAssignee && task.status === 'todo';
  const canSendForReview = isAssignee && task.status === 'in_progress';
  const canReview = isAdmin && task.status === 'review';

  // Find the assignee user object
  const assignee = users.find(u => u.id === task.assigneeId);

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdate({ status: newStatus });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    const tempComment = {
      id: Date.now().toString(),
      content: newComment,
      authorId: user!.id,
      createdAt: new Date(),
    };
    setLocalComments(prev => [...prev, tempComment]);
    setNewComment('');
    try {
      await addComment(task.id, tempComment.content);
      setToast({ message: 'Comment added', type: 'success' });
      await fetchTasks();
    } catch {
      setToast({ message: 'Failed to add comment', type: 'error' });
      setLocalComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
    setCommentLoading(false);
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (commentId: string) => {
    const updatedComments = localComments.map(c =>
      c.id === commentId ? { ...c, content: editingContent } : c
    );
    setLocalComments(updatedComments);
    try {
      await updateTask(task.id, { comments: updatedComments });
      setToast({ message: 'Comment updated', type: 'success' });
      await fetchTasks();
    } catch {
      setToast({ message: 'Failed to update comment', type: 'error' });
    }
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await deleteComment(task.id, commentId);
      setToast({ message: 'Comment deleted', type: 'success' });
      await fetchTasks();
    } catch {
      setToast({ message: 'Failed to delete comment', type: 'error' });
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
      createdAt: new Date(),
    };

    onUpdate({
      subtasks: [...task.subtasks, subtask],
    });

    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ subtasks: updatedSubtasks });
  };

  const handleAddAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      const token = localStorage.getItem('frooxi_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/attachment`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      } as any);
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const attachment = {
        id: Date.now().toString(),
        name: data.name,
        url: data.url,
        size: data.size,
        type: data.type,
        uploadedBy: user?.id || '',
        uploadedAt: new Date(),
      };
      onUpdate({ attachments: [...task.attachments, attachment] });
    } catch (err) {
      alert('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const priorityColors = {
    low: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-red-400 bg-red-400/10',
  };

  const statusColors = {
    todo: 'text-gray-400 bg-gray-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    review: 'text-yellow-400 bg-yellow-400/10',
    completed: 'text-green-400 bg-green-400/10',
  };

  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.style.height = 'auto';
      commentInputRef.current.style.height = commentInputRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  const isTaskLocked = (task.status === 'review' || task.status === 'completed') && !isAdmin;
  const canViewTask = isAdmin || user?.id === task.assigneeId;
  const isAssigneeLocked = user?.id === task.assigneeId && task.status === 'todo';

  if (!canViewTask) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col items-center justify-center">
        <p className="text-gray-300 text-lg">You do not have permission to view this task.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'details', label: 'Details' },
            { id: 'comments', label: 'Comments' },
            { id: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.message}</div>
        )}
        {activeTab === 'details' && (
          <>
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {task.description}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Start Date</span>
                </h4>
                <p className="text-gray-400 text-sm">
                  {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </h4>
                <p className="text-gray-400 text-sm">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Assignee</span>
              </h4>
              <div className="flex items-center space-x-3">
                {assignee && assignee.avatar ? (
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-800"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                )}
                <span className="text-gray-400 text-sm">
                  {assignee ? assignee.name + (assignee.position ? ` (${assignee.position})` : '') : 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</span>
                </h4>
                {canEdit && !isTaskLocked && !isAssigneeLocked && (
                  <button
                    onClick={() => {
                      const title = prompt('Enter subtask title:');
                      if (title) {
                        const subtask: Subtask = {
                          id: Date.now().toString(),
                          title,
                          completed: false,
                          createdAt: new Date(),
                        };
                        onUpdate({ subtasks: [...task.subtasks, subtask] });
                      }
                    }}
                    className="p-1 text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        subtask.completed
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-500 hover:border-purple-400'
                      }`}
                      disabled={isTaskLocked || isAssigneeLocked || (!isAssignee && !canEdit)}
                    >
                      {subtask.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <Paperclip className="w-4 h-4" />
                  <span>Attachments ({task.attachments.length})</span>
                </h4>
                {(isAssignee || canEdit) && !isTaskLocked && !isAssigneeLocked && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <button
                      className="p-1 text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                      onClick={handleAddAttachmentClick}
                      disabled={uploading}
                      title={uploading ? 'Uploading...' : 'Add Attachment'}
                    >
                    <Plus className="w-4 h-4" />
                  </button>
                  </>
                )}
              </div>
              {uploading && <p className="text-xs text-gray-400 mb-2">Uploading...</p>}
              {task.attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">No attachments</p>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 flex-1 truncate" title={attachment.name}>{attachment.name}</span>
                      {/* Download button */}
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-white"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {/* Preview button */}
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-white"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      {/* Delete button */}
                      {((isAdmin) || (user?.id === attachment.uploadedBy && isAssignee)) && !isTaskLocked && !isAssigneeLocked && (
                        <button
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete"
                          onClick={() => {
                            if (recentlyDeleted) return; // Only allow one undo at a time
                            if (confirm('Delete this attachment?')) {
                              const deleted = attachment;
                              const newAttachments = task.attachments.filter(a => a.id !== attachment.id);
                              onUpdate({ attachments: newAttachments });
                              const timeoutId = setTimeout(() => {
                                setRecentlyDeleted(null);
                              }, 5000);
                              setRecentlyDeleted({ attachment: deleted, timeoutId });
                            }
                          }}
                          disabled={!!recentlyDeleted}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Add comment */}
            {(isAssignee || canEdit) && !isTaskLocked && (
              <div className="relative flex items-end space-x-2">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none pr-10 hide-scrollbar"
                  rows={1}
                  style={{ minHeight: 36, maxHeight: 120, overflow: 'auto' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  disabled={commentLoading}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="absolute right-2 bottom-2 p-1 text-purple-400 hover:text-purple-200 disabled:opacity-50"
                  style={{ background: 'none', border: 'none' }}
                  title="Send"
                  type="button"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {localComments.map((comment) => {
                const commentUser = users.find(u => u.id === comment.authorId);
                return (
                <div key={comment.id} className="flex space-x-3">
                    {commentUser && commentUser.avatar ? (
                      <img
                        src={commentUser.avatar}
                        alt={commentUser.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-800 flex-shrink-0"
                      />
                    ) : (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                    )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-white">{commentUser ? commentUser.name : 'User'}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                        {(user?.id === comment.authorId || isAdmin) && !isTaskLocked && (
                          <>
                            {editingCommentId === comment.id ? (
                              <>
                                <button
                                  className="ml-2 text-green-400 hover:text-green-600 text-xs"
                                  title="Save"
                                  onClick={() => handleSaveEdit(comment.id)}
                                >
                                  Save
                                </button>
                                <button
                                  className="ml-2 text-gray-400 hover:text-gray-600 text-xs"
                                  title="Cancel"
                                  onClick={() => { setEditingCommentId(null); setEditingContent(''); }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="ml-2 text-blue-400 hover:text-blue-600 text-xs"
                                  title="Edit comment"
                                  onClick={() => handleEditComment(comment.id, comment.content)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="ml-2 text-red-400 hover:text-red-600 text-xs"
                                  title="Delete comment"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <textarea
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm mb-1"
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-gray-300">
                          {comment.content.startsWith('Task rejected:') ? (
                            <>
                              <span className="text-red-400 font-bold">Task rejected:</span>
                              {(() => {
                                // Remove 'Task rejected:' and render the rest, supporting [Attachment](url) markdown
                                const rest = comment.content.replace(/^Task rejected:/, '');
                                const parts = rest.split(/(\[Attachment\]\([^\)]+\))/g);
                                return parts.map((part, i) => {
                                  const match = part.match(/^\[Attachment\]\(([^\)]+)\)$/);
                                  if (match) {
                                    return <a key={i} href={match[1]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline ml-1">Attachment</a>;
                                  }
                                  return <span key={i}>{part}</span>;
                                });
                              })()}
                            </>
                          ) : comment.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {task.activities.map((activity) => {
              const activityUser = users.find(u => u.id === activity.userId);
              return (
              <div key={activity.id} className="flex space-x-3">
                  {activityUser && activityUser.avatar ? (
                    <img
                      src={activityUser.avatar}
                      alt={activityUser.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-800 flex-shrink-0"
                    />
                  ) : (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                  )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white">{activityUser ? activityUser.name : 'System'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{activity.description}</p>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-700 space-y-2">
        {canStart && (
          <button
            onClick={() => handleStatusChange('in_progress')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Task</span>
          </button>
        )}

        {canSendForReview && (
          <button
            onClick={() => handleStatusChange('review')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send for Review</span>
          </button>
        )}

        {canReview && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusChange('completed')}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleStatusChange('todo')}
              className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <XIcon className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>

      {/* Undo delete notification */}
      {recentlyDeleted && (
        <div className="flex items-center space-x-2 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2">
          <span className="text-sm text-gray-300">Attachment deleted.</span>
          <button
            className="text-purple-400 hover:text-purple-200 font-medium text-sm"
            onClick={() => {
              if (recentlyDeleted) {
                clearTimeout(recentlyDeleted.timeoutId);
                onUpdate({ attachments: [...task.attachments, recentlyDeleted.attachment] });
                setRecentlyDeleted(null);
              }
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetailSidebar;

/* Hide scrollbar utility */
/* Add this to the bottom of the file or in a global CSS file if not already present */
/* .hide-scrollbar::-webkit-scrollbar { display: none; } */
/* .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } */