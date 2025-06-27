import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Role, ChatChannel, Meeting, User, Activity, ChatMessage, ChatCategory } from '../types';
import { useAuth } from './AuthContext';
import { io as socketIOClient, Socket } from 'socket.io-client';

interface AppContextType {
  tasks: Task[];
  roles: Role[];
  channels: ChatChannel[];
  categories: ChatCategory[];
  meetings: Meeting[];
  users: User[];
  messages: ChatMessage[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
  createChannel: (channel: Omit<ChatChannel, 'id' | 'createdAt'>) => void;
  scheduleMeeting: (meeting: Omit<Meeting, 'id'>) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  createUser: (userData: any) => Promise<{ success: boolean; message?: string }>;
  fetchUsers: () => Promise<void>;
  editUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
  editRole: (id: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  fetchTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  addActivity: (taskId: string, activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  deleteActivity: (taskId: string, activityId: string) => Promise<void>;
  fetchChannels: () => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, attachment?: any, replyTo?: string | null) => Promise<void>;
  editMessage: (channelId: string, msgId: string, content: string) => Promise<void>;
  deleteMessage: (channelId: string, msgId: string) => Promise<void>;
  typingUsers: { [channelId: string]: { userId: string; userName: string; last: number }[] };
  sendTyping: (channelId: string, userId: string, userName: string) => void;
  lastReadBy: { [channelId: string]: { userId: string; lastReadMessageId: string }[] };
  markAsRead: (channelId: string, lastReadMessageId: string) => Promise<void>;
  reactToMessage: (channelId: string, msgId: string, emoji: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchMeetings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [categories, setCategories] = useState<ChatCategory[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentChannel, setCurrentChannel] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<{ [channelId: string]: { userId: string; userName: string; last: number }[] }>({});
  const [lastReadBy, setLastReadBy] = useState<{ [channelId: string]: { userId: string; lastReadMessageId: string }[] }>({});

  // Fetch tasks from backend
  const fetchTasks = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks.map((task: any) => ({ ...task, id: task._id })));
    }
  };

