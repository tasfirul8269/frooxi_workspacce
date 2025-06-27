import React from 'react';
import { 
  Home, 
  CheckSquare, 
  MessageSquare, 
  Users, 
  Calendar, 
  Settings,
  LogOut,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, collapsed }) => {
  const { user, organization, logout } = useAuth();

  const menuItems = [
    ...(user && (user.role === 'admin' || user.role === 'super_admin') ? [
      { id: 'dashboard', icon: Home, label: 'Dashboard' },
    ] : []),
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div
      className={`bg-gray-900 border-r border-gray-700 flex flex-col ${collapsed ? 'items-center' : ''}`}
      style={{
        width: collapsed ? 64 : 256,
        minWidth: collapsed ? 64 : 256,
        maxWidth: collapsed ? 64 : 256,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {collapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg mb-2 transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Frooxi Workspace</h1>
                <p className="text-xs text-gray-400">Project Management</p>
              </div>
            </div>
            
            {organization && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">{organization.name}</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    organization.plan === 'free' ? 'bg-gray-600 text-gray-300' :
                    organization.plan === 'pro' ? 'bg-blue-600 text-blue-100' :
                    'bg-purple-600 text-purple-100'
                  }`}>
                    {organization.plan.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    organization.status === 'active' ? 'bg-green-600 text-green-100' :
                    organization.status === 'trial' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-red-600 text-red-100'
                  }`}>
                    {organization.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 mt-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;