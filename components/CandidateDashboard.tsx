'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import TemporalCanvas from './TemporalCanvas';
import ForecastingSimulator from './ForecastingSimulator';
import CohortInsights from './CohortInsights';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import {
  Briefcase, Layers, TrendingUp, Sparkles, CheckCircle2, User,
  FileText, History, RefreshCw, Upload, Database, Check, AlertCircle, FileClock,
  MapPin, Globe, Settings, Plus, Trash2, Edit3, X, Sparkle, Download, CheckSquare, ListPlus,
  Eye, EyeOff, ArrowRight, Users, Terminal, Cpu, FileSpreadsheet, Maximize2
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
    saveTailoredVersion,
    onboardCandidate,
    careerPaths,
    addCustomPath,
    removeCustomPath,
    updateNode,
    addNode,
    deleteNode,
    cohortAnalysis,
    setCandidateNodes,
    setSelectedSkillPath
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
  const [pendingAddSkill, setPendingAddSkill] = useState<string | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Live CV States
  const [cvMode, setCvMode] = useState<'path' | 'job'>('path');
  const [intentPath, setIntentPath] = useState<string>('AI Architect');
  const [targetJobId, setTargetJobId] = useState<string>('');
  const [customJobText, setCustomJobText] = useState<string>('');
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(true);
  const [isCustomPathModalOpen, setIsCustomPathModalOpen] = useState<boolean>(false);
  const [isMilestoneEditorOpen, setIsMilestoneEditorOpen] = useState<boolean>(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [uploadedPdfData, setUploadedPdfData] = useState<string | null>(null);
  const [showExpandedStats, setShowExpandedStats] = useState(false);

  useEffect(() => {
    if (userProfile.pdfData) {
      setUploadedPdfData(userProfile.pdfData);
    }
  }, [userProfile.pdfData]);

  const [customRealignmentPrompt, setCustomRealignmentPrompt] = useState<string>('');

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

  // Sliding Alerts State
  const [activeAlert, setActiveAlert] = useState<{ prefix: string; similarity: number; suffix: string } | null>(null);

  // AI Agent Optimization States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStage, setOptimizationStage] = useState<'idle' | 'analyzing' | 'tailoring' | 'finishing'>('idle');
  const [simulatedScore, setSimulatedScore] = useState(0);
  const [displayedSummary, setDisplayedSummary] = useState('');
  const [displayedMilestones, setDisplayedMilestones] = useState<CareerNode[]>([]);
  const [needsOptimization, setNeedsOptimization] = useState(false);
  const [lastOptimizedTarget, setLastOptimizedTarget] = useState('');
  const [agentConsoleLogs, setAgentConsoleLogs] = useState<string[]>([]);

  // Sliding Alerts Trigger
  useEffect(() => {
    const alerts = [
      { prefix: "Anonymous User", similarity: 78, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous Peer from Kuala Lumpur", similarity: 82, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous Frontend Architect", similarity: 74, suffix: "path overlap - inspect their blueprint!" },
      { prefix: "Anonymous User", similarity: 78, suffix: "trajectory similarity - check it out!" },
      { prefix: "Anonymous Engineering Manager from Grab", similarity: 89, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous AI Architect from UM", similarity: 80, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous Staff Software Engineer", similarity: 85, suffix: "path similarity - inspect now!" },
      { prefix: "Anonymous User", similarity: 78, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous Platform Engineer", similarity: 81, suffix: "path with yours - check it out!" },
      { prefix: "Anonymous Tech Lead from Penang", similarity: 84, suffix: "path overlap - check it out!" }
    ];

    const showRandomAlert = () => {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      const similarityWithVariance = Math.min(100, Math.max(50, randomAlert.similarity + Math.floor(Math.random() * 7) - 3));

      setActiveAlert({
        prefix: randomAlert.prefix,
        similarity: similarityWithVariance,
        suffix: randomAlert.suffix
      });

      setTimeout(() => {
        setActiveAlert(null);
      }, 4500);
    };

    const initialTimeout = setTimeout(showRandomAlert, 6000);
    const interval = setInterval(showRandomAlert, 18000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

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

  // Extract original summary if parsed from OCR previously
  const originalSummary = useMemo(() => {
    if (!userProfile.marketAnalysis) return '';
    try {
      const parsed = JSON.parse(userProfile.marketAnalysis);
      return parsed.summary || '';
    } catch (e) {
      return '';
    }
  }, [userProfile.marketAnalysis]);

  // Compute the tailored CV
  const tailoredCV = useMemo(() => {
    return tailorCVForTarget(
      candidateNodes,
      candidateSkills,
      activeCvTarget,
      cvMode === 'job' && targetJobId === 'custom' ? customJobText : undefined,
      originalSummary
    );
  }, [candidateNodes, candidateSkills, activeCvTarget, cvMode, targetJobId, customJobText, originalSummary]);

  // Trigger simulation of AI tailoring
  const triggerOptimizationSimulation = () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    setOptimizationStage('analyzing');
    setSimulatedScore(Math.floor(Math.random() * 20) + 30); // start at lower score

    const logs = [
      `[AI Agent] Connecting to TKG (Trajectory Knowledge Graph) API endpoints...`,
      `[AI Agent] Analyzing destination requirements for target: "${activeCvTarget}"`,
      customRealignmentPrompt.trim()
        ? `[AI Agent] Applying custom alignment prompt constraints: "${customRealignmentPrompt.trim()}"`
        : `[AI Agent] No custom constraints provided. Running standard alignment.`,
      `[AI Agent] Found ${tailoredCV.matchedKeywords.length} matched skills, ${tailoredCV.missingKeywords.length} missing prerequisites.`,
      `[NLP Realignment] Realignment coefficient computed. Adjusting summary and achievements...`
    ];
    setAgentConsoleLogs(logs);

    // Laser scanning horizontal sweep effect
    const canvasElement = document.getElementById('printable-resume-canvas');
    if (canvasElement) {
      canvasElement.classList.add('relative');
    }

    setTimeout(() => {
      setOptimizationStage('tailoring');
      setAgentConsoleLogs(prev => [
        ...prev,
        `[NLP Realignment] Re-aligning milestone achievements for target: ${activeCvTarget}`,
        `[Typewriter Mode] Appending matching skill pills into context...`,
        `[Typewriter Mode] Typing aligned summaries and job details...`
      ]);

      // Initialize with empty descriptions/achievements for typewriter typing effect
      const milestonesCopy = tailoredCV.milestones.map(m => ({
        ...m,
        description: '',
        achievements: m.achievements ? m.achievements.map(() => '') : []
      }));
      setDisplayedMilestones(milestonesCopy);

      const summaryWords = tailoredCV.summary.split(' ');
      let currentSummaryIdx = 0;

      let currentMilestoneIdx = 0;
      let currentDescWordIdx = 0;
      let currentAchIdx = 0;
      let currentAchWordIdx = 0;

      const timer = setInterval(() => {
        let completed = false;

        // Check if we are typing the summary
        if (currentSummaryIdx < summaryWords.length) {
          currentSummaryIdx += 1;
          setDisplayedSummary(summaryWords.slice(0, currentSummaryIdx).join(' ') + ' █');
        } else {
          // Summary is finished, make sure there's no cursor
          setDisplayedSummary(tailoredCV.summary);

          // Now type milestones sequentially
          if (currentMilestoneIdx < tailoredCV.milestones.length) {
            const targetMilestone = tailoredCV.milestones[currentMilestoneIdx];
            const targetDescWords = targetMilestone.description.split(' ').filter(Boolean);
            
            // Check if we are typing description
            if (currentDescWordIdx < targetDescWords.length) {
              currentDescWordIdx += 1;
              const newDesc = targetDescWords.slice(0, currentDescWordIdx).join(' ') + ' █';
              
              setDisplayedMilestones(prev => prev.map((m, idx) => {
                if (idx === currentMilestoneIdx) {
                  return { ...m, description: newDesc };
                }
                return m;
              }));
            } else {
              // Description finished, make sure it's clean (no cursor)
              setDisplayedMilestones(prev => prev.map((m, idx) => {
                if (idx === currentMilestoneIdx) {
                  return { ...m, description: targetMilestone.description };
                }
                return m;
              }));

              // Check if we are typing achievements
              const targetAchievements = targetMilestone.achievements || [];
              if (currentAchIdx < targetAchievements.length) {
                const targetAch = targetAchievements[currentAchIdx];
                const targetAchWords = targetAch.split(' ').filter(Boolean);

                if (currentAchWordIdx < targetAchWords.length) {
                  currentAchWordIdx += 1;
                  const newAch = targetAchWords.slice(0, currentAchWordIdx).join(' ') + ' █';

                  setDisplayedMilestones(prev => prev.map((m, idx) => {
                    if (idx === currentMilestoneIdx) {
                      const achs = [...(m.achievements || [])];
                      achs[currentAchIdx] = newAch;
                      return { ...m, achievements: achs };
                    }
                    return m;
                  }));
                } else {
                  // Achievement finished, clean it up
                  setDisplayedMilestones(prev => prev.map((m, idx) => {
                    if (idx === currentMilestoneIdx) {
                      const achs = [...(m.achievements || [])];
                      achs[currentAchIdx] = targetAch;
                      return { ...m, achievements: achs };
                    }
                    return m;
                  }));

                  // Go to next achievement
                  currentAchIdx += 1;
                  currentAchWordIdx = 0;
                }
              } else {
                // Milestone finished! Move to next milestone
                currentMilestoneIdx += 1;
                currentDescWordIdx = 0;
                currentAchIdx = 0;
                currentAchWordIdx = 0;
              }
            }
          } else {
            // Everything is completed!
            completed = true;
          }
        }

        // Tick simulated score towards the actual tailored matchScore
        setSimulatedScore(prev => {
          if (prev < tailoredCV.matchScore) {
            return Math.min(tailoredCV.matchScore, prev + 1);
          }
          return prev;
        });

        if (completed) {
          clearInterval(timer);
          setDisplayedSummary(tailoredCV.summary);
          setDisplayedMilestones(tailoredCV.milestones);
          setSimulatedScore(tailoredCV.matchScore);
          setOptimizationStage('finishing');

          setAgentConsoleLogs(prev => [
            ...prev,
            `[AI Agent] Realignment finalized. Match relevance verified at ${tailoredCV.matchScore}%.`,
            `[AI Agent] Saving snapshot...`
          ]);

          // Trigger automatic save to database!
          const filename = `Auto-Tailored: ${activeCvTarget}`;
          const resumeText = `
NAME: ${userProfile.name || 'Candidate'}
EMAIL: ${userProfile.email || ''}
TARGET ROLE: ${activeCvTarget}
SUMMARY: ${tailoredCV.summary}
EXPERIENCE:
${tailoredCV.milestones.map(m => `
- ${m.role.replace(/\[\[OPT:.*?\]\]/g, '')} at ${m.organization} (${m.startDate} - ${m.endDate})
  Description: ${m.description.replace(/\[\[OPT:.*?\]\]/g, '')}
  Achievements: ${(m.achievements || []).map(ach => ach.replace(/\[\[OPT:.*?\]\]/g, '')).join(', ')}
`).join('\n')}
          `;
          const resumeTextBase64 = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(resumeText)));
          saveTailoredVersion(
            userProfile.email,
            activeCvTarget,
            tailoredCV.milestones,
            filename,
            JSON.stringify({ summary: tailoredCV.summary }),
            resumeTextBase64
          ).then(result => {
            if (result.success) {
              // Update client-side active milestones and profile to match the newly optimized active state!
              setCandidateNodes(tailoredCV.milestones);
              updateUserProfile({
                targetRole: activeCvTarget,
                marketAnalysis: JSON.stringify({ summary: tailoredCV.summary }),
                pdfData: resumeTextBase64
              });
              setSelectedSkillPath(activeCvTarget);

              setAgentConsoleLogs(prev => [
                ...prev,
                `[AI Agent] Snapshot saved.`,
                `[AI Agent] Optimization run complete.`
              ]);
            } else {
              setAgentConsoleLogs(prev => [
                ...prev,
                `[AI Agent] Auto-save failed: ${result.error || 'OfflineFallback'}`
              ]);
            }
          });

          setTimeout(() => {
            setIsOptimizing(false);
            setOptimizationStage('idle');
            setLastOptimizedTarget(activeCvTarget);
            setNeedsOptimization(false);
          }, 800);
        }
      }, 150);
    }, 1500); // 1.5s for analysis and scanning sweep
  };

  // Sync initial state or manual updates when NOT optimizing
  useEffect(() => {
    if (!isOptimizing && tailoredCV) {
      setDisplayedSummary(tailoredCV.summary);
      setDisplayedMilestones(tailoredCV.milestones);
      setSimulatedScore(tailoredCV.matchScore);
      setLastOptimizedTarget(activeCvTarget);
    }
  }, [tailoredCV, isOptimizing, activeCvTarget]);

  // Set needsOptimization = true when CV target properties change
  useEffect(() => {
    if (tailoredCV) {
      if (lastOptimizedTarget && lastOptimizedTarget !== activeCvTarget) {
        setNeedsOptimization(true);
      }
    }
  }, [activeCvTarget, cvMode, targetJobId, candidateNodes.length, lastOptimizedTarget]);

  // Helper to highlight tailoring diffs
  const renderTailoredText = (text: string) => {
    if (!text) return null;

    // Check if there is a typing cursor '█' at the end
    const hasCursor = text.endsWith(' █') || text.endsWith('█');
    const cleanText = hasCursor ? (text.endsWith(' █') ? text.slice(0, -2) : text.slice(0, -1)) : text;

    const parts = cleanText.split(/(\[\[OPT:.*?\]\])/g);
    const rendered = parts.map((part, idx) => {
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

    if (hasCursor) {
      return (
        <>
          {rendered}
          <span className="text-blue-500 font-black ml-0.5 animate-cursor-blink">█</span>
        </>
      );
    }
    return rendered;
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

    // Read PDF file as base64 on client side
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPdfData(reader.result as string);
    };
    reader.readAsDataURL(file);

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

    const performParse = async (txtContent: string) => {
      try {
        const result = await uploadAndParseResume(file, txtContent);
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
            const localParsed = analyzeResumeText(txtContent || file.name);
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

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const textReader = new FileReader();
      textReader.onload = () => {
        performParse(textReader.result as string);
      };
      textReader.readAsText(file);
    } else {
      performParse('');
    }
  };

  const handleConfirmDashboardVersion = async () => {
    if (!pendingParsedData) return;
    setIsUploading(true);

    const rolesArray = pendingParsedData.recommendedRoles || [
      { role: pendingParsedData.recommendedRole || 'AI Architect', justification: pendingParsedData.marketAnalysis?.justification || 'Highly aligned with your profile.' }
    ];
    const matchingOption = rolesArray.find((r: any) => r.role === selectedDashboardRole);

    // Incorporate the parsed summary into marketAnalysis object
    let finalMarketAnalysis = pendingParsedData.marketAnalysis || {};
    finalMarketAnalysis = {
      ...finalMarketAnalysis,
      summary: pendingParsedData.summary || '',
      justification: matchingOption ? matchingOption.justification : 'Custom trajectory specified by applicant.'
    };

    const res = await onboardCandidate(
      userProfile.email,
      selectedDashboardRole,
      pendingParsedData.nodes,
      uploadFilename,
      JSON.stringify(finalMarketAnalysis),
      uploadedPdfData || undefined
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
    } else {
      const restoredVer = profileVersions.find(v => v.id === versionId);
      if (restoredVer) {
        setNeedsOptimization(false);
        setLastOptimizedTarget(restoredVer.targetRole);
        setIntentPath(restoredVer.targetRole);
      }
    }
    setRestoringId(null);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('trajectory')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${activeTab === 'trajectory'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          My Career Map
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${activeTab === 'profile'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Profile & Resume Builder
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${activeTab === 'forecast'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Career Move Planner
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
              <div className="flex flex-col gap-6">
                {/* Warning Banner when optimization is needed */}
                {needsOptimization && (
                  <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-3 flex items-center justify-between gap-3 animate-pulse-glow">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-100">Path Alignment Required</span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400">You updated your trajectory target. Click "Optimize Resume" to trigger the AI alignment.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={triggerOptimizationSimulation}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs flex items-center gap-1"
                    >
                      Align Now
                    </button>
                  </div>
                )}

                {/* Dynamic Workspace Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                  {/* Column 1: Settings & Snapshots (Left Panel) */}
                  <div className="xl:col-span-3 lg:col-span-4 flex flex-col gap-6 order-1">

                    {/* Optimization Targeting Panel */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden bg-white dark:bg-slate-950">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-500" />
                      <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/10">
                        <Settings className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <div className="flex flex-col">
                          <CardTitle className="text-sm font-extrabold text-slate-850 dark:text-white">Optimizer Settings</CardTitle>
                          <span className="text-[9px] text-slate-450 dark:text-slate-500">Tailor CV achievements using AI</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 pt-4">

                        {/* CV Mode Select */}
                        <div>
                          <label className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-2 font-mono">CV Target Intent Mode</label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-150 dark:border-slate-850">
                            <button
                              type="button"
                              onClick={() => setCvMode('path')}
                              className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${cvMode === 'path'
                                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm border border-slate-200 dark:border-slate-700'
                                  : 'text-slate-500 dark:text-slate-450 hover:text-slate-805 dark:hover:text-slate-200'
                                }`}
                            >
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-[11px] tracking-tight">Trajectory</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCvMode('job')}
                              className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${cvMode === 'job'
                                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm border border-slate-200 dark:border-slate-700'
                                  : 'text-slate-500 dark:text-slate-455 hover:text-slate-805 dark:hover:text-slate-200'
                                }`}
                            >
                              <Briefcase className="h-4 w-4" />
                              <span className="text-[11px] tracking-tight">Job Listing</span>
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Selectors based on mode */}
                        {cvMode === 'path' ? (
                          <div className="flex flex-col gap-2.5">
                            <label className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block font-mono">Active Target Pathway</label>
                            <select
                              value={intentPath}
                              onChange={(e) => setIntentPath(e.target.value)}
                              className="w-full max-w-full text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-805 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 cursor-pointer truncate font-medium transition-all"
                            >
                              {careerPaths.map(path => (
                                <option key={path} value={path}>{path}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setIsCustomPathModalOpen(true)}
                              className="w-full py-2 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-2xs transition-colors"
                              title="Manage custom paths"
                            >
                              <ListPlus className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" /> Manage Custom Pathways
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 font-mono">Choose Matched Job Opportunity</label>
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
                                className="w-full max-w-full text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-855 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 cursor-pointer truncate font-medium transition-all"
                              >
                                <option value="">-- Select Matched Job --</option>
                                {cohortAnalysis?.matchedJobs.map(job => (
                                  <option key={job.id} value={job.id}>{job.role} at {job.company} ({job.matchPercentage}% match)</option>
                                ))}
                                <option value="custom">✦ Paste Custom Job Description ✦</option>
                              </select>
                            </div>

                            {targetJobId === 'custom' && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9.5px] uppercase font-bold tracking-wider text-slate-550 dark:text-slate-400 block font-mono">Pasted Job Requirements</label>
                                <textarea
                                  placeholder="Paste the job description or requirements here to dynamically adapt the CV..."
                                  value={customJobText}
                                  onChange={(e) => setCustomJobText(e.target.value)}
                                  className="w-full h-24 text-[11px] bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none font-sans transition-all"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resume Actions */}
                        <div className="flex flex-col gap-2 mt-1 pt-3 border-t border-slate-150 dark:border-slate-850">
                          <button
                            type="button"
                            onClick={() => handleOpenMilestoneEditor(null)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-99 transition-all"
                          >
                            <Plus className="h-4 w-4" /> Add Milestone Node
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMilestoneEditor(candidateNodes[0]?.id || null)}
                            className="w-full py-2.5 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={candidateNodes.length === 0}
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500 shrink-0" /> Edit Milestones Timeline
                          </button>
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
                          {(() => {
                            // Find the first (latest) version that matches the current resume state
                            const activeVer = profileVersions.find(ver => {
                              if (userProfile.targetRole !== ver.targetRole) return false;
                              if (candidateNodes.length !== ver.milestones.length) return false;

                              // Parse active summary
                              let activeSummary = '';
                              try {
                                const parsed = JSON.parse(userProfile.marketAnalysis || '{}');
                                activeSummary = parsed.summary || '';
                              } catch (e) { }

                              // Parse version summary
                              let verSummary = '';
                              try {
                                const parsed = JSON.parse(ver.marketAnalysis || '{}');
                                verSummary = parsed.summary || '';
                              } catch (e) { }

                              if (activeSummary !== verSummary) return false;

                              return candidateNodes.every((n, i) => {
                                const vMil = ver.milestones[i];
                                if (!vMil) return false;

                                const roleMatches = n.role === vMil.role;
                                const orgMatches = n.organization === vMil.organization;
                                const descMatches = (n.description || '') === (vMil.description || '');
                                const startMatches = n.startDate === vMil.startDate;
                                const endMatches = n.endDate === vMil.endDate;

                                // Compare achievements if present
                                const activeAchs = n.achievements || [];
                                const verAchs = vMil.achievements || [];
                                const achsMatch = activeAchs.length === verAchs.length && activeAchs.every((ach, idx) => ach === verAchs[idx]);

                                // Compare skills names if present
                                const activeSkillsList = (n.skills || []).map(s => s.name).sort();
                                const verSkillsList = (vMil.skills || []).map((s: any) => s.name).sort();
                                const skillsMatch = activeSkillsList.length === verSkillsList.length && activeSkillsList.every((sk, idx) => sk === verSkillsList[idx]);

                                return roleMatches && orgMatches && descMatches && startMatches && endMatches && achsMatch && skillsMatch;
                              });
                            });

                            return profileVersions.map((ver, idx) => {
                              const isActive = activeVer ? ver.id === activeVer.id : false;
                              return (
                                <div key={ver.id || idx} className={`p-2.5 rounded-lg border text-[10px] flex items-center justify-between gap-3 transition-colors ${isActive ? 'bg-teal-50/10 border-teal-250 font-bold' : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
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
                            });
                          })()}
                        </div>

                      </CardContent>
                    </Card>

                  </div>

                  {/* Column 2: Document Canvas (Center Panel) */}
                  <div className="xl:col-span-6 lg:col-span-8 flex flex-col gap-4 order-2">

                    {/* CV Options Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setHighlightDiffs(!highlightDiffs)}
                          className="px-2.5 py-1.5 text-[9.5px] font-extrabold rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-3xs flex items-center gap-1.5"
                        >
                          {highlightDiffs ? (
                            <>
                              <EyeOff className="h-3 w-3 text-red-500" /> Hide Highlights
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 text-teal-650" /> Highlight Diffs
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={triggerOptimizationSimulation}
                          disabled={isOptimizing}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all duration-350 cursor-pointer shadow-md ${isOptimizing
                              ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse'
                              : needsOptimization
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:shadow-lg scale-[1.02] ring-2 ring-blue-500/20'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            }`}
                        >
                          <Sparkles className={`h-3.5 w-3.5 ${isOptimizing || needsOptimization ? 'text-amber-500' : 'text-slate-400'}`} />
                          {isOptimizing ? 'AI Tailoring Running...' : needsOptimization ? '✦ Optimize Resume' : 'Resume Tailored'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isOptimizing || isSavingSnapshot || isExportingPdf}
                          onClick={async () => {
                            if (isSavingSnapshot) return;
                            setIsSavingSnapshot(true);
                            try {
                              const filename = `Snapshot tailored for ${activeCvTarget}`;
                              const resumeText = `
NAME: ${userProfile.name || 'Candidate'}
EMAIL: ${userProfile.email || ''}
TARGET ROLE: ${activeCvTarget}
SUMMARY: ${tailoredCV.summary}
EXPERIENCE:
${tailoredCV.milestones.map(m => `
- ${m.role.replace(/\[\[OPT:.*?\]\]/g, '')} at ${m.organization} (${m.startDate} - ${m.endDate})
  Description: ${m.description.replace(/\[\[OPT:.*?\]\]/g, '')}
  Achievements: ${(m.achievements || []).map(ach => ach.replace(/\[\[OPT:.*?\]\]/g, '')).join(', ')}
`).join('\n')}
                              `;
                              const resumeTextBase64 = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(resumeText)));
                              const result = await saveTailoredVersion(
                                userProfile.email,
                                activeCvTarget,
                                tailoredCV.milestones,
                                filename,
                                JSON.stringify({ summary: tailoredCV.summary }),
                                resumeTextBase64
                              );
                              if (result.success) {
                                setCandidateNodes(tailoredCV.milestones);
                                updateUserProfile({
                                  targetRole: activeCvTarget,
                                  marketAnalysis: JSON.stringify({ summary: tailoredCV.summary }),
                                  pdfData: resumeTextBase64
                                });
                                setSelectedSkillPath(activeCvTarget);
                                setLastOptimizedTarget(activeCvTarget);
                                setNeedsOptimization(false);
                                alert(`Tailored snapshot saved successfully in snapshot history!`);
                              } else {
                                alert(`Failed to save snapshot: ${result.error}`);
                              }
                            } catch (e: any) {
                              // console.error('Error saving snapshot:', e);
                              alert(`Error saving snapshot: ${e.message}`);
                            } finally {
                              setIsSavingSnapshot(false);
                            }
                          }}
                          className="px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-3xs flex items-center gap-1.5"
                        >
                          <Database className="h-3 w-3 text-slate-500" /> {isSavingSnapshot ? 'Saving...' : 'Save Snapshot'}
                        </button>

                        <button
                          type="button"
                          disabled={isOptimizing || isSavingSnapshot || isExportingPdf}
                          onClick={async () => {
                            if (isExportingPdf) return;
                            setIsExportingPdf(true);
                            try {
                              const filename = `PDF Export: ${activeCvTarget} (${new Date().toLocaleDateString()})`;
                              const resumeText = `
NAME: ${userProfile.name || 'Candidate'}
EMAIL: ${userProfile.email || ''}
TARGET ROLE: ${activeCvTarget}
SUMMARY: ${tailoredCV.summary}
EXPERIENCE:
${tailoredCV.milestones.map(m => `
- ${m.role.replace(/\[\[OPT:.*?\]\]/g, '')} at ${m.organization} (${m.startDate} - ${m.endDate})
  Description: ${m.description.replace(/\[\[OPT:.*?\]\]/g, '')}
  Achievements: ${(m.achievements || []).map(ach => ach.replace(/\[\[OPT:.*?\]\]/g, '')).join(', ')}
`).join('\n')}
                              `;
                              const resumeTextBase64 = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(resumeText)));
                              const result = await saveTailoredVersion(
                                userProfile.email,
                                activeCvTarget,
                                tailoredCV.milestones,
                                filename,
                                JSON.stringify({ summary: tailoredCV.summary }),
                                resumeTextBase64
                              );
                              if (result.success) {
                                setCandidateNodes(tailoredCV.milestones);
                                updateUserProfile({
                                  targetRole: activeCvTarget,
                                  marketAnalysis: JSON.stringify({ summary: tailoredCV.summary }),
                                  pdfData: resumeTextBase64
                                });
                                setSelectedSkillPath(activeCvTarget);
                                setLastOptimizedTarget(activeCvTarget);
                                setNeedsOptimization(false);
                              }
                              // Open isolated print window with only the resume canvas content
                              setTimeout(() => {
                                const canvasEl = document.getElementById('printable-resume-canvas');
                                if (!canvasEl) {
                                  alert('Could not find resume canvas to export.');
                                  return;
                                }
                                // Clone the canvas HTML
                                const canvasHtml = canvasEl.cloneNode(true) as HTMLElement;
                                // Remove scanner laser and watermark elements from clone
                                canvasHtml.querySelectorAll('.animate-scan, .pointer-events-none').forEach(el => el.remove());
                                // Strip [[OPT:...]] markers from rendered text
                                canvasHtml.querySelectorAll('*').forEach(el => {
                                  if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                                    el.textContent = el.textContent?.replace(/\[\[OPT:(.*?)\]\]/g, '$1') ?? '';
                                  }
                                });
                                // Remove edit buttons that appear on hover
                                canvasHtml.querySelectorAll('button').forEach(btn => btn.remove());

                                const printWin = window.open('', '_blank', 'width=900,height=1200');
                                if (!printWin) {
                                  alert('Pop-up was blocked. Please allow pop-ups to export PDF.');
                                  return;
                                }
                                printWin.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CV – ${userProfile.name || 'Resume'} – ${activeCvTarget}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: white; font-family: 'Inter', sans-serif; color: #1e293b; font-size: 11px; }
    @page { size: A4; margin: 15mm 18mm; }
    @media print {
      html, body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    body { padding: 32px 40px; max-width: 794px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; }
    h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-family: monospace; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h4 { font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 2px; line-height: 1.3; }
    p { font-size: 11px; color: #475569; line-height: 1.7; }
    ul { list-style: disc; padding-left: 16px; }
    ul li { font-size: 10.5px; color: #475569; line-height: 1.6; margin-bottom: 2px; }
    .header-block { border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
    .header-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .meta-contact { display: flex; gap: 12px; font-size: 10px; font-family: monospace; color: #64748b; }
    .target-tag { font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; margin-top: 6px; }
    .section { margin-bottom: 22px; }
    .milestone { margin-bottom: 18px; }
    .milestone-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; margin-bottom: 2px; }
    .milestone-date { font-size: 10px; font-family: monospace; color: #64748b; font-weight: 700; white-space: nowrap; }
    .milestone-org { font-size: 10px; font-family: monospace; color: #334155; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
    .skill-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
    .chip { font-size: 8.5px; font-weight: 600; padding: 2px 7px; border-radius: 4px; font-family: monospace; }
    .chip-highlight { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .chip-neutral { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    .skills-section { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    /* Strip scan and blur effects */
    .animate-scan, .blur-3xl { display: none !important; }
    /* Remove edit button overlays */
    button { display: none !important; }
    /* Highlight spans – keep text, strip bg highlight for clean print */
    span[class*="bg-emerald"] { background: transparent !important; color: inherit !important; border: none !important; }
    input[type="checkbox"] { display: inline-block !important; width: 12px; height: 12px; }
  </style>
</head>
<body>
  <div class="header-block">
    <div class="header-meta">
      <h1>${userProfile.name || 'Candidate'}</h1>
      <div class="meta-contact">
        <span>${userProfile.email || ''}</span>
        <span>•</span>
        <span>Southeast Asia</span>
      </div>
    </div>
    <div class="target-tag">${activeCvTarget}</div>
  </div>

  <div class="section">
    <h3>Professional Summary</h3>
    <p>${(tailoredCV.summary || '').replace(/\[\[OPT:(.*?)\]\]/g, '$1').replace(/█/g, '')}</p>
  </div>

  <div class="section">
    <h3>Professional Experience</h3>
    ${displayedMilestones.map(m => `
    <div class="milestone">
      <div class="milestone-header">
        <h4>${m.role.replace(/\[\[OPT:(.*?)\]\]/g, '$1').replace(/█/g, '')}</h4>
        <span class="milestone-date">${m.startDate} – ${m.endDate}</span>
      </div>
      <div class="milestone-org">${m.organization} | ${m.type}</div>
      <p>${(m.description || '').replace(/\[\[OPT:(.*?)\]\]/g, '$1').replace(/█/g, '')}</p>
      ${m.achievements && m.achievements.length > 0 ? `
      <ul>
        ${m.achievements.map(ach => `<li>${ach.replace(/\[\[OPT:(.*?)\]\]/g, '$1').replace(/█/g, '')}</li>`).join('')}
      </ul>` : ''}
      ${m.skills && m.skills.length > 0 ? `
      <div class="skill-chips">
        ${m.skills.map(s => `<span class="chip chip-neutral">${s.name}</span>`).join('')}
      </div>` : ''}
    </div>`).join('')}
  </div>

  <div class="skills-section">
    <h3>Unified Technical Skills Inventory</h3>
    <div class="skill-chips" style="margin-top:8px;">
      ${candidateSkills.map(sk => `<span class="chip chip-neutral">${sk}</span>`).join('')}
    </div>
  </div>
</body>
</html>`);
                                printWin.document.close();
                                printWin.focus();
                                // Wait for fonts to load then print
                                setTimeout(() => {
                                  printWin.print();
                                  printWin.close();
                                }, 800);
                              }, 200);
                            } catch (e: any) {
                              // console.error('Error exporting PDF:', e);
                              alert(`Error exporting PDF: ${e.message}`);
                            } finally {
                              setIsExportingPdf(false);
                            }
                          }}
                          className="px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" /> {isExportingPdf ? 'Exporting...' : 'Export CV (PDF)'}
                        </button>
                      </div>
                    </div>

                    {/* Premium Styled Resume Canvas */}
                    <div id="printable-resume-canvas" className="bg-white border border-slate-250/90 shadow-xl rounded-xl p-8 md:p-10 font-sans text-slate-800 leading-relaxed max-w-[21cm] min-h-[29.7cm] relative overflow-hidden">

                      {/* SCANNING LASER EFFECT */}
                      {isOptimizing && optimizationStage === 'analyzing' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent blur-[1px] opacity-90 animate-scan pointer-events-none z-10" />
                      )}

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
                        </div>
                      </div>

                      {/* Dynamic Executive Summary */}
                      <div className="mb-6 flex flex-col gap-1.5">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 font-mono">Professional Summary</h3>
                        <p className="text-[11.5px] leading-relaxed text-slate-700 font-sans">
                          {renderTailoredText(displayedSummary)}
                        </p>
                      </div>

                      {/* Timeline Milestones Section */}
                      <div className="mb-6 flex flex-col gap-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-455 font-mono border-b border-slate-100 pb-1 font-mono">Professional Experience</h3>
                        {displayedMilestones.length === 0 ? (
                          <div className="flex flex-col gap-6">
                            {/* Mock Milestone 1 */}
                            <div className="flex flex-col gap-1.5 border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-450 transition-colors cursor-pointer group relative" onClick={() => handleOpenMilestoneEditor(null)}>
                              <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Plus className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                                <h4 className="text-[12.5px] font-black text-slate-450 leading-tight group-hover:text-blue-605 transition-colors">
                                  Your Role / Position Title (e.g. Senior Software Engineer)
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">
                                  YYYY-MM – Present
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                                Organization Name (e.g. Petronas, Shopee)
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-400 italic mt-1">
                                Describe your core responsibilities, key achievements, and the technologies you used. Clicking this block will open the milestone editor to add your real history.
                              </p>
                              <div className="flex gap-1.5 mt-2">
                                <span className="text-[8.5px] font-bold px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-400 border border-slate-200 border-dashed">Python</span>
                                <span className="text-[8.5px] font-bold px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-400 border border-slate-200 border-dashed">React</span>
                                <span className="text-[8.5px] font-bold px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-400 border border-slate-200 border-dashed">+ Add Skill</span>
                              </div>
                            </div>

                            {/* Mock Milestone 2 */}
                            <div className="flex flex-col gap-1.5 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/30 hover:bg-slate-50 hover:border-blue-350 transition-colors cursor-pointer group relative" onClick={() => handleOpenMilestoneEditor(null)}>
                              <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-slate-150 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Plus className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                                <h4 className="text-[12.5px] font-black text-slate-400 leading-tight">
                                  Past Position (e.g. Full-Stack Developer)
                                </h4>
                                <span className="text-[10px] text-slate-350 font-mono font-bold">
                                  2020-01 – 2022-01
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-350 font-bold uppercase tracking-wider font-mono">
                                Past Employer (e.g. Grab, Startup Hub)
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-400 italic mt-1">
                                List your previous job or degree. Highlighting your trajectory history enables the SSMP transition models to compute your optimal career paths.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-5">
                            {displayedMilestones.map((m) => (
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
                                        className={`text-[8.5px] font-semibold px-2 py-0.2 rounded font-mono ${isPrereq
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
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all ${isPrereq
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

                  {/* Column 3: AI Copilot Console (Right Panel) */}
                  <div className="xl:col-span-3 lg:col-span-12 flex flex-col gap-6 order-3">
                    <Card className="border-slate-200 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-sm font-bold text-slate-850 flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-teal-650 animate-pulse" />
                          Live CV Adaptation Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 pt-4">

                        {/* ATS Score Metric Row */}
                        <div className="flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                          <div className="flex items-center gap-4">
                            {/* Radial Matching Score Gauge */}
                            <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="27" stroke="#f1f5f9" strokeWidth="5" fill="transparent" className="dark:stroke-slate-800" />
                                <circle cx="32" cy="32" r="27" stroke={simulatedScore >= 80 ? '#10b981' : simulatedScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="5" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 27}
                                  strokeDashoffset={2 * Math.PI * 27 * (1 - simulatedScore / 100)}
                                  className="transition-all duration-500 ease-out"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{simulatedScore}%</span>
                                <span className="text-[7px] font-bold text-slate-455 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-mono">ATS</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-150">ATS Compatibility Score</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal font-medium">
                                Calculated using the system's Trajectory Similarity Matching Index (TSMI).
                              </p>
                            </div>
                          </div>

                          {/* Transparent Mathematical Breakdown */}
                          <div className="border-t border-slate-150 dark:border-slate-800 pt-2 flex flex-col gap-1.5 text-[9.5px] font-mono text-slate-550 dark:text-slate-400">
                            <div className="flex justify-between">
                              <span>Matched Weight (Σ w_m):</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {tailoredCV.matchedKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} pts
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Missing Weight (Σ w_u):</span>
                              <span className="font-extrabold text-amber-600 dark:text-amber-500">
                                {tailoredCV.missingKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} pts
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-1 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                              <span>Weighted TSMI Score:</span>
                              <span>{simulatedScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Custom Constraints Textarea */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-455 block font-mono">Realignment Constraints (Optional)</label>
                          <textarea
                            placeholder="Instruct the AI Agent how to focus your CV realignment (e.g. 'emphasize cloud-native distributed architecture', 'highlight deep learning coursework')..."
                            value={customRealignmentPrompt}
                            onChange={(e) => setCustomRealignmentPrompt(e.target.value)}
                            className="w-full h-14 text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500 resize-none font-sans"
                            disabled={isOptimizing}
                          />
                        </div>

                        {/* Expand Button to open Spacious Diagnostics Modal */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowExpandedStats(true)}
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-250 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <Maximize2 className="h-3 w-3 text-slate-500" /> View Diagnostics & Logs
                          </button>
                        </div>

                      </CardContent>
                    </Card>
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

                {/* 3. Expanded Diagnostics & Logs Modal */}
                <AnimatePresence>
                  {showExpandedStats && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[150] p-4 md:p-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                      >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-teal-650 animate-pulse" />
                            <h3 className="text-base font-black text-slate-900 tracking-tight">
                              AI Copilot Diagnostic Center
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowExpandedStats(false)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto custom-scrollbar flex-1">

                          {/* Left Column: Metrics & Controls */}
                          <div className="flex flex-col gap-5">

                            {/* Score Dial and Details */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                              <div className="flex items-center gap-6">
                                <div className="relative h-24 w-24 flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 rounded-full shadow-inner border border-slate-100 dark:border-slate-700">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="41" stroke="#f1f5f9" strokeWidth="7" fill="transparent" className="dark:stroke-slate-900" />
                                    <circle cx="48" cy="48" r="41" stroke={simulatedScore >= 80 ? '#10b981' : simulatedScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="7" fill="transparent"
                                      strokeDasharray={2 * Math.PI * 41}
                                      strokeDashoffset={2 * Math.PI * 41 * (1 - simulatedScore / 100)}
                                      className="transition-all duration-500 ease-out"
                                    />
                                  </svg>
                                  <div className="absolute flex flex-col items-center">
                                    <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{simulatedScore}%</span>
                                    <span className="text-[8px] font-bold text-slate-455 dark:text-slate-500 mt-1 uppercase tracking-wider font-mono">ATS Match</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <h4 className="text-sm font-bold text-slate-850 dark:text-white font-extrabold">ATS Compatibility Index</h4>
                                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal font-medium">
                                    Assesses your resume's verified skills against the core dependencies and prerequisites for <strong>{activeCvTarget}</strong> using the Trajectory Similarity Matching Index (TSMI).
                                  </p>
                                </div>
                              </div>

                              {/* TSMI Formula and Mathematical Breakdown */}
                              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                                <div className="text-center font-bold text-slate-850 dark:text-white border-b border-slate-150 dark:border-slate-800 pb-2">
                                  Trajectory Similarity Matching Index (TSMI) Formula
                                </div>
                                <div className="flex justify-center py-2 text-sm font-extrabold text-blue-650 dark:text-blue-400">
                                  TSMI = [ &Sigma; w_m / (&Sigma; w_m + &Sigma; w_u) ] &times; 100%
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 text-center -mt-1 mb-1 leading-normal font-sans">
                                  Where w_i = 1 + rank_i is the depth weight of the skill in the Trajectory Knowledge Graph (rank 0 to 3).
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-150 dark:border-slate-800 pt-2">
                                  <div className="flex flex-col">
                                    <span className="text-slate-455 dark:text-slate-500 uppercase text-[9px] font-bold">Matched Weight (&Sigma; w_m)</span>
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                                      {tailoredCV.matchedKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} pts
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-450 truncate mt-0.5">{tailoredCV.matchedKeywords.length} matched skills</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-slate-455 dark:text-slate-500 uppercase text-[9px] font-bold">Unmet Weight (&Sigma; w_u)</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-500 text-sm mt-0.5">
                                      {tailoredCV.missingKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} pts
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-455 truncate mt-0.5">{tailoredCV.missingKeywords.length} missing prerequisites</span>
                                  </div>
                                </div>
                                <div className="border-t border-slate-150 dark:border-slate-800 pt-2.5 flex items-center justify-between text-xs font-bold text-slate-850 dark:text-white">
                                  <span>TSMI Weighted Calculation:</span>
                                  <span>
                                    {tailoredCV.matchedKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} / ({tailoredCV.matchedKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)} + {tailoredCV.missingKeywords.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0)}) = {simulatedScore}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Constraints Input */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Realignment Constraints</label>
                              <textarea
                                placeholder="Instruct the AI Agent how to focus your CV realignment (e.g. 'emphasize cloud-native distributed architecture')..."
                                value={customRealignmentPrompt}
                                onChange={(e) => setCustomRealignmentPrompt(e.target.value)}
                                className="w-full h-24 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:border-teal-500 resize-none font-sans focus:ring-1 focus:ring-teal-500/20"
                                disabled={isOptimizing}
                              />
                            </div>

                          </div>

                          {/* Right Column: Keyword Audit & Live Logs */}
                          <div className="flex flex-col gap-5">

                            {/* Match Audit Log */}
                            <div className="flex flex-col gap-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Keyword Match Audit</span>

                              {/* Matched Keywords */}
                              {tailoredCV.matchedKeywords.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[9.5px] font-extrabold text-emerald-600 font-mono uppercase tracking-wide">✓ Matched Keywords ({tailoredCV.matchedKeywords.length})</span>
                                  <div className="flex flex-wrap gap-1">
                                    {tailoredCV.matchedKeywords.map(sk => (
                                      <span key={sk} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150 flex items-center">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Missing Keywords */}
                              {tailoredCV.missingKeywords.length > 0 && (
                                <div className="flex flex-col gap-1.5 mt-1">
                                  <span className="text-[9.5px] font-extrabold text-amber-600 font-mono uppercase tracking-wide">⚠ Missing Intent Prerequisites ({tailoredCV.missingKeywords.length})</span>
                                  <p className="text-[10.5px] text-slate-500 leading-normal">Click to automatically insert missing skills into your active CV milestones:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {tailoredCV.missingKeywords.map(sk => (
                                      <button
                                        key={sk}
                                        type="button"
                                        onClick={() => setPendingAddSkill(sk)}
                                        className="text-[10px] font-bold bg-white text-slate-505 border border-dashed border-slate-300 hover:border-teal-400 hover:text-teal-655 hover:bg-teal-50 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                        title={`Add ${sk} to latest milestone`}
                                      >
                                        <Plus className="h-3 w-3" /> {sk}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Logs Terminal */}
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block font-mono">Tailoring Agent Console Logs</span>
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto custom-scrollbar font-mono text-[10px] text-teal-400 flex flex-col gap-1.5 shadow-inner leading-relaxed">
                                {(isOptimizing || agentConsoleLogs.length > 0 ? agentConsoleLogs : tailoredCV.logs).map((log, idx) => (
                                  <div key={idx} className="flex gap-2 items-start">
                                    <span className="text-slate-605">➔</span>
                                    <span>{log}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowExpandedStats(false)}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                          >
                            Close Diagnostics
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </div>
            )}

            {activeTab === 'forecast' && <ForecastingSimulator />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sliding Cohort Alerts */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[150] max-w-sm bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl p-4 rounded-2xl flex items-start gap-3.5 group hover:border-blue-300 transition-colors duration-300"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col gap-1 pr-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-blue-650 uppercase tracking-widest font-mono">Cohort Similarity Alert</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-750 font-bold leading-normal">
                {activeAlert.prefix} has a similar <span className="text-emerald-600 font-extrabold">{activeAlert.similarity}%</span> {activeAlert.suffix}
              </p>
              <button
                type="button"
                onClick={() => {
                  // Signal SkillActivationMap to auto-open cohort sidebar on mount
                  sessionStorage.setItem('openCohortSidebar', '1');
                  setActiveTab('trajectory');
                  setActiveAlert(null);
                  // After tab renders, scroll to the section and click the sidebar toggle
                  setTimeout(() => {
                    const toggleBtn = document.getElementById('cohort-sidebar-toggle');
                    if (toggleBtn) toggleBtn.click();
                    setTimeout(() => {
                      const element = document.getElementById('cohort-network-section');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }, 350);
                  }, 200);
                }}
                className="text-[9.5px] font-bold text-indigo-650 hover:text-indigo-800 text-left mt-1.5 flex items-center gap-1 cursor-pointer w-fit"
              >
                Inspect Path Network <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-650 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Loading Overlay for saving/exporting */}
      <AnimatePresence>
        {(isSavingSnapshot || isExportingPdf) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-[200] flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
              <div className="h-10 w-10 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-800">
                  {isSavingSnapshot ? 'Saving Profile Snapshot...' : 'Preparing PDF Export...'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isSavingSnapshot ? 'Saving...' : 'Generating print layout and opening print dialog.'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restoring Snapshot Loader Modal */}
      <AnimatePresence>
        {restoringId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500 animate-pulse-glow" />
              <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <History className="h-6 w-6 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-extrabold text-slate-850 dark:text-white">
                  Restoring Profile Version
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Re-aligning your milestones, skills, and summary to snapshot <span className="font-bold text-teal-650 dark:text-teal-400">V{profileVersions.find(v => v.id === restoringId)?.versionNumber}</span>. Please wait a moment...
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ethical Skill Declaration & Verification Modal */}
      <AnimatePresence>
        {pendingAddSkill !== null && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse-glow" />
              
              {/* Content */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                    Ethical Skill Declaration
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                  <p>
                    You are claiming the skill <strong className="text-slate-850 dark:text-white text-sm">"{pendingAddSkill}"</strong> to align with the required keywords for <strong className="text-slate-850 dark:text-white">"{activeCvTarget}"</strong>.
                  </p>
                  <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/55 rounded-xl p-3.5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-450 uppercase font-mono tracking-wide">⚠ Professional Integrity Warning</span>
                    <p className="text-[10.5px] text-amber-800 dark:text-amber-400 leading-normal">
                      To maintain ATS vetting credibility and interview integrity, you should only assert skills you possess. Claiming skills you do not have can lead to immediate disqualification during subsequent technical rounds.
                    </p>
                  </div>
                  <p className="font-semibold text-slate-705 dark:text-slate-300">
                    Do you verify that you possess this skill or equivalent foundational knowledge and wish to add it to your profile?
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingAddSkill(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingAddSkill) {
                      handleQuickAddSkill(pendingAddSkill);
                      setPendingAddSkill(null);
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Confirm & Claim Skill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2s linear infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: blink 0.9s infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.2); }
          50% { transform: scale(1.01); box-shadow: 0 0 12px 3px rgba(37, 99, 235, 0.4); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2.5s infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />

    </div>
  );
}
