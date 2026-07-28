import React from 'react';
import { 
  FolderPlus, 
  Upload, 
  ChevronRight, 
  Home, 
  Grid, 
  List, 
  ArrowUpDown, 
  Trash2, 
  Sparkles,
  Search
} from 'lucide-react';
import { VaultFolder } from '../types';

interface VaultToolbarProps {
  currentFolder: VaultFolder | null;
  folderPath: VaultFolder[];
  onNavigateBreadcrumb: (folderId: string | null) => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'name' | 'date' | 'size' | 'type';
  onSortChange: (sort: 'name' | 'date' | 'size' | 'type') => void;
  isTrashOnly: boolean;
  onEmptyTrash: () => void;
  isDarkMode: boolean;
  fileCount: number;
}

export const VaultToolbar: React.FC<VaultToolbarProps> = ({
  currentFolder,
  folderPath,
  onNavigateBreadcrumb,
  onOpenUploadModal,
  onOpenNewFolderModal,
  viewMode,
  onToggleViewMode,
  sortBy,
  onSortChange,
  isTrashOnly,
  onEmptyTrash,
  isDarkMode,
  fileCount,
}) => {
  return (
    <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'
    }`}>
      
      {/* Breadcrumb Path */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
        <button
          type="button"
          onClick={() => onNavigateBreadcrumb(null)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !currentFolder
              ? isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600'
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Root Vault</span>
        </button>

        {folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigateBreadcrumb(folder.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                index === folderPath.length - 1
                  ? isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}

        <span className="text-[10px] text-slate-500 font-mono ml-2 border-l border-slate-700 pl-2">
          {fileCount} items
        </span>
      </div>

      {/* Toolbar Right Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">

        {isTrashOnly ? (
          <button
            type="button"
            onClick={onEmptyTrash}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash</span>
          </button>
        ) : (
          <>
            {/* New Folder */}
            <button
              type="button"
              onClick={onOpenNewFolderModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FolderPlus className="w-4 h-4 text-blue-400" />
              <span>New Folder</span>
            </button>

            {/* Upload File */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </>
        )}

        {/* View Mode Switcher */}
        <div className={`p-1 rounded-xl border flex items-center gap-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onToggleViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Grid View"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className={`px-3 py-2 pr-8 rounded-xl text-xs font-semibold appearance-none border transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-blue-500' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

      </div>

    </div>
  );
};
