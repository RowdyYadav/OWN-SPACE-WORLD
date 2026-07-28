import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { db } from './src/server/db';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './src/server/rateLimiter';

const app = express();
const PORT = 3000;

// Body parser with 50MB limit for uploading documents, images, videos, audio, etc.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Express Auth Middleware
interface AuthRequest extends Request {
  user?: any;
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.substring(7);
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Session expired or invalid secret token.' });
  }

  req.user = user;
  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required for this resource.' });
  }
  next();
};

// Helper IP resolver
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1';
}

// --------------------------------------------------
// HEALTH CHECK API
// --------------------------------------------------

app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------------------------------------------
// AUTH API
// --------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, secretCode, username } = req.body;
  const clientIp = getClientIp(req);

  const cleanEmail = (email || '').toString().trim();
  const cleanPass = (password || secretCode || '').toString().trim();
  const cleanName = (username || '').toString().trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ message: 'A valid Email ID is required to create a data space.' });
  }

  if (!cleanPass || cleanPass.length < 3) {
    return res.status(400).json({ message: 'Password must be at least 3 characters long.' });
  }

  if (!cleanName) {
    return res.status(400).json({ message: 'Display Name / Vault Title is required.' });
  }

  // Check if email is already taken
  const existingUser = db.getUserByEmail(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ message: 'This Email ID is already registered. Please unlock your existing vault instead.' });
  }

  // Determine role: First user created in system gets 'admin', all subsequent get 'user'
  const allUsers = db.getAllUsers();
  const isFirstUser = allUsers.length === 0;
  const role: 'admin' | 'user' = isFirstUser ? 'admin' : 'user';

  // Initial Quota: 100 GB for first user (Admin), 10 GB for regular user
  const storageQuotaBytes = isFirstUser ? 100 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024;

  const { user } = db.createUser({
    username: cleanName,
    email: cleanEmail,
    secretCode: cleanPass,
    role,
    storageQuotaBytes,
  });

  // Seed initial folder & welcome document for the new space
  try {
    const welcomeText = `Welcome to OWN WORLD Data Space, ${user.username}!

Your private cloud storage vault is officially active.
- Registered Email: ${user.email}
- Access Role: ${user.role.toUpperCase()} ${isFirstUser ? '(System Administrator)' : ''}
- Storage Allocated: ${(user.storageQuotaBytes / (1024 * 1024 * 1024)).toFixed(0)} GB
- Security: Salted SHA-256 Key Encryption

Keep your credentials safe. Only your Email ID and Password can unlock your personal world of storage.`;

    db.createFile(user.id, {
      name: 'Welcome Guide.txt',
      mimeType: 'text/plain',
      category: 'document',
      size: Buffer.byteLength(welcomeText, 'utf8'),
      parentFolderId: null,
      contentDataUrl: `data:text/plain;base64,${Buffer.from(welcomeText).toString('base64')}`,
    });

    db.createFolder(user.id, 'My Documents', null, '#3b82f6');
  } catch (err) {
    console.error('Error seeding default items:', err);
  }

  resetRateLimit(clientIp);
  const token = db.createSession(user.id);

  db.addLog({
    userId: user.id,
    username: user.username,
    ip: clientIp,
    eventType: 'USER_CREATED',
    details: `Created new data space '${user.username}' (${user.email}). Assigned Role: ${role.toUpperCase()}.`,
    level: 'info',
  });

  const { secretCodeHash, ...userClean } = user;
  return res.status(201).json({ token, user: userClean });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, secretCode } = req.body;
  const clientIp = getClientIp(req);

  const cleanEmail = (email || '').toString().trim();
  const cleanPass = (password || secretCode || '').toString().trim();

  if (!cleanEmail && !secretCode) {
    return res.status(400).json({ message: 'Email ID and Password are required.', invalidCredentials: true });
  }

  // If no users exist in system yet, auto-provision the first user as Admin!
  const allUsers = db.getAllUsers();
  if (allUsers.length === 0 && cleanEmail && cleanPass) {
    const defaultUsername = cleanEmail.split('@')[0] || 'System Admin';
    const { user: firstAdmin } = db.createUser({
      username: defaultUsername,
      email: cleanEmail,
      secretCode: cleanPass,
      role: 'admin',
      storageQuotaBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    });

    try {
      const welcomeText = `Welcome to OWN WORLD Data Space, ${firstAdmin.username}!

Your private cloud storage vault is officially active.
- Registered Email: ${firstAdmin.email}
- Access Role: ADMIN (System Administrator)
- Storage Allocated: 100 GB
- Security: Salted SHA-256 Key Encryption

Keep your credentials safe. Only your Email ID and Password can unlock your personal world of storage.`;

      db.createFile(firstAdmin.id, {
        name: 'Welcome Guide.txt',
        mimeType: 'text/plain',
        category: 'document',
        size: Buffer.byteLength(welcomeText, 'utf8'),
        parentFolderId: null,
        contentDataUrl: `data:text/plain;base64,${Buffer.from(welcomeText).toString('base64')}`,
      });

      db.createFolder(firstAdmin.id, 'My Documents', null, '#3b82f6');
    } catch (err) {
      console.error('Error seeding default items for first admin:', err);
    }

    resetRateLimit(clientIp);
    const token = db.createSession(firstAdmin.id);

    db.addLog({
      userId: firstAdmin.id,
      username: firstAdmin.username,
      ip: clientIp,
      eventType: 'USER_CREATED',
      details: `First user '${firstAdmin.username}' (${firstAdmin.email}) logged in and was assigned System Administrator role.`,
      level: 'info',
    });

    const { secretCodeHash, ...userClean } = firstAdmin;
    return res.status(200).json({ token, user: userClean });
  }

  // 1. Check Rate Limiter
  const rateLimitStatus = checkRateLimit(clientIp);
  if (!rateLimitStatus.allowed) {
    db.addLog({
      ip: clientIp,
      eventType: 'RATE_LIMITED',
      details: `Rate limit triggered on IP ${clientIp}. Locked out for ${rateLimitStatus.remainingLockoutSec} seconds.`,
      level: 'danger',
    });
    return res.status(429).json({
      message: `Too many failed attempts. Login locked for ${rateLimitStatus.remainingLockoutSec} seconds.`,
      remainingLockoutSec: rateLimitStatus.remainingLockoutSec,
    });
  }

  // 2. Validate Credentials
  let user = null;
  if (cleanEmail && cleanPass) {
    user = db.getUserByEmailAndPassword(cleanEmail, cleanPass);
  } else if (cleanPass) {
    user = db.getUserBySecretCode(cleanPass);
  }

  if (!user) {
    const failedResult = recordFailedAttempt(clientIp);
    db.addLog({
      ip: clientIp,
      eventType: 'LOGIN_FAILED',
      details: `Failed login attempt for '${cleanEmail || secretCode}' from IP ${clientIp}.`,
      level: 'warning',
    });

    if (failedResult.locked) {
      return res.status(429).json({
        message: `Multiple failed login attempts. Access temporarily locked for 60 seconds.`,
        remainingLockoutSec: 60,
      });
    }

    return res.status(401).json({
      message: 'Wrong Credentials! The Email ID or Password you entered is incorrect.',
      invalidCredentials: true,
      attemptsLeft: checkRateLimit(clientIp).attemptsLeft,
    });
  }

  // 3. Success
  resetRateLimit(clientIp);
  const token = db.createSession(user.id);

  db.addLog({
    userId: user.id,
    username: user.username,
    ip: clientIp,
    eventType: 'LOGIN_SUCCESS',
    details: `User '${user.username}' (${user.email}) logged in successfully.`,
    level: 'info',
  });

  const { secretCodeHash, ...userClean } = user;
  return res.json({ token, user: userClean });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const { secretCodeHash, ...userClean } = req.user;
  res.json({ user: userClean });
});

