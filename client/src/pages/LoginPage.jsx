import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/items');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
    setLoading(true);

    try {
      const user = await login(demoEmail, 'Password123!');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/items');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-lg">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/rentloop-logo.png" alt="RentLoop Logo" className="w-12 h-12 mx-auto rounded-xl drop-shadow-xs" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back to RentLoop</h2>
          <p className="text-xs text-slate-500">Sign in to manage your rentals, listings, and trust profile.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Evaluation Credentials */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Demo & Evaluation Fast-Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('john.owner@rentloop.com')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition-colors"
            >
              <UserCheck className="w-4 h-4 text-teal-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-700 block">Item Owner</span>
            </button>
            <button
              onClick={() => handleQuickLogin('sarah.renter@rentloop.com')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-700 block">Renter</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@rentloop.com')}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-center transition-colors"
            >
              <Shield className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-indigo-900 block">Sys Admin</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
}
