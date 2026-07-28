import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Shield, 
  Terminal, 
  Key, 
  HardDrive, 
  AlertTriangle, 
  UserPlus, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  Activity, 
  Copy,
  Lock,
  Search,
  Database,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { User, AuditLog, SystemStats } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  isDarkMode: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  token,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals inside admin
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSecretCode, setNewSecretCode] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newQuotaGb, setNewQuotaGb] = useState(10);
  const [addUserError, setAddUserError] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Search filter
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Storage Quota Modal
  const [quotaModalUser, setQuotaModalUser] = useState<User | null>(null);
  const [customQuotaGb, setCustomQuotaGb] = useState<number>(100);

  const [resetCodeUserId, setResetCodeUserId] = useState<string | null>(null);
  const [resetCodeValue, setResetCodeValue] = useState('');
  const [resetCodeShow, setResetCodeShow] = useState(true);
  const [resetCodeStatus, setResetCodeStatus] = useState('');

  const [revealedCodeMap, setRevealedCodeMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUsers(data.users || []);
      } else if (activeTab === 'storage') {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/admin/logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    if (!newUsername.trim() || !newSecretCode.trim() || !newEmail.trim()) {
      setAddUserError('Display Name, Email ID, and Password are all required.');
      return;
    }

    setAddUserLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          secretCode: newSecretCode.trim(),
          role: newRole,
          storageQuotaGb: newQuotaGb,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddUser(false);
        setNewUsername('');
        setNewEmail('');
        setNewSecretCode('');
        setAddUserError('');
        fetchAdminData();
      } else {
        setAddUserError(data.message || 'Failed to create user space.');
      }
    } catch (err: any) {
      setAddUserError(err.message || 'Network error occurred while creating user space.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleUpdateStorageQuota = async (userId: string, quotaGb: number) => {
    if (quotaGb <= 0) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storageQuotaGb: quotaGb }),
      });

      if (res.ok) {
        setQuotaModalUser(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetCode = async (userId: string) => {
    if (!resetCodeValue.trim()) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newSecretCode: resetCodeValue.trim() }),
      });

      if (res.ok) {
        setResetCodeUserId(null);
        setResetCodeValue('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user vault and all their files?')) return;
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      
      <div className={`w-full max-w-5xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden relative ${
        isDarkMode ? 'glass-panel text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>OWN WORLD</span>
                <span className="text-purple-400 font-mono text-xs font-semibold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  System Admin Operations Panel
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Manage user data spaces, expand storage allocation freely, inspect system logs.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Spaces & Storage Quotas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'storage'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Global Storage & Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security Audit Logs</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB 1: USERS & STORAGE QUOTAS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users by Email ID, Display Name, or Role..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <p className="text-xs text-slate-400 font-medium">
                    Showing <span className="font-bold text-white font-mono">{
                      users.filter((u) => {
                        const q = userSearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.username?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.id?.toLowerCase().includes(q) ||
                          u.role?.toLowerCase().includes(q)
                        );
                      }).length
                    }</span> of <span className="font-bold text-slate-300 font-mono">{users.length}</span> Users
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddUserError('');
                      setShowAddUser(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create User Space</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">User & Email ID</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Password / Secret Key</th>
                      <th className="p-3">Storage Allocation</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users
                      .filter((u) => {
                        const q = userSearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.username?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.id?.toLowerCase().includes(q) ||
                          u.role?.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {u.createdAt && (
                                <span className="text-[9px] font-mono text-slate-500 font-normal">
                                  ({new Date(u.createdAt).toLocaleDateString()})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-blue-400 font-mono select-all mt-0.5">{u.email || `${u.username.toLowerCase()}@ownworld.com`}</p>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-300 font-semibold">{revealedCodeMap[u.id] ? (u.secretCodeDisplay || '••••••••') : u.secretCodeMasked}</span>
                              <button
                                type="button"
                                onClick={() => setRevealedCodeMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                                className="text-slate-500 hover:text-slate-300 p-1"
                                title={revealedCodeMap[u.id] ? 'Hide Password' : 'Show Password'}
                              >
                                {revealedCodeMap[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span>{formatSize(u.storageUsedBytes)} / <strong className="text-emerald-400 font-bold">{formatSize(u.storageQuotaBytes)}</strong></span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuotaModalUser(u);
                                  setCustomQuotaGb(Math.max(1, Math.round(u.storageQuotaBytes / (1024 * 1024 * 1024))));
                                }}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30 transition-all"
                                title="Expand or edit storage capacity"
                              >
                                <Database className="w-3 h-3" />
                                <span>Expand</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                u.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {u.status}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setResetCodeUserId(u.id);
                                  setResetCodeValue(u.secretCodeDisplay || '');
                                  setResetCodeStatus('');
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1 border border-amber-500/20"
                                title="Change or Reset User Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Change Password</span>
                              </button>
                              {u.role !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                  title="Delete User Vault"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {users.filter((u) => {
                      const q = userSearchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        u.username?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.id?.toLowerCase().includes(q) ||
                        u.role?.toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          No users found matching query "{userSearchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE & STATS */}
          {activeTab === 'storage' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total System Storage</span>
                  <p className="text-lg font-bold font-mono text-purple-400 mt-1">{formatSize(stats.totalStorageUsed)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Quota: {formatSize(stats.totalSystemQuota)}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Files Stored</span>
                  <p className="text-lg font-bold font-mono text-blue-400 mt-1">{stats.totalFiles}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Across {stats.totalFolders} Folders</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Active Vault Users</span>
                  <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{stats.activeVaultsCount}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Total Users: {stats.totalUsers}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Failed Login Alerts</span>
                  <p className="text-lg font-bold font-mono text-amber-400 mt-1">{stats.failedLoginsToday}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Rate Limited Events</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">Real-time security event tracking and rate limit logs.</p>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">User / IP</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.level === 'danger'
                              ? 'bg-rose-500/20 text-rose-300'
                              : log.level === 'warning'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{log.username || 'ANONYMOUS'} ({log.ip})</td>
                        <td className="p-3 text-slate-400 max-w-md truncate">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: INCREASE / EDIT STORAGE QUOTA */}
      {quotaModalUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-emerald-400 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Expand User Storage Space</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuotaModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Adjust storage space for <strong className="text-white">{quotaModalUser.username}</strong> ({quotaModalUser.email}). As System Admin, you can increase this as much as you want!
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Custom Storage Capacity (GB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customQuotaGb}
                    onChange={(e) => setCustomQuotaGb(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-emerald-400 font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400">GB</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Capacity Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 50, 100, 500, 1000, 10000].map((gb) => (
                    <button
                      key={gb}
                      type="button"
                      onClick={() => setCustomQuotaGb(gb)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold font-mono border transition-all ${
                        customQuotaGb === gb
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                      }`}
                    >
                      {gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuotaModalUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStorageQuota(quotaModalUser.id, customQuotaGb)}
                  className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Save Storage Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showAddUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> Create New User Space
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddUser(false);
                  setAddUserError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addUserError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name / Full Name</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email ID</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role Permission</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Quota (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuotaGb}
                    onChange={(e) => setNewQuotaGb(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password / Secret Key</label>
                <input
                  type="text"
                  value={newSecretCode}
                  onChange={(e) => setNewSecretCode(e.target.value)}
                  placeholder="e.g. SARAH2026!#"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setAddUserError('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  {addUserLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Space...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create User Space</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetCodeUserId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Change User Password
              </h3>
              <button
                type="button"
                onClick={() => setResetCodeUserId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {users.find((u) => u.id === resetCodeUserId) && (
              <p className="text-xs text-slate-300 mb-4">
                Updating password for user <strong className="text-white">{users.find((u) => u.id === resetCodeUserId)?.username}</strong> ({users.find((u) => u.id === resetCodeUserId)?.email}).
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password / Secret Key</label>
                <div className="relative">
                  <input
                    type={resetCodeShow ? 'text' : 'password'}
                    value={resetCodeValue}
                    onChange={(e) => setResetCodeValue(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setResetCodeShow(!resetCodeShow)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {resetCodeShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetCodeUserId(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResetCode(resetCodeUserId)}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
