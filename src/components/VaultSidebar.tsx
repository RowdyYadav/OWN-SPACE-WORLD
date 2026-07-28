import React from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code, 
  Star, 
  Trash2, 
  HardDrive, 
  FolderPlus, 
  ShieldAlert, 
  Grid, 
  Terminal,
  Sparkles
} from 'lucide-react';
import { StorageBreakdown, User } from '../types';

interface VaultSidebarProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  isStarredOnly: boolean;
  onSelectStarred: () => void;
  isTrashOnly: boolean;
  onSelectTrash: () => void;
  storageBreakdown: StorageBreakdown | null;
  user: User;
  onOpenAdmin: () => void;
  isDarkMode: boolean;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  currentCategory,
  onSelectCategory,
  currentFolderId,
  onSelectFolder,
  isStarredOnly,
  onSelectStarred,
  isTrashOnly,
  onSelectTrash,
  storageBreakdown,
  user,
  onOpenAdmin,
  isDarkMode,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const navItemClass = (isActive: boolean) => `
    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
        : isDarkMode
        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }
  `;

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between border-r p-4 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950/60 border-slate-800/80 text-slate-200' : 'bg-slate-50/80 border-slate-200 text-slate-800'
    }`}>
      
      <div className="space-y-6">
        
        {/* Main Vault Sections */}
        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
            Vault Navigation
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectFolder(null);
                onSelectCategory('all');
              }}
              className={navItemClass(currentCategory === 'all' && !currentFolderId && !isStarredOnly && !isTrashOnly)}
            >
              <Grid className="w-4 h-4 text-blue-400" />
              <span>All Vault Files</span>
            </button>

            <button
              type="button"
              onClick={onSelectStarred}
              className={navItemClass(isStarredOnly)}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Starred & Favorites</span>
            </button>

            <button
              type="button"
              onClick={onSelectTrash}
              className={navItemClass(isTrashOnly)}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Trash & Recycle Bin</span>
            </button>
          </div>
        </div>

        {/* File Categories */}
        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
            File Categories
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectCategory('document')}
              className={navItemClass(currentCategory === 'document' && !isStarredOnly && !isTrashOnly)}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Documents & PDFs</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('image')}
              className={navItemClass(currentCategory === 'image' && !isStarredOnly && !isTrashOnly)}
            >
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span>Images & Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('video')}
              className={navItemClass(currentCategory === 'video' && !isStarredOnly && !isTrashOnly)}
            >
              <Film className="w-4 h-4 text-purple-400" />
              <span>Videos & Media</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('audio')}
              className={navItemClass(currentCategory === 'audio' && !isStarredOnly && !isTrashOnly)}
            >
              <Music className="w-4 h-4 text-emerald-400" />
              <span>Audio & Music</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('archive')}
              className={navItemClass(currentCategory === 'archive' && !isStarredOnly && !isTrashOnly)}
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Archives & ZIP</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectCategory('code')}
              className={navItemClass(currentCategory === 'code' && !isStarredOnly && !isTrashOnly)}
            >
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Code & Scripts</span>
            </button>
          </div>
        </div>

        {/* Hidden Admin Quick Launch */}
        {user.role === 'admin' && (
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> System Admin
            </p>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Hidden Admin Panel</span>
            </button>
          </div>
        )}

      </div>

      {/* Storage Breakdown Widget at Bottom */}
      {storageBreakdown && (
        <div className={`mt-6 p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Vault Storage
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round((storageBreakdown.total / (storageBreakdown.quota || 1)) * 100)}%
            </span>
          </div>

          <p className="text-xs font-mono font-bold text-slate-200 mb-2">
            {formatSize(storageBreakdown.total)} <span className="text-slate-500 font-normal">/ {formatSize(storageBreakdown.quota)}</span>
          </p>

          {/* Color Breakdown Stack */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex mb-3">
            <div style={{ width: `${(storageBreakdown.documents / (storageBreakdown.quota || 1)) * 100}%` }} className="bg-blue-500 h-full" title="Documents" />
            <div style={{ width: `${(storageBreakdown.images / (storageBreakdown.quota || 1)) * 100}%` }} className="bg-pink-500 h-full" title="Images" />
            <div style={{ width: `${(storageBreakdown.videos / (storageBreakdown.quota || 1)) * 100}%` }} className="bg-purple-500 h-full" title="Videos" />
            <div style={{ width: `${(storageBreakdown.code / (storageBreakdown.quota || 1)) * 100}%` }} className="bg-cyan-500 h-full" title="Code" />
            <div style={{ width: `${(storageBreakdown.others / (storageBreakdown.quota || 1)) * 100}%` }} className="bg-slate-500 h-full" title="Others" />
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Docs: {formatSize(storageBreakdown.documents)}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Images: {formatSize(storageBreakdown.images)}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Videos: {formatSize(storageBreakdown.videos)}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Code: {formatSize(storageBreakdown.code)}</span>
          </div>
        </div>
      )}

    </aside>
  );
};
