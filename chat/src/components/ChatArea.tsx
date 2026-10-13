import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  MicOff,
  ArrowLeft,
  Check,
  CheckCheck,
  Search,
  X,
  Phone,
  Video,
  Info,
  Trash2,
  CornerUpLeft,
  Star,
  Copy,
  MoreVertical,
  Play,
  Pause,
  Image as ImageIcon,
  Lock,
  ChevronDown,
  Sparkles,
  Download,
} from 'lucide-react';
import { UserProfile, ChatConversation, ChatMessage, MessageContentType } from '../types';
import {
  sendMessage,
  subscribeToMessages,
  subscribeToUserProfile,
  markChatMessagesAsRead,
  reactToMessage,
  toggleStarMessage,
  deleteMessage,
  setChatTypingStatus,
  DEFAULT_AVATARS,
} from '../firebase';
import {
  formatTime,
  formatLastSeen,
  formatMessageDateHeader,
  formatSecondsToTime,
} from '../utils/formatters';
import { FormattedMessageText } from './FormattedMessageText';
import {
  playMessageSentSound,
  playMessageReceivedSound,
  playRecordClickSound,
} from '../utils/soundEffects';

interface ChatAreaProps {
  currentUser: UserProfile;
  activeChat: ChatConversation | null;
  onBack: () => void;
  onOpenNewChat: () => void;
  onOpenContactInfo: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  currentWallpaperClass: string;
}

