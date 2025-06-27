import React, { useState } from 'react';
import { X, Trash, Hash, Lock, Users, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Group } from '../../types';

interface EditGroupModalProps {
  group: Group;
  onClose: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, onClose }) => {
  const { editGroup, deleteGroup, users } = useApp();
  const [formData, setFormData] = useState({
    name: group.name,
    type: group.type,
    privacy: group.privacy,
    members: group.members,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await editGroup(group.id, formData);
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    await deleteGroup(group.id);
    setLoading(false);
    onClose();
  };

  const handleMemberToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Edit Group</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Group Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Group Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'text' }))}
                className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border transition-colors ${formData.type === 'text' ? 'border-purple-500 bg-purple-600/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                <Hash className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Text</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'voice' }))}
                className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border transition-colors ${formData.type === 'voice' ? 'border-purple-500 bg-purple-600/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                <Volume2 className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Voice</span>
              </button>
            </div>
          </div>
          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Privacy</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, privacy: 'public' }))}
                className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border transition-colors ${formData.privacy === 'public' ? 'border-purple-500 bg-purple-600/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                <span className="text-white font-medium">Public</span>
                <span className="text-xs text-gray-400">Anyone can join</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, privacy: 'private' }))}
                className={`flex-1 flex items-center space-x-3 p-3 rounded-lg border transition-colors ${formData.privacy === 'private' ? 'border-purple-500 bg-purple-600/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Private</span>
                <span className="text-xs text-gray-400">Only selected members</span>
              </button>
            </div>
          </div>
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Group Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full pl-4 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="group-name"
              required
            />
          </div>
          {/* Member Selector (for private groups) */}
          {formData.privacy === 'private' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                Select Members
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(u.id)}
                      onChange={() => handleMemberToggle(u.id)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-white text-sm">{u.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors ml-2"
              disabled={loading}
            >
              <Trash className="w-4 h-4 mr-1 inline" /> Delete Group
            </button>
          </div>
          {confirmDelete && (
            <div className="mt-4 p-4 bg-red-900/80 border border-red-700 rounded-lg text-red-200">
              <div className="mb-2">Are you sure you want to delete this group? This action cannot be undone.</div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal; 