import React, { useState } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateRoleModalProps {
  onClose: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ onClose }) => {
  const { addRole } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const availablePermissions = [
    { id: 'comment', label: 'Add Comments', description: 'Can comment on tasks and discussions' },
    { id: 'upload_attachments', label: 'Upload Attachments', description: 'Can upload files and attachments' },
    { id: 'complete_subtasks', label: 'Complete Subtasks', description: 'Can mark subtasks as completed' },
    { id: 'create_tasks', label: 'Create Tasks', description: 'Can create new tasks and assign them' },
    { id: 'manage_team', label: 'Manage Team', description: 'Can add/remove team members and manage roles' },
    { id: 'create_channels', label: 'Create Channels', description: 'Can create chat channels and manage them' },
    { id: 'schedule_meetings', label: 'Schedule Meetings', description: 'Can schedule and manage meetings' },
    { id: 'view_analytics', label: 'View Analytics', description: 'Can access analytics and reports' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addRole({
      name: formData.name,
      color: formData.color,
      permissions: formData.permissions,
    });
    setLoading(false);
    onClose();
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Create New Role</h2>
            </div>
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
          {/* Role Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Senior Developer, Designer, etc."
              required
            />
          </div>

          {/* Role Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-2">
              Role Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Permissions ({formData.permissions.length} selected)
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handlePermissionToggle(permission.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                      formData.permissions.includes(permission.id)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-500 hover:border-purple-400'
                    }`}
                  >
                    {formData.permissions.includes(permission.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{permission.label}</h4>
                    <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              disabled={!formData.name.trim() || formData.permissions.length === 0 || loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;