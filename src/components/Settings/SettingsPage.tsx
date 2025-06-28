import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Key,
  Save,
  Eye,
  EyeOff,
  Mail,
  CheckSquare,
  MessageSquare,
  AtSign,
  Calendar,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../context/ThemeContext';
import TwoFactorModal from './TwoFactorModal';

const API_URL = '/api';

const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings, requestPermission, permission } = useNotifications(user?.id);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: user?.avatar || '',
    language: 'en',
    timezone: 'UTC',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    ...(isAdmin ? [{ id: 'system', label: 'System', icon: Database }] : []),
  ];

  const themeOptions = [
    { 
      value: 'dark', 
      label: 'Dark', 
      description: 'Dark theme for low-light environments',
      icon: Moon,
      preview: 'bg-slate-900 border-slate-700'
    },
    { 
      value: 'light', 
      label: 'Light', 
      description: 'Light theme for bright environments',
      icon: Sun,
      preview: 'bg-white border-gray-300'
    },
    { 
      value: 'auto', 
      label: 'System', 
      description: 'Automatically match your system preference',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-slate-900 to-white border-slate-500'
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        if (parent === 'notifications') {
          // Update settings through the hook
          updateSettings({ [child]: checkbox.checked });
        } else {
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent as keyof typeof prev] as any,
              [child]: checkbox.checked
            }
          }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('idle');
    
    if (activeTab === 'security') {
      // Handle password change
      if (formData.newPassword && formData.confirmPassword) {
        if (!formData.currentPassword) {
          setSaveStatus('error');
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setSaveStatus('error');
          return;
        }
        
        if (formData.newPassword.length < 6) {
          setSaveStatus('error');
          return;
        }
        
        try {
          const token = localStorage.getItem('frooxi_token');
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword
            })
          });

          if (response.ok) {
            setSaveStatus('success');
            // Clear password fields
            setFormData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }));
          } else {
            const error = await response.json();
            console.error('Password change error:', error);
            setSaveStatus('error');
          }
        } catch (error) {
          console.error('Password change error:', error);
          setSaveStatus('error');
        }
        return;
      }
    }
    
    // Handle profile updates
    const result = await updateProfile({
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar,
    });
    setSaveStatus(result.success ? 'success' : 'error');
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, avatar: data.url }));
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setUploading(false);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'auto') => {
    setTheme(newTheme);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                    
                    {/* Avatar */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-4">
                        <img
                          src={formData.avatar}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <input
                            type="url"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                            placeholder="Enter image URL"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleAvatarFileChange}
                          />
                          <button
                            type="button"
                            className="mt-2 flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <span>Uploading...</span>
                            ) : (
                              <>
                                <span>Upload Image</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-400 mt-1">
                            Enter a URL or upload an image for your profile picture
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Role (Read-only) */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role
                      </label>
                      <div className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  
                  {/* Push Notification Permission */}
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Bell className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Browser Notifications</h4>
                          <p className="text-sm text-gray-400">Receive push notifications in your browser</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          permission === 'granted' ? 'bg-green-500/20 text-green-400' :
                          permission === 'denied' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {permission}
                        </span>
                        {permission === 'default' && (
                          <button
                            onClick={requestPermission}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                          >
                            Enable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white mb-3">Notification Channels</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Mail className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <h5 className="text-white font-medium text-sm">Email Notifications</h5>
                              <p className="text-xs text-gray-400">Receive notifications via email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="notifications.email"
                              checked={settings.email}
                              onChange={handleChange}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                              <Bell className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <h5 className="text-white font-medium text-sm">Push Notifications</h5>
                              <p className="text-xs text-gray-400">Receive push notifications in browser</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="notifications.push"
                              checked={settings.push}
                              onChange={handleChange}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white mb-3">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center">
                            <CheckSquare className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-sm">Task Updates</h5>
                            <p className="text-xs text-gray-400">Get notified when tasks are updated</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications.taskUpdates"
                            checked={settings.taskUpdates}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-sm">Chat Messages</h5>
                            <p className="text-xs text-gray-400">Get notified for new chat messages</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications.chatMessages"
                            checked={settings.chatMessages}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                            <AtSign className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-sm">Mentions</h5>
                            <p className="text-xs text-gray-400">Get notified when you're mentioned</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications.mentions"
                            checked={settings.mentions}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-sm">Meeting Reminders</h5>
                            <p className="text-xs text-gray-400">Get reminded about upcoming meetings</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications.meetings"
                            checked={settings.meetings}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Key className="w-4 h-4 text-purple-400" />
                        <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <button
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => setShowTwoFactorModal(true)}
                      >
                        Enable 2FA
                      </button>
                    </div>

                    {/* Save Button for Security */}
                    <div className="flex justify-end pt-6 border-t border-gray-700">
                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>
                      {saveStatus === 'success' && (
                        <span className="ml-4 text-green-400">Password changed successfully!</span>
                      )}
                      {saveStatus === 'error' && (
                        <span className="ml-4 text-red-400">
                          {!formData.currentPassword && 'Please enter your current password.'}
                          {formData.currentPassword && formData.newPassword !== formData.confirmPassword && 'New passwords do not match.'}
                          {formData.currentPassword && formData.newPassword === formData.confirmPassword && formData.newPassword.length < 6 && 'Password must be at least 6 characters.'}
                          {formData.currentPassword && formData.newPassword === formData.confirmPassword && formData.newPassword.length >= 6 && 'Failed to change password. Please check your current password.'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Appearance Settings</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Customize how Frooxi Workspace looks and feels
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Theme Preference
                      </label>
                      <div className="grid grid-cols-1 gap-4">
                        {themeOptions.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = theme === option.value;
                          
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleThemeChange(option.value as any)}
                              className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                              }`}
                            >
                              <div className="flex items-center space-x-4 flex-1">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  isSelected ? 'bg-purple-600' : 'bg-gray-700'
                                }`}>
                                  <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                
                                <div className="flex-1 text-left">
                                  <h4 className="text-white font-medium">{option.label}</h4>
                                  <p className="text-gray-400 text-sm">{option.description}</p>
                                </div>
                                
                                <div className={`w-16 h-10 rounded-lg border-2 ${option.preview}`}></div>
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                    <CheckSquare className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Theme Preview */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">Preview</h4>
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                          <div>
                            <div className="text-white font-medium">Sample Message</div>
                            <div className="text-gray-400 text-sm">This is how your interface will look</div>
                          </div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-gray-300 text-sm">
                          Your current theme: <span className="font-medium text-purple-400">{themeOptions.find(t => t.value === theme)?.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Appearance Options */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Additional Options</h4>
                      
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-white font-medium text-sm">Compact Mode</h5>
                            <p className="text-xs text-gray-400">Reduce spacing for more content</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked={false}
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-white font-medium text-sm">Animations</h5>
                            <p className="text-xs text-gray-400">Enable smooth transitions and animations</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked={true}
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">General Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && isAdmin && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Database Backup</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Create a backup of your application data
                      </p>
                      <button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Create Backup
                      </button>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">System Logs</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        View and download system logs
                      </p>
                      <button
                        type="button"
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Logs
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeTab !== 'security' && activeTab !== 'appearance' && (
                <div className="flex justify-end pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {activeTab === 'profile' && 'Save Profile'}
                      {activeTab === 'notifications' && 'Save Notifications'}
                      {activeTab === 'preferences' && 'Save Preferences'}
                      {activeTab === 'system' && 'Save System Settings'}
                    </span>
                  </button>
                  {saveStatus === 'success' && (
                    <span className="ml-4 text-green-400">
                      {activeTab === 'profile' && 'Profile updated!'}
                      {activeTab === 'notifications' && 'Notification settings saved!'}
                      {activeTab === 'preferences' && 'Preferences saved!'}
                      {activeTab === 'system' && 'System settings saved!'}
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="ml-4 text-red-400">Failed to save changes.</span>
                  )}
                </div>
              )}

              {/* Success message for appearance changes */}
              {activeTab === 'appearance' && saveStatus === 'success' && (
                <div className="flex justify-end">
                  <span className="text-green-400">Theme updated successfully!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {showTwoFactorModal && (
        <TwoFactorModal
          isOpen={showTwoFactorModal}
          onClose={() => setShowTwoFactorModal(false)}
          onSuccess={() => {
            setShowTwoFactorModal(false);
            setSaveStatus('success');
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;