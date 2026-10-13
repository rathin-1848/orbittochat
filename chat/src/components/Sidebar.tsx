import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  LogOut,
  User,
  CheckCheck,
  Check,
  Sparkles,
  MessageSquare,
  CircleDot,
  Settings,
  Pin,
  BellOff,
  Filter,
  Camera,
  Mic,
  MoreVertical,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserProfile, ChatConversation } from '../types';
import { formatChatListTime } from '../utils/formatters';
import { togglePinChat, toggleMuteChat } from '../firebase';
import { isSoundsMuted, setSoundsMuted } from '../utils/soundEffects';

interface SidebarProps {
  currentUser: UserProfile;
  chats: ChatConversation[];
  activeChatId: string | null;
  onSelectChat: (chat: ChatConversation) => void;
  onOpenNewChat: () => void;
  onOpenProfile: () => void;
  onOpenStatus: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  isMobileChatActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenProfile,
  onOpenStatus,
  onOpenSettings,
  onLogout,
  isMobileChatActive,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(isSoundsMuted());

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    setSoundsMuted(next);
  };

  // Filter conversations
  const filteredChats = chats
    .filter((chat) => {
      const otherParticipantId = chat.participants.find((p) => p !== currentUser.uid);
      const otherInfo = otherParticipantId ? chat.participantDetails?.[otherParticipantId] : null;
      const name = otherInfo?.displayName || 'User';
      const lastMsg = chat.lastMessage?.text || '';

      const term = searchFilter.toLowerCase().trim();
      const matchesSearch = !term || name.toLowerCase().includes(term) || lastMsg.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (activeFilterTab === 'unread') {
        // Chat is unread if last message was sent by other user and not yet read
        return (
          chat.lastMessage &&
          chat.lastMessage.senderId !== currentUser.uid &&
          !chat.lastMessage.readBy?.includes(currentUser.uid)
        );
      }
      if (activeFilterTab === 'favorites') {
        return chat.pinnedBy?.includes(currentUser.uid);
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned chats appear first
      const aPinned = a.pinnedBy?.includes(currentUser.uid) ? 1 : 0;
      const bPinned = b.pinnedBy?.includes(currentUser.uid) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return 0;
    });

  return (
    <aside
      className={`w-full md:w-80 lg:w-[410px] flex flex-col bg-[#111b21] border-r border-[#202c33] shrink-0 h-full ${
        isMobileChatActive ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Top Header Bar (Authentic WhatsApp Web header) */}
      <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942] shrink-0">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 text-left group cursor-pointer hover:opacity-90 transition min-w-0"
          title="View profile & status"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00a884]/60"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a884] ring-2 ring-[#202c33]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#e9edef] truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px] group-hover:text-[#00a884] transition">
              {currentUser.displayName}
            </h2>
            <p className="text-[11px] text-[#8696a0] truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[140px]">
              {currentUser.bio || 'Available'}
            </p>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* Status Stories Button */}
          <button
            onClick={onOpenStatus}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer relative"
            title="Status Stories"
          >
            <CircleDot className="w-5 h-5 text-[#00a884]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00a884] ring-1 ring-[#202c33]" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title={soundMuted ? 'Unmute Message Sounds' : 'Mute Sounds'}
          >
            {soundMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-[#8696a0]" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-[#2a3942] hover:text-white rounded-full transition cursor-pointer"
            title="Settings & Themes"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 hover:bg-[#2a3942] hover:text-rose-400 rounded-full transition cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="p-3 border-b border-[#202c33] space-y-2 shrink-0 bg-[#111b21]">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-8 py-2 bg-[#202c33] border border-transparent focus:border-[#00a884]/40 rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none transition"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 text-[#8696a0] hover:text-white text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* WhatsApp Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
              activeFilterTab === 'all'
                ? 'bg-[#00a884] text-white'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilterTab('unread')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
              activeFilterTab === 'unread'
                ? 'bg-[#00a884] text-white'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilterTab('favorites')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
              activeFilterTab === 'favorites'
                ? 'bg-[#00a884] text-white'
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white'
            }`}
          >
            Pinned & Favs
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/40">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#202c33] text-[#8696a0] flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#e9edef]">
              {searchFilter ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-[#8696a0] mt-1 max-w-[220px]">
              {searchFilter
                ? 'Try searching by a different name or message.'
                : 'Start a new conversation with a contact to begin messaging.'}
            </p>
            <button
              onClick={onOpenNewChat}
              className="mt-4 px-4 py-2 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start New Chat</span>
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherParticipantId = chat.participants.find((p) => p !== currentUser.uid);
            const otherInfo = otherParticipantId ? chat.participantDetails?.[otherParticipantId] : null;
            const displayName = otherInfo?.displayName || 'User';
            const photoURL =
              otherInfo?.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

            const isActive = chat.id === activeChatId;
            const isPinned = chat.pinnedBy?.includes(currentUser.uid);
            const isMuted = chat.mutedBy?.includes(currentUser.uid);
            const isTyping = otherParticipantId ? chat.typingUsers?.[otherParticipantId] : false;

            const isLastSentByMe = chat.lastMessage?.senderId === currentUser.uid;
            const isRead = chat.lastMessage?.readBy && chat.lastMessage.readBy.length > 1;

            return (
              <div
                key={chat.id}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition select-none relative ${
                  isActive
                    ? 'bg-[#2a3942]'
                    : 'hover:bg-[#202c33]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10"
                  />
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-[#e9edef] truncate">{displayName}</h3>
                    <span
                      className={`text-[11px] shrink-0 font-medium ${
                        !isLastSentByMe && !isRead ? 'text-[#00a884]' : 'text-[#8696a0]'
                      }`}
                    >
                      {formatChatListTime(chat.lastMessage?.timestamp || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Last message or typing state */}
                    <div className="flex items-center gap-1 text-xs text-[#8696a0] truncate">
                      {isTyping ? (
                        <span className="text-[#00a884] font-medium flex items-center gap-1 animate-pulse">
                          typing...
                        </span>
                      ) : (
                        <>
                          {/* Delivery tick icons for outgoing */}
                          {isLastSentByMe && (
                            <span className="shrink-0">
                              {isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-[#8696a0] stroke-[2]" />
                              )}
                            </span>
                          )}

                          {chat.lastMessage?.type === 'image' && (
                            <Camera className="w-3.5 h-3.5 shrink-0 text-[#8696a0]" />
                          )}
                          {chat.lastMessage?.type === 'audio' && (
                            <Mic className="w-3.5 h-3.5 shrink-0 text-[#00a884]" />
                          )}

                          <span className="truncate">
                            {chat.lastMessage?.text || 'Draft message'}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Right indicators: Pin, Mute, Unread Pill */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isMuted && <BellOff className="w-3.5 h-3.5 text-[#8696a0]" />}
                      {isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0] fill-current" />}
                      {!isLastSentByMe && chat.lastMessage && !chat.lastMessage.readBy?.includes(currentUser.uid) && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                      )}

                      {/* Quick Pin/Mute action button on hover */}
                      {hoveredChatId === chat.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinChat(chat.id, currentUser.uid);
                          }}
                          className="p-1 hover:bg-[#111b21] rounded text-[#8696a0] hover:text-white transition"
                          title={isPinned ? 'Unpin chat' : 'Pin chat'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Floating Action Button (WhatsApp Style) */}
      <button
        onClick={onOpenNewChat}
        className="md:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-[#00a884] hover:bg-[#008069] active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition ring-4 ring-[#00a884]/25 shadow-emerald-950/60"
        title="Start New Chat"
        aria-label="Start New Chat"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>
    </aside>
  );
};
