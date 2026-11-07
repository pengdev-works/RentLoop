import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export function TrustBadge({ isVerified, status = 'unverified', size = 'sm' }) {
  const verified = isVerified || status === 'verified';
  const isPending = status === 'pending';

  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  if (verified) {
    return (
      <span className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${sizeClasses}`}>
        <ShieldCheck className={size === 'md' ? 'w-4 h-4 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
        <span>Verified Identity</span>
      </span>
    );
  }

  if (isPending) {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${sizeClasses}`}>
        <ShieldAlert className={size === 'md' ? 'w-4 h-4 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
        <span>Verification Pending</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
      <Shield className={size === 'md' ? 'w-4 h-4 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />
      <span>Standard Member</span>
    </span>
  );
}
