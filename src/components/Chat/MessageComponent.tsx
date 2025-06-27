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
  Eye
} from 'lucide-react';
import { ChatMessage, User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';

interface MessageComponentProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  currentUser: UserType | null;
  users: UserType[];
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  onReply,
  onEdit,
  currentUser,
  users
}) => {
  const { reactToMessage, deleteMessage } = useApp();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const author = users.find(u => u.id === message.authorId);
  const isOwnMessage = currentUser?.id === message.authorId;
  const canEdit = isOwnMessage;
  const canDelete = isOwnMessage || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleReaction = async (emoji: string) => {
    await reactToMessage(message.channelId, message.id, emoji);
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
  const userReactions = reactions.filter(r => r.userIds.includes(currentUser?.id || ''));

  return (
    <div 
      className="group relative hover:bg-gray-800/20 rounded-lg p-3 transition-all duration-200"
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
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
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
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {message.edited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {/* Reply Reference */}
          {message.replyTo && (
            <div className="mb-2 pl-4 border-l-2 border-gray-600">
              <div className="flex items-center space-x-2">
                <Reply className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  Replying to a message
                </span>
              </div>
            </div>
          )}

          {/* Message Text */}
          <div className="text-gray-300 break-words">
            {message.content}
          </div>

          {/* Attachment */}
          {message.attachment && (
            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded flex items-center justify-center">
                    <Eye className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{message.attachment.name}</p>
                    <p className="text-xs text-gray-400">
                      {(message.attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={message.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={message.attachment.url}
                    download={message.attachment.name}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                    reaction.userIds.includes(currentUser?.id || '')
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-600/50'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="absolute top-0 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg flex items-center space-x-1 p-1">
          <button
            onClick={() => handleReaction('👍')}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            title="Like"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleReaction('👎')}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Dislike"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onReply(message)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          
          {canEdit && (
            <button
              onClick={() => onEdit(message)}
              className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="More reactions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Reactions Panel */}
      {showReactions && (
        <div className="absolute top-12 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
          {['😀', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯'].map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                handleReaction(emoji);
                setShowReactions(false);
              }}
              className="p-2 hover:bg-gray-700/50 rounded transition-colors text-lg"
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