'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import {
  calculateCohortReadiness,
  SKILL_DAG,
  tailorCVForTarget,
  getPreRequisitesRecursive
} from '../lib/careerEngine';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, BookOpen, Award, Zap, AlertTriangle,
  CheckCircle, ChevronRight, Target, BarChart3, User, ArrowRight,
  Info, HelpCircle, ShieldAlert, Compass, X, Activity, Sliders, Search, ChevronDown
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReadinessLabel(score: number): { label: string; color: string; bg: string; border: string; desc: string } {
  if (score >= 75) return { label: 'Optimal Transition Phase', color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20', bg: 'bg-emerald-500', border: 'border-emerald-300 dark:border-emerald-800', desc: 'Your credentials align closely with successful historical cohorts. You are in the optimal transition window.' };
  if (score >= 50) return { label: 'Aligned Status', color: 'text-blue-750 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/20', bg: 'bg-blue-500', border: 'border-blue-300 dark:border-blue-900', desc: 'Solid baseline alignment. Profile shows competitive trajectory similarity.' };
  if (score >= 30) return { label: 'Upskilling Phase', color: 'text-amber-750 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20', bg: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-900', desc: 'Gaining core competencies. Additional domain-specific tenure is recommended.' };
  return { label: 'Initial Milestone Tracking', color: 'text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40', bg: 'bg-slate-400', border: 'border-slate-350 dark:border-slate-800', desc: 'Early trajectory phase. Accumulate fundamental tech milestones to establish alignment.' };
}

const FlowArrow = ({ active }: { active: boolean }) => (
  <div className="hidden md:flex items-center justify-center shrink-0 w-12 mx-1">
    <svg className="w-12 h-6 overflow-visible" viewBox="0 0 48 24">
      <path d="M 2 12 L 44 12" stroke="currentColor" className="text-slate-200 dark:text-slate-800 transition-colors" strokeWidth="2" strokeLinecap="round" />
      <motion.path d="M 2 12 L 44 12" stroke="url(#flowArrowGrad)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={active ? { pathLength: [0, 1], opacity: [0.3, 1, 0.3] } : { pathLength: 0, opacity: 0 }} transition={active ? { pathLength: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } } : {}} />
      {active && <motion.circle cx="2" cy="12" r="3" className="fill-blue-500 shadow-sm" animate={{ cx: [2, 44] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />}
      <path d="M 38 6 L 44 12 L 38 18" stroke="currentColor" className={`transition-colors duration-300 ${active ? 'text-blue-500' : 'text-slate-350 dark:text-slate-700'}`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="flowArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const VerticalFlowArrow = ({ active }: { active: boolean }) => (
  <div className="flex md:hidden items-center justify-center shrink-0 h-12 my-1">
    <svg className="h-12 w-6 overflow-visible" viewBox="0 0 24 48">
      <path d="M 12 2 L 12 44" stroke="currentColor" className="text-slate-200 dark:text-slate-800 transition-colors" strokeWidth="2" strokeLinecap="round" />
      <motion.path d="M 12 2 L 12 44" stroke="url(#flowArrowGradVert)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={active ? { pathLength: [0, 1], opacity: [0.3, 1, 0.3] } : { pathLength: 0, opacity: 0 }} transition={active ? { pathLength: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } } : {}} />
      {active && <motion.circle cx="12" cy="2" r="3" className="fill-blue-500" animate={{ cy: [2, 44] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />}
      <path d="M 6 38 L 12 44 L 18 38" stroke="currentColor" className={`transition-colors duration-300 ${active ? 'text-blue-500' : 'text-slate-350 dark:text-slate-700'}`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="flowArrowGradVert" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const PATHS = [
  {
    role: 'AI Architect',
    skills: ['AI Architect', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems'],
    description: 'Design and lead large-scale AI infrastructure and model deployment pipelines.',
    icon: Zap,
    iconColor: 'text-violet-650 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-950/30',
    accent: 'border-violet-200 dark:border-violet-900/40'
  },
  {
    role: 'Engineering Director',
    skills: ['Engineering Director', 'Technical Leadership', 'Product Strategy', 'Agile Delivery', 'System Design'],
    description: 'Lead engineering teams, shape technical strategy and delivery at scale.',
    icon: Award,
    iconColor: 'text-blue-655 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/30',
    accent: 'border-blue-200 dark:border-blue-900/40'
  },
  {
    role: 'Frontend Architect',
    skills: ['Frontend Architect', 'Advanced React', 'Performance Tuning', 'State Management', 'TypeScript'],
    description: 'Define web application architecture and drive front-end quality and performance.',
    icon: BarChart3,
    iconColor: 'text-teal-655 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-950/30',
    accent: 'border-teal-200 dark:border-teal-900/40'
  }
];

export default function ForecastingSimulator() {
  const { candidateSkills, candidateNodes, peerProfiles, userProfile } = useCareerEngine();

  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [educationMatch, setEducationMatch] = useState<boolean>(true);
  const [seniorityMatch, setSeniorityMatch] = useState<boolean>(true);
  
  // Custom track states
  const [customTargetRole, setCustomTargetRole] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Engine Flow animation modal state
  const [showEngineFlow, setShowEngineFlow] = useState<boolean>(false);
  const [activeEngineStep, setActiveEngineStep] = useState(0);

  useEffect(() => {
    if (!showEngineFlow) return;
    const interval = setInterval(() => {
      setActiveEngineStep(prev => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [showEngineFlow]);

  // Auto-align tenure if user has employment nodes
  const currentRoleName = useMemo(() => {
    const employments = candidateNodes.filter(n => n.type === 'employment');
    if (employments.length === 0) return 'Current Role';
    const sorted = [...employments].sort((a, b) => b.startDate.localeCompare(a.startDate));
    return sorted[0].role;
  }, [candidateNodes]);

  // Dynamically load selectable tracks: Profile Target + Presets + Custom Selection
  const selectableTracks = useMemo(() => {
    const list = [...PATHS];
    
    // 1. Inject candidate's target role from profile if set
    if (userProfile?.targetRole) {
      const alreadyExists = list.some(p => p.role.toLowerCase() === userProfile.targetRole.toLowerCase());
      if (!alreadyExists) {
        list.unshift({
          role: userProfile.targetRole,
          skills: [userProfile.targetRole, ...getPreRequisitesRecursive(userProfile.targetRole)],
          description: 'Your verified profile target trajectory.',
          icon: Target,
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/30 font-bold',
          accent: 'border-blue-200 dark:border-blue-900/40'
        });
      }
    }

    // 2. Inject custom explored role if chosen
    if (customTargetRole) {
      const alreadyExists = list.some(p => p.role.toLowerCase() === customTargetRole.toLowerCase());
      if (!alreadyExists) {
        list.push({
          role: customTargetRole,
          skills: [customTargetRole, ...getPreRequisitesRecursive(customTargetRole)],
          description: `Custom explored path for ${customTargetRole} from Trajectory Knowledge Graph.`,
          icon: Compass,
          iconColor: 'text-indigo-650 dark:text-indigo-400',
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
          accent: 'border-indigo-200 dark:border-indigo-900/40'
        });
      }
    }

    return list;
  }, [userProfile?.targetRole, customTargetRole]);

  // Adjust selection index when tracks change
  useEffect(() => {
    if (customTargetRole) {
      const customIdx = selectableTracks.findIndex(t => t.role === customTargetRole);
      if (customIdx !== -1) {
        setSelectedIdx(customIdx);
      }
    }
  }, [customTargetRole, selectableTracks]);

  // Filter skills list in dropdown based on user input
  const allAvailableSkills = useMemo(() => {
    // Only show roles/skills that exist in SKILL_DAG and have prerequisites (indicating they are career targets)
    return Object.keys(SKILL_DAG).filter(key => {
      const node = SKILL_DAG[key];
      return node.prerequisites && node.prerequisites.length > 0;
    });
  }, []);

  const filteredSkills = useMemo(() => {
    if (!searchQuery) return allAvailableSkills;
    return allAvailableSkills.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, allAvailableSkills]);

  // Compute dynamic cohort metrics & readiness scores for active selections
  const active = useMemo(() => {
    const path = selectableTracks[selectedIdx] || selectableTracks[0] || PATHS[0];
    const normalizedTarget = path.role.toLowerCase().trim();
    
    // Filter peers
    const matchedPeers = peerProfiles.filter(p => {
      const pRole = p.targetRole.toLowerCase().trim();
      return pRole === normalizedTarget || pRole.includes(normalizedTarget) || normalizedTarget.includes(pRole);
    });

    let finalPeers = matchedPeers;
    if (finalPeers.length < 20) {
      const overlap = peerProfiles.filter(p => {
        if (matchedPeers.includes(p)) return false;
        const overlapSkills = p.skills.filter(s => candidateSkills.includes(s));
        return overlapSkills.length >= 2;
      }).slice(0, 80);
      finalPeers = [...matchedPeers, ...overlap];
    }

    const successfulPeers = finalPeers.filter(p => p.reachedTarget);
    const successRate = finalPeers.length > 0
      ? Math.round((successfulPeers.length / finalPeers.length) * 100)
      : 72; // default fallback

    // Preceding milestone tenure peaks
    const precedingDurations = successfulPeers.map(p => {
      const targetIdx = p.milestones.findIndex(m => 
        m.role.toLowerCase().trim().includes(normalizedTarget) || 
        normalizedTarget.includes(m.role.toLowerCase().trim())
      );
      if (targetIdx > 0) {
        return p.milestones[targetIdx - 1].durationMonths;
      }
      if (p.milestones.length > 1) {
        return p.milestones[p.milestones.length - 2].durationMonths;
      }
      return 24; // default fallback
    });

    const medianMonths = precedingDurations.length > 0
      ? precedingDurations.sort((a, b) => a - b)[Math.floor(precedingDurations.length / 2)]
      : 24;

    const tailored = tailorCVForTarget(candidateNodes, candidateSkills, path.role);
    const tsmiScore = tailored.matchScore;

    const readiness = calculateCohortReadiness(
      tenureMonths,
      tsmiScore,
      educationMatch,
      seniorityMatch,
      medianMonths
    );

    return {
      ...path,
      successRate,
      totalCohortSize: finalPeers.length,
      medianMonths,
      readiness,
      tailored
    };
  }, [selectedIdx, selectableTracks, tenureMonths, candidateSkills, candidateNodes, educationMatch, seniorityMatch, peerProfiles]);

  const readinessLabel = getReadinessLabel(active.readiness.ctriScore);

  // Custom bell curve coordinates generator (SVG path)
  const bellCurvePath = useMemo(() => {
    const points: string[] = [];
    const M = active.medianMonths;
    const sigma = 12;
    for (let x = 0; x <= 48; x += 1.5) {
      const val = Math.exp(-0.5 * Math.pow((x - M) / sigma, 2));
      const svgX = (x / 48) * 320;
      const svgY = 85 - val * 65; // 20 to 85 range
      points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
    }
    return `M 0,85 L ${points.join(' L ')} L 320,85`;
  }, [active.medianMonths]);

  // Find user's Y coordinate on the bell curve
  const userDotCoords = useMemo(() => {
    const M = active.medianMonths;
    const x = Math.min(Math.max(tenureMonths, 0), 48);
    const val = Math.exp(-0.5 * Math.pow((x - M) / 12, 2));
    const svgX = (x / 48) * 320;
    const svgY = 85 - val * 65;
    return { x: svgX, y: svgY };
  }, [tenureMonths, active.medianMonths]);

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      
      {/* Header Panel - Sleek Minimal Banner */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-slate-700 dark:text-slate-400" />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-850 dark:text-white">Cohort Trajectory Alignment Engine</h2>
            <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5">Empirical comparison with historical transition datasets. Zero predictions.</p>
          </div>
        </div>
        <button
          onClick={() => setShowEngineFlow(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 transition-colors cursor-pointer shadow-xs"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-wider font-mono">How It Works</span>
        </button>
      </div>

      {/* Target Track Selection Dashboard - prevents info clustering */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Segmented Selector for Popular Tracks */}
          <div className="flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block mb-2">
              Select Active Trajectory
            </span>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-850">
              {selectableTracks.map((r, idx) => {
                const isActive = selectedIdx === idx;
                const isCustom = r.role === customTargetRole;
                return (
                  <div key={r.role} className={`flex items-center rounded-lg transition-all duration-200 border border-transparent ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 shadow-xs border-slate-200 dark:border-slate-700'
                        : ''
                    }`}>
                    <button
                      onClick={() => setSelectedIdx(idx)}
                      className={`py-2 px-3.5 text-center font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      <span>{r.role}</span>
                    </button>
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomTargetRole(null);
                          if (isActive) setSelectedIdx(0);
                        }}
                        className={`pr-2 py-2 flex items-center justify-center cursor-pointer transition-colors ${
                          isActive ? 'text-slate-400 hover:text-rose-500' : 'text-slate-400 hover:text-rose-500'
                        }`}
                        title="Remove custom trajectory"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search Dropdown Select for "Other Tracks" */}
          <div className="w-full md:w-64 relative">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block mb-2">
              Explore Other Tracks
            </span>
            
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{customTargetRole || "Search catalog..."}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-405 shrink-0" />
            </button>

            {/* Dropdown Options */}
            <AnimatePresence>
              {isSearchOpen && (
                <>
                  {/* Global overlay click blocker */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 left-0 mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden font-sans"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-900 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-white placeholder-slate-400"
                        autoFocus
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                      {filteredSkills.length > 0 ? (
                        filteredSkills.map(skill => (
                          <button
                            key={skill}
                            onClick={() => {
                              setCustomTargetRole(skill);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left py-1.5 px-2.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                          >
                            {skill}
                          </button>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-400 text-center py-4">No matching trajectories found.</div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Insights Grid - Clean, spacious cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Inputs Calibration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-5 shadow-xs flex flex-col gap-5">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-455 dark:text-slate-500 font-mono block">
              Parameter Calibration
            </span>

            {/* Polished Tenure Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-slate-455" />
                  Tenure in Current Position
                </span>
                <span className="text-[11px] font-mono font-extrabold text-blue-650 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900">
                  {tenureMonths} months
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={1}
                value={tenureMonths}
                onChange={e => setTenureMonths(Number(e.target.value))}
                className="w-full h-1 appearance-none bg-slate-100 dark:bg-slate-850 rounded-full outline-none cursor-pointer accent-blue-650"
                style={{ accentColor: '#2563eb' }}
              />
              <div className="flex justify-between text-[8.5px] text-slate-400 dark:text-slate-500 font-mono mt-2">
                <span>0m</span>
                <span>Cohort Peak ({active.medianMonths}m)</span>
                <span>48m</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900" />

            {/* Segmented Toggles */}
            <div className="flex flex-col gap-4">
              {/* Academic Segmented Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-bold text-slate-805 dark:text-slate-250">Academic Domain Match</span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono">Weight: 15%</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-150 dark:border-slate-850">
                  <button
                    onClick={() => setEducationMatch(true)}
                    className={`py-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      educationMatch 
                        ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs' 
                        : 'text-slate-455 hover:text-slate-800'
                    }`}
                  >
                    Aligned Track
                  </button>
                  <button
                    onClick={() => setEducationMatch(false)}
                    className={`py-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      !educationMatch 
                        ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs' 
                        : 'text-slate-455 hover:text-slate-800'
                    }`}
                  >
                    Divergent Track
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-900" />

              {/* Leadership Title Segmented Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-bold text-slate-805 dark:text-slate-250">Seniority Milestone Title Fit</span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-mono">Weight: 15%</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-150 dark:border-slate-850">
                  <button
                    onClick={() => setSeniorityMatch(true)}
                    className={`py-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      seniorityMatch 
                        ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs' 
                        : 'text-slate-455 hover:text-slate-800'
                    }`}
                  >
                    Lead/Senior Milestones
                  </button>
                  <button
                    onClick={() => setSeniorityMatch(false)}
                    className={`py-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      !seniorityMatch 
                        ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs' 
                        : 'text-slate-455 hover:text-slate-800'
                    }`}
                  >
                    Junior Title Track
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Analytics (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Readiness Alignment Header Card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-5 shadow-xs flex items-center justify-between gap-5 relative">
            <div className="flex-1 min-w-0">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-455 dark:text-slate-500 font-mono block mb-1">
                Jaccard Readiness Index
              </span>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${
                  active.readiness.ctriScore >= 75 ? 'from-emerald-500 to-teal-500' :
                  active.readiness.ctriScore >= 50 ? 'from-blue-500 to-indigo-500' :
                  active.readiness.ctriScore >= 30 ? 'from-amber-500 to-orange-500' :
                  'from-slate-500 to-slate-400'
                }`}>
                  {active.readiness.ctriScore}
                </span>
                <span className="text-xs text-slate-455 font-bold font-mono">/ 100 Alignment</span>
              </div>
              
              <div className={`inline-flex px-2.5 py-0.5 rounded text-[9.5px] font-extrabold font-mono border ${readinessLabel.color} mb-3`}>
                {readinessLabel.label}
              </div>

              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal max-w-sm">
                {readinessLabel.desc}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <button
                onClick={() => setShowEngineFlow(true)}
                className="py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-[9px] font-extrabold text-slate-650 dark:text-slate-350 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>View Engine Calculation</span>
              </button>
            </div>
          </div>

          {/* SVG Statistical Density Chart */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-900 pb-2.5 mb-3">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-455 dark:text-slate-500 font-mono">
                Tenure Density Curve
              </span>
              <span className="text-[9.5px] font-mono font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 border border-indigo-200 dark:border-indigo-800/50 rounded">
                Median Peak: {active.medianMonths}m
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-850 rounded-xl p-4 flex flex-col items-center">
              <div className="relative w-full max-w-[325px] h-[95px] mt-1 select-none">
                <svg viewBox="0 0 320 100" className="w-full h-full overflow-visible">
                  {/* Axis */}
                  <line x1="0" y1="85" x2="320" y2="85" className="stroke-slate-250 dark:stroke-slate-800" strokeWidth="1.5" />
                  
                  {/* Median indicator */}
                  <line 
                    x1={(active.medianMonths / 48) * 320} 
                    y1="15" 
                    x2={(active.medianMonths / 48) * 320} 
                    y2="85" 
                    className="stroke-blue-500/20" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 3" 
                  />

                  {/* Curve with premium gradient fill */}
                  <path
                    d={bellCurvePath}
                    fill="url(#bellCurveGradientRight)"
                    className="stroke-blue-600 dark:stroke-blue-500"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="bellCurveGradientRight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Candidate position vertical line with dot */}
                  <line 
                    x1={userDotCoords.x} 
                    y1={userDotCoords.y} 
                    x2={userDotCoords.x} 
                    y2="85" 
                    className="stroke-slate-400 dark:stroke-slate-700" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />
                  <g transform={`translate(${userDotCoords.x}, ${userDotCoords.y})`}>
                    <circle r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>

              {/* Axis labels */}
              <div className="flex justify-between w-full max-w-[325px] text-[8.5px] font-mono text-slate-400 dark:text-slate-550 mt-2 px-1">
                <span>0m</span>
                <span className="text-blue-605 font-bold">Optimal Window ({active.medianMonths}m)</span>
                <span>48m</span>
              </div>
            </div>

            {/* Timeline position description text */}
            <div className="mt-3 text-[10.5px] text-slate-550 dark:text-slate-455 leading-relaxed">
              {tenureMonths === active.medianMonths ? (
                <span>Your tenure aligns perfectly with the cohort transition peak of <strong className="text-emerald-650 dark:text-emerald-400 font-mono font-bold">{active.medianMonths} months</strong>.</span>
              ) : tenureMonths < active.medianMonths ? (
                <span>You are currently <strong className="text-blue-650 dark:text-blue-400 font-mono font-bold">{active.medianMonths - tenureMonths}m</strong> below the cohort median transition peak ({active.medianMonths}m).</span>
              ) : (
                <span>You are currently <strong className="text-amber-650 dark:text-amber-400 font-mono font-bold">{tenureMonths - active.medianMonths}m</strong> past the cohort median transition peak ({active.medianMonths}m).</span>
              )}
            </div>
          </div>

          {/* Competency Gap Analysis Columns (Legible lists) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-2.5 mb-3.5">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-455 dark:text-slate-500 font-mono">
                Trajectory Competency Gap Audit
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded ${
                active.readiness.tsmiScore >= 70 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                active.readiness.tsmiScore >= 40 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' :
                'bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
              }`}>
                TSMI Score: {active.readiness.tsmiScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Met Skills Column */}
              <div className="flex flex-col gap-2">
                <span className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-450 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Verified Prerequisites ({active.tailored.matchedKeywords.length})
                </span>
                
                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {active.tailored.matchedKeywords.length > 0 ? (
                    active.tailored.matchedKeywords.map((skill: string) => (
                      <div key={skill} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 text-[10.5px]">
                        <span className="text-slate-850 dark:text-slate-250 font-semibold">{skill}</span>
                        <span className="text-[9px] font-mono text-emerald-605 dark:text-emerald-400 font-bold">Verified</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 italic py-1">No matching target skills verified.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills Column */}
              <div className="flex flex-col gap-2">
                <span className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Acquisition Required ({active.tailored.missingKeywords.length})
                </span>

                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {active.tailored.missingKeywords.length > 0 ? (
                    active.tailored.missingKeywords.map((skill: string) => (
                      <div key={skill} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 text-[10.5px]">
                        <span className="text-slate-850 dark:text-slate-250 font-semibold">{skill}</span>
                        <span className="text-[9px] font-mono text-rose-600 dark:text-rose-500 font-bold">Unmet</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 text-[10.5px] text-emerald-700 dark:text-emerald-455 font-bold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>All competencies satisfied</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Engine Flow Modal */}
      <AnimatePresence>
        {showEngineFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEngineFlow(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm cursor-default"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500" />

              <div className="p-6 md:p-8 flex flex-col gap-6 relative overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1 max-w-[90%]">
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 font-mono tracking-widest">
                      Alignment Calculation Flow
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                      How Trajectory Matching Works
                    </h3>
                    <p className="text-xs text-slate-550 dark:text-slate-450 leading-normal">
                      Our engine continuously analyzes multi-dimensional signals to determine your transition readiness.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEngineFlow(false)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Animated Steps */}
                <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 py-2">
                  {/* Step 1: Baseline Match */}
                  <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeEngineStep === 0
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                    }`}>
                    <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={activeEngineStep === 0 ? {
                            scale: [1, 1.1, 1],
                            borderColor: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.4)']
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-14 h-14 rounded-full bg-white dark:bg-slate-950 border border-slate-200 flex items-center justify-center shadow-xs z-10"
                        >
                          <BookOpen className="h-6 w-6 text-blue-500" />
                        </motion.div>
                        {activeEngineStep === 0 && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 2.5, opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            className="absolute w-14 h-14 rounded-full border-2 border-blue-400"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className={`h-4 w-4 shrink-0 ${activeEngineStep === 0 ? 'text-blue-500' : 'text-slate-400'}`} />
                      <h4 className="text-xs font-bold tracking-tight">1. Academic & Title Scan</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Verifying formal education and past seniority titles. (30% weight)
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                    <FlowArrow active={activeEngineStep === 0} />
                    <VerticalFlowArrow active={activeEngineStep === 0} />
                  </div>

                  {/* Step 2: Competency TSMI */}
                  <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeEngineStep === 1
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                    }`}>
                    <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <motion.div
                          animate={activeEngineStep === 1 ? { width: ['0%', '100%', '0%'] } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="h-1 bg-teal-500 rounded-full w-0"
                        />
                        <motion.div
                          animate={activeEngineStep === 1 ? { width: ['0%', '75%', '0%'] } : {}}
                          transition={{ duration: 2, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="h-1 bg-indigo-500 rounded-full w-0"
                        />
                        <motion.div
                          animate={activeEngineStep === 1 ? { width: ['0%', '40%', '0%'] } : {}}
                          transition={{ duration: 2, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                          className="h-1 bg-blue-500 rounded-full w-0"
                        />
                        {activeEngineStep === 1 && (
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute right-4 text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono"
                          >
                            MATCH
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className={`h-4 w-4 shrink-0 ${activeEngineStep === 1 ? 'text-blue-500' : 'text-slate-400'}`} />
                      <h4 className="text-xs font-bold tracking-tight">2. Jaccard Index Matching</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
                      Comparing verified skills to expected path prerequisites. (45% weight)
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                    <FlowArrow active={activeEngineStep === 1} />
                    <VerticalFlowArrow active={activeEngineStep === 1} />
                  </div>

                  {/* Step 3: Tenure Curve */}
                  <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeEngineStep === 2
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                    }`}>
                    <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                      <div className="absolute inset-0 flex items-end justify-center p-2">
                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                          <motion.path
                            d="M 0,40 Q 25,40 50,10 T 100,40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-blue-400"
                            initial={{ pathLength: 0 }}
                            animate={activeEngineStep === 2 ? { pathLength: 1 } : { pathLength: 1 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          {activeEngineStep === 2 && (
                            <motion.circle
                              cx="50" cy="10" r="4"
                              className="fill-blue-600 dark:fill-blue-400"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className={`h-4 w-4 shrink-0 ${activeEngineStep === 2 ? 'text-blue-500' : 'text-slate-400'}`} />
                      <h4 className="text-xs font-bold tracking-tight">3. Tenure Density Curve</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
                      Evaluating transition timing against cohort bell curve. (25% weight)
                    </p>
                  </div>
                </div>

                {/* Mathematical Output */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">
                      Compounded Alignment Result
                    </span>
                    <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 break-all">
                      CTRI = 0.45(TSMI) + 0.25(S_ten) + 0.15(S_edu) + 0.15(S_gap)
                    </div>
                  </div>
                  <div className="shrink-0 text-center flex flex-col items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl shadow-xs">
                    <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-1">Readiness Score</span>
                    <span className="text-3xl font-black text-blue-650 dark:text-blue-400 leading-none">{active.readiness.ctriScore}</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 mt-1">
                  <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono tracking-widest">
                      Data Integrity Standard
                    </span>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-normal">
                      The Alignment Engine maps historical cohorts. All inputs are verifiable factors parsed from your professional experience, education history, and current tenure. <strong>Zero predictive hallucination.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
