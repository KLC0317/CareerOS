'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { verifyPrerequisites } from '../lib/careerEngine';
import {
  Users, Search, Clock, Briefcase, ArrowRight, Check, X,
  MapPin, Mail, GraduationCap, FileText, CheckCircle2, AlertCircle,
  SlidersHorizontal, Sparkles, CheckSquare, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Expanded Applicant Type for type-safety with CGPA & University credentials
interface Applicant {
  id: string;
  name: string;
  roleApplied: string;
  company: string;
  matchScore: number; // dynamically computed
  skillsMetCount: number;
  skillsTotalCount: number;
  metSkills: string[];
  missingSkills: string[];
  jobId: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected';
  trajectory: string;
  degreeAligned?: boolean;
  academicScore: number; // CGPA out of 4.0
  university: string;
}

const TOP_50_UNIVERSITIES = [
  'University of Malaya',
  'National University of Singapore',
  'Monash University',
  'Nanyang Technological University'
];

export default function EmployerDashboard() {
  const {
    candidateNodes,
    candidateSkills,
    jobs,
    applications,
    updateApplicationStatus,
    userProfile,
    phaseFilter,
    setPhaseFilter,
    selectedApplicantId,
    setSelectedApplicantId
  } = useCareerEngine();

  // Active Recruiter Filter States
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [minCgpa, setMinCgpa] = useState<number>(0.0);
  const [pastPosition, setPastPosition] = useState<string>('');
  const [requireTopUniversity, setRequireTopUniversity] = useState<boolean>(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Sync state from URL on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('q')) setCandidateSearch(params.get('q') || '');
      if (params.has('minScore')) setMinMatchScore(Number(params.get('minScore')) || 0);
      if (params.has('cgpa')) setMinCgpa(parseFloat(params.get('cgpa') || '0') || 0.0);
      if (params.has('past')) setPastPosition(params.get('past') || '');
      if (params.has('topUni')) setRequireTopUniversity(params.get('topUni') === 'true');
      if (params.has('kws')) {
        const k = params.get('kws');
        setSelectedKeywords(k ? k.split(',') : []);
      }
    }
  }, []);

  // Write changes to URL query parameters
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let changed = false;

      const updateParam = (key: string, value: string | null) => {
        if (value) {
          if (params.get(key) !== value) {
            params.set(key, value);
            changed = true;
          }
        } else {
          if (params.has(key)) {
            params.delete(key);
            changed = true;
          }
        }
      };

      updateParam('q', candidateSearch || null);
      updateParam('minScore', minMatchScore > 0 ? String(minMatchScore) : null);
      updateParam('cgpa', minCgpa > 0 ? String(minCgpa) : null);
      updateParam('past', pastPosition || null);
      updateParam('topUni', requireTopUniversity ? 'true' : null);
      updateParam('kws', selectedKeywords.length > 0 ? selectedKeywords.join(',') : null);

      if (changed) {
        window.history.pushState(null, '', `?${params.toString()}`);
      }
    }
  }, [candidateSearch, minMatchScore, minCgpa, pastPosition, requireTopUniversity, selectedKeywords]);

  // AI Prompt Search States
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiFiltersActive, setAiFiltersActive] = useState<boolean>(false);

  // Selected Applicant Inspection Drawer State
  const [activeDrawerTab, setActiveDrawerTab] = useState<'timeline' | 'skills' | 'resume'>('timeline');

  // Dynamic candidate name resolution
  const candidateName = useMemo(() => {
    return userProfile?.name || 'Kian Lok';
  }, [userProfile]);

  // 1. Build Applicants database list
  const allApplicants = useMemo((): Applicant[] => {
    const list: Applicant[] = [];

    // Map Candidate (You) applications with their real name (Kian Lok)
    applications.forEach((app) => {
      const job = jobs.find(j => j.id === app.jobId);
      if (job) {
        const matchInfo = verifyPrerequisites(candidateSkills, job.requiredSkills[0] || '');

        // Determine academic alignment dynamically
        const academicNode = candidateNodes.find(n => n.type === 'academic');
        const hasAcademicNode = !!academicNode;
        const candidateUni = academicNode?.organization || 'University of Malaya';

        // Parse CGPA from candidate nodes description, default to 3.85
        let candidateGpa = 3.85;
        if (academicNode && academicNode.description) {
          const gpaRegex = /([23]\.[0-9]{1,2}|4\.0)/;
          const match = academicNode.description.match(gpaRegex);
          if (match && match[1]) {
            candidateGpa = parseFloat(match[1]);
          }
        }

        list.push({
          id: `applicant-you-${job.id}`,
          name: candidateName,
          roleApplied: job.role,
          company: job.company,
          matchScore: Math.round(matchInfo.percentage),
          skillsMetCount: matchInfo.met.length,
          skillsTotalCount: matchInfo.required.length,
          metSkills: matchInfo.met,
          missingSkills: matchInfo.missing,
          jobId: job.id,
          status: app.status,
          degreeAligned: hasAcademicNode,
          academicScore: candidateGpa,
          university: candidateUni,
          trajectory: candidateNodes
            .filter(n => n.type === 'employment')
            .map(n => `${n.organization} (${n.role})`)
            .join(' ➔ ') || 'No employment history'
        });
      }
    });

    // Add mock applicants targeting various roles in our 100 jobs database
    list.push({
      id: 'applicant-1',
      name: 'Ahmad Rafiq',
      roleApplied: 'AI Architect',
      company: 'Petronas Digital',
      matchScore: 65,
      skillsMetCount: 4,
      skillsTotalCount: 6,
      metSkills: ['Deep Learning', 'PyTorch', 'Python', 'Linear Algebra'],
      missingSkills: ['AI Architect', 'System Architecture', 'Distributed Systems'],
      jobId: 'job-1',
      status: 'applied',
      degreeAligned: true,
      academicScore: 3.45,
      university: 'Universiti Teknologi Malaysia',
      trajectory: 'MIMOS (Senior SE) ➔ Grab (ML Engineer)'
    });

    list.push({
      id: 'applicant-2',
      name: 'Sarah Lim',
      roleApplied: 'Frontend Architect',
      company: 'Grab Tech',
      matchScore: 85,
      skillsMetCount: 6,
      skillsTotalCount: 7,
      metSkills: ['Advanced React', 'State Management', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Web Performance'],
      missingSkills: ['Frontend Architect', 'Performance Tuning', 'Browser Engines'],
      jobId: 'job-2',
      status: 'interviewing',
      degreeAligned: true,
      academicScore: 3.92,
      university: 'National University of Singapore',
      trajectory: 'Carsome (Frontend Dev) ➔ ShopBack (Senior Frontend)'
    });

    list.push({
      id: 'applicant-3',
      name: 'Vikram Naidu',
      roleApplied: 'Senior Data Engineer',
      company: 'Axiata Digital',
      matchScore: 90,
      skillsMetCount: 5,
      skillsTotalCount: 6,
      metSkills: ['Distributed Systems', 'Python', 'Linux', 'Cloud Computing', 'Apache Spark'],
      missingSkills: ['Data Pipelines'],
      jobId: 'job-6',
      status: 'applied',
      degreeAligned: true,
      academicScore: 3.75,
      university: 'Monash University',
      trajectory: 'Maxis (Data Engineer) ➔ Celcom (Senior Data Engineer)'
    });

    list.push({
      id: 'applicant-4',
      name: 'Chloe Tan',
      roleApplied: 'Senior React Developer',
      company: 'Carsome Tech',
      matchScore: 75,
      skillsMetCount: 4,
      skillsTotalCount: 5,
      metSkills: ['Advanced React', 'JavaScript', 'HTML/CSS', 'TypeScript'],
      missingSkills: ['State Management'],
      jobId: 'job-5',
      status: 'rejected',
      degreeAligned: false,
      academicScore: 3.10,
      university: "Taylor's University",
      trajectory: 'Fave (Web Developer) ➔ Zalora (Frontend Dev)'
    });

    list.push({
      id: 'applicant-5',
      name: 'Zulhasnan Kamil',
      roleApplied: 'Cloud Infrastructure Architect',
      company: 'TM ONE',
      matchScore: 80,
      skillsMetCount: 4,
      skillsTotalCount: 5,
      metSkills: ['Cloud Computing', 'Linux', 'Distributed Systems', 'System Architecture'],
      missingSkills: ['AWS'],
      jobId: 'job-7',
      status: 'offered',
      degreeAligned: true,
      academicScore: 3.65,
      university: 'TM College',
      trajectory: 'TM Networks (Network Specialist) ➔ Jaring (Cloud Eng)'
    });

    list.push({
      id: 'applicant-6',
      name: 'Elena Rostova',
      roleApplied: 'AI Engineer',
      company: 'Tech Giant (FAANG-tier)',
      matchScore: 95,
      skillsMetCount: 5,
      skillsTotalCount: 5,
      metSkills: ['Python', 'Deep Learning', 'PyTorch', 'Linux', 'Cloud Computing'],
      missingSkills: [],
      jobId: 'job-gen-0001',
      status: 'interviewing',
      degreeAligned: true,
      academicScore: 3.98,
      university: 'Nanyang Technological University',
      trajectory: 'Research Intern (NUS) ➔ ML Fellow (A*STAR)'
    });

    list.push({
      id: 'applicant-7',
      name: 'Marcus Tan',
      roleApplied: 'Technical Lead',
      company: 'Digital Banking Group',
      matchScore: 70,
      skillsMetCount: 3,
      skillsTotalCount: 5,
      metSkills: ['TypeScript', 'Software Engineering', 'System Design'],
      missingSkills: ['Technical Leadership', 'Agile Delivery'],
      jobId: 'job-gen-0025',
      status: 'applied',
      degreeAligned: false,
      academicScore: 3.25,
      university: 'Asia Pacific University',
      trajectory: 'Shopee (SE III) ➔ Grab (Senior SE)'
    });

    return list;
  }, [applications, jobs, candidateSkills, candidateNodes, candidateName]);

  // Compute recruitment phase counts based on active filters (excluding phase filter itself)
  const phaseCounts = useMemo(() => {
    const base = allApplicants.filter((app) => {
      // 1. Search Query filter (Name, applied role, or company)
      const q = candidateSearch.toLowerCase().trim();
      if (q && !(
        app.name.toLowerCase().includes(q) ||
        app.roleApplied.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q)
      )) return false;

      // 2. Minimum Match Relevance Score Slider
      if (app.matchScore < minMatchScore) return false;

      // 3. CGPA score threshold
      if (minCgpa > 0 && app.academicScore < minCgpa) return false;

      // 4. University top alignment
      if (requireTopUniversity) {
        const isTop = TOP_50_UNIVERSITIES.includes(app.university);
        if (!isTop) return false;
      }

      // 5. Past position query
      if (pastPosition) {
        const hasPastMatch = app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.company.toLowerCase().includes(pastPosition.toLowerCase());
        if (!hasPastMatch) return false;
      }

      // 6. Selected keywords toggle
      if (selectedKeywords.length > 0) {
        const hasAllKeywords = selectedKeywords.every((kw) => app.metSkills.includes(kw));
        if (!hasAllKeywords) return false;
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

    base.forEach(app => {
      if (app.status in counts) {
        counts[app.status as 'applied' | 'interviewing' | 'offered' | 'rejected'] += 1;
      }
    });

    return counts;
  }, [allApplicants, candidateSearch, minMatchScore, minCgpa, requireTopUniversity, pastPosition, selectedKeywords]);

  // Execute AI Search Filter API request
  const handleAiFilterSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/employer/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();

      if (res.ok && data.success && data.filters) {
        const filters = data.filters;

        // Auto-configure the dashboard filters based on AI extraction
        if (filters.minCgpa !== null) {
          setMinCgpa(filters.minCgpa);
        } else {
          setMinCgpa(0.0);
        }

        setRequireTopUniversity(!!filters.top50University);

        if (filters.pastRoles && filters.pastRoles.length > 0) {
          setPastPosition(filters.pastRoles[0]); // Take primary past company or title
        } else {
          setPastPosition('');
        }

        if (filters.skills && filters.skills.length > 0) {
          setSelectedKeywords(filters.skills);
        } else {
          setSelectedKeywords([]);
        }

        setAiExplanation(filters.explanation);
        setAiFiltersActive(true);
      }
    } catch (err) {
      // console.error('AI filter search failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear AI search parameters
  const clearAiSearch = () => {
    setAiPrompt('');
    setAiExplanation(null);
    setAiFiltersActive(false);
    setMinCgpa(0.0);
    setRequireTopUniversity(false);
    setPastPosition('');
    setSelectedKeywords([]);
    setMinMatchScore(0);
    setCandidateSearch('');
    setPhaseFilter('all');
  };

  // Select suggest query templates
  const selectQueryTemplate = (text: string) => {
    setAiPrompt(text);
  };

  // Filter & Score Applicants based on active controls
  const processedApplicants = useMemo(() => {
    const results = allApplicants.map((app) => {
      // If AI filters are active, calculate a dynamic AI Match Score
      let score = app.matchScore;

      if (aiFiltersActive) {
        let skillsPoints = 0;
        if (selectedKeywords.length > 0) {
          const matchedSkills = selectedKeywords.filter((kw) => app.metSkills.includes(kw));
          skillsPoints = (matchedSkills.length / selectedKeywords.length) * 50;
        } else {
          skillsPoints = 50; // no skills required in prompt, give full score
        }

        let cgpaPoints = 20;
        if (minCgpa > 0) {
          cgpaPoints = app.academicScore >= minCgpa ? 20 : (app.academicScore / minCgpa) * 20;
        }

        let uniPoints = 15;
        if (requireTopUniversity) {
          const isTop = TOP_50_UNIVERSITIES.includes(app.university);
          uniPoints = isTop ? 15 : 0;
        }

        let pastRolePoints = 15;
        if (pastPosition) {
          const matchedRole = app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) ||
            app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ||
            app.company.toLowerCase().includes(pastPosition.toLowerCase());
          pastRolePoints = matchedRole ? 15 : 0;
        }

        score = Math.round(skillsPoints + cgpaPoints + uniPoints + pastRolePoints);
      }

      return {
        ...app,
        matchScore: score
      };
    });

    // Apply Filter parameters
    return results.filter((app) => {
      // 1. Search Query filter (Name, applied role, or company)
      const q = candidateSearch.toLowerCase().trim();
      if (q && !(
        app.name.toLowerCase().includes(q) ||
        app.roleApplied.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q)
      )) return false;

      // 2. Minimum Match Relevance Score Slider
      if (app.matchScore < minMatchScore) return false;

      // 3. Pipeline Stage
      if (phaseFilter !== 'all' && app.status !== phaseFilter) return false;

      // 4. CGPA score threshold
      if (minCgpa > 0 && app.academicScore < minCgpa) return false;

      // 5. University top alignment
      if (requireTopUniversity) {
        const isTop = TOP_50_UNIVERSITIES.includes(app.university);
        if (!isTop) return false;
      }

      // 6. Past position query
      if (pastPosition) {
        const hasPastMatch = app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.company.toLowerCase().includes(pastPosition.toLowerCase());
        if (!hasPastMatch) return false;
      }

      // 7. Selected keywords toggle
      if (selectedKeywords.length > 0) {
        const hasAllKeywords = selectedKeywords.every((kw) => app.metSkills.includes(kw));
        if (!hasAllKeywords) return false;
      }

      return true;
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort best matches to top
  }, [allApplicants, candidateSearch, minMatchScore, phaseFilter, minCgpa, requireTopUniversity, pastPosition, selectedKeywords, aiFiltersActive]);

  // Selected inspected candidate summary
  const selectedApplicant = useMemo(() => {
    if (!selectedApplicantId) return null;
    return allApplicants.find(a => a.id === selectedApplicantId) || null;
  }, [allApplicants, selectedApplicantId]);

  // Toggle keyword filter selection manually
  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  // Safe client status update handler
  const handleStatusUpdate = async (applicantId: string, status: Applicant['status']) => {
    if (applicantId.startsWith('applicant-you')) {
      const jobId = applicantId.replace('applicant-you-', '');
      await updateApplicationStatus(jobId, status);
    } else {
      // In-memory mock update for demonstration
      const appIdx = allApplicants.findIndex(a => a.id === applicantId);
      if (appIdx !== -1) {
        allApplicants[appIdx].status = status;
        // Trigger dummy state re-render
        setSelectedApplicantId(applicantId);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">

      {/* Brand Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Talent Assessment Center</h2>
          <p className="text-[12px] text-slate-500 mt-1 max-w-lg">
            Audit matching scores, evaluate academic CGPA credentials, extract skills with Gemini search, and manage candidate pathways.
          </p>
        </div>
      </div>

      {/* Grid of Recruiter Analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Applicants',
            value: allApplicants.length,
            desc: 'Incoming candidate pool',
            iconClass: 'text-blue-500 dark:text-blue-400',
            icon: <Users className="h-4 w-4" />,
            iconBg: 'bg-blue-50/60 dark:bg-blue-900/20',
            cardStyle: 'kpi-card kpi-card-blue',
            numClass: 'text-blue-600 dark:text-blue-400'
          },
          {
            title: 'Evaluated Matches',
            value: processedApplicants.length,
            desc: 'Matching active filters',
            iconClass: 'text-purple-500 dark:text-purple-400',
            icon: <SlidersHorizontal className="h-4 w-4" />,
            iconBg: 'bg-purple-50/60 dark:bg-purple-900/20',
            cardStyle: 'kpi-card kpi-card-purple',
            numClass: 'text-purple-600 dark:text-purple-400'
          },
          {
            title: 'Strong Candidates',
            value: allApplicants.filter(a => a.matchScore >= 80 || a.academicScore >= 3.7).length,
            desc: 'CGPA ≥ 3.7 or high match',
            iconClass: 'text-emerald-500 dark:text-emerald-400',
            icon: <Award className="h-4 w-4" />,
            iconBg: 'bg-emerald-50/60 dark:bg-emerald-900/20',
            cardStyle: 'kpi-card kpi-card-emerald',
            numClass: 'text-emerald-600 dark:text-emerald-400'
          },
          {
            title: 'Active Interviews',
            value: allApplicants.filter(a => a.status === 'interviewing').length,
            desc: 'In-progress feedback loops',
            iconClass: 'text-amber-500 dark:text-amber-400',
            icon: <Clock className="h-4 w-4" />,
            iconBg: 'bg-amber-50/60 dark:bg-amber-900/20',
            cardStyle: 'kpi-card kpi-card-amber',
            numClass: 'text-amber-600 dark:text-amber-400'
          }
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-1 ${stat.cardStyle}`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">{stat.title}</span>
              <div className={`p-1.5 rounded-lg ${stat.iconBg}`}>
                <span className={stat.iconClass}>{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-black ${stat.numClass}`}>{stat.value}</span>
            </div>
            <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">{stat.desc}</span>
          </div>
        ))}
      </div>


      {/* AI Candidate Search Console */}
      <div className="ai-search-console rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col gap-3.5 border">
        {/* Glow grid background */}
        <div className="absolute inset-0 ai-search-grid pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black ai-search-title tracking-tight uppercase">AI Search Assistant</h3>
              <p className="text-[9.5px] ai-search-subtitle leading-none mt-0.5">Prompt target competencies and academic criteria</p>
            </div>

          </div>
          {aiFiltersActive && (
            <button
              onClick={clearAiSearch}
              className="text-[9.5px] bg-white hover:bg-slate-100 border border-slate-250 text-slate-550 hover:text-slate-850 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <X className="h-3 w-3" /> Clear AI Criteria
            </button>
          )}
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Find me a React developer from Monash with a CGPA > 3.6 who worked at Carsome..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiFilterSearch(); }}
              className="w-full text-[11.5px] bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all text-slate-800 shadow-2xs font-medium"
            />
          </div>
          <button
            onClick={handleAiFilterSearch}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10.5px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isAiLoading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Scan Applicants
              </>
            )}
          </button>
        </div>

        {/* Quick Suggest templates */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[9.5px]">
          <span className="font-semibold text-slate-400 uppercase tracking-wider font-mono">Suggested Searches:</span>
          {[
            'React architect from NUS with CGPA > 3.5',
            'AI Specialist with PyTorch and Deep Learning skills from a top 50 university',
            'Data Engineer skilled in Distributed Systems and Apache Spark who worked at Axiata'
          ].map((text) => (
            <button
              key={text}
              onClick={() => selectQueryTemplate(text)}
              className="text-blue-600 hover:text-blue-800 bg-blue-100/40 hover:bg-blue-100/70 border border-blue-200/50 px-2 py-0.5 rounded-md transition-all cursor-pointer font-medium"
            >
              "{text}"
            </button>
          ))}
        </div>

        {/* AI criteria explanation alert */}
        {aiFiltersActive && aiExplanation && (
          <div className="relative z-10 bg-white/80 border border-blue-150 rounded-xl p-3 text-[11px] text-slate-700 flex items-start gap-2.5 animate-fadeIn shadow-2xs">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-slate-800">Recruiter Assistant Summary:</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">{aiExplanation}</p>

              {/* Dynamic Filters parsed summary list */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {minCgpa > 0 && (
                  <span className="text-[8.5px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                    CGPA ≥ {minCgpa}
                  </span>
                )}
                {requireTopUniversity && (
                  <span className="text-[8.5px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                    Top 50 QS University
                  </span>
                )}
                {pastPosition && (
                  <span className="text-[8.5px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                    Past: {pastPosition}
                  </span>
                )}
                {selectedKeywords.map((kw) => (
                  <span key={kw} className="text-[8.5px] bg-blue-50 border border-blue-150 text-blue-600 px-2 py-0.5 rounded-md font-mono font-bold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Sidebar: Recruiter Filters */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 p-5 shrink-0 flex flex-col gap-5.5 shadow-2xs">

          {/* Candidate Search */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Filter Directory</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-455 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate name or role..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-semibold"
              />
              {candidateSearch && (
                <button
                  onClick={() => setCandidateSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CGPA Range Slider */}
          <div>
            <div className="flex justify-between items-baseline mb-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Minimum CGPA</h3>
              <span className="text-[11px] font-bold font-mono text-blue-650 bg-blue-50/50 px-1.5 py-0.5 rounded">{minCgpa.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={minCgpa}
              onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Past Position / Company Input */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Past Position / Company</h3>
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-455 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Grab, MIMOS, Senior..."
                value={pastPosition}
                onChange={(e) => setPastPosition(e.target.value)}
                className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-semibold"
              />
              {pastPosition && (
                <button
                  onClick={() => setPastPosition('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Qualification Filters */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireTopUniversity}
                onChange={(e) => setRequireTopUniversity(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Top 50 QS University</span>
            </label>
          </div>

          {/* Match Score Slider */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-baseline mb-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Min Match Score</h3>
              <span className="text-[11px] font-bold font-mono text-blue-650 bg-blue-50/50 px-1.5 py-0.5 rounded">{minMatchScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Dynamic extracted focus keyword filters */}
          {selectedKeywords.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-500" /> Active AI Keywords
              </h3>
              <div className="flex flex-wrap gap-1">
                {selectedKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className="text-[9px] px-2 py-1 rounded-lg border font-bold bg-blue-550 border-blue-550 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    {kw} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Filters */}
          {(candidateSearch || minMatchScore > 0 || phaseFilter !== 'all' || requireTopUniversity || minCgpa > 0 || pastPosition || selectedKeywords.length > 0) && (
            <button
              onClick={clearAiSearch}
              className="w-full mt-1 py-1.5 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}

        </aside>

        {/* Right Section: Compact Applicants Registry (Tabular HR Inbox) */}
        <main className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 flex flex-col gap-3">

          {/* Recruitment Phase Sub-Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none mb-2 gap-6">
            {[
              { key: 'all', label: 'All Applicants', count: phaseCounts.all },
              { key: 'applied', label: 'Applied', count: phaseCounts.applied },
              { key: 'interviewing', label: 'Interviewing', count: phaseCounts.interviewing },
              { key: 'offered', label: 'Offered', count: phaseCounts.offered },
              { key: 'rejected', label: 'Rejected', count: phaseCounts.rejected }
            ].map(tab => {
              const active = phaseFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setPhaseFilter(tab.key)}
                  className={`pb-2.5 relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[11px] font-bold tracking-wide transition-all border-b-2 -mb-[2px] ${active
                      ? 'text-slate-900 border-slate-900 font-extrabold'
                      : 'text-slate-400 border-transparent hover:text-slate-700'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-100 pb-2">
            <span>Showing <strong className="text-slate-800">{processedApplicants.length}</strong> of {allApplicants.length} applicants</span>
            <span>Click any candidate row to audit resume profile details</span>
          </div>

          {/* Compact Inbox Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11.5px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Target Role</th>
                  <th className="py-2.5 px-3">Applied Company</th>
                  <th className="py-2.5 px-3">University</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Relevance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 italic">No candidates match the specified filters.</td>
                  </tr>
                ) : (
                  processedApplicants.map((app) => {
                    const isSelected = selectedApplicantId === app.id;
                    const initials = app.name.split(' ').map(n => n[0]).join('');

                    // Color code match score pills
                    let scoreBadgeClass = 'bg-slate-50 text-slate-550 border-slate-200';
                    if (app.matchScore >= 80) scoreBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                    else if (app.matchScore >= 50) scoreBadgeClass = 'bg-blue-50 text-blue-700 border-blue-250';
                    else if (app.matchScore >= 25) scoreBadgeClass = 'bg-amber-50 text-amber-700 border-amber-250';

                    // Color code pipeline status badges
                    let statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200/60';
                    if (app.status === 'interviewing') statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200/60';
                    if (app.status === 'offered') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                    if (app.status === 'rejected') statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200/60';

                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApplicantId(app.id)}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/30' : ''
                          }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7.5 w-7.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate">{app.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-semibold truncate">{app.roleApplied}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium truncate">{app.company}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium truncate max-w-[150px]">{app.university}</td>
                        <td className="py-3 px-3 text-slate-600 font-bold font-mono">{app.academicScore.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 border rounded-full text-[9.5px] font-black font-mono ${scoreBadgeClass} flex items-center gap-1 w-fit`}>
                            {aiFiltersActive && <Sparkles className="h-2.5 w-2.5 text-blue-500" />}
                            {app.matchScore}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 border rounded text-[9.5px] font-bold capitalize ${statusBadgeClass}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplicantId(app.id);
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </main>

      </div>

      {/* Slide-out Applicant Inspection Detail Drawer */}
      <AnimatePresence>
        {selectedApplicant && (
          <>
            {/* Backdrop overlay - z-index elevated to z-[90] */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApplicantId(null)}
              className="fixed inset-0 bg-slate-900 z-[90] cursor-pointer"
            />

            {/* Slider Drawer Panel - z-index elevated to z-[100] */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col justify-between overflow-hidden"
            >

              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-150 flex flex-col gap-2 relative bg-slate-50/50">

                {/* Dismiss Drawer Button */}
                <button
                  onClick={() => setSelectedApplicantId(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                <div className="flex items-center gap-3 mt-1">
                  <div className="h-10 w-10 rounded-full bg-slate-200/80 border border-slate-300/80 flex items-center justify-center text-xs font-black text-slate-700 uppercase">
                    {selectedApplicant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedApplicant.name}</h3>
                    <p className="text-[10.5px] text-slate-500 leading-none mt-1">
                      Applied for: <strong className="text-slate-700">{selectedApplicant.roleApplied}</strong>
                    </p>
                  </div>
                </div>

                {/* Sub-details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9.5px] font-semibold text-slate-450 mt-1 border-t border-slate-200/60 pt-2.5">
                  <span className="flex items-center gap-1 text-slate-600"><Briefcase className="h-3.5 w-3.5 text-slate-400" /> {selectedApplicant.company}</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" /> {selectedApplicant.id.startsWith('applicant-you') ? userProfile.email : `${selectedApplicant.name.toLowerCase().replace(' ', '.')}@example.com`}</span>
                </div>

                {/* Tab select bar inside drawer */}
                <div className="flex gap-1.5 mt-3 border-t border-slate-150 pt-3">
                  {[
                    { key: 'timeline', label: 'Timeline & History', icon: <Clock className="h-3 w-3" /> },
                    { key: 'skills', label: 'Skills Audit', icon: <CheckSquare className="h-3 w-3" /> },
                    { key: 'resume', label: 'Resume Preview', icon: <FileText className="h-3 w-3" /> }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveDrawerTab(tab.key as any)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9.5px] font-bold border transition-colors cursor-pointer ${activeDrawerTab === tab.key
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDrawerTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                    className="h-full"
                  >

                    {/* Drawer Tab 1: OCR Timeline & History */}
                    {activeDrawerTab === 'timeline' && (
                      <div className="flex flex-col gap-4 text-left">

                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">Relevance match profile</h4>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="text-[10px] text-slate-500 font-medium">Matching Relevance Score</span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className={`text-lg font-black ${selectedApplicant.matchScore >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{selectedApplicant.matchScore}% Match</span>
                              </div>
                            </div>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border ${selectedApplicant.matchScore >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                              {selectedApplicant.matchScore >= 80 ? 'Excellent Match' : 'Standard Candidate'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-3.5">Verified Career Timeline</h4>

                          {selectedApplicant.id.startsWith('applicant-you') ? (
                            /* Candidate Timeline nodes mapped vertically */
                            <div className="relative border-l border-slate-200 pl-4.5 ml-2.5 flex flex-col gap-5.5 text-left">
                              {candidateNodes.map((ms, idx) => (
                                <div key={ms.id || idx} className="relative">
                                  <span className="absolute -left-[27px] top-0.5 h-4 w-4 rounded-full border bg-white flex items-center justify-center">
                                    {ms.type === 'academic' ? (
                                      <GraduationCap className="h-2 w-2 text-blue-500" />
                                    ) : ms.type === 'sabbatical' ? (
                                      <Clock className="h-2 w-2 text-amber-500" />
                                    ) : (
                                      <Briefcase className="h-2 w-2 text-teal-500" />
                                    )}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-baseline gap-2">
                                      <span className="text-[11.5px] font-bold text-slate-800 leading-snug">{ms.role}</span>
                                      <span className="text-[9px] font-bold font-mono text-slate-400 shrink-0">{ms.startDate} - {ms.endDate}</span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500">{ms.organization}</span>
                                    {ms.description && (
                                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">{ms.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Mock timelines */
                            <div className="relative border-l border-slate-200 pl-4.5 ml-2.5 flex flex-col gap-5.5 text-left">
                              {selectedApplicant.trajectory.split(' ➔ ').map((step, idx) => (
                                <div key={idx} className="relative">
                                  <span className="absolute -left-[27px] top-0.5 h-4 w-4 rounded-full border border-slate-300 bg-white flex items-center justify-center">
                                    <Briefcase className="h-2 w-2 text-teal-500" />
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[11.5px] font-bold text-slate-800 leading-snug">{step.split(' (')[0]}</span>
                                    <span className="text-[10px] font-semibold text-slate-500">{step.includes('(') ? step.substring(step.indexOf('(')) : 'Employment'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Drawer Tab 2: Skills Audit */}
                    {activeDrawerTab === 'skills' && (
                      <div className="flex flex-col gap-4 text-left">

                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5 text-emerald-650">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Met Skills ({selectedApplicant.skillsMetCount})
                          </h4>
                          {selectedApplicant.metSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 p-3.5 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                              {selectedApplicant.metSkills.map((s) => (
                                <span key={s} className="px-2.5 py-0.5 text-[9.5px] font-bold font-mono bg-emerald-50 border border-emerald-200/40 text-emerald-700 rounded-md">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10.5px] text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-xl text-center">No matching path skills verified.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5 text-slate-500">
                            <AlertCircle className="h-4 w-4 text-slate-400" /> Skills Needed ({selectedApplicant.missingSkills.length})
                          </h4>
                          {selectedApplicant.missingSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl">
                              {selectedApplicant.missingSkills.map((s) => (
                                <span key={s} className="px-2.5 py-0.5 text-[9.5px] font-bold font-mono bg-slate-50 border border-slate-200/60 text-slate-550 rounded-md">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1.5">
                              <Check className="h-4 w-4 text-emerald-500" />
                              This applicant completely matches all skill prerequisites!
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Drawer Tab 3: Resume Preview */}
                    {activeDrawerTab === 'resume' && (
                      <div className="flex flex-col gap-3 h-full">
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Original OCR Scanned Document</h4>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-serif text-[11px] text-left leading-relaxed text-slate-800 select-text max-h-[360px] overflow-y-auto custom-scrollbar shadow-inner bg-[radial-gradient(#e2e8f0_0.75px,transparent_0.75px)] bg-[size:12px_12px]">

                          {/* Resume Header */}
                          <div className="text-center border-b border-slate-350 pb-2 mb-3">
                            <h3 className="text-[13px] font-bold tracking-wide uppercase text-slate-900 font-serif">{selectedApplicant.name}</h3>
                            <p className="text-[9px] font-sans text-slate-500 font-medium mt-0.5">
                              {selectedApplicant.roleApplied} • {selectedApplicant.university}
                            </p>
                          </div>

                          {/* Summary */}
                          <div className="mb-3">
                            <h5 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-455 mb-1 border-b border-slate-200/80">Academic Credential Summary</h5>
                            <p className="italic text-slate-650">
                              Graduated from <strong>{selectedApplicant.university}</strong> with a final CGPA of <strong>{selectedApplicant.academicScore.toFixed(2)} / 4.0</strong>. Evaluated track is highly aligned with engineering requirements.
                            </p>
                          </div>

                          {/* Experience */}
                          <div className="mb-3">
                            <h5 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-455 mb-1 border-b border-slate-200/80">Professional Timeline</h5>
                            <div className="flex flex-col gap-2.5">
                              {selectedApplicant.id.startsWith('applicant-you') ? (
                                candidateNodes.map((node, nIdx) => (
                                  <div key={nIdx}>
                                    <div className="flex justify-between font-sans text-[10px] font-bold text-slate-900">
                                      <span>{node.role} at {node.organization}</span>
                                      <span className="font-mono text-slate-400">{node.startDate} - {node.endDate}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-0.5">{node.description || `Milestone as a specialist contributing to technical pipelines.`}</p>
                                  </div>
                                ))
                              ) : (
                                selectedApplicant.trajectory.split(' ➔ ').map((item, idx) => (
                                  <div key={idx}>
                                    <div className="flex justify-between font-sans text-[10px] font-bold text-slate-900">
                                      <span>{item.split(' (')[0]}</span>
                                      <span className="font-mono text-slate-400">{item.includes('(') ? item.substring(item.indexOf('(')) : 'Experience'}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Led implementation and engineering tasks aligned with targets.</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Skills list */}
                          <div>
                            <h5 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-455 mb-1 border-b border-slate-200/80">Key Competencies</h5>
                            <p className="font-sans text-[10px] text-slate-650 font-medium">
                              {selectedApplicant.metSkills.join(', ')}
                            </p>
                          </div>

                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Drawer Footer: Recruiter Stage Action Buttons */}
              <div className="p-5 border-t border-slate-150 bg-slate-50/50 flex flex-col gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Modify Recruitment Phase</span>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: 'applied', label: 'Applied', colorClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs' },
                    { key: 'interviewing', label: 'Interviewing', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs' },
                    { key: 'offered', label: 'Offered', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs' },
                    { key: 'rejected', label: 'Rejected', colorClass: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs' }
                  ].map((phase) => {
                    const isActive = selectedApplicant.status === phase.key;
                    return (
                      <button
                        key={phase.key}
                        onClick={() => handleStatusUpdate(selectedApplicant.id, phase.key as any)}
                        className={`py-2 text-[10px] font-black rounded-xl border text-center transition-all cursor-pointer ${isActive
                            ? phase.colorClass
                            : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-100'
                          }`}
                      >
                        {phase.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
