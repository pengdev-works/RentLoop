import React from 'react';

const statusMap = {
  // Rentals
  pending: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  ready_for_pickup: { label: 'Ready for Pickup', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  active: { label: 'Active Rental', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' },
  return_pending: { label: 'Return Pending', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: 'Completed', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
  disputed: { label: 'Disputed', bg: 'bg-red-50 text-red-700 border-red-200 font-bold' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-500 border-slate-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Verifications
  verified: { label: 'Verified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

  // Items
  brand_new: { label: 'Brand New', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  like_new: { label: 'Like New', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  good: { label: 'Good Condition', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  fair: { label: 'Fair Condition', bg: 'bg-amber-50 text-amber-700 border-amber-200' },

  // User status
  suspended: { label: 'Suspended', bg: 'bg-red-50 text-red-700 border-red-200' }
};

export function StatusPill({ status, customLabel, size = 'sm' }) {
  const meta = statusMap[status] || {
    label: customLabel || (status ? status.replace(/_/g, ' ') : 'Unknown'),
    bg: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center uppercase tracking-wider font-semibold rounded-md border ${meta.bg} ${sizeClass}`}>
      {customLabel || meta.label}
    </span>
  );
}
