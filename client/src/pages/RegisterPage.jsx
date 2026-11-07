import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  ShoppingBag,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { alertSuccess, toastErr } from '../utils/swal';

export function RegisterPage() {
  const [accountGoal, setAccountGoal] = useState('rent'); // 'rent' | 'list'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressCity: '',
    addressProvince: '',
    password: '',
    confirmPassword: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toastErr('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toastErr('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      toastErr('Please agree to the Terms of Service & Community Guidelines.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressCity: formData.addressCity.trim(),
        addressProvince: formData.addressProvince.trim(),
        bio: formData.bio?.trim() || (accountGoal === 'rent' ? 'Interested in renting gear & tools.' : 'Looking to list rentable equipment.')
      });

      await alertSuccess(
        'Account Registered! 🎉',
        'Welcome to the RentLoop Network! Please proceed to complete your government ID verification.'
      );
      navigate('/profile');
    } catch (err) {
      toastErr(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* ── Left Column: Brand Showcase (Logo Only) ── */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-8 sm:p-12 flex flex-col justify-center items-center relative overflow-hidden min-h-[220px] lg:min-h-full">
          
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          {/* Logo Only */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <Link to="/" className="inline-block group transition-transform hover:scale-105">
              <img
                src="/rentloop-logo.png"
                alt="RentLoop Logo"
                className="w-32 h-32 sm:w-44 sm:h-44 object-contain rounded-3xl drop-shadow-2xl"
              />
            </Link>
          </div>

        </div>

        {/* ── Right Column: Registration Form ── */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto space-y-5">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Verified Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us what you plan to do on RentLoop. You can rent and list with one single account.
              </p>
            </div>

            {/* Intention Selector: Renter vs Owner */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setAccountGoal('rent')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  accountGoal === 'rent'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                <span>I Want to Rent Gear</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountGoal('list')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  accountGoal === 'list'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>I Want to List & Earn</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Juan Dela Cruz (as shown on Gov ID)"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan.delacruz@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0917-123-4567"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Province</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      name="addressCity"
                      value={formData.addressCity}
                      onChange={handleChange}
                      placeholder="e.g. Quezon City, NCR"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 chars"
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat"
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms agreement checkbox */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                />
                <span className="text-[11px] text-slate-500 leading-tight">
                  I agree to RentLoop's <span className="text-teal-600 font-semibold">Terms of Service</span>, <span className="text-teal-600 font-semibold">Inspection Code of Conduct</span>, and acknowledge the Philippine Data Privacy Act provisions.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <span>{loading ? 'Creating Account...' : 'Agree & Create Verified Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 pt-1">
              Already registered on RentLoop?{' '}
              <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700">
                Sign In
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
