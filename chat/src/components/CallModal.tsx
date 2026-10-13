import React, { useState, useEffect } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Shield,
  Maximize2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface CallModalProps {
  otherUser: UserProfile;
  callType: 'voice' | 'video';
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  otherUser,
  callType,
  onClose,
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected'>('ringing');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');

  useEffect(() => {
    const ringTimeout = setTimeout(() => {
      setCallStatus('connected');
    }, 2500);

    return () => clearTimeout(ringTimeout);
  }, []);

  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative">
        {/* Top security tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#00a884] bg-[#202c33] px-3 py-1 rounded-full mb-8">
          <Shield className="w-3.5 h-3.5" />
          <span>End-to-end encrypted {callType} call</span>
        </div>

        {/* Video stream simulator or Avatar */}
        {isVideoOn && callStatus === 'connected' ? (
          <div className="w-full h-64 bg-[#202c33] rounded-2xl overflow-hidden relative mb-6 border border-[#2a3942] flex items-center justify-center">
            <img
              src={otherUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
              alt={otherUser.displayName}
              className="w-full h-full object-cover"
            />
            {/* Self preview PIP in corner */}
            <div className="absolute bottom-3 right-3 w-20 h-28 bg-[#111b21] rounded-xl border border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
              <span className="text-[10px] text-white/80">You</span>
            </div>
          </div>
        ) : (
          <div className="relative mb-6">
            <div className={`w-28 h-28 rounded-full overflow-hidden ring-4 ${callStatus === 'ringing' ? 'ring-[#00a884] animate-pulse' : 'ring-[#00a884]'}`}>
              <img
                src={otherUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={otherUser.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold text-white mb-1">{otherUser.displayName}</h3>
        <p className="text-xs font-medium text-[#8696a0] mb-8">
          {callStatus === 'ringing' ? 'Ringing...' : formatCallTime(seconds)}
        </p>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full cursor-pointer transition ${
              isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-[#202c33] text-white hover:bg-[#2a3942]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full cursor-pointer transition ${
                !isVideoOn ? 'bg-rose-500/20 text-rose-400' : 'bg-[#202c33] text-white hover:bg-[#2a3942]'
              }`}
              title={isVideoOn ? 'Stop Video' : 'Start Video'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition cursor-pointer active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
