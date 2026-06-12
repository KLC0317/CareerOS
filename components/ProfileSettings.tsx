'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import {
  User, Mail, Briefcase, Camera, Moon, Sun, Crown, ArrowLeft,
  Loader2, CheckCircle, AlertCircle, Trash2
} from 'lucide-react';

export default function ProfileSettings() {
  const {
    userProfile,
    authLoading,
    darkMode,
    setDarkMode,
    updateProfileSettings,
    setActivePersona,
    dbStatus
  } = useCareerEngine();

  // Local state for form
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Status states
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load initial values from context userProfile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setTargetRole(userProfile.targetRole || 'AI Architect');
      setIsPremium(!!userProfile.isPremium);
      setProfilePicture(userProfile.profilePicture || null);
    }
  }, [userProfile]);

  // Handle image conversion to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Only image files (JPEG, PNG, WebP) are supported.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setStatus({ type: 'error', message: 'Image size must be less than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result as string);
      setStatus({ type: 'idle', message: '' });
    };
    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Failed to read the image file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removePicture = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit profile settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Saving...' });

    try {
      const result = await updateProfileSettings(name, targetRole, isPremium, profilePicture);
      if (result.success) {
        setStatus({
          type: 'success',
          message: 'Saved'
        });
        const prev = typeof window !== 'undefined' ? sessionStorage.getItem('career_os_prev_persona') : null;
        setActivePersona((prev as any) || 'candidate');
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Error saving settings.'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Connection error.'
      });
    }
  };

  // Get initials for profile placeholder
  const getInitials = () => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Top navigation back link */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => {
            const prev = typeof window !== 'undefined' ? sessionStorage.getItem('career_os_prev_persona') : null;
            setActivePersona((prev as any) || 'candidate');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest font-mono">Profile Settings</h2>
      </div>

      {/* Database sync status banner */}
      {!dbStatus.online && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">Sandbox Mode Active</span>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              Offline fallback is active. Changes made here will be saved locally.
            </p>
          </div>
        </div>
      )}

      {/* Main Settings Card */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 flex flex-col gap-6.5">

        {/* Profile Picture Upload Area */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-slate-400 font-mono">{getInitials()}</span>
              )}
            </div>

            {/* Quick Upload Hover overlay */}
            <button
              type="button"
              onClick={triggerFileInput}
              className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Profile Picture</h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5">JPEG, PNG, or WebP. Max size of 2MB.</p>

            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={triggerFileInput}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Upload Photo
              </button>
              {profilePicture && (
                <button
                  type="button"
                  onClick={removePicture}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 select-none ${dragActive
              ? 'border-blue-500 bg-blue-50/20'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
        >
          <Camera className={`h-5 w-5 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          <span className="text-[11px] font-bold text-slate-600">
            {dragActive ? 'Drop image here' : 'Drag and drop image here, or click to browse'}
          </span>
        </div>

        {/* Details Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[11.5px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 transition-colors font-semibold"
              placeholder="e.g. Kian Lok"
              required
            />
          </div>

          {/* Email Field (Read-only) */}
          <div className="flex flex-col gap-1.5 opacity-70">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Registered Email Address
            </label>
            <input
              type="email"
              value={userProfile?.email || ''}
              className="w-full text-[11.5px] bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 outline-none cursor-not-allowed font-semibold"
              readOnly
              disabled
            />
          </div>


        </div>

        {/* Preferences / Toggles Section */}
        <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">App Preferences</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Dark Mode Theme Selector */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs shrink-0">
                  {darkMode ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Dark Mode</span>
                  <span className="text-[9.5px] text-slate-450">Toggle dark theme interface</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMode ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Premium Membership Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs shrink-0">
                  <Crown className={`h-4 w-4 ${isPremium ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block flex items-center gap-1">
                    Premium Account {isPremium && <span className="bg-amber-100 text-amber-800 text-[8.5px] px-1.5 py-0.2 rounded-full font-bold">ACTIVE</span>}
                  </span>
                  <span className="text-[9.5px] text-slate-450">Simulate subscription features</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPremium(!isPremium)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPremium ? 'bg-amber-500' : 'bg-slate-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isPremium ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

          </div>
        </div>

        {/* Action Buttons & Status alerts */}
        <div className="border-t border-slate-100 pt-6 flex flex-col gap-3.5">

          {/* Status Message */}
          {status.type !== 'idle' && (
            <div className={`p-3 rounded-xl border text-[11px] font-semibold flex items-center gap-2 animate-fadeIn ${status.type === 'loading'
                ? 'bg-slate-50 border-slate-200 text-slate-655'
                : status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                  : 'bg-rose-50 border-rose-250 text-rose-800'
              }`}>
              {status.type === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : status.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-500" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                const prev = typeof window !== 'undefined' ? sessionStorage.getItem('career_os_prev_persona') : null;
                setActivePersona((prev as any) || 'candidate');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-655 font-bold text-[10.5px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authLoading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-[10.5px] uppercase tracking-wider px-7 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-2"
            >
              {authLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
