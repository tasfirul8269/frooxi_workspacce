import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Calendar,
  MoreVertical,
  UserPlus,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import CreateRoleModal from './CreateRoleModal';
import AddUserModal from './AddUserModal';
import DeleteUserConfirmModal from './DeleteUserConfirmModal';
import EditUserModal from './EditUserModal';
import EditRoleModal from './EditRoleModal';
import DeleteRoleConfirmModal from './DeleteRoleConfirmModal';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { users, roles, deleteUser: deleteUserApi, editUser: editUserApi, editRole, deleteRole } = useApp();
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editUser, setEditUser] = useState<null | typeof users[0]>(null);
  const [deleteUser, setDeleteUser] = useState<null | typeof users[0]>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editRoleModal, setEditRoleModal] = useState<null | typeof roles[0]>(null);
  const [deleteRoleModal, setDeleteRoleModal] = useState<null | typeof roles[0]>(null);
  const [roleEditing, setRoleEditing] = useState(false);
  const [roleDeleting, setRoleDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const filteredMembers = users.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-green-500';
      case 'employee':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600/20 text-purple-400';
      case 'employee':
        return 'bg-blue-600/20 text-blue-400';
      case 'super_admin':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-gray-400">Manage your team members and roles</p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateRole(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Create Role</span>
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'members'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'roles'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Permissions</span>
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
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

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member: User) => (
              <div
                key={member.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.role)} rounded-full border-2 border-gray-800`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400">
                        {member.role === 'employee'
                          ? (roles.find(r =>
                              r.permissions.length === (member.permissions?.length || 0) &&
                              r.permissions.every(p => member.permissions?.includes(p))
                            )?.name || 'Employee')
                          : member.position}
                      </p>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{member.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-700">
                    <button
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      onClick={() => setEditUser(member)}
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      onClick={() => setDeleteUser(member)}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    ></div>
                    <h3 className="font-semibold text-white">{role.name}</h3>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        onClick={() => setEditRoleModal(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-red-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        onClick={() => setDeleteRoleModal(role)}
                      >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                        >
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateRole && (
        <CreateRoleModal onClose={() => setShowCreateRole(false)} />
      )}

      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} />
      )}

      {/* Delete User Confirm Modal */}
      {deleteUser && (
        <DeleteUserConfirmModal
          user={deleteUser}
          loading={deleting}
          onClose={() => setDeleteUser(null)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await deleteUserApi(deleteUser.id);
              showToast('success', 'User removed successfully.');
            } catch (err) {
              showToast('error', 'Failed to remove user.');
            }
            setDeleting(false);
            setDeleteUser(null);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          roles={roles}
          loading={editing}
          onClose={() => setEditUser(null)}
          onSave={async (updates) => {
            setEditing(true);
            try {
              await editUserApi(editUser.id, updates);
              showToast('success', 'User updated successfully.');
            } catch (err) {
              showToast('error', 'Failed to update user.');
            }
            setEditing(false);
            setEditUser(null);
          }}
        />
      )}

      {/* Edit Role Modal */}
      {editRoleModal && (
        <EditRoleModal
          role={editRoleModal}
          loading={roleEditing}
          onClose={() => setEditRoleModal(null)}
          onSave={async (updates) => {
            setRoleEditing(true);
            try {
              await editRole(editRoleModal.id, updates);
              showToast('success', 'Role updated successfully.');
            } catch (err) {
              showToast('error', 'Failed to update role.');
            }
            setRoleEditing(false);
            setEditRoleModal(null);
          }}
        />
      )}

      {/* Delete Role Confirm Modal */}
      {deleteRoleModal && (
        <DeleteRoleConfirmModal
          role={deleteRoleModal}
          loading={roleDeleting}
          onClose={() => setDeleteRoleModal(null)}
          onConfirm={async () => {
            // Prevent deleting a role if any user is assigned to it
            const usersWithRole = users.filter(u => u.role === deleteRoleModal?.name);
            if (usersWithRole.length > 0) {
              showToast('error', 'Cannot delete role: users are assigned to this role.');
              setDeleteRoleModal(null);
              return;
            }
            setRoleDeleting(true);
            try {
              await deleteRole(deleteRoleModal.id);
              showToast('success', 'Role deleted successfully.');
            } catch (err) {
              showToast('error', 'Failed to delete role.');
            }
            setRoleDeleting(false);
            setDeleteRoleModal(null);
          }}
        />
      )}

      {/* Toast UI */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TeamManagement;