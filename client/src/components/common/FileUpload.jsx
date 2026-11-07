import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/api';

export function FileUpload({
  label,
  value,
  onChange,
  folder = 'general',
  description = 'PNG, JPG, JPEG, or WEBP up to 10MB',
  required = false,
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate type
    const isImageOrPdf =
      file.type.startsWith('image/') ||
      file.type.includes('pdf') ||
      /\.(jpe?g|png|webp|gif|bmp|svg|jfif|heic|heif|avif|pdf)$/i.test(file.name);

    if (!isImageOrPdf) {
      setError('Please select an image file (PNG, JPG, WEBP, JFIF, AVIF).');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const res = await api.uploadFile(file, folder);
      onChange(res.url);
    } catch (err) {
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset file input so selecting the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClear = () => {
    onChange('');
    setError('');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlFallback(!showUrlFallback)}
            className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlFallback ? 'Use file picker' : 'Or paste URL'}</span>
          </button>
        </div>
      )}

      {showUrlFallback ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="https://... or /uploads/..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {value && (
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <img src={value} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-slate-200 border" />
              <div className="text-[11px] text-slate-500 truncate flex-1">{value}</div>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-500 hover:text-rose-700 px-2 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      ) : value ? (
        /* Image Preview Card */
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              <img
                src={value}
                alt="Uploaded Document"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Uploaded Ready
              </span>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-xs">{value}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/40'
          }`}
        >
          {uploading ? (
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-600">Uploading file to secure server...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-indigo-600 hover:underline">Click to browse</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.jfif,.heic,.heif,.avif,.webp,.pdf"
        onChange={onFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
