import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  Layers,
  Search,
  ExternalLink,
  History,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Database,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';
import { toastOk, toastErr, confirmDanger } from '../utils/swal';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'verifications' | 'users' | 'reports' | 'rentals' | 'logs'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Verification Review Modal
  const [selectedVerif, setSelectedVerif] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingVerif, setProcessingVerif] = useState(false);

  // Report Resolution Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingReport, setProcessingReport] = useState(false);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, verifsData, rentalsData, reportsData, logsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminVerifications(),
        api.getAdminRentals(),
        api.getAdminReports(),
        api.getAdminAuditLogs()
      ]);

      setStats(statsData?.metrics || {});
      setUsers(usersData || []);
      setVerifications(verifsData || []);
      setRentals(rentalsData || []);
      setReports(reportsData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const isConfirmed = await confirmDanger(
      `Change user status to ${nextStatus}?`,
      `Account: ${targetUser.fullName || targetUser.email}`,
      `Yes, Set to ${nextStatus}`
    );
    if (!isConfirmed) return;
    try {
      await api.updateUserStatus(targetUser.id, { status: nextStatus });
      toastOk(`User status set to ${nextStatus}.`);
      await loadAllAdminData();
    } catch (err) {
      toastErr(err.message || 'Failed to update user status.');
    }
  };

  const handleReviewVerification = async (status) => {
    if (!selectedVerif) return;
    setProcessingVerif(true);
    try {
      await api.reviewVerification(selectedVerif.id, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined
      });
      setSelectedVerif(null);
      setRejectionReason('');
      toastOk(`Verification document ${status}.`);
      await loadAllAdminData();
    } catch (err) {
      toastErr(err.message || 'Failed to review verification.');
    } finally {
      setProcessingVerif(false);
    }
  };

  const handleResolveReport = async (status) => {
    if (!selectedReport) return;
    setProcessingReport(true);
    try {
      await api.resolveAdminReport(selectedReport.id, {
        status,
        adminNotes: adminNotes || undefined
      });
      setSelectedReport(null);
      setAdminNotes('');
      toastOk(`Report marked as ${status}.`);
      await loadAllAdminData();
    } catch (err) {
      toastErr(err.message || 'Failed to resolve report.');
    } finally {
      setProcessingReport(false);
    }
  };

  const handleLogout = () => {
    logout();
    toastOk('Signed out of Admin Console.');
    navigate('/login');
  };

  const metrics = stats || {};

  const navItems = [
    {
      id: 'overview',
      label: 'Activity & Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'verifications',
      label: 'Identity Verification Desk',
      icon: ShieldCheck,
      badge: metrics.pendingVerifications > 0 ? metrics.pendingVerifications : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      badge: users.length > 0 ? users.length : null,
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    {
      id: 'reports',
      label: 'Disputes & Reports',
      icon: AlertTriangle,
      badge: metrics.pendingReports > 0 ? metrics.pendingReports : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'rentals',
      label: 'All Rental Transactions',
      icon: Layers,
      badge: rentals.length > 0 ? rentals.length : null,
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    {
      id: 'logs',
      label: 'System Audit Logs',
      icon: History,
      badge: auditLogs.length > 0 ? auditLogs.length : null,
      badgeColor: 'bg-slate-800 text-slate-300'
    }
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100/80 flex text-slate-800 font-sans antialiased overflow-hidden relative">
      
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* 1. ENTERPRISE TRUE FULL-HEIGHT SIDEBAR                    */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 h-screen border-r border-slate-800/90 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* TOP BRANDING & NAVIGATION */}
        <div className="flex flex-col min-h-0 flex-1">
          
          {/* Logo & Platform Info Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0">
                <img
                  src="/rentloop-logo.png"
                  alt="RentLoop Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-indigo-400 font-black text-sm">RL</span>';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-tight">RentLoop</span>
                  <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">Trust & Safety Suite</p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List with Scroll if needed */}
          <div className="p-3 space-y-6 flex-1 overflow-y-auto">
            <div>
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">
                Administration
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-indigo-700 text-white'
                              : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

          </div>
        </div>

        {/* BOTTOM: MARKETPLACE LINK & ADMIN PROFILE */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Marketplace</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'RentLoop Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@rentloop.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out of Admin Session"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE AREA                                    */}
      {/* ========================================================= */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        
        {/* TOP WORKSPACE BAR */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs min-w-0">
            {/* Hamburger Trigger for Mobile */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 transition-colors"
              title="Open Admin Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Shield className="w-4 h-4 text-indigo-600 shrink-0 hidden sm:block" />
            <span className="font-semibold text-slate-400 hidden sm:inline truncate">Admin Room</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-bold text-slate-900 truncate">{currentNav.label}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Refresh Metrics</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/60 rounded-xl transition-colors"
            >
              <span className="hidden sm:inline">View Storefront</span>
              <span className="sm:hidden">Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full">
          
          {/* KPI CARDS (Live database figures) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Users</span>
              <p className="text-2xl font-black text-slate-900">{metrics.totalUsers ?? users.length}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Verified Users</span>
              <p className="text-2xl font-black text-emerald-700">{metrics.totalVerified ?? 0}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Pending IDs</span>
              <p className="text-2xl font-black text-amber-700">{metrics.pendingVerifications ?? 0}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Items</span>
              <p className="text-2xl font-black text-slate-900">{metrics.availableItems ?? 0}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">Active Rentals</span>
              <p className="text-2xl font-black text-teal-700">{metrics.activeRentals ?? 0}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Open Concerns</span>
              <p className="text-2xl font-black text-rose-700">{metrics.pendingReports ?? 0}</p>
            </div>

          </div>

          {/* ======================================================= */}
          {/* TAB 1: OVERVIEW & RECENT ACTIVITY                       */}
          {/* ======================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Quick Queued ID Verification Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Queued Identity Reviews</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('verifications')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View All Desk →
                    </button>
                  </div>

                  {verifications.filter((v) => v.status === 'pending').length === 0 ? (
                    <div className="text-center py-10 space-y-1">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-800">All caught up!</p>
                      <p className="text-[11px] text-slate-400">No identity submissions waiting for review.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 space-y-3">
                      {verifications
                        .filter((v) => v.status === 'pending')
                        .slice(0, 4)
                        .map((v) => (
                          <div key={v.id} className="pt-3 first:pt-0 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{v.user?.fullName}</h4>
                              <p className="text-[11px] text-slate-500">{v.id_type?.toUpperCase()} • {v.id_number}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedVerif(v);
                                setActiveTab('verifications');
                              }}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Tamper-Evident System Audit Trail Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Tamper-Evident System Audit Trail</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Full Logs →
                    </button>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="text-center py-10 space-y-1">
                      <p className="text-xs font-bold text-slate-800">No audit events recorded yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 space-y-2 text-xs">
                      {auditLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{log.action}</span>
                            <span className="text-[11px] text-slate-400">
                              by {log.actorName} • {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                            {log.target_entity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: IDENTITY VERIFICATION DESK                       */}
          {/* ======================================================= */}
          {activeTab === 'verifications' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Identity Verification Review Desk</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect Philippine Government IDs (PhilSys, Driver's License, Passport, UMID, Postal, PRC) and grant verified status.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {verifications.filter((v) => v.status === 'pending').length} Pending Review
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Applicant</th>
                      <th className="px-6 py-3.5">ID Type & Document #</th>
                      <th className="px-6 py-3.5">Submitted At</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                          No identity verification records found.
                        </td>
                      </tr>
                    ) : (
                      verifications.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{v.user?.fullName}</div>
                            <div className="text-[11px] text-slate-400">{v.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-700">
                            {v.id_type?.toUpperCase()} / {v.id_number}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(v.submitted_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill status={v.status} size="xs" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedVerif(v)}
                              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                            >
                              Inspect Documents
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: USER MANAGEMENT                                  */}
          {/* ======================================================= */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">User Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage accounts, inspect verification status, and toggle suspensions.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Verification</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                          No users matched your query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill status={u.verificationStatus} size="xs" />
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                  u.status === 'active'
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: DISPUTES & REPORTS                               */}
          {/* ======================================================= */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">User Concern & Dispute Tickets</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Investigate reported issues, damage claims, and agreement breaches.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Reporter</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                          No open dispute or concern tickets.
                        </td>
                      </tr>
                    ) : (
                      reports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{rep.reporterName}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-100">
                              {rep.report_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{rep.description}</td>
                          <td className="px-6 py-4">
                            <StatusPill status={rep.status} size="xs" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedReport(rep)}
                              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                            >
                              Resolve Ticket
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: ALL RENTALS                                      */}
          {/* ======================================================= */}
          {activeTab === 'rentals' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Comprehensive Platform Rental Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track every item reservation, active rental, and returned transaction.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Item</th>
                      <th className="px-6 py-3.5">Renter</th>
                      <th className="px-6 py-3.5">Owner</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Amount (PHP)</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                          No rental records yet.
                        </td>
                      </tr>
                    ) : (
                      rentals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{r.itemTitle}</td>
                          <td className="px-6 py-4 text-slate-600">{r.renterName}</td>
                          <td className="px-6 py-4 text-slate-600">{r.ownerName}</td>
                          <td className="px-6 py-4 text-slate-500">{r.start_date} to {r.end_date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">₱{r.total_amount}</td>
                          <td className="px-6 py-4">
                            <StatusPill status={r.status} size="xs" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 6: AUDIT LOGS                                       */}
          {/* ======================================================= */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">System Security Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tamper-evident chronological trail of administrative and user security events.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Action</th>
                      <th className="px-6 py-3.5">Actor</th>
                      <th className="px-6 py-3.5">Target</th>
                      <th className="px-6 py-3.5">Payload Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">{log.action}</td>
                          <td className="px-6 py-3.5 text-indigo-700">{log.actorName}</td>
                          <td className="px-6 py-3.5 text-slate-600">{log.target_entity}</td>
                          <td className="px-6 py-3.5 text-slate-500 max-w-sm truncate">{log.details_json}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MODALS                                                 */}
      {/* ========================================================= */}

      {/* VERIFICATION REVIEW MODAL */}
      <Modal
        isOpen={!!selectedVerif}
        onClose={() => setSelectedVerif(null)}
        title="Inspect Government Identity Submission"
        maxWidth="max-w-2xl"
      >
        {selectedVerif && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant</span>
                <strong className="text-slate-900 text-sm">{selectedVerif.user?.fullName}</strong>
                <p className="text-slate-500">{selectedVerif.user?.email}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Document</span>
                <span className="font-bold text-slate-900 uppercase">{selectedVerif.id_type}</span>
                <p className="font-mono text-slate-600">{selectedVerif.id_number}</p>
              </div>
            </div>

            {/* Document Photos */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700">Uploaded Document Evidence:</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Front ID Photo</span>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={selectedVerif.front_image_url} alt="Front ID" className="w-full h-full object-cover" />
                  </div>
                </div>

                {selectedVerif.selfie_image_url && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Biometric Verification Selfie</span>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={selectedVerif.selfie_image_url} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection reason input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Note (If declining)</label>
              <input
                type="text"
                placeholder="e.g. Photo blurry, name mismatch, or ID expired."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVerif(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                disabled={processingVerif}
                onClick={() => handleReviewVerification('rejected')}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200"
              >
                Reject Documents
              </button>
              <button
                type="button"
                disabled={processingVerif}
                onClick={() => handleReviewVerification('verified')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Approve & Grant Verified Badge
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESOLVE REPORT MODAL */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Resolve Reported Concern Ticket"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">{selectedReport.report_type}</span>
                <span className="text-slate-400">Filed by: {selectedReport.reporterName}</span>
              </div>
              <p className="text-slate-600">{selectedReport.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Investigation Notes</label>
              <textarea
                rows={3}
                placeholder="Document resolution findings or actions taken..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveReport('dismissed')}
                disabled={processingReport}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolveReport('resolved')}
                disabled={processingReport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
