import fs from 'node:fs';
import path from 'node:path';
import { User, VaultFile, VaultFolder, AuditLog, FileCategory, StorageBreakdown, SystemStats } from '../types';
import { hashSecretCode, generateSessionToken } from './crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vault_storage.json');

interface DbSchema {
  users: User[];
  folders: VaultFolder[];
  files: VaultFile[];
  sessions: { token: string; userId: string; expiresAt: number }[];
  auditLogs: AuditLog[];
}

// Initial seed values
const ADMIN_SECRET_CODE = 'ADMIN1234';
const USER_SECRET_CODE = 'USER9999';

function createSeedData(): DbSchema {
  const now = new Date().toISOString();

  const auditLogs: AuditLog[] = [
    {
      id: 'log_001',
      timestamp: now,
      eventType: 'SYSTEM_LOCK',
      username: 'SYSTEM',
      ip: '127.0.0.1',
      details: 'OWN WORLD Cloud Storage Engine initialized. Ready for initial secret key registration.',
      level: 'info',
    },
  ];

  return { users: [], folders: [], files: [], sessions: [], auditLogs };
}

class DatabaseService {
  private db: DbSchema;

  constructor() {
    this.db = this.loadData();
  }

  private loadData(): DbSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          folders: Array.isArray(parsed.folders) ? parsed.folders : [],
          files: Array.isArray(parsed.files) ? parsed.files : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : Array.isArray(parsed.logs) ? parsed.logs : [],
        };
      }
    } catch (err) {
      console.error('Error reading vault_storage.json, falling back to seed:', err);
    }
    const seed = createSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data?: DbSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to vault_storage.json:', err);
    }
  }

  // Auth Operations
  public getUserByEmail(email: string): User | null {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.db.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail && u.status === 'active');
    return user || null;
  }

  public getUserByEmailAndPassword(email: string, pass: string): User | null {
    const cleanEmail = email.toLowerCase().trim();
    const hash = hashSecretCode(pass.trim());
    const user = this.db.users.find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail && u.secretCodeHash === hash && u.status === 'active'
    );
    return user || null;
  }

  public getUserBySecretCode(code: string): User | null {
    const hash = hashSecretCode(code);
    const user = this.db.users.find((u) => u.secretCodeHash === hash && u.status === 'active');
    return user || null;
  }

  public createSession(userId: string): string {
    const token = generateSessionToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    this.db.sessions = this.db.sessions.filter((s) => s.userId !== userId);
    this.db.sessions.push({ token, userId, expiresAt });

    // Update last login
    const user = this.db.users.find((u) => u.id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
    }
    this.saveData();
    return token;
  }

  public getUserByToken(token: string): User | null {
    const session = this.db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;

    const user = this.db.users.find((u) => u.id === session.userId);
    if (!user || user.status !== 'active') return null;

    return user;
  }

  public invalidateSession(token: string): void {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
    this.saveData();
  }

  // Audit Logs
  public addLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.db.auditLogs.unshift(fullLog);
    if (this.db.auditLogs.length > 200) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 200);
    }
    this.saveData();
    return fullLog;
  }

  public getLogs(): AuditLog[] {
    return this.db.auditLogs;
  }

  // User Management (Admin)
  public getAllUsers(): User[] {
    return this.db.users.map((u) => {
      // Re-calculate used storage
      const used = this.db.files
        .filter((f) => f.userId === u.id && !f.isTrashed)
        .reduce((sum, f) => sum + f.size, 0);
      return { ...u, storageUsedBytes: used };
    });
  }

  public createUser(data: {
    username: string;
    email: string;
    secretCode: string;
    role: 'admin' | 'user';
    storageQuotaBytes: number;
  }): { user: User; secretCode: string } {
    const code = data.secretCode.trim();
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      username: data.username.trim(),
      email: data.email.toLowerCase().trim(),
      role: data.role,
      secretCodeHash: hashSecretCode(code),
      secretCodeDisplay: code,
      secretCodeMasked: `${code.substring(0, 2)}****`,
      storageQuotaBytes: data.storageQuotaBytes,
      storageUsedBytes: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.db.users.push(newUser);
    this.saveData();
    return { user: newUser, secretCode: code };
  }

  public resetUserSecretCode(userId: string, newCode: string): void {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const code = newCode.trim();
    user.secretCodeHash = hashSecretCode(code);
    user.secretCodeDisplay = code;
    user.secretCodeMasked = `${code.substring(0, 2)}****`;
    this.saveData();
  }

  public updateUser(userId: string, updates: Partial<Pick<User, 'username' | 'storageQuotaBytes' | 'status' | 'role'>>): User {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    if (updates.username) user.username = updates.username.trim();
    if (updates.storageQuotaBytes !== undefined) user.storageQuotaBytes = updates.storageQuotaBytes;
    if (updates.status) user.status = updates.status;
    if (updates.role) user.role = updates.role;

    this.saveData();
    return user;
  }

  public deleteUser(userId: string): void {
    this.db.users = this.db.users.filter((u) => u.id !== userId);
    this.db.files = this.db.files.filter((f) => f.userId !== userId);
    this.db.folders = this.db.folders.filter((f) => f.userId !== userId);
    this.db.sessions = this.db.sessions.filter((s) => s.userId !== userId);
    this.saveData();
  }

  // Vault Files Operations
  public getUserFiles(userId: string, options?: { folderId?: string | null; category?: string; search?: string; starredOnly?: boolean; trashOnly?: boolean }): VaultFile[] {
    let files = this.db.files.filter((f) => f.userId === userId);

    if (options?.trashOnly) {
      files = files.filter((f) => f.isTrashed);
    } else {
      files = files.filter((f) => !f.isTrashed);

      if (options?.starredOnly) {
        files = files.filter((f) => f.isStarred);
      }

      if (options?.folderId !== undefined) {
        files = files.filter((f) => f.parentFolderId === options.folderId);
      }

      if (options?.category && options.category !== 'all') {
        files = files.filter((f) => f.category === options.category);
      }

      if (options?.search) {
        const query = options.search.toLowerCase();
        files = files.filter((f) => f.name.toLowerCase().includes(query) || f.category.toLowerCase().includes(query));
      }
    }

    return files;
  }

  public getUserFolders(userId: string, options?: { parentFolderId?: string | null; trashOnly?: boolean; starredOnly?: boolean }): VaultFolder[] {
    let folders = this.db.folders.filter((f) => f.userId === userId);

    if (options?.trashOnly) {
      folders = folders.filter((f) => f.isTrashed);
    } else {
      folders = folders.filter((f) => !f.isTrashed);

      if (options?.starredOnly) {
        folders = folders.filter((f) => f.isStarred);
      } else if (options?.parentFolderId !== undefined) {
        folders = folders.filter((f) => f.parentFolderId === options.parentFolderId);
      }
    }

    return folders;
  }

  public createFile(userId: string, fileData: {
    name: string;
    mimeType: string;
    category: FileCategory;
    size: number;
    parentFolderId: string | null;
    contentDataUrl: string;
  }): VaultFile {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const currentUsed = this.db.files
      .filter((f) => f.userId === userId && !f.isTrashed)
      .reduce((s, f) => s + f.size, 0);

    if (currentUsed + fileData.size > user.storageQuotaBytes) {
      throw new Error(`Storage quota exceeded! Vault remaining: ${Math.max(0, user.storageQuotaBytes - currentUsed)} bytes.`);
    }

    const now = new Date().toISOString();
    const newFile: VaultFile = {
      id: `fil_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: fileData.name.trim(),
      originalName: fileData.name.trim(),
      mimeType: fileData.mimeType,
      category: fileData.category,
      size: fileData.size,
      parentFolderId: fileData.parentFolderId,
      isStarred: false,
      isTrashed: false,
      contentDataUrl: fileData.contentDataUrl,
      encryptionTag: 'AES-256-GCM:STATIONARY',
      createdAt: now,
      updatedAt: now,
    };

    this.db.files.push(newFile);
    this.saveData();
    return newFile;
  }

  public createFolder(userId: string, name: string, parentFolderId: string | null = null, color?: string): VaultFolder {
    const now = new Date().toISOString();
    const newFolder: VaultFolder = {
      id: `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: name.trim(),
      parentFolderId,
      color: color || '#3b82f6',
      isStarred: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.db.folders.push(newFolder);
    this.saveData();
    return newFolder;
  }

  public updateFile(userId: string, fileId: string, updates: Partial<Pick<VaultFile, 'name' | 'isStarred' | 'isTrashed' | 'parentFolderId'>>): VaultFile {
    const file = this.db.files.find((f) => f.id === fileId && f.userId === userId);
    if (!file) throw new Error('File not found');

    if (updates.name !== undefined) file.name = updates.name.trim();
    if (updates.isStarred !== undefined) file.isStarred = updates.isStarred;
    if (updates.isTrashed !== undefined) file.isTrashed = updates.isTrashed;
    if (updates.parentFolderId !== undefined) file.parentFolderId = updates.parentFolderId;
    file.updatedAt = new Date().toISOString();

    this.saveData();
    return file;
  }

  public updateFolder(userId: string, folderId: string, updates: Partial<Pick<VaultFolder, 'name' | 'color' | 'isStarred' | 'isTrashed' | 'parentFolderId'>>): VaultFolder {
    const folder = this.db.folders.find((f) => f.id === folderId && f.userId === userId);
    if (!folder) throw new Error('Folder not found');

    if (updates.name !== undefined) folder.name = updates.name.trim();
    if (updates.color !== undefined) folder.color = updates.color;
    if (updates.isStarred !== undefined) folder.isStarred = updates.isStarred;
    if (updates.isTrashed !== undefined) folder.isTrashed = updates.isTrashed;
    if (updates.parentFolderId !== undefined) folder.parentFolderId = updates.parentFolderId;
    folder.updatedAt = new Date().toISOString();

    this.saveData();
    return folder;
  }

  public deleteFilePermanently(userId: string, fileId: string): void {
    this.db.files = this.db.files.filter((f) => !(f.id === fileId && f.userId === userId));
    this.saveData();
  }

  public deleteFolderPermanently(userId: string, folderId: string): void {
    this.db.folders = this.db.folders.filter((f) => !(f.id === folderId && f.userId === userId));
    // Also delete or orphan sub-files
    this.db.files = this.db.files.filter((f) => !(f.parentFolderId === folderId && f.userId === userId));
    this.saveData();
  }

  public emptyTrash(userId: string): void {
    this.db.files = this.db.files.filter((f) => !(f.userId === userId && f.isTrashed));
    this.db.folders = this.db.folders.filter((f) => !(f.userId === userId && f.isTrashed));
    this.saveData();
  }

  // Breakdown & Stats
  public getStorageBreakdown(userId: string): StorageBreakdown {
    const user = this.db.users.find((u) => u.id === userId);
    const quota = user ? user.storageQuotaBytes : 1024 * 1024 * 1024;

    const files = this.db.files.filter((f) => f.userId === userId && !f.isTrashed);

    const breakdown: StorageBreakdown = {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
      archives: 0,
      code: 0,
      others: 0,
      total: 0,
      quota,
    };

    files.forEach((f) => {
      breakdown.total += f.size;
      switch (f.category) {
        case 'image':
          breakdown.images += f.size;
          break;
        case 'video':
          breakdown.videos += f.size;
          break;
        case 'audio':
          breakdown.audio += f.size;
          break;
        case 'document':
          breakdown.documents += f.size;
          break;
        case 'archive':
          breakdown.archives += f.size;
          break;
        case 'code':
          breakdown.code += f.size;
          break;
        default:
          breakdown.others += f.size;
          break;
      }
    });

    return breakdown;
  }

  public getSystemStats(): SystemStats {
    const totalFiles = this.db.files.filter((f) => !f.isTrashed).length;
    const totalFolders = this.db.folders.filter((f) => !f.isTrashed).length;
    const totalUsers = this.db.users.length;
    const activeVaultsCount = this.db.users.filter((u) => u.status === 'active').length;

    let totalStorageUsed = 0;
    let totalSystemQuota = 0;

    this.db.users.forEach((u) => {
      totalSystemQuota += u.storageQuotaBytes;
      const userUsed = this.db.files
        .filter((f) => f.userId === u.id && !f.isTrashed)
        .reduce((sum, f) => sum + f.size, 0);
      totalStorageUsed += userUsed;
    });

    const failedLoginsToday = this.db.auditLogs.filter((l) => l.eventType === 'LOGIN_FAILED').length;

    return {
      totalStorageUsed,
      totalSystemQuota,
      totalFiles,
      totalFolders,
      totalUsers,
      activeVaultsCount,
      failedLoginsToday,
    };
  }
}

export const db = new DatabaseService();
