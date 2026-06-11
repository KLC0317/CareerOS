'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { verifyPrerequisites } from '../lib/careerEngine';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, DollarSign, Check, Briefcase, Search, X,
  ChevronDown, ChevronUp, TrendingUp, AlertCircle,
  CheckCircle, Filter, SlidersHorizontal, ArrowRight,
  Building2, Star, Zap
} from 'lucide-react';

// ─── Match score helpers ───────────────────────────────────────────────────────

function getMatchTier(pct: number): {
  label: string; color: string; bg: string;
  border: string; barColor: string; description: string;
} {
  if (pct >= 80) return {
    label: 'Strong Match', color: 'text-emerald-700', bg: 'bg-emerald-50',
    border: 'border-emerald-200', barColor: 'bg-emerald-500',
    description: 'Your profile is well-aligned. You are a competitive applicant.'
  };
  if (pct >= 50) return {
    label: 'Good Match', color: 'text-blue-700', bg: 'bg-blue-50',
    border: 'border-blue-200', barColor: 'bg-blue-500',
    description: 'A solid fit with a few gaps. Worth applying while you upskill.'
  };
  if (pct >= 25) return {
    label: 'Partial Match', color: 'text-amber-700', bg: 'bg-amber-50',
    border: 'border-amber-200', barColor: 'bg-amber-400',
    description: 'Some alignment but notable skill gaps remain.'
  };
  return {
    label: 'Low Match', color: 'text-slate-500', bg: 'bg-slate-50',
    border: 'border-slate-200', barColor: 'bg-slate-300',
    description: 'Significant gap between your profile and this role.'
  };
}

// ─── Animated Match Bar ────────────────────────────────────────────────────────

function MatchBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  job, candidateSkills, application, onApply, onUpdateStatus, index
}: {
  job: any; candidateSkills: string[]; application?: any;
  onApply: () => void; onUpdateStatus: (status: any) => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const matchResult = verifyPrerequisites(candidateSkills, job.requiredSkills[0]);
  const pct = Math.round(matchResult.percentage);
  const tier = getMatchTier(pct);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
        expanded
          ? `${tier.border} shadow-sm`
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ── Compact card main row ── */}
      <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        
        {/* Role & Company meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <Building2 className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-slate-900 leading-snug truncate">{job.role}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-650">{job.company}</span>
              <span className="text-slate-350">•</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 shrink-0" /> {job.location}</span>
              {job.jobType && (
                <>
                  <span className="text-slate-350">•</span>
                  <span className="bg-slate-100/80 text-slate-600 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">{job.jobType}</span>
                </>
              )}
              {job.workMode && (
                <>
                  <span className="text-slate-355">•</span>
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">{job.workMode}</span>
                </>
              )}
              {job.experienceLevel && (
                <>
                  <span className="text-slate-355">•</span>
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">{job.experienceLevel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Salary, Match & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Salary & Match Pill */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
              {job.salary}
            </span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full ${tier.bg} ${tier.border}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${tier.barColor}`} />
              <span className={`text-[10px] font-black ${tier.color}`}>{pct}% Match</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {application ? (
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border cursor-default select-none ${
                application.status === 'interviewing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200/85'
                  : application.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border-rose-200/85'
                  : application.status === 'offered'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/85'
                  : 'bg-blue-50 text-blue-700 border-blue-200/85'
              }`}>
                {application.status === 'applied' ? 'Applied' :
                 application.status === 'interviewing' ? 'Interviewing' :
                 application.status === 'offered' ? 'Offered' : 'Rejected'}
              </div>
            ) : (
              <button
                onClick={onApply}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer"
              >
                Apply
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Expandable details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden bg-slate-50/40 border-t border-slate-100"
          >
            <div className="p-4 flex flex-col gap-4 text-left">
              
              {/* Role description */}
              <div>
                <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">About this role</h4>
                <p className="text-[11.5px] text-slate-655 leading-relaxed">{job.description}</p>
              </div>

              {/* Skills grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Met skills */}
                <div>
                  <h5 className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Met Skills ({matchResult.met.length})
                  </h5>
                  {matchResult.met.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {matchResult.met.map(s => (
                        <span key={s} className="px-2 py-0.5 text-[9px] font-bold font-mono bg-emerald-50 border border-emerald-200/50 text-emerald-700 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-slate-400 italic">No matching skills detected in your profile</p>
                  )}
                </div>

                {/* Missing skills */}
                <div>
                  <h5 className="text-[9.5px] font-bold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Skills to develop ({matchResult.missing.length})
                  </h5>
                  {matchResult.missing.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missing.map(s => (
                        <span key={s} className="px-2 py-0.5 text-[9px] font-bold font-mono bg-amber-50 border border-amber-200/50 text-amber-700 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> You meet all skill requirements!
                    </p>
                  )}
                </div>
              </div>

              {/* Roadmap Guidance & Timeline */}
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 shadow-xs">
                <Zap className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Action Plan & Timeline</h5>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {pct >= 80 ? `Highly competitive fit! Tailor your CV summary to emphasize ${matchResult.met.slice(0, 2).join(' and ')} and apply.` :
                     pct >= 50 ? `Solid fit. Consider building ${matchResult.missing.slice(0, 2).join(' or ')} to increase your match rate. Ready in 1–3 months.` :
                     pct >= 25 ? `Developing fit. Focus on closing core requirements: ${matchResult.missing.slice(0, 3).join(', ')}. Ready in 3–6 months.` :
                     `Significant gap. Start with simpler related tracks or use the Career Move Planner to plot a path. Ready in 6–12 months.`}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Collapsible side panel filter section helper
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

// ─── Main JobBoard ─────────────────────────────────────────────────────────────

export default function JobBoard() {
  const {
    jobs,
    candidateSkills,
    applications,
    applyToJob,
    updateApplicationStatus,
    searchQuery,
    setSearchQuery,
    activeStatusTab,
    setActiveStatusTab
  } = useCareerEngine();
  const [filterTier, setFilterTier] = useState<'all' | 'strong' | 'good' | 'partial'>('all');
  const [filterLocation, setFilterLocation] = useState<'all' | 'my' | 'sg' | 'remote'>('all');
  const [filterSalary, setFilterSalary] = useState<'all' | 'myr' | 'sgd'>('all');

  // Advanced filters state
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [datePostedFilter, setDatePostedFilter] = useState<'all' | '24h' | 'week' | 'month'>('all');

  // Compute tab counts based on current filters (excluding status filter itself)
  const statusCounts = useMemo(() => {
    const base = jobs.filter(job => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      if (q && !(
        job.role.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.requiredSkills.some((s: string) => s.toLowerCase().includes(q))
      )) return false;

      // 2. Match Tier Filter
      if (filterTier !== 'all') {
        const pct = Math.round(verifyPrerequisites(candidateSkills, job.requiredSkills[0]).percentage);
        if (filterTier === 'strong' && pct < 80) return false;
        if (filterTier === 'good' && (pct < 50 || pct >= 80)) return false;
        if (filterTier === 'partial' && pct >= 50) return false;
      }

      // 3. Location Filter
      if (filterLocation !== 'all') {
        const loc = job.location.toLowerCase();
        if (filterLocation === 'sg' && !loc.includes('singapore')) return false;
        if (filterLocation === 'my' && !loc.includes('malaysia') && !loc.includes('kl') && !loc.includes('selangor') && !loc.includes('pj') && !loc.includes('cyberjaya')) return false;
        if (filterLocation === 'remote' && !loc.includes('remote')) return false;
      }

      // 4. Salary/Currency Filter
      if (filterSalary !== 'all') {
        const sal = job.salary.toLowerCase();
        if (filterSalary === 'myr' && !sal.includes('rm')) return false;
        if (filterSalary === 'sgd' && !sal.includes('s$')) return false;
      }

      // 5. Job Type Filter
      if (selectedJobTypes.length > 0 && (!job.jobType || !selectedJobTypes.includes(job.jobType))) return false;
      // 6. Experience Level Filter
      if (selectedExpLevels.length > 0 && (!job.experienceLevel || !selectedExpLevels.includes(job.experienceLevel))) return false;
      // 7. Work Mode Filter
      if (selectedWorkModes.length > 0 && (!job.workMode || !selectedWorkModes.includes(job.workMode))) return false;

      // 8. Date Posted Filter
      if (datePostedFilter !== 'all') {
        if (!job.createdAt) return false;
        const createdDate = new Date(job.createdAt).getTime();
        const now = new Date().getTime();
        const diffMs = now - createdDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (datePostedFilter === '24h' && diffDays > 1) return false;
        if (datePostedFilter === 'week' && diffDays > 7) return false;
        if (datePostedFilter === 'month' && diffDays > 30) return false;
      }

      return true;
    });

    const counts = {
      all: base.length,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0
    };

    base.forEach(job => {
      const app = applications.find(a => a.jobId === job.id);
      if (app) {
        counts[app.status] += 1;
      }
    });

    return counts;
  }, [jobs, searchQuery, filterTier, filterLocation, filterSalary, selectedJobTypes, selectedExpLevels, selectedWorkModes, datePostedFilter, candidateSkills, applications]);

  // Filter + sort
  const processedJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      if (q && !(
        job.role.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.requiredSkills.some((s: string) => s.toLowerCase().includes(q))
      )) return false;

      // 2. Match Tier Filter
      if (filterTier !== 'all') {
        const pct = Math.round(verifyPrerequisites(candidateSkills, job.requiredSkills[0]).percentage);
        if (filterTier === 'strong' && pct < 80) return false;
        if (filterTier === 'good' && (pct < 50 || pct >= 80)) return false;
        if (filterTier === 'partial' && pct >= 50) return false;
      }

      // 3. Location Filter
      if (filterLocation !== 'all') {
        const loc = job.location.toLowerCase();
        if (filterLocation === 'sg' && !loc.includes('singapore')) return false;
        if (filterLocation === 'my' && !loc.includes('malaysia') && !loc.includes('kl') && !loc.includes('selangor') && !loc.includes('pj') && !loc.includes('cyberjaya')) return false;
        if (filterLocation === 'remote' && !loc.includes('remote')) return false;
      }

      // 4. Salary/Currency Filter
      if (filterSalary !== 'all') {
        const sal = job.salary.toLowerCase();
        if (filterSalary === 'myr' && !sal.includes('rm')) return false;
        if (filterSalary === 'sgd' && !sal.includes('s$')) return false;
      }

      // 5. Applied / Status Tab Filter
      const app = applications.find(a => a.jobId === job.id);
      if (activeStatusTab !== 'all') {
        if (!app || app.status !== activeStatusTab) return false;
      }

      // 6. Job Type Filter
      if (selectedJobTypes.length > 0) {
        if (!job.jobType || !selectedJobTypes.includes(job.jobType)) return false;
      }

      // 7. Experience Level Filter
      if (selectedExpLevels.length > 0) {
        if (!job.experienceLevel || !selectedExpLevels.includes(job.experienceLevel)) return false;
      }

      // 8. Work Mode Filter
      if (selectedWorkModes.length > 0) {
        if (!job.workMode || !selectedWorkModes.includes(job.workMode)) return false;
      }

      // 9. Date Posted Filter
      if (datePostedFilter !== 'all') {
        if (!job.createdAt) return false;
        const createdDate = new Date(job.createdAt).getTime();
        const now = new Date().getTime();
        const diffMs = now - createdDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (datePostedFilter === '24h' && diffDays > 1) return false;
        if (datePostedFilter === 'week' && diffDays > 7) return false;
        if (datePostedFilter === 'month' && diffDays > 30) return false;
      }

      return true;
    });

    // Default sort by match percentage
    filtered.sort((a, b) => {
      const pctA = verifyPrerequisites(candidateSkills, a.requiredSkills[0]).percentage;
      const pctB = verifyPrerequisites(candidateSkills, b.requiredSkills[0]).percentage;
      return pctB - pctA;
    });

    return filtered;
  }, [jobs, searchQuery, filterTier, filterLocation, filterSalary, candidateSkills, applications, selectedJobTypes, selectedExpLevels, selectedWorkModes, datePostedFilter, activeStatusTab]);

  const totalJobs = jobs.length;
  const strongMatches = jobs.filter(j =>
    verifyPrerequisites(candidateSkills, j.requiredSkills[0]).percentage >= 80
  ).length;

  return (
    <div className="flex flex-col gap-6">

      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Job Directory</h2>
          <p className="text-[12px] text-slate-500 mt-1 max-w-lg">
            Explore positions mapped to your exact technical credentials. Inspect requirements, missing skills, and timelines.
          </p>
        </div>

        {/* Simple Stats badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-center px-4.5 py-2 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-base font-black text-slate-900">{totalJobs}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Positions</div>
          </div>
          <div className="text-center px-4.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
            <div className="text-base font-black text-emerald-700">{strongMatches}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Strong Matches</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Filter Panel Sidebar */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 shrink-0 flex flex-col gap-5">
          
          {/* Keyword Search */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Role, company or skill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-slate-855 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Match Strength */}
          <FilterSection title="Match Strength">
            <div className="flex flex-col gap-1">
              {([
                { key: 'all', label: 'All Match Levels' },
                { key: 'strong', label: 'Strong (80%+)' },
                { key: 'good', label: 'Good (50–79%)' },
                { key: 'partial', label: 'Partial (<50%)' }
              ] as const).map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilterTier(item.key)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filterTier === item.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {filterTier === item.key && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Job Type (Multi-select Checklist) */}
          <FilterSection title="Job Type" defaultOpen={false}>
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => {
              const isChecked = selectedJobTypes.includes(type);
              return (
                <label key={type} className="flex items-center gap-2.5 text-[11.5px] text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedJobTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      );
                    }}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{type}</span>
                </label>
              );
            })}
          </FilterSection>

          {/* Experience Level (Multi-select Checklist) */}
          <FilterSection title="Experience Level" defaultOpen={false}>
            {['Entry', 'Mid', 'Senior', 'Lead', 'Executive'].map((level) => {
              const isChecked = selectedExpLevels.includes(level);
              return (
                <label key={level} className="flex items-center gap-2.5 text-[11.5px] text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedExpLevels(prev =>
                        prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
                      );
                    }}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{level}</span>
                </label>
              );
            })}
          </FilterSection>

          {/* Work Mode (Multi-select Checklist) */}
          <FilterSection title="Work Mode" defaultOpen={false}>
            {['On-site', 'Hybrid', 'Remote'].map((mode) => {
              const isChecked = selectedWorkModes.includes(mode);
              return (
                <label key={mode} className="flex items-center gap-2.5 text-[11.5px] text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedWorkModes(prev =>
                        prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
                      );
                    }}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{mode}</span>
                </label>
              );
            })}
          </FilterSection>

          {/* Date Posted */}
          <FilterSection title="Date Posted" defaultOpen={false}>
            {([
              { key: 'all', label: 'Anytime' },
              { key: '24h', label: 'Past 24 hours' },
              { key: 'week', label: 'Past week' },
              { key: 'month', label: 'Past month' }
            ] as const).map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 text-[11.5px] text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                <input
                  type="radio"
                  name="datePosted"
                  checked={datePostedFilter === item.key}
                  onChange={() => setDatePostedFilter(item.key)}
                  className="border-slate-300 text-slate-900 focus:ring-slate-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </FilterSection>

          {/* Region / Location */}
          <FilterSection title="Location" defaultOpen={false}>
            <div className="flex flex-col gap-1">
              {[
                { key: 'all', label: 'All Regions' },
                { key: 'my', label: 'Malaysia' },
                { key: 'sg', label: 'Singapore' },
                { key: 'remote', label: 'Remote / Hybrid' }
              ].map(loc => (
                <button
                  key={loc.key}
                  onClick={() => setFilterLocation(loc.key as any)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filterLocation === loc.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span>{loc.label}</span>
                  {filterLocation === loc.key && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Currency / Salary */}
          <FilterSection title="Currency" defaultOpen={false}>
            <div className="flex flex-col gap-1">
              {[
                { key: 'all', label: 'All Currencies' },
                { key: 'myr', label: 'MYR (RM)' },
                { key: 'sgd', label: 'SGD (S$)' }
              ].map(sal => (
                <button
                  key={sal.key}
                  onClick={() => setFilterSalary(sal.key as any)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filterSalary === sal.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span>{sal.label}</span>
                  {filterSalary === sal.key && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Clear filters shortcut */}
          {(filterTier !== 'all' || filterLocation !== 'all' || filterSalary !== 'all' || searchQuery || selectedJobTypes.length > 0 || selectedExpLevels.length > 0 || selectedWorkModes.length > 0 || datePostedFilter !== 'all') && (
            <button
              onClick={() => {
                setFilterTier('all');
                setFilterLocation('all');
                setFilterSalary('all');
                setSearchQuery('');
                setSelectedJobTypes([]);
                setSelectedExpLevels([]);
                setSelectedWorkModes([]);
                setDatePostedFilter('all');
              }}
              className="w-full mt-1 py-1.5 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear Active Filters
            </button>
          )}

        </aside>

        {/* Right Side: Available Jobs Stream */}
        <main className="flex-1 min-w-0 w-full flex flex-col gap-3">
          
          {/* Status Sub-Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none mb-2 gap-6">
            {[
              { key: 'all', label: 'All Positions', count: statusCounts.all },
              { key: 'applied', label: 'Applied', count: statusCounts.applied },
              { key: 'interviewing', label: 'Interviewing', count: statusCounts.interviewing },
              { key: 'offered', label: 'Offered', count: statusCounts.offered },
              { key: 'rejected', label: 'Rejected', count: statusCounts.rejected }
            ].map(tab => {
              const active = activeStatusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatusTab(tab.key as any)}
                  className={`pb-2.5 relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[11px] font-bold tracking-wide transition-all border-b-2 -mb-[2px] ${
                    active
                      ? 'text-slate-900 border-slate-900 font-extrabold'
                      : 'text-slate-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Search/Filters Info */}
          {(searchQuery || filterTier !== 'all' || filterLocation !== 'all' || filterSalary !== 'all' || selectedJobTypes.length > 0 || selectedExpLevels.length > 0 || selectedWorkModes.length > 0 || datePostedFilter !== 'all') && (
            <div className="text-[11px] text-slate-500 px-1">
              Showing <strong className="text-slate-800">{processedJobs.length}</strong> of {totalJobs} roles matching criteria.
            </div>
          )}

          {/* Job Card list */}
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {processedJobs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-14 text-center bg-white border border-slate-200 rounded-2xl"
                >
                  <div className="h-11 w-11 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No positions matched your filters</p>
                  <p className="text-[10.5px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Try broadening your region search, clearing queries, or checking other currencies.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterTier('all');
                      setFilterLocation('all');
                      setFilterSalary('all');
                      setSelectedJobTypes([]);
                      setSelectedExpLevels([]);
                      setSelectedWorkModes([]);
                      setDatePostedFilter('all');
                    }}
                    className="mt-3 text-[10.5px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </motion.div>
              ) : (
                processedJobs.map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    candidateSkills={candidateSkills}
                    application={applications.find(a => a.jobId === job.id)}
                    onApply={() => applyToJob(job.id)}
                    onUpdateStatus={(status) => updateApplicationStatus(job.id, status)}
                    index={idx}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

        </main>

      </div>
    </div>
  );
}

