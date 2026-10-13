/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  setUserPresence,
  subscribeToUserChats,
  getOrCreateConversation,
  DEFAULT_AVATARS,
  logoutUser,
  getSavedSessionUser,
  seedDemoContactsIfFirstTime,
} from './firebase';
import { UserProfile, ChatConversation } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AuthModal } from './components/AuthModal';
import { NewChatModal } from './components/NewChatModal';
import { ProfileModal } from './components/ProfileModal';
import { StatusViewerModal } from './components/StatusViewerModal';
import { SettingsModal, WALLPAPER_OPTIONS } from './components/SettingsModal';
import { CallModal } from './components/CallModal';
import { ContactInfoDrawer } from './components/ContactInfoDrawer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Modals & Drawers
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showContactInfoDrawer, setShowContactInfoDrawer] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video' } | null>(null);

  // Theme & Wallpaper preferences
  const [theme, setTheme] = useState<string>('dark');
  const [wallpaper, setWallpaper] = useState<string>('doodle-classic');

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('orbitto_theme');
      if (savedTheme) setTheme(savedTheme);
      const savedWp = localStorage.getItem('orbitto_wallpaper');
      if (savedWp) setWallpaper(savedWp);
    } catch {}
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('orbitto_theme', newTheme);
    } catch {}
  };

  const handleWallpaperChange = (newWp: string) => {
    setWallpaper(newWp);
    try {
      localStorage.setItem('orbitto_wallpaper', newWp);
    } catch {}
  };

  // Auth listener
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);

          let profile: UserProfile;
          if (snap.exists()) {
            profile = snap.data() as UserProfile;
          } else {
            profile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              photoURL: user.photoURL || DEFAULT_AVATARS[0],
              bio: 'Hey there! I am using Orbitto Web.',
              status: 'online',
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, profile);
          }

          if (mounted) {
            setCurrentUser(profile);
            await setUserPresence(user.uid, true);
            await seedDemoContactsIfFirstTime(profile);
          }
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        // Fallback: check localStorage session
        try {
          const saved = await getSavedSessionUser();
          if (mounted && saved) {
            setCurrentUser(saved);
            await seedDemoContactsIfFirstTime(saved);
          } else if (mounted) {
            setCurrentUser(null);
            setActiveChatId(null);
          }
        } catch {
          if (mounted) {
            setCurrentUser(null);
            setActiveChatId(null);
          }
        }
      }

      if (mounted) {
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Presence lifecycle handlers (online/offline on focus, blur, unload)
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setUserPresence(currentUser.uid, true);
      } else {
        setUserPresence(currentUser.uid, false);
      }
    };

    const handleBeforeUnload = () => {
      setUserPresence(currentUser.uid, false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser?.uid]);

  // Real-time listener for current user's chats
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }

    const unsubscribe = subscribeToUserChats(currentUser.uid, (chatList) => {
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowNewChatModal(true);
      }
      if (e.key === 'Escape') {
        setShowNewChatModal(false);
        setShowProfileModal(false);
        setShowStatusModal(false);
        setShowSettingsModal(false);
        setShowContactInfoDrawer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selected chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSelectChat = (chat: ChatConversation) => {
    setActiveChatId(chat.id);
  };

  const handleStartConversationWithUser = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    try {
      const chat = await getOrCreateConversation(currentUser, targetUser);
      setActiveChatId(chat.id);
      setShowNewChatModal(false);
    } catch (err) {
      console.error('Failed to create/open conversation:', err);
    }
  };

  const handleReplyToStatusUser = async (targetUserId: string, replyText: string) => {
    if (!currentUser) return;
    try {
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      if (targetUserDoc.exists()) {
        const targetUser = targetUserDoc.data() as UserProfile;
        const chat = await getOrCreateConversation(currentUser, targetUser);
        setActiveChatId(chat.id);
      }
    } catch (e) {
      console.error('Failed to open chat from status:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser(currentUser?.uid);
      setCurrentUser(null);
      setActiveChatId(null);
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const currentWallpaperClass =
    WALLPAPER_OPTIONS.find((w) => w.id === wallpaper)?.class || 'bg-whatsapp-doodle';

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111b21] text-[#e9edef] gap-3">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-[#00a884]" />
        </div>
        <p className="text-sm font-medium text-[#8696a0]">Loading Orbitto Web...</p>
      </div>
    );
  }

  // If not logged in, show authentic WhatsApp Web pairing/auth modal
  if (!currentUser) {
    return <AuthModal onSuccess={(profile) => setCurrentUser(profile)} />;
  }

  const otherParticipantId = activeChat?.participants.find((p) => p !== currentUser.uid);
  const otherParticipantInfo = otherParticipantId ? activeChat?.participantDetails?.[otherParticipantId] : null;

  return (
    <div className={`h-[100dvh] w-full flex overflow-hidden ${theme === 'midnight' ? 'bg-[#000000]' : 'bg-[#111b21]'} text-[#e9edef] font-sans`}>
      {/* Sidebar - WhatsApp Web Left Panel */}
      <Sidebar
        currentUser={currentUser}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onOpenNewChat={() => setShowNewChatModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenStatus={() => setShowStatusModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLogout={handleLogout}
        isMobileChatActive={!!activeChat}
      />

      {/* Main WhatsApp Web Chat Area */}
      <ChatArea
        currentUser={currentUser}
        activeChat={activeChat}
        onBack={() => setActiveChatId(null)}
        onOpenNewChat={() => setShowNewChatModal(true)}
        onOpenContactInfo={() => setShowContactInfoDrawer(!showContactInfoDrawer)}
        onStartCall={(type) => setActiveCall({ type })}
        currentWallpaperClass={currentWallpaperClass}
      />

      {/* WhatsApp Web Contact Info Slide-out Drawer */}
      {showContactInfoDrawer && activeChat && otherParticipantInfo && (
        <ContactInfoDrawer
          currentUser={currentUser}
          otherUser={{
            uid: otherParticipantId!,
            displayName: otherParticipantInfo.displayName,
            email: otherParticipantInfo.email,
            photoURL: otherParticipantInfo.photoURL,
            bio: otherParticipantInfo.bio,
            status: 'online',
          }}
          activeChat={activeChat}
          messages={[]}
          onClose={() => setShowContactInfoDrawer(false)}
          onClearChat={() => {
            setActiveChatId(null);
            setShowContactInfoDrawer(false);
          }}
        />
      )}

      {/* "New Chat" Contact Modal */}
      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChatModal(false)}
          onSelectUser={handleStartConversationWithUser}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdate={(updated) =>
            setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />
      )}

      {/* WhatsApp Web Status / Stories Viewer Modal */}
      {showStatusModal && (
        <StatusViewerModal
          currentUser={currentUser}
          onClose={() => setShowStatusModal(false)}
          onReplyToUser={handleReplyToStatusUser}
        />
      )}

      {/* Settings Modal (Themes, Wallpapers, Sounds, Shortcuts) */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          currentWallpaper={wallpaper}
          onWallpaperChange={handleWallpaperChange}
        />
      )}

      {/* Voice / Video Call Simulator Modal */}
      {activeCall && otherParticipantInfo && (
        <CallModal
          otherUser={{
            uid: otherParticipantId!,
            displayName: otherParticipantInfo.displayName,
            email: otherParticipantInfo.email,
            photoURL: otherParticipantInfo.photoURL,
            status: 'online',
          }}
          callType={activeCall.type}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
