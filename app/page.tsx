'use client';

import React, { useState, useEffect } from 'react';
import { useCareerEngine } from '@/hooks/useCareerEngine';
import CandidateDashboard from '@/components/CandidateDashboard';
import EmployerDashboard from '@/components/EmployerDashboard';
import JobBoard from '@/components/JobBoard';
import OnboardingWizard from '@/components/OnboardingWizard';
import ProfileSettings from '@/components/ProfileSettings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Briefcase, Users, LayoutDashboard,
  LogOut, Check, ArrowRight, Lock, Mail, User,
  AlertCircle, Settings, Clock, X
} from 'lucide-react';

export default function Page() {
  const {
    activePersona,
    setActivePersona,
    userProfile,
    authError,
    authLoading,
    setAuthError,
    login,
    loginDemo,
    register,
    forgotPassword,
    resetPassword,
    signOut,
    toast,
    setToast
  } = useCareerEngine();

  // Prevents hydration mismatch: server renders stable skeleton, client updates after mount
  const [mounted, setMounted] = useState(false);

  // Active form view: 'signin' | 'signup' | 'forgot' | 'reset'
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');

  // Input fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('AI Architect');
  const [resetToken, setResetToken] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Set mounted to true on first client render — prevents hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse token from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('reset-token');
      if (token) {
        setResetToken(token);
        setAuthView('reset');
      }
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!email.trim() || !password.trim()) {
      return;
    }
    const result = await login(email.trim(), password.trim());
    if (result.success) {
      setEmail('');
      setPassword('');
    }
  };

  const handleDemoLogin = async () => {
    setSuccessMessage(null);
    const result = await loginDemo();
    if (result.success) {
      setEmail('');
      setPassword('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }
    const result = await register(name.trim(), email.trim(), password.trim(), 'PENDING_ONBOARDING');
    if (result.success) {
      setName('');
      setEmail('');
      setPassword('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!email.trim()) return;

    const result = await forgotPassword(email.trim());
    if (result.success) {
      setSuccessMessage(result.message || 'Reset link sent. Check server logs.');
      if (result.token) {
        setResetToken(result.token);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (!resetToken.trim() || !password.trim()) return;

    const result = await resetPassword(resetToken.trim(), password.trim());
    if (result.success) {
      setSuccessMessage(result.message || 'Password successfully updated. You can now Sign In.');
      setAuthView('signin');
      setPassword('');
      setResetToken('');
    }
  };

  const switchView = (view: 'signin' | 'signup' | 'forgot' | 'reset') => {
    setAuthView(view);
    setAuthError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden">

      {/* Background Floating Blobs — only rendered client-side to prevent hydration mismatch */}
      {mounted && !userProfile.registered && (
        <>
          <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl pointer-events-none animate-float-delayed"></div>
        </>
      )}

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-50"></div>

      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">

          {/* Logo Brand — Left Column */}
          <div className="flex-1 min-w-[120px] flex items-center justify-start flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 flex-shrink-0">
                <img
                  src="/careeros.png"
                  alt="Career OS Logo"
                  className="absolute inset-0 h-full w-full object-contain rounded-lg dark:hidden"
                />
                <img
                  src="/careeros_dark.png"
                  alt="Career OS Logo"
                  className="absolute inset-0 h-full w-full object-contain rounded-lg hidden dark:block"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-none">
                  Career OS
                </span>
                <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider font-mono mt-0.5 hidden sm:inline">
                  Map the Graph. Master the Transition.
                </span>
              </div>
            </div>
          </div>

          {/* Nav Switcher — Center Column */}
          <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center shrink-0">
            {mounted && userProfile.registered && userProfile.targetRole !== 'PENDING_ONBOARDING' && (
              <nav className="flex items-center bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-xl p-1.5 border border-white/60 dark:border-slate-700/60 rounded-2xl relative gap-1 shadow-inner ring-1 ring-slate-900/5 dark:ring-white/5">

                <button
                  onClick={() => setActivePersona('candidate')}
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11.5px] font-extrabold tracking-wide transition-all duration-300 cursor-pointer group overflow-hidden ${activePersona === 'candidate' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
                    }`}
                >
                  {activePersona === 'candidate' && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] rounded-xl -z-10 border border-slate-100 dark:border-slate-600"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <LayoutDashboard className={`h-4 w-4 shrink-0 transition-colors ${activePersona === 'candidate' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`} />
                  <span className="relative z-10 truncate">
                    <span className="hidden md:inline">Candidate</span>
                    <span className="hidden lg:inline"> Workspace</span>
                  </span>
                </button>

                <button
                  onClick={() => setActivePersona('jobs')}
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11.5px] font-extrabold tracking-wide transition-all duration-300 cursor-pointer group overflow-hidden ${activePersona === 'jobs' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
                    }`}
                >
                  {activePersona === 'jobs' && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] rounded-xl -z-10 border border-slate-100 dark:border-slate-600"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Briefcase className={`h-4 w-4 shrink-0 transition-colors ${activePersona === 'jobs' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`} />
                  <span className="hidden md:inline relative z-10 truncate">Job Board</span>
                </button>

                <button
                  onClick={() => setActivePersona('employer')}
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11.5px] font-extrabold tracking-wide transition-all duration-300 cursor-pointer group overflow-hidden ${activePersona === 'employer' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
                    }`}
                >
                  {activePersona === 'employer' && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] rounded-xl -z-10 border border-slate-100 dark:border-slate-600"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Users className={`h-4 w-4 shrink-0 transition-colors ${activePersona === 'employer' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`} />
                  <span className="relative z-10 truncate">
                    <span className="hidden md:inline">Employer</span>
                    <span className="hidden lg:inline"> Portal</span>
                  </span>
                </button>

              </nav>
            )}
          </div>

          {/* Profile — Right Column (Last Login only appears on login page) */}
          <div className="flex-1 flex items-center gap-3 justify-end flex-shrink-0">
            {mounted && !userProfile.registered && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/40 bg-white/70 backdrop-blur-md shadow-sm mr-2"
              >
                {/* Small dot for extra visual flair */}
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse" />
                <span className="glow-dev-badge text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500">
                  Dev: Kian Lok
                </span>
              </motion.span>
            )}

            {userProfile.registered ? (
              <div className="relative">
                {/* Profile trigger button */}
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl border border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  {/* Avatar – gold ring when premium */}
                  <div className={`h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-xs shrink-0 bg-gradient-to-br ${userProfile.isPremium
                    ? 'from-amber-400 to-orange-500 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/60'
                    : 'from-blue-600 to-teal-500 shadow-md shadow-blue-500/20'
                    }`}>
                    {userProfile.profilePicture ? (
                      <img src={userProfile.profilePicture} alt="User Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (userProfile.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">{userProfile.name || 'User'}</span>
                    <span className="text-[9px] text-teal-650 font-bold font-mono uppercase leading-tight">
                      {userProfile.targetRole === 'PENDING_ONBOARDING' ? 'Onboarding...' : userProfile.targetRole}
                    </span>
                  </div>
                  {/* Chevron indicator */}
                  <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      {/* Click-away overlay */}
                      <div className="fixed inset-0 z-[60]" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 z-[70] overflow-hidden"
                      >
                        {/* Profile header section in dropdown */}
                        <div className={`px-4 pt-4 pb-3 border-b ${userProfile.isPremium
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
                          : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'
                          }`}>
                          <div className="flex items-center gap-3">
                            {/* Avatar – gold ring + gradient for premium */}
                            <div className={`h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm shrink-0 bg-gradient-to-br ${userProfile.isPremium
                              ? 'from-amber-400 to-orange-500 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
                              : 'from-blue-600 to-teal-500 shadow-md shadow-blue-500/20'
                              }`}>
                              {userProfile.profilePicture ? (
                                <img src={userProfile.profilePicture} alt="User Avatar" className="h-full w-full object-cover" />
                              ) : (
                                (userProfile.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 truncate">{userProfile.name}</span>
                                {/* Membership tier badge */}
                                {userProfile.isPremium ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase tracking-wide shrink-0">
                                    ✦ Premium
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-bold uppercase tracking-wide shrink-0">
                                    Member
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 truncate">{userProfile.email}</span>
                              <span className="text-[9px] font-bold font-mono uppercase text-teal-600 mt-0.5">{userProfile.targetRole}</span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Settings Link */}
                        <div className="p-2 border-b border-slate-100 flex flex-col gap-1">
                          <button
                            onClick={() => { setShowProfileMenu(false); setActivePersona('settings'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-150 cursor-pointer group text-left"
                          >
                            <div className="h-7 w-7 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
                              <Settings className="h-3.5 w-3.5 text-slate-550" />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-bold text-slate-800">Profile Settings</span>
                              <span className="text-[9px] text-slate-400">Account & theme preferences</span>
                            </div>
                          </button>
                        </div>

                        {/* Sign Out button */}
                        <div className="p-2">
                          <button
                            onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 cursor-pointer group"
                          >
                            <div className="h-7 w-7 rounded-lg bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                              <LogOut className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-bold">Sign Out</span>
                              <span className="text-[9px] text-rose-400">End current session</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>

        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <LogOut className="h-5.5 w-5.5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sign Out?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">You'll need to sign back in to access your career workspace.</p>
                </div>
              </div>

              {/* User info preview */}
              <div className="mx-6 mb-5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                  {(userProfile.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">{userProfile.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">{userProfile.email}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Stay Signed In
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); signOut(); window.location.replace('/'); }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" /> Confirm Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authLoading && (authView === 'signin' || authView === 'signup') && !userProfile.registered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xs p-8 flex flex-col items-center gap-4"
            >
              {/* Spinner */}
              <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />

              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">
                  {authView === 'signin' ? 'Authenticating' : 'Creating Account'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {authView === 'signin'
                    ? 'Verifying credentials...'
                    : 'Setting up your workspace...'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {userProfile.registered ? (
          userProfile.targetRole === 'PENDING_ONBOARDING' ? (
            <OnboardingWizard />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePersona}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {activePersona === 'candidate' && <CandidateDashboard />}
                {activePersona === 'employer' && <EmployerDashboard />}
                {activePersona === 'jobs' && <JobBoard />}
                {activePersona === 'settings' && <ProfileSettings />}
              </motion.div>
            </AnimatePresence>
          )
        ) : (
          /* AUTHENTICATION / LOGIN SHELL CONTAINER WITH ANIMATIONS */
          <div className="max-w-md mx-auto py-8 flex flex-col gap-6 relative z-10">

            {/* Centered Slogan Banner */}
            <div className="text-center max-w-sm mx-auto">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Career OS
              </h1>
              <p className="text-sm font-bold text-slate-650 mt-2">
                Map the Graph. Master the Transition.
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Navigate your career trajectory with mathematical precision. Explore open roles and audit flight risks.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={authView}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Card className="border-slate-200/80 shadow-2xl p-8 bg-white/95 backdrop-blur-md relative overflow-hidden hover-card-trigger">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-teal-500"></div>

                  {/* Header Title */}
                  <div className="text-center mb-5">
                    <div className="relative h-40 w-40 mx-auto mb-3">
                      <img
                        src="/careeros.png"
                        alt="Header Logo Light"
                        className="absolute inset-0 h-full w-full object-contain dark:hidden"
                      />
                      <img
                        src="/careeros_dark.png"
                        alt="Header Logo Dark"
                        className="absolute inset-0 h-full w-full object-contain hidden dark:block"
                      />
                    </div>

                    {authView === 'forgot' && (
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Reset Trajectory Key</h2>
                    )}
                    {authView === 'reset' && (
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Configure New Password</h2>
                    )}
                  </div>

                  {/* Last Login — only shown on the login page */}
                  {mounted && userProfile.lastLogin && !userProfile.registered && (
                    <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span suppressHydrationWarning>Last login: {new Date(userProfile.lastLogin).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Segmented Sliding Tab Switcher between Sign In and Sign Up */}
                  {(authView === 'signin' || authView === 'signup') && (
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 relative">
                      <button
                        type="button"
                        onClick={() => switchView('signin')}
                        className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-lg z-10 transition-colors duration-350 cursor-pointer ${authView === 'signin' ? 'text-slate-800' : 'text-slate-450 hover:text-slate-600'
                          }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => switchView('signup')}
                        className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-lg z-10 transition-colors duration-350 cursor-pointer ${authView === 'signup' ? 'text-slate-800' : 'text-slate-450 hover:text-slate-600'
                          }`}
                      >
                        Create Account
                      </button>
                      <div
                        className="absolute bg-white shadow-xs rounded-lg top-1 bottom-1 transition-all duration-300"
                        style={{
                          left: authView === 'signin' ? '4px' : 'calc(50% + 2px)',
                          width: 'calc(50% - 6px)'
                        }}
                      />
                    </div>
                  )}

                  {/* Notification Banners */}
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 p-3 bg-rose-50/80 border border-rose-250 text-rose-700 text-xs rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{authError}</span>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 p-3 bg-emerald-50/80 border border-emerald-250 text-emerald-700 text-xs rounded-lg flex flex-col gap-1 shadow-xs font-medium"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Success</span>
                      </div>
                      <span className="text-[11px] opacity-95">{successMessage}</span>
                      {resetToken && authView === 'forgot' && (
                        <button
                          onClick={() => switchView('reset')}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 text-left mt-2 flex items-center gap-1 cursor-pointer"
                        >
                          Use token "{resetToken.substring(0, 10)}..." to reset now <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Forms */}
                  {authView === 'signin' && (
                    <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="kianlok@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Mail className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => switchView('forgot')}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Lock className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div className="mt-2 w-full flex flex-col gap-2">
                        <Button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-2.5 font-bold"
                        >
                          {authLoading ? 'Signing In...' : 'Sign In'} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          onClick={handleDemoLogin}
                          disabled={authLoading}
                          className="w-full py-2.5 font-bold bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white shadow-md border-0"
                        >
                          Try Demo Account <Cpu className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </form>
                  )}

                  {authView === 'signup' && (
                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Kian Lok"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <User className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="kianlok@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Mail className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Lock className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        {/* Target Role Trajectory selection moved to Onboarding Wizard */}
                      </div>

                      <div className="mt-2 w-full">
                        <Button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-2.5 font-bold"
                        >
                          {authLoading ? 'Registering...' : 'Register Profile'} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </form>
                  )}

                  {authView === 'forgot' && (
                    <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="kianlok@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-855 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Mail className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 mt-2 font-bold"
                      >
                        {authLoading ? 'Generating Link...' : 'Generate Reset Link'} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}

                  {authView === 'reset' && (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Reset Token
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Paste reset token from email/logs"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-855 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <KeyIcon className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-slate-855 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-colors"
                          />
                          <Lock className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 mt-2 font-bold"
                      >
                        {authLoading ? 'Updating Password...' : 'Update Password'} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}

                  {/* Google OAuth Login option - rendered for Sign In / Sign Up */}
                  {(authView === 'signin' || authView === 'signup') && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-2">
                        <span className="h-px bg-slate-200/85 flex-1"></span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Or continue with</span>
                        <span className="h-px bg-slate-200/85 flex-1"></span>
                      </div>

                      <div className="mt-4 w-full">
                        <a
                          href="/api/auth/google"
                          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
                        >
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.38C21.68,11.77 21.56,11.37 21.35,11.1z" fill="#4285F4" />
                            <path d="M12,20.88c2.4,0 4.4,-0.8 5.88,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.48,0.98 -2.68,0 -4.95,-1.8 -5.76,-4.24H2.03v2.66C3.5,17.61 7.46,20.88 12,20.88z" fill="#34A853" />
                            <path d="M6.24,12.86C6.04,12.26 5.93,11.63 5.93,11c0,-0.63 0.11,-1.26 0.31,-1.86V6.48H2.03C1.36,7.83 1,9.37 1,11c0,1.63 0.36,3.17 1.03,4.52L6.24,12.86z" fill="#FBBC05" />
                            <path d="M12,5.13c1.3,0 2.47,0.45 3.39,1.33l2.54,-2.54C16.39,2.44 14.39,1.13 12,1.13c-4.54,0 -8.5,3.27 -9.97,7.39l4.21,3.24C6.24,7.52 9.32,5.13 12,5.13z" fill="#EA4335" />
                          </svg>
                          Google Account
                        </a>
                      </div>
                    </>
                  )}

                  {/* View toggle link buttons */}
                  <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs">
                    {(authView === 'forgot' || authView === 'reset') && (
                      <button
                        onClick={() => switchView('signin')}
                        className="font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/40 backdrop-blur-sm py-5 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative h-14 w-14 flex-shrink-0">
              <img
                src="/careeros.png"
                alt="Career OS Logo Light"
                className="absolute inset-0 h-full w-full object-contain dark:hidden"
              />
              <img
                src="/careeros_dark.png"
                alt="Career OS Logo Dark"
                className="absolute inset-0 h-full w-full object-contain hidden dark:block"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Career OS</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono text-center">
            © 2026 Career OS &nbsp;·&nbsp; A solution for <span className="text-teal-600 font-bold">TalentBank</span>
          </p>
          <p className="text-[10px] text-slate-400 italic text-center font-mono">
            Navigate your trajectory. Master the transition.
          </p>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3.5 pl-4 pr-3 py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white shadow-2xl shadow-teal-500/25 border border-teal-400/30 max-w-sm cursor-pointer select-none group"
            onClick={() => {
              if (toast.onClick) {
                toast.onClick();
              }
              setToast(null);
            }}
          >
            <div className="h-8 w-8 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-xs">
              <img
                src="/careeros.png"
                alt="Career OS Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[12.5px] font-medium leading-snug">
                Smart Move! See your job applications <span className="underline font-bold tracking-wide decoration-white/60 hover:decoration-white transition-all">here</span>
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(34,211,238,0.4)) drop-shadow(0 0 6px rgba(99,102,241,0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(34,211,238,0.9)) drop-shadow(0 0 16px rgba(99,102,241,0.7)); }
        }
        .glow-dev-badge span {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


// Inline icons for reset password key
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
