import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, color?: string) => Promise<void>;
  isDarkMode: boolean;
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || loading) return;

    setLoading(true);
    try {
      await onCreateFolder(folderName.trim(), selectedColor);
      setFolderName('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      
      <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${
        isDarkMode ? 'glass-panel text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-400" /> Create New Folder
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Confidential Projects"
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl text-xs transition-all ${
                isDarkMode 
                  ? 'bg-slate-900 border border-slate-800 text-white focus:border-blue-500' 
                  : 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Folder Color Tag
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
