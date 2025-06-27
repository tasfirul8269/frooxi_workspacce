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
  PhoneOff,
  Pin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Group, ChatMessage } from '../../types';
import CreateGroupModal from './CreateChannelModal';
import MessageComponent from './MessageComponent';
import EmojiPicker from './EmojiPicker';
import EditGroupModal from './EditGroupModal';
import GroupInfoModal from './GroupInfoModal';
import GroupInfoSidebar from './GroupInfoSidebar';

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
        gradient.addColorStop(0, '#10b981'); // Green
        gradient.addColorStop(0.5, '#f59e0b'); // Yellow
        gradient.addColorStop(1, '#ef4444'); // Red
        
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
      <div className="w-full h-8 bg-gray-800/50 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-400">No Audio</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={32}
      className="w-full h-8 rounded-lg bg-gray-800/50"
    />
  );
};

// Helper to generate a color from a string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

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
    leaveGroup
  } = useApp();

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState<{ open: boolean; group: Group | null }>({ open: false, group: null });
  const [showGroupInfo, setShowGroupInfo] = useState<{ open: boolean; group: Group | null }>({ open: false, group: null });

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
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;
      
      // Create local audio element
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Mute local audio to prevent feedback
      }
    } catch (error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  // Create peer connection
  const createPeerConnection = (socketId: string) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        // Create or update remote audio element
        let remoteAudio = remoteAudiosRef.current[socketId];
        if (!remoteAudio) {
          remoteAudio = document.createElement('audio');
          remoteAudio.autoplay = true;
          remoteAudio.volume = 0.5;
          remoteAudio.muted = false; // Ensure audio is not muted
          document.body.appendChild(remoteAudio);
          remoteAudiosRef.current[socketId] = remoteAudio;
        }
        remoteAudio.srcObject = stream;
        
        // Ensure audio plays
        remoteAudio.play().catch(e => {
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
    };

    // Handle ICE candidates
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
    } catch (error) {
    }
  };

  // Connect to voice channel
  const connectToVoice = async () => {
    if (selectedGroup?.type !== 'voice' || !user) return;

    try {
      await initializeWebRTC();
      
      // Join voice channel
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

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    // Remove remote audio elements
    Object.values(remoteAudiosRef.current).forEach(audio => {
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    remoteAudiosRef.current = {};

    // Leave voice channel
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
    
    // Mute/unmute all remote audio
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
      // Mark as read when opening group
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
    // Mark as read when new messages arrive
    if (selectedGroup && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.authorId !== user?.id) {
        markAsRead(selectedGroup.id, lastMessage.id);
      }
    }
  }, [messages, selectedGroup, user?.id]);

  // Debug logging for groups
  useEffect(() => {
  }, [groups]);

  const currentTypingUsers = selectedGroup 
    ? (typingUsers[selectedGroup.id] || []).filter(u => u.userId !== user?.id)
    : [];

  const currentVoiceUsers = selectedGroup 
    ? (voiceUsers[selectedGroup.id] || [])
    : [];

  // Add current user to voice users if they are connected
  const allVoiceUsers = voiceConnected && selectedGroup?.type === 'voice' 
    ? [...currentVoiceUsers, { 
        socketId: 'current-user', 
        id: user?.id || '', 
        name: user?.name || '', 
        avatar: user?.avatar 
      }]
    : currentVoiceUsers;

  // Handle new users joining voice channel
  useEffect(() => {
    if (voiceConnected && selectedGroup && localStreamRef.current) {
      // Create peer connections for existing users
      currentVoiceUsers.forEach(voiceUser => {
        if (voiceUser.socketId && !peerConnectionsRef.current[voiceUser.socketId]) {
          const peerConnection = createPeerConnection(voiceUser.socketId);
          
          // Create offer for new peer
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
            .catch(error => {
            });
        }
      });
    }
  }, [currentVoiceUsers, voiceConnected, selectedGroup]);

  // Handle voice signal events
  useEffect(() => {
    // This would be handled by the socket connection in AppContext
    // For now, we'll set up a listener for voice signals
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

  // Create local audio element
  useEffect(() => {
    if (voiceConnected && !localAudioRef.current) {
      const audio = document.createElement('audio');
      audio.muted = true; // Prevent feedback
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromVoice();
    };
  }, []);

  const handleGroupSelect = (group: Group) => {
    // Disconnect from previous voice channel if switching
    if (voiceConnected && selectedGroup?.type === 'voice') {
      disconnectFromVoice();
    }
    
    setSelectedGroup(group);
    setReplyTo(null);
    setEditingMessage(null);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup) return;

    await sendMessage(
      selectedGroup.id, 
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
    if (selectedGroup && user) {
      sendTyping(selectedGroup.id, user.id, user.name);
      
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

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const filteredGroups = groups.filter(group => {
    // Filter by search term
    if (searchTerm && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filter by permissions for private groups
    if (group.privacy === 'private' && user) {
      // Allow admins to see all private groups
      if (user.role === 'admin' || user.role === 'super_admin') {
        return true;
      }
      // Check if user is a member
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

  // Find the pinned message for the selected group
  const pinnedMessage = selectedGroup && selectedGroup.pinnedMessageId
    ? messages.find(m => m.id === selectedGroup.pinnedMessageId)
    : null;

  const handleReply = (msg: ChatMessage) => setReplyTo(msg);
  const handleEdit = (msg: ChatMessage) => setEditingMessage(msg);

  const filteredMessages = searchTerm
    ? messages.filter(m => {
        const contentMatch = m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase());
        const author = users.find(u => u.id === m.authorId);
        const authorMatch = author && author.name.toLowerCase().includes(searchTerm.toLowerCase());
        return contentMatch || authorMatch;
      })
    : messages;

  return (
    <div className="h-screen bg-gradient-to-br from-[#23263A] via-[#23263A] to-[#23263A] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/50 flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chat Groups</h2>
            {isAdmin && (
              <button
                className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ml-2"
                onClick={() => setShowCreateGroup(true)}
              >
                <Plus className="w-5 h-5 mr-1" />
                Create Group
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-900/80">
          <div className="flex flex-col space-y-3">
            {filteredGroups.map(group => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <div
                  key={group.id}
                  className={`flex items-center bg-gray-900 rounded-xl shadow p-4 hover:bg-gray-800 transition group border-2 ${isSelected ? 'border-purple-500' : 'border-transparent'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleGroupSelect(group)}
                >
                  <div
                    className="w-2 h-10 rounded-lg mr-4"
                    style={{ backgroundColor: stringToColor(group.name) }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-bold text-white">{group.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {group.type === 'voice' ? 'Voice Group' : 'Text Group'}
                      {' · '}
                      {group.members.length} members
                    </div>
                  </div>
                  {group.privacy === 'private' && (
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  )}
                  {isAdmin && (
                    <span
                      className="p-1 ml-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                      onClick={e => { e.stopPropagation(); setShowEditGroup({ open: true, group }); }}
                      title="Edit Group"
                      style={{ display: 'inline-flex' }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Controls */}
        {selectedGroup?.type === 'voice' && (
          <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Voice Group</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  voiceConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-xs text-gray-400">
                  {allVoiceUsers.length} connected
                </span>
              </div>
            </div>
            
            {/* Audio Visualizer */}
            {voiceConnected && (
              <div className="mb-3">
                <AudioVisualizer 
                  stream={localStreamRef.current} 
                  isActive={voiceConnected && !micMuted} 
                />
              </div>
            )}
            
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
                    onClick={toggleMicrophone}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      micMuted
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-gray-700/50 text-gray-300 hover:text-white'
                    }`}
                    title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={toggleDeafen}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      deafened
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-gray-700/50 text-gray-300 hover:text-white'
                    }`}
                    title={deafened ? 'Undeafen' : 'Deafen'}
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Voice Users List */}
            {currentVoiceUsers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700/30">
                <div className="text-xs text-gray-400 mb-2">Connected Users:</div>
                <div className="space-y-1">
                  {allVoiceUsers.map((voiceUser) => (
                    <div key={voiceUser.socketId} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-300">{voiceUser.name}</span>
                      {voiceUser.id === user?.id && (
                        <span className="text-xs text-purple-400">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Main Chat Area + Right Sidebar */}
      <div className="flex-1 flex h-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#23263A] relative">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="h-20 bg-[#23263A] border-b border-[#2D3148] flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-bold text-white flex items-center">
                    {selectedGroup.name}
                    {selectedGroup.privacy === 'private' && (
                      <Lock className="w-5 h-5 text-purple-400 ml-2" />
                    )}
                  </span>
                  <span className="text-xs text-gray-400 ml-4">{selectedGroup.members.length} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-[#23263A]/60 rounded-lg transition-all duration-200" onClick={() => setShowGroupInfo({ open: true, group: selectedGroup })}>
                    <Users className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-[#23263A]/60 rounded-lg transition-all duration-200">
                    <Search className="w-5 h-5" />
                  </button>
                  {isAdmin && (
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-[#23263A]/60 rounded-lg transition-all duration-200">
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pinned Message */}
              {pinnedMessage && (
                <div className="flex items-center bg-[#23263A] border border-[#3A3E5A] rounded-xl shadow p-4 mt-4 mx-8 mb-2">
                  <Pin className="w-5 h-5 text-yellow-400 mr-3" />
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 font-medium block mb-1">Pinned Message</span>
                    <MessageComponent message={pinnedMessage} onReply={() => {}} onEdit={() => {}} currentUser={user} users={users} isAdmin={isAdmin} isPinned={true} />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => unpinMessage(selectedGroup.id)}
                      className="ml-4 px-3 py-1 text-gray-400 hover:text-yellow-400 bg-transparent rounded-lg text-xs font-medium flex items-center"
                      title="Unpin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-4 pt-2">
                <div className="flex flex-col space-y-4">
                  {filteredMessages.map(message => (
                    <div key={message.id} className="relative group">
                      <MessageComponent
                        message={message}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        currentUser={user}
                        users={users}
                        isAdmin={isAdmin}
                        isPinned={selectedGroup.pinnedMessageId === message.id}
                        onPin={() => pinMessage(selectedGroup.id, message.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Preview */}
              {replyTo && (
                <div className="px-8 py-2 bg-[#23263A] border-t border-[#2D3148] flex items-center justify-between rounded-t-xl shadow">
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
              )}

              {/* Message Input */}
              <div className="w-full px-8 pb-8 pt-2">
                <div className="relative flex items-end bg-[#23263A] rounded-2xl shadow-lg border border-[#3A3E5A]">
                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${selectedGroup.name}`}
                    className="w-full px-5 py-4 pr-20 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none rounded-2xl"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-4 bottom-4 flex items-center space-x-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg hover:from-purple-700 hover:to-purple-600 disabled:bg-gray-700 disabled:text-gray-400 transition-all text-xl"
                    >
                      <Send className="w-6 h-6" />
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
            /* No Group Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Group Selected</h3>
                <p className="text-gray-500">Select a group from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
        {/* Right Sidebar: Members & Attachments */}
        {selectedGroup && (
          <div className="w-96 bg-[#23263A] border-l border-[#2D3148] flex flex-col h-full z-40 shadow-xl rounded-l-2xl">
            <GroupInfoSidebar
              group={selectedGroup}
              isAdmin={isAdmin}
              users={users}
              messages={messages}
              onEdit={() => setShowEditGroup({ open: true, group: selectedGroup })}
              onLeave={async () => { if (user) await leaveGroup(selectedGroup.id, user.id); }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
      {showEditGroup.open && showEditGroup.group && (
        <EditGroupModal group={showEditGroup.group} onClose={() => setShowEditGroup({ open: false, group: null })} />
      )}
    </div>
  );
};

export default ChatPage;