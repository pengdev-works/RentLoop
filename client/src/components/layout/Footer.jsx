import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, HeartHandshake, FileCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/rentloop-logo.png"
                alt="RentLoop Logo"
                className="w-9 h-9 object-contain rounded-lg"
              />
              <span className="font-extrabold text-xl text-white tracking-tight">
                Rent<span className="text-teal-400">Loop</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A secure peer-to-peer item rental and trust management platform. Promoting accountability, verified identities, and tamper-evident condition documentation.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity-Verified Community</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/items" className="hover:text-teal-400 transition-colors">Browse All Gear</Link></li>
              <li><Link to="/items?category=cameras-photography" className="hover:text-teal-400 transition-colors">Cameras & Photography</Link></li>
              <li><Link to="/items?category=power-tools-workshop" className="hover:text-teal-400 transition-colors">Power Tools & Workshop</Link></li>
              <li><Link to="/items?category=outdoor-camping" className="hover:text-teal-400 transition-colors">Outdoor & Camping</Link></li>
              <li><Link to="/items?category=audio-visual" className="hover:text-teal-400 transition-colors">Audio & Visual Equipment</Link></li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Trust & Safety</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-teal-400" /> Government ID Verification</li>
              <li className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-teal-400" /> Pre & Post Condition Inspections</li>
              <li className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-teal-400" /> Verified Transaction Reviews</li>
              <li><Link to="/profile" className="hover:text-teal-400 transition-colors">Submit Verification Documents</Link></li>
            </ul>
          </div>
          
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RentLoop Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Security Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Rental</span>
            <span className="hover:text-slate-400 cursor-pointer">Trust Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