  // Create task via backend
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      await fetchTasks();
    }
  };

  // Update task via backend
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    await fetchTasks();
  };

  // Delete task via backend
  const deleteTask = async (taskId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchTasks();
  };

  // Fetch roles from backend
  const fetchRoles = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/roles`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setRoles(data.roles.map((role: any) => ({ ...role, id: role._id })));
    }
  };

  // Create role via backend
  const addRole = async (roleData: Omit<Role, 'id'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(roleData),
    });
    if (res.ok) {
      await fetchRoles();
    }
  };

  // Create user via backend
  const createUser = async (userData: any) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return { success: false, message: 'Not authenticated' };
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      return { success: true };
    } else {
      const data = await res.json();
      return { success: false, message: data.message };
    }
  };

  const fetchChannels = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/chat/channels`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setChannels(data.channels.map((c: any) => ({ ...c, id: c._id })));
    }
  };

  const fetchMessages = async (channelId: string) => {
    setCurrentChannel(channelId);
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/chat/channels/${channelId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages.map((m: any) => ({ ...m, id: m._id })));
    }
  };

  const sendMessage = async (channelId: string, content: string, attachment?: any, replyTo?: string | null) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content, attachment, replyTo }),
    });
    await fetchMessages(channelId);
  };

  const createChannel = async (channelData: Omit<ChatChannel, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(channelData),
    });
    await fetchChannels();
  };

  // Create meeting via backend
  const scheduleMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token || !organization) return;
    const res = await fetch(`${API_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(meetingData),
    });
    if (res.ok) {
      await fetchMeetings();
    }
  };

  // Update meeting via backend
  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    await fetchMeetings();
  };

  // Delete meeting via backend
  const deleteMeeting = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/meetings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchMeetings();
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users.map((user: any) => ({ ...user, id: user._id })));
    }
  };

  const editUser = async (id: string, updates: Partial<User>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchUsers();
  };

  const editRole = async (id: string, updates: Partial<Role>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    await fetchRoles();
  };

  const deleteRole = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    console.log('Delete role response:', res.status, data);
    await fetchRoles();
    console.log('Roles after deletion:', roles);
  };

  // Add a comment to a task
  const addComment = async (taskId: string, content: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    await fetchTasks();
  };

  // Delete a comment from a task
  const deleteComment = async (taskId: string, commentId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchTasks();
  };

  // Add an activity to a task
  const addActivity = async (taskId: string, activity: Omit<Activity, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(activity),
    });
    await fetchTasks();
  };

  // Delete an activity from a task
  const deleteActivity = async (taskId: string, activityId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/tasks/${taskId}/activities/${activityId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchTasks();
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/chat/categories`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories.map((cat: any) => ({ ...cat, id: cat._id })));
    }
  };

  // Fetch meetings from backend
  const fetchMeetings = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/meetings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMeetings(data.meetings.map((meeting: any) => ({ ...meeting, id: meeting._id })));
    }
  };

  useEffect(() => {
    if (organization) {
      fetchRoles();
      fetchUsers();
      fetchTasks();
      fetchChannels();
      fetchCategories();
      fetchMeetings();
    }
  }, [organization]);

  useEffect(() => {
    const s = socketIOClient(API_URL.replace('/api', ''));
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socket) return;
    if (currentChannel) {
      socket.emit('join', currentChannel);
    }
    const handleNewMessage = (msg: any) => {
      setMessages(prev => [...prev, { ...msg, id: msg._id || msg.id }]);
    };
    const handleEditMessage = (msg: any) => {
      setMessages(prev => prev.map(m => m.id === (msg._id || msg.id) ? { ...msg, id: msg._id || msg.id } : m));
    };
    const handleDeleteMessage = (msg: any) => {
      setMessages(prev => prev.filter(m => m.id !== (msg.id || msg._id)));
    };
    const handleTyping = ({ channelId, userId, userName }: { channelId: string; userId: string; userName: string }) => {
      setTypingUsers(prev => {
        const now = Date.now();
        const arr = (prev[channelId] || []).filter(u => u.userId !== userId);
        return {
          ...prev,
          [channelId]: [...arr, { userId, userName, last: now }],
        };
      });
    };
    const handleRead = ({ userId, lastReadMessageId, channelId }: { userId: string; lastReadMessageId: string; channelId: string }) => {
      setLastReadBy(prev => {
        const arr = (prev[channelId] || []).filter(r => r.userId !== userId);
        return {
          ...prev,
          [channelId]: [...arr, { userId, lastReadMessageId }],
        };
      });
    };
    const handleReaction = ({ msgId, reactions }: { msgId: string; reactions: any[] }) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m));
    };
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:edit_message', handleEditMessage);
    socket.on('chat:delete_message', handleDeleteMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);
    socket.on('chat:reaction', handleReaction);
    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:edit_message', handleEditMessage);
      socket.off('chat:delete_message', handleDeleteMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      socket.off('chat:reaction', handleReaction);
    };
  }, [socket, currentChannel]);

  // Remove typing users after 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const updated: typeof prev = {};
        for (const channelId in prev) {
          updated[channelId] = prev[channelId].filter(u => now - u.last < 3000);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const editMessage = async (channelId: string, msgId: string, content: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    // No need to refetch, socket will update
  };

  const deleteMessage = async (channelId: string, msgId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    // No need to refetch, socket will update
  };

  const sendTyping = (channelId: string, userId: string, userName: string) => {
    if (socket) {
      socket.emit('chat:typing', { channelId, userId, userName });
    }
  };

  const markAsRead = async (channelId: string, lastReadMessageId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels/${channelId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ lastReadMessageId }),
    });
    // No need to refetch, socket will update
  };

  const reactToMessage = async (channelId: string, msgId: string, emoji: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    });
    // No need to refetch, socket will update
  };

  return (
    <AppContext.Provider value={{
      tasks,
      roles,
      channels,
      categories,
      meetings,
      users,
      messages,
      updateTask,
      createTask,
      addRole,
      createUser,
      createChannel,
      scheduleMeeting,
      updateMeeting,
      deleteMeeting,
      fetchUsers,
      editUser,
      deleteUser,
      fetchRoles,
      editRole,
      deleteRole,
      fetchTasks,
      deleteTask,
      addComment,
      deleteComment,
      addActivity,
      deleteActivity,
      fetchChannels,
      fetchMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      typingUsers,
      sendTyping,
      lastReadBy,
      markAsRead,
      reactToMessage,
      fetchCategories,
      fetchMeetings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};