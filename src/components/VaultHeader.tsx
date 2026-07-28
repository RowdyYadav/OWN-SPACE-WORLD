import React, { useState } from 'react';
import { Shield, Search, Moon, Sun, Lock, ShieldCheck, UserCheck, ChevronDown, HardDrive, Settings, LogOut, Terminal, Mail } from 'lucide-react';
import { User } from '../types';

interface VaultHeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  storageUsedBytes: number;
  storageQuotaBytes: number;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  user,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  onOpenAdmin,
  storageUsedBytes,
  storageQuotaBytes,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const usagePercent = Math.min(100, Math.round((storageUsedBytes / (storageQuotaBytes || 1)) * 100));

  return (
    <header className={`sticky top-0 z-30 w-full border-b backdrop-blur-md transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-950/80 border-slate-800/80 text-slate-100' 
        : 'bg-white/80 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                OWN WORLD
              </h1>
              {user.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Encrypted Private Vault</p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files, documents, images..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs transition-all ${
                isDarkMode 
                  ? 'bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900' 
                  : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Storage Meter Badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>{formatSize(storageUsedBytes)} / {formatSize(storageQuotaBytes)}</span>
            <div className="w-12 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div 
                className={`h-full rounded-full ${usagePercent > 85 ? 'bg-rose-500' : 'bg-blue-500'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Support Email Badge */}
          <a
            href="mailto:shashiyadavbhai@gmail.com"
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isDarkMode 
                ? 'bg-blue-950/40 border-blue-500/30 text-blue-300 hover:bg-blue-900/50' 
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
            title="Need help? Contact support at shashiyadavbhai@gmail.com"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Help: shashiyadavbhai@gmail.com</span>
          </a>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border transition-colors ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile & Vault Lock */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200' 
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold max-w-[100px] truncate">{user.username}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border p-2 z-50 animate-in fade-in slide-in-from-top-2 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold truncate">{user.username}</p>
                  {user.email && <p className="text-[10px] text-blue-400 font-mono truncate">{user.email}</p>}
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Space Vault Unlocked
                  </p>
                </div>

                <a
                  href="mailto:shashiyadavbhai@gmail.com"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-blue-500/10 text-blue-300 font-medium transition-colors mb-1"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Support: shashiyadavbhai@gmail.com</span>
                </a>

                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-purple-500/10 text-purple-300 font-medium transition-colors mb-1"
                  >
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Admin Control Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-rose-500/10 text-rose-400 font-medium transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Vault (Logout)</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
