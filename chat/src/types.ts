export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
  status: 'online' | 'offline';
  lastSeen?: any;
  createdAt?: any;
  customStatus?: string;
}

export type MessageContentType = 'text' | 'image' | 'audio' | 'document';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  read: boolean;
  type?: MessageContentType;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaDuration?: number; // In seconds for voice notes
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    type?: MessageContentType;
  };
  reactions?: Record<string, string>; // uid -> emoji
  starredBy?: string[]; // uids
  deletedForEveryone?: boolean;
}

export interface ChatParticipantInfo {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, ChatParticipantInfo>;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
    readBy?: string[];
    type?: MessageContentType;
  };
  updatedAt: any;
  createdAt: any;
  pinnedBy?: string[];
  mutedBy?: string[];
  typingUsers?: Record<string, boolean>; // uid -> isTyping
  wallpaper?: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  timestamp: any;
  views?: string[];
}
