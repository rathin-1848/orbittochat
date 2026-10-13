import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquarePlus, User, Loader2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { searchUsers } from '../firebase';
import { formatLastSeen } from '../utils/formatters';

interface NewChatModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  onClose,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const results = await searchUsers(searchTerm, currentUser.uid);
        if (isMounted) {
          setUsers(results);
        }
      } catch (err) {
        console.error('Error fetching users for new chat:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [searchTerm, currentUser.uid]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-hidden text-[#e9edef]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2a3942] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">New Chat</h2>
              <p className="text-xs text-[#8696a0]">Select a contact to begin messaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-white hover:bg-[#2a3942] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="py-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-[#111b21] border border-[#2a3942] rounded-xl text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto min-h-[220px] divide-y divide-[#2a3942]/60 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#8696a0] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
              <span className="text-xs">Finding contacts...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#111b21] flex items-center justify-center text-[#8696a0] mb-3">
                <User className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {searchTerm ? 'No users matching your query' : 'No other users found'}
              </p>
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                Open another tab or incognito window, pair as Alice or Bob, and chat in real-time!
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-1">
              {users.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#111b21] transition text-left group cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={user.displayName}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-[#2a3942] group-hover:ring-[#00a884] transition"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#202c33] ${
                        user.status === 'online' ? 'bg-[#00a884]' : 'bg-[#8696a0]'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-[#00a884] transition">
                        {user.displayName}
                      </h3>
                      <span className="text-[11px] text-[#8696a0]">
                        {formatLastSeen(user.status, user.lastSeen)}
                      </span>
                    </div>
                    <p className="text-xs text-[#8696a0] truncate mt-0.5">
                      {user.bio || user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#2a3942] text-[11px] text-[#8696a0] flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00a884]" /> Real-time peer delivery
          </span>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
