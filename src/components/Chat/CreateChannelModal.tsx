import React, { useState, useEffect } from 'react';
import { X, Hash, Lock, Users, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface CreateChannelModalProps {
  onClose: () => void;
  defaultCategoryId?: string | null;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, defaultCategoryId }) => {
  const { createChannel, roles, categories } = useApp();
  const { organization, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as 'text' | 'voice',
    privacy: 'public' as 'public' | 'private',
    categoryId: defaultCategoryId || '',
    allowedRoles: [] as string[],
    members: [] as string[],
  });

  useEffect(() => {
    if (defaultCategoryId) {
      setFormData(prev => ({ ...prev, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;
    createChannel({
      ...formData,
      createdBy: user.id,
      organizationId: organization.id,
    });
    onClose();
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(roleId)
        ? prev.allowedRoles.filter(r => r !== roleId)
        : [...prev.allowedRoles, roleId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Create Channel</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Channel Type
            </label>
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
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Privacy
            </label>
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
                <span className="text-xs text-gray-400">Restricted by roles</span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Channel Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Channel Name *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {formData.type === 'voice' ? (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <Hash className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="channel-name"
                required
              />
            </div>
          </div>

          {/* Role Permissions (for private channels) */}
          {formData.privacy === 'private' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                Allowed Roles
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      ></div>
                      <span className="text-white text-sm">{role.name}</span>
                    </div>
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
              disabled={!formData.name.trim() || !formData.categoryId}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;