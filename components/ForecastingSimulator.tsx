'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { calculateHazardRate, HazardResult } from '../lib/careerEngine';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Slider } from './ui/Slider';
import { BarChart3, HelpCircle, Activity, ChevronRight, BookOpen, UserCheck, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForecastingSimulator() {
  const {
    candidateSkills,
    candidateNodes
  } = useCareerEngine();

  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [educationMatch, setEducationMatch] = useState<boolean>(true);
  const [continuousTrack, setContinuousTrack] = useState<boolean>(true);
  
  const [selectedBranchIdx, setSelectedBranchIdx] = useState<number>(0);

  const currentRoleName = useMemo(() => {
    const employments = candidateNodes.filter(n => n.type === 'employment');
    if (employments.length === 0) return 'Freelance / Sabbatical';
    const sorted = [...employments].sort((a, b) => b.startDate.localeCompare(a.startDate));
    return sorted[0].role;
  }, [candidateNodes]);

  const paths = [
    {
      role: 'AI Architect',
      skills: ['AI Architect', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems'],
      description: 'Lead large-scale distributed AI infrastructure and training pipelines.'
    },
    {
      role: 'Engineering Director',
      skills: ['Engineering Director', 'Technical Leadership', 'Product Strategy', 'Agile Delivery', 'System Design'],
      description: 'Direct smart engineering teams, shape product delivery and system scaling.'
    },
    {
      role: 'Frontend Architect',
      skills: ['Frontend Architect', 'Advanced React', 'Performance Tuning', 'State Management', 'TypeScript'],
      description: 'Define web architectures, optimize client-side bundle performance and layouts.'
    }
  ];

  const simulationResults = useMemo(() => {
    return paths.map((path) => {
      const hazardData = calculateHazardRate(
        tenureMonths,
        candidateSkills,
        path.skills,
        educationMatch,
        continuousTrack
      );
      return {
        ...path,
        hazardData
      };
    });
  }, [tenureMonths, candidateSkills, educationMatch, continuousTrack]);

  const activePath = simulationResults[selectedBranchIdx];

  const sliderPeakIndicator = useMemo(() => {
    if (tenureMonths >= 18 && tenureMonths <= 36) {
      return {
        text: 'Peak Transition Hazard Zone (18 - 36 months)',
        color: 'bg-amber-50 border border-amber-200 text-amber-700 font-bold'
      };
    } else if (tenureMonths < 18) {
      return {
        text: 'Early Tenure Phase (Accumulating Experience)',
        color: 'bg-slate-50 border border-slate-150 text-slate-500 font-medium'
      };
    } else {
      return {
        text: 'Late Tenure Phase (Stagnation risk / Out-of-band pressure)',
        color: 'bg-rose-50 border border-rose-200 text-rose-700 font-bold'
      };
    }
  }, [tenureMonths]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Career Transition Simulator</h2>
        </div>
        <p className="text-xs text-slate-500">
          Simulate transition probabilities into next roles based on tenure and career factors. Drag the tenure slider to observe the hazard rate shift in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROL & HAZARD SLIDER */}
        <Card className="xl:col-span-1 flex flex-col gap-5 border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Activity className="h-4.5 w-4.5 text-blue-600" />
              Simulation Parameters
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 pt-0">
            {/* Tenure Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-700 font-semibold">Months in Current Role</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-md">
                  {tenureMonths} Months
                </span>
              </div>
              
              <Slider
                min={0}
                max={48}
                value={tenureMonths}
                onChange={setTenureMonths}
                className="my-3"
              />

              <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                <span>0m (Start)</span>
                <span>12m</span>
                <span>24m (Peak)</span>
                <span>36m</span>
                <span>48m (Late)</span>
              </div>

              {/* Peak Indicator */}
              <div className={`mt-3 text-[10px] text-center p-2 rounded-md ${sliderPeakIndicator.color}`}>
                <span>{sliderPeakIndicator.text}</span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Binary Covariates Toggle */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Environmental Variables</span>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-700 group-hover:text-blue-600 transition-colors">Academic Track Match</span>
                  <span className="text-[9px] text-slate-400">Degree matches technical track</span>
                </div>
                <input
                  type="checkbox"
                  checked={educationMatch}
                  onChange={(e) => setEducationMatch(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-700 group-hover:text-blue-600 transition-colors">Continuous Track</span>
                  <span className="text-[9px] text-slate-400">No major temporal gaps in TKG</span>
                </div>
                <input
                  type="checkbox"
                  checked={continuousTrack}
                  onChange={(e) => setContinuousTrack(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
              </label>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Note: Sabbatical skill compounding increases your <strong>Skill Pre-requisite Matches</strong>, which mathematically scales the transition multiplier e^(β • X).
            </div>
          </CardContent>
        </Card>

        {/* MIDDLE COLUMN: VISUAL PROBABILISTIC BRANCHING TREE */}
        <Card className="xl:col-span-1 flex flex-col justify-between border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Flame className="h-4.5 w-4.5 text-blue-600" />
              Role Transition Tree
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center items-center py-4 relative">
            <div className="absolute top-2 left-2 text-[10px] text-slate-400 italic">
              Click a branch path to inspect equations
            </div>

            <svg viewBox="0 0 500 300" className="w-full h-[260px] overflow-visible">
              <defs>
                <linearGradient id="active-teal-light" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="active-blue-light" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="muted-gray-light" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Connector Curves */}
              {simulationResults.map((result, idx) => {
                const prob = result.hazardData.transitionProbability;
                const yDests = [50, 150, 250];
                const yDest = yDests[idx];

                let strokeColor = 'url(#muted-gray-light)';
                let strokeHex = '#cbd5e1';
                if (prob >= 0.45) {
                  strokeColor = 'url(#active-teal-light)';
                  strokeHex = '#14b8a6';
                } else if (prob >= 0.20) {
                  strokeColor = 'url(#active-blue-light)';
                  strokeHex = '#2563eb';
                }

                const width = 1.5 + prob * 14;
                const opacity = 0.25 + prob * 0.75;
                const isSelected = selectedBranchIdx === idx;

                return (
                  <g key={result.role}>
                    <path
                      d={`M 60 150 C 200 150, 200 ${yDest}, 360 ${yDest}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={width}
                      strokeOpacity={opacity}
                      onClick={() => setSelectedBranchIdx(idx)}
                      className={`cursor-pointer transition-all duration-300 hover:stroke-blue-500 ${
                        isSelected ? 'stroke-blue-600 drop-shadow-[0_0_2px_rgba(37,99,235,0.3)]' : ''
                      }`}
                    />
                    {prob > 0.05 && (
                      <circle r={2 + prob * 3} fill={strokeHex}>
                        <animateMotion
                          path={`M 60 150 C 200 150, 200 ${yDest}, 360 ${yDest}`}
                          dur={`${(3.5 - prob * 2.8).toFixed(2)}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Starting Node */}
              <g transform="translate(60, 150)">
                <circle r="30" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" className="shadow-xs" />
                <circle r="6" fill="#2563eb" className="animate-pulse" />
                <foreignObject x="-60" y="34" width="120" height="40" className="overflow-visible pointer-events-none">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-800 text-center leading-tight">
                      {currentRoleName}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono font-bold mt-0.5">
                      Current Node
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* Destination Nodes */}
              {simulationResults.map((result, idx) => {
                const yDests = [50, 150, 250];
                const yDest = yDests[idx];
                const prob = result.hazardData.transitionProbability;
                const isSelected = selectedBranchIdx === idx;

                return (
                  <motion.g
                    key={`dest-${result.role}`}
                    transform={`translate(370, ${yDest})`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedBranchIdx(idx)}
                  >
                    <rect
                      x="0"
                      y="-18"
                      width="120"
                      height="36"
                      rx="6"
                      fill="#ffffff"
                      stroke={isSelected ? '#2563eb' : prob >= 0.45 ? '#14b8a6' : '#e2e8f0'}
                      strokeWidth={isSelected ? 2 : 1.2}
                      className="transition-colors duration-200 shadow-xs"
                    />
                    <text
                      x="110"
                      y="4"
                      textAnchor="end"
                      fill={prob >= 0.45 ? '#14b8a6' : prob >= 0.20 ? '#2563eb' : '#64748b'}
                      className="text-[10px] font-bold font-mono"
                    >
                      {Math.round(prob * 100)}%
                    </text>
                    <text
                      x="8"
                      y="4"
                      fill="#1e293b"
                      className="text-[9px] font-bold"
                    >
                      {result.role.substring(0, 15)}{result.role.length > 15 ? '..' : ''}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: "SHOW YOUR WORK" DIAGNOSTICS */}
        <Card className="xl:col-span-1 border-blue-200 bg-white">
          <CardHeader className="border-b border-blue-50 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700">
              <HelpCircle className="h-4.5 w-4.5" />
              Transition Formula Audit
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider font-mono">Active Target Branch</span>
              <h4 className="text-sm font-bold text-slate-800">{activePath.role}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{activePath.description}</p>
            </div>

            <hr className="border-slate-100" />

            {/* Calculations Breakdown */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold">Baseline Hazard Rate λ₀(t)</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {activePath.hazardData.baselineHazard.toFixed(5)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold">Total Hazard Transition λ(t)</span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {activePath.hazardData.hazardRate.toFixed(5)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-700 font-bold">Q-Quarter Probability</span>
                  <span className="text-[9px] text-blue-600/80">Probability of transition in 3mo</span>
                </div>
                <span className="text-sm font-mono font-bold text-blue-600">
                  {Math.round(activePath.hazardData.transitionProbability * 100)}%
                </span>
              </div>
            </div>

            {/* Covariates breakdown */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">SSMP Covariate Weightings (e^(β • X))</span>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {activePath.hazardData.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-md flex flex-col gap-1 shadow-xs"
                  >
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-700">{factor.label}</span>
                      <span className={factor.effect >= 0 ? 'text-emerald-600 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                        {factor.effect >= 0 ? `+${factor.effect}%` : `${factor.effect}%`}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight">
                      {factor.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
