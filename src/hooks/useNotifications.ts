import { useState, useEffect, useCallback, useMemo } from 'react';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  taskUpdates: boolean;
  mentions: boolean;
  meetings: boolean;
  chatMessages: boolean;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'task' | 'message' | 'mention' | 'meeting' | 'reminder';
  timestamp: Date;
  read: boolean;
  data?: any;
  userId?: string;
}

const NOTIFICATION_SETTINGS_KEY = 'frooxi_notification_settings';
const NOTIFICATIONS_KEY = 'frooxi_notifications';

export const useNotifications = (currentUserId?: string) => {
  // Initialize with default settings (will be loaded from backend)
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    taskUpdates: true,
    mentions: true,
    meetings: true,
    chatMessages: true,
  });

  // Initialize notifications state
  const [allNotifications, setAllNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Load notifications from localStorage
  const loadNotifications = useCallback(() => {
    try {
      if (currentUserId) {
        const saved = localStorage.getItem(`frooxi_notifications_${currentUserId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    return [];
  }, [currentUserId]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadedNotifications = loadNotifications();
    setAllNotifications(loadedNotifications);
  }, [loadNotifications]);

  // Initialize browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Filter notifications for current user
  const notifications = useMemo(() => {
    return allNotifications.filter(n => !n.userId || n.userId === currentUserId);
  }, [allNotifications, currentUserId]);

  // Debug: Log current settings and permission
  useEffect(() => {
    console.log('📧 Current notification state:', {
      settings,
      permission,
      currentUserId,
      notificationCount: notifications.length
    });
  }, [settings, permission, currentUserId, notifications.length]);

  // Handle WebSocket notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<NotificationData>) => {
      const notification = event.detail;
      console.log('📧 Received notification via WebSocket:', notification);
      
      // Ensure timestamp is a Date object
      const notificationWithDate = {
        ...notification,
        timestamp: notification.timestamp instanceof Date 
          ? notification.timestamp 
          : new Date(notification.timestamp)
      };
      
      setAllNotifications(prev => {
        // Check if notification already exists to prevent duplicates
        const exists = prev.some(n => n.id === notificationWithDate.id);
        if (exists) {
          console.log('📧 Notification already exists, skipping duplicate');
          return prev;
        }
        
        const updated = [notificationWithDate, ...prev].slice(0, 100); // Keep last 100
        // Save to localStorage using the correct key
        if (currentUserId) {
          localStorage.setItem(`frooxi_notifications_${currentUserId}`, JSON.stringify(updated));
        }
        return updated;
      });

      // Show browser notification (backend already checked if user has push enabled)
      if (permission === 'granted') {
        try {
          console.log('📧 Showing browser notification:', notification.title);
          const pushNotification = new Notification(notification.title, {
            body: notification.body,
            tag: notification.type,
            icon: '/favicon.ico',
            requireInteraction: false,
            silent: false,
          });
          
          pushNotification.onclick = () => {
            window.focus();
            pushNotification.close();
          };
          
          console.log('📧 Browser notification shown successfully');
        } catch (error) {
          console.error('📧 Browser notification failed:', error);
        }
      } else {
        console.log('📧 Browser notification skipped - permission not granted');
      }
    };

    // Listen for WebSocket notification events
    window.addEventListener('notification:new', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification:new', handleNewNotification as EventListener);
    };
  }, [permission, currentUserId]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('frooxi_token');
      
      if (!token) {
        console.log('📧 No token found, using default settings');
        return;
      }

      const response = await fetch(`${API_URL}/notifications/settings`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        console.log('📧 Loaded notification settings from backend:', data.settings);
      } else {
        console.log('📧 Failed to load settings from backend, using defaults');
      }
    } catch (error) {
      console.error('📧 Error loading settings from backend:', error);
    }
  }, []);

  // Update settings and save to backend
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('frooxi_token');
      
      if (!token) {
        console.log('📧 No token found, cannot update settings');
        return;
      }

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      const response = await fetch(`${API_URL}/notifications/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: updatedSettings }),
      });
      
      if (response.ok) {
        console.log('📧 Settings updated in backend successfully');
      } else {
        console.error('📧 Failed to update settings in backend');
      }
    } catch (error) {
      console.error('📧 Error updating settings in backend:', error);
    }
  }, [settings]);

  // Helper function to get notification settings for any user from backend
  const getUserNotificationSettings = useCallback(async (userId: string): Promise<NotificationSettings> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('frooxi_token');
      
      if (!token) {
        console.log('📧 No token found, using default settings for user:', userId);
        return {
          email: true,
          push: true,
          taskUpdates: true,
          mentions: true,
          meetings: true,
          chatMessages: true,
        };
      }

      const response = await fetch(`${API_URL}/notifications/settings/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📧 Retrieved notification settings for user ${userId}:`, data.settings);
        return data.settings;
      } else {
        console.log(`📧 Failed to get settings for user ${userId}, using defaults`);
      }
    } catch (error) {
      console.error(`📧 Error getting settings for user ${userId}:`, error);
    }
    
    // Return default settings if not found
    return {
      email: true,
      push: true,
      taskUpdates: true,
      mentions: true,
      meetings: true,
      chatMessages: true,
    };
  }, []);

  // Save notifications to localStorage
  const saveNotifications = useCallback((notifications: NotificationData[]) => {
    setAllNotifications(notifications);
    try {
      if (currentUserId) {
        localStorage.setItem(`frooxi_notifications_${currentUserId}`, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [currentUserId]);

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Send browser push notification
  const sendPushNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (!settings.push || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        requireInteraction: false,
        silent: false,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }, [settings.push, permission]);

  // Send email notification via backend
  const sendEmailNotification = useCallback(async (to: string, subject: string, body: string) => {
    if (!settings.email) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('frooxi_token');
      
      const response = await fetch(`${API_URL}/notifications/email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ to, subject, body }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email notification');
      }
      
      const result = await response.json();
      console.log('📧 Email notification sent successfully:', result);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }, [settings.email]);

  // Create notification via backend API
  const createNotification = useCallback(async (
    type: NotificationData['type'],
    title: string,
    body: string,
    targetUserId: string,
    userEmail?: string,
    options?: {
      data?: any;
      emailSubject?: string;
      emailBody?: string;
    }
  ) => {
    console.log('📧 createNotification called:', {
      type,
      title,
      body,
      targetUserId,
      userEmail,
      options,
      settingsEmail: settings.email
    });

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('frooxi_token');
      
      const requestBody = {
        type, 
        title, 
        body, 
        targetUserId, 
        userEmail, 
        options: {
          ...options,
          emailEnabled: settings.email // Pass email setting to backend
        }
      };

      console.log('📧 Sending request to backend:', requestBody);
      
      const response = await fetch(`${API_URL}/notifications/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('📧 Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to create notification');
      }
      
      const result = await response.json();
      console.log('📧 Backend response:', result);
      return result.notification;
    } catch (error) {
      console.error('📧 Failed to create notification:', error);
      throw error;
    }
  }, [settings.email]);

  // Add notification to local list (for backward compatibility)
  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>, targetUserId?: string) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      userId: targetUserId,
    };

    const updated = [newNotification, ...allNotifications].slice(0, 100); // Keep last 100
    saveNotifications(updated);
    return newNotification;
  }, [allNotifications, saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    const updated = allNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  }, [allNotifications, saveNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const updated = allNotifications.map(n => 
      (!n.userId || n.userId === currentUserId) ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  }, [allNotifications, saveNotifications, currentUserId]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    const updated = allNotifications.filter(n => 
      n.userId && n.userId !== currentUserId
    );
    saveNotifications(updated);
  }, [allNotifications, saveNotifications, currentUserId]);

  // Load settings from backend on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Send comprehensive notification
  const sendNotification = useCallback(async (
    type: NotificationData['type'],
    title: string,
    body: string,
    userEmail?: string,
    options?: {
      data?: any;
      emailSubject?: string;
      emailBody?: string;
      targetUserId?: string;
      targetUserSettings?: NotificationSettings;
    }
  ) => {
    console.log('📧 sendNotification called:', {
      type,
      title,
      body,
      userEmail,
      options,
      currentSettings: settings
    });

    if (!options?.targetUserId) {
      console.log('📧 No target user ID provided, skipping notification');
      return;
    }

    // Get target user's settings from backend
    const targetUserSettings = await getUserNotificationSettings(options.targetUserId);
    console.log('📧 Target user settings from backend:', targetUserSettings);

    // Check if this type of notification is enabled for target user
    const typeEnabled = {
      task: targetUserSettings?.taskUpdates ?? true,
      message: targetUserSettings?.chatMessages ?? true,
      mention: targetUserSettings?.mentions ?? true,
      meeting: targetUserSettings?.meetings ?? true,
      reminder: targetUserSettings?.meetings ?? true,
    }[type];

    // Check if email notifications are enabled for target user
    // Only send email if target user's email setting is enabled AND userEmail is provided
    const emailEnabled = targetUserSettings?.email && !!userEmail;

    console.log('📧 Notification checks:', {
      type,
      typeEnabled,
      emailEnabled,
      targetUserEmailSetting: targetUserSettings?.email,
      hasUserEmail: !!userEmail,
      hasTargetUser: !!options?.targetUserId,
      targetUserId: options?.targetUserId
    });

    if (!typeEnabled) {
      console.log('📧 Notification skipped: type disabled for target user');
      return;
    }

    // Create notification via backend
    try {
      console.log('📧 Creating notification via backend with email enabled:', emailEnabled);
      
      await createNotification(
        type,
        title,
        body,
        options.targetUserId,
        emailEnabled ? userEmail : undefined, // Only pass userEmail if email is enabled
        {
          data: options.data,
          emailSubject: emailEnabled ? options.emailSubject : undefined,
          emailBody: emailEnabled ? options.emailBody : undefined,
        }
      );
      
      console.log('📧 Notification created successfully');
    } catch (error) {
      console.error('📧 Failed to send notification:', error);
    }
  }, [
    settings,
    createNotification,
    getUserNotificationSettings,
  ]);

  // Specific notification functions
  const notifyTaskUpdate = useCallback((taskTitle: string, action: string, userEmail?: string, targetUserId?: string, targetUserSettings?: NotificationSettings) => {
    if (!targetUserId) return;
    return sendNotification(
      'task',
      `Task ${action}`,
      `Task "${taskTitle}" has been ${action.toLowerCase()}`,
      userEmail,
      {
        emailSubject: `Task ${action}: ${taskTitle}`,
        emailBody: `Your task "${taskTitle}" has been ${action.toLowerCase()}. Check your dashboard for more details.`,
        targetUserId,
        targetUserSettings,
      }
    );
  }, [sendNotification]);

  const notifyNewMessage = useCallback((senderName: string, channelName: string, message: string, userEmail?: string, targetUserId?: string, targetUserSettings?: NotificationSettings) => {
    if (!targetUserId) return;
    return sendNotification(
      'message',
      `New message from ${senderName}`,
      `${senderName} sent a message in ${channelName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      userEmail,
      {
        emailSubject: `New message in ${channelName}`,
        emailBody: `${senderName} sent a message in ${channelName}:\n\n"${message}"\n\nReply to this message in the app.`,
        targetUserId,
        targetUserSettings,
      }
    );
  }, [sendNotification]);

  const notifyMention = useCallback((senderName: string, channelName: string, message: string, userEmail?: string, targetUserId?: string, targetUserSettings?: NotificationSettings) => {
    if (!targetUserId) return;
    return sendNotification(
      'mention',
      `You were mentioned by ${senderName}`,
      `${senderName} mentioned you in ${channelName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      userEmail,
      {
        emailSubject: `You were mentioned in ${channelName}`,
        emailBody: `${senderName} mentioned you in ${channelName}:\n\n"${message}"\n\nClick here to respond.`,
        targetUserId,
        targetUserSettings,
      }
    );
  }, [sendNotification]);

  const notifyMeetingReminder = useCallback((meetingTitle: string, startTime: Date, userEmail?: string, targetUserId?: string, targetUserSettings?: NotificationSettings) => {
    if (!targetUserId) return;
    const timeString = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return sendNotification(
      'meeting',
      `Meeting reminder: ${meetingTitle}`,
      `Your meeting "${meetingTitle}" starts at ${timeString}`,
      userEmail,
      {
        emailSubject: `Meeting reminder: ${meetingTitle}`,
        emailBody: `Your meeting "${meetingTitle}" starts at ${timeString}.\n\nJoin the meeting in the app.`,
        targetUserId,
        targetUserSettings,
      }
    );
  }, [sendNotification]);

  const notifyTaskReminder = useCallback((taskTitle: string, dueDate: Date, userEmail?: string, targetUserId?: string, targetUserSettings?: NotificationSettings) => {
    if (!targetUserId) return;
    const dateString = dueDate.toLocaleDateString();
    return sendNotification(
      'reminder',
      `Task due soon: ${taskTitle}`,
      `Task "${taskTitle}" is due on ${dateString}`,
      userEmail,
      {
        emailSubject: `Task due soon: ${taskTitle}`,
        emailBody: `Your task "${taskTitle}" is due on ${dateString}.\n\nComplete it in the app.`,
        targetUserId,
        targetUserSettings,
      }
    );
  }, [sendNotification]);

  return {
    // State
    settings,
    notifications,
    permission,
    unreadCount,

    // Actions
    updateSettings,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,

    // Notification functions
    sendNotification,
    notifyTaskUpdate,
    notifyNewMessage,
    notifyMention,
    notifyMeetingReminder,
    notifyTaskReminder,
  };
}; 