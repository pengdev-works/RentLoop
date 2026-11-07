import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Star,
  FileText,
  User,
  Key,
  ChevronRight,
  ShieldAlert,
  Send,
  Flag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';
import { FileUpload } from '../components/common/FileUpload';
import { toastOk, toastErr, alertSuccess, alertError, confirm } from '../utils/swal';

export function RentalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pre-Rental Inspection Form
  const [preCondition, setPreCondition] = useState('like_new');
  const [preNotes, setPreNotes] = useState('');
  const [preDamages, setPreDamages] = useState('');
  const [preImageUrl, setPreImageUrl] = useState('');
  const [submittingPre, setSubmittingPre] = useState(false);

  // Return Inspection Form
  const [postCondition, setPostCondition] = useState('like_new');
  const [postNotes, setPostNotes] = useState('');
  const [postDamages, setPostDamages] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Handover confirmation
  const [handoverInputCode, setHandoverInputCode] = useState('');
  const [confirmingHandover, setConfirmingHandover] = useState(false);

  // Review Submission Form
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Report Concern / Dispute Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('damaged_item');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadRentalData = async () => {
    try {
      const data = await api.getRentalById(id);
      setRental(data);
    } catch (err) {
      console.error('Failed to load rental:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentalData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-96 bg-white rounded-3xl animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900">Rental record not found or inaccessible</h2>
        <Link to="/items" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === rental.owner_id;
  const isRenter = user?.id === rental.renter_id;

  const preReport = rental.conditionReports?.find(r => r.stage === 'pre_rental');
  const postReport = rental.conditionReports?.find(r => r.stage === 'post_rental');

  const handoverConf = rental.confirmations?.find(c => c.stage === 'handover');
  const returnConf = rental.confirmations?.find(c => c.stage === 'return');

  const userReview = rental.reviews?.find(rev => rev.reviewer_id === user?.id);

  // Handlers
  const handlePreInspectionSubmit = async (e) => {
    e.preventDefault();
    if (!preNotes.trim()) return toastErr('Please enter condition notes.');
    setSubmittingPre(true);
    try {
      await api.submitConditionReport({
        rentalId: rental.id,
        stage: 'pre_rental',
        itemCondition: preCondition,
        conditionNotes: preNotes.trim(),
        damagesNoted: preDamages.trim() || undefined,
        imageUrls: preImageUrl.trim() ? [preImageUrl.trim()] : undefined
      });
      await loadRentalData();
      alertSuccess('Inspection Recorded!', 'Pre-rental condition report and photos have been securely logged.');
    } catch (err) {
      toastErr(err.message || 'Failed to submit inspection report.');
    } finally {
      setSubmittingPre(false);
    }
  };

  const handleVerifyConditionReport = async (reportId) => {
    try {
      await api.verifyConditionReport(reportId);
      toastOk('Condition report verified.');
      await loadRentalData();
    } catch (err) {
      toastErr(err.message || 'Failed to verify condition report.');
    }
  };

  const handleHandoverConfirm = async () => {
    setConfirmingHandover(true);
    try {
      await api.confirmHandover(rental.id, {
        handoverCode: handoverInputCode || undefined
      });
      await loadRentalData();
      alertSuccess('Handover Confirmed!', 'The rental is now officially active. Take great care of the item!');
    } catch (err) {
      alertError('Handover Failed', err.message || 'Verification code mismatch or error.');
    } finally {
      setConfirmingHandover(false);
    }
  };

  const handlePostInspectionSubmit = async (e) => {
    e.preventDefault();
    if (!postNotes.trim()) return toastErr('Please enter return inspection notes.');
    setSubmittingPost(true);
    try {
      await api.submitConditionReport({
        rentalId: rental.id,
        stage: 'post_rental',
        itemCondition: postCondition,
        conditionNotes: postNotes.trim(),
        damagesNoted: postDamages.trim() || undefined,
        imageUrls: postImageUrl.trim() ? [postImageUrl.trim()] : undefined
      });
      await loadRentalData();
      alertSuccess('Return Inspection Logged!', 'Post-rental condition notes and photos have been documented.');
    } catch (err) {
      toastErr(err.message || 'Failed to submit return inspection.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleReturnConfirm = async () => {
    const isConfirmed = await confirm(
      'Confirm Item Return?',
      'Verify that the item has been returned safely in agreed condition.',
      'Yes, Confirm Return'
    );
    if (!isConfirmed) return;

    try {
      await api.confirmReturn(rental.id);
      await loadRentalData();
      alertSuccess('Rental Completed!', 'Item return confirmed! Security deposit settlement initiated.');
    } catch (err) {
      toastErr(err.message || 'Failed to confirm return.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.createReview({
        rentalId: rental.id,
        rating,
        comment: reviewComment.trim()
      });
      setReviewSuccess(true);
      toastOk('Rating & Review submitted!');
      await loadRentalData();
    } catch (err) {
      toastErr(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await api.createReport({
        rentalId: rental.id,
        reportedUserId: isOwner ? rental.renter_id : rental.owner_id,
        reportedItemId: rental.item_id,
        reportType,
        description: reportDesc.trim()
      });
      setIsReportModalOpen(false);
      setReportDesc('');
      alertSuccess('Report Lodged', 'Your dispute/concern has been sent to our Trust & Safety admin team for immediate investigation.');
    } catch (err) {
      toastErr(err.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav className="flex items-center text-xs text-slate-500 gap-1.5">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={isOwner ? "/owner/dashboard" : "/renter/dashboard"} className="hover:text-slate-800">
            {isOwner ? "Owner Dashboard" : "Renter Dashboard"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold truncate max-w-xs">Rental Hub: {rental.item?.title}</span>
        </nav>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report Issue / Damage</span>
        </button>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <img
              src={rental.item?.images && rental.item.images[0]?.image_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=200&q=80'}
              alt={rental.item?.title}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{rental.item?.title}</h1>
                <StatusPill status={rental.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rental Window: <strong>{rental.start_date}</strong> to <strong>{rental.end_date}</strong> • Total Value: <strong>₱{rental.total_amount}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Counterpart</span>
              <strong className="text-slate-900 text-sm">
                {isOwner ? rental.renter?.fullName : rental.owner?.fullName}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Security Deposit</span>
              <strong className="text-slate-900 text-sm">₱{rental.security_deposit || '0.00'}</strong>
            </div>
          </div>
        </div>

        {/* 5-STAGE PROGRESS PIPELINE */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            ['ready_for_pickup', 'active', 'return_pending', 'completed'].includes(rental.status)
              ? 'bg-teal-50/70 border-teal-300 text-teal-800'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">1. Booked</span>
            <span className="text-xs font-semibold">Approved</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            preReport
              ? 'bg-teal-50/70 border-teal-300 text-teal-800'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">2. Inspection</span>
            <span className="text-xs font-semibold">{preReport ? 'Documented' : 'Pending'}</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            rental.status === 'active' || rental.status === 'return_pending' || rental.status === 'completed'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">3. Handover</span>
            <span className="text-xs font-semibold">
              {['active', 'return_pending', 'completed'].includes(rental.status) ? 'Active Rental' : 'Waiting Code'}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            postReport
              ? 'bg-teal-50/70 border-teal-300 text-teal-800'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">4. Return Check</span>
            <span className="text-xs font-semibold">{postReport ? 'Verified' : 'Pending'}</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center space-y-1 col-span-2 sm:col-span-1 ${
            rental.status === 'completed'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <span className="text-[10px] font-bold uppercase block">5. Completion</span>
            <span className="text-xs font-semibold">{rental.status === 'completed' ? 'Finalized' : 'In Progress'}</span>
          </div>

        </div>
      </div>

      {/* STAGE A: PRE-RENTAL CONDITION DOCUMENTATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Pre-Rental Item Condition Inspection</h2>
          </div>
          {preReport && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              preReport.verified_by_counterpart
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {preReport.verified_by_counterpart ? 'Signoff Verified by Counterpart' : 'Awaiting Counterpart Signoff'}
            </span>
          )}
        </div>

        {preReport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Photo Evidence */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500">Documented Photo Evidence</span>
                {preReport.images && preReport.images.length > 0 ? (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={preReport.images[0].image_url}
                      alt="Pre-rental evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Notes & Damage Description */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Condition Grade</span>
                  <StatusPill status={preReport.item_condition} size="xs" />
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Condition Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {preReport.condition_notes}
                  </p>
                </div>
                {preReport.damages_noted && (
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Existing Wear / Cosmetic Flaws</span>
                    <p className="text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-100 leading-relaxed">
                      {preReport.damages_noted}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Counterpart Verification Button */}
            {!preReport.verified_by_counterpart && (isRenter || (isOwner && preReport.reported_by !== user?.id)) && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Please inspect the item physical condition against the report above and confirm signoff.
                </p>
                <button
                  onClick={() => handleVerifyConditionReport(preReport.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acknowledge & Sign Off Condition</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handlePreInspectionSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Before handing over or taking possession of the item, document its current operational and visual condition.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Condition Grade</label>
                <select
                  value={preCondition}
                  onChange={(e) => setPreCondition(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                >
                  <option value="brand_new">Brand New</option>
                  <option value="like_new">Like New (Mint)</option>
                  <option value="good">Good (Normal light wear)</option>
                  <option value="fair">Fair (Noticeable cosmetic wear)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pre-existing Scratches / Cosmetic Flaws (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Minor rub mark on battery lid plastic."
                  value={preDamages}
                  onChange={(e) => setPreDamages(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Direct Inspection File Upload */}
            <FileUpload
              label="Pre-Rental Inspection Photograph"
              description="Upload a photo documenting current condition, lens glass, accessories, or serial number."
              value={preImageUrl}
              onChange={setPreImageUrl}
              folder="conditions"
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operational & Condition Notes</label>
              <textarea
                rows={2}
                required
                placeholder="Describe accessories present, serial check, lens glass, motor operation..."
                value={preNotes}
                onChange={(e) => setPreNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPre}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {submittingPre ? 'Recording...' : 'Submit Pre-Rental Condition Inspection'}
            </button>
          </form>
        )}
      </div>

      {/* STAGE B: HANDOVER CONFIRMATION & ACTIVE STATUS */}
      {['ready_for_pickup', 'active'].includes(rental.status) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Handover Execution & Code Verification</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Handover Verification Code
              </span>
              <p className="text-xs text-indigo-700">
                {isOwner
                  ? "Renter will provide this code upon physical receipt of the item."
                  : `Give this security code to the item owner during physical handover: `}
              </p>
              <span className="inline-block text-2xl font-black text-indigo-900 tracking-widest font-mono bg-white px-4 py-1 rounded-xl border border-indigo-200 mt-2">
                {handoverConf?.handover_code || 'RL-9281'}
              </span>
            </div>

            {rental.status === 'ready_for_pickup' && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {isRenter && (
                  <input
                    type="text"
                    placeholder="Enter Handover Code"
                    value={handoverInputCode}
                    onChange={(e) => setHandoverInputCode(e.target.value)}
                    className="w-full sm:w-44 text-xs font-mono uppercase bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                )}
                <button
                  onClick={handleHandoverConfirm}
                  disabled={confirmingHandover}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  {confirmingHandover ? 'Confirming...' : 'Confirm Handover Completed'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE C: POST-RENTAL RETURN & CONDITION INSPECTION */}
      {['active', 'return_pending', 'completed'].includes(rental.status) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Post-Rental Return Inspection & Finalization</h2>
            </div>
            {rental.status === 'completed' && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Rental Completed
              </span>
            )}
          </div>

          {postReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500">Return Photo Evidence</span>
                  {postReport.images && postReport.images.length > 0 ? (
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={postReport.images[0].image_url}
                        alt="Return evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                      No photo uploaded
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Returned Condition</span>
                    <StatusPill status={postReport.item_condition} size="xs" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Inspection Notes</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {postReport.condition_notes}
                    </p>
                  </div>
                  {postReport.damages_noted && (
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px] block">Reported Damages / Anomalies</span>
                      <p className="text-rose-800 bg-rose-50/70 p-3 rounded-xl border border-rose-100 leading-relaxed">
                        {postReport.damages_noted}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {rental.status !== 'completed' && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Both parties verify return of equipment in good standing to release deposit and finalize transaction.
                  </p>
                  <button
                    onClick={handleReturnConfirm}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Confirm Return & Complete Rental
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handlePostInspectionSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Item return inspection: document that the item was returned undamaged with all associated cables, accessories, and cases.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Returned Condition Grade</label>
                  <select
                    value={postCondition}
                    onChange={(e) => setPostCondition(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  >
                    <option value="brand_new">Brand New</option>
                    <option value="like_new">Like New (Mint)</option>
                    <option value="good">Good (Normal light wear)</option>
                    <option value="fair">Fair (Cosmetic wear)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Damages or Missing Items (If any)</label>
                  <input
                    type="text"
                    placeholder="None / or describe any newly incurred damage..."
                    value={postDamages}
                    onChange={(e) => setPostDamages(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Direct Return File Upload */}
              <FileUpload
                label="Return Inspection Photograph"
                description="Upload a photo verifying item condition upon return."
                value={postImageUrl}
                onChange={setPostImageUrl}
                folder="conditions"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Inspection Findings</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Returned clean on time, battery holds full charge, all drill bits accounted for."
                  value={postNotes}
                  onChange={(e) => setPostNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPost}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {submittingPost ? 'Saving...' : 'Submit Return Inspection'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* STAGE D: MUTUAL REVIEWS */}
      {rental.status === 'completed' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Mutual Community Reviews</h2>
          </div>

          {userReview ? (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Submitted Review</span>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(userReview.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 italic">"{userReview.comment}"</p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
              <p className="text-xs text-slate-600">
                Rate your experience with <strong>{isOwner ? rental.renter?.fullName : rental.owner?.fullName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Comment</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about communication, equipment care, and punctuality..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {submittingReview ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* DISPUTE / REPORT MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Escalate Issue to Platform Administrator"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Reports are investigated directly by RentLoop's Trust & Safety desk.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Concern Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500"
            >
              <option value="damaged_item">Item Returned Damaged / Missing Parts</option>
              <option value="late_return">Unreturned Item / Late Handover</option>
              <option value="misleading_listing">Item Condition Was Not As Advertised</option>
              <option value="harassment">Misconduct or Harassment</option>
              <option value="unfulfilled_agreement">Breach of Rental Agreement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description of Concern</label>
            <textarea
              rows={4}
              required
              placeholder="Describe exactly what occurred, timestamps, and damages..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReport}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              {submittingReport ? 'Filing...' : 'Submit Official Report'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

