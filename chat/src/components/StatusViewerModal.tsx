import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Play,
  Pause,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smile,
  Image as ImageIcon,
} from 'lucide-react';
import { UserProfile, StatusStory } from '../types';
import { createStatusStory, subscribeToStatusStories } from '../firebase';
import { formatChatListTime } from '../utils/formatters';

interface StatusViewerModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onReplyToUser?: (userId: string, text: string) => void;
}

const PRESET_STATUS_COLORS = [
  '#005c4b', // WhatsApp Emerald
  '#1e3a8a', // Deep Blue
  '#581c87', // Purple
  '#831843', // Rose
  '#78350f', // Amber
  '#134e4a', // Teal
];

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  currentUser,
  onClose,
  onReplyToUser,
}) => {
  const [stories, setStories] = useState<StatusStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');

  // New story modal
  const [showAddStory, setShowAddStory] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryColor, setNewStoryColor] = useState(PRESET_STATUS_COLORS[0]);
  const [newStoryImage, setNewStoryImage] = useState('');

  // Subscribe to real-time stories
  useEffect(() => {
    const unsubscribe = subscribeToStatusStories((list) => {
      // If list is empty, supply initial sample demo statuses for rich WhatsApp Web feel
      if (list.length === 0) {
        const demoStories: StatusStory[] = [
          {
            id: 'demo_1',
            userId: 'u_alice_demo',
            userName: 'Alice Johnson',
            userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            text: '✨ Launched the new Orbitto Web interface today! What do you think?',
            backgroundColor: '#005c4b',
            timestamp: new Date(),
          },
          {
            id: 'demo_2',
            userId: 'u_bob_demo',
            userName: 'Bob Martinez',
            userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
            text: 'Coding late with high speed WebSockets 💻⚡',
            backgroundColor: '#1e3a8a',
            timestamp: new Date(Date.now() - 3600000),
          },
        ];
        setStories(demoStories);
      } else {
        setStories(list);
      }
    });

    return () => unsubscribe();
  }, []);

  const activeStory = stories[activeStoryIndex] || null;

  // Auto-advance story timer (5 seconds)
  useEffect(() => {
    if (!activeStory || isPaused || showAddStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex((i) => i + 1);
            return 0;
          } else {
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, activeStoryIndex, stories.length, isPaused, showAddStory]);

  const handleNextStory = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setProgress(0);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    if (onReplyToUser) {
      onReplyToUser(activeStory.userId, `Replied to status: "${replyText.trim()}"`);
    }
    setReplyText('');
    onClose();
  };

  const handlePublishNewStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim() && !newStoryImage) return;

    await createStatusStory(currentUser, {
      text: newStoryText.trim(),
      mediaUrl: newStoryImage.trim() || undefined,
      backgroundColor: newStoryColor,
    });

    setNewStoryText('');
    setNewStoryImage('');
    setShowAddStory(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1317]/95 backdrop-blur-md flex flex-col md:flex-row text-[#e9edef] overflow-hidden">
      {/* Left Sidebar: Status List (WhatsApp Web layout) */}
      <div className="w-full md:w-80 lg:w-96 bg-[#111b21] border-r border-[#202c33] flex flex-col h-full shrink-0">
        <div className="p-4 bg-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#2a3942] rounded-full text-[#aebac1] hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-[#e9edef]">Status</h2>
          </div>
          <button
            onClick={() => setShowAddStory(true)}
            className="p-2 bg-[#00a884] hover:bg-[#008069] rounded-full text-white shadow-md transition cursor-pointer"
            title="Add status update"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* My Status section */}
        <div className="p-3 border-b border-[#202c33]">
          <div
            onClick={() => setShowAddStory(true)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#202c33] cursor-pointer transition"
          >
            <div className="relative">
              <img
                src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00a884]"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00a884] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#111b21]">
                +
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#e9edef]">My status</h3>
              <p className="text-xs text-[#8696a0]">Click to add status update</p>
            </div>
          </div>
        </div>

        {/* Recent updates heading */}
        <div className="px-4 py-2 text-xs font-semibold text-[#00a884] uppercase tracking-wider">
          Recent updates ({stories.length})
        </div>

        {/* Stories list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/50 p-2 space-y-1">
          {stories.map((story, index) => {
            const isActive = index === activeStoryIndex;
            return (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryIndex(index);
                  setProgress(0);
                  setShowAddStory(false);
                }}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                  isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}
              >
                <div className="relative p-0.5 rounded-full ring-2 ring-[#00a884]">
                  <img
                    src={story.userAvatar}
                    alt={story.userName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#e9edef] truncate">{story.userName}</h4>
                  <p className="text-xs text-[#8696a0] truncate">
                    {formatChatListTime(story.timestamp) || 'Just now'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Story Viewer Canvas or Add Story Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative bg-[#0b141a]">
        {/* Top close button on mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-[#202c33]/80 hover:bg-[#2a3942] rounded-full text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {showAddStory ? (
          /* Add New Status Modal */
          <div className="w-full max-w-md bg-[#202c33] border border-[#2a3942] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#e9edef] mb-4">Create Status</h3>
            <form onSubmit={handlePublishNewStory} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8696a0] mb-1">Status Message</label>
                <textarea
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                  placeholder="What's on your mind?..."
                  rows={3}
                  className="w-full p-3 bg-[#111b21] border border-[#2a3942] rounded-xl text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8696a0] mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  {PRESET_STATUS_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewStoryColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full cursor-pointer transition ${
                        newStoryColor === col ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8696a0] mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={newStoryImage}
                  onChange={(e) => setNewStoryImage(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full p-2.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStory(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8696a0] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Send Status
                </button>
              </div>
            </form>
          </div>
        ) : activeStory ? (
          /* Active Story Viewer */
          <div
            className="w-full max-w-sm h-[560px] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between relative"
            style={{ backgroundColor: activeStory.backgroundColor || '#005c4b' }}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top progress bar */}
            <div className="p-3 bg-gradient-to-b from-black/60 to-transparent z-10 space-y-2">
              <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Story User Info Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeStory.userAvatar}
                    alt={activeStory.userName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white drop-shadow">{activeStory.userName}</h4>
                    <p className="text-[10px] text-white/80">
                      {formatChatListTime(activeStory.timestamp) || 'Recent'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full cursor-pointer"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Main Story Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              {activeStory.mediaUrl ? (
                <img
                  src={activeStory.mediaUrl}
                  alt="Story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}

              {activeStory.text && (
                <div
                  className={`relative z-10 max-w-xs ${
                    activeStory.mediaUrl
                      ? 'bg-black/60 backdrop-blur-sm p-4 rounded-xl mt-auto mb-4'
                      : ''
                  }`}
                >
                  <p className="text-xl font-medium text-white leading-relaxed drop-shadow-md">
                    {activeStory.text}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation arrow buttons */}
            <button
              onClick={handlePrevStory}
              disabled={activeStoryIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer disabled:opacity-0 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextStory}
              disabled={activeStoryIndex === stories.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer disabled:opacity-0 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom: Reply to Status bar */}
            <form
              onSubmit={handleSendReply}
              className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to status..."
                className="flex-1 py-2 px-3 bg-white/20 backdrop-blur-md rounded-full text-xs text-white placeholder-white/70 focus:outline-none focus:bg-white/30"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2 bg-[#00a884] hover:bg-[#008069] text-white rounded-full transition cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center text-[#8696a0]">
            <p className="text-sm">No status updates available</p>
          </div>
        )}
      </div>
    </div>
  );
};
