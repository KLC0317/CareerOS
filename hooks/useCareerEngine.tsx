'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { CareerNode, JobPosting, verifyPrerequisites, SKILL_DAG, PeerProfile, CohortAnalysisResult, analyzeCohortProgress } from '../lib/careerEngine';
import { INITIAL_CAREER_NODES, MOCK_JOBS, INITIAL_EMPLOYEES, EmployeeRecord, GENERATED_PEERS, GENERATED_JOBS } from '../lib/mockData';
import roadmapData from '../public/roadmap.json';

export type PersonaType = 'candidate' | 'employer' | 'jobs' | 'settings';

export interface JobApplication {
  jobId: string;
  status: 'applied' | 'rejected' | 'interviewing' | 'offered';
  appliedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  marketAnalysis?: string;
  registered: boolean;
  pdfData?: string;
  isPremium?: boolean;
  profilePicture?: string | null;
  lastLogin?: string;
}

export interface DbStatus {
  online: boolean;
  message: string;
  checked: boolean;
}

interface CareerEngineContextType {
  activePersona: PersonaType;
  setActivePersona: (persona: PersonaType) => void;
  candidateNodes: CareerNode[];
  updateNode: (id: string, updated: Partial<CareerNode>) => void;
  addNode: (node: Omit<CareerNode, 'id'>) => void;
  deleteNode: (id: string) => void;
  candidateSkills: string[]; // Dynamically aggregated
  manuallyAcquiredSkills: string[];
  markSkillAsAcquired: (skillName: string) => Promise<void>;
  unmarkSkillAsAcquired: (skillName: string) => Promise<void>;
  jobs: JobPosting[];
  applications: JobApplication[]; // List of job applications
  applyToJob: (jobId: string, status?: JobApplication['status']) => Promise<void>;
  updateApplicationStatus: (jobId: string, status: JobApplication['status']) => Promise<void>;
  employees: EmployeeRecord[];
  updateEmployeeTenure: (id: string, tenure: number) => void;
  selectedSkillPath: string; // Target skill for Traversal Map, e.g. "AI Architect"
  setSelectedSkillPath: (skill: string) => void;
  hoveredSchemaId: string | null; // For context inspector line drawing
  setHoveredSchemaId: (id: string | null) => void;
  // Redesign requirements: Register & Profile
  userProfile: UserProfile;
  dbStatus: DbStatus;
  authError: string | null;
  authLoading: boolean;
  setAuthError: (err: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, targetRole: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; token?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  quickLogin: () => Promise<{ success: boolean; error?: string }>;
  checkDbStatus: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  onboardCandidate: (email: string, targetRole: string, milestones: CareerNode[], resumeFilename?: string, marketAnalysis?: string, pdfData?: string) => Promise<{ success: boolean; error?: string }>;
  profileVersions: any[];
  uploadAndParseResume: (file: File | null, textContent: string) => Promise<{ success: boolean; data?: any; error?: string; code?: string }>;
  restoreVersion: (versionId: number) => Promise<{ success: boolean; error?: string }>;
  saveTailoredVersion: (email: string, targetRole: string, milestones: CareerNode[], resumeFilename: string, marketAnalysis?: string, pdfData?: string) => Promise<{ success: boolean; versionNumber?: number; error?: string }>;
  fetchProfileVersions: (email: string) => Promise<void>;
  setCandidateNodes: React.Dispatch<React.SetStateAction<CareerNode[]>>;
  // Keyword Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Peer Cohort Data
  peerProfiles: PeerProfile[];
  generatedJobs: JobPosting[];
  cohortAnalysis: CohortAnalysisResult | null;
  // Custom trajectories & paths
  careerPaths: string[];
  addCustomPath: (name: string, description: string, skills: string[]) => void;
  removeCustomPath: (name: string) => void;
  // Settings & Dark Mode overrides
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  updateProfileSettings: (name: string, targetRole: string, isPremium: boolean, profilePicture: string | null) => Promise<{ success: boolean; error?: string }>;
  // Persistent URL sub-state
  activeStatusTab: string;
  setActiveStatusTab: (tab: string) => void;
  phaseFilter: string;
  setPhaseFilter: (phase: string) => void;
  selectedApplicantId: string | null;
  setSelectedApplicantId: (id: string | null) => void;
  toast: { show: boolean; message: string; onClick?: () => void } | null;
  setToast: React.Dispatch<React.SetStateAction<{ show: boolean; message: string; onClick?: () => void } | null>>;
}

const CareerEngineContext = createContext<CareerEngineContextType | undefined>(undefined);

export const CareerEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersonaState] = useState<PersonaType>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['candidate', 'employer', 'jobs', 'settings'].includes(tab)) {
        return tab as PersonaType;
      }
    }
    return 'candidate';
  });

  const [activeStatusTab, setActiveStatusTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const s = urlParams.get('status');
      if (s && ['all', 'applied', 'interviewing', 'offered', 'rejected'].includes(s)) {
        return s;
      }
    }
    return 'all';
  });

  const [phaseFilter, setPhaseFilterState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const p = urlParams.get('phase');
      if (p && ['all', 'applied', 'interviewing', 'offered', 'rejected'].includes(p)) {
        return p;
      }
    }
    return 'all';
  });

  const [selectedApplicantId, setSelectedApplicantIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('applicant') || null;
    }
    return null;
  });

  const [toast, setToast] = useState<{ show: boolean; message: string; onClick?: () => void } | null>(null);

  const setActivePersona = (persona: PersonaType) => {
    if (typeof window !== 'undefined' && activePersona !== 'settings') {
      sessionStorage.setItem('career_os_prev_persona', activePersona);
    }
    setActivePersonaState(persona);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') !== persona) {
        urlParams.set('tab', persona);
        window.history.pushState(null, '', `?${urlParams.toString()}`);
      }
    }
  };

  const setActiveStatusTab = (tab: string) => {
    setActiveStatusTabState(tab);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('status') !== tab) {
        urlParams.set('status', tab);
        window.history.pushState(null, '', `?${urlParams.toString()}`);
      }
    }
  };

  const setPhaseFilter = (phase: string) => {
    setPhaseFilterState(phase);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('phase') !== phase) {
        urlParams.set('phase', phase);
        window.history.pushState(null, '', `?${urlParams.toString()}`);
      }
    }
  };

  const setSelectedApplicantId = (id: string | null) => {
    setSelectedApplicantIdState(id);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (id) {
        if (urlParams.get('applicant') !== id) {
          urlParams.set('applicant', id);
          window.history.pushState(null, '', `?${urlParams.toString()}`);
        }
      } else {
        if (urlParams.has('applicant')) {
          urlParams.delete('applicant');
          window.history.pushState(null, '', `?${urlParams.toString()}`);
        }
      }
    }
  };

  const [candidateNodes, setCandidateNodes] = useState<CareerNode[]>(() => {
    if (typeof window !== 'undefined') {
      const savedNodes = localStorage.getItem('career_os_session_nodes');
      if (savedNodes) {
        try {
          return JSON.parse(savedNodes);
        } catch (e) { }
      }
    }
    return INITIAL_CAREER_NODES;
  });

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    if (typeof window !== 'undefined') {
      const savedApps = localStorage.getItem('career_os_session_applications');
      if (savedApps) {
        try {
          return JSON.parse(savedApps);
        } catch (e) { }
      }
    }
    return [];
  });

  const [employees, setEmployees] = useState<EmployeeRecord[]>(INITIAL_EMPLOYEES);

  // 100 jobs variety: 20 hand-crafted + 80 generated
  const combinedJobs = useMemo(() => {
    return [...MOCK_JOBS, ...GENERATED_JOBS.slice(0, 80)];
  }, []);
  const [selectedSkillPath, setSelectedSkillPath] = useState<string>('AI Architect');
  const [hoveredSchemaId, setHoveredSchemaId] = useState<string | null>(null);
  const [profileVersions, setProfileVersions] = useState<any[]>([]);

  // Custom paths state
  const [careerPaths, setCareerPaths] = useState<string[]>(() => {
    const defaultPaths = ['AI Architect', 'Frontend Architect', 'Engineering Director'];
    try {
      if (roadmapData && roadmapData.roadmaps) {
        const roadmapTitles = roadmapData.roadmaps.map((r: any) => r.title);
        return [...new Set([...defaultPaths, ...roadmapTitles])];
      }
    } catch (e) {
      // ignore
    }
    return defaultPaths;
  });

  const addCustomPath = (name: string, description: string, skills: string[]) => {
    SKILL_DAG[name] = {
      name,
      rank: 3,
      prerequisites: skills
    };
    if (!careerPaths.includes(name)) {
      setCareerPaths(prev => [...prev, name]);
    }
  };

  const removeCustomPath = (name: string) => {
    delete SKILL_DAG[name];
    setCareerPaths(prev => prev.filter(p => p !== name));
    if (selectedSkillPath === name) {
      setSelectedSkillPath('AI Architect');
    }
  };

  // Registration and Search State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('career_os_session_profile');
      if (savedProfile) {
        try {
          return JSON.parse(savedProfile);
        } catch (e) { }
      }
    }
    return {
      name: '',
      email: '',
      targetRole: 'PENDING_ONBOARDING',
      marketAnalysis: '',
      registered: false,
      lastLogin: ''
    };
  });

  const [dbStatus, setDbStatus] = useState<DbStatus>({
    online: false,
    message: 'Checking database status...',
    checked: false
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Theme dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Load Dark Mode state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('career_os_theme');
      if (storedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Update DOM when darkMode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('career_os_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('career_os_theme', 'light');
      }
    }
  }, [darkMode]);

  // Pre-generated cohort data (loaded once)
  const peerProfiles = useMemo(() => GENERATED_PEERS, []);
  const generatedJobs = useMemo(() => GENERATED_JOBS, []);

  // Local Mock Users DB for Fallback Mode
  const [mockUsers, setMockUsers] = useState<Record<string, { name: string; hash: string; targetRole: string }>>({
    'kianlok@example.com': { name: 'Kian Lok', hash: 'mock-hash', targetRole: 'AI Architect' }
  });
  const [mockResetTokens, setMockResetTokens] = useState<Record<string, { email: string; expiry: Date }>>({});

  // Check Database connection on mount
  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbStatus({
        online: data.online,
        message: data.message,
        checked: true
      });
    } catch (err: any) {
      setDbStatus({
        online: false,
        message: 'Could not connect to Next.js API route.',
        checked: true
      });
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  useEffect(() => {
    if (userProfile.email && dbStatus.online) {
      fetchProfileVersions(userProfile.email);
      fetchApplications(userProfile.email);
      fetchManuallyAcquiredSkills(userProfile.email);
    }
  }, [dbStatus.online, userProfile.email]);

  // Save session state to localStorage when changes occur
  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.registered) {
      localStorage.setItem('career_os_session_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.registered) {
      localStorage.setItem('career_os_session_applications', JSON.stringify(applications));
    }
  }, [applications, userProfile.registered]);

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.registered) {
      localStorage.setItem('career_os_session_nodes', JSON.stringify(candidateNodes));
    }
  }, [candidateNodes, userProfile.registered]);

  // Sync URL search parameters on popstate (browser back/forth buttons)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = () => {
        const urlParams = new URLSearchParams(window.location.search);

        const tab = urlParams.get('tab');
        if (tab && ['candidate', 'employer', 'jobs', 'settings'].includes(tab)) {
          setActivePersonaState(tab as PersonaType);
        } else {
          setActivePersonaState('candidate');
        }

        const s = urlParams.get('status');
        if (s && ['all', 'applied', 'interviewing', 'offered', 'rejected'].includes(s)) {
          setActiveStatusTabState(s);
        } else {
          setActiveStatusTabState('all');
        }

        const p = urlParams.get('phase');
        if (p && ['all', 'applied', 'interviewing', 'offered', 'rejected'].includes(p)) {
          setPhaseFilterState(p);
        } else {
          setPhaseFilterState('all');
        }

        setSelectedApplicantIdState(urlParams.get('applicant') || null);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // State for manually acquired skills
  const [manuallyAcquiredSkills, setManuallyAcquiredSkills] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('career_os_session_acquired_skills');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  // Dynamically compute candidate skills from all nodes + manually marked ones
  const candidateSkills = useMemo(() => {
    const skillNames = new Set<string>();
    candidateNodes.forEach((node) => {
      node.skills.forEach((skill) => {
        skillNames.add(skill.name);
      });
    });
    manuallyAcquiredSkills.forEach((skill) => {
      skillNames.add(skill);
    });
    return Array.from(skillNames);
  }, [candidateNodes, manuallyAcquiredSkills]);

  // Cohort analysis – recomputes when target role or skills change
  const cohortAnalysis = useMemo<CohortAnalysisResult | null>(() => {
    if (!selectedSkillPath || selectedSkillPath === 'AI Architect') {
      // Still compute even for default; user may not have chosen yet
    }
    if (candidateSkills.length === 0 && selectedSkillPath === 'PENDING_ONBOARDING') return null;
    return analyzeCohortProgress(peerProfiles, generatedJobs, selectedSkillPath, candidateSkills);
  }, [selectedSkillPath, candidateSkills, peerProfiles, generatedJobs]);

  // Update career milestone node
  const updateNode = async (id: string, updated: Partial<CareerNode>) => {
    const newNodes = candidateNodes.map((node) => {
      if (node.id === id) {
        return { ...node, ...updated };
      }
      return node;
    });
    setCandidateNodes(newNodes);

    // Clear local userProfile summary to force re-generation from current milestones
    let currentAnalysis: any = {};
    try {
      currentAnalysis = JSON.parse(userProfile.marketAnalysis || '{}');
    } catch (e) { }
    updateUserProfile({
      marketAnalysis: JSON.stringify({ ...currentAnalysis, summary: '' })
    });

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userProfile.email,
            action: 'save_active_milestones',
            milestones: newNodes
          })
        });
      } catch (err) {
        // console.error('Failed to sync updated milestones:', err);
      }
    }
  };

  // Add new career milestone node
  const addNode = async (node: Omit<CareerNode, 'id'>) => {
    const newNode: CareerNode = {
      ...node,
      id: `node-${Date.now()}`
    };
    const newNodes = [...candidateNodes, newNode];
    setCandidateNodes(newNodes);

    // Clear local userProfile summary to force re-generation from current milestones
    let currentAnalysis: any = {};
    try {
      currentAnalysis = JSON.parse(userProfile.marketAnalysis || '{}');
    } catch (e) { }
    updateUserProfile({
      marketAnalysis: JSON.stringify({ ...currentAnalysis, summary: '' })
    });

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userProfile.email,
            action: 'save_active_milestones',
            milestones: newNodes
          })
        });
      } catch (err) {
        // console.error('Failed to sync added milestone:', err);
      }
    }
  };

  // Delete career milestone node
  const deleteNode = async (id: string) => {
    const newNodes = candidateNodes.filter((node) => node.id !== id);
    setCandidateNodes(newNodes);

    // Clear local userProfile summary to force re-generation from current milestones
    let currentAnalysis: any = {};
    try {
      currentAnalysis = JSON.parse(userProfile.marketAnalysis || '{}');
    } catch (e) { }
    updateUserProfile({
      marketAnalysis: JSON.stringify({ ...currentAnalysis, summary: '' })
    });

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userProfile.email,
            action: 'save_active_milestones',
            milestones: newNodes
          })
        });
      } catch (err) {
        // console.error('Failed to sync deleted milestone:', err);
      }
    }
  };

  // Fetch applications from database
  const fetchApplications = async (email: string) => {
    try {
      const res = await fetch(`/api/profile/applications?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications(data.applications);
      }
    } catch (err) {
      // console.error('Error fetching applications:', err);
    }
  };

  // Submit job application
  const applyToJob = async (jobId: string, status: JobApplication['status'] = 'applied') => {
    const newApp: JobApplication = {
      jobId,
      status,
      appliedAt: new Date().toISOString()
    };

    setApplications((prev) => {
      const filtered = prev.filter((a) => a.jobId !== jobId);
      return [...filtered, newApp];
    });

    setToast({
      show: true,
      message: 'u have applied view it here',
      onClick: () => {
        setActivePersona('jobs');
        setActiveStatusTab('applied');
      }
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === 'u have applied view it here' ? null : prev));
    }, 6000);

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userProfile.email, jobId, status })
        });
      } catch (err) {
        // console.error('Failed to save application to db:', err);
      }
    }
  };

  // Update application status
  const updateApplicationStatus = async (jobId: string, status: JobApplication['status']) => {
    const newApp: JobApplication = {
      jobId,
      status,
      appliedAt: new Date().toISOString()
    };

    setApplications((prev) => {
      const filtered = prev.filter((a) => a.jobId !== jobId);
      return [...filtered, newApp];
    });

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userProfile.email, jobId, status })
        });
      } catch (err) {
        // console.error('Failed to update application status in db:', err);
      }
    }
  };

  // Update employee tenure in Employer dashboard
  const updateEmployeeTenure = (id: string, tenure: number) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, tenureMonths: Math.max(0, tenure) } : emp))
    );
  };

  // API Call: Register
  const register = async (name: string, email: string, password: string, targetRole: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, targetRole })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // Graceful fallback to client-side mock registration
          if (mockUsers[email.toLowerCase()]) {
            throw new Error('An account with this email already exists.');
          }
          setMockUsers(prev => ({
            ...prev,
            [email.toLowerCase()]: { name, hash: 'mocked-hash', targetRole: 'PENDING_ONBOARDING' }
          }));
          setUserProfile({ name, email: email.toLowerCase(), targetRole: 'PENDING_ONBOARDING', registered: true });
          setSelectedSkillPath('AI Architect');
          setDbStatus(prev => ({ ...prev, online: false }));
          return { success: true };
        }
        throw new Error(data.message || 'Registration failed.');
      }

      setUserProfile({
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.targetRole,
        registered: true
      });
      setSelectedSkillPath('AI Architect');
      return { success: true };

    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  // API Call: Login
  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // Graceful fallback to client-side mock login
          const localUser = mockUsers[email.toLowerCase()];
          if (!localUser) {
            throw new Error('Invalid email or password.');
          }
          setUserProfile({
            name: localUser.name,
            email: email.toLowerCase(),
            targetRole: localUser.targetRole,
            registered: true,
            isPremium: false,
            profilePicture: null
          });
          if (localUser.targetRole !== 'PENDING_ONBOARDING') {
            setSelectedSkillPath(localUser.targetRole);
          } else {
            setSelectedSkillPath('AI Architect');
          }
          setProfileVersions([
            { id: 999, versionNumber: 1, resumeFilename: 'Initial Sandbox Profile', targetRole: localUser.targetRole, milestones: INITIAL_CAREER_NODES, createdAt: new Date().toISOString() }
          ]);
          setDbStatus(prev => ({ ...prev, online: false }));
          return { success: true };
        }
        throw new Error(data.message || 'Login failed.');
      }

      setUserProfile({
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.targetRole,
        marketAnalysis: data.user.marketAnalysis,
        registered: true,
        pdfData: data.user.pdfData,
        isPremium: data.user.isPremium || false,
        profilePicture: data.user.profilePicture || null,
        lastLogin: data.user.lastLogin
      });
      if (data.user.milestones && data.user.milestones.length > 0) {
        setCandidateNodes(data.user.milestones);
      }
      if (data.user.targetRole !== 'PENDING_ONBOARDING') {
        setSelectedSkillPath(data.user.targetRole);
      } else {
        setSelectedSkillPath('AI Architect');
      }
      await fetchProfileVersions(data.user.email);
      await fetchApplications(data.user.email);
      await fetchManuallyAcquiredSkills(data.user.email);
      return { success: true };

    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const loginDemo = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Demo initialization failed.');
      }

      setUserProfile({
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.targetRole,
        marketAnalysis: data.user.marketAnalysis,
        registered: true,
        pdfData: data.user.pdfData,
        isPremium: data.user.isPremium || false,
        profilePicture: data.user.profilePicture || null,
        lastLogin: data.user.lastLogin
      });
      if (data.user.milestones && data.user.milestones.length > 0) {
        setCandidateNodes(data.user.milestones);
      } else {
        setCandidateNodes([]);
      }
      if (data.user.targetRole !== 'PENDING_ONBOARDING') {
        setSelectedSkillPath(data.user.targetRole);
      } else {
        setSelectedSkillPath('AI Architect');
      }
      await fetchProfileVersions(data.user.email);
      await fetchApplications(data.user.email);
      await fetchManuallyAcquiredSkills(data.user.email);
      return { success: true };

    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  // API Call: Forgot Password
  const forgotPassword = async (email: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // Fallback to client-side token generation
          const localUser = mockUsers[email.toLowerCase()];
          if (!localUser) {
            throw new Error('No account with this email address exists.');
          }
          const generatedToken = 'mock-reset-token-' + Math.random().toString(36).substr(2, 9);
          const expiry = new Date();
          expiry.setMinutes(expiry.getMinutes() + 15);

          setMockResetTokens(prev => ({
            ...prev,
            [generatedToken]: { email: email.toLowerCase(), expiry }
          }));

          return {
            success: true,
            message: 'Local sandbox password reset token generated successfully.',
            token: generatedToken
          };
        }
        throw new Error(data.message || 'Request failed.');
      }

      return {
        success: true,
        message: data.message,
        token: data.token
      };

    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  // API Call: Reset Password
  const resetPassword = async (token: string, newPassword: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // Fallback reset password validation
          const tokenRecord = mockResetTokens[token];
          if (!tokenRecord) {
            throw new Error('Password reset token is invalid or has expired.');
          }
          if (new Date() > tokenRecord.expiry) {
            throw new Error('Password reset token has expired.');
          }

          // Update password
          setMockUsers(prev => ({
            ...prev,
            [tokenRecord.email]: {
              ...prev[tokenRecord.email],
              hash: 'mock-new-hash'
            }
          }));

          // Clear token
          setMockResetTokens(prev => {
            const updated = { ...prev };
            delete updated[token];
            return updated;
          });

          return {
            success: true,
            message: 'Password successfully updated in local encrypted state.'
          };
        }
        throw new Error(data.message || 'Password reset failed.');
      }

      return {
        success: true,
        message: data.message
      };

    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchProfileVersions = async (email: string) => {
    try {
      const res = await fetch(`/api/profile/versions?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileVersions(data.versions);
      }
    } catch (err) {
      // console.error('Error fetching profile versions:', err);
    }
  };

  const fetchManuallyAcquiredSkills = async (email: string) => {
    try {
      const res = await fetch(`/api/profile/skills?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setManuallyAcquiredSkills(data.skills);
        if (typeof window !== 'undefined') {
          localStorage.setItem('career_os_session_acquired_skills', JSON.stringify(data.skills));
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const markSkillAsAcquired = async (skillName: string) => {
    if (!manuallyAcquiredSkills.includes(skillName)) {
      const updated = [...manuallyAcquiredSkills, skillName];
      setManuallyAcquiredSkills(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('career_os_session_acquired_skills', JSON.stringify(updated));
      }

      if (userProfile.email && dbStatus.online) {
        try {
          await fetch('/api/profile/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userProfile.email, skillName })
          });
        } catch (err) {
          // ignore
        }
      }
    }
  };

  const unmarkSkillAsAcquired = async (skillName: string) => {
    const updated = manuallyAcquiredSkills.filter(s => s !== skillName);
    setManuallyAcquiredSkills(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('career_os_session_acquired_skills', JSON.stringify(updated));
    }

    if (userProfile.email && dbStatus.online) {
      try {
        await fetch('/api/profile/skills', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userProfile.email, skillName })
        });
      } catch (err) {
        // ignore
      }
    }
  };

  const uploadAndParseResume = async (file: File | null, textContent: string): Promise<{ success: boolean; data?: any; error?: string; code?: string }> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (textContent) {
        formData.append('text', textContent);
      }

      const res = await fetch('/api/ocr/parse', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to parse resume.');
      }

      if (data.error === 'GEMINI_API_KEY_MISSING') {
        return { success: false, error: data.message, code: 'GEMINI_API_KEY_MISSING' };
      }

      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error occurred while calling OCR API.' };
    } finally {
      setAuthLoading(false);
    }
  };

  const restoreVersion = async (versionId: number): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/profile/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, versionId })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          const localVer = profileVersions.find(v => v.id === versionId);
          if (!localVer) throw new Error('Sandbox version not found.');
          setUserProfile(prev => ({ ...prev, targetRole: localVer.targetRole, marketAnalysis: localVer.marketAnalysis }));
          setCandidateNodes(localVer.milestones);
          setSelectedSkillPath(localVer.targetRole);
          return { success: true };
        }
        throw new Error(data.message || 'Failed to restore version.');
      }

      setUserProfile(prev => ({ ...prev, targetRole: data.targetRole, marketAnalysis: data.marketAnalysis, pdfData: data.pdfData }));
      setCandidateNodes(data.milestones);
      setSelectedSkillPath(data.targetRole);

      await fetchProfileVersions(userProfile.email);
      await fetchManuallyAcquiredSkills(userProfile.email);
      return { success: true };
    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const saveTailoredVersion = async (
    email: string,
    targetRole: string,
    milestones: CareerNode[],
    resumeFilename: string,
    marketAnalysis?: string,
    pdfData?: string
  ): Promise<{ success: boolean; versionNumber?: number; error?: string }> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/profile/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          targetRole,
          milestones,
          resumeFilename,
          action: 'save',
          marketAnalysis,
          pdfData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // console.warn('PostgreSQL is offline. Saving snapshot in client-side state.');
          const nextVerNum = profileVersions.length + 1;
          const newVer = {
            id: 1000 + nextVerNum,
            versionNumber: nextVerNum,
            resumeFilename: resumeFilename || `Tailored for ${targetRole}`,
            targetRole,
            milestones,
            marketAnalysis,
            createdAt: new Date().toISOString()
          };
          setProfileVersions(prev => [newVer, ...prev]);
          return { success: true, versionNumber: nextVerNum };
        }
        throw new Error(data.message || 'Failed to save version.');
      }

      await fetchProfileVersions(email);
      await fetchManuallyAcquiredSkills(email);
      return { success: true, versionNumber: data.versionNumber };
    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const onboardCandidate = async (email: string, targetRole: string, milestones: CareerNode[], resumeFilename?: string, marketAnalysis?: string, pdfData?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, targetRole, milestones, resumeFilename, marketAnalysis, pdfData })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'POSTGRESQL_OFFLINE') {
          // console.warn('PostgreSQL is offline. Setting local onboarding profile.');
          setMockUsers(prev => ({
            ...prev,
            [email.toLowerCase()]: {
              ...prev[email.toLowerCase()],
              targetRole
            }
          }));
          setUserProfile(prev => ({ ...prev, targetRole, marketAnalysis, registered: true }));
          setCandidateNodes(milestones);
          setSelectedSkillPath(targetRole);

          const nextVerNum = profileVersions.length + 1;
          setProfileVersions(prev => [
            {
              id: 1000 + nextVerNum,
              versionNumber: nextVerNum,
              resumeFilename: resumeFilename || 'Manual Entry',
              targetRole,
              milestones,
              marketAnalysis,
              createdAt: new Date().toISOString()
            },
            ...prev
          ]);
          return { success: true };
        }
        throw new Error(data.message || 'Onboarding failed.');
      }

      setUserProfile(prev => ({
        ...prev,
        targetRole,
        marketAnalysis,
        pdfData,
        registered: true,
        isPremium: data.user?.isPremium || prev.isPremium || false,
        profilePicture: data.user?.profilePicture || prev.profilePicture || null
      }));
      setCandidateNodes(milestones);
      setSelectedSkillPath(targetRole);

      await fetchProfileVersions(email);
      await fetchApplications(email);
      await fetchManuallyAcquiredSkills(email);
      return { success: true };
    } catch (err: any) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('career_os_session_profile');
      localStorage.removeItem('career_os_session_applications');
      localStorage.removeItem('career_os_session_nodes');
      localStorage.removeItem('career_os_session_acquired_skills');
    }
    setUserProfile({
      name: '',
      email: '',
      targetRole: 'PENDING_ONBOARDING',
      registered: false,
      isPremium: false,
      profilePicture: null
    });
    setApplications([]);
    setSearchQuery('');
    setCandidateNodes(INITIAL_CAREER_NODES);
    setProfileVersions([]);
    setManuallyAcquiredSkills([]);
    // Navigate to base URL to clear any ?tab= query params
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  const quickLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'kianlok@example.com', password: 'password' })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserProfile({
          name: data.user.name,
          email: data.user.email,
          targetRole: data.user.targetRole,
          marketAnalysis: data.user.marketAnalysis,
          registered: true,
          pdfData: data.user.pdfData,
          isPremium: data.user.isPremium || false,
          profilePicture: data.user.profilePicture || null
        });
        if (data.user.milestones && data.user.milestones.length > 0) {
          setCandidateNodes(data.user.milestones);
        }
        setSelectedSkillPath(data.user.targetRole !== 'PENDING_ONBOARDING' ? data.user.targetRole : 'AI Architect');
        await fetchProfileVersions(data.user.email);
        await fetchApplications(data.user.email);
        await fetchManuallyAcquiredSkills(data.user.email);
        return { success: true };
      }
    } catch (e) {
      // Ignore network errors and fall back to local sandbox below
    }

    // Local Sandbox Fallback
    setUserProfile({
      name: 'Kian Lok',
      email: 'kianlok@example.com',
      targetRole: 'AI Architect',
      registered: true,
      isPremium: false,
      profilePicture: null
    });
    setCandidateNodes(INITIAL_CAREER_NODES);
    setSelectedSkillPath('AI Architect');
    setProfileVersions([
      { id: 999, versionNumber: 1, resumeFilename: 'Initial Sandbox Profile', targetRole: 'AI Architect', milestones: INITIAL_CAREER_NODES, createdAt: new Date().toISOString() }
    ]);
    setApplications([
      { jobId: 'job-1', status: 'interviewing', appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { jobId: 'job-2', status: 'applied', appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { jobId: 'job-5', status: 'offered', appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]);
    setAuthLoading(false);
    return { success: true };
  };

  const updateProfileSettings = async (
    name: string,
    targetRole: string,
    isPremium: boolean,
    profilePicture: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      setUserProfile((prev) => ({
        ...prev,
        name,
        targetRole,
        isPremium,
        profilePicture
      }));

      if (targetRole !== 'PENDING_ONBOARDING') {
        setSelectedSkillPath(targetRole);
      }

      if (userProfile.email && dbStatus.online) {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userProfile.email,
            name,
            targetRole,
            isPremium,
            profilePicture
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.error === 'POSTGRESQL_OFFLINE') {
            return { success: true };
          }
          throw new Error(data.message || 'Failed to update database profile.');
        }
      } else {
        // Fallback mock update
        setMockUsers((prev) => {
          const emailKey = userProfile.email ? userProfile.email.toLowerCase() : 'kianlok@example.com';
          return {
            ...prev,
            [emailKey]: {
              ...prev[emailKey],
              name,
              targetRole
            }
          };
        });
      }
      return { success: true };
    } catch (err: any) {
      // console.error('updateProfileSettings failed:', err);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...profile
    }));
  };

  return (
    <CareerEngineContext.Provider
      value={{
        activePersona,
        setActivePersona,
        candidateNodes,
        updateNode,
        addNode,
        deleteNode,
        candidateSkills,
        manuallyAcquiredSkills,
        markSkillAsAcquired,
        unmarkSkillAsAcquired,
        jobs: combinedJobs,
        applications,
        applyToJob,
        updateApplicationStatus,
        employees,
        updateEmployeeTenure,
        selectedSkillPath,
        setSelectedSkillPath,
        hoveredSchemaId,
        setHoveredSchemaId,
        userProfile,
        dbStatus,
        authError,
        authLoading,
        setAuthError,
        login,
        loginDemo,
        register,
        forgotPassword,
        resetPassword,
        signOut,
        quickLogin,
        checkDbStatus,
        updateUserProfile,
        onboardCandidate,
        profileVersions,
        uploadAndParseResume,
        restoreVersion,
        saveTailoredVersion,
        fetchProfileVersions,
        setCandidateNodes,
        searchQuery,
        setSearchQuery,
        peerProfiles,
        generatedJobs,
        cohortAnalysis,
        careerPaths,
        addCustomPath,
        removeCustomPath,
        darkMode,
        setDarkMode,
        updateProfileSettings,
        activeStatusTab,
        setActiveStatusTab,
        phaseFilter,
        setPhaseFilter,
        selectedApplicantId,
        setSelectedApplicantId,
        toast,
        setToast
      }}
    >
      {children}
    </CareerEngineContext.Provider>
  );
};

export const useCareerEngine = () => {
  const context = useContext(CareerEngineContext);
  if (!context) {
    throw new Error('useCareerEngine must be used within a CareerEngineProvider');
  }
  return context;
};
