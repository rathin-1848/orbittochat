import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, ChatMessage, ChatConversation, MessageContentType, StatusStory } from './types';

// Initialize Firebase with support for both bundled config and Cloudflare/Vite environment variables
const resolvedConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || firebaseConfig.firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId,
};

const app = initializeApp(resolvedConfig);
export const auth = getAuth(app);

// Use the specific firestoreDatabaseId if configured, else default
export const db = resolvedConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);

// Standardized Error Handler required by Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Context: ', JSON.stringify(errInfo));
}

// Connection test as required by Firebase integration guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or reconnecting.');
    }
  }
}
testFirestoreConnection();

// Preset avatars for user profiles
export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

const LOCAL_STORAGE_USER_KEY = 'orbitto_active_uid';
const LEGACY_STORAGE_USER_KEY = 'chatflow_active_uid';

// Helper to update online status
export async function setUserPresence(uid: string, isOnline: boolean) {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: isOnline ? 'online' : 'offline',
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Generate deterministic ID from email for fallback auth
export function getDeterministicUid(email: string): string {
  const clean = email.toLowerCase().trim();
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36);
  const cleanPrefix = clean.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'user';
  return `u_${cleanPrefix}_${positiveHash}`;
}

function encodePass(pass: string): string {
  try {
    return btoa(unescape(encodeURIComponent(pass)));
  } catch {
    return pass;
  }
}

// User Registration
export async function registerUser(
  email: string,
  pass: string,
  displayName: string,
  photoURL?: string,
  bio: string = 'Hey there! I am using Orbitto Web.'
): Promise<UserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0] || 'User';
  const chosenPhoto = photoURL || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  const uid = getDeterministicUid(cleanEmail);

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    throw new Error('An account with this email already exists. Please switch to the Sign In tab.');
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', cleanEmail), limit(1));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    throw new Error('An account with this email already exists. Please switch to the Sign In tab.');
  }

  const firebaseSafePass = pass.length < 6 ? (pass + '123456').slice(0, 6) : pass;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, firebaseSafePass);
    await updateProfile(userCredential.user, {
      displayName: cleanName,
      photoURL: chosenPhoto,
    }).catch(() => {});
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please switch to the Sign In tab.');
    }
    try {
      await signInAnonymously(auth);
    } catch {}
  }

  const profile: UserProfile = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL: chosenPhoto,
    bio: bio.trim(),
    status: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, {
    ...profile,
    _authCode: encodePass(pass),
  });

  localStorage.setItem(LOCAL_STORAGE_USER_KEY, uid);
  return profile;
}

// User Login
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.toLowerCase().trim();

  const firebaseSafePass = pass.length < 6 ? (pass + '123456').slice(0, 6) : pass;
  try {
    await signInWithEmailAndPassword(auth, cleanEmail, firebaseSafePass);
  } catch {
    try {
      await signInAnonymously(auth);
    } catch {}
  }

  const detUid = getDeterministicUid(cleanEmail);
  const userRef = doc(db, 'users', detUid);
  let snap = await getDoc(userRef);
  let matchedUid = detUid;

  if (!snap.exists()) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail), limit(1));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      throw new Error('No account found with this email. Please switch to "Create Account" tab to register.');
    }

    const matchedDoc = querySnap.docs[0];
    snap = matchedDoc;
    matchedUid = matchedDoc.id;
  }

  const existingData = snap.data() as UserProfile & { _authCode?: string };

  if (existingData._authCode && existingData._authCode !== encodePass(pass)) {
    throw new Error('Incorrect password. Please verify your password and try again.');
  }

  await updateDoc(doc(db, 'users', matchedUid), {
    status: 'online',
    lastSeen: serverTimestamp(),
  }).catch(() => {});

  localStorage.setItem(LOCAL_STORAGE_USER_KEY, matchedUid);

  return {
    uid: matchedUid,
    displayName: existingData.displayName || cleanEmail.split('@')[0] || 'User',
    email: existingData.email || cleanEmail,
    photoURL: existingData.photoURL || DEFAULT_AVATARS[0],
    bio: existingData.bio || 'Hey there! I am using Orbitto Web.',
    status: 'online',
    lastSeen: existingData.lastSeen,
    createdAt: existingData.createdAt,
  };
}

