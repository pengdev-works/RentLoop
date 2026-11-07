import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  Layers,
  FileCheck,
  Search,
  Check,
  X,
  ExternalLink,
  History,
  Lock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'verifications' | 'users' | 'reports' | 'rentals' | 'logs'

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

      setStats(statsData.metrics);
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

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change this user status to ${nextStatus}?`)) return;
    try {
      await api.updateUserStatus(user.id, { status: nextStatus });
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
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
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
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
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
      </div>
    );
  }

  const metrics = stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Admin Control Room</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized governance: review identity verifications, moderate users, investigate disputes, and review tamper-evident audit logs.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* METRIC OVERVIEW CARDS (Live database records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Users</span>
          <p className="text-xl font-black text-slate-900">{metrics.totalUsers || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Verified Users</span>
          <p className="text-xl font-black text-emerald-700">{metrics.totalVerified || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Pending IDs</span>
          <p className="text-xl font-black text-amber-700">{metrics.pendingVerifications || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Items</span>
          <p className="text-xl font-black text-slate-900">{metrics.availableItems || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">Active Rentals</span>
          <p className="text-xl font-black text-teal-700">{metrics.activeRentals || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Open Concerns</span>
          <p className="text-xl font-black text-rose-700">{metrics.pendingReports || 0}</p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Recent Activity & Summary
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'verifications'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Identity Verification Desk</span>
          {metrics.pendingVerifications > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {metrics.pendingVerifications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Disputes & Reports</span>
          {metrics.pendingReports > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {metrics.pendingReports}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rentals')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'rentals'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Rental Transactions ({rentals.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Logs
        </button>

      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Pending Verifications Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Queued Identity Reviews</h3>
              <button onClick={() => setActiveTab('verifications')} className="text-xs text-indigo-600 font-semibold">
                View All Desk
              </button>
            </div>

            {verifications.filter(v => v.status === 'pending').length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No identity submissions waiting for review.</p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-3">
                {verifications.filter(v => v.status === 'pending').slice(0, 3).map(v => (
                  <div key={v.id} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{v.user?.fullName}</h4>
                      <p className="text-[11px] text-slate-500">{v.id_type.toUpperCase()} • {v.id_number}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVerif(v);
                        setActiveTab('verifications');
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Logs Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tamper-Evident System Audit Trail</h3>
              <button onClick={() => setActiveTab('logs')} className="text-xs text-indigo-600 font-semibold">
                Full Logs
              </button>
            </div>

            <div className="divide-y divide-slate-100 space-y-2 text-xs">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <span className="text-[11px] text-slate-400">
                      by {log.actorName} • {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {log.target_entity}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB: IDENTITY VERIFICATION DESK */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Queued & Processed Identification Submissions</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">ID Type & Number</th>
                  <th className="px-6 py-3">Submitted At</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{v.user?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{v.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {v.id_type} / {v.id_number}
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
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Inspect Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">All Registered Accounts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">User Details</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Verification</th>
                  <th className="px-6 py-3">Account Status</th>
                  <th className="px-6 py-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={u.verificationStatus} size="xs" />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DISPUTES & REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">User Concern & Dispute Tickets</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Reporter</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
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
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg"
                      >
                        Resolve Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ALL RENTALS */}
      {activeTab === 'rentals' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Comprehensive Platform Rental Records</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Renter</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentals.map((r) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">System Security Audit Logs</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-900">{log.action}</td>
                    <td className="px-6 py-3 text-indigo-700">{log.actorName}</td>
                    <td className="px-6 py-3 text-slate-600">{log.target_entity}</td>
                    <td className="px-6 py-3 text-slate-500 max-w-sm truncate">{log.details_json}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                placeholder="e.g. Photo blurry or ID expired."
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
                onClick={() => handleResolveReport('dismissed')}
                disabled={processingReport}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
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