app.post('/api/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.substring(7);
    db.invalidateSession(token);
  }
  res.json({ success: true, message: 'Vault locked successfully.' });
});

// --------------------------------------------------
// VAULT FILES & FOLDERS API
// --------------------------------------------------

app.get('/api/vault/files', requireAuth, (req: AuthRequest, res: Response) => {
  const folderId = req.query.folderId !== undefined ? (req.query.folderId === 'null' ? null : String(req.query.folderId)) : undefined;
  const category = req.query.category ? String(req.query.category) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;
  const starredOnly = req.query.starred === 'true';
  const trashOnly = req.query.trash === 'true';

  const files = db.getUserFiles(req.user.id, { folderId, category, search, starredOnly, trashOnly });
  const folders = db.getUserFolders(req.user.id, { parentFolderId: folderId, trashOnly, starredOnly });

  res.json({ files, folders });
});

app.post('/api/vault/files/upload', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, mimeType, category, size, parentFolderId, contentDataUrl } = req.body;

    if (!name || !category || size === undefined || !contentDataUrl) {
      return res.status(400).json({ message: 'Missing file upload details.' });
    }

    const file = db.createFile(req.user.id, {
      name,
      mimeType: mimeType || 'application/octet-stream',
      category,
      size: Number(size),
      parentFolderId: parentFolderId || null,
      contentDataUrl,
    });

    db.addLog({
      userId: req.user.id,
      username: req.user.username,
      ip: getClientIp(req),
      eventType: 'FILE_UPLOAD',
      details: `Uploaded file '${file.name}' (${(file.size / 1024).toFixed(1)} KB) to vault.`,
      level: 'info',
    });

    res.status(201).json({ file });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Upload failed.' });
  }
});

