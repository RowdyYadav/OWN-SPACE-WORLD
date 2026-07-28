import React, { useState, useEffect } from 'react';
import { SecretCodeLogin } from './components/SecretCodeLogin';
import { VaultHeader } from './components/VaultHeader';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultToolbar } from './components/VaultToolbar';
import { FileGridList } from './components/FileGridList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthResponse, VaultFile, VaultFolder, StorageBreakdown, FileCategory } from './types';

export default function App() {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Vault state
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<VaultFolder[]>([]);
  
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStarredOnly, setIsStarredOnly] = useState<boolean>(false);
  const [isTrashOnly, setIsTrashOnly] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');

  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown | null>(null);

  // Modals
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Auto restore session token if stored in sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('own_world_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject('Invalid session')))
        .then((data) => {
          setAuthData({ token: savedToken, user: data.user });
        })
        .catch(() => {
          sessionStorage.removeItem('own_world_token');
        });
    }
  }, []);

  // Fetch files and storage whenever vault context changes
  useEffect(() => {
    if (authData) {
      fetchVaultFiles();
      fetchStorageUsage();
    }
  }, [authData, currentFolderId, category, searchQuery, isStarredOnly, isTrashOnly]);

  const fetchVaultFiles = async () => {
    if (!authData) return;
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.append('folderId', currentFolderId);
      else if (!isStarredOnly && !isTrashOnly) params.append('folderId', 'null');

      if (category !== 'all') params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      if (isStarredOnly) params.append('starred', 'true');
      if (isTrashOnly) params.append('trash', 'true');

      const res = await fetch(`/api/vault/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Error fetching vault files:', err);
    }
  };

  const fetchStorageUsage = async () => {
    if (!authData) return;
    try {
      const res = await fetch('/api/vault/storage-usage', {
        headers: { Authorization: `Bearer ${authData.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStorageBreakdown(data);
      }
    } catch (err) {
      console.error('Error fetching storage breakdown:', err);
    }
  };

  const handleLoginSuccess = (data: AuthResponse) => {
    setAuthData(data);
    sessionStorage.setItem('own_world_token', data.token);
  };

  const handleLogout = async () => {
    if (authData) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authData.token}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    setAuthData(null);
    sessionStorage.removeItem('own_world_token');
  };

  // Folder breadcrumb navigation
  const handleNavigateBreadcrumb = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setCategory('all');
    setIsStarredOnly(false);
    setIsTrashOnly(false);

    if (!folderId) {
      setFolderPath([]);
    } else {
      const targetFolder = (folders || []).find((f) => f.id === folderId);
      if (targetFolder) {
        setFolderPath([targetFolder]);
      }
    }
  };

  const handleSelectFolder = (folderId: string) => {
    const target = (folders || []).find((f) => f.id === folderId);
    if (target) {
      setCurrentFolderId(folderId);
      setFolderPath((prev) => [...prev, target]);
    }
  };

  // File Upload Handler
  const handleUploadFile = async (fileData: {
    name: string;
    mimeType: string;
    category: FileCategory;
    size: number;
    contentDataUrl: string;
  }) => {
    if (!authData) return;

    const res = await fetch('/api/vault/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({
        ...fileData,
        parentFolderId: currentFolderId,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Upload failed');
    }

    fetchVaultFiles();
    fetchStorageUsage();
  };

  // Folder Create Handler
  const handleCreateFolder = async (name: string, color?: string) => {
    if (!authData) return;

    const res = await fetch('/api/vault/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({
        name,
        color,
        parentFolderId: currentFolderId,
      }),
    });

    if (res.ok) {
      fetchVaultFiles();
    }
  };

  // File Download Handler
  const handleDownloadFile = (file: VaultFile) => {
    if (!file.contentDataUrl) return;
    const link = document.createElement('a');
    link.href = file.contentDataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Star
  const handleToggleStarFile = async (file: VaultFile) => {
    if (!authData) return;
    await fetch(`/api/vault/files/${file.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({ isStarred: !file.isStarred }),
    });
    fetchVaultFiles();
  };

  const handleToggleStarFolder = async (folder: VaultFolder) => {
    if (!authData) return;
    await fetch(`/api/vault/folders/${folder.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({ isStarred: !folder.isStarred }),
    });
    fetchVaultFiles();
  };

  // Delete / Trash
  const handleDeleteFile = async (fileId: string) => {
    if (!authData) return;

    if (isTrashOnly) {
      // Permanent delete
      await fetch(`/api/vault/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authData.token}` },
      });
    } else {
      // Soft move to trash
      await fetch(`/api/vault/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({ isTrashed: true }),
      });
    }
    fetchVaultFiles();
    fetchStorageUsage();
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!authData) return;

    if (isTrashOnly) {
      await fetch(`/api/vault/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authData.token}` },
      });
    } else {
      await fetch(`/api/vault/folders/${folderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({ isTrashed: true }),
      });
    }
    fetchVaultFiles();
  };

  const handleRestoreFile = async (fileId: string) => {
    if (!authData) return;
    await fetch(`/api/vault/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({ isTrashed: false }),
    });
    fetchVaultFiles();
    fetchStorageUsage();
  };

  const handleRestoreFolder = async (folderId: string) => {
    if (!authData) return;
    await fetch(`/api/vault/folders/${folderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
      body: JSON.stringify({ isTrashed: false }),
    });
    fetchVaultFiles();
  };

  const handleEmptyTrash = async () => {
    if (!authData) return;
    await fetch('/api/vault/trash', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authData.token}` },
    });
    fetchVaultFiles();
    fetchStorageUsage();
  };

  // Drop files handler
  const handleDropFiles = async (fileList: FileList) => {
    if (!authData) return;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await handleUploadFile({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          category: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
            ? 'audio'
            : 'document',
          size: file.size,
          contentDataUrl: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Sort files
  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return b.size - a.size;
    if (sortBy === 'type') return a.category.localeCompare(b.category);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // If not logged in, show Homepage Gate
  if (!authData) {
    return (
      <SecretCodeLogin
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Header */}
      <VaultHeader
        user={authData.user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogout={handleLogout}
        onOpenAdmin={() => setIsAdminOpen(true)}
        storageUsedBytes={storageBreakdown?.total || 0}
        storageQuotaBytes={storageBreakdown?.quota || 1}
      />

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Left Navigation Sidebar */}
        <VaultSidebar
          currentCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            setCurrentFolderId(null);
            setIsStarredOnly(false);
            setIsTrashOnly(false);
          }}
          currentFolderId={currentFolderId}
          onSelectFolder={handleNavigateBreadcrumb}
          isStarredOnly={isStarredOnly}
          onSelectStarred={() => {
            setIsStarredOnly(true);
            setIsTrashOnly(false);
            setCategory('all');
            setCurrentFolderId(null);
          }}
          isTrashOnly={isTrashOnly}
          onSelectTrash={() => {
            setIsTrashOnly(true);
            setIsStarredOnly(false);
            setCategory('all');
            setCurrentFolderId(null);
          }}
          storageBreakdown={storageBreakdown}
          user={authData.user}
          onOpenAdmin={() => setIsAdminOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Main Vault Content */}
        <main className="flex-1 min-w-0">
          
          <VaultToolbar
            currentFolder={(folders || []).find((f) => f.id === currentFolderId) || null}
            folderPath={folderPath}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onOpenUploadModal={() => setIsUploadOpen(true)}
            onOpenNewFolderModal={() => setIsNewFolderOpen(true)}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isTrashOnly={isTrashOnly}
            onEmptyTrash={handleEmptyTrash}
            isDarkMode={isDarkMode}
            fileCount={sortedFiles.length}
          />

          {/* Support Email Notice Banner */}
          <div className={`mx-6 my-2 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            isDarkMode 
              ? 'bg-blue-950/30 border-blue-500/20 text-slate-300' 
              : 'bg-blue-50/80 border-blue-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="font-semibold text-blue-400">Support Note:</span>
              <span>Having any issue or need space assistance? Send an email to</span>
              <a
                href="mailto:shashiyadavbhai@gmail.com"
                className="font-bold text-blue-400 hover:underline font-mono select-all"
              >
                shashiyadavbhai@gmail.com
              </a>
              <span>with all your details.</span>
            </div>
          </div>

          <FileGridList
            files={sortedFiles}
            folders={folders}
            viewMode={viewMode}
            onSelectFolder={handleSelectFolder}
            onPreviewFile={(file) => setPreviewFile(file)}
            onDownloadFile={handleDownloadFile}
            onToggleStarFile={handleToggleStarFile}
            onToggleStarFolder={handleToggleStarFolder}
            onRenameFile={() => {}}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onRestoreFile={handleRestoreFile}
            onRestoreFolder={handleRestoreFolder}
            onDropFiles={handleDropFiles}
            isDarkMode={isDarkMode}
            isTrashOnly={isTrashOnly}
          />

        </main>

      </div>

      {/* MODALS */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
        isDarkMode={isDarkMode}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadFile}
        isDarkMode={isDarkMode}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreateFolder={handleCreateFolder}
        isDarkMode={isDarkMode}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        token={authData.token}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}
