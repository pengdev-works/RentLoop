import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  User,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Camera,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TrustBadge } from '../components/common/TrustBadge';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'profile' | 'security'

  // Verification Form State
  const [idType, setIdType] = useState(user?.verification?.idType || 'drivers_license');
  const [idNumber, setIdNumber] = useState('');
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [selfieImageUrl, setSelfieImageUrl] = useState('');
  const [submittingVerif, setSubmittingVerif] = useState(false);
  const [verifMessage, setVerifMessage] = useState({ text: '', type: '' });

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [addressCity, setAddressCity] = useState(user?.profile?.address_city || '');
  const [addressProvince, setAddressProvince] = useState(user?.profile?.address_province || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setVerifMessage({ text: '', type: '' });

    if (!idNumber.trim()) {
      setVerifMessage({ text: 'Please enter your government ID identification number.', type: 'error' });
      return;
    }
    if (!frontImageUrl.trim()) {
      setVerifMessage({ text: 'Please provide the front photo URL of your ID.', type: 'error' });
      return;
    }

    setSubmittingVerif(true);
    try {
      await api.verifyIdentity({
        idType,
        idNumber: idNumber.trim(),
        frontImageUrl: frontImageUrl.trim(),
        backImageUrl: backImageUrl.trim() || undefined,
        selfieImageUrl: selfieImageUrl.trim() || undefined
      });
      setVerifMessage({
        text: 'Identity verification documents submitted! The administration team will review your submission.',
        type: 'success'
      });
      await refreshUser();
    } catch (err) {
      setVerifMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingVerif(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    setUpdatingProfile(true);

    try {
      await api.updateProfile({
        fullName,
        phone,
        bio,
        addressCity,
        addressProvince
      });
      setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
      await refreshUser();
    } catch (err) {
      setProfileMessage({ text: err.message, type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    setUpdatingPassword(true);

    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ text: 'Password updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage({ text: err.message, type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) return null;

  const verifStatus = user.verification?.status || 'unverified';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={user.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={user.fullName}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-teal-500/10 shadow-xs"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{user.fullName}</h1>
              <TrustBadge status={verifStatus} />
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {user.profile?.trust_score || '5.00'} Trust Score
              </span>
              <span>•</span>
              <span>{user.profile?.completed_rentals_count || 0} Completed Rentals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'verification'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Trust & Identity Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Information</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB CONTENT: IDENTITY VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Government Identity Verification</h2>
            <p className="text-xs text-slate-500 mt-1">
              RentLoop protects item owners and renters by validating all platform participants against authentic government ID credentials.
            </p>
          </div>

          {/* Verification Status Banner */}
          {verifStatus === 'verified' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Identity Officially Verified</h4>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  Your identity documents have been approved by trust administrators. You hold verified member privileges across the RentLoop network.
                </p>
              </div>
            </div>
          ) : verifStatus === 'pending' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Verification Review Pending</h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Your submitted identification documents are currently queued for administrator review. Reviews typically complete within 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Verification Required</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Please submit a valid Passport, Driver's License, or National ID. Your document images are stored privately in encrypted storage and never exposed to the public.
                </p>
              </div>
            </div>
          )}

          {verifMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-medium ${
              verifMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {verifMessage.text}
            </div>
          )}

          {/* Form */}
          {verifStatus !== 'verified' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Philippine Government ID Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  >
                    <option value="drivers_license">Driver's License (LTO)</option>
                    <option value="national_id">Philippine National ID (PhilSys)</option>
                    <option value="passport">Philippine Passport (DFA)</option>
                    <option value="umid">UMID (Unified Multi-Purpose ID)</option>
                    <option value="postal_id">Postal ID (PhilPost)</option>
                    <option value="prc_id">PRC License ID</option>
                    <option value="student_id">Official Student / University ID</option>
                    <option value="other">Other Valid Government ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ID Document Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. N02-19-123456 or 1234-5678-9012"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Front ID Photo URL / Upload</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  value={frontImageUrl}
                  onChange={(e) => setFrontImageUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Clear, high-resolution photo showing your name, photo, and ID number.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Back ID Photo URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={backImageUrl}
                    onChange={(e) => setBackImageUrl(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Verification Selfie URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={selfieImageUrl}
                    onChange={(e) => setSelfieImageUrl(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingVerif}
                className="py-3 px-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{submittingVerif ? 'Submitting...' : 'Submit ID Verification'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROFILE INFO */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500 mt-1">Manage your public bio, location, and communication details.</p>
          </div>

          {profileMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-medium ${
              profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={addressProvince}
                  onChange={(e) => setAddressProvince(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a few words about your background, tools, or hobbies..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500 mt-1">Ensure your account is secured with a strong password.</p>
          </div>

          {passwordMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-medium ${
              passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min. 8 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

