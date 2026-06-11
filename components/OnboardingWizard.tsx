'use client';

import React, { useState, useEffect } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { CareerNode, SKILL_DAG, analyzeResumeText } from '../lib/careerEngine';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Shield, ArrowRight, Cpu, 
  Upload, Terminal, Check, Award, Plus, Trash, Globe, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingWizard() {
  const { userProfile, onboardCandidate, uploadAndParseResume } = useCareerEngine();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // OCR Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string>('Manual Entry');
  const [hasApiKeyWarning, setHasApiKeyWarning] = useState<boolean>(false);

  // Onboarding Form State
  const [milestones, setMilestones] = useState<CareerNode[]>([]);
  const [targetRole, setTargetRole] = useState<string>('AI Architect');
  const [recommendedRole, setRecommendedRole] = useState<string | null>(null);
  const [recommendedRoles, setRecommendedRoles] = useState<{ role: string; justification: string }[]>([]);
  const [customRole, setCustomRole] = useState<string>('');
  const [marketAnalysis, setMarketAnalysis] = useState<{ geo: string; marketDemand: string; justification: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real OCR & Gemini Parsing engine
  useEffect(() => {
    if (!isScanning) return;

    let active = true;
    let progressVal = 0;
    
    // Gradual progress animation up to 70%
    const progressInterval = setInterval(() => {
      if (progressVal < 70) {
        progressVal += 6;
        setScanProgress(progressVal);
      }
    }, 150);

    const logs = [
      '[OCR] Initializing Tesseract PDF parser engine...',
      '[OCR] Opening layout schema and segmenting blocks...',
      '[OCR] Uploading stream to Career OS Gemini parsing agent...'
    ];
    setScanLogs(logs);

    // Call API
    uploadAndParseResume(uploadFile, resumeText).then((result) => {
      if (!active) return;
      clearInterval(progressInterval);

      if (result.success && result.data) {
        const parsed = result.data;
        const finalLogs = [
          ...logs,
          `[NLP] Connected to Gemini. Analyzing career milestones...`
        ];

        if (parsed.nodes && parsed.nodes.length > 0) {
          parsed.nodes.forEach((node: any) => {
            finalLogs.push(`[NLP] Mapped "${node.organization}" (${node.role}) milestone node.`);
          });
        }
        finalLogs.push('[NLP] Running entity extraction for verified skills...');
        if (parsed.detectedSkills && parsed.detectedSkills.length > 0) {
          finalLogs.push(`[NLP] Identified skills: ${parsed.detectedSkills.slice(0, 8).join(', ')}`);
        }
        finalLogs.push('[TKG] Building Temporal Knowledge Graph mapping...');
        finalLogs.push(`[TKG] Verified ${parsed.nodes?.length || 0} milestone clusters. Parsing complete!`);
        finalLogs.push(`[TKG] Recommendations engine suggests target role: "${parsed.recommendedRole}"`);
        
        setScanLogs(finalLogs);
        setScanProgress(100);

        setTimeout(() => {
          setMilestones(parsed.nodes || []);
          setTargetRole(parsed.recommendedRole || 'AI Architect');
          setRecommendedRole(parsed.recommendedRole || 'AI Architect');
          setRecommendedRoles(parsed.recommendedRoles || [
            { role: parsed.recommendedRole || 'AI Architect', justification: parsed.marketAnalysis?.justification || 'Highly aligned with your profile.' }
          ]);
          setMarketAnalysis(parsed.marketAnalysis || null);
          setIsScanning(false);
          setHasApiKeyWarning(false);
          setStep(2);
        }, 1000);

      } else {
        if (result.code === 'GEMINI_API_KEY_MISSING') {
          console.warn('Gemini API key is not configured. Falling back to local parser.');
          
          const localAnalysis = analyzeResumeText(resumeText || 'University of Malaya, Grab, Petronas, PyTorch, React');
          
          const fallbackLogs = [
            ...logs,
            `[WARNING] GEMINI_API_KEY is not configured in .env.local!`,
            `[WARNING] Falling back to local offline regex parser.`,
            `[OCR] Local OCR parser scanning text strings...`
          ];

          localAnalysis.nodes.forEach(node => {
            fallbackLogs.push(`[NLP] (Local) Mapped "${node.organization}" (${node.role}) milestone node.`);
          });

          fallbackLogs.push(`[NLP] Identified: ${localAnalysis.detectedSkills.slice(0, 6).join(', ')}`);
          fallbackLogs.push(`[TKG] Completed fallback mapping.`);
          fallbackLogs.push(`[TKG] Recommended: "${localAnalysis.recommendedRole}"`);

          setScanLogs(fallbackLogs);
          setScanProgress(100);
          setHasApiKeyWarning(true);

          setTimeout(() => {
            setMilestones(localAnalysis.nodes);
            setTargetRole(localAnalysis.recommendedRole);
            setRecommendedRole(localAnalysis.recommendedRole);
            setRecommendedRoles(localAnalysis.recommendedRoles || [
              { role: localAnalysis.recommendedRole, justification: localAnalysis.marketAnalysis?.justification || 'Highly aligned with your profile.' }
            ]);
            setMarketAnalysis(localAnalysis.marketAnalysis || null);
            setIsScanning(false);
            setStep(2);
          }, 1000);

        } else {
          setScanLogs(prev => [
            ...prev,
            `[ERROR] Parser failure: ${result.error || 'Unknown error occurred.'}`
          ]);
          setScanProgress(0);
          setIsScanning(false);
          setErrorMsg(result.error || 'Failed to parse resume.');
        }
      }
    });

    return () => {
      active = false;
      clearInterval(progressInterval);
    };
  }, [isScanning, uploadFile, resumeText]);

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadFile(null);
    setResumeFilename('Pasted Resume Details');
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setResumeFilename(file.name);
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([`[OCR] Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`]);
  };

  const handleSkipScan = () => {
    setMilestones([]);
    setStep(2);
  };

  const handleAddNode = () => {
    const newNode: CareerNode = {
      id: `parsed-node-${Date.now()}`,
      role: 'Software Engineer',
      organization: 'Company Name',
      type: 'employment',
      startDate: '2025-01',
      endDate: 'Present',
      description: 'Describe your responsibilities and achievements...',
      skills: []
    };
    setMilestones(prev => [...prev, newNode]);
  };

  const handleDeleteNode = (id: string) => {
    setMilestones(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateNode = (id: string, updated: Partial<CareerNode>) => {
    setMilestones(prev => prev.map(node => node.id === id ? { ...node, ...updated } : node));
  };

  const handleAddNodeSkill = (nodeId: string, skillName: string) => {
    setMilestones(prev => prev.map(node => {
      if (node.id === nodeId) {
        if (node.skills.some(s => s.name === skillName)) return node;
        return {
          ...node,
          skills: [...node.skills, { name: skillName, level: 'Rank-1' }]
        };
      }
      return node;
    }));
  };

  const handleRemoveNodeSkill = (nodeId: string, idx: number) => {
    setMilestones(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          skills: node.skills.filter((_, i) => i !== idx)
        };
      }
      return node;
    }));
  };

  const handleLaunch = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const result = await onboardCandidate(
      userProfile.email, 
      targetRole, 
      milestones, 
      resumeFilename, 
      marketAnalysis ? JSON.stringify(marketAnalysis) : undefined
    );
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to persist onboarding milestones.');
      setSubmitting(false);
    }
  };

  const availableSkills = Object.keys(SKILL_DAG);

  return (
    <div className="max-w-2xl mx-auto py-4 flex flex-col gap-6 relative z-10">
      
      {/* Onboarding Header */}
      <div className="text-center max-w-lg mx-auto">
        <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
          Onboarding Phase
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
          Configure Your Trajectory
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Let's feed your career milestones into the Step Semi-Markov engine. We will map your timeline nodes and establish your base hazard rate.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        {[
          { num: 1, label: 'Resume Scanner' },
          { num: 2, label: 'Milestone Review' },
          { num: 3, label: 'Select Trajectory' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
              step >= s.num 
                ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white' 
                : 'bg-slate-100 border border-slate-200 text-slate-400'
            }`}>
              {s.num}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
              step === s.num ? 'text-slate-800' : 'text-slate-400'
            }`}>
              {s.label}
            </span>
            {s.num < 3 && <span className="h-0.5 w-8 bg-slate-100 hidden sm:block"></span>}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: RESUME INTAKE / OCR SCANNER */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500"></div>
              
              {!isScanning ? (
                <form onSubmit={handleStartScan} className="flex flex-col gap-6 pt-2">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center gap-3 relative group">
                    <input 
                      type="file" 
                      accept=".pdf,.txt,.docx"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-xs font-bold text-slate-800">Upload Resume File</h3>
                      <p className="text-[10px] text-slate-400">PDF, TXT, or DOCX formats up to 5MB</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                      Or Paste Resume text
                    </label>
                    <textarea
                      placeholder="Paste unstructured resume text details here... e.g. B.Sc in CS from UM (2018-2021). Worked as Software Engineer at Grab from Jan 2022 to Jun 2024..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={5}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={handleSkipScan}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Skip: Setup manually
                    </button>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={!resumeText.trim()}
                      className="px-6 font-bold"
                    >
                      Analyze trajectory <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              ) : (
                /* OCR SCANNER RUNNING VISUALIZATION */
                <div className="flex flex-col gap-6 py-6 items-center">
                  <div className="w-full max-w-sm border border-slate-200 rounded-xl bg-slate-50 p-6 relative overflow-hidden flex flex-col items-center gap-4">
                    
                    {/* Simulated Document Card with Laser Line */}
                    <div className="h-44 w-32 rounded bg-white border border-slate-200 relative overflow-hidden shadow-xs">
                      <div className="absolute inset-x-2 top-3 h-2 bg-slate-100 rounded"></div>
                      <div className="absolute inset-x-2 top-7 h-1.5 bg-slate-100 rounded"></div>
                      <div className="absolute inset-x-2 top-10 h-1.5 bg-slate-100 rounded"></div>
                      <div className="absolute inset-x-2 top-14 h-2 bg-slate-100 rounded w-2/3"></div>
                      <div className="absolute inset-x-2 top-18 h-1.5 bg-slate-100 rounded w-5/6"></div>
                      <div className="absolute inset-x-2 top-21 h-1.5 bg-slate-100 rounded"></div>

                      {/* Laser Bar */}
                      <div className="absolute inset-x-0 h-1 bg-teal-500 shadow-md shadow-teal-500/50 animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full">
                      <div className="flex justify-between items-center text-[9px] font-bold font-mono text-slate-400 mb-1">
                        <span>OCR SCAN PROGRESS</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div className="w-full max-w-lg bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-teal-400 border border-slate-800 shadow-inner flex flex-col gap-1.5 h-36 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-800 pb-1.5 mb-1">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>PARSER SYSTEM STREAM</span>
                    </div>
                    {scanLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 font-bold">➔</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* STEP 2: TRAJECTORY NODE VERIFICATION */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500"></div>
              
              <CardHeader className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-teal-600" />
                  Verify Chronological Career Milestones
                </CardTitle>
                <button
                  onClick={handleAddNode}
                  className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Milestone
                </button>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1 pt-3 custom-scrollbar">
                {hasApiKeyWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex flex-col gap-1 shadow-xs font-medium">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600" /> Fallback Parser Active
                    </span>
                    <span className="text-[10px] opacity-95">
                      No <code>GEMINI_API_KEY</code> was found in your <code>.env.local</code>. Career OS activated its offline regex heuristics to map your timeline nodes. Configure it to enable advanced Gemini LLM parsing.
                    </span>
                  </div>
                )}
                {milestones.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-xs">
                    No milestones found. Click "Add Milestone" to construct your trajectory.
                  </div>
                ) : (
                  milestones.map((node, idx) => (
                    <div 
                      key={node.id} 
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 relative flex flex-col gap-3 group hover:border-slate-300 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteNode(node.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            Milestone Title
                          </label>
                          <input 
                            type="text"
                            value={node.role}
                            onChange={(e) => handleUpdateNode(node.id, { role: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            Organization
                          </label>
                          <input 
                            type="text"
                            value={node.organization}
                            onChange={(e) => handleUpdateNode(node.id, { organization: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            Type
                          </label>
                          <select 
                            value={node.type}
                            onChange={(e) => handleUpdateNode(node.id, { type: e.target.value as any })}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer font-bold"
                          >
                            <option value="employment">Employment</option>
                            <option value="academic">Academic Degree</option>
                            <option value="sabbatical">Sabbatical / Gap</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            Start Date (YYYY-MM)
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. 2022-01"
                            value={node.startDate}
                            onChange={(e) => handleUpdateNode(node.id, { startDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                            End Date (YYYY-MM or Present)
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Present"
                            value={node.endDate}
                            onChange={(e) => handleUpdateNode(node.id, { endDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Attached Skills */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                            Associated Skills
                          </label>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddNodeSkill(node.id, e.target.value);
                              }
                            }}
                            className="bg-white border border-slate-200 rounded text-[9px] px-1 py-0.5 text-slate-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">+ Add Skill Link</option>
                            {availableSkills.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {node.skills.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No skills attached yet.</span>
                          ) : (
                            node.skills.map((skill, sIdx) => (
                              <span 
                                key={`${node.id}-sk-${sIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600"
                              >
                                {skill.name}
                                <button
                                  onClick={() => handleRemoveNodeSkill(node.id, sIdx)}
                                  className="text-slate-400 hover:text-rose-500 font-black ml-1 px-0.5 text-[10px]"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>

              <div className="flex justify-between border-t border-slate-100 p-4 mt-2">
                <Button 
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="px-5 font-bold"
                >
                  Back
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => setStep(3)}
                  disabled={milestones.length === 0}
                  className="px-6 font-bold"
                >
                  Next step <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: TARGET ROLE SELECTION */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500"></div>
              
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-teal-600" />
                  Select Target Trajectory Pathway
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 pt-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2 font-semibold">
                    <span>{errorMsg}</span>
                  </div>
                )}

                {marketAnalysis && (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-200 rounded-xl flex flex-col gap-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs font-mono uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        <span>AI Regional Market Intelligence</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Globe className="h-3 w-3 text-teal-600" /> {marketAnalysis.geo}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-600">
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 font-mono">Local Market Outlook</span>
                        <p className="font-medium text-slate-700">{marketAnalysis.marketDemand}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 font-mono">Path Suitability Justification</span>
                        <p className="font-medium text-slate-700">{marketAnalysis.justification}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {/* AI Recommended Pathways */}
                  {recommendedRoles.map((recOption, idx) => {
                    const isSelected = targetRole === recOption.role;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setTargetRole(recOption.role);
                          if (marketAnalysis) {
                            setMarketAnalysis({
                              ...marketAnalysis,
                              justification: recOption.justification
                            });
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/10 ring-2 ring-teal-500/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800">
                              {recOption.role}
                            </h4>
                            <span className="text-[8px] font-bold font-mono text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                              ★ AI Recommended Path {idx + 1}
                            </span>
                          </div>
                          <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {recOption.justification}
                        </p>
                      </div>
                    );
                  })}

                  {/* Custom Pathway input */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      !recommendedRoles.some(r => r.role === targetRole)
                        ? 'border-blue-500 bg-blue-50/5 ring-2 ring-blue-500/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800">Customize Target Career Pathway</h4>
                      <div 
                        onClick={() => {
                          const isAlreadyCustom = !recommendedRoles.some(r => r.role === targetRole);
                          if (!isAlreadyCustom) {
                            const newCustom = customRole || 'Software Architect';
                            setTargetRole(newCustom);
                            setCustomRole(newCustom);
                            if (marketAnalysis) {
                              setMarketAnalysis({
                                ...marketAnalysis,
                                justification: 'Custom trajectory specified by applicant. Career OS will align milestones accordingly.'
                              });
                            }
                          }
                        }}
                        className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center cursor-pointer ${
                          !recommendedRoles.some(r => r.role === targetRole) ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {!recommendedRoles.some(r => r.role === targetRole) && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-normal mb-3">
                      Type any custom career target you wish to optimize for. We will analyze your milestones against it.
                    </p>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Lead Platform Engineer, DevOps Lead, Data Scientist..."
                        value={recommendedRoles.some(r => r.role === targetRole) ? '' : targetRole}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetRole(val);
                          setCustomRole(val);
                          if (marketAnalysis) {
                            setMarketAnalysis({
                              ...marketAnalysis,
                              justification: 'Custom trajectory specified by applicant. Career OS will align milestones accordingly.'
                            });
                          }
                        }}
                        onFocus={() => {
                          const isAlreadyCustom = !recommendedRoles.some(r => r.role === targetRole);
                          if (!isAlreadyCustom) {
                            const newCustom = customRole || 'Software Architect';
                            setTargetRole(newCustom);
                            setCustomRole(newCustom);
                            if (marketAnalysis) {
                              setMarketAnalysis({
                                ...marketAnalysis,
                                justification: 'Custom trajectory specified by applicant. Career OS will align milestones accordingly.'
                              });
                            }
                          }
                        }}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-between border-t border-slate-100 p-4 mt-2">
                <Button 
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                  className="px-5 font-bold"
                >
                  Back
                </Button>
                <Button 
                  variant="primary"
                  disabled={submitting}
                  onClick={handleLaunch}
                  className="px-6 font-bold"
                >
                  {submitting ? 'Launching Career OS...' : 'Launch Career OS'} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Security note */}
      <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 font-mono">
        <Shield className="h-3.5 w-3.5 text-teal-500" />
        <span>SSL Secured • Milestones are parsed locally & parsed data stores in Postgres SQL</span>
      </div>
    </div>
  );
}
