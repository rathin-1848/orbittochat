import React, { useState } from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  Palette,
  Image as ImageIcon,
  Keyboard,
  Shield,
  HelpCircle,
  Laptop,
  Check,
} from 'lucide-react';
import {
  isSoundsMuted,
  setSoundsMuted,
  playMessageReceivedSound,
} from '../utils/soundEffects';

interface SettingsModalProps {
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  currentWallpaper: string;
  onWallpaperChange: (wallpaper: string) => void;
}

export const WALLPAPER_OPTIONS = [
  { id: 'doodle-classic', label: 'Classic Doodle', class: 'bg-whatsapp-doodle' },
  { id: 'doodle-emerald', label: 'Emerald Matrix', class: 'bg-whatsapp-doodle-emerald' },
  { id: 'doodle-midnight', label: 'Midnight OLED', class: 'bg-whatsapp-doodle-midnight' },
  { id: 'solid-slate', label: 'Solid Charcoal', class: 'bg-[#0b141a]' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  currentTheme,
  onThemeChange,
  currentWallpaper,
  onWallpaperChange,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'theme' | 'wallpaper' | 'shortcuts' | 'about'>('theme');
  const [soundMuted, setLocalSoundMuted] = useState(isSoundsMuted());
  const [desktopNotifyGranted, setDesktopNotifyGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const toggleSound = () => {
    const next = !soundMuted;
    setLocalSoundMuted(next);
    setSoundsMuted(next);
    if (!next) {
      playMessageReceivedSound();
    }
  };

  const handleRequestDesktopNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setDesktopNotifyGranted(perm === 'granted');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#111b21] border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-base font-semibold text-[#e9edef]">WhatsApp Web Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a3942] rounded-full text-[#aebac1] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2a3942] bg-[#111b21] text-xs font-medium px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#d1d7db]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'wallpaper'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#d1d7db]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Chat Wallpaper</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#d1d7db]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'shortcuts'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#d1d7db]'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#d1d7db]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & About</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#d1d7db]">
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Choose App Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    currentTheme === 'dark'
                      ? 'border-[#00a884] bg-[#111b21]'
                      : 'border-[#2a3942] bg-[#111b21]/60 hover:bg-[#111b21]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">WhatsApp Dark</div>
                    <div className="text-[11px] text-[#8696a0]">Signature WhatsApp Web dark palette</div>
                  </div>
                  {currentTheme === 'dark' && <Check className="w-4 h-4 text-[#00a884]" />}
                </button>
                <button
                  onClick={() => onThemeChange('midnight')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    currentTheme === 'midnight'
                      ? 'border-[#00a884] bg-[#000000]'
                      : 'border-[#2a3942] bg-[#000000]/60 hover:bg-[#000000]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">OLED Midnight</div>
                    <div className="text-[11px] text-[#8696a0]">Pure deep pitch black for AMOLED</div>
                  </div>
                  {currentTheme === 'midnight' && <Check className="w-4 h-4 text-[#00a884]" />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'wallpaper' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Chat Background Wallpaper</h3>
              <p className="text-[#8696a0] text-xs">
                Select your preferred WhatsApp background texture for message threads.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {WALLPAPER_OPTIONS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => onWallpaperChange(wp.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-2 ${
                      currentWallpaper === wp.id
                        ? 'border-[#00a884] ring-1 ring-[#00a884]'
                        : 'border-[#2a3942] hover:border-[#8696a0]'
                    }`}
                  >
                    <div className={`w-full h-16 rounded-lg ${wp.class} border border-white/5 flex items-center justify-center`}>
                      <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">Preview</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{wp.label}</span>
                      {currentWallpaper === wp.id && <Check className="w-4 h-4 text-[#00a884]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#111b21] rounded-xl border border-[#2a3942]">
                <div className="flex items-center gap-3">
                  {soundMuted ? (
                    <VolumeX className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-[#00a884]" />
                  )}
                  <div>
                    <div className="font-semibold text-white">Message Sounds</div>
                    <div className="text-[11px] text-[#8696a0]">Play audio chime on incoming and sent messages</div>
                  </div>
                </div>
                <button
                  onClick={toggleSound}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    soundMuted ? 'bg-[#2a3942] text-slate-300' : 'bg-[#00a884] text-white'
                  }`}
                >
                  {soundMuted ? 'Muted' : 'Enabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#111b21] rounded-xl border border-[#2a3942]">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#00a884]" />
                  <div>
                    <div className="font-semibold text-white">Desktop Notifications</div>
                    <div className="text-[11px] text-[#8696a0]">Get alerts for new incoming messages on your PC</div>
                  </div>
                </div>
                <button
                  onClick={handleRequestDesktopNotifications}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    desktopNotifyGranted ? 'bg-[#00a884] text-white' : 'bg-[#2a3942] text-slate-300'
                  }`}
                >
                  {desktopNotifyGranted ? 'Active' : 'Turn On'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>New Chat</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Ctrl + N</kbd>
                </div>
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>Search Chats</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Ctrl + /</kbd>
                </div>
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>Send Message</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Enter</kbd>
                </div>
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>New Line</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Shift + Enter</kbd>
                </div>
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>Close Drawer / Back</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Esc</kbd>
                </div>
                <div className="p-2.5 bg-[#111b21] rounded-lg border border-[#2a3942] flex items-center justify-between">
                  <span>Emoji Picker</span>
                  <kbd className="px-2 py-0.5 bg-[#202c33] rounded text-[11px] font-mono text-[#00a884]">Ctrl + E</kbd>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3">
              <div className="p-4 bg-[#111b21] rounded-xl border border-[#2a3942] text-center space-y-2">
                <Laptop className="w-8 h-8 text-[#00a884] mx-auto" />
                <h4 className="text-sm font-bold text-white">Orbitto Web Version 2.4</h4>
                <p className="text-xs text-[#8696a0]">
                  Modern desktop web client with real-time cloud sync, end-to-end encrypted messaging, voice notes, and media sharing.
                </p>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#00a884]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>256-bit secure communication</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
