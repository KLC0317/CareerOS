'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { verifyPrerequisites, calculateHazardRate, SKILL_DAG } from '../lib/careerEngine';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { MapPin, DollarSign, Award, ChevronDown, ChevronUp, Check, Briefcase, HelpCircle, Activity, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobBoard() {
  const {
    jobs,
    candidateSkills,
    applications,
    applyToJob,
    searchQuery,
    setSearchQuery
  } = useCareerEngine();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedJobId(prev => (prev === id ? null : id));
  };

  // Filter jobs by keyword query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((job) =>
      job.role.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.requiredSkills.some(s => s.toLowerCase().includes(q))
    );
  }, [jobs, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Directory Intro and Search Bar */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Transparent Job Directory</h2>
          <p className="text-xs text-slate-500">
            Explore roles at regional leaders with fully transparent matching algorithms. No black-boxes: see exactly which skills are missing and inspect hazard calculations.
          </p>
        </div>

        {/* Keyword Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search jobs by title, company, location, or skills (e.g. AI Architect, Grab, PyTorch)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Directory Listings */}
      <div className="flex flex-col gap-4">
        {filteredJobs.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 bg-white text-center text-slate-400 italic text-xs">
            No jobs found matching "{searchQuery}". Try searching for different keywords.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isApplied = applications.includes(job.id);
            const isExpanded = expandedJobId === job.id;
            
            // Calculate Match Score
            const targetPathSkill = job.requiredSkills[0];
            const matchResult = verifyPrerequisites(candidateSkills, targetPathSkill);
            const matchPercent = Math.round(matchResult.percentage);

            // Calculate Hazard details
            const hazardResult = calculateHazardRate(
              24, // baseline assumption of 24 months
              candidateSkills,
              job.requiredSkills,
              true,
              true
            );

            return (
              <motion.div
                layout
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 border-slate-200 ${
                  isExpanded ? 'border-teal-500 shadow-md ring-2 ring-teal-500/5' : 'hover:border-slate-350 hover-card-trigger'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Job Title & Details */}
                  <div className="flex-1 flex gap-3 items-start">
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 shrink-0 mt-0.5">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold text-slate-800">{job.role}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="font-bold text-slate-700">{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}</span>
                        <span className="flex items-center gap-0.5"><DollarSign className="h-3.5 w-3.5 text-slate-400" /> {job.salary}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Apply Button */}
                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black font-mono ${
                        matchPercent >= 75 ? 'text-emerald-600' :
                        matchPercent >= 40 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {matchPercent}%
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">TKG Match</span>
                    </div>

                    <Button
                      variant={isApplied ? 'secondary' : 'primary'}
                      onClick={() => applyToJob(job.id)}
                      disabled={isApplied}
                      className="w-24 text-[11px]"
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500 font-bold" /> Applied
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </Button>

                    <button
                      onClick={() => toggleExpand(job.id)}
                      className="p-1.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Explainability Dropdown Panel with smooth sliding transition */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden w-full"
                    >
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-4 text-xs">
                        {/* Job Description */}
                        <div>
                          <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 font-mono">Role Description</h4>
                          <p className="text-slate-650 leading-relaxed">{job.description}</p>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Score Explainability Detail */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Skills Breakdown */}
                          <div className="flex flex-col gap-3">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-teal-600 flex items-center gap-1">
                              <Award className="h-3.5 w-3.5" />
                              TKG Trajectory Requirements
                            </h4>
                            <p className="text-slate-600 leading-normal text-[11px]">
                              The system parsed the <strong>{targetPathSkill}</strong> skill DAG. Your current profile covers {matchResult.met.length} of {matchResult.required.length} required prerequisites.
                            </p>

                            <div className="flex flex-col gap-2">
                              <div>
                                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Possessed Skills ({matchResult.met.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {matchResult.met.length === 0 ? (
                                    <span className="text-[10px] text-slate-400 italic">None</span>
                                  ) : (
                                    matchResult.met.map(s => (
                                      <span key={s} className="text-[9px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded-md font-mono">
                                        {s}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Missing Prerequisites ({matchResult.missing.length})</span>
                                <div className="flex flex-wrap gap-1">
                                  {matchResult.missing.length === 0 ? (
                                    <span className="text-[9px] text-emerald-600 font-bold italic">Perfect Match! All requirements met.</span>
                                  ) : (
                                    matchResult.missing.map(s => (
                                      <span key={s} className="text-[9px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-md font-mono">
                                        {s}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Math Diagnostics */}
                          <div className="flex flex-col gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-teal-600 flex items-center gap-1">
                              <Activity className="h-3.5 w-3.5" />
                              Transition Multiplier Forecast (SSMP)
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Based on your profile covariates (X) and assuming a standard 24-month tenure pressure (t = 24), the Semi-Markov hazard equation yields:
                            </p>

                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-550">Skill Covariate Multiplier (e^(β_skills • X_skills))</span>
                                <span className="font-mono text-slate-800 font-semibold">
                                  {Math.exp(0.8 * (matchResult.percentage / 100)).toFixed(2)}x
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-550">Total Covariate Multiplier</span>
                                <span className="font-mono text-blue-600 font-bold">
                                  {Math.exp(0.8 * (matchResult.percentage / 100) + 0.223 + 0.15 + 0.1).toFixed(2)}x
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] border-t border-slate-200 pt-1.5 mt-1">
                                <span className="text-blue-600 font-bold">Calculated Transition Rate λ(t)</span>
                                <span className="font-mono text-blue-600 font-bold">
                                  {hazardResult.hazardRate.toFixed(5)}
                                </span>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-550 leading-normal border-l-2 border-teal-200 pl-2">
                              <strong>Adjustment Rule:</strong> To scale your transition hazard, add missing requirements in your profile or timelines.
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
