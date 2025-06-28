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
  MoreHorizontal,
  X,
  Lock,
  Globe,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Pin,
  Edit3,
  Trash2,
  Reply,
  AtSign,
  Image,
  File,
  Video,
  Calendar,
  Star,
  Archive,
  Bell,
  BellOff,
  UserPlus,
  LogOut,
  Crown,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Group, ChatMessage } from '../../types';
import CreateGroupModal from './CreateChannelModal';
import MessageComponent from './MessageComponent';
import EmojiPicker from './EmojiPicker';
import EditGroupModal from './EditGroupModal';

// Audio Visualizer Component
const AudioVisualizer: React.FC<{ stream: MediaStream | null; isActive: boolean }> = ({ stream, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !ctx || !canvas) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#9333ea');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [stream, isActive]);

  if (!isActive) {
    return (
      <div className="w-full h-8 bg-slate-800/50 rounded-lg flex items-center justify-center">
        <span className="text-xs text-slate-400">No Audio</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={32}
      className="w-full h-8 rounded-lg bg-slate-800/50"
    />
  );
};

// Helper to generate a color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', 
    '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
  ];
  return colors[Math.abs(hash) % colors.length];
}

// Feedback Modal Component
const FeedbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
            Feedback
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          Help us improve! What didn't you like about this message?
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your feedback (optional)..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    groups, 
    messages, 
    users,
    fetchGroups, 
    fetchMessages,
    sendMessage,
    typingUsers,
    sendTyping,
    markAsRead,
    voiceUsers,
    joinVoiceChannel,
    leaveVoiceChannel,
    sendVoiceSignal,
    pinMessage,
    unpinMessage,
    leaveGroup,
    reactToMessage
  } = useApp();

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState<{ open: boolean; group: Group | null }>({ open: false, group: null });
  const [showMembersList, setShowMembersList] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);

  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudiosRef = useRef<{ [socketId: string]: HTMLAudioElement }>({});

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Initialize WebRTC
  const initializeWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }
    } catch (error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  // Create peer connection
  const createPeerConnection = (socketId: string) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        let remoteAudio = remoteAudiosRef.current[socketId];
        if (!remoteAudio) {
          remoteAudio = document.createElement('audio');
          remoteAudio.autoplay = true;
          remoteAudio.volume = 0.5;
          remoteAudio.muted = false;
          document.body.appendChild(remoteAudio);
          remoteAudiosRef.current[socketId] = remoteAudio;
        }
        remoteAudio.srcObject = stream;
        remoteAudio.play().catch(e => {});
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendVoiceSignal(selectedGroup!.id, socketId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnectionsRef.current[socketId] = peerConnection;
    return peerConnection;
  };

  // Handle voice signals
  const handleVoiceSignal = async (from: string, data: any) => {
    if (!selectedGroup) return;

    let peerConnection = peerConnectionsRef.current[from];
    
    try {
      switch (data.type) {
        case 'offer':
          if (!peerConnection) {
            peerConnection = createPeerConnection(from);
          }
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendVoiceSignal(selectedGroup.id, from, {
            type: 'answer',
            answer: answer
          });
          break;

        case 'answer':
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          break;

        case 'ice-candidate':
          if (peerConnection && peerConnection.remoteDescription) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;
      }
    } catch (error) {}
  };

  // Connect to voice channel
  const connectToVoice = async () => {
    if (selectedGroup?.type !== 'voice' || !user) return;

    try {
      await initializeWebRTC();
      
      joinVoiceChannel(selectedGroup.id, {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      });

      setVoiceConnected(true);
    } catch (error) {
      alert('Failed to connect to voice channel. Please check microphone permissions.');
    }
  };

  // Disconnect from voice channel
  const disconnectFromVoice = () => {
    if (!selectedGroup) return;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    Object.values(remoteAudiosRef.current).forEach(audio => {
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    remoteAudiosRef.current = {};

    leaveVoiceChannel(selectedGroup.id);
    setVoiceConnected(false);
    setMicMuted(false);
    setDeafened(false);
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle deafen
  const toggleDeafen = () => {
    const newDeafened = !deafened;
    setDeafened(newDeafened);
    
    Object.values(remoteAudiosRef.current).forEach(audio => {
      audio.muted = newDeafened;
    });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        markAsRead(selectedGroup.id, lastMessage.id);
      }
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedGroup && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.authorId !== user?.id) {
        markAsRead(selectedGroup.id, lastMessage.id);
      }
    }
  }, [messages, selectedGroup, user?.id]);

  const currentTypingUsers = selectedGroup 
    ? (typingUsers[selectedGroup.id] || []).filter(u => u.userId !== user?.id)
    : [];

  const currentVoiceUsers = selectedGroup 
    ? (voiceUsers[selectedGroup.id] || [])
    : [];

  const allVoiceUsers = voiceConnected && selectedGroup?.type === 'voice' 
    ? [...currentVoiceUsers, { 
        socketId: 'current-user', 
        id: user?.id || '', 
        name: user?.name || '', 
        avatar: user?.avatar 
      }]
    : currentVoiceUsers;

  useEffect(() => {
    if (voiceConnected && selectedGroup && localStreamRef.current) {
      currentVoiceUsers.forEach(voiceUser => {
        if (voiceUser.socketId && !peerConnectionsRef.current[voiceUser.socketId]) {
          const peerConnection = createPeerConnection(voiceUser.socketId);
          
          peerConnection.createOffer()
            .then(offer => {
              return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
              sendVoiceSignal(selectedGroup.id, voiceUser.socketId, {
                type: 'offer',
                offer: peerConnection.localDescription
              });
            })
            .catch(error => {});
        }
      });
    }
  }, [currentVoiceUsers, voiceConnected, selectedGroup]);

  useEffect(() => {
    const handleVoiceSignalEvent = (event: any) => {
      if (event.detail && event.detail.from && event.detail.data) {
        handleVoiceSignal(event.detail.from, event.detail.data);
      }
    };

    window.addEventListener('voice-signal', handleVoiceSignalEvent);
    
    return () => {
      window.removeEventListener('voice-signal', handleVoiceSignalEvent);
    };
  }, [selectedGroup]);

  useEffect(() => {
    if (voiceConnected && !localAudioRef.current) {
      const audio = document.createElement('audio');
      audio.muted = true;
      audio.autoplay = true;
      document.body.appendChild(audio);
      localAudioRef.current = audio;
    }
    
    return () => {
      if (localAudioRef.current && localAudioRef.current.parentNode) {
        localAudioRef.current.parentNode.removeChild(localAudioRef.current);
        localAudioRef.current = null;
      }
    };
  }, [voiceConnected]);

  useEffect(() => {
    return () => {
      disconnectFromVoice();
    };
  }, []);

  const handleGroupSelect = (group: Group) => {
    if (voiceConnected && selectedGroup?.type === 'voice') {
      disconnectFromVoice();
    }
    
    setSelectedGroup(group);
    setShowMembersList(false);
    setShowGroupSettings(false);
    setReplyingTo(null);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup) return;

    await sendMessage(
      selectedGroup.id, 
      messageInput, 
      undefined, 
      replyingTo?.id || null
    );
    
    setMessageInput('');
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    if (selectedGroup && user) {
      sendTyping(selectedGroup.id, user.id, user.name);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {}, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredGroups = groups.filter(group => {
    if (searchTerm && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (group.privacy === 'private' && user) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        return true;
      }
      return group.members.includes(user.id);
    }
    return true;
  });

  const handleVoiceConnect = () => {
    if (selectedGroup?.type === 'voice') {
      if (!voiceConnected) {
        connectToVoice();
      } else {
        disconnectFromVoice();
      }
    }
  };

  const pinnedMessage = selectedGroup && selectedGroup.pinnedMessageId
    ? messages.find(m => m.id === selectedGroup.pinnedMessageId)
    : null;

  const memberUsers = users.filter(u => selectedGroup?.members.includes(u.id));

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedGroup) return;
    
    // Handle dislike with feedback
    if (emoji === '👎') {
      setFeedbackMessageId(messageId);
      setShowFeedbackModal(true);
    }
    
    await reactToMessage(selectedGroup.id, messageId, emoji);
  };

  const handleFeedbackSubmit = (feedback: string) => {
    // Here you could send the feedback to your backend
    console.log('Feedback for message:', feedbackMessageId, 'Feedback:', feedback);
    // You could add an API call here to save the feedback
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const handlePin = async (messageId: string) => {
    if (!selectedGroup) return;
    await pinMessage(selectedGroup.id, messageId);
  };

  const handleUnpin = async () => {
    if (!selectedGroup) return;
    await unpinMessage(selectedGroup.id);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Enhanced Sidebar */}
      <div
        className="bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl"
        style={{
          width: 320,
          minWidth: 320,
          maxWidth: 320,
        }}
      >
        {/* Server Header */}
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chat Groups</h2>
                <p className="text-xs text-slate-400">Stay connected with your team</p>
              </div>
            </div>
            
            {isAdmin && (
              <button
                className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="text-sm">New</span>
              </button>
            )}
          </div>
          
          {/* Enhanced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Enhanced Groups List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredGroups.map(group => {
            const isSelected = selectedGroup?.id === group.id;
            const groupColor = stringToColor(group.name);
            const unreadCount = 0; // You can implement unread count logic here
            
            return (
              <div
                key={group.id}
                className={`group relative flex items-center p-4 rounded-xl transition-all duration-200 cursor-pointer hover:bg-slate-800/60 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleGroupSelect(group)}
              >
                {/* Group Icon */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: groupColor }}
                  >
                    {group.type === 'voice' ? (
                      <Volume2 className="w-6 h-6 text-white" />
                    ) : (
                      <Hash className="w-6 h-6 text-white" />
                    )}
                  </div>
                  {group.type === 'voice' && allVoiceUsers.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{allVoiceUsers.length}</span>
                    </div>
                  )}
                </div>

                {/* Group Info */}
                <div className="flex-1 ml-4 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white truncate">{group.name}</h3>
                    {group.privacy === 'private' && (
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    {group.pinnedMessageId && (
                      <Pin className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {group.type === 'voice' ? 'Voice Group' : 'Text Group'}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {group.members.length} members
                    </span>
                  </div>
                </div>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <button
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditGroup({ open: true, group });
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enhanced Voice Controls */}
        {selectedGroup?.type === 'voice' && (
          <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-white">Voice Channel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  voiceConnected ? 'bg-green-500' : 'bg-slate-500'
                }`}></div>
                <span className="text-xs text-slate-400">
                  {allVoiceUsers.length} connected
                </span>
              </div>
            </div>
            
            {/* Audio Visualizer */}
            {voiceConnected && (
              <div className="mb-4">
                <AudioVisualizer 
                  stream={localStreamRef.current} 
                  isActive={voiceConnected && !micMuted} 
                />
              </div>
            )}
            
            {/* Voice Controls */}
            <div className="space-y-3">
              <button
                onClick={handleVoiceConnect}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  voiceConnected
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                }`}
              >
                {voiceConnected ? (
                  <>
                    <PhoneOff className="w-4 h-4" />
                    <span>Disconnect</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
              
              {voiceConnected && (
                <div className="flex space-x-2">
                  <button
                    onClick={toggleMicrophone}
                    className={`flex-1 p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                      micMuted
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                    title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={toggleDeafen}
                    className={`flex-1 p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                      deafened
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                    title={deafened ? 'Undeafen' : 'Deafen'}
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Connected Users */}
            {allVoiceUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/30">
                <div className="text-xs text-slate-400 mb-3 font-medium">Connected Users</div>
                <div className="space-y-2">
                  {allVoiceUsers.map((voiceUser) => (
                    <div key={voiceUser.socketId} className="flex items-center space-x-3 p-2 bg-slate-800/30 rounded-lg">
                      <div className="relative">
                        {voiceUser.avatar ? (
                          <img
                            src={voiceUser.avatar}
                            alt={voiceUser.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-slate-900"></div>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{voiceUser.name}</span>
                      {voiceUser.id === user?.id && (
                        <span className="text-xs text-purple-400 font-medium">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced User Panel */}
        <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                {user?.role === 'admin' && <Crown className="w-3 h-3 text-yellow-500" />}
                {user?.role === 'super_admin' && <Shield className="w-3 h-3 text-red-500" />}
              </div>
              <p className="text-xs text-green-400 font-medium">Online</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-800/30 backdrop-blur-sm">
        {selectedGroup ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-8 shadow-lg">
              <div className="flex items-center space-x-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: stringToColor(selectedGroup.name) }}
                >
                  {selectedGroup.type === 'voice' ? (
                    <Volume2 className="w-5 h-5 text-white" />
                  ) : (
                    <Hash className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold text-white">{selectedGroup.name}</h1>
                    {selectedGroup.privacy === 'private' && (
                      <Lock className="w-5 h-5 text-purple-400" />
                    )}
                    {selectedGroup.pinnedMessageId && (
                      <Pin className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {selectedGroup.members.length} members
                    {selectedGroup.type === 'voice' && allVoiceUsers.length > 0 && (
                      <span className="ml-2 text-green-400">• {allVoiceUsers.length} in voice</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
                  onClick={() => setShowMembersList(!showMembersList)}
                >
                  <Users className="w-5 h-5" />
                </button>
                <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200">
                  <Bell className="w-5 h-5" />
                </button>
                {isAdmin && (
                  <button 
                    className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
                    onClick={() => setShowGroupSettings(!showGroupSettings)}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Pinned Message */}
            {pinnedMessage && (
              <div className="flex items-center bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 rounded-xl shadow-lg p-4 mx-8 mt-4 mb-2">
                <Pin className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-yellow-400 font-medium block mb-1">📌 Pinned Message</span>
                  <div className="text-sm text-slate-300 truncate">{pinnedMessage.content}</div>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleUnpin}
                    className="ml-4 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all duration-200"
                    title="Unpin"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Reply Banner */}
            {replyingTo && (
              <div className="flex items-center bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl shadow-lg p-4 mx-8 mt-4 mb-2">
                <Reply className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-blue-400 font-medium block mb-1">Replying to {users.find(u => u.id === replyingTo.authorId)?.name}</span>
                  <div className="text-sm text-slate-300 truncate">{replyingTo.content}</div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-4 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                  title="Cancel Reply"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-4 pt-2">
              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message.id} className="group relative">
                    <MessageComponent
                      message={message}
                      onReply={handleReply}
                      onEdit={() => {}}
                      currentUser={user}
                      users={users}
                      isAdmin={isAdmin}
                      isPinned={selectedGroup.pinnedMessageId === message.id}
                      onPin={() => handlePin(message.id)}
                      onReaction={(emoji) => handleReaction(message.id, emoji)}
                    />
                  </div>
                ))}
                
                {/* Typing Indicators */}
                {currentTypingUsers.length > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-400">
                      {currentTypingUsers.map(u => u.userName).join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Enhanced Message Input */}
            <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
              <div className="relative flex items-end bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/30 overflow-hidden">
                <div className="flex items-center space-x-2 px-4 py-3 border-r border-slate-600/30">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                    <File className="w-5 h-5" />
                  </button>
                </div>
                
                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedGroup.name}...`}
                  className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[56px]"
                  rows={1}
                />
                
                <div className="flex items-center space-x-2 px-4 py-3 border-l border-slate-600/30">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-10">
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
          // Enhanced No Group Selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <MessageSquare className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Welcome to Chat</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Select a group from the sidebar to start chatting with your team. 
                Create voice channels for real-time communication or text channels for ongoing discussions.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
                >
                  Create Your First Group
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Members Sidebar */}
      {showMembersList && selectedGroup && (
        <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Members</h3>
              <button
                onClick={() => setShowMembersList(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {memberUsers.map(member => (
              <div key={member.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-all duration-200">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                    {member.role === 'admin' && <Crown className="w-3 h-3 text-yellow-500" />}
                    {member.role === 'super_admin' && <Shield className="w-3 h-3 text-red-500" />}
                  </div>
                  <p className="text-xs text-slate-400">{member.position || member.role}</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
      
      {showEditGroup.open && showEditGroup.group && (
        <EditGroupModal 
          group={showEditGroup.group} 
          onClose={() => setShowEditGroup({ open: false, group: null })} 
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default ChatPage;