// User Logout
export async function logoutUser(uid?: string) {
  const currentUid = uid || auth.currentUser?.uid || localStorage.getItem(LOCAL_STORAGE_USER_KEY) || localStorage.getItem(LEGACY_STORAGE_USER_KEY);
  if (currentUid) {
    try {
      await setUserPresence(currentUid, false);
    } catch {}
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
  return signOut(auth).catch(() => {});
}

// Restore saved session
export async function getSavedSessionUser(): Promise<UserProfile | null> {
  const savedUid = localStorage.getItem(LOCAL_STORAGE_USER_KEY) || localStorage.getItem(LEGACY_STORAGE_USER_KEY);
  if (!savedUid) return null;

  try {
    const snap = await getDoc(doc(db, 'users', savedUid));
    if (snap.exists()) {
      await setUserPresence(savedUid, true);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, savedUid);
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${savedUid}`);
  }
  return null;
}

// Update profile doc
export async function updateUserProfileDoc(
  uid: string,
  data: { displayName?: string; bio?: string; photoURL?: string; phoneNumber?: string }
) {
  const userRef = doc(db, 'users', uid);
  const cleanData: any = {};
  if (data.displayName !== undefined) cleanData.displayName = data.displayName;
  if (data.bio !== undefined) cleanData.bio = data.bio;
  if (data.photoURL !== undefined) cleanData.photoURL = data.photoURL;
  if (data.phoneNumber !== undefined) cleanData.phoneNumber = data.phoneNumber;

  await updateDoc(userRef, cleanData);

  if (auth.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, {
      displayName: cleanData.displayName || auth.currentUser.displayName,
      photoURL: cleanData.photoURL || auth.currentUser.photoURL,
    }).catch(() => {});
  }
}

// Search users
export async function searchUsers(searchTerm: string, currentUserId: string): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, limit(50)));
    const term = searchTerm.trim().toLowerCase();

    const results: UserProfile[] = [];
    snapshot.forEach((d) => {
      const user = d.data() as UserProfile;
      if (user.uid === currentUserId) return;
      if (!term) {
        results.push(user);
      } else {
        const nameMatch = user.displayName?.toLowerCase().includes(term);
        const emailMatch = user.email?.toLowerCase().includes(term);
        if (nameMatch || emailMatch) {
          results.push(user);
        }
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

// Deterministic Chat ID
export function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('___');
}

// Get or Create Conversation
export async function getOrCreateConversation(
  currentUser: UserProfile,
  otherUser: UserProfile
): Promise<ChatConversation> {
  const chatId = getChatId(currentUser.uid, otherUser.uid);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);

  if (snap.exists()) {
    const existing = snap.data() as ChatConversation;
    return { ...existing, id: chatId };
  } else {
    const newChat: ChatConversation = {
      id: chatId,
      participants: [currentUser.uid, otherUser.uid],
      participantDetails: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          bio: currentUser.bio || '',
        },
        [otherUser.uid]: {
          uid: otherUser.uid,
          displayName: otherUser.displayName || 'User',
          email: otherUser.email || '',
          photoURL: otherUser.photoURL || '',
          bio: otherUser.bio || '',
        },
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      pinnedBy: [],
      mutedBy: [],
    };
    await setDoc(chatRef, newChat);
    return newChat;
  }
}

// Send Message with rich support (voice notes, photos, quote replies)
export async function sendMessage(
  chatId: string,
  text: string,
  currentUser: UserProfile,
  options?: {
    type?: MessageContentType;
    mediaUrl?: string;
    mediaCaption?: string;
    mediaDuration?: number;
    replyTo?: ChatMessage['replyTo'];
  }
) {
  const msgType = options?.type || 'text';
  if (!text.trim() && !options?.mediaUrl) return;

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messageData: any = {
    chatId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName,
    text: text.trim() || (msgType === 'image' ? '📷 Photo' : msgType === 'audio' ? '🎙️ Voice message' : ''),
    type: msgType,
    timestamp: serverTimestamp(),
    read: false,
  };

  if (options?.mediaUrl) messageData.mediaUrl = options.mediaUrl;
  if (options?.mediaCaption) messageData.mediaCaption = options.mediaCaption;
  if (options?.mediaDuration) messageData.mediaDuration = options.mediaDuration;
  if (options?.replyTo) messageData.replyTo = options.replyTo;

  const newDocRef = await addDoc(messagesRef, messageData);

  const summaryText =
    msgType === 'image'
      ? '📷 Photo'
      : msgType === 'audio'
      ? `🎙️ Voice message (${options?.mediaDuration ? Math.round(options.mediaDuration) + 's' : ''})`
      : text.trim();

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      text: summaryText,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      readBy: [currentUser.uid],
      type: msgType,
    },
    updatedAt: serverTimestamp(),
  }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}`));

  return newDocRef.id;
}

// React to a message
export async function reactToMessage(
  chatId: string,
  messageId: string,
  userId: string,
  emoji: string
) {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const msg = snap.data() as ChatMessage;
    const reactions = { ...(msg.reactions || {}) };

    if (reactions[userId] === emoji) {
      delete reactions[userId];
    } else {
      reactions[userId] = emoji;
    }

    await updateDoc(msgRef, { reactions });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

// Toggle Star message
export async function toggleStarMessage(
  chatId: string,
  messageId: string,
  userId: string
) {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const msg = snap.data() as ChatMessage;
    const stars = msg.starredBy || [];
    const isStarred = stars.includes(userId);
    const newStars = isStarred ? stars.filter((id) => id !== userId) : [...stars, userId];

    await updateDoc(msgRef, { starredBy: newStars });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

// Delete message
export async function deleteMessage(
  chatId: string,
  messageId: string,
  forEveryone: boolean = true
) {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    if (forEveryone) {
      await updateDoc(msgRef, {
        deletedForEveryone: true,
        text: 'This message was deleted',
        mediaUrl: null,
      });
    } else {
      await deleteDoc(msgRef);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

// Set typing indicator
export async function setChatTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`typingUsers.${userId}`]: isTyping,
    });
  } catch {}
}

// Toggle Pin chat
export async function togglePinChat(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) return;
    const chat = snap.data() as ChatConversation;
    const pinned = chat.pinnedBy || [];
    const isPinned = pinned.includes(userId);
    const newPinned = isPinned ? pinned.filter((id) => id !== userId) : [...pinned, userId];

    await updateDoc(chatRef, { pinnedBy: newPinned });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}`);
  }
}

// Toggle Mute chat
export async function toggleMuteChat(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) return;
    const chat = snap.data() as ChatConversation;
    const muted = chat.mutedBy || [];
    const isMuted = muted.includes(userId);
    const newMuted = isMuted ? muted.filter((id) => id !== userId) : [...muted, userId];

    await updateDoc(chatRef, { mutedBy: newMuted });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}`);
  }
}

// Set chat wallpaper
export async function setChatWallpaper(chatId: string, wallpaperId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { wallpaper: wallpaperId });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}`);
  }
}

// Mark messages as read
export async function markChatMessagesAsRead(chatId: string, currentUserId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) return;
    const data = snap.data() as ChatConversation;

    if (data.lastMessage && !data.lastMessage.readBy?.includes(currentUserId)) {
      const readBy = [...(data.lastMessage.readBy || []), currentUserId];
      await updateDoc(chatRef, {
        'lastMessage.readBy': readBy,
      }).catch(() => {});
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const unreadQuery = query(messagesRef, where('read', '==', false), limit(25));
    const unreadSnap = await getDocs(unreadQuery);

    unreadSnap.forEach(async (d) => {
      const msg = d.data();
      if (msg.senderId !== currentUserId) {
        await updateDoc(d.ref, { read: true }).catch(() => {});
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages`);
  }
}

// Status Stories
export async function createStatusStory(
  currentUser: UserProfile,
  story: { text?: string; mediaUrl?: string; backgroundColor?: string }
) {
  try {
    const statusesRef = collection(db, 'statuses');
    const newStory = {
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.photoURL || DEFAULT_AVATARS[0],
      text: story.text || '',
      mediaUrl: story.mediaUrl || '',
      backgroundColor: story.backgroundColor || '#005c4b',
      timestamp: serverTimestamp(),
      views: [currentUser.uid],
    };
    await addDoc(statusesRef, newStory);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'statuses');
  }
}

export function subscribeToStatusStories(callback: (stories: StatusStory[]) => void) {
  const statusesRef = collection(db, 'statuses');
  const q = query(statusesRef, orderBy('timestamp', 'desc'), limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const stories: StatusStory[] = [];
      snapshot.forEach((d) => {
        stories.push({ id: d.id, ...(d.data() as Omit<StatusStory, 'id'>) });
      });
      callback(stories);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'statuses');
    }
  );
}

// Listen to all conversations for user
export function subscribeToUserChats(
  userId: string,
  callback: (chats: ChatConversation[]) => void
) {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatConversation[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as ChatConversation;
        list.push({ ...item, id: d.id });
      });
      list.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    }
  );
}

// Listen to messages of a single chat
export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) });
      });
      callback(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    }
  );
}

// Listen to a specific user's live profile
export function subscribeToUserProfile(
  userId: string,
  callback: (user: UserProfile | null) => void
) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  );
}

// Seed default contacts if new user has no contacts yet
export async function seedDemoContactsIfFirstTime(currentUser: UserProfile) {
  try {
    const demoContacts = [
      {
        uid: 'u_alice_demo',
        displayName: 'Alice Johnson',
        email: 'alice.demo@orbitto.app',
        photoURL: DEFAULT_AVATARS[0],
        bio: 'Product Designer 🎨 • Loving WhatsApp Web mode',
        status: 'online' as const,
      },
      {
        uid: 'u_bob_demo',
        displayName: 'Bob Martinez',
        email: 'bob.demo@orbitto.app',
        photoURL: DEFAULT_AVATARS[1],
        bio: 'Software Engineer 🚀 • Always up for tech chats',
        status: 'online' as const,
      },
      {
        uid: 'u_orbitto_bot',
        displayName: 'Orbitto Support 🛡️',
        email: 'support@orbitto.app',
        photoURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        bio: 'Welcome to Orbitto Web! Real-time end-to-end messaging.',
        status: 'online' as const,
      },
    ];

    for (const contact of demoContacts) {
      if (contact.uid === currentUser.uid) continue;
      const contactRef = doc(db, 'users', contact.uid);
      const contactSnap = await getDoc(contactRef);
      if (!contactSnap.exists()) {
        await setDoc(contactRef, {
          ...contact,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.debug('Seed check completed:', err);
  }
}
