import React, { useState, useEffect } from 'react';
import { Shield, Lock, Key, Eye, EyeOff, AlertTriangle, UserPlus, Sparkles, ChevronRight, Server, User, Mail, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthResponse } from '../types';

interface SecretCodeLoginProps {
  onLoginSuccess: (authData: AuthResponse) => void;
  isDarkMode: boolean;
}

export const SecretCodeLogin: React.FC<SecretCodeLoginProps> = ({ onLoginSuccess, isDarkMode }) => {
  const [mode, setMode] = useState<'create' | 'unlock'>('create');
  
  // Registration fields
  const [username, setUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Wrong credentials popup state
  const [showWrongCredsModal, setShowWrongCredsModal] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !registerEmail.trim() || !registerPassword.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: registerEmail.trim(),
          password: registerPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create personal data space.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating data space.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim() || lockoutSec > 0 || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.remainingLockoutSec) {
          setLockoutSec(data.remainingLockoutSec);
        }
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }

        // Show Wrong Credentials Popup Modal
        if (data.invalidCredentials || res.status === 401) {
          setShowWrongCredsModal(true);
        } else {
          setErrorMsg(data.message || 'Login failed.');
        }
        return;
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setShowWrongCredsModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900 text-slate-100' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 text-slate-800'
    }`}>
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 ${
          isDarkMode ? 'glass-panel' : 'glass-panel-light'
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 relative">
            <Shield className="w-8 h-8 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            OWN WORLD
          </h1>
          <p className={`text-xs uppercase tracking-widest mt-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Private Cloud Data Space
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className={`p-1 rounded-xl flex items-center mb-6 border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-200/80 border-slate-300'
        }`}>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'create'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Data Space</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('unlock');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'unlock'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

        {/* TAB 1: CREATE NEW DATA SPACE */}
        {mode === 'create' ? (
          <form onSubmit={handleCreateSpace} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <User className="w-3.5 h-3.5 text-blue-400" /> Display Name / Title
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-white/80 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email ID
              </label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="e.g. alex@ownworld.com"
                required
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-white/80 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Create Password
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">256-Bit Encrypted</span>
              </label>

              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl text-sm font-mono tracking-wider transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'bg-white/80 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-amber-400/90 font-medium leading-tight flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>First user created automatically receives System Administrator access with unlimited storage control!</span>
            </p>

            {/* Error Alert */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs font-medium"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!username.trim() || !registerEmail.trim() || !registerPassword.trim() || loading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                !username.trim() || !registerEmail.trim() || !registerPassword.trim() || loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Initializing Space...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Create My Storage Space</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* TAB 2: LOG IN */
          <form onSubmit={handleLoginSpace} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Mail className="w-3.5 h-3.5 text-blue-400" /> Email ID
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoFocus
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-white/80 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" /> Password
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">256-Bit Encrypted</span>
              </label>

              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={lockoutSec > 0 || loading}
                  placeholder="••••••••••••"
                  required
                  className={`w-full px-4 py-2.5 pr-12 rounded-xl text-sm font-mono tracking-wider transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'bg-white/80 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } ${lockoutSec > 0 ? 'opacity-50 cursor-not-allowed border-rose-500/50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lockout or Error Alert */}
            <AnimatePresence>
              {lockoutSec > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs font-medium"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Rate Limit Lockout</p>
                    <p className="text-[11px] opacity-90">Too many failed attempts. Try again in {lockoutSec}s.</p>
                  </div>
                </motion.div>
              )}

              {errorMsg && lockoutSec === 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-400 text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!loginEmail.trim() || !loginPassword.trim() || lockoutSec > 0 || loading}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                !loginEmail.trim() || !loginPassword.trim() || lockoutSec > 0 || loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Log In To Storage</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Support Note Banner */}
        <div className={`mt-6 p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
          isDarkMode
            ? 'bg-blue-950/40 border-blue-500/30 text-slate-200'
            : 'bg-blue-50 border-blue-200 text-slate-800'
        }`}>
          <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-blue-400 flex items-center gap-1">
              <span>Facing Any Problem or Need Help?</span>
            </p>
            <p className={`mt-0.5 text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              If you have any questions, issue with login, or space issues, please send an email to{' '}
              <a
                href="mailto:shashiyadavbhai@gmail.com"
                className="text-blue-400 hover:text-blue-300 font-bold underline font-mono select-all"
              >
                shashiyadavbhai@gmail.com
              </a>{' '}
              with all your details.
            </p>
          </div>
        </div>

        {/* Security Badges Footer */}
        <div className={`mt-6 pt-4 flex items-center justify-around border-t text-[10px] ${
          isDarkMode ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-500'
        }`}>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> Email Auth</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-blue-400" /> Salted Hashes</span>
          <span className="flex items-center gap-1"><Server className="w-3 h-3 text-indigo-400" /> Encrypted Vault</span>
        </div>
      </motion.div>

      {/* WRONG CREDENTIALS POPUP MODAL */}
      <AnimatePresence>
        {showWrongCredsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border flex flex-col items-center text-center ${
                isDarkMode 
                  ? 'bg-slate-900 border-rose-500/40 text-slate-100 shadow-rose-950/40' 
                  : 'bg-white border-rose-300 text-slate-900 shadow-rose-100'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <XCircle className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-rose-500 mb-1">
                Wrong Credentials
              </h3>

              <p className={`text-xs font-medium mb-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                The Email ID or Password you entered is incorrect. Access to the requested data space has been denied.
              </p>

              {attemptsLeft !== null && (
                <div className="mb-4 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-semibold border border-rose-500/20">
                  Remaining Attempts Left: {attemptsLeft}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowWrongCredsModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/25 active:scale-95"
              >
                Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
