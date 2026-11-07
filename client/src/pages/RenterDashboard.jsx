import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { StatusPill } from '../components/common/StatusPill';

export function RenterDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'requests' | 'history'

  useEffect(() => {
    async function fetchRenterData() {
      try {
        const data = await api.getRenterRequests();
        setRequests(data || []);
      } catch (err) {
        console.error('Failed to load renter requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRenterData();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this rental request?')) return;
    try {
      await api.cancelRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  const activeRentals = requests.filter(r => r.rental && ['ready_for_pickup', 'active', 'return_pending'].includes(r.rental.status));
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRentals = requests.filter(r => r.rental && r.rental.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Renter Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor your rental inquiries, active items, condition signoffs, and returned transactions.
          </p>
        </div>

        <Link
          to="/items"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Find More Items to Rent</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Active & Ready Rentals</span>
          <p className="text-2xl font-black text-slate-900">{activeRentals.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
          <p className="text-2xl font-black text-slate-900">{pendingRequests.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Completed Rentals</span>
          <p className="text-2xl font-black text-slate-900">{completedRentals.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active & Ready ({activeRentals.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Sent Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed History ({completedRentals.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE & READY RENTALS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeRentals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No active rentals right now</h3>
              <p className="text-xs text-slate-500 mt-1">Browse items to send a booking request.</p>
            </div>
          ) : (
            activeRentals.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={r.item?.primaryImage || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=200&q=80'}
                    alt={r.item?.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{r.item?.title}</h3>
                      <StatusPill status={r.rental.status} size="xs" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Owner: <strong>{r.owner?.fullName}</strong> ({r.owner?.phone || r.owner?.email})
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {r.start_date} to {r.end_date}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-900">${r.calculated_price}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center justify-end">
                  <Link
                    to={`/rentals/${r.rental.id}`}
                    className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Rental Hub & Condition Signoff</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SENT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                You haven't sent any rental requests yet.
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{r.item?.title}</h4>
                      <StatusPill status={r.status} size="xs" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Requested: {r.start_date} to {r.end_date} • Total: ${r.calculated_price}
                    </p>
                    <p className="text-xs text-slate-600 italic">"{r.rental_purpose}"</p>
                    {r.rejection_reason && (
                      <p className="text-xs text-rose-600 font-medium">Rejection Reason: {r.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {r.rental && (
                      <Link
                        to={`/rentals/${r.rental.id}`}
                        className="px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs rounded-xl transition-colors"
                      >
                        Open Rental Hub
                      </Link>
                    )}
                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(r.id)}
                        className="px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMPLETED HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {completedRentals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No completed rentals yet</h3>
            </div>
          ) : (
            completedRentals.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{r.item?.title}</h3>
                    <StatusPill status="completed" size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Returned on: {new Date(r.rental.returned_date || r.rental.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  to={`/rentals/${r.rental.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  View Details & Reviews
                </Link>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
