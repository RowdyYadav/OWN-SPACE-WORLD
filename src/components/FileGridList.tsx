import React, { useState } from 'react';
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
  Download, 
  Eye, 
  MoreVertical, 
  Edit3, 
  MoveRight, 
  ShieldCheck, 
  Upload, 
  HardDrive,
  FileCode,
  File,
  RotateCcw
} from 'lucide-react';
import { VaultFile, VaultFolder } from '../types';

interface FileGridListProps {
  files: VaultFile[];
  folders: VaultFolder[];
  viewMode: 'grid' | 'list';
  onSelectFolder: (folderId: string) => void;
  onPreviewFile: (file: VaultFile) => void;
  onDownloadFile: (file: VaultFile) => void;
  onToggleStarFile: (file: VaultFile) => void;
  onToggleStarFolder: (folder: VaultFolder) => void;
  onRenameFile: (file: VaultFile) => void;
  onDeleteFile: (fileId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRestoreFile?: (fileId: string) => void;
  onRestoreFolder?: (folderId: string) => void;
  onDropFiles: (fileList: FileList) => void;
  isDarkMode: boolean;
  isTrashOnly: boolean;
}

export const FileGridList: React.FC<FileGridListProps> = ({
  files,
  folders,
  viewMode,
  onSelectFolder,
  onPreviewFile,
  onDownloadFile,
  onToggleStarFile,
  onToggleStarFolder,
  onRenameFile,
  onDeleteFile,
  onDeleteFolder,
  onRestoreFile,
  onRestoreFolder,
  onDropFiles,
  isDarkMode,
  isTrashOnly,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const isEmpty = files.length === 0 && folders.length === 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative min-h-[480px] rounded-2xl p-6 border transition-all duration-200 ${
        isDraggingOver 
          ? 'border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/20' 
          : isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50/50 border-slate-200'
      }`}
    >
      {/* Visual Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-blue-900/80 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-blue-400 text-white animate-in fade-in">
          <div className="p-4 rounded-full bg-blue-500/20 mb-3 animate-bounce">
            <Upload className="w-10 h-10 text-blue-300" />
          </div>
          <p className="text-lg font-bold">Release to Encrypt & Upload</p>
          <p className="text-xs text-blue-200 mt-1">Files will be stored securely in your OWN WORLD vault.</p>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500 border border-slate-700/50">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {isTrashOnly ? 'Trash is Empty' : 'Vault Location is Empty'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {isTrashOnly
              ? 'There are no items currently in the recycle bin.'
              : 'Upload files or create folders to start building your private encrypted vault.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* FOLDERS SECTION */}
          {folders.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-400" /> Folders ({folders.length})
              </p>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group relative rounded-xl border p-3.5 transition-all flex items-center justify-between cursor-pointer ${
                      isDarkMode ? 'glass-card text-slate-200' : 'glass-card-light text-slate-800'
                    }`}
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                        style={{ backgroundColor: `${folder.color || '#3b82f6'}20`, color: folder.color || '#3b82f6' }}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                          {folder.name}
                        </p>
                        <p className="text-[10px] text-slate-400">Folder</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isTrashOnly && onRestoreFolder ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreFolder(folder.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30 transition-all"
                          title="Bring back to original place"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStarFolder(folder);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${folder.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors opacity-90 hover:opacity-100"
                        title={isTrashOnly ? 'Delete Permanently' : 'Move to Trash'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILES SECTION */}
          {files.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Files ({files.length})
              </p>

              {viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        isDarkMode ? 'glass-card text-slate-200' : 'glass-card-light text-slate-800'
                      }`}
                    >
                      {/* Top Preview / Icon Header */}
                      <div 
                        className="relative w-full h-32 rounded-lg bg-slate-900/60 overflow-hidden flex items-center justify-center border border-white/5 cursor-pointer mb-3"
                        onClick={() => onPreviewFile(file)}
                      >
                        {file.category === 'image' && file.contentDataUrl ? (
                          <img
                            src={file.contentDataUrl}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                            {getCategoryIcon(file.category)}
                          </div>
                        )}

                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 text-slate-300 backdrop-blur-sm border border-slate-700/50">
                          {formatSize(file.size)}
                        </span>

                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="p-1 rounded bg-slate-950/80 text-emerald-400" title="256-Bit Encrypted">
                            <ShieldCheck className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* File Details */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p 
                            className="text-xs font-bold truncate cursor-pointer hover:text-blue-400 transition-colors flex-1"
                            onClick={() => onPreviewFile(file)}
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => onToggleStarFile(file)}
                            className="text-slate-400 hover:text-amber-400 shrink-0"
                          >
                            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                          <span className="uppercase font-semibold tracking-wider text-slate-500">{file.category}</span>
                          <div className="flex items-center gap-1">
                            {isTrashOnly && onRestoreFile ? (
                              <button
                                type="button"
                                onClick={() => onRestoreFile(file.id)}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30 transition-all"
                                title="Bring back to original place"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onPreviewFile(file)}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                                  title="Preview File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDownloadFile(file)}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteFile(file.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                              title={isTrashOnly ? 'Delete Permanently' : 'Move to Trash'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className={`rounded-xl border overflow-hidden ${
                  isDarkMode ? 'border-slate-800 divide-y divide-slate-800 bg-slate-900/40' : 'border-slate-200 divide-y divide-slate-200 bg-white'
                }`}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between gap-4 hover:bg-blue-500/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => onPreviewFile(file)}>
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 shrink-0">
                          {getCategoryIcon(file.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-blue-400">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{file.mimeType} • {formatSize(file.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTrashOnly && onRestoreFile ? (
                          <button
                            type="button"
                            onClick={() => onRestoreFile(file.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all"
                            title="Bring back to original place"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore to original place</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onToggleStarFile(file)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400"
                            >
                              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onPreviewFile(file)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Preview File"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDownloadFile(file)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title={isTrashOnly ? 'Delete Permanently' : 'Move to Trash'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
};
