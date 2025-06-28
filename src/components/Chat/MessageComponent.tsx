import React, { useState } from 'react';
import { 
  Reply, 
  Edit3, 
  Trash2, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal,
  User,
  Download,
  Eye,
  Pin,
  Heart,
  Laugh,
  Angry,
  Sad,
  Surprised
} from 'lucide-react';
import { ChatMessage, User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';

interface MessageComponentProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  currentUser: UserType | null;
  users: UserType[];
  isAdmin?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  onReaction?: (emoji: string) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  onReply,
  onEdit,
  currentUser,
  users,
  isAdmin = false,
  isPinned = false,
  onPin,
  onReaction
}) => {
  const { deleteMessage } = useApp();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const author = users.find(u => u.id === message.authorId);
  const isOwnMessage = currentUser?.id === message.authorId;
  const canEdit = isOwnMessage;
  const canDelete = isOwnMessage || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleReaction = async (emoji: string) => {
    if (onReaction) {
      onReaction(emoji);
    }
    setShowReactions(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(message.channelId, message.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reactions = message.reactions || [];
  const replyToMessage = message.replyTo ? users.find(u => u.id === message.replyTo) : null;

  const quickReactions = [
    { emoji: '👍', icon: ThumbsUp, color: 'text-green-400' },
    { emoji: '👎', icon: ThumbsDown, color: 'text-red-400' },
    { emoji: '❤️', icon: Heart, color: 'text-red-400' },
    { emoji: '😂', icon: Laugh, color: 'text-yellow-400' },
    { emoji: '😮', icon: Surprised, color: 'text-blue-400' },
    { emoji: '😢', icon: Sad, color: 'text-blue-400' },
    { emoji: '😡', icon: Angry, color: 'text-red-400' },
  ];

  return (
    <div 
      className="group relative hover:bg-slate-800/20 rounded-xl p-4 transition-all duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700/50"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-semibold text-white">
              {author?.name || 'Unknown User'}
            </span>
            <span className="text-xs text-slate-400">
              {formatTime(message.createdAt)}
            </span>
            {message.edited && (
              <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                edited
              </span>
            )}
            {isPinned && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full flex items-center">
                <Pin className="w-3 h-3 mr-1" />
                pinned
              </span>
            )}
          </div>

          {/* Reply Reference */}
          {message.replyTo && (
            <div className="mb-3 pl-4 border-l-2 border-purple-500/50 bg-purple-500/5 rounded-r-lg p-2">
              <div className="flex items-center space-x-2">
                <Reply className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">
                  Replying to {replyToMessage?.name || 'Unknown User'}
                </span>
              </div>
              <div className="text-sm text-slate-300 mt-1 opacity-75">
                {/* You could fetch and display the original message content here */}
                Original message content...
              </div>
            </div>
          )}

          {/* Message Text */}
          <div className="text-slate-300 break-words leading-relaxed">
            {message.content}
          </div>

          {/* Attachment */}
          {message.attachment && (
            <div className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{message.attachment.name}</p>
                    <p className="text-xs text-slate-400">
                      {(message.attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={message.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={message.attachment.url}
                    download={message.attachment.name}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    reaction.userIds.includes(currentUser?.id || '')
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-600/50'
                  }`}
                >
                  <span className="text-base">{reaction.emoji}</span>
                  <span className="font-medium">{reaction.userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="absolute top-2 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl flex items-center space-x-1 p-1">
          {/* Quick Reactions */}
          {quickReactions.slice(0, 3).map((reaction) => {
            const IconComponent = reaction.icon;
            return (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`p-2 ${reaction.color} hover:bg-slate-700/50 rounded-lg transition-colors`}
                title={reaction.emoji}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
          
          <div className="w-px h-6 bg-slate-600/50 mx-1"></div>
          
          <button
            onClick={() => onReply(message)}
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          
          {canEdit && (
            <button
              onClick={() => onEdit(message)}
              className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          
          {isAdmin && !isPinned && onPin && (
            <button
              onClick={onPin}
              className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Pin"
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            title="More reactions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Extended Reactions Panel */}
      {showReactions && (
        <div className="absolute top-14 right-4 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl p-3 flex flex-wrap gap-2 z-20 max-w-xs">
          {quickReactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-xl"
              title={reaction.emoji}
            >
              {reaction.emoji}
            </button>
          ))}
          {/* Additional reactions */}
          {['🎉', '🔥', '💯', '👀', '🤔', '😎', '🚀', '⭐'].map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-xl"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;