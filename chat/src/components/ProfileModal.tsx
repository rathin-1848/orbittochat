import React, { useState } from 'react';
import { X, Check, Save, User, Smile, Mail, Shield, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfileDoc, DEFAULT_AVATARS } from '../firebase';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (updated: Partial<UserProfile>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || 'Hey there! I am using Orbitto Web.');
  const [photoURL, setPhotoURL] = useState(user.photoURL || DEFAULT_AVATARS[0]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      await updateUserProfileDoc(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL,
      });

      onUpdate({
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl p-6 relative overflow-hidden text-[#e9edef]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-base font-semibold text-white">Profile Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-white hover:bg-[#2a3942] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Avatar preview */}
          <div className="flex flex-col items-center">
            <div className="relative group mb-3">
              <img
                src={photoURL}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#00a884]/40 shadow-lg"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-xs font-medium text-[#8696a0] text-center mb-2">Choose Avatar</label>
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(url)}
                    className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      photoURL === url
                        ? 'border-[#00a884] scale-110 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    {photoURL === url && (
                      <div className="absolute inset-0 bg-[#00a884]/40 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center mt-1">
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="text-[11px] text-[#00a884] hover:underline cursor-pointer"
                  >
                    Use custom image URL
                  </button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="url"
                      placeholder="Paste image URL here"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#111b21] border border-[#2a3942] rounded-lg text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          setPhotoURL(customUrlInput.trim());
                          setShowCustomInput(false);
                          setCustomUrlInput('');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-[#2a3942] hover:bg-[#111b21] text-xs font-medium text-white rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">Your Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full pl-9 pr-3.5 py-2 bg-[#111b21] border border-[#2a3942] rounded-xl text-white text-xs focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Status / About */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">About</label>
            <div className="relative">
              <Smile className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Available • Working remotely"
                className="w-full pl-9 pr-3.5 py-2 bg-[#111b21] border border-[#2a3942] rounded-xl text-white text-xs focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full pl-9 pr-3.5 py-2 bg-[#111b21]/60 border border-[#2a3942] rounded-xl text-[#8696a0] text-xs cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* Presence */}
          <div className="p-3 rounded-xl bg-[#111b21] border border-[#2a3942] flex items-center justify-between text-xs">
            <span className="text-[#8696a0] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00a884]" /> Web Session:
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#00a884]">
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" /> Online
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-[#2a3942] hover:bg-[#111b21] text-white font-medium rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