const COMMON_EMOJIS = ['😊', '👍', '❤️', '🔥', '😂', '👋', '🎉', '✨', '👏', '🚀', '🙌', '💯', '🙏', '😍', '😎'];
const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const SAMPLE_PHOTO_ATTACHMENTS = [
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', caption: 'Tropical beach vibes 🏝️' },
  { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', caption: 'Coding the new Web client 💻' },
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', caption: 'Silicon architecture chips ⚡' },
  { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80', caption: 'Clean workspace aesthetic ✨' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  currentUser,
  activeChat,
  onBack,
  onOpenNewChat,
  onOpenContactInfo,
  onStartCall,
  currentWallpaperClass,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserLive, setOtherUserLive] = useState<UserProfile | null>(null);

  // Modals & Panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Message menu popover
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

  // Voice note recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Audio message playback states (messageId -> playback progress)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState<number>(1);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Identify other participant
  const otherParticipantId = activeChat?.participants.find((p) => p !== currentUser.uid);
  const otherParticipantInitial = otherParticipantId
    ? activeChat?.participantDetails?.[otherParticipantId]
    : null;

  // Real-time listener for other user
  useEffect(() => {
    if (!otherParticipantId) {
      setOtherUserLive(null);
      return;
    }
    const unsubscribe = subscribeToUserProfile(otherParticipantId, (user) => {
      setOtherUserLive(user);
    });
    return () => unsubscribe();
  }, [otherParticipantId]);

  // Real-time listener for messages in current chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeChat.id, (msgs) => {
      // Check if new incoming message arrived to play received sound
      if (msgs.length > messages.length && messages.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.senderId !== currentUser.uid) {
          playMessageReceivedSound();
        }
      }

      setMessages(msgs);
      markChatMessagesAsRead(activeChat.id, currentUser.uid);
    });

    return () => unsubscribe();
  }, [activeChat?.id, currentUser.uid]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle typing status broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeChat) return;

    setChatTypingStatus(activeChat.id, currentUser.uid, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat) {
        setChatTypingStatus(activeChat.id, currentUser.uid, false);
      }
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setSending(true);

    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text,
          senderName: replyingTo.senderName,
          type: replyingTo.type,
        }
      : undefined;

    setReplyingTo(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setChatTypingStatus(activeChat.id, currentUser.uid, false);

    try {
      await sendMessage(activeChat.id, textToSend, currentUser, {
        type: 'text',
        replyTo: replyPayload,
      });
      playMessageSentSound();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Send Image attachment
  const handleSendImage = async (url: string, caption: string) => {
    if (!activeChat) return;
    setShowAttachMenu(false);
    try {
      await sendMessage(activeChat.id, caption || '📷 Photo', currentUser, {
        type: 'image',
        mediaUrl: url,
        mediaCaption: caption,
      });
      playMessageSentSound();
    } catch (err) {
      console.error('Failed to send image:', err);
    }
  };

  // Start Voice Note Recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    playRecordClickSound();

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Cancel Voice Note Recording
  const cancelRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
  };

  // Finish and Send Voice Note
  const finishAndSendRecording = async () => {
    if (!activeChat) return;
    const duration = Math.max(1, recordingSeconds);
    cancelRecording();
    playRecordClickSound();

    try {
      await sendMessage(activeChat.id, `🎙️ Voice message (${duration}s)`, currentUser, {
        type: 'audio',
        mediaDuration: duration,
      });
      playMessageSentSound();
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  // Audio message simulated playback
  const togglePlayAudio = (msgId: string, durationSec: number = 10) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      // Simulate progress scrubber
      let currentSec = audioProgress[msgId] || 0;
      const interval = setInterval(() => {
        currentSec += 0.25 * audioPlaybackSpeed;
        if (currentSec >= durationSec) {
          clearInterval(interval);
          setPlayingAudioId(null);
          setAudioProgress((prev) => ({ ...prev, [msgId]: 0 }));
        } else {
          setAudioProgress((prev) => ({ ...prev, [msgId]: currentSec }));
        }
      }, 250);
    }
  };

  const cycleAudioSpeed = () => {
    if (audioPlaybackSpeed === 1) setAudioPlaybackSpeed(1.5);
    else if (audioPlaybackSpeed === 1.5) setAudioPlaybackSpeed(2);
    else setAudioPlaybackSpeed(1);
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard?.writeText(text);
    setActiveMenuMessageId(null);
  };

  // If no chat selected, show authentic WhatsApp Web desktop greeting screen
  if (!activeChat || !otherParticipantId) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#222e35] p-8 text-center relative overflow-hidden border-b-[6px] border-[#00a884]">
        <div className="w-24 h-24 rounded-full bg-[#111b21] border border-[#2a3942] text-[#00a884] flex items-center justify-center mb-6 shadow-xl ring-4 ring-[#00a884]/20">
          <Lock className="w-10 h-10 stroke-[2]" />
        </div>
        <h2 className="text-3xl font-light text-[#e9edef] tracking-tight">
          Orbitto Web
        </h2>
        <p className="text-[#8696a0] text-sm mt-3 max-w-md leading-relaxed">
          Send and receive end-to-end encrypted messages, voice notes, photos, and live reactions without keeping your phone online.
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs text-[#8696a0] bg-[#111b21] px-4 py-2 rounded-full border border-[#2a3942]">
          <Lock className="w-3.5 h-3.5 text-[#00a884]" />
          <span>End-to-end encrypted. Use Orbitto on up to 4 linked devices.</span>
        </div>

        <button
          onClick={onOpenNewChat}
          className="mt-6 py-2.5 px-6 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 text-xs transition cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start a New Conversation</span>
        </button>
      </div>
    );
  }

  const otherUser: UserProfile = otherUserLive || {
    uid: otherParticipantId,
    displayName: otherParticipantInitial?.displayName || 'User',
    email: otherParticipantInitial?.email || '',
    photoURL: otherParticipantInitial?.photoURL || DEFAULT_AVATARS[0],
    bio: otherParticipantInitial?.bio || '',
    status: 'offline',
    lastSeen: null,
  };

  const isOtherTyping = activeChat.typingUsers?.[otherParticipantId] || false;

  // Filter messages if search is active
  const filteredMessages = inChatSearch.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(inChatSearch.toLowerCase().trim()))
    : messages;

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0b141a] overflow-hidden relative">
      <header className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-[#aebac1] hover:text-white rounded-full transition cursor-pointer shrink-0 active:bg-[#2a3942]"
            aria-label="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenContactInfo}
            className="flex items-center gap-2.5 sm:gap-3 text-left group min-w-0 cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={
                  otherUser.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={otherUser.displayName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-white/10"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#202c33] ${
                  otherUser.status === 'online' ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                }`}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#e9edef] truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none group-hover:text-[#00a884] transition">
                {otherUser.displayName}
              </h3>
              <p className="text-[11px] truncate">
                {isOtherTyping ? (
                  <span className="text-[#00a884] font-medium animate-pulse">typing...</span>
                ) : otherUser.status === 'online' ? (
                  <span className="text-[#00a884] font-medium">online</span>
                ) : (
                  <span className="text-[#8696a0]">{formatLastSeen(otherUser.status, otherUser.lastSeen)}</span>
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          <button
            onClick={() => onStartCall('video')}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => onStartCall('voice')}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSearchBox(!showSearchBox)}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenContactInfo}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="Contact Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* In-chat search dropdown bar */}
      {showSearchBox && (
        <div className="p-2.5 bg-[#202c33] border-b border-[#2a3942] flex items-center gap-2 animate-in slide-in-from-top-2">
          <Search className="w-4 h-4 text-[#8696a0] ml-2" />
          <input
            type="text"
            value={inChatSearch}
            onChange={(e) => setInChatSearch(e.target.value)}
            placeholder="Search messages in this chat..."
            className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8696a0] focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              setShowSearchBox(false);
              setInChatSearch('');
            }}
            className="p-1 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Messages Canvas with WhatsApp Doodle Background */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${currentWallpaperClass}`}>
        {/* Encryption notice pill */}
        <div className="flex justify-center my-2">
          <div className="bg-[#182229] border border-[#2a3942] text-[#ffd279] text-[11px] px-3.5 py-1.5 rounded-xl text-center max-w-sm flex items-center gap-2 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-[#ffd279] shrink-0" />
            <span>Messages are end-to-end encrypted. No one outside this chat can read or listen to them.</span>
          </div>
        </div>

        {/* Message groups and bubbles */}
        {filteredMessages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.uid;
          const showDateHeader =
            index === 0 ||
            formatMessageDateHeader(msg.timestamp) !==
              formatMessageDateHeader(filteredMessages[index - 1]?.timestamp);

          const isStarred = msg.starredBy?.includes(currentUser.uid);
          const reactions = msg.reactions || {};
          const isMenuOpen = activeMenuMessageId === msg.id;

          return (
            <React.Fragment key={msg.id}>
              {/* Date Header Pill */}
              {showDateHeader && (
                <div className="flex justify-center my-3">
                  <span className="bg-[#182229] border border-[#2a3942] text-[#8696a0] text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-lg shadow-sm">
                    {formatMessageDateHeader(msg.timestamp)}
                  </span>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`group flex items-end gap-1.5 ${
                  isMe ? 'justify-end' : 'justify-start'
                } relative`}
              >
                {/* Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs shadow-md transition ${
                    isMe
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-br-xs'
                      : 'bg-[#202c33] text-[#e9edef] rounded-bl-xs'
                  } ${msg.deletedForEveryone ? 'italic opacity-60' : ''}`}
                >
                  {/* Quoted reply box preview */}
                  {msg.replyTo && (
                    <div className="mb-1.5 p-2 bg-black/20 border-l-4 border-[#00a884] rounded-md text-[11px] opacity-90">
                      <span className="font-bold text-[#00a884] block">{msg.replyTo.senderName}</span>
                      <span className="truncate block text-slate-300">{msg.replyTo.text}</span>
                    </div>
                  )}

                  {/* Image Attachment content */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="mb-1.5 rounded-xl overflow-hidden cursor-pointer">
                      <img
                        src={msg.mediaUrl}
                        alt="Shared image"
                        onClick={() => setPreviewImageModal(msg.mediaUrl!)}
                        className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition"
                      />
                      {msg.mediaCaption && (
                        <p className="mt-1.5 text-xs text-white">{msg.mediaCaption}</p>
                      )}
                    </div>
                  )}

                  {/* Audio Voice Note Player */}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px]">
                      <button
                        onClick={() => togglePlayAudio(msg.id, msg.mediaDuration || 8)}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Waveform visualizer bars */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1 h-6">
                          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 65, 35, 75, 55].map((h, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                playingAudioId === msg.id && i <= Math.floor(((audioProgress[msg.id] || 0) / (msg.mediaDuration || 8)) * 14)
                                  ? 'bg-[#00a884]'
                                  : 'bg-white/40'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/70">
                          <span>
                            {formatSecondsToTime(
                              playingAudioId === msg.id
                                ? Math.floor(audioProgress[msg.id] || 0)
                                : msg.mediaDuration || 0
                            )}
                          </span>
                          <button
                            onClick={cycleAudioSpeed}
                            className="px-1.5 py-0.5 rounded bg-black/30 font-bold hover:bg-black/50"
                          >
                            {audioPlaybackSpeed}x
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard text content */}
                  {msg.type !== 'image' && msg.type !== 'audio' && (
                    <div className="text-sm font-normal leading-relaxed break-words">
                      <FormattedMessageText text={msg.text} isMe={isMe} />
                    </div>
                  )}

                  {/* Footer: Timestamp, Star, Read status ticks */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/70 float-right ml-3">
                    {isStarred && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMe && !msg.deletedForEveryone && (
                      <span className="ml-0.5">
                        {msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-white/70 stroke-[2]" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Reactions badge */}
                  {Object.keys(reactions).length > 0 && (
                    <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 bg-[#111b21] border border-[#2a3942] rounded-full px-1.5 py-0.5 shadow text-[11px]">
                      {Object.entries(reactions).map(([uid, emo]) => (
                        <span key={uid}>{emo}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Quick Action Menu for Message */}
                <div
                  className={`opacity-0 group-hover:opacity-100 transition flex items-center gap-1 ${
                    isMe ? 'order-first' : ''
                  }`}
                >
                  {/* Reaction trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuMessageId(isMenuOpen ? null : msg.id)}
                      className="p-1 hover:bg-[#202c33] rounded text-[#8696a0] hover:text-white cursor-pointer"
                      title="React & options"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Quick Reactions Bar Popup */}
                    {isMenuOpen && (
                      <div className="absolute bottom-6 left-0 z-30 bg-[#202c33] border border-[#2a3942] rounded-2xl p-1.5 shadow-2xl flex items-center gap-1 animate-in zoom-in-90">
                        {QUICK_REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              reactToMessage(activeChat.id, msg.id, currentUser.uid, emoji);
                              setActiveMenuMessageId(null);
                            }}
                            className="p-1 hover:scale-125 transition text-base cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                        <div className="w-[1px] h-4 bg-[#2a3942] mx-1" />
                        <button
                          onClick={() => {
                            setReplyingTo(msg);
                            setActiveMenuMessageId(null);
                            inputRef.current?.focus();
                          }}
                          className="p-1 text-[#8696a0] hover:text-white text-xs cursor-pointer"
                          title="Reply"
                        >
                          <CornerUpLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            toggleStarMessage(activeChat.id, msg.id, currentUser.uid);
                            setActiveMenuMessageId(null);
                          }}
                          className="p-1 text-[#8696a0] hover:text-amber-400 text-xs cursor-pointer"
                          title="Star"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg.text)}
                          className="p-1 text-[#8696a0] hover:text-white text-xs cursor-pointer"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {isMe && (
                          <button
                            onClick={() => {
                              deleteMessage(activeChat.id, msg.id, true);
                              setActiveMenuMessageId(null);
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-xs border-l-4 border-[#00a884] pl-2 min-w-0">
            <div>
              <span className="font-bold text-[#00a884] block">Replying to {replyingTo.senderName}</span>
              <span className="text-[#8696a0] truncate block max-w-md">{replyingTo.text}</span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Voice Recording UI Overlay */}
      {isRecording ? (
        <div className="px-4 py-3 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-sm font-semibold text-rose-400">
              {formatSecondsToTime(recordingSeconds)}
            </span>
            <span className="text-xs text-[#8696a0] hidden sm:inline">Recording audio note...</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="p-2 hover:bg-[#2a3942] text-rose-400 rounded-full transition cursor-pointer"
              title="Cancel recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={finishAndSendRecording}
              className="p-2.5 bg-[#00a884] hover:bg-[#008069] text-white rounded-full transition cursor-pointer shadow-md"
              title="Send voice note"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Bottom Input Bar (WhatsApp Web style) */
        <footer className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-1.5 sm:gap-2 shrink-0 z-10 relative safe-area-bottom">
          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className="p-2 text-[#8696a0] hover:text-white rounded-full hover:bg-[#2a3942] transition cursor-pointer shrink-0"
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji palette modal */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-30 bg-[#202c33] border border-[#2a3942] rounded-2xl p-3 shadow-2xl w-64 max-w-[calc(100vw-2rem)]">
                <span className="text-[11px] font-semibold text-[#8696a0] block mb-2">QUICK EMOJIS</span>
                <div className="grid grid-cols-5 gap-2 text-xl">
                  {COMMON_EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => addEmoji(emo)}
                      className="p-1 hover:bg-[#2a3942] rounded-lg transition cursor-pointer text-center"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachment Paperclip Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className="p-2 text-[#8696a0] hover:text-white rounded-full hover:bg-[#2a3942] transition cursor-pointer shrink-0"
              title="Attach photos or files"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Attachment options popup */}
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 z-30 bg-[#202c33] border border-[#2a3942] rounded-2xl p-3 shadow-2xl w-72 max-w-[calc(100vw-2rem)] space-y-2">
                <span className="text-[11px] font-semibold text-[#8696a0] block mb-1">ATTACH MEDIA</span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_PHOTO_ATTACHMENTS.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendImage(photo.url, photo.caption)}
                      className="group relative rounded-lg overflow-hidden border border-[#2a3942] cursor-pointer"
                    >
                      <img src={photo.url} alt="preset" className="h-16 w-full object-cover group-hover:scale-105 transition" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white p-0.5 truncate">
                        {photo.caption}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Input Form */}
          <form onSubmit={handleSend} className="flex-1 flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type a message"
              className="w-full bg-[#2a3942] border border-transparent rounded-xl px-3.5 sm:px-4 py-2.5 text-sm sm:text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]/40"
            />
          </form>

          {/* Send or Voice Note Record Button */}
          {inputText.trim() ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="p-2.5 bg-[#00a884] hover:bg-[#008069] text-white rounded-full transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-2.5 hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] rounded-full transition cursor-pointer"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </footer>
      )}

      {/* Lightbox Modal for Image Expansion */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImageModal} alt="Expanded" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
