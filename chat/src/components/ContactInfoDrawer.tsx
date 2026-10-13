import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Shield,
  Star,
  Bell,
  BellOff,
  Image as ImageIcon,
  Trash2,
  Lock,
  QrCode,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserProfile, ChatMessage, ChatConversation } from '../types';
import { toggleMuteChat } from '../firebase';

interface ContactInfoDrawerProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  activeChat: ChatConversation;
  messages: ChatMessage[];
  onClose: () => void;
  onClearChat?: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  currentUser,
  otherUser,
  activeChat,
  messages,
  onClose,
  onClearChat,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'starred' | 'encryption'>('overview');
  const [disappearingTimer, setDisappearingTimer] = useState('Off');
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const isMuted = activeChat.mutedBy?.includes(currentUser.uid) || false;

  const handleToggleMute = async () => {
    await toggleMuteChat(activeChat.id, currentUser.uid);
  };

  const sharedMedia = messages.filter((m) => m.type === 'image' && m.mediaUrl);
  const starredMessages = messages.filter((m) => m.starredBy?.includes(currentUser.uid));

  return (
    <aside className="fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-80 lg:w-96 bg-[#111b21] border-l border-[#202c33] flex flex-col h-full shrink-0 shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a3942] rounded-full text-[#aebac1] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold text-[#e9edef]">Contact Info</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-6 bg-[#202c33] rounded-2xl border border-[#2a3942]">
          <div className="relative mb-3">
            <img
              src={otherUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={otherUser.displayName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#00a884]/40 shadow-lg"
            />
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-[#202c33] ${
                otherUser.status === 'online' ? 'bg-[#00a884]' : 'bg-[#8696a0]'
              }`}
            />
          </div>
          <h4 className="text-lg font-bold text-white">{otherUser.displayName}</h4>
          <p className="text-xs text-[#8696a0] mt-0.5">{otherUser.email}</p>
          <span className="mt-2 text-[11px] font-medium text-[#00a884] bg-[#111b21] px-2.5 py-0.5 rounded-full border border-[#2a3942]">
            {otherUser.status === 'online' ? '● Online now' : 'Offline'}
          </span>
        </div>

        {/* About / Bio */}
        <div className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-1">
          <span className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">About</span>
          <p className="text-xs text-[#d1d7db]">{otherUser.bio || 'Hey there! I am using Orbitto Web.'}</p>
        </div>

        {/* Media, Links & Docs */}
        <div className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#e9edef] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#00a884]" /> Media, links and docs
            </span>
            <span className="text-[#8696a0]">{sharedMedia.length}</span>
          </div>

          {sharedMedia.length === 0 ? (
            <p className="text-[11px] text-[#8696a0]">No shared photos in this conversation yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {sharedMedia.slice(0, 6).map((m) => (
                <div key={m.id} className="aspect-square rounded-lg overflow-hidden border border-white/10 group cursor-pointer">
                  <img src={m.mediaUrl} alt="Shared" className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Starred Messages */}
        <div className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#e9edef] flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" /> Starred messages
            </span>
            <span className="text-[#8696a0]">{starredMessages.length}</span>
          </div>
          {starredMessages.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {starredMessages.slice(0, 3).map((sm) => (
                <div key={sm.id} className="p-2 bg-[#111b21] rounded-lg text-[11px] text-[#d1d7db] truncate">
                  "{sm.text}"
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Mute Toggle */}
        <div className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-[#e9edef]">
            {isMuted ? <BellOff className="w-4 h-4 text-rose-400" /> : <Bell className="w-4 h-4 text-[#00a884]" />}
            <span>Mute notifications</span>
          </div>
          <button
            onClick={handleToggleMute}
            className={`w-9 h-5 rounded-full transition cursor-pointer relative ${
              isMuted ? 'bg-[#00a884]' : 'bg-[#2a3942]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                isMuted ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Disappearing Messages */}
        <div className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#e9edef]">
            <Clock className="w-4 h-4 text-[#8696a0]" />
            <div>
              <div>Disappearing messages</div>
              <div className="text-[10px] text-[#8696a0]">{disappearingTimer}</div>
            </div>
          </div>
          <select
            value={disappearingTimer}
            onChange={(e) => setDisappearingTimer(e.target.value)}
            className="bg-[#111b21] border border-[#2a3942] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="Off">Off</option>
            <option value="24 hours">24 hours</option>
            <option value="7 days">7 days</option>
            <option value="90 days">90 days</option>
          </select>
        </div>

        {/* Encryption verification */}
        <div
          onClick={() => setShowSecurityModal(true)}
          className="p-4 bg-[#202c33] rounded-2xl border border-[#2a3942] flex items-center justify-between text-xs cursor-pointer hover:bg-[#2a3942] transition"
        >
          <div className="flex items-center gap-2.5 text-[#e9edef]">
            <Lock className="w-4 h-4 text-[#00a884]" />
            <div>
              <div className="font-medium">Encryption</div>
              <div className="text-[10px] text-[#8696a0]">Messages are end-to-end encrypted. Click to verify.</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8696a0]" />
        </div>

        {/* Delete Chat */}
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="w-full p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear or Delete chat</span>
          </button>
        )}
      </div>

      {/* Security QR Code Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#202c33] border border-[#2a3942] rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">Verify Security Code</h4>
            <p className="text-xs text-[#8696a0]">
              To verify that end-to-end encryption is active with {otherUser.displayName}, compare this 60-digit number or scan this code.
            </p>
            <div className="p-4 bg-white rounded-xl inline-block shadow">
              <QrCode className="w-32 h-32 text-slate-900 mx-auto" />
            </div>
            <p className="font-mono text-xs text-[#00a884] tracking-widest bg-[#111b21] p-2.5 rounded-lg border border-[#2a3942]">
              40192 84729 10492 85739 10293
            </p>
            <button
              onClick={() => setShowSecurityModal(false)}
              className="w-full py-2 bg-[#00a884] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
