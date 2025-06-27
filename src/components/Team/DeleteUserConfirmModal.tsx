import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { User } from '../../types';

interface DeleteUserConfirmModalProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteUserConfirmModal: React.FC<DeleteUserConfirmModalProps> = ({ user, onClose, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Remove User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
            />
            <div>
              <h3 className="font-semibold text-white">{user.name}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="bg-red-600/10 text-red-300 rounded-lg p-4 text-sm">
            Are you sure you want to remove this user? This action cannot be undone and the user will lose access to Frooxi Workspace.
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserConfirmModal; 