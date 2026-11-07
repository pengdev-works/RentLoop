import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  Camera,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toastErr, toastOk } from '../utils/swal';

export function LoginPage() {
  const [activeTab, setActiveTab] = useState('member'); // 'member' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      toastOk(`Welcome back, ${user.fullName || 'Member'}!`);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/items');
      }
    } catch (err) {
      toastErr(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickFill = () => {
    setEmail('admin@rentloop.com');
    setPassword('Password123!');
    setActiveTab('admin');
  };

  const handleRenterQuickFill = () => {
    setEmail('hailey@gmail.com');
    setPassword('Password123!');
    setActiveTab('member');
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* ── Left Column: Brand Showcase (Responsive Logo) ── */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white py-6 px-4 sm:p-10 lg:p-12 flex flex-col justify-center items-center relative overflow-hidden min-h-0 lg:min-h-full">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          {/* Logo Only */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <Link to="/" className="inline-block group transition-transform hover:scale-105">
              <img
                src="/rentloop-logo.png"
                alt="RentLoop Logo"
                className="w-20 h-20 sm:w-28 sm:h-28 lg:w-40 lg:h-40 object-contain rounded-2xl sm:rounded-3xl drop-shadow-2xl"
              />
            </Link>
          </div>

        </div>

        {/* ── Right Column: Interactive Login Forms ── */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Form Mode Selector Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => { setActiveTab('member'); setEmail(''); setPassword(''); }}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'member'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>Member Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('admin'); handleAdminQuickFill(); }}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin Desk</span>
              </button>
            </div>

            {/* Header text based on tab */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'member' ? 'Sign In to Your Account' : 'System Administration'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'member'
                  ? 'Access your rental requests, active handovers, item listings, and trust badges.'
                  : 'Authorized personnel portal for identity reviews, audit trails, and dispute resolution.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeTab === 'member' ? 'Account Email Address' : 'Admin Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'member' ? 'name@example.com' : 'admin@rentloop.com'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  {activeTab === 'member' && (
                    <span className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer">
                      Forgot Password?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'member'
                    ? 'bg-teal-600 hover:bg-teal-700 active:scale-[0.99]'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
                }`}
              >
                <span>{loading ? 'Authenticating...' : activeTab === 'member' ? 'Sign In as Member' : 'Enter Admin Control Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Registration Switch */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Don't have a verified account yet?{' '}
              <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
                Create Account
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
