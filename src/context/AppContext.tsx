import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task, Role, Meeting, User, ChatMessage, Group, Activity } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AppContextType {
  tasks: Task[];
  roles: Role[];
  meetings: Meeting[];
  users: User[];
  messages: ChatMessage[];
  groups: Group[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
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
  fetchMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, content: string, attachment?: any, replyTo?: string | null) => Promise<void>;
  editMessage: (groupId: string, msgId: string, content: string) => Promise<void>;
  deleteMessage: (groupId: string, msgId: string) => Promise<void>;
  typingUsers: { [groupId: string]: { userId: string; userName: string; last: number }[] };
  sendTyping: (groupId: string, userId: string, userName: string) => void;
  lastReadBy: { [groupId: string]: { userId: string; lastReadMessageId: string }[] };
  markAsRead: (groupId: string, lastReadMessageId: string) => Promise<void>;
  reactToMessage: (groupId: string, msgId: string, emoji: string) => Promise<void>;
  fetchMeetings: () => Promise<void>;
  // Voice channel functionality
  voiceUsers: { [groupId: string]: { socketId: string; id: string; name: string; avatar?: string }[] };
  joinVoiceChannel: (groupId: string, user: { id: string; name: string; avatar?: string }) => void;
  leaveVoiceChannel: (groupId: string) => void;
  sendVoiceSignal: (groupId: string, targetSocketId: string, signal: any) => void;
  fetchGroups: () => Promise<void>;
  createGroup: (groupData: Omit<Group, 'id' | 'createdAt' | 'organizationId' | 'createdBy'>) => Promise<void>;
  editGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  requestJoinGroup: (groupId: string) => Promise<void>;
  approveJoinRequest: (groupId: string, userId: string) => Promise<void>;
  denyJoinRequest: (groupId: string, userId: string) => Promise<void>;
  pinMessage: (groupId: string, msgId: string) => Promise<void>;
  unpinMessage: (groupId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, organization } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [groupId: string]: { userId: string; userName: string; last: number }[] }>({});
  const [lastReadBy, setLastReadBy] = useState<{ [groupId: string]: { userId: string; lastReadMessageId: string }[] }>({});
  const [voiceUsers, setVoiceUsers] = useState<{ [groupId: string]: { socketId: string; id: string; name: string; avatar?: string }[] }>({});
  
  // Use notifications hook
  const { 
    notifyTaskUpdate, 
    notifyNewMessage, 
    notifyMention, 
    notifyMeetingReminder, 
    notifyTaskReminder 
  } = useNotifications(user?.id);

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
    
    // Notify task assignee about update
    const task = tasks.find(t => t.id === taskId);
    if (task && task.assigneeId && task.assigneeId !== user?.id) {
      const taskAssignee = users.find(u => u.id === task.assigneeId);
      if (taskAssignee) {
        const action = updates.status ? `status changed to ${updates.status}` : 'updated';
        // The notification hook will automatically get the target user's settings
        notifyTaskUpdate(task.title, action, taskAssignee.email, taskAssignee.id);
      }
    }
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

  // Add role via backend
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

  // Edit role via backend
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

  // Delete role via backend
  const deleteRole = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchRoles();
  };

  // Fetch users from backend
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

  // Edit user via backend
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

  // Delete user via backend
  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchUsers();
  };

  // Create user via backend
  const createUser = async (userData: any) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return { success: false, message: 'No token' };
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      await fetchUsers();
      return { success: true };
    } else {
      const error = await res.json();
      return { success: false, message: error.message };
    }
  };

  // Fetch messages from backend
  const fetchMessages = async (channelId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!res.ok) {
      res = await fetch(`${API_URL}/chat/channels/${channelId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
    
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages.map((msg: any) => ({ ...msg, id: msg._id })));
    }
  };

  // Send message via backend
  const sendMessage = async (channelId: string, content: string, attachment?: any, replyTo?: string | null) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content, attachment, replyTo }),
    });
    
    if (!res.ok) {
      res = await fetch(`${API_URL}/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content, attachment, replyTo }),
      });
    }
    
    if (res.ok) {
      await fetchMessages(channelId);
      
      // Check for mentions and notify
      const mentionRegex = /@(\w+)/g;
      const mentions = content.match(mentionRegex);
      if (mentions) {
        mentions.forEach(mention => {
          const username = mention.substring(1);
          const mentionedUser = users.find(u => u.name.toLowerCase().includes(username.toLowerCase()));
          if (mentionedUser && mentionedUser.id !== user?.id) {
            const channel = groups.find(g => g.id === channelId);
            // The notification hook will automatically get the target user's settings
            notifyMention(user?.name || 'Someone', channel?.name || 'a channel', content, mentionedUser.email, mentionedUser.id);
          }
        });
      }
      
      // Notify other users in the channel (excluding the sender)
      const channel = groups.find(g => g.id === channelId);
      if (channel) {
        const otherUsers = users.filter(u => 
          u.id !== user?.id && 
          channel.members?.includes(u.id)
        );
        
        otherUsers.forEach(otherUser => {
          // The notification hook will automatically get the target user's settings
          notifyNewMessage(user?.name || 'Someone', channel.name, content, otherUser.email, otherUser.id);
        });
      }
    }
  };

  // Schedule meeting via backend
  const scheduleMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(meetingData),
    });
    if (res.ok) {
      await fetchMeetings();
      
      // Notify meeting attendees
      if (meetingData.attendees) {
        meetingData.attendees.forEach((attendeeId: string) => {
          const attendee = users.find(u => u.id === attendeeId);
          if (attendee && attendee.id !== user?.id) {
            // The notification hook will automatically get the target user's settings
            notifyMeetingReminder(meetingData.title, new Date(meetingData.startTime), attendee.email, attendee.id);
          }
        });
      }
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

  // Voice channel functions
  const joinVoiceChannel = (channelId: string, userData: { id: string; name: string; avatar?: string }) => {
    console.log('Joining voice channel:', { channelId, userData });
    if (socket && user) {
      // Authenticate user first
      socket.emit('authenticate', user);
      // Join voice channel with new event name
      socket.emit('join-voice-channel', { channelId, user: userData });
    } else {
      console.error('Cannot join voice channel: socket or user not available');
    }
  };

  const leaveVoiceChannel = (channelId: string) => {
    console.log('Leaving voice channel:', channelId);
    if (socket) {
      socket.emit('leave-voice-channel', channelId);
    }
  };

  const sendVoiceSignal = (channelId: string, targetSocketId: string, signal: any) => {
    console.log('Sending voice signal:', { channelId, targetSocketId, signal });
    if (socket) {
      socket.emit('voice-signal', { channelId, targetSocketId, signal });
    }
  };

  const fetchGroups = async () => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/chat/groups`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups.map((group: any) => ({ ...group, id: group._id })));
    }
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'organizationId' | 'createdBy'>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/chat/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(groupData),
    });
    if (res.ok) {
      await fetchGroups();
    }
  };

  const editGroup = async (id: string, updates: Partial<Group>) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    await fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchGroups();
  };

  const leaveGroup = async (groupId: string, userId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    await fetchGroups();
  };

  const requestJoinGroup = async (groupId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/request-join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchGroups();
  };

  const approveJoinRequest = async (groupId: string, userId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/approve-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    await fetchGroups();
  };

  const denyJoinRequest = async (groupId: string, userId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/deny-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    await fetchGroups();
  };

  const pinMessage = async (groupId: string, msgId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/pin-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ msgId }),
    });
    await fetchGroups();
  };

  const unpinMessage = async (groupId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    await fetch(`${API_URL}/chat/groups/${groupId}/unpin-message`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await fetchGroups();
  };

  useEffect(() => {
    if (user?.id && organization?.id) {
      fetchRoles();
      fetchUsers();
      fetchTasks();
      fetchMeetings();
      fetchGroups();
    }
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (!user?.id) return;
    
    const s = io(API_URL.replace('/api', ''));
    setSocket(s);
    
    // Authenticate user when socket connects
    s.on('connect', () => {
      if (user) {
        s.emit('authenticate', user);
      }
    });
    
    return () => { s.disconnect(); };
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    
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
    
    // Voice channel handlers
    const handleVoiceUsers = ({ channelId, users }: { channelId: string; users: { socketId: string; user: { id: string; name: string; avatar?: string } }[] }) => {
      console.log('Voice users received:', { channelId, users });
      setVoiceUsers(prev => ({
        ...prev,
        [channelId]: users.map(u => ({
          socketId: u.socketId,
          id: u.user.id,
          name: u.user.name,
          avatar: u.user.avatar
        }))
      }));
    };

    const handleUserJoinedVoice = ({ socketId, channelId, user }: { socketId: string; channelId: string; user: { id: string; name: string; avatar?: string } }) => {
      console.log('User joined voice:', { socketId, channelId, user });
      setVoiceUsers(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), { socketId, id: user.id, name: user.name, avatar: user.avatar }]
      }));
    };

    const handleUserLeftVoice = ({ socketId, channelId }: { socketId: string; channelId: string }) => {
      console.log('User left voice:', { socketId, channelId });
      setVoiceUsers(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).filter(u => u.socketId !== socketId)
      }));
    };

    const handleVoiceSignal = ({ from, data }: { from: string; data: any }) => {
      console.log('Voice signal received:', { from, data });
      // Emit voice signal event to ChatPage
      window.dispatchEvent(new CustomEvent('voice-signal', {
        detail: { from, data }
      }));
    };

    // Real-time group pin/unpin
    const handleGroupPin = ({ groupId, pinnedMessageId }: { groupId: string; pinnedMessageId: string | null }) => {
      setGroups(prevGroups => prevGroups.map(g =>
        g.id === groupId ? { ...g, pinnedMessageId } : g
      ));
    };

    // Handle new notifications
    const handleNewNotification = (notification: any) => {
      console.log('📧 Received notification via WebSocket:', notification);
      console.log(' Current user ID:', user?.id);
      console.log('📧 Notification target user ID:', notification.userId);
      
      // Only process notifications meant for the current user
      if (notification.userId === user?.id) {
        // Dispatch custom event for useNotifications hook
        window.dispatchEvent(new CustomEvent('notification:new', {
          detail: notification
        }));
      } else {
        console.log('📧 Ignoring notification - not for current user');
      }
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:edit_message', handleEditMessage);
    socket.on('chat:delete_message', handleDeleteMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);
    socket.on('chat:reaction', handleReaction);
    socket.on('voice-users', handleVoiceUsers);
    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('user-left-voice', handleUserLeftVoice);
    socket.on('voice-signal', handleVoiceSignal);
    socket.on('group:pin', handleGroupPin);
    socket.on('notification:new', handleNewNotification);
    
    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:edit_message', handleEditMessage);
      socket.off('chat:delete_message', handleDeleteMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      socket.off('chat:reaction', handleReaction);
      socket.off('voice-users', handleVoiceUsers);
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('user-left-voice', handleUserLeftVoice);
      socket.off('voice-signal', handleVoiceSignal);
      socket.off('group:pin', handleGroupPin);
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, user?.id]);

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
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    
    if (!res.ok) {
      await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
    }
    // No need to refetch, socket will update
  };

  const deleteMessage = async (channelId: string, msgId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/messages/${msgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!res.ok) {
      await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
    // No need to refetch, socket will update
  };

  const sendTyping = (channelId: string, userId: string, userName: string) => {
    if (socket) {
      socket.emit('typing-start', { channelId, userId, userName });
    }
  };

  const markAsRead = async (channelId: string, lastReadMessageId: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ lastReadMessageId }),
    });
    
    if (!res.ok) {
      await fetch(`${API_URL}/chat/channels/${channelId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lastReadMessageId }),
      });
    }
    // No need to refetch, socket will update
  };

  const reactToMessage = async (channelId: string, msgId: string, emoji: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    
    // Try groups endpoint first, then channels
    let res = await fetch(`${API_URL}/chat/groups/${channelId}/messages/${msgId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    });
    
    if (!res.ok) {
      await fetch(`${API_URL}/chat/channels/${channelId}/messages/${msgId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
    }
    // No need to refetch, socket will update
  };

  // Add comment to task
  const addComment = async (taskId: string, content: string) => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      await fetchTasks();
      
      // Notify task assignee about new comment
      const task = tasks.find(t => t.id === taskId);
      if (task && task.assigneeId && task.assigneeId !== user?.id) {
        const taskAssignee = users.find(u => u.id === task.assigneeId);
        if (taskAssignee) {
          // Get target user's notification settings
          const getUserNotificationSettings = (userId: string) => {
            try {
              const stored = localStorage.getItem(`frooxi_notification_settings_${userId}`);
              if (stored) {
                return JSON.parse(stored);
              }
            } catch (error) {
              console.error('Failed to parse user notification settings:', error);
            }
            
            return {
              email: true,
              push: true,
              taskUpdates: true,
              mentions: true,
              meetings: true,
              chatMessages: true,
            };
          };
          
          const targetUserSettings = getUserNotificationSettings(taskAssignee.id);
          notifyTaskUpdate(task.title, 'commented on', taskAssignee.email, taskAssignee.id, targetUserSettings);
        }
      }
    }
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

  // Set up task reminders
  useEffect(() => {
    const checkTaskReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.dueDate && task.status !== 'completed') {
          const dueDate = new Date(task.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          // Notify if due within 24 hours and not already notified today
          if (daysDiff <= 1 && daysDiff > 0) {
            const lastNotified = localStorage.getItem(`task_reminder_${task.id}`);
            const today = new Date().toDateString();
            
            if (lastNotified !== today) {
              // Get target user's notification settings
              const getUserNotificationSettings = (userId: string) => {
                try {
                  const stored = localStorage.getItem(`frooxi_notification_settings_${userId}`);
                  if (stored) {
                    return JSON.parse(stored);
                  }
                } catch (error) {
                  console.error('Failed to parse user notification settings:', error);
                }
                
                return {
                  email: true,
                  push: true,
                  taskUpdates: true,
                  mentions: true,
                  meetings: true,
                  chatMessages: true,
                };
              };
              
              const targetUserSettings = getUserNotificationSettings(user?.id || '');
              notifyTaskReminder(task.title, dueDate, user?.email, user?.id, targetUserSettings);
              localStorage.setItem(`task_reminder_${task.id}`, today);
            }
          }
        }
      });
    };
    
    // Check reminders every hour
    const interval = setInterval(checkTaskReminders, 60 * 60 * 1000);
    checkTaskReminders(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [tasks, user?.id, notifyTaskReminder]);

  return (
    <AppContext.Provider value={{
      tasks,
      roles,
      meetings,
      users,
      messages,
      groups,
      updateTask,
      createTask,
      addRole,
      createUser,
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
      fetchMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      typingUsers,
      sendTyping,
      lastReadBy,
      markAsRead,
      reactToMessage,
      fetchMeetings,
      voiceUsers,
      joinVoiceChannel,
      leaveVoiceChannel,
      sendVoiceSignal,
      createGroup,
      editGroup,
      deleteGroup,
      leaveGroup,
      fetchGroups,
      requestJoinGroup,
      approveJoinRequest,
      denyJoinRequest,
      pinMessage,
      unpinMessage,
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