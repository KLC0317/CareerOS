'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { calculateHazardRate } from '../lib/careerEngine';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, BookOpen, Award, Zap, AlertTriangle,
  CheckCircle, ChevronRight, Target, BarChart3, User, ArrowRight
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReadinessLabel(prob: number): { label: string; color: string; bg: string; border: string; desc: string } {
  if (prob >= 0.65) return { label: 'Highly Ready', color: 'text-emerald-700', bg: 'bg-emerald-500', border: 'border-emerald-300', desc: 'Your profile is well-positioned. Now is a strong time to move.' };
  if (prob >= 0.45) return { label: 'Ready', color: 'text-blue-700', bg: 'bg-blue-500', border: 'border-blue-300', desc: 'You have solid footing. A move in the next quarter is realistic.' };
  if (prob >= 0.25) return { label: 'Building Up', color: 'text-amber-700', bg: 'bg-amber-500', border: 'border-amber-300', desc: 'You are on the right track — a few more skills or months would help.' };
  return { label: 'Early Stage', color: 'text-slate-600', bg: 'bg-slate-400', border: 'border-slate-300', desc: 'Still early. Keep accumulating experience and skills in this role.' };
}

function getTimelineLabel(months: number): string {
  if (months <= 6) return 'Very Soon';
  if (months <= 12) return 'This Year';
  if (months <= 18) return 'Next Year';
  if (months <= 30) return 'In 2–3 Years';
  return 'Long Term';
}

function estimateBestMonths(targetSkills: string[], candidateSkills: string[], educationMatch: boolean, continuousTrack: boolean): number {
  // Find the tenure month that maximises transition probability
  let bestMonth = 12;
  let bestProb = 0;
  for (let m = 1; m <= 48; m++) {
    const r = calculateHazardRate(m, candidateSkills, targetSkills, educationMatch, continuousTrack);
    if (r.transitionProbability > bestProb) {
      bestProb = r.transitionProbability;
      bestMonth = m;
    }
  }
  return bestMonth;
}

// ─── Animated Arc Readiness Meter ─────────────────────────────────────────────

function ReadinessMeter({ probability, label, color }: { probability: number; label: string; color: string }) {
  const pct = Math.min(Math.max(probability, 0), 1);
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const strokeDash = circumference * pct;
  const colorMap: Record<string, string> = {
    'text-emerald-700': '#10b981',
    'text-blue-700': '#3b82f6',
    'text-amber-700': '#f59e0b',
    'text-slate-600': '#94a3b8'
  };
  const stroke = colorMap[color] || '#3b82f6';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 130 75" className="w-[160px] overflow-visible">
        {/* Track */}
        <path
          d="M 13 65 A 54 54 0 0 1 117 65"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Animated fill */}
        <motion.path
          d="M 13 65 A 54 54 0 0 1 117 65"
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        {/* Score */}
        <text x="65" y="60" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f172a">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</span>
    </div>
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── Impact Factor Card ───────────────────────────────────────────────────────

function FactorCard({ factor, index }: { factor: { label: string; effect: number; description: string }; index: number }) {
  const positive = factor.effect >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0"
    >
      <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        positive ? 'bg-emerald-50' : 'bg-rose-50'
      }`}>
        {positive
          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          : <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-800">{factor.label}</span>
          <span className={`text-[11px] font-black shrink-0 ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
            {positive ? '+' : ''}{factor.effect}%
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{factor.description}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PATHS = [
  {
    role: 'AI Architect',
    skills: ['AI Architect', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems'],
    description: 'Design and lead large-scale AI infrastructure and model deployment pipelines.',
    icon: Zap,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    accent: 'border-violet-200',
    barColor: 'bg-violet-500'
  },
  {
    role: 'Engineering Director',
    skills: ['Engineering Director', 'Technical Leadership', 'Product Strategy', 'Agile Delivery', 'System Design'],
    description: 'Lead engineering teams, shape technical strategy and delivery at scale.',
    icon: Award,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    accent: 'border-blue-200',
    barColor: 'bg-blue-500'
  },
  {
    role: 'Frontend Architect',
    skills: ['Frontend Architect', 'Advanced React', 'Performance Tuning', 'State Management', 'TypeScript'],
    description: 'Define web application architecture and drive front-end quality and performance.',
    icon: BarChart3,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    accent: 'border-teal-200',
    barColor: 'bg-teal-500'
  }
];

export default function ForecastingSimulator() {
  const { candidateSkills, candidateNodes } = useCareerEngine();

  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [educationMatch, setEducationMatch] = useState<boolean>(true);
  const [continuousTrack, setContinuousTrack] = useState<boolean>(true);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [animKey, setAnimKey] = useState(0);

  const currentRoleName = useMemo(() => {
    const employments = candidateNodes.filter(n => n.type === 'employment');
    if (employments.length === 0) return 'Current Role';
    const sorted = [...employments].sort((a, b) => b.startDate.localeCompare(a.startDate));
    return sorted[0].role;
  }, [candidateNodes]);

  const results = useMemo(() => {
    return PATHS.map(path => {
      const hazardData = calculateHazardRate(tenureMonths, candidateSkills, path.skills, educationMatch, continuousTrack);
      const peakMonth = estimateBestMonths(path.skills, candidateSkills, educationMatch, continuousTrack);
      return { ...path, hazardData, peakMonth };
    });
  }, [tenureMonths, candidateSkills, educationMatch, continuousTrack]);

  // Re-trigger animations when selection changes
  useEffect(() => { setAnimKey(k => k + 1); }, [selectedIdx, tenureMonths, educationMatch, continuousTrack]);

  const active = results[selectedIdx];
  const readiness = getReadinessLabel(active.hazardData.transitionProbability);
  const monthsUntilPeak = Math.max(0, active.peakMonth - tenureMonths);

  const tenurePhase = tenureMonths < 12
    ? { label: 'Early Phase', sub: 'You are still ramping up in this role.', color: 'text-slate-500' }
    : tenureMonths <= 36
    ? { label: 'Prime Window', sub: 'This is when most successful transitions happen.', color: 'text-blue-600' }
    : { label: 'Late Phase', sub: 'Long tenure can signal stagnation to recruiters.', color: 'text-rose-600' };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Career Transition Simulator</h2>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          See how ready you are to move into your next role — based on your skills, time in role, and career history. No jargon, just clear answers.
        </p>
      </div>

      {/* 3-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: Controls ── */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Time in Role slider */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">How long have you been in your current role?</span>
            </div>

            {/* Tenure display */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-black text-slate-900">{tenureMonths}</span>
              <span className="text-sm font-semibold text-slate-500">months</span>
              <span className="ml-auto text-[10px] font-bold font-mono px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                {tenureMonths < 12 ? `${tenureMonths}m` : `${(tenureMonths / 12).toFixed(1)}yr`}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={48}
              step={1}
              value={tenureMonths}
              onChange={e => setTenureMonths(Number(e.target.value))}
              className="w-full h-2 appearance-none bg-slate-100 rounded-full outline-none cursor-pointer accent-blue-600"
              style={{ accentColor: '#2563eb' }}
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
              <span>Just started</span>
              <span>1 year</span>
              <span>2 years</span>
              <span>3 years</span>
              <span>4 years</span>
            </div>

            {/* Phase indicator */}
            <div className="mt-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className={`text-[11px] font-bold ${tenurePhase.color}`}>{tenurePhase.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{tenurePhase.sub}</div>
            </div>
          </div>

          {/* About you toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">About you</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Education match toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">Your degree or qualifications fit the role</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">e.g. Computer Science, Engineering, or related field</div>
                </div>
                <button
                  onClick={() => setEducationMatch(v => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 mt-0.5 cursor-pointer ${
                    educationMatch ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                    animate={{ x: educationMatch ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="border-t border-slate-100" />

              {/* Continuous track toggle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">No major career gaps</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">You have been consistently employed or actively upskilling</div>
                </div>
                <button
                  onClick={() => setContinuousTrack(v => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 mt-0.5 cursor-pointer ${
                    continuousTrack ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                    animate={{ x: continuousTrack ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Skills summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">Your skills</span>
              <span className="ml-auto text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {candidateSkills.length} detected
              </span>
            </div>
            {candidateSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {candidateSkills.slice(0, 12).map(sk => (
                  <span key={sk} className="px-2 py-0.5 text-[9px] font-semibold font-mono bg-slate-50 border border-slate-200 text-slate-600 rounded-md">
                    {sk}
                  </span>
                ))}
                {candidateSkills.length > 12 && (
                  <span className="px-2 py-0.5 text-[9px] font-semibold font-mono bg-slate-100 text-slate-400 rounded-md">
                    +{candidateSkills.length - 12} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">No skills detected yet. Add milestones to your profile to improve accuracy.</p>
            )}
          </div>
        </div>

        {/* ── MIDDLE: Role selector + readiness panel ── */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Role cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Choose a target role</p>
            <div className="flex flex-col gap-2">
              {results.map((r, idx) => {
                const Icon = r.icon;
                const prob = r.hazardData.transitionProbability;
                const isActive = selectedIdx === idx;
                return (
                  <button
                    key={r.role}
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `${r.accent} bg-slate-50 shadow-sm`
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${r.iconBg}`}>
                      <Icon className={`h-4 w-4 ${r.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-slate-900">{r.role}</span>
                        <span className={`text-[11px] font-black ${getReadinessLabel(prob).color}`}>
                          {Math.round(prob * 100)}%
                        </span>
                      </div>
                      <AnimatedBar value={prob} maxValue={1} color={r.barColor} />
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readiness meter */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`meter-${selectedIdx}-${animKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center gap-3"
            >
              <ReadinessMeter
                probability={active.hazardData.transitionProbability}
                label={readiness.label}
                color={readiness.color}
              />
              <p className="text-[11px] text-slate-600 text-center leading-relaxed max-w-[220px]">
                {readiness.desc}
              </p>

              {/* When is the right time? */}
              <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800">Best time to move</span>
                </div>
                {monthsUntilPeak <= 0 ? (
                  <p className="text-[11px] text-emerald-700 font-semibold">You are already at or past your readiness peak.</p>
                ) : (
                  <p className="text-[11px] text-slate-600">
                    Around <strong className="text-blue-700">{monthsUntilPeak} more months</strong> ({getTimelineLabel(monthsUntilPeak)}) to reach your strongest position for this move.
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: What is holding you back / boosting you ── */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`details-${selectedIdx}-${animKey}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4"
            >
              {/* Role header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {React.createElement(active.icon, { className: `h-4 w-4 ${active.iconColor}` })}
                  <span className="text-sm font-bold text-slate-900">{active.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{active.description}</p>
              </div>

              <div className="border-t border-slate-100" />

              {/* Factors */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  What is helping or hurting your chances
                </p>
                <div className="flex flex-col">
                  {active.hazardData.factors.map((factor, idx) => (
                    <FactorCard key={idx} factor={factor} index={idx} />
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Action recommendation */}
              <div className={`p-3.5 rounded-xl border ${readiness.border} bg-opacity-40`} style={{ backgroundColor: readiness.bg.replace('bg-', '').includes('emerald') ? '#f0fdf4' : readiness.bg.includes('blue') ? '#eff6ff' : readiness.bg.includes('amber') ? '#fffbeb' : '#f8fafc' }}>
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 mb-0.5">What to do next</div>
                    {active.hazardData.transitionProbability >= 0.45 ? (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Start applying or reaching out to recruiters now. Your profile is competitive for <strong>{active.role}</strong> positions.
                      </p>
                    ) : active.hazardData.transitionProbability >= 0.25 ? (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Spend 3–6 more months building the skills below, then revisit. You are close to a strong readiness window.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Focus on gaining core skills and more hands-on experience in your current role before targeting <strong>{active.role}</strong>.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Missing skills */}
              {(() => {
                const targetRoleKey = active.skills[0];
                const missing = active.skills.slice(1).filter(s => !candidateSkills.includes(s));
                if (missing.length === 0) return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-emerald-700 font-semibold">You have all key skills for this role.</span>
                  </div>
                );
                return (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skills to acquire</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missing.map(s => (
                        <span key={s} className="px-2 py-0.5 text-[9px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
