import React, { useState } from 'react';
import { X, Hash, Lock, Users, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface CreateGroupModalProps {
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const { createGroup, users } = useApp();
  const { organization, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as 'text' | 'voice',
    privacy: 'public' as 'public' | 'private',
    members: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) {
      alert('Missing organization or user');
      return;
    }
    try {
      await createGroup(formData);
      onClose();
    } catch (error) {
      alert('Failed to create group. Please try again.');
    }
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
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Create Group</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <div className="relative">
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-4 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="group-name"
                required
              />
            </div>
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
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;