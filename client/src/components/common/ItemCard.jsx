import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, Tag } from 'lucide-react';
import { StatusPill } from './StatusPill';

export function ItemCard({ item }) {
  const imageUrl = item.primary_image || (item.images && item.images[0]?.image_url) || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <StatusPill status={item.condition} size="xs" />
        </div>
        {item.category?.name && (
          <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3 text-teal-400" />
            <span>{item.category.name}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px]">{item.location_city}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{item.owner?.trustScore || '5.0'}</span>
          </div>
        </div>

        {/* Pricing & Owner footer */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-lg font-bold text-slate-900">₱{item.rental_price}</span>
            <span className="text-xs text-slate-500"> / {item.price_basis || 'day'}</span>
          </div>
          {item.owner?.isVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

