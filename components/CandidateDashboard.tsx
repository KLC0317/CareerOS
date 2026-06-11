'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import IngestionMatrix from './IngestionMatrix';
import TemporalCanvas from './TemporalCanvas';
import ForecastingSimulator from './ForecastingSimulator';
import CohortInsights from './CohortInsights';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
  Briefcase, Layers, TrendingUp, Sparkles, CheckCircle2, User, 
  FileText, History, RefreshCw, Upload, Database, Check, AlertCircle, FileClock,
  MapPin, Globe, Settings, Plus, Trash2, Edit3, X, Sparkle, Download, CheckSquare, ListPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeResumeText, SKILL_DAG, getPreRequisitesRecursive, tailorCVForTarget, CareerNode } from '../lib/careerEngine';


export default function CandidateDashboard() {
  const {
    candidateNodes,
    candidateSkills,
    applications,
    userProfile,
    updateUserProfile,
    profileVersions,
    uploadAndParseResume,
    restoreVersion,
    onboardCandidate,
    careerPaths,
    addCustomPath,
    removeCustomPath,
    updateNode,
    addNode,
    deleteNode
  } = useCareerEngine();

  const [activeTab, setActiveTab] = useState<'trajectory' | 'profile' | 'forecast'>('trajectory');

  // Dashboard specific upload / parse states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [pendingParsedData, setPendingParsedData] = useState<any | null>(null);
  const [selectedDashboardRole, setSelectedDashboardRole] = useState<string>('');
  const [customDashboardRole, setCustomDashboardRole] = useState<string>('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [dashboardApiKeyWarning, setDashboardApiKeyWarning] = useState(false);
  const [dashboardErrorMsg, setDashboardErrorMsg] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // Live CV States
  const [cvMode, setCvMode] = useState<'path' | 'job'>('path');
  const [intentPath, setIntentPath] = useState<string>('AI Architect');
  const [targetJobId, setTargetJobId] = useState<string>('');
  const [customJobText, setCustomJobText] = useState<string>('');
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(true);
  const [isCustomPathModalOpen, setIsCustomPathModalOpen] = useState<boolean>(false);
  const [isMilestoneEditorOpen, setIsMilestoneEditorOpen] = useState<boolean>(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Custom Path Form State
  const [newPathName, setNewPathName] = useState<string>('');
  const [newPathDesc, setNewPathDesc] = useState<string>('');
  const [newPathSkills, setNewPathSkills] = useState<string[]>([]);

  // Milestone Editor Form State
  const [msRole, setMsRole] = useState<string>('');
  const [msOrg, setMsOrg] = useState<string>('');
  const [msType, setMsType] = useState<'employment' | 'sabbatical' | 'academic' | 'project'>('employment');
  const [msStart, setMsStart] = useState<string>('');
  const [msEnd, setMsEnd] = useState<string>('');
  const [msDesc, setMsDesc] = useState<string>('');
  const [msSkills, setMsSkills] = useState<string[]>([]);

  // Sync default target path when profile updates
  useEffect(() => {
    if (userProfile.targetRole && userProfile.targetRole !== 'PENDING_ONBOARDING') {
      setIntentPath(userProfile.targetRole);
    }
  }, [userProfile.targetRole]);

  // Active target for CV adaptation
  const activeCvTarget = useMemo(() => {
    if (cvMode === 'path') {
      return intentPath || userProfile.targetRole || 'AI Architect';
    } else {
      if (targetJobId === 'custom') {
        return 'Custom Job Description';
      }
      const matchedJob = cohortAnalysis?.matchedJobs.find(j => j.id === targetJobId);
      return matchedJob ? matchedJob.role : 'Job Posting';
    }
  }, [cvMode, intentPath, targetJobId, userProfile.targetRole, cohortAnalysis]);

  // Compute the tailored CV
  const tailoredCV = useMemo(() => {
    return tailorCVForTarget(
      candidateNodes,
      candidateSkills,
      activeCvTarget,
      cvMode === 'job' && targetJobId === 'custom' ? customJobText : undefined
    );
  }, [candidateNodes, candidateSkills, activeCvTarget, cvMode, targetJobId, customJobText]);

  // Helper to highlight tailoring diffs
  const renderTailoredText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\[OPT:.*?\]\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[[OPT:') && part.endsWith(']]')) {
        const cleanVal = part.slice(6, -2);
        return highlightDiffs ? (
          <span 
            key={idx} 
            className="bg-emerald-50 text-emerald-800 border-b border-emerald-300 font-medium px-0.5 rounded-sm transition-all duration-300"
          >
            {cleanVal}
          </span>
        ) : (
          <span key={idx}>{cleanVal}</span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper to automatically add missing skill to latest milestone
  const handleQuickAddSkill = (skill: string) => {
    if (candidateNodes.length === 0) return;
    const latestNode = [...candidateNodes].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    if (latestNode) {
      const currentSkills = latestNode.skills.map(s => s.name);
      if (!currentSkills.includes(skill)) {
        updateNode(latestNode.id, {
          skills: [...latestNode.skills, { name: skill, level: 'Rank-1' }]
        });
      }
    }
  };

  // Open milestone editor for editing or adding
  const handleOpenMilestoneEditor = (milestoneId: string | null) => {
    if (milestoneId) {
      const ms = candidateNodes.find(n => n.id === milestoneId);
      if (ms) {
        setEditingMilestoneId(milestoneId);
        setMsRole(ms.role);
        setMsOrg(ms.organization);
        setMsType(ms.type);
        setMsStart(ms.startDate);
        setMsEnd(ms.endDate);
        setMsDesc(ms.description);
        setMsSkills(ms.skills.map(s => s.name));
      }
    } else {
      setEditingMilestoneId(null);
      setMsRole('');
      setMsOrg('');
      setMsType('employment');
      setMsStart('2024-01');
      setMsEnd('Present');
      setMsDesc('');
      setMsSkills([]);
    }
    setIsMilestoneEditorOpen(true);
  };

  // Save edited or new milestone
  const handleSaveMilestone = () => {
    const skillsList = msSkills.map(s => ({ name: s, level: 'Rank-1' as const }));
    if (editingMilestoneId) {
      updateNode(editingMilestoneId, {
        role: msRole,
        organization: msOrg,
        type: msType,
        startDate: msStart,
        endDate: msEnd,
        description: msDesc,
        skills: skillsList
      });
    } else {
      addNode({
        role: msRole,
        organization: msOrg,
        type: msType,
        startDate: msStart,
        endDate: msEnd,
        description: msDesc,
        skills: skillsList
      });
    }
    setIsMilestoneEditorOpen(false);
    setEditingMilestoneId(null);
  };

  // Create custom path
  const handleSaveCustomPath = () => {
    if (!newPathName.trim()) return;
    addCustomPath(newPathName.trim(), newPathDesc.trim(), newPathSkills);
    setIntentPath(newPathName.trim());
    setNewPathName('');
    setNewPathDesc('');
    setNewPathSkills([]);
    setIsCustomPathModalOpen(false);
  };

  // Compute stats
  const totalMilestones = candidateNodes.length;
  const verifiedSkillsCount = candidateSkills.length;
  const applicationsCount = applications.length;

  const handleDashboardFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadFilename(file.name);
    setDashboardErrorMsg(null);
    setPendingParsedData(null);
    
    let progressVal = 0;
    const progressInterval = setInterval(() => {
      if (progressVal < 70) {
        progressVal += 8;
        setUploadProgress(progressVal);
      }
    }, 150);

    const logs = [
      `[OCR] Uploading ${file.name} to Career OS parser...`,
      `[OCR] Triggering Gemini multimodal analysis agent...`
    ];
    setUploadLogs(logs);

    try {
      const result = await uploadAndParseResume(file, '');
      clearInterval(progressInterval);

      if (result.success && result.data) {
        const parsed = result.data;
        const finalLogs = [
          ...logs,
          `[NLP] Connected. Analyzing parsed career milestones...`
        ];
        if (parsed.nodes && parsed.nodes.length > 0) {
          parsed.nodes.forEach((node: any) => {
            finalLogs.push(`[NLP] Mapped "${node.organization}" (${node.role}) node.`);
          });
        }
        finalLogs.push(`[TKG] Parsing complete! Recommended path: "${parsed.recommendedRole}"`);
        setUploadLogs(finalLogs);
        setUploadProgress(100);
        setPendingParsedData(parsed);
        setSelectedDashboardRole(parsed.recommendedRole || 'AI Architect');
        setCustomDashboardRole('');
        setDashboardApiKeyWarning(false);
      } else {
        if (result.code === 'GEMINI_API_KEY_MISSING') {
          const localParsed = analyzeResumeText(file.name + ' Grab, Petronas, University of Malaya');
          const fallbackLogs = [
            ...logs,
            `[WARNING] GEMINI_API_KEY is not configured!`,
            `[WARNING] Falling back to local offline regex parser.`,
            `[OCR] Scanning text tokens using local regex rules...`
          ];
          localParsed.nodes.forEach(node => {
            fallbackLogs.push(`[NLP] (Local) Mapped "${node.organization}" (${node.role}) node.`);
          });
          fallbackLogs.push(`[TKG] Completed fallback mapping. Recommended: "${localParsed.recommendedRole}"`);
          setUploadLogs(fallbackLogs);
          setUploadProgress(100);
          setPendingParsedData(localParsed);
          setSelectedDashboardRole(localParsed.recommendedRole || 'AI Architect');
          setCustomDashboardRole('');
          setDashboardApiKeyWarning(true);
        } else {
          setUploadLogs(prev => [...prev, `[ERROR] Failed to parse: ${result.error}`]);
          setUploadProgress(0);
          setDashboardErrorMsg(result.error || 'Failed to parse resume.');
        }
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadLogs(prev => [...prev, `[ERROR] Failed to parse: ${err.message}`]);
      setUploadProgress(0);
      setDashboardErrorMsg(err.message || 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDashboardVersion = async () => {
    if (!pendingParsedData) return;
    setIsUploading(true);

    const rolesArray = pendingParsedData.recommendedRoles || [
      { role: pendingParsedData.recommendedRole || 'AI Architect', justification: pendingParsedData.marketAnalysis?.justification || 'Highly aligned with your profile.' }
    ];
    const matchingOption = rolesArray.find((r: any) => r.role === selectedDashboardRole);
    let finalMarketAnalysis = pendingParsedData.marketAnalysis || null;
    if (finalMarketAnalysis) {
      if (matchingOption) {
        finalMarketAnalysis = {
          ...finalMarketAnalysis,
          justification: matchingOption.justification
        };
      } else {
        finalMarketAnalysis = {
          ...finalMarketAnalysis,
          justification: 'Custom trajectory specified by applicant. Career OS will align milestones accordingly.'
        };
      }
    }

    const res = await onboardCandidate(
      userProfile.email, 
      selectedDashboardRole, 
      pendingParsedData.nodes, 
      uploadFilename,
      finalMarketAnalysis ? JSON.stringify(finalMarketAnalysis) : undefined
    );
    if (!res.success) {
      setDashboardErrorMsg(res.error || 'Failed to save new version.');
    } else {
      setPendingParsedData(null);
      setUploadFilename('');
    }
    setIsUploading(false);
  };

  const handleRestore = async (versionId: number) => {
    setRestoringId(versionId);
    setDashboardErrorMsg(null);
    const res = await restoreVersion(versionId);
    if (!res.success) {
      setDashboardErrorMsg(res.error || 'Failed to restore profile version.');
    }
    setRestoringId(null);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('trajectory')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${
            activeTab === 'trajectory'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trajectory Canvas & TKG
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile & Resume Builder
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${
            activeTab === 'forecast'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SSMP Transition Forecasting
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {activeTab === 'trajectory' && <TemporalCanvas />}
            
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6 relative">
                
                {/* Dynamic Workspace Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Live CV Customizer & Optimization Controls */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    
                    {/* Optimization Targeting Panel */}
                    <Card className="border-slate-200 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500" />
                      <CardHeader className="border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Settings className="h-4.5 w-4.5 text-blue-600" />
                        <CardTitle className="text-sm font-bold text-slate-850">Live CV Optimizer Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 pt-4">
                        
                        {/* CV Mode Select */}
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block mb-2 font-mono">CV Target Intent Mode</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCvMode('path')}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                cvMode === 'path'
                                  ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/5'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                              }`}
                            >
                              <TrendingUp className={`h-4.5 w-4.5 ${cvMode === 'path' ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="text-[10.5px] font-bold text-slate-850">Target Trajectory</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCvMode('job')}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                cvMode === 'job'
                                  ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/5'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                              }`}
                            >
                              <Briefcase className={`h-4.5 w-4.5 ${cvMode === 'job' ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="text-[10.5px] font-bold text-slate-850">Job Application</span>
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Selectors based on mode */}
                        {cvMode === 'path' ? (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block font-mono">Active Target Pathway</label>
                            <div className="flex gap-2">
                              <select
                                value={intentPath}
                                onChange={(e) => setIntentPath(e.target.value)}
                                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                {careerPaths.map(path => (
                                  <option key={path} value={path}>{path}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setIsCustomPathModalOpen(true)}
                                className="px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100/90 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Manage custom paths"
                              >
                                <ListPlus className="h-4 w-4" /> Manage
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-455 block mb-1 font-mono">Choose Matched Job Opportunity</label>
                              <select
                                value={targetJobId}
                                onChange={(e) => {
                                  setTargetJobId(e.target.value);
                                  if (e.target.value !== 'custom') {
                                    const job = cohortAnalysis?.matchedJobs.find(j => j.id === e.target.value);
                                    if (job) setCustomJobText(job.description);
                                  } else {
                                    setCustomJobText('');
                                  }
                                }}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                <option value="">-- Select Matched Job --</option>
                                {cohortAnalysis?.matchedJobs.map(job => (
                                  <option key={job.id} value={job.id}>{job.role} at {job.company} ({job.matchPercentage}% match)</option>
                                ))}
                                <option value="custom">✦ Paste Custom Job Description ✦</option>
                              </select>
                            </div>
                            
                            {targetJobId === 'custom' && (
                              <div>
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-455 block mb-1 font-mono">Pasted Job Requirements</label>
                                <textarea
                                  placeholder="Paste the job description or requirements here to dynamically adapt the CV..."
                                  value={customJobText}
                                  onChange={(e) => setCustomJobText(e.target.value)}
                                  className="w-full h-24 text-[10.5px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-blue-500 resize-none font-sans"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resume Actions */}
                        <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenMilestoneEditor(null)}
                            className="py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="h-4 w-4" /> Add Milestone
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenMilestoneEditor(candidateNodes[0]?.id || null)}
                            className="py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            disabled={candidateNodes.length === 0}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit Milestones
                          </button>
                        </div>

                      </CardContent>
                    </Card>

                    {/* CV Alignment / Optimization Insights */}
                    <Card className="border-slate-200 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-sm font-bold text-slate-850 flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-teal-600" />
                          Live CV Adaptation Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 pt-4">
                        
                        {/* Score Metric Row */}
                        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                          {/* Radial Matching Score Gauge */}
                          <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6.5" fill="transparent" />
                              <circle cx="40" cy="40" r="34" stroke={tailoredCV.matchScore >= 80 ? '#10b981' : tailoredCV.matchScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="6.5" fill="transparent"
                                strokeDasharray={2 * Math.PI * 34}
                                strokeDashoffset={2 * Math.PI * 34 * (1 - tailoredCV.matchScore / 100)}
                                className="transition-all duration-500 ease-out"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-base font-black text-slate-800 font-mono leading-none">{tailoredCV.matchScore}%</span>
                              <span className="text-[7.5px] font-bold text-slate-450 mt-1 uppercase tracking-wider font-mono">Match</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <h4 className="text-xs font-bold text-slate-805">Resume Relevance Index</h4>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Aligns the chronological achievements of your CV dynamically to fit the prerequisites of the target intent.
                            </p>
                          </div>
                        </div>

                        {/* Keyword Optimization Lists */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-450 block font-mono">Match Audit Log</span>
                          
                          {/* Matched Keywords */}
                          {tailoredCV.matchedKeywords.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-extrabold text-emerald-600 font-mono uppercase tracking-wide">✓ Matched Keywords ({tailoredCV.matchedKeywords.length})</span>
                              <div className="flex flex-wrap gap-1">
                                {tailoredCV.matchedKeywords.map(sk => (
                                  <span key={sk} className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150 flex items-center">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Keywords */}
                          {tailoredCV.missingKeywords.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="text-[8px] font-extrabold text-amber-600 font-mono uppercase tracking-wide">⚠ Missing Intent Prerequisites ({tailoredCV.missingKeywords.length})</span>
                              <p className="text-[8px] text-slate-400">Click to automatically insert missing skills into your active CV milestones:</p>
                              <div className="flex flex-wrap gap-1">
                                {tailoredCV.missingKeywords.map(sk => (
                                  <button
                                    key={sk}
                                    type="button"
                                    onClick={() => handleQuickAddSkill(sk)}
                                    className="text-[9px] font-bold bg-white text-slate-500 border border-dashed border-slate-300 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                    title={`Add ${sk} to latest milestone`}
                                  >
                                    <Plus className="h-2.5 w-2.5" /> {sk}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Logs */}
                        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-3">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-455 block font-mono">Tailoring Agent logs</span>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 h-28 overflow-y-auto custom-scrollbar font-mono text-[8px] text-teal-400 flex flex-col gap-1 shadow-inner leading-normal">
                            {tailoredCV.logs.map((log, idx) => (
                              <div key={idx} className="flex gap-1.5 items-start">
                                <span className="text-slate-650">➔</span>
                                <span>{log}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </CardContent>
                    </Card>

                    {/* Resume Version Timeline */}
                    <Card className="border-slate-200 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-305" />
                      <CardHeader className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <FileClock className="h-4.5 w-4.5 text-slate-500" />
                          Snapshots & Parser Ingestion
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 pt-4">
                        
                        {/* Upload Trigger */}
                        {!isUploading && !pendingParsedData ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-55/50 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 relative group cursor-pointer">
                            <input 
                              type="file" 
                              accept=".pdf,.txt,.docx"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleDashboardFileChange}
                            />
                            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                              <Upload className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <h4 className="text-[10px] font-bold text-slate-800">Scan new Resume to create Version</h4>
                              <p className="text-[8px] text-slate-400">PDF, TXT, DOCX up to 5MB</p>
                            </div>
                          </div>
                        ) : isUploading ? (
                          <div className="flex flex-col gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="flex justify-between items-center text-[8.5px] font-bold font-mono text-slate-500">
                              <span>SCANNING RESUME STREAM...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-350"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          // Pending parsing summary
                          <div className="p-3 bg-teal-50/10 border border-teal-200 rounded-xl flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                              <CheckSquare className="h-4.5 w-4.5 text-teal-600 mt-0.5 shrink-0" />
                              <div className="flex flex-col gap-0.5">
                                <h4 className="text-[10px] font-bold text-slate-855">Scan Complete!</h4>
                                <p className="text-[9px] text-slate-500">Parsed {pendingParsedData.nodes?.length || 0} nodes. Ready to apply.</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleConfirmDashboardVersion}
                                className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] rounded cursor-pointer"
                              >
                                Save Snapshot
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPendingParsedData(null); setUploadFilename(''); }}
                                className="py-1.5 px-3 bg-white border border-slate-200 text-slate-500 text-[9px] font-bold rounded cursor-pointer"
                              >
                                Discard
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Versions list */}
                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {profileVersions.map((ver, idx) => {
                            const isActive = userProfile.targetRole === ver.targetRole && 
                              candidateNodes.length === ver.milestones.length &&
                              candidateNodes.every((n, i) => n.role === ver.milestones[i]?.role && n.organization === ver.milestones[i]?.organization);
                            
                            return (
                              <div key={ver.id || idx} className={`p-2.5 rounded-lg border text-[10px] flex items-center justify-between gap-3 transition-colors ${
                                isActive ? 'bg-teal-50/10 border-teal-250 font-bold' : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
                              }`}>
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800">V{ver.versionNumber}</span>
                                    <span className="text-[8px] font-bold font-mono px-1 py-0.2 rounded bg-white border border-slate-200 text-slate-500 uppercase truncate max-w-[100px]">
                                      {ver.targetRole}
                                    </span>
                                    {isActive && <span className="text-[7.5px] font-bold text-teal-600 bg-teal-50 border border-teal-150 px-1 py-0.2 rounded uppercase">Active</span>}
                                  </div>
                                  <span className="text-[8.5px] text-slate-450 font-medium truncate w-full flex items-center gap-1" title={ver.resumeFilename}>
                                    <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" /> {ver.resumeFilename}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  disabled={isActive || restoringId === ver.id}
                                  onClick={() => handleRestore(ver.id)}
                                  className="py-1 px-2.5 text-[8.5px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-650 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                  {restoringId === ver.id ? 'Restoring...' : 'Restore'}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Column: Premium Live CV Sheet Preview */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    
                    {/* CV Options Header */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHighlightDiffs(!highlightDiffs)}
                          className="px-2.5 py-1 text-[9.5px] font-extrabold rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-3xs flex items-center gap-1.5"
                        >
                          {highlightDiffs ? (
                            <>
                              <EyeOff className="h-3 w-3 text-red-500" /> Hide Highlights
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 text-teal-600" /> Highlight Diffs
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          alert(`Optimized CV exported successfully as PDF for intent: "${activeCvTarget}"!`);
                        }}
                        className="px-3 py-1 text-[9.5px] font-extrabold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> Export CV (PDF)
                      </button>
                    </div>

                    {/* Premium Styled Resume Canvas */}
                    <div className="bg-white border border-slate-250/90 shadow-xl rounded-xl p-8 md:p-10 font-sans text-slate-800 leading-relaxed max-w-[21cm] min-h-[29.7cm] relative">
                      
                      {/* SPECULAR BACKGROUND WATERMARK FOR PREMIUM LOOK */}
                      <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full bg-blue-500/[0.015] blur-3xl pointer-events-none" />

                      {/* Header Section */}
                      <div className="flex flex-col gap-2 border-b-2 border-slate-900 pb-5 mb-6">
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif uppercase">
                            {userProfile.name || 'Your Name'}
                          </h1>
                          <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-mono">
                            <span>{userProfile.email || 'your.email@example.com'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" /> Southeast Asia
                            </span>
                          </div>
                        </div>
                        
                        {/* Target Title Tag */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-650 uppercase tracking-widest font-mono">
                            {activeCvTarget}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Live Optimization Active
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Executive Summary */}
                      <div className="mb-6 flex flex-col gap-1.5">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Professional Summary</h3>
                        <p className="text-[11.5px] leading-relaxed text-slate-700 font-sans">
                          {renderTailoredText(tailoredCV.summary)}
                        </p>
                      </div>

                      {/* Timeline Milestones Section */}
                      <div className="mb-6 flex flex-col gap-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono border-b border-slate-100 pb-1 font-mono">Professional Experience</h3>
                        
                        {tailoredCV.milestones.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No milestones defined. Use the "Add Milestone" editor in the customize panel to add details.</p>
                        ) : (
                          <div className="flex flex-col gap-5">
                            {tailoredCV.milestones.map((m) => (
                              <div key={m.id} className="flex flex-col gap-1.5 group relative">
                                
                                {/* Edit Milestone overlay button for great UX */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenMilestoneEditor(m.id)}
                                  className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-450 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded transition-all cursor-pointer shadow-3xs"
                                  title="Edit Milestone"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>

                                {/* Header (Role & Org) */}
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5">
                                  <h4 className="text-[12.5px] font-black text-slate-900 leading-tight">
                                    {renderTailoredText(m.role)}
                                  </h4>
                                  <span className="text-[10px] text-slate-450 font-mono font-bold shrink-0">
                                    {m.startDate} – {m.endDate}
                                  </span>
                                </div>
                                
                                {/* Company and Type metadata */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-550 font-medium font-mono">
                                  <span className="text-slate-800 uppercase font-extrabold">{m.organization}</span>
                                  <span>|</span>
                                  <span className="capitalize">{m.type}</span>
                                </div>

                                {/* Description */}
                                <p className="text-[11px] leading-relaxed text-slate-650">
                                  {renderTailoredText(m.description)}
                                </p>

                                {/* Achievements */}
                                {m.achievements && m.achievements.length > 0 && (
                                  <ul className="list-disc pl-4 text-[10.8px] leading-relaxed text-slate-650 flex flex-col gap-1 mt-0.5">
                                    {m.achievements.map((ach, idx) => (
                                      <li key={idx}>
                                        {renderTailoredText(ach)}
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {/* Skills associated with this milestone */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {m.skills.map((s) => {
                                    const requiredSkills = SKILL_DAG[activeCvTarget]
                                      ? [activeCvTarget, ...getPreRequisitesRecursive(activeCvTarget)]
                                      : Object.keys(SKILL_DAG).filter(sk => activeCvTarget.toLowerCase().includes(sk.toLowerCase()));
                                    const isPrereq = requiredSkills.includes(s.name);
                                    return (
                                      <span
                                        key={s.name}
                                        className={`text-[8.5px] font-semibold px-2 py-0.2 rounded font-mono ${
                                          isPrereq
                                            ? 'bg-blue-50 text-blue-700 border border-blue-150'
                                            : 'bg-slate-50 text-slate-500 border border-slate-200/80'
                                        }`}
                                      >
                                        {s.name}
                                      </span>
                                    );
                                  })}
                                </div>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Technical Skills Aggregate Summary */}
                      <div className="flex flex-col gap-1.5 mt-8 border-t border-slate-250 pt-5">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Unified Technical Skills Inventory</h3>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {candidateSkills.map(sk => {
                            const requiredSkills = SKILL_DAG[activeCvTarget]
                              ? [activeCvTarget, ...getPreRequisitesRecursive(activeCvTarget)]
                              : Object.keys(SKILL_DAG).filter(s => activeCvTarget.toLowerCase().includes(s.toLowerCase()));
                            const isPrereq = requiredSkills.includes(sk);
                            return (
                              <span
                                key={sk}
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all ${
                                  isPrereq
                                    ? 'bg-blue-600 text-white border-transparent shadow-xs'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {sk}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* ────────────────────────────────────────────────────────────── */}
                {/* DYNAMIC MODALS & OVERLAYS */}
                {/* ────────────────────────────────────────────────────────────── */}

                {/* 1. Custom Career Path Manager Modal */}
                <AnimatePresence>
                  {isCustomPathModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                      >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Settings className="h-4.5 w-4.5 text-blue-600" />
                            Custom Trajectory Path Manager
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsCustomPathModalOpen(false)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                          
                          {/* List of current paths */}
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-450 block mb-2 font-mono">Current Career Paths</span>
                            <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 border border-slate-150 rounded-xl p-2 bg-slate-50/50 custom-scrollbar">
                              {careerPaths.map(path => {
                                const isDefault = ['AI Architect', 'Frontend Architect', 'Engineering Director'].includes(path);
                                return (
                                  <div key={path} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-805">
                                    <span>{path} {!isDefault && <span className="text-[8px] font-bold font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-600 uppercase">Custom</span>}</span>
                                    {!isDefault && (
                                      <button
                                        type="button"
                                        onClick={() => removeCustomPath(path)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                        title="Delete custom path"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Path Creator Form */}
                          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 block font-mono">Create New Target Trajectory</span>
                            
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Path Title Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Cloud Security Specialist, Data Platforms Director..."
                                value={newPathName}
                                onChange={(e) => setNewPathName(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Brief Intent Description</label>
                              <textarea
                                placeholder="Describe the strategic purpose of this target path..."
                                value={newPathDesc}
                                onChange={(e) => setNewPathDesc(e.target.value)}
                                className="w-full h-16 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:border-blue-500 resize-none font-sans"
                              />
                            </div>

                            {/* Select Skills checkbox list */}
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Select Required Skills from DAG</label>
                              <p className="text-[8px] text-slate-400 mb-2">Check all foundational and specialist skills needed for this path:</p>
                              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 custom-scrollbar text-[10.5px]">
                                {Object.keys(SKILL_DAG).map(skill => (
                                  <label key={skill} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
                                    <input
                                      type="checkbox"
                                      checked={newPathSkills.includes(skill)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setNewPathSkills(prev => [...prev, skill]);
                                        } else {
                                          setNewPathSkills(prev => prev.filter(s => s !== skill));
                                        }
                                      }}
                                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                    />
                                    <span>{skill}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsCustomPathModalOpen(false)}
                            className="px-4 py-2 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveCustomPath}
                            disabled={!newPathName.trim() || newPathSkills.length === 0}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                          >
                            Save Pathway
                          </button>
                        </div>

                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 2. Milestone Editor Sidebar Overlay */}
                <AnimatePresence>
                  {isMilestoneEditorOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40">
                      {/* Sidebar Container */}
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-250 shadow-2xl z-50 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar text-slate-800 select-none"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-1">
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                            <User className="h-4.5 w-4.5 text-teal-600" />
                            {editingMilestoneId ? 'Edit Milestone Node' : 'Add Milestone Node'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => { setIsMilestoneEditorOpen(false); setEditingMilestoneId(null); }}
                            className="p-1 rounded-lg hover:bg-slate-105 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Form Body */}
                        <div className="flex flex-col gap-4 flex-1">
                          
                          {/* Role Title */}
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Role Title</label>
                            <input
                              type="text"
                              value={msRole}
                              onChange={(e) => setMsRole(e.target.value)}
                              placeholder="e.g. Deep Learning Specialist, Senior Developer"
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          {/* Company / Org */}
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Organization / Company</label>
                            <input
                              type="text"
                              value={msOrg}
                              onChange={(e) => setMsOrg(e.target.value)}
                              placeholder="e.g. Petronas, Grab, UM"
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          {/* Milestone Type */}
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Milestone Type</label>
                            <select
                              value={msType}
                              onChange={(e) => setMsType(e.target.value as any)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="employment">Employment</option>
                              <option value="sabbatical">Sabbatical / Career Break</option>
                              <option value="academic">Academic Degree</option>
                              <option value="project">Project / Freelance</option>
                            </select>
                          </div>

                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Start Date</label>
                              <input
                                type="text"
                                placeholder="YYYY-MM (e.g. 2022-01)"
                                value={msStart}
                                onChange={(e) => setMsStart(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">End Date</label>
                              <input
                                type="text"
                                placeholder="YYYY-MM or Present"
                                value={msEnd}
                                onChange={(e) => setMsEnd(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Core Descriptions & Achievements</label>
                            <textarea
                              placeholder="Outline milestones achievements. Separate major achievements with newlines or hyphens."
                              value={msDesc}
                              onChange={(e) => setMsDesc(e.target.value)}
                              className="w-full h-24 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 resize-none font-sans leading-normal"
                            />
                          </div>

                          {/* Associated Skills checklist */}
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Verify Mapped Skills</label>
                            <p className="text-[8px] text-slate-400 mb-2">Check all skills demonstrating competence in this milestone:</p>
                            <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 custom-scrollbar text-[10.5px]">
                              {Object.keys(SKILL_DAG).map(skill => (
                                <label key={skill} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
                                  <input
                                    type="checkbox"
                                    checked={msSkills.includes(skill)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setMsSkills(prev => [...prev, skill]);
                                      } else {
                                        setMsSkills(prev => prev.filter(s => s !== skill));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                                  />
                                  <span>{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Delete Milestone Button */}
                          {editingMilestoneId && (
                            <div className="mt-2 pt-3 border-t border-slate-100 flex justify-start">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this career milestone?')) {
                                    deleteNode(editingMilestoneId);
                                    setIsMilestoneEditorOpen(false);
                                    setEditingMilestoneId(null);
                                  }
                                }}
                                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 hover:text-rose-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                              >
                                <Trash2 className="h-4 w-4" /> Delete Milestone Node
                              </button>
                            </div>
                          )}

                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 pt-4 bg-white flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => { setIsMilestoneEditorOpen(false); setEditingMilestoneId(null); }}
                            className="px-4 py-2 bg-white border border-slate-250 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveMilestone}
                            disabled={!msRole.trim() || !msOrg.trim() || !msStart.trim()}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                          >
                            Save Milestone
                          </button>
                        </div>

                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Bottom Row: Ingestion Matrix (parser layer) */}
                <div className="mt-8">
                  <IngestionMatrix />
                </div>
              </div>
            )}  )}

            {activeTab === 'forecast' && <ForecastingSimulator />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
