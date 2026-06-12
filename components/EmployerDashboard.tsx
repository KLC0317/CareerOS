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
  lastInstitution: string;
  experienceLevel: 'fresh' | 'experienced';
  jobType?: 'Full-time' | 'Part-time' | 'Internship';
  resumeText: string; // Comprehensive professional summary for AI semantic search
}

const TOP_50_UNIVERSITIES = [
  'University of Malaya',
  'National University of Singapore',
  'Monash University',
  'Nanyang Technological University'
];

export const CAREEROS_JOBS = [
  { id: 'cos-job-1', role: 'Senior Frontend Engineer', type: 'Full-time' as const, reqSkills: ['Advanced React', 'TypeScript', 'HTML/CSS'] },
  { id: 'cos-job-2', role: 'AI Architect', type: 'Full-time' as const, reqSkills: ['Deep Learning', 'PyTorch', 'System Architecture'] },
  { id: 'cos-job-3', role: 'Data Science Intern', type: 'Internship' as const, reqSkills: ['Python', 'Linear Algebra', 'Linux'] },
  { id: 'cos-job-4', role: 'Technical Support', type: 'Part-time' as const, reqSkills: ['Communication', 'Linux', 'Computer Networking'] },
  { id: 'cos-job-5', role: 'Product Manager', type: 'Full-time' as const, reqSkills: ['Agile Delivery', 'Product Strategy', 'Communication'] },
];

const MOCK_NAMES = [
  "Ahmad Rafiq", "Sarah Lim", "Vikram Naidu", "Chloe Tan", "Zulhasnan Kamil", "Elena Rostova", "Marcus Tan",
  "Nurul Huda", "Wei Chen", "Arun Kumar", "Maya Ali", "Jason Lee", "Siti Nurhaliza", "Devan Raj", "Rachel Wong",
  "Khairul Anwar", "Jessica Tan", "Prakash Rao", "Aisyah Rahman", "Kevin Chong", "Nadia Hassan", "Brian Ng",
  "Fatima Zahra", "Alex Lim", "Priya Sharma", "Omar Abdullah", "Michelle Yeoh", "Tengku Amir", "Cindy Ooi",
  "Zhi Hao", "Amina Binti", "David Teo", "Kumaravel", "Grace Fernandez", "Hafizuddin", "Lily Ong",
  "Suresh Krishnan", "Syuhada", "Benny Lau", "Anand Singh", "Nor Azian", "Ivy Chew", "Rajesh", "Amira",
  "Kenji", "Farhana", "Vincent", "Salmah", "Dennis", "Zara"
];

const TOP_MALAYSIAN_COMPANIES = [
  'Petronas', 'Maybank', 'CIMB Group', 'Tenaga Nasional', 'Maxis',
  'Axiata', 'Grab', 'AirAsia', 'Telekom Malaysia (TM)', 'Genting Group'
];

