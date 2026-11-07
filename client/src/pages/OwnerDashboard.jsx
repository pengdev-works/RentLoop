import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  PlusCircle,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  Tag,
  Star,
  ShieldCheck,
  ArrowRight,
  Edit,
  Archive,
  Image,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';

export function OwnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [myItems, setMyItems] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'listings' | 'rentals'

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'new');
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: 'like_new',
    rentalPrice: '',
    priceBasis: 'daily',
    securityDeposit: '0',
    locationCity: '',
    locationPickupNotes: '',
    rentalRules: '',
    imageUrls: ['']
  });
  const [submittingItem, setSubmittingItem] = useState(false);
  const [itemError, setItemError] = useState('');

  // Reject Request Modal
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    try {
      const [items, requests, cats] = await Promise.all([
        api.getMyItems(),
        api.getOwnerRequests(),
        api.getCategories()
      ]);
      setMyItems(items || []);
      setIncomingRequests(requests || []);
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      await api.approveRequest(requestId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.rejectRequest(rejectingRequestId, rejectReason);
      setRejectingRequestId(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateItemSubmit = async (e) => {
    e.preventDefault();
    setItemError('');

    if (!newItem.title || !newItem.description || !newItem.categoryId || !newItem.rentalPrice || !newItem.locationCity) {
      setItemError('Please fill in all required listing fields.');
      return;
    }

    setSubmittingItem(true);
    try {
      const cleanUrls = newItem.imageUrls.filter(u => u && u.trim() !== '');
      await api.createItem({
        ...newItem,
        imageUrls: cleanUrls.length > 0 ? cleanUrls : undefined
      });
      setIsAddModalOpen(false);
      setNewItem({
        title: '',
        description: '',
        categoryId: categories[0]?.id || '',
        condition: 'like_new',
        rentalPrice: '',
        priceBasis: 'daily',
        securityDeposit: '0',
        locationCity: '',
        locationPickupNotes: '',
        rentalRules: '',
        imageUrls: ['']
      });
      await loadData();
    } catch (err) {
      setItemError(err.message);
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleToggleItemStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateItem(item.id, { status: nextStatus, isAvailable: nextStatus === 'active' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchiveItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to archive this item listing?')) return;
    try {
      await api.deleteItem(itemId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingRequests = incomingRequests.filter(r => r.status === 'pending');
  const activeRentals = incomingRequests.filter(r => r.rental && ['ready_for_pickup', 'active', 'return_pending'].includes(r.rental.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Item Owner Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your rentable inventory, review inquiries, and oversee handover inspections.
          </p>
        </div>

        <button
          onClick={() => {
            if (categories.length > 0 && !newItem.categoryId) {
              setNewItem(prev => ({ ...prev, categoryId: categories[0].id }));
            }
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Item Listing</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Incoming Requests Needing Action</span>
          <p className="text-2xl font-black text-slate-900">{pendingRequests.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Active & Ready Handovers</span>
          <p className="text-2xl font-black text-slate-900">{activeRentals.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Active Listings</span>
          <p className="text-2xl font-black text-slate-900">{myItems.filter(i => i.status === 'active').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Incoming Inquiries ({incomingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'listings'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Listed Items ({myItems.length})
        </button>

        <button
          onClick={() => setActiveTab('rentals')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'rentals'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Handovers ({activeRentals.length})
        </button>
      </div>

      {/* TAB 1: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No incoming rental inquiries yet</h3>
              <p className="text-xs text-slate-500 mt-1">New requests from renters will show up here.</p>
            </div>
          ) : (
            incomingRequests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{r.item?.title}</h3>
                    <StatusPill status={r.status} size="xs" />
                  </div>

                  {/* Renter Trust Overview */}
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>
                      Renter: <strong>{r.renter?.fullName}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {r.renter?.trustScore || '5.0'}
                    </span>
                    {r.renter?.isVerified && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified ID
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {r.start_date} to {r.end_date}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-900">Payout: ₱{r.calculated_price}</span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                    "{r.rental_purpose}"
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve Request</span>
                      </button>
                      <button
                        onClick={() => setRejectingRequestId(r.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {r.rental && (
                    <Link
                      to={`/rentals/${r.rental.id}`}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Open Rental Hub
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MY LISTED ITEMS */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/10] bg-slate-100">
                  <img
                    src={item.images && item.images[0]?.image_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusPill status={item.condition} size="xs" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  <div className="pt-2 flex items-baseline justify-between text-xs">
                    <span className="font-extrabold text-base text-slate-900">₱{item.rental_price} / {item.price_basis}</span>
                    <span className="text-slate-400">{item.location_city}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <button
                  onClick={() => handleToggleItemStatus(item)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  {item.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/items/${item.id}`}
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleArchiveItem(item.id)}
                    className="text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ACTIVE HANDOVERS */}
      {activeTab === 'rentals' && (
        <div className="space-y-4">
          {activeRentals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No active item handovers in progress</h3>
            </div>
          ) : (
            activeRentals.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{r.item?.title}</h3>
                    <StatusPill status={r.rental.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Renter: <strong>{r.renter?.fullName}</strong> ({r.renter?.phone || r.renter?.email})
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Scheduled Return Date: <strong>{r.end_date}</strong>
                  </p>
                </div>

                <Link
                  to={`/rentals/${r.rental.id}`}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Open Handover & Condition Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish New Rentable Item Listing"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateItemSubmit} className="space-y-4">
          {itemError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {itemError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Title / Model</label>
            <input
              type="text"
              required
              placeholder="e.g. Sony Alpha A7 IV or DeWalt 20V Cordless Hammer Drill"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newItem.categoryId}
                onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Condition</label>
              <select
                value={newItem.condition}
                onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              >
                <option value="brand_new">Brand New</option>
                <option value="like_new">Like New (Mint)</option>
                <option value="good">Good (Normal light wear)</option>
                <option value="fair">Fair (Fully functional, cosmetic signs)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rental Price (₱)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="500.00"
                value={newItem.rentalPrice}
                onChange={(e) => setNewItem({ ...newItem, rentalPrice: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price Basis</label>
              <select
                value={newItem.priceBasis}
                onChange={(e) => setNewItem({ ...newItem, priceBasis: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              >
                <option value="daily">Per Day</option>
                <option value="hourly">Per Hour</option>
                <option value="weekly">Per Week</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Security Deposit (₱)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={newItem.securityDeposit}
                onChange={(e) => setNewItem({ ...newItem, securityDeposit: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pickup City / Area</label>
            <input
              type="text"
              required
              placeholder="e.g. Quezon City, Metro Manila or Cebu City"
              value={newItem.locationCity}
              onChange={(e) => setNewItem({ ...newItem, locationCity: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe accessories included, specifications, and battery/power details..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Photo Image URL</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={newItem.imageUrls[0]}
              onChange={(e) => setNewItem({ ...newItem, imageUrls: [e.target.value] })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rental Guidelines & Restrictions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Keep inside padded case. Blow dust off before return."
              value={newItem.rentalRules}
              onChange={(e) => setNewItem({ ...newItem, rentalRules: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingItem}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {submittingItem ? 'Publishing...' : 'Publish Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* REJECT REQUEST MODAL */}
      <Modal
        isOpen={!!rejectingRequestId}
        onClose={() => setRejectingRequestId(null)}
        title="Decline Rental Request"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please share a courteous explanation with the renter explaining why you cannot accommodate this rental window.
          </p>
          <textarea
            rows={3}
            required
            placeholder="e.g. Item is scheduled for routine maintenance on those dates."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingRequestId(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Confirm Decline
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

