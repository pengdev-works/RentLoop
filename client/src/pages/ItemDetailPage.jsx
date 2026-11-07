import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Star,
  Clock,
  AlertCircle,
  FileText,
  User,
  CheckCircle,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/common/StatusPill';
import { TrustBadge } from '../components/common/TrustBadge';

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalPurpose, setRentalPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        const [itemData, bookedData] = await Promise.all([
          api.getItemById(id),
          api.getItemBookedDates(id)
        ]);
        setItem(itemData);
        setBookedDates(bookedData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
          <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Item not found</h2>
        <p className="text-xs text-slate-500 mt-2">This listing may have been archived or removed by its owner.</p>
        <Link to="/items" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl">
          Back to Listings
        </Link>
      </div>
    );
  }

  const images = item.images && item.images.length > 0 ? item.images : [{ image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80' }];

  // Calculations
  let durationDays = 0;
  let subtotal = 0;
  let totalDeposit = parseFloat(item.security_deposit || 0);

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e >= s) {
      const diff = Math.abs(e.getTime() - s.getTime());
      durationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
      subtotal = durationDays * parseFloat(item.rental_price);
    }
  }

  const isOwner = user && user.id === item.owner_id;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isOwner) {
      setBookingError('You are the owner of this item.');
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Please select both start and end rental dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setBookingError('End date must be on or after start date.');
      return;
    }

    if (!rentalPurpose.trim()) {
      setBookingError('Please explain the purpose of your rental for the item owner.');
      return;
    }

    // Check date conflicts locally
    const sTime = new Date(startDate).getTime();
    const eTime = new Date(endDate).getTime();
    const conflict = bookedDates.some(b => {
      const bs = new Date(b.startDate).getTime();
      const be = new Date(b.endDate).getTime();
      return sTime <= be && eTime >= bs;
    });

    if (conflict) {
      setBookingError('These dates overlap with an existing approved rental. Please pick another timeframe.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createRentalRequest({
        itemId: item.id,
        startDate,
        endDate,
        rentalPurpose
      });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-slate-500 gap-1.5">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/items" className="hover:text-slate-800">Items</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Visuals & Specifications */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Gallery */}
          <div className="space-y-4">
            <div className="aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
              <img
                src={images[activeImage]?.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <StatusPill status={item.condition} />
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImage === idx ? 'border-teal-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Core Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  {item.category?.name || 'Equipment'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {item.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{item.location_city}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900">₱{item.rental_price}</span>
                <span className="text-xs text-slate-500 block">per {item.price_basis || 'day'}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Item Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Location & Pickup Information */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Pickup & Location Instructions</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.location_pickup_notes || 'Handover details will be finalized upon booking confirmation.'}
              </p>
            </div>

            {/* Owner Terms & Rental Rules */}
            {item.rental_rules && (
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Rental Terms & Guidelines</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {item.rental_rules}
                </p>
              </div>
            )}
          </div>

          {/* Owner Trust Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Item Owner Trust Profile</h3>
            
            <div className="flex items-start gap-4">
              <img
                src={item.owner?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                alt={item.owner?.fullName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500/20"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{item.owner?.fullName}</h4>
                  <TrustBadge isVerified={item.owner?.isVerified} size="xs" />
                </div>
                <p className="text-xs text-slate-500">{item.owner?.bio || 'Verified RentLoop Community Member'}</p>
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-900">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {item.owner?.trustScore || '5.0'} Rating
                  </span>
                  <span>•</span>
                  <span><strong>{item.owner?.completedRentals || 0}</strong> Completed Rentals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Verified Reviews ({item.reviews?.length || 0})
              </h3>
            </div>

            {(!item.reviews || item.reviews.length === 0) ? (
              <p className="text-xs text-slate-400 py-4">No reviews yet for this owner. Complete a rental to be the first!</p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {item.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.reviewer?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'}
                          alt={rev.reviewer?.fullName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-900">{rev.reviewer?.fullName}</span>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Rental Request Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md sticky top-24 space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-2xl font-black text-slate-900">₱{item.rental_price}</span>
                <span className="text-xs text-slate-500"> / {item.price_basis || 'day'}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Available to Request
              </span>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Rental Request Submitted!</h4>
                <p className="text-xs text-emerald-700">
                  The item owner has been notified. You can track approval status and handover instructions in your dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    to="/renter/dashboard"
                    className="block w-full py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
                  >
                    Go to Renter Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Dates Selector */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rental Start Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rental Return Date
                    </label>
                    <input
                      type="date"
                      min={startDate || new Date().toISOString().split('T')[0]}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Purpose input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rental Purpose / Message to Owner
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you'll use this item for..."
                    value={rentalPurpose}
                    onChange={(e) => setRentalPurpose(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Pricing Summary Breakdown */}
                {durationDays > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>₱{item.rental_price} x {durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                      <span className="font-semibold text-slate-900">₱{subtotal.toFixed(2)}</span>
                    </div>
                    {totalDeposit > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Refundable Security Deposit</span>
                        <span className="font-semibold text-slate-900">₱{totalDeposit.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Estimated Total</span>
                      <span className="text-teal-700">₱{(subtotal + totalDeposit).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || isOwner}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm"
                >
                  {isOwner
                    ? 'You Own This Listing'
                    : submitting
                    ? 'Submitting Request...'
                    : 'Submit Rental Request'}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  No payment is processed until the owner approves and pre-rental condition inspection photos are acknowledged.
                </p>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

