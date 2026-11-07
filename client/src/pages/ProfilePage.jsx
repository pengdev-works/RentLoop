import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Camera,
  Star,
  Upload,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TrustBadge } from '../components/common/TrustBadge';
import { FileUpload } from '../components/common/FileUpload';
import { toastOk, toastErr, alertSuccess, alertError } from '../utils/swal';

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
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const avatarInputRef = useRef(null);

  // Quick avatar change from header
  const handleQuickAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|jfif|heic|heif|avif)$/i.test(file.name);
    if (!isImage) {
      toastErr('Please select an image file (PNG, JPG, WEBP, JFIF, AVIF).');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await api.uploadFile(file, 'avatars');
      setAvatarUrl(res.url);
      await api.updateProfile({ avatarUrl: res.url });
      await refreshUser();
      toastOk('Profile picture updated!');
    } catch (err) {
      toastErr(err.message || 'Failed to update profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setVerifMessage({ text: '', type: '' });

    if (!idNumber.trim()) {
      setVerifMessage({ text: 'Please enter your government ID identification number.', type: 'error' });
      return;
    }
    if (!frontImageUrl.trim()) {
      setVerifMessage({ text: 'Please upload the front photo of your government ID.', type: 'error' });
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
      await refreshUser();
      await alertSuccess(
        'Documents Submitted!',
        'Your identity documents have been uploaded. The admin team will review your submission shortly.'
      );
      setVerifMessage({ text: '', type: '' });
    } catch (err) {
      toastErr(err.message || 'Submission failed. Please try again.');
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
        addressProvince,
        avatarUrl
      });
      await refreshUser();
      toastOk('Profile information updated successfully!');
    } catch (err) {
      toastErr(err.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);

    try {
      await api.changePassword({ currentPassword, newPassword });
      toastOk('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toastErr(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) return null;

  const verifStatus = user.verification?.status || 'unverified';
  const currentAvatar = avatarUrl || user.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner with Profile Picture & Change Button */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* Avatar with Camera Overlay & Click to Upload */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-teal-500/10 shadow-xs bg-slate-100 relative">
              <img
                src={currentAvatar}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Quick Upload Trigger */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 p-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl shadow-md transition-all hover:scale-110"
              title="Click to change profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*,.jfif,.heic,.heif,.avif,.webp"
              onChange={handleQuickAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{user.fullName}</h1>
              <TrustBadge status={verifStatus} />
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {user.profile?.trust_score || '5.00'} Trust Score
              </span>
              <span>•</span>
              <span>{user.profile?.completed_rentals_count || 0} Completed Rentals</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
        >
          <Camera className="w-4 h-4 text-slate-600" />
          <span>Change Photo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
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
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
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
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT: IDENTITY VERIFICATION                       */}
      {/* ========================================================= */}
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
                  Please upload a clear photo of your Philippine National ID (PhilSys), Driver's License (LTO), Passport (DFA), or UMID. Your document images are stored securely and never made public.
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
            <form onSubmit={handleVerificationSubmit} className="space-y-6 pt-2">
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

              {/* REUSABLE FILE UPLOAD DROPZONE FOR FRONT ID */}
              <FileUpload
                label="Front ID Photo"
                description="Upload a clear, high-resolution photo showing your full name, photo, and ID number."
                value={frontImageUrl}
                onChange={setFrontImageUrl}
                folder="verifications"
                required={true}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* BACK ID UPLOAD */}
                <FileUpload
                  label="Back ID Photo (Optional)"
                  description="Upload back side of ID if details or barcode are on the back."
                  value={backImageUrl}
                  onChange={setBackImageUrl}
                  folder="verifications"
                />

                {/* SELFIE UPLOAD */}
                <FileUpload
                  label="Biometric Verification Selfie (Optional)"
                  description="Upload a photo of yourself holding your government ID for expedited approval."
                  value={selfieImageUrl}
                  onChange={setSelfieImageUrl}
                  folder="verifications"
                />
              </div>

              <button
                type="submit"
                disabled={submittingVerif}
                className="py-3 px-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{submittingVerif ? 'Submitting Documents...' : 'Submit ID Verification'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT: PROFILE INFO                                */}
      {/* ========================================================= */}
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

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            {/* Direct Profile Picture Upload in Form */}
            <FileUpload
              label="Profile Picture / Avatar"
              description="Upload a friendly photo of yourself for your RentLoop public profile."
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="avatars"
            />

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
                  placeholder="e.g. Quezon City, Makati, Cebu City"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={addressProvince}
                  onChange={(e) => setAddressProvince(e.target.value)}
                  placeholder="e.g. Metro Manila, Cebu, Davao del Sur"
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
              {updatingProfile ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT: SECURITY                                    */}
      {/* ========================================================= */}
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
