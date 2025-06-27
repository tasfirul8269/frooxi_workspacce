import React from 'react';
import { X, Users, Hash, Volume2, Lock, Edit3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface GroupInfoModalProps {
  group: Group;
  onClose: () => void;
  onEdit: () => void;
  isAdmin: boolean;
  asSidebar?: boolean;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ group, onClose, onEdit, isAdmin, asSidebar }) => {
  const { users, requestJoinGroup, approveJoinRequest, denyJoinRequest, leaveGroup } = useApp();
  const { user } = useAuth();
  const memberUsers = users.filter(u => group.members.includes(u.id));
  const isMember = user && group.members.includes(user.id);
  const isCreator = user && group.createdBy === user.id;
  const hasRequested = user && group.joinRequests && group.joinRequests.includes(user.id);

  if (asSidebar) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-400" />
            Group Info
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {group.type === 'voice' ? <Volume2 className="w-5 h-5 text-gray-400" /> : <Hash className="w-5 h-5 text-gray-400" />}
              <span className="text-lg font-semibold text-white">{group.name}</span>
              {group.privacy === 'private' && <Lock className="w-4 h-4 text-gray-500 ml-1" />}
            </div>
            <div className="text-sm text-gray-400 mb-2">
              Type: <span className="capitalize">{group.type}</span> | Privacy: <span className="capitalize">{group.privacy}</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-300 mb-2">Members</div>
            <div className="flex flex-wrap gap-2">
              {memberUsers.map(u => (
                <div key={u.id} className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-white text-sm">{u.name}</span>
                </div>
              ))}
              {memberUsers.length === 0 && <span className="text-gray-500">No members</span>}
            </div>
          </div>
          {!isMember && group.privacy === 'private' && user && !hasRequested && (
            <div className="pt-4">
              <button
                onClick={async () => { await requestJoinGroup(group.id); onClose(); }}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Request to Join
              </button>
            </div>
          )}
          {!isMember && group.privacy === 'private' && user && hasRequested && (
            <div className="pt-4">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transition-colors opacity-60 cursor-not-allowed"
              >
                Request Pending
              </button>
            </div>
          )}
          {isAdmin && group.joinRequests && group.joinRequests.length > 0 && (
            <div className="pt-4">
              <div className="text-sm font-medium text-gray-300 mb-2">Join Requests</div>
              <div className="space-y-2">
                {group.joinRequests.map(requestId => {
                  const reqUser = users.find(u => u.id === requestId);
                  return (
                    <div key={requestId} className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
                      <span className="text-white text-sm">{reqUser ? reqUser.name : requestId}</span>
                      <button
                        onClick={async () => { await approveJoinRequest(group.id, requestId); }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium ml-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => { await denyJoinRequest(group.id, requestId); }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium ml-2"
                      >
                        Deny
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="pt-4">
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Edit Group
              </button>
            </div>
          )}
          {isMember && !isAdmin && !isCreator && (
            <div className="pt-4">
              <button
                onClick={async () => { await leaveGroup(group.id, user.id); onClose(); }}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-400" />
            Group Info
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {group.type === 'voice' ? <Volume2 className="w-5 h-5 text-gray-400" /> : <Hash className="w-5 h-5 text-gray-400" />}
              <span className="text-lg font-semibold text-white">{group.name}</span>
              {group.privacy === 'private' && <Lock className="w-4 h-4 text-gray-500 ml-1" />}
            </div>
            <div className="text-sm text-gray-400 mb-2">
              Type: <span className="capitalize">{group.type}</span> | Privacy: <span className="capitalize">{group.privacy}</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-300 mb-2">Members</div>
            <div className="flex flex-wrap gap-2">
              {memberUsers.map(u => (
                <div key={u.id} className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-white text-sm">{u.name}</span>
                </div>
              ))}
              {memberUsers.length === 0 && <span className="text-gray-500">No members</span>}
            </div>
          </div>
          {!isMember && group.privacy === 'private' && user && !hasRequested && (
            <div className="pt-4">
              <button
                onClick={async () => { await requestJoinGroup(group.id); onClose(); }}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Request to Join
              </button>
            </div>
          )}
          {!isMember && group.privacy === 'private' && user && hasRequested && (
            <div className="pt-4">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transition-colors opacity-60 cursor-not-allowed"
              >
                Request Pending
              </button>
            </div>
          )}
          {isAdmin && group.joinRequests && group.joinRequests.length > 0 && (
            <div className="pt-4">
              <div className="text-sm font-medium text-gray-300 mb-2">Join Requests</div>
              <div className="space-y-2">
                {group.joinRequests.map(requestId => {
                  const reqUser = users.find(u => u.id === requestId);
                  return (
                    <div key={requestId} className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
                      <span className="text-white text-sm">{reqUser ? reqUser.name : requestId}</span>
                      <button
                        onClick={async () => { await approveJoinRequest(group.id, requestId); }}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium ml-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => { await denyJoinRequest(group.id, requestId); }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium ml-2"
                      >
                        Deny
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="pt-4">
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Edit Group
              </button>
            </div>
          )}
          {isMember && !isAdmin && !isCreator && (
            <div className="pt-4">
              <button
                onClick={async () => { await leaveGroup(group.id, user.id); onClose(); }}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal; 