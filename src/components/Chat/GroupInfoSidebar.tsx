import React, { useState } from 'react';
import { Users, Edit3, LogOut, Paperclip } from 'lucide-react';
import { Group, User as UserType, ChatMessage } from '../../types';

interface GroupInfoSidebarProps {
  group: Group;
  isAdmin: boolean;
  users: UserType[];
  onEdit: () => void;
  onLeave: () => void;
  messages: ChatMessage[];
}

const GroupInfoSidebar: React.FC<GroupInfoSidebarProps> = ({ group, isAdmin, users, onEdit, onLeave, messages }) => {
  const [tab, setTab] = useState<'members' | 'attachments'>('members');
  const attachments = messages.filter(m => m.attachment);
  const memberUsers = users.filter(u => group.members.includes(u.id));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Users className="w-6 h-6 mr-2 text-purple-400" />
          Group Info
        </h2>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-2 text-sm font-medium ${tab === 'members' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400'}`}
          onClick={() => setTab('members')}
        >
          Members
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${tab === 'attachments' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400'}`}
          onClick={() => setTab('attachments')}
        >
          <Paperclip className="inline w-4 h-4 mr-1" /> Attachments
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'members' && (
          <div className="flex flex-col space-y-3">
            {memberUsers.map(u => (
              <div key={u.id} className="flex items-center space-x-3 bg-gray-800 rounded-lg px-3 py-2">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-white text-sm font-medium">{u.name}</span>
                {/* Optionally, show online status or admin badge here */}
              </div>
            ))}
            {memberUsers.length === 0 && <span className="text-gray-500">No members</span>}
          </div>
        )}
        {tab === 'attachments' && (
          <div className="flex flex-col space-y-3">
            {attachments.length === 0 && <span className="text-gray-500">No attachments</span>}
            {attachments.map(msg => (
              msg.attachment ? (
                <div key={msg.id} className="flex items-center space-x-3 bg-gray-800 rounded-lg px-3 py-2">
                  <Paperclip className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{msg.attachment.name}</div>
                    <div className="text-xs text-gray-400">{(msg.attachment.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <a
                    href={msg.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="View"
                  >
                    <Paperclip className="w-4 h-4" />
                  </a>
                  <a
                    href={msg.attachment.url}
                    download={msg.attachment.name}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                  </a>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="p-4 border-t border-gray-700 flex space-x-2">
        {isAdmin && (
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" /> Edit Group
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex-1"
        >
          <LogOut className="w-4 h-4 mr-2" /> Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoSidebar; 