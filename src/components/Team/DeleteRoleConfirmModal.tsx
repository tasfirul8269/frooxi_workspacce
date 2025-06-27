import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Role } from '../../types';

interface DeleteRoleConfirmModalProps {
  role: Role;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteRoleConfirmModal: React.FC<DeleteRoleConfirmModalProps> = ({ role, onClose, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: role.color }}>
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Delete Role</h2>
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
            <div className="w-8 h-8 rounded-full border-2 border-gray-700" style={{ backgroundColor: role.color }}></div>
            <div>
              <h3 className="font-semibold text-white">{role.name}</h3>
            </div>
          </div>
          <div className="bg-red-600/10 text-red-300 rounded-lg p-4 text-sm">
            Are you sure you want to delete this role? This action cannot be undone. Users assigned to this role may lose access to certain features.
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
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleConfirmModal; 