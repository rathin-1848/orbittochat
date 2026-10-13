import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  User,
  Check,
  HelpCircle,
  Laptop,
} from 'lucide-react';
import {
  registerUser,
  loginUser,
  DEFAULT_AVATARS,
  seedDemoContactsIfFirstTime,
} from '../firebase';
import { UserProfile } from '../types';
import { playConnectedChime } from '../utils/soundEffects';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  // Mobile users typically prefer 1-tap/email; desktop users enjoy the QR web gateway
  const [authMethod, setAuthMethod] = useState<'qr' | 'email'>('qr');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState(false);

  // Simulated instant 1-click test login
  const handleQuickPair = async (demo: 'Alice' | 'Bob' | 'Charlie') => {
    setError(null);
    setLoading(true);
    setPairingSuccess(true);
    playConnectedChime();

    const emailMap = {
      Alice: 'alice.demo@orbitto.app',
      Bob: 'bob.demo@orbitto.app',
      Charlie: 'charlie.demo@orbitto.app',
    };
    const avatarMap = {
      Alice: DEFAULT_AVATARS[0],
      Bob: DEFAULT_AVATARS[1],
      Charlie: DEFAULT_AVATARS[2],
    };
    const bioMap = {
      Alice: 'Product Designer 🎨 • Loving Orbitto Mobile & Web',
      Bob: 'Software Engineer 🚀 • Real-time systems enthusiast',
      Charlie: 'Tech Lead 📱 • Available on Orbitto',
    };

    const targetEmail = emailMap[demo];
    const targetPass = 'password123';

    try {
      let profile: UserProfile;
      try {
        profile = await loginUser(targetEmail, targetPass);
      } catch {
        profile = await registerUser(
          targetEmail,
          targetPass,
          demo,
          avatarMap[demo],
          bioMap[demo]
        );
      }
      await seedDemoContactsIfFirstTime(profile);
      setTimeout(() => {
        onSuccess(profile);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Pairing error');
      setPairingSuccess(false);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      let profile: UserProfile;
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        profile = await registerUser(
          email.trim(),
          password,
          displayName.trim(),
          DEFAULT_AVATARS[0],
          'Hey there! I am using Orbitto.'
        );
      } else {
        profile = await loginUser(email.trim(), password);
      }
      playConnectedChime();
      await seedDemoContactsIfFirstTime(profile);
      onSuccess(profile);
    } catch (err: any) {
      let msg = err.message || 'Authentication failed. Please try again.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Invalid credentials. If you are new here, tap "Create Account".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to "Sign In".';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#111b21] text-[#e9edef] overflow-y-auto">
      {/* Top Emerald Header Band */}
      <header className="w-full bg-[#00a884] h-44 sm:h-56 px-4 sm:px-16 pt-5 sm:pt-7 pb-4 flex items-start shrink-0 relative">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center text-[#00a884] shadow-md shrink-0">
              <Laptop className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-sm sm:text-base font-bold tracking-wider text-white uppercase">Orbitto Web</span>
              <span className="text-[11px] sm:text-xs text-emerald-100 font-medium">Mobile & Desktop</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-100 bg-[#008069] px-2.5 py-1 rounded-full border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">End-to-end encrypted</span>
            <span className="xs:hidden">Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Floating Card */}
      <main className="flex-1 -mt-28 sm:-mt-36 px-3 sm:px-6 pb-10 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl overflow-hidden relative">
          {error && (
            <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs px-4 sm:px-6 py-2.5 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-bold p-1">×</button>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#2a3942] bg-[#172228]">
            <button
              onClick={() => setAuthMethod('qr')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                authMethod === 'qr'
                  ? 'text-[#00a884] border-b-2 border-[#00a884] bg-[#202c33]'
                  : 'text-[#8696a0] hover:text-[#d1d7db]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code & 1-Tap Link</span>
            </button>
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                authMethod === 'email'
                  ? 'text-[#00a884] border-b-2 border-[#00a884] bg-[#202c33]'
                  : 'text-[#8696a0] hover:text-[#d1d7db]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email & Password</span>
            </button>
          </div>

          {authMethod === 'qr' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 p-5 sm:p-10 gap-6 sm:gap-8 items-center">
              {/* Left Column: Instructions & 1-Click Fast Pairing */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#e9edef] tracking-tight">
                    Use Orbitto on Mobile & Desktop
                  </h1>
                  <p className="text-xs sm:text-sm text-[#8696a0] mt-1">
                    Instant cloud-synced messaging. Sign in with 1 tap or scan below.
                  </p>
                </div>

                {/* 1-Click Instant Login (Great for mobile & fast testing) */}
                <div className="p-4 rounded-xl bg-[#111b21] border border-[#2a3942] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#00a884] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Instant 1-Tap Login:
                    </span>
                    <span className="text-[11px] text-[#8696a0]">Ready in 1s</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickPair('Alice')}
                      className="p-2.5 bg-[#202c33] hover:bg-[#2a3942] text-xs text-[#d1d7db] rounded-xl transition border border-[#2a3942] hover:border-[#00a884]/60 flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <img src={DEFAULT_AVATARS[0]} alt="Alice" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00a884]" />
                      <span className="font-medium text-[11px] text-white">Alice</span>
                      <span className="text-[9px] text-[#8696a0]">Designer</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickPair('Bob')}
                      className="p-2.5 bg-[#202c33] hover:bg-[#2a3942] text-xs text-[#d1d7db] rounded-xl transition border border-[#2a3942] hover:border-[#00a884]/60 flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <img src={DEFAULT_AVATARS[1]} alt="Bob" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00a884]" />
                      <span className="font-medium text-[11px] text-white">Bob</span>
                      <span className="text-[9px] text-[#8696a0]">Engineer</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickPair('Charlie')}
                      className="p-2.5 bg-[#202c33] hover:bg-[#2a3942] text-xs text-[#d1d7db] rounded-xl transition border border-[#2a3942] hover:border-[#00a884]/60 flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <img src={DEFAULT_AVATARS[2]} alt="Charlie" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00a884]" />
                      <span className="font-medium text-[11px] text-white">Charlie</span>
                      <span className="text-[9px] text-[#8696a0]">Tech Lead</span>
                    </button>
                  </div>
                </div>

                <ol className="space-y-3 text-xs sm:text-sm text-[#d1d7db] hidden sm:block">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#111b21] border border-[#2a3942] text-xs font-semibold flex items-center justify-center text-[#00a884] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Tap any demo profile above or scan the QR code to pair</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#111b21] border border-[#2a3942] text-xs font-semibold flex items-center justify-center text-[#00a884] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Send encrypted messages, voice notes, and real-time reactions</span>
                  </li>
                </ol>

                {/* Keep signed in check */}
                <div className="pt-1 flex items-center gap-2 text-xs text-[#8696a0]">
                  <input
                    type="checkbox"
                    id="keepSignedIn"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#111b21] border-[#2a3942] text-[#00a884] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="keepSignedIn" className="cursor-pointer select-none">
                    Keep me signed in on this device
                  </label>
                </div>
              </div>

              {/* Right Column: QR Code Canvas with Animated Scanner Beam */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="relative p-5 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-white overflow-hidden rounded-lg flex items-center justify-center">
                    {/* SVG Stylized QR matrix */}
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-[#111b21]">
                      {/* Top-left position marker */}
                      <rect x="5" y="5" width="28" height="28" fill="#111b21" rx="4" />
                      <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                      <rect x="13" y="13" width="12" height="12" fill="#00a884" rx="2" />

                      {/* Top-right position marker */}
                      <rect x="67" y="5" width="28" height="28" fill="#111b21" rx="4" />
                      <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                      <rect x="75" y="13" width="12" height="12" fill="#00a884" rx="2" />

                      {/* Bottom-left position marker */}
                      <rect x="5" y="67" width="28" height="28" fill="#111b21" rx="4" />
                      <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                      <rect x="13" y="75" width="12" height="12" fill="#00a884" rx="2" />

                      {/* Simulated QR data modules */}
                      <rect x="38" y="7" width="4" height="4" />
                      <rect x="46" y="7" width="4" height="8" />
                      <rect x="54" y="11" width="6" height="4" />
                      <rect x="7" y="38" width="8" height="4" />
                      <rect x="19" y="44" width="4" height="8" />
                      <rect x="27" y="38" width="6" height="4" />
                      <rect x="38" y="24" width="6" height="4" />
                      <rect x="46" y="20" width="4" height="8" />
                      <rect x="54" y="24" width="4" height="4" />
                      <rect x="38" y="38" width="24" height="24" fill="#00a884" opacity="0.15" />
                      <rect x="67" y="38" width="6" height="4" />
                      <rect x="79" y="44" width="4" height="8" />
                      <rect x="87" y="38" width="6" height="4" />
                      <rect x="38" y="68" width="4" height="6" />
                      <rect x="48" y="74" width="6" height="4" />
                      <rect x="58" y="68" width="4" height="10" />
                      <rect x="68" y="72" width="8" height="4" />
                      <rect x="82" y="78" width="4" height="8" />
                      <rect x="72" y="86" width="14" height="4" />
                      <rect x="42" y="86" width="8" height="4" />
                    </svg>

                    {/* Centered logo icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-[#00a884] flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-[#00a884]" />
                      </div>
                    </div>

                    {/* Animated laser beam */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00a884] to-transparent shadow-[0_0_12px_#00a884] animate-laser pointer-events-none" />
                  </div>

                  {/* Scan Simulator Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickPair('Alice')}
                    className="mt-3.5 w-full py-2.5 px-3 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tap to Simulate QR Scan</span>
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#8696a0]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Supports Android, iOS & Desktop</span>
                </div>
              </div>
            </div>
          ) : (
            /* Email / Password Sign In or Registration Form */
            <div className="p-6 sm:p-10 max-w-md mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isSignUp ? 'Create Orbitto Account' : 'Sign In with Email'}
                </h2>
                <p className="text-xs text-[#8696a0] mt-1">
                  {isSignUp ? 'Register a new profile for real-time messaging' : 'Access your existing messages and contacts'}
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Sarah Miller"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-sm sm:text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-sm sm:text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-sm sm:text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008069] text-white font-semibold rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50 mt-2 active:scale-95"
                >
                  {loading ? 'Connecting...' : isSignUp ? 'Create Account & Launch' : 'Sign In to Orbitto'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                    }}
                    className="text-xs text-[#8696a0] hover:text-[#00a884] transition cursor-pointer"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer bar */}
      <footer className="text-center py-4 text-xs text-[#8696a0] border-t border-[#2a3942]/60">
        <span>Orbitto • Real-Time Firebase Cloud Engine</span>
      </footer>
    </div>
  );
};
