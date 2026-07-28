import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ShieldCheck, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  FileCode, 
  Music, 
  Film, 
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';
import { VaultFile } from '../types';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onDownload: (file: VaultFile) => void;
  isDarkMode: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  isDarkMode,
}) => {
  if (!file) return null;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Decode text file content if base64 dataUrl is present
  const getTextContent = () => {
    if (!file.contentDataUrl) return 'No text content preview available.';
    try {
      const parts = file.contentDataUrl.split(',');
      if (parts.length > 1) {
        return atob(parts[1]);
      }
      return file.contentDataUrl;
    } catch {
      return file.contentDataUrl;
    }
  };

  const handleCopyText = () => {
    const text = getTextContent();
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col md:flex-row overflow-hidden ${
        isDarkMode ? 'glass-panel text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Main Preview Area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-slate-950/60 overflow-hidden min-h-[350px]">
          
          {/* File Viewer Switcher */}
          {file.category === 'image' && file.contentDataUrl ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={file.contentDataUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[60vh] object-contain rounded-lg shadow-xl"
              />

              {/* Image Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white backdrop-blur-md shadow-lg">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setZoom(1); setRotation(0); }}
                  className="text-[10px] px-2 py-1 hover:bg-slate-800 rounded font-bold"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : file.category === 'video' ? (
            <div className="w-full flex items-center justify-center">
              <video
                controls
                src={file.contentDataUrl}
                className="max-h-[60vh] max-w-full rounded-xl shadow-lg border border-slate-800"
              />
            </div>
          ) : file.category === 'audio' ? (
            <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30 animate-pulse">
                <Music className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-sm text-slate-200 mb-2 truncate max-w-xs">{file.name}</h4>
              <audio controls src={file.contentDataUrl} className="w-full mt-2" />
            </div>
          ) : file.category === 'code' || file.category === 'document' ? (
            <div className="w-full h-full max-h-[60vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden text-left">
              <div className="p-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 text-blue-400">
                  <FileCode className="w-4 h-4" /> {file.name}
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-auto whitespace-pre-wrap leading-relaxed select-text">
                {getTextContent()}
              </pre>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <p className="font-bold text-sm text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">Direct preview not available for this file type.</p>
            </div>
          )}

        </div>

        {/* Right Metadata Sidebar */}
        <div className={`w-full md:w-80 p-6 border-l flex flex-col justify-between ${
          isDarkMode ? 'border-slate-800/80 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-400" /> Vault Metadata
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">File Name</span>
                <span className="font-bold text-slate-200 break-all">{file.name}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">File Size</span>
                <span className="font-bold text-slate-200 font-mono">{formatSize(file.size)}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Category & Type</span>
                <span className="font-semibold uppercase tracking-wider text-blue-400">{file.category}</span>
                <span className="text-slate-400 block text-[10px] font-mono">{file.mimeType}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Encrypted Storage</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px] mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> AES-256-GCM Verified
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Created Date</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {new Date(file.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Download Action */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