app.post('/api/vault/folders', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, parentFolderId, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required.' });
    }

    const folder = db.createFolder(req.user.id, name, parentFolderId || null, color);

    db.addLog({
      userId: req.user.id,
      username: req.user.username,
      ip: getClientIp(req),
      eventType: 'FOLDER_CREATE',
      details: `Created folder '${folder.name}' in vault.`,
      level: 'info',
    });

    res.status(201).json({ folder });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Folder creation failed.' });
  }
});

app.patch('/api/vault/files/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.id;
    const updates = req.body;
    const file = db.updateFile(req.user.id, fileId, updates);

    res.json({ file });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to update file.' });
  }
});

app.patch('/api/vault/folders/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const folderId = req.params.id;
    const updates = req.body;
    const folder = db.updateFolder(req.user.id, folderId, updates);

    res.json({ folder });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to update folder.' });
  }
});

app.delete('/api/vault/files/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.id;
    db.deleteFilePermanently(req.user.id, fileId);

    db.addLog({
      userId: req.user.id,
      username: req.user.username,
      ip: getClientIp(req),
      eventType: 'FILE_DELETE',
      details: `Permanently deleted file from vault.`,
      level: 'info',
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to delete file.' });
  }
});

app.delete('/api/vault/folders/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const folderId = req.params.id;
    db.deleteFolderPermanently(req.user.id, folderId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to delete folder.' });
  }
});

app.delete('/api/vault/trash', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    db.emptyTrash(req.user.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to empty trash.' });
  }
});

app.get('/api/vault/storage-usage', requireAuth, (req: AuthRequest, res: Response) => {
  const breakdown = db.getStorageBreakdown(req.user.id);
  res.json(breakdown);
});

// --------------------------------------------------
// ADMIN API (SECRET HIDDEN PANEL)
// --------------------------------------------------

app.get('/api/admin/users', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getAllUsers().map(({ secretCodeHash, ...u }) => u);
  res.json({ users });
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { username, email, secretCode, role, storageQuotaGb, storageQuotaMb } = req.body;
    if (!username || !secretCode) {
      return res.status(400).json({ message: 'Username and Secret Code / Password are required.' });
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim() : `${username.toLowerCase().replace(/\s+/g, '')}@ownworld.com`;
    const quotaBytes = (Number(storageQuotaGb) || Number(storageQuotaMb) || 10) * 1024 * 1024 * 1024;
    
    const { user, secretCode: code } = db.createUser({
      username: username.trim(),
      email: cleanEmail,
      secretCode: secretCode.trim(),
      role: role || 'user',
      storageQuotaBytes: quotaBytes,
    });

    db.addLog({
      userId: req.user.id,
      username: req.user.username,
      ip: getClientIp(req),
      eventType: 'USER_CREATED',
      details: `Admin created new vault user '${user.username}' (${user.email}, ${user.role}).`,
      level: 'info',
    });

    const { secretCodeHash, ...userClean } = user;
    res.status(201).json({ user: userClean });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create user.' });
  }
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { newSecretCode, role, status, storageQuotaMb } = req.body;

    if (newSecretCode) {
      db.resetUserSecretCode(targetUserId, newSecretCode);
      db.addLog({
        userId: req.user.id,
        username: req.user.username,
        ip: getClientIp(req),
        eventType: 'CODE_RESET',
        details: `Admin reset Secret Code for user ID '${targetUserId}'.`,
        level: 'warning',
      });
    }

    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (req.body.storageQuotaGb !== undefined) {
      updates.storageQuotaBytes = Number(req.body.storageQuotaGb) * 1024 * 1024 * 1024;
    } else if (req.body.storageQuotaMb !== undefined) {
      updates.storageQuotaBytes = Number(req.body.storageQuotaMb) * 1024 * 1024;
    } else if (req.body.storageQuotaBytes !== undefined) {
      updates.storageQuotaBytes = Number(req.body.storageQuotaBytes);
    }

    const updatedUser = db.updateUser(targetUserId, updates);
    const { secretCodeHash, ...userClean } = updatedUser;

    res.json({ user: userClean });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to update user.' });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    db.deleteUser(targetUserId);

    db.addLog({
      userId: req.user.id,
      username: req.user.username,
      ip: getClientIp(req),
      eventType: 'USER_DELETED',
      details: `Admin deleted user vault '${targetUserId}'.`,
      level: 'danger',
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to delete user.' });
  }
});

app.get('/api/admin/logs', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const logs = db.getLogs();
  res.json({ logs });
});

app.get('/api/admin/stats', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const stats = db.getSystemStats();
  res.json({ stats });
});

// --------------------------------------------------
// VITE MIDDLEWARE & SERVER LAUNCH
// --------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).send('Error serving application');
        }
      });
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error', error: err.message || 'Unknown error' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OWN WORLD Cloud Vault Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
