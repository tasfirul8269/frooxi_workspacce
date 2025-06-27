import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, 
  Volume2, 
  Plus, 
  Settings, 
  Users, 
  Search,
  Smile,
  Paperclip,
  Send,
  Reply,
  Edit3,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Globe,
  Mic,
  MicOff,
  Headphones,
  PhoneOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ChatChannel, ChatCategory, ChatMessage } from '../../types';
import CreateChannelModal from './CreateChannelModal';
import CreateCategoryModal from './CreateCategoryModal';
import MessageComponent from './MessageComponent';
import EmojiPicker from './EmojiPicker';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    channels, 
    categories, 
    messages, 
    users,
    fetchChannels, 
    fetchCategories, 
    fetchMessages,
    sendMessage,
    createChannel,
    typingUsers,
    sendTyping,
    markAsRead
  } = useApp();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      // Mark as read when opening channel
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        markAsRead(selectedChannel.id, lastMessage.id);
      }
    }
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Mark as read when new messages arrive
    if (selectedChannel && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.authorId !== user?.id) {
        markAsRead(selectedChannel.id, lastMessage.id);
      }
    }
  }, [messages, selectedChannel, user?.id]);

  const handleChannelSelect = (channel: ChatChannel) => {
    setSelectedChannel(channel);
    setReplyTo(null);
    setEditingMessage(null);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;

    await sendMessage(
      selectedChannel.id, 
      messageInput, 
      undefined, 
      replyTo?.id || null
    );
    
    setMessageInput('');
    setReplyTo(null);
    setShowEmojiPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (selectedChannel && user) {
      sendTyping(selectedChannel.id, user.id, user.name);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        // Typing indicator will automatically expire on the backend
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const filteredChannels = channels.filter(channel => {
    // Filter by search term
    if (searchTerm && !channel.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by permissions for private channels
    if (channel.privacy === 'private' && user) {
      return channel.allowedRoles.includes(user.role);
    }
    
    return true;
  });

  const getChannelsByCategory = (categoryId: string | null) => {
    return filteredChannels.filter(channel => channel.categoryId === categoryId);
  };

  const currentTypingUsers = selectedChannel 
    ? (typingUsers[selectedChannel.id] || []).filter(u => u.userId !== user?.id)
    : [];

  const handleVoiceConnect = () => {
    if (selectedChannel?.type === 'voice') {
      setVoiceConnected(!voiceConnected);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/50 flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chat Channels</h2>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateCategory(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                  title="Create Category"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {/* Uncategorized Channels */}
          {getChannelsByCategory(null).length > 0 && (
            <div className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Text Channels
              </div>
              {getChannelsByCategory(null).map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                    selectedChannel?.id === channel.id
                      ? 'bg-purple-600/20 text-purple-300 backdrop-blur-sm'
                      : 'text-gray-300 hover:bg-gray-800/30 hover:text-white'
                  }`}
                >
                  {channel.type === 'voice' ? (
                    <Volume2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{channel.name}</span>
                  {channel.privacy === 'private' && (
                    <Lock className="w-3 h-3 text-gray-500" />
                  )}
                  {isAdmin && (
                    <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Categorized Channels */}
          {categories.map(category => {
            const categoryChannels = getChannelsByCategory(category.id);
            if (categoryChannels.length === 0) return null;
            
            const isCollapsed = collapsedCategories.has(category.id);
            
            return (
              <div key={category.id} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    <span>{category.name}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryId(category.id);
                        setShowCreateChannel(true);
                      }}
                      className="p-1 hover:bg-gray-700/50 rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </button>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {categoryChannels.map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                          selectedChannel?.id === channel.id
                            ? 'bg-purple-600/20 text-purple-300 backdrop-blur-sm'
                            : 'text-gray-300 hover:bg-gray-800/30 hover:text-white'
                        }`}
                      >
                        {channel.type === 'voice' ? (
                          <Volume2 className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <Hash className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{channel.name}</span>
                        {channel.privacy === 'private' && (
                          <Lock className="w-3 h-3 text-gray-500" />
                        )}
                        {isAdmin && (
                          <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Voice Controls */}
        {selectedChannel?.type === 'voice' && (
          <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Voice Channel</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">3 connected</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceConnect}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  voiceConnected
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                }`}
              >
                {voiceConnected ? (
                  <>
                    <PhoneOff className="w-4 h-4 inline mr-2" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4 inline mr-2" />
                    Connect
                  </>
                )}
              </button>
              
              {voiceConnected && (
                <>
                  <button
                    onClick={() => setMicMuted(!micMuted)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      micMuted
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-gray-700/50 text-gray-300 hover:text-white'
                    }`}
                  >
                    {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setDeafened(!deafened)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      deafened
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-gray-700/50 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* User Panel */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">Online</p>
            </div>
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-gray-900/60 backdrop-blur-xl border-b border-gray-700/50 flex items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                {selectedChannel.type === 'voice' ? (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                ) : (
                  <Hash className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-white">{selectedChannel.name}</h3>
                {selectedChannel.privacy === 'private' && (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                  <Users className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                  <Search className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200">
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onReply={setReplyTo}
                  onEdit={setEditingMessage}
                  currentUser={user}
                  users={users}
                />
              ))}
              
              {/* Typing Indicator */}
              {currentTypingUsers.length > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {currentTypingUsers.map(u => u.userName).join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="px-4 py-2 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">
                      Replying to <span className="text-purple-400">{users.find(u => u.id === replyTo.authorId)?.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-300 mt-1 truncate">{replyTo.content}</p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-gray-900/60 backdrop-blur-xl border-t border-gray-700/50">
              <div className="relative">
                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="w-full px-4 py-3 pr-20 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                
                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker
                      onEmojiSelect={(emoji) => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Channel Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Channel Selected</h3>
              <p className="text-gray-500">Select a channel from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => {
            setShowCreateChannel(false);
            setSelectedCategoryId(null);
          }}
          defaultCategoryId={selectedCategoryId}
        />
      )}

      {showCreateCategory && (
        <CreateCategoryModal onClose={() => setShowCreateCategory(false)} />
      )}
    </div>
  );
};

export default ChatPage;