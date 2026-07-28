import React, { useState, useRef } from 'react';
import { X, Upload, ShieldCheck, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FileCategory } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileData: {
    name: string;
    mimeType: string;
    category: FileCategory;
    size: number;
    contentDataUrl: string;
  }) => Promise<void>;
  isDarkMode: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const determineCategory = (file: File): FileCategory => {
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name)) return 'image';
    if (mime.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/.test(name)) return 'video';
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/.test(name)) return 'audio';
    if (mime.includes('pdf') || mime.includes('document') || mime.includes('text') || /\.(pdf|doc|docx|txt|rtf|md|xlsx|csv|pptx)$/.test(name)) return 'document';
    if (/\.(zip|tar|gz|rar|7z)$/.test(name)) return 'archive';
    if (/\.(js|ts|jsx|tsx|json|html|css|py|java|cpp|c|go|rs|sh|sql)$/.test(name)) return 'code';
    return 'other';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setErrorMsg(null);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const dataUrl = await readFileAsDataUrl(file);
        const category = determineCategory(file);

        await onUpload({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          category,
          size: file.size,
          contentDataUrl: dataUrl,
        });

        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      onClose();
      setSelectedFiles([]);
      setProgress(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload files.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      
      <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative ${
        isDarkMode ? 'glass-panel text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" /> Upload Files to Vault
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDarkMode 
              ? 'border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900' 
              : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold">Click to browse or drag & drop files here</p>
          <p className="text-[10px] text-slate-400 mt-1">Supports Documents, Images, Videos, Audio, Code & Archives</p>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <span className="truncate max-w-[240px] font-bold text-slate-200">{file.name}</span>
                <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Encrypting & Storing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all ${
              selectedFiles.length === 0 || uploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20'
            }`}
          >
            {uploading ? 'Storing Vault Files...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>

      </div>

    </div>
  );
};
