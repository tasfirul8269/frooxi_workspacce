import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Filter,
  Clock,
  MessageSquare,
  CheckSquare,
  AtSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useNotifications, NotificationData } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    settings,
    updateSettings,
    requestPermission,
    permission
  } = useNotifications(user?.id);

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const deleteNotification = (id: string) => {
    // For now, just mark as read since we don't have a delete function
    markAsRead(id);
  };

  const getTypeIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-400" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'reminder':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'task':
        return 'border-l-blue-500';
      case 'message':
        return 'border-l-green-500';
      case 'mention':
        return 'border-l-purple-500';
      case 'meeting':
        return 'border-l-orange-500';
      case 'reminder':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Handle navigation based on notification type and data
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAll}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg mb-2 transition-colors ${
                      notification.read
                        ? 'bg-gray-800 hover:bg-gray-750'
                        : 'bg-purple-900/20 border border-purple-500/20 hover:bg-purple-900/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className={`text-xs mt-1 ${notification.read ? 'text-gray-400' : 'text-gray-300'}`}>
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 