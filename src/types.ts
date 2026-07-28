export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'disabled' | 'locked';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  secretCodeHash: string;
  secretCodeMasked?: string;
  secretCodeDisplay?: string; // For admin view only
  storageQuotaBytes: number;
  storageUsedBytes: number;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other';

export interface VaultFile {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  category: FileCategory;
  size: number;
  parentFolderId: string | null;
  isStarred: boolean;
  isTrashed: boolean;
  contentDataUrl?: string; // Encrypted or base64 data for preview/download
  previewUrl?: string;
  encryptionTag?: string; // AES-256 simulation metadata
  createdAt: string;
  updatedAt: string;
}

export interface VaultFolder {
  id: string;
  userId: string;
  name: string;
  parentFolderId: string | null;
  color?: string;
  isStarred: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LogLevel = 'info' | 'warning' | 'danger';

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'RATE_LIMITED' 
    | 'USER_CREATED' 
    | 'USER_UPDATED' 
    | 'USER_DELETED' 
    | 'CODE_RESET' 
    | 'FILE_UPLOAD' 
    | 'FILE_DELETE' 
    | 'FILE_RENAME' 
    | 'FOLDER_CREATE'
    | 'STORAGE_LIMIT_CHANGED'
    | 'SYSTEM_LOCK';
  userId?: string;
  username?: string;
  ip: string;
  details: string;
  level: LogLevel;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'secretCodeHash'>;
  message?: string;
}

export interface StorageBreakdown {
  images: number;
  videos: number;
  audio: number;
  documents: number;
  archives: number;
  code: number;
  others: number;
  total: number;
  quota: number;
}

export interface SystemStats {
  totalStorageUsed: number;
  totalSystemQuota: number;
  totalFiles: number;
  totalFolders: number;
  totalUsers: number;
  activeVaultsCount: number;
  failedLoginsToday: number;
}