function generateCareerOSApplicants(topUnis: string[]): Applicant[] {
  const applicants: Applicant[] = [];

  // deterministic PRNG to keep the mock data stable across renders
  let seed = 12345;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 50; i++) {
    const job = CAREEROS_JOBS[i % CAREEROS_JOBS.length];

    // Pick name randomly
    const name = MOCK_NAMES[Math.floor(random() * MOCK_NAMES.length)];

    // Pick university with bias towards top unis
    const isTopUni = random() > 0.4; // 60% from top 50
    let uni = "";
    if (isTopUni) {
      uni = topUnis[Math.floor(random() * topUnis.length)];
    } else {
      const otherUnis = ["Asia Pacific University", "Taylor's University", "Multimedia University", "Sunway University", "Universiti Teknologi MARA"];
      uni = otherUnis[Math.floor(random() * otherUnis.length)];
    }

    const company = TOP_MALAYSIAN_COMPANIES[Math.floor(random() * TOP_MALAYSIAN_COMPANIES.length)];

    // Determine experience level based on job type. Interns are always fresh. 
    // Part-time and Full-time can be a mix, but heavily biased towards experienced for Senior roles.
    let experienceLevel: 'fresh' | 'experienced' = 'experienced';
    if (job.type === 'Internship') {
      experienceLevel = 'fresh';
    } else if (job.role.includes('Senior') || job.role.includes('Architect') || job.role.includes('Manager')) {
      experienceLevel = 'experienced';
    } else {
      experienceLevel = random() > 0.3 ? 'experienced' : 'fresh'; // 70% experienced
    }

    const lastInstitution = experienceLevel === 'fresh' ? uni : company;

    // Generate realistic skills met.
    const skillCount = job.reqSkills.length;
    let metCount = 0;
    const metSkills: string[] = [];
    const missingSkills: string[] = [];

    job.reqSkills.forEach(skill => {
      // 70% chance to have a skill
      if (random() > 0.3) {
        metSkills.push(skill);
        metCount++;
      } else {
        missingSkills.push(skill);
      }
    });

    // If they missed everything, give them at least one so it's not 0
    if (metCount === 0 && skillCount > 0) {
      metSkills.push(job.reqSkills[0]);
      missingSkills.splice(missingSkills.indexOf(job.reqSkills[0]), 1);
      metCount = 1;
    }

    // Realistic match score based on skills, experience alignment, and some randomness
    let baseScore = (metCount / skillCount) * 70; // up to 70 points from skills
    // up to 15 points from university
    if (isTopUni) baseScore += 10 + (random() * 5);
    // up to 15 points from randomness/other factors
    baseScore += random() * 15;

    const matchScore = Math.max(40, Math.min(Math.round(baseScore), 98)); // cap between 40 and 98

    // Realistic CGPA: Normal distribution approximation: 2.8 to 4.0
    const academicScore = Math.round((2.8 + (random() * 1.2)) * 100) / 100;

    // Realistic trajectory
    let trajectory = "";
    if (experienceLevel === 'fresh') {
      const pastRoles = ["Research Intern", "Student Developer", "Freelance Developer", "Final Year Project"];
      const degrees = ["BSc Computer Science", "BEng Software Engineering", "IT Degree"];
      const degree = degrees[Math.floor(random() * degrees.length)];
      const role = pastRoles[Math.floor(random() * pastRoles.length)];
      trajectory = `${uni} (${degree}) ➔ ${role}`;
    } else {
      const pastRoles1 = ["Junior Developer", "Associate", "Analyst", "Intern"];
      const pastRoles2 = ["Software Engineer", "Data Analyst", "Consultant", "Developer"];
      const pastRoles3 = ["Senior Engineer", "Lead Developer", "Specialist", "Manager"];

      const comp1 = TOP_MALAYSIAN_COMPANIES[Math.floor(random() * TOP_MALAYSIAN_COMPANIES.length)];
      let comp2 = TOP_MALAYSIAN_COMPANIES[Math.floor(random() * TOP_MALAYSIAN_COMPANIES.length)];
      if (comp2 === comp1) comp2 = "CIMB Group"; // avoid exact immediate duplicate

      const role1 = pastRoles1[Math.floor(random() * pastRoles1.length)];
      const role2 = pastRoles2[Math.floor(random() * pastRoles2.length)];
      const role3 = pastRoles3[Math.floor(random() * pastRoles3.length)];

      trajectory = `${comp1} (${role1}) ➔ ${comp2} (${role2}) ➔ ${company} (${role3})`;
    }

    // Comprehensive resume text for AI semantic search
    let resumeText = '';
    const achievementVerbs = ['Delivered', 'Spearheaded', 'Architected', 'Optimised', 'Implemented', 'Designed', 'Led', 'Built', 'Developed', 'Launched'];
    const verb = achievementVerbs[Math.floor(random() * achievementVerbs.length)];

    if (experienceLevel === 'fresh') {
      const freshAchievements = [
        `Built a real-time chatbot using Python and transformer models for final year project, achieving an F1-score of 0.89 on the Malaysian Customer Service dataset.`,
        `Developed a full-stack web application with React and Node.js for a hackathon, integrating a REST API and deploying on AWS EC2.`,
        `Contributed to open-source projects in machine learning and natural language processing. Published a research paper on sentiment analysis of Malaysian social media text.`,
        `Designed and deployed a microservices-based inventory system using Docker and Docker Compose for a university capstone project, reducing system downtime by 40%.`,
        `Implemented a data pipeline with Apache Airflow to automate data ingestion for a university research lab, processing over 2 million records weekly.`
      ];
      const freshLines = freshAchievements[Math.floor(random() * freshAchievements.length)];
      resumeText = `${name} is a motivated fresh graduate from ${uni} pursuing a ${trajectory.split(' ➔ ')[0].split('(')[1]?.replace(')', '') || 'Computer Science'} degree (CGPA: ${academicScore.toFixed(2)}/4.0). ${freshLines} Possesses strong foundations in ${metSkills.join(', ')} and eager to contribute to a fast-paced, innovative environment. Based in Kuala Lumpur, Malaysia.`;
    } else {
      const expAchievements = [
        `Architected a microservices platform on Kubernetes and Docker, scaling backend throughput to handle 500,000 daily active users.`,
        `Led a cross-functional agile team of 8 engineers at ${company}, delivering a new fintech API platform 2 weeks ahead of schedule.`,
        `Spearheaded the migration of a monolithic e-commerce application to a cloud-native architecture on Microsoft Azure, reducing infrastructure costs by 35%.`,
        `Developed and shipped three key product features using React and TypeScript, improving user retention by 22% as measured by A/B testing.`,
        `Built a real-time fraud detection pipeline using Apache Kafka and Python, processing over 1 million transactions per day with sub-50ms latency.`,
        `Managed a portfolio of B2B enterprise clients, conducting stakeholder management and roadmap planning sessions using Agile delivery methodologies.`
      ];
      const expLines = expAchievements[Math.floor(random() * expAchievements.length)];
      resumeText = `${name} is an experienced ${job.role} professional based in Malaysia, with a career spanning multiple leading Malaysian companies including ${trajectory.split(' ➔ ').slice(0, 2).map(s => s.split(' (')[0]).join(' and ')}. ${expLines} Core competencies include ${metSkills.join(', ')}. Holds a degree from ${uni} with a CGPA of ${academicScore.toFixed(2)}/4.0. Currently seeking senior-level opportunities in the Malaysian tech ecosystem.`;
    }

    applicants.push({
      id: `cos-app-${i}`,
      name,
      roleApplied: job.role,
      company: 'CareerOS',
      matchScore,
      skillsMetCount: metCount,
      skillsTotalCount: skillCount,
      metSkills,
      missingSkills,
      jobId: job.id,
      status: 'applied',
      degreeAligned: random() > 0.25, // 75% aligned
      academicScore,
      university: uni,
      trajectory,
      lastInstitution,
      experienceLevel,
      jobType: job.type,
      resumeText
    });
  }

  // Sort by match score descending to look naturally curated
  return applicants.sort((a, b) => b.matchScore - a.matchScore);
}

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
  const [aiResumeKeywords, setAiResumeKeywords] = useState<string[]>([]);
  const [requireDegreeAlignment, setRequireDegreeAlignment] = useState<boolean>(false);
  const [requireFullMatch, setRequireFullMatch] = useState<boolean>(false);
  const [experienceLevel, setExperienceLevel] = useState<'all' | 'fresh' | 'experienced'>('all');

  // Job Type & Job Openings selection
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | 'Full-time' | 'Part-time' | 'Internship'>('all');

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
      if (params.has('resKws')) {
        const r = params.get('resKws');
        setAiResumeKeywords(r ? r.split(',') : []);
      }
      if (params.has('degAlign')) setRequireDegreeAlignment(params.get('degAlign') === 'true');
      if (params.has('fullMatch')) setRequireFullMatch(params.get('fullMatch') === 'true');
      if (params.has('expLvl')) setExperienceLevel(params.get('expLvl') as any || 'all');
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
      updateParam('resKws', aiResumeKeywords.length > 0 ? aiResumeKeywords.join(',') : null);
      updateParam('degAlign', requireDegreeAlignment ? 'true' : null);
      updateParam('fullMatch', requireFullMatch ? 'true' : null);
      updateParam('expLvl', experienceLevel !== 'all' ? experienceLevel : null);

      if (changed) {
        window.history.pushState(null, '', `?${params.toString()}`);
      }
    }
  }, [candidateSearch, minMatchScore, minCgpa, pastPosition, requireTopUniversity, selectedKeywords, aiResumeKeywords, requireDegreeAlignment, requireFullMatch, experienceLevel]);

  // AI Prompt Search States
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiFiltersActive, setAiFiltersActive] = useState<boolean>(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null); // null = not active, [] = no results

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
            .join(' ➔ ') || 'No employment history',
          lastInstitution: (() => {
            const empNodes = candidateNodes.filter(n => n.type === 'employment');
            if (empNodes.length > 0) {
              const lastEmp = empNodes[empNodes.length - 1];
              if (!lastEmp.role.toLowerCase().includes('intern')) return lastEmp.organization;
              if (empNodes.length > 1) {
                const prevEmp = empNodes[empNodes.length - 2];
                if (!prevEmp.role.toLowerCase().includes('intern')) return prevEmp.organization;
              }
            }
            return candidateUni;
          })(),
          experienceLevel: candidateNodes.filter(n => n.type === 'employment' && !n.role.toLowerCase().includes('intern')).length > 0 ? 'experienced' : 'fresh',
          resumeText: [
            `${candidateName} is a Malaysian-based professional applying to the ${job.role} position.`,
            candidateNodes.filter(n => n.type === 'employment').map(n => `Worked at ${n.organization} as ${n.role}.`).join(' '),
            `Skills include: ${matchInfo.met.join(', ')}.`,
            academicNode ? `Graduated from ${academicNode.organization}.` : ''
          ].filter(Boolean).join(' ')
        });
      }
    });

    // Add 50 mock applicants targeting CareerOS active openings
    list.push(...generateCareerOSApplicants(TOP_50_UNIVERSITIES));

    return list;
  }, [applications, jobs, candidateSkills, candidateNodes, candidateName]);

  // Compute recruitment phase counts based on active filters (excluding phase filter itself)
  const phaseCounts = useMemo(() => {
    const isAiSemanticMode = aiFiltersActive && aiMatchedIds !== null;
    const base = allApplicants.filter((app) => {
      const q = candidateSearch.toLowerCase().trim();
      if (q && !(
        app.name.toLowerCase().includes(q) ||
        app.roleApplied.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q)
      )) return false;

      if (app.matchScore < minMatchScore) return false;
      if (selectedJobId !== 'all' && app.jobId !== selectedJobId) return false;
      if (jobTypeFilter !== 'all' && app.jobType !== jobTypeFilter) return false;

      if (isAiSemanticMode) return aiMatchedIds.includes(app.id);

      if (minCgpa > 0 && app.academicScore < minCgpa) return false;
      if (requireTopUniversity && !TOP_50_UNIVERSITIES.includes(app.university)) return false;
      if (pastPosition) {
        const hasPastMatch = app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.company.toLowerCase().includes(pastPosition.toLowerCase());
        if (!hasPastMatch) return false;
      }
      if (selectedKeywords.length > 0 && !selectedKeywords.every(kw => app.metSkills.includes(kw))) return false;
      if (requireDegreeAlignment && !app.degreeAligned) return false;
      if (requireFullMatch && app.missingSkills.length > 0) return false;
      if (experienceLevel !== 'all' && app.experienceLevel !== experienceLevel) return false;

      return true;
    });

    const counts = { all: base.length, applied: 0, interviewing: 0, offered: 0, rejected: 0 };
    base.forEach(app => {
      if (app.status in counts) counts[app.status as 'applied' | 'interviewing' | 'offered' | 'rejected'] += 1;
    });
    return counts;
  }, [allApplicants, candidateSearch, minMatchScore, minCgpa, requireTopUniversity, pastPosition, selectedKeywords, requireDegreeAlignment, requireFullMatch, experienceLevel, selectedJobId, jobTypeFilter, aiFiltersActive, aiMatchedIds]);

  // Execute AI Search Filter API request
  const handleAiFilterSearch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    // Clear stale URL params that would conflict with AI semantic mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      ['past', 'kws', 'resKws', 'cgpa', 'topUni', 'degAlign', 'fullMatch', 'expLvl'].forEach(k => params.delete(k));
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
    try {
      // Build compact candidate index for the LLM
      const candidateContext = allApplicants.map(app => ({
        id: app.id,
        name: app.name,
        role: app.roleApplied,
        jobType: app.jobType || '',
        experienceLevel: app.experienceLevel,
        skills: app.metSkills,
        missingSkills: app.missingSkills,
        cgpa: app.academicScore,
        university: app.university,
        trajectory: app.trajectory,
        lastInstitution: app.lastInstitution,
        resumeText: app.resumeText || ''
      }));

      const res = await fetch('/api/employer/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, candidates: candidateContext })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const filters = data.filters || {};

        // Apply structured filters from AI extraction
        setMinCgpa(filters.minCgpa ?? 0.0);
        setRequireTopUniversity(!!filters.top50University);
        // Don't set pastPosition from AI anymore — matchedIds handles it semantically
        setPastPosition('');
        setSelectedKeywords(filters.skills?.length > 0 ? filters.skills : []);
        setAiResumeKeywords(filters.resumeKeywords?.length > 0 ? filters.resumeKeywords : []);

        // Apply semantic matchedIds allowlist from LLM.
        // Always set a non-null array when AI is active so the filter knows it's in semantic mode.
        // An empty array means "zero genuine matches" — don't fall through to show everyone.
        setAiMatchedIds(Array.isArray(data.matchedIds) ? data.matchedIds : []);

        setAiExplanation(filters.explanation || null);
        setAiFiltersActive(true);
      }
    } catch (err) {
      // silent fail
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear AI search parameters
  const clearAiSearch = () => {
    setAiPrompt('');
    setAiExplanation(null);
    setAiFiltersActive(false);
    setAiMatchedIds(null);
    setMinCgpa(0.0);
    setRequireTopUniversity(false);
    setPastPosition('');
    setSelectedKeywords([]);
    setAiResumeKeywords([]);
    setMinMatchScore(0);
    setCandidateSearch('');
    setPhaseFilter('all');
    setRequireDegreeAlignment(false);
    setRequireFullMatch(false);
    setExperienceLevel('all');
    setSelectedJobId('all');
    setJobTypeFilter('all');
  };

  // Select suggest query templates
  const selectQueryTemplate = (text: string) => {
    setAiPrompt(text);
  };

  // Filter & Score Applicants based on active controls
  const processedApplicants = useMemo(() => {
    // When AI is active with matched IDs, use them as the primary semantic filter.
    // Only structural/UI controls (job tab, phase tab, search bar, match score) still apply on top.
    const isAiSemanticMode = aiFiltersActive && aiMatchedIds !== null;

    const results = allApplicants.map((app) => {
      let score = app.matchScore;

      if (isAiSemanticMode) {
        // Score = % of AI-matched position. Top of list if in aiMatchedIds.
        const rank = aiMatchedIds.indexOf(app.id);
        score = rank >= 0 ? Math.max(50, 98 - rank * 2) : app.matchScore;
      } else if (aiFiltersActive) {
        // AI active but no matchedIds — score by manual filter criteria
        let skillsPoints = selectedKeywords.length > 0
          ? (selectedKeywords.filter(kw => app.metSkills.includes(kw)).length / selectedKeywords.length) * 50
          : 50;
        let cgpaPoints = minCgpa > 0 ? (app.academicScore >= minCgpa ? 20 : (app.academicScore / minCgpa) * 20) : 20;
        let uniPoints = requireTopUniversity ? (TOP_50_UNIVERSITIES.includes(app.university) ? 15 : 0) : 15;
        let pastRolePoints = pastPosition
          ? (app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) || app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ? 15 : 0)
          : 15;
        score = Math.round(skillsPoints + cgpaPoints + uniPoints + pastRolePoints);
      }

      return { ...app, matchScore: score };
    });

    return results.filter((app) => {
      // --- Structural UI filters (always applied, even in AI mode) ---

      // Search box (name / role / company)
      const q = candidateSearch.toLowerCase().trim();
      if (q && !(
        app.name.toLowerCase().includes(q) ||
        app.roleApplied.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q)
      )) return false;

      // Match score slider
      if (app.matchScore < minMatchScore) return false;

      // Pipeline phase tab
      if (phaseFilter !== 'all' && app.status !== phaseFilter) return false;

      // Job opening sidebar selection
      if (selectedJobId !== 'all' && app.jobId !== selectedJobId) return false;

      // Job type tab
      if (jobTypeFilter !== 'all' && app.jobType !== jobTypeFilter) return false;

      // --- AI Semantic Mode: only the LLM allowlist applies ---
      if (isAiSemanticMode) {
        return aiMatchedIds.includes(app.id);
      }

      // --- Manual Sidebar Filters (only when AI is not in semantic mode) ---

      // CGPA threshold
      if (minCgpa > 0 && app.academicScore < minCgpa) return false;

      // Top university requirement
      if (requireTopUniversity && !TOP_50_UNIVERSITIES.includes(app.university)) return false;

      // Past position / company text search
      if (pastPosition) {
        const hasPastMatch =
          app.trajectory.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.roleApplied.toLowerCase().includes(pastPosition.toLowerCase()) ||
          app.company.toLowerCase().includes(pastPosition.toLowerCase());
        if (!hasPastMatch) return false;
      }

      // Skill keyword tags
      if (selectedKeywords.length > 0) {
        if (!selectedKeywords.every(kw => app.metSkills.includes(kw))) return false;
      }

      // Degree alignment
      if (requireDegreeAlignment && !app.degreeAligned) return false;

      // Full skill match
      if (requireFullMatch && app.missingSkills.length > 0) return false;

      // Experience level
      if (experienceLevel !== 'all' && app.experienceLevel !== experienceLevel) return false;

      return true;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [allApplicants, candidateSearch, minMatchScore, phaseFilter, minCgpa, requireTopUniversity, pastPosition, selectedKeywords, aiFiltersActive, aiMatchedIds, requireDegreeAlignment, requireFullMatch, experienceLevel, selectedJobId, jobTypeFilter]);

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

      {/* Premium ATS Brand Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Employer Portal</h2>
              <div className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-blue-700 w-fit">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Viewing as: CareerOS HR
              </div>
            </div>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">
              Intelligent applicant tracking. Advanced AI Search.
            </p>
          </div>
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



      {/* ── AI Candidate Intelligence Engine ── HERO FEATURE BLOCK ──────────── */}
      <div className="ai-search-hero p-6 sm:p-8 flex flex-col gap-6">

        {/* Animated Glow Orbs */}
        <div className="ai-orb-1" />
        <div className="ai-orb-2" />
        <div className="ai-orb-3" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Top row: badge + clear button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="ai-live-badge">
                  <div className="ai-live-badge-dot" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-mono">AI-Powered</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">CareerOS Engine</span>
              </div>

              <div>
                <h2 className="text-[24px] sm:text-[28px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                  Find the perfect hire <br className="hidden sm:block" />
                  <span className="ai-shimmer-text">in one sentence.</span>
                </h2>
                <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-2 font-medium leading-relaxed max-w-lg">
                  Too lazy to scan 50 résumés? <span className="font-bold text-slate-800 dark:text-white">Just tell us what you need.</span> Our AI reads every profile, trajectory, and skill to surface who matters.
                </p>
              </div>
            </div>

            {aiFiltersActive && (
              <button
                onClick={clearAiSearch}
                className="shrink-0 text-[11px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-3.5 w-3.5" /> Clear Search
              </button>
            )}
          </div>

          {/* Search input row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                id="ai-search-input"
                placeholder='e.g. "Product Manager from NUS with banking experience and CGPA > 3.5"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiFilterSearch(); }}
                className="ai-input w-full pl-12 pr-4 py-4 text-[13px] font-medium"
              />
            </div>
            <button
              onClick={handleAiFilterSearch}
              disabled={isAiLoading || !aiPrompt.trim()}
              id="ai-search-submit"
              className="ai-submit-btn flex items-center justify-center gap-2 py-4 sm:w-auto w-full"
            >
              {isAiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Search AI
                </>
              )}
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 dark:text-indigo-300 font-mono shrink-0">Try asking:</span>
            {[
              { icon: '🎓', text: 'React engineer from NUS, CGPA > 3.5' },
              { icon: '🏦', text: 'Product Manager with banking experience' },
              { icon: '🤖', text: 'AI Architect, PyTorch skills, top 50 uni' },
            ].map(({ icon, text }) => (
              <button
                key={text}
                onClick={() => selectQueryTemplate(text)}
                className="ai-chip"
              >
                <span>{icon}</span> {text}
              </button>
            ))}
          </div>

          {/* Results summary bar */}
          {aiFiltersActive && aiExplanation && (
            <div className="ai-result-banner p-4 mt-2 flex flex-col sm:flex-row sm:items-center gap-3 animate-fadeIn">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-8 w-8 rounded-xl bg-indigo-100 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">AI Result</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 dark:text-indigo-300 dark:bg-indigo-500/20 dark:border-indigo-400/30 rounded-full px-2.5 py-0.5">
                      {aiMatchedIds?.length ?? 0} candidate{(aiMatchedIds?.length ?? 0) !== 1 ? 's' : ''} matched
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">{aiExplanation}</p>

                  {/* Active filter pills */}
                  {(minCgpa > 0 || requireTopUniversity || selectedKeywords.length > 0 || aiResumeKeywords.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {minCgpa > 0 && (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-400/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-mono font-bold">CGPA ≥ {minCgpa}</span>
                      )}
                      {requireTopUniversity && (
                        <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-mono font-bold">Top 50 QS</span>
                      )}
                      {selectedKeywords.map((kw) => (
                        <span key={kw} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400/20 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-mono font-bold">{kw}</span>
                      ))}
                      {aiResumeKeywords.map((kw) => (
                        <span key={kw} className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-400/20 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-mono font-bold">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>




      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Sidebar: Recruiter Filters */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 p-5 shrink-0 flex flex-col gap-6 shadow-2xs">

          {/* ATS Job Requisitions Sidebar */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">Active Requisitions</h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedJobId('all')}
                className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between w-full ${selectedJobId === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className={`h-3.5 w-3.5 ${selectedJobId === 'all' ? 'text-white' : 'text-slate-500'}`} />
                  <span className={`font-bold text-[11px] tracking-tight ${selectedJobId === 'all' ? 'text-white' : 'text-slate-700'}`}>All Open Roles</span>
                </div>
                <span className={`text-[10px] font-bold ${selectedJobId === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                  {allApplicants.length}
                </span>
              </button>
              {CAREEROS_JOBS.map(job => {
                const isSelected = selectedJobId === job.id;
                const count = allApplicants.filter(a => a.jobId === job.id).length;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between w-full ${isSelected
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <span className={`font-bold text-[11px] leading-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                        {job.role}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                        {job.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${isSelected ? 'text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

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
            <label className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireDegreeAlignment}
                onChange={(e) => setRequireDegreeAlignment(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Degree Field Aligned</span>
            </label>
            <label className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireFullMatch}
                onChange={(e) => setRequireFullMatch(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>100% Skill Match</span>
            </label>
          </div>

          {/* Experience Level Filter */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Experience Level</h3>
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              {[
                { key: 'all', label: 'Any' },
                { key: 'fresh', label: 'Fresh Grad' },
                { key: 'experienced', label: 'Experienced' }
              ].map(lvl => (
                <button
                  key={lvl.key}
                  onClick={() => setExperienceLevel(lvl.key as any)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${experienceLevel === lvl.key ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
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
          {(selectedKeywords.length > 0 || aiResumeKeywords.length > 0) && (
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
                {aiResumeKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setAiResumeKeywords(prev => prev.filter(k => k !== kw))}
                    className="text-[9px] px-2 py-1 rounded-lg border font-bold bg-purple-550 border-purple-550 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    {kw} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Filters */}
          {(candidateSearch || minMatchScore > 0 || phaseFilter !== 'all' || requireTopUniversity || minCgpa > 0 || pastPosition || selectedKeywords.length > 0 || aiResumeKeywords.length > 0 || requireDegreeAlignment || requireFullMatch || experienceLevel !== 'all') && (
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

          {/* Job Type Sub-Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none mb-4 gap-6">
            {[
              { key: 'all', label: 'All Types' },
              { key: 'Full-time', label: 'Full-time' },
              { key: 'Part-time', label: 'Part-time' },
              { key: 'Internship', label: 'Internship' }
            ].map(tab => {
              const active = jobTypeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setJobTypeFilter(tab.key as any)}
                  className={`pb-2.5 relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[11px] font-bold tracking-wide transition-all border-b-2 -mb-[2px] ${active
                    ? 'text-blue-600 border-blue-600 font-extrabold'
                    : 'text-slate-400 border-transparent hover:text-slate-700'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

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
                  <th className="py-2.5 px-3">Last Institution</th>
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
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-[11px] font-black text-slate-700 uppercase shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate">{app.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-700 font-bold truncate">{app.roleApplied}</span>
                            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">{app.jobType}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium truncate max-w-[150px]">{app.lastInstitution}</td>
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

                          {/* Comprehensive Resume Paragraph */}
                          {selectedApplicant.resumeText && (
                            <div className="mb-4 bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                              <h5 className="text-[9px] font-sans font-bold uppercase tracking-wider text-blue-550 mb-1.5 flex items-center gap-1.5 border-b border-blue-100 pb-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-500" /> Comprehensive Summary
                              </h5>
                              <p className="font-sans text-[11px] text-slate-700 leading-relaxed font-medium">
                                {selectedApplicant.resumeText}
                              </p>
                            </div>
                          )}

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
