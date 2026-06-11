'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { SKILL_DAG, getPreRequisitesRecursive } from '../lib/careerEngine';
import { Award, Layers, Target, CheckCircle2, Users, TrendingUp, Brain, BookOpen, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

export default function SkillActivationMap() {
  const {
    candidateSkills,
    selectedSkillPath,
    setSelectedSkillPath,
    cohortAnalysis,
    userProfile,
    careerPaths
  } = useCareerEngine();

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isPeerListUnlocked, setIsPeerListUnlocked] = useState<boolean>(false);

  // Filter States
  const [geoFilter, setGeoFilter] = useState<string>('All');

  // Interactive Node Inspection Focus State
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  const selectedPeer = useMemo(() => {
    if (!cohortAnalysis) return null;
    return cohortAnalysis.peerSummaries.find(p => p.id === selectedPeerId) || null;
  }, [cohortAnalysis, selectedPeerId]);

  const trackSkills = useMemo(() => {
    const prereqs = getPreRequisitesRecursive(selectedSkillPath);
    return [selectedSkillPath, ...prereqs];
  }, [selectedSkillPath]);

  const inspectPrereqs = useMemo(() => {
    if (!selectedMapNode) return [];
    return [selectedMapNode, ...getPreRequisitesRecursive(selectedMapNode)];
  }, [selectedMapNode]);

  const emergingPaths = useMemo(() => {
    return careerPaths.filter(track => track !== selectedSkillPath).slice(0, 2);
  }, [selectedSkillPath, careerPaths]);

  const nodePositions = useMemo((): Record<string, Point> => {
    const positions: Record<string, Point> = {};
    const svgWidth = 850;
    const svgHeight = 400;

    const activeNodes = Object.values(SKILL_DAG).filter(node => trackSkills.includes(node.name));

    const rankGroups: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
    activeNodes.forEach(node => {
      rankGroups[node.rank].push(node.name);
    });

    const ranks = [0, 1, 2, 3];
    ranks.forEach(rank => {
      const skillsInRank = rankGroups[rank] || [];
      const y = svgHeight - 70 - rank * 90; // Rank 0: 330, Rank 1: 240, Rank 2: 150, Rank 3: 60
      
      skillsInRank.forEach((skillName, index) => {
        const count = skillsInRank.length;
        const spacing = svgWidth / (count + 1);
        const x = spacing * (index + 1);
        positions[skillName] = { x, y };
      });
    });

    return positions;
  }, [trackSkills]);

  const connections = useMemo(() => {
    const list: { from: string; to: string; active: boolean }[] = [];
    
    Object.values(SKILL_DAG).forEach(node => {
      if (trackSkills.includes(node.name)) {
        node.prerequisites.forEach(prereq => {
          if (trackSkills.includes(prereq)) {
            const active = candidateSkills.includes(node.name) && candidateSkills.includes(prereq);
            list.push({ from: prereq, to: node.name, active });
          }
        });
      }
    });

    return list;
  }, [trackSkills, candidateSkills]);

  // Extract unique regions dynamically from matching cohort peers
  const uniqueGeos = useMemo(() => {
    if (!cohortAnalysis) return [];
    const geos = new Set<string>();
    cohortAnalysis.peerSummaries.forEach(p => {
      if (p.geo) geos.add(p.geo);
    });
    return Array.from(geos).sort();
  }, [cohortAnalysis]);

  // Apply filters to peer summaries list
  const filteredPeers = useMemo(() => {
    if (!cohortAnalysis) return [];
    return cohortAnalysis.peerSummaries.filter(peer => {
      // Country/Region filter
      if (geoFilter !== 'All' && peer.geo !== geoFilter) return false;
      
      return true;
    });
  }, [cohortAnalysis, geoFilter]);

  if (!cohortAnalysis) {
    return (
      <div className="flex flex-col gap-4 p-8 rounded-xl border border-slate-200 bg-white items-center justify-center text-center py-16">
        <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-455">
          <Layers className="h-6 w-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-sm font-bold text-slate-800">Cohort Insights Offline</h3>
          <p className="text-xs text-slate-400 leading-normal">
            Complete your profile onboarding and select a target career trajectory to sync this map with similar anonymized peer data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Personalized Greeting Hook Banner */}
      <div className="bg-gradient-to-r from-blue-50/50 via-teal-50/30 to-indigo-50/20 border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden flex items-center justify-between gap-4">
        {/* Specular Ambient Glow */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-650 shadow-2xs">
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[13px] font-black text-slate-855 tracking-tight leading-tight">
              Hi, {userProfile.name || 'Guest'}!
            </h4>
            <p className="text-[11px] text-slate-650 font-medium">
              Still looking into your main path: <strong className="text-blue-700 font-extrabold">{selectedSkillPath}</strong>? Your alternative tracks in <span className="text-teal-650 font-extrabold">{emergingPaths[0]}</span> and <span className="text-indigo-650 font-extrabold">{emergingPaths[1]}</span> are emerging. Check them or others in the cohort path network below.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
        {/* Inline styles for connection dash flow keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow-route {
          to {
            stroke-dashoffset: -20;
          }
        }
        .route-flow-animate {
          stroke-dasharray: 6 8;
          animation: flow-route 1.2s linear infinite;
        }
      `}} />
      
      {/* Left Column: SVG Traversal Map */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:w-[67%]' : 'w-full'} flex flex-col gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white relative shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Layers className="h-4.5 w-4.5 text-blue-650" />
            <h3 className="text-sm font-bold text-slate-850">Skill Dependency Map</h3>
            <span className="h-4 w-px bg-slate-200 hidden md:inline-block mx-1" />
            
            {/* Relocated Sidebar Toggle Button - Styled to look completely distinct from path selectors */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors text-[9px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              {isSidebarOpen ? (
                <>
                  <EyeOff className="h-3 w-3" /> Hide Insights
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" /> View Cohort Insights
                </>
              )}
            </button>
          </div>
          
          {/* Controls - Contains track path selectors only */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5">
              {careerPaths.map((track) => (
                <button
                  key={track}
                  onClick={() => {
                    setSelectedSkillPath(track);
                    setSelectedPeerId(null); // Clear selected peer when track changes
                    setSelectedMapNode(null); // Clear map node focus
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider uppercase border transition-all duration-200 cursor-pointer ${
                    selectedSkillPath === track
                      ? 'bg-gradient-to-r from-blue-600 to-teal-500 border-none text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative w-full bg-slate-900/[0.02] border border-slate-200/80 rounded-xl p-2 overflow-x-auto custom-scrollbar">
          {/* Legend */}
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-3 text-[9px] text-slate-505 bg-white/90 px-2.5 py-1.5 rounded-lg border border-slate-200/60 backdrop-blur-md z-20 shadow-xs">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px #22c55e' }}></span>
              <span className="text-slate-700 font-semibold">Verified</span>
            </div>
            {selectedPeerId && (
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" style={{ boxShadow: '0 0 6px #a855f7' }}></span>
                <span className="text-slate-700 font-medium">Peer Target</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-teal-500" style={{ boxShadow: '0 0 6px #14b8a6' }}></span>
              <span className="text-slate-700 font-medium">Planned</span>
            </div>
          </div>

          <svg viewBox="0 0 850 400" className="w-full min-w-[750px] h-[480px] overflow-visible">
            <defs>
              {/* Radial Gradients for 3D Spherical Nodes */}
              <radialGradient id="sphere-green" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="30%" stopColor="#4ade80" />
                <stop offset="75%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>
              
              <radialGradient id="sphere-teal" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ccfbf1" />
                <stop offset="30%" stopColor="#2dd4bf" />
                <stop offset="75%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#115e59" />
              </radialGradient>

              <radialGradient id="sphere-blue" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="30%" stopColor="#60a5fa" />
                <stop offset="75%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </radialGradient>

              <radialGradient id="sphere-purple" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="30%" stopColor="#c084fc" />
                <stop offset="75%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#581c87" />
              </radialGradient>

              {/* Realistic Shadow Filter */}
              <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="1.5" dy="3.5" stdDeviation="2.8" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Click background to reset selected node focus */}
            <rect width="850" height="400" fill="none" pointerEvents="all" className="cursor-default" onClick={() => setSelectedMapNode(null)} />

            {/* Grid lines in background */}
            <line x1="20" y1="330" x2="830" y2="330" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
            <text x="25" y="323" fill="#64748b" className="text-[10px] uppercase font-bold tracking-wider font-mono">Rank 0: Foundations</text>

            <line x1="20" y1="240" x2="830" y2="240" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
            <text x="25" y="233" fill="#64748b" className="text-[10px] uppercase font-bold tracking-wider font-mono">Rank 1: Core Frameworks</text>

            <line x1="20" y1="150" x2="830" y2="150" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
            <text x="25" y="143" fill="#64748b" className="text-[10px] uppercase font-bold tracking-wider font-mono">Rank 2: Advanced Systems</text>

            <line x1="20" y1="60" x2="830" y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
            <text x="25" y="53" fill="#64748b" className="text-[10px] uppercase font-bold tracking-wider font-mono">Rank 3: Trajectory Specialization</text>

            {/* Connectors */}
            {connections.map((conn, idx) => {
              const p1 = nodePositions[conn.from];
              const p2 = nodePositions[conn.to];
              if (!p1 || !p2) return null;

              const hasActiveFocus = selectedMapNode !== null;
              const isConnInFocusPath = hasActiveFocus 
                ? (inspectPrereqs.includes(conn.from) && inspectPrereqs.includes(conn.to))
                : true;

              return (
                <g key={`conn-${idx}`}>
                  {/* Thick Base Path */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={conn.active ? 'rgba(34, 197, 94, 0.12)' : 'rgba(20, 184, 166, 0.12)'}
                    strokeWidth={conn.active ? 5.5 : 3.5}
                    strokeLinecap="round"
                    style={{
                      opacity: isConnInFocusPath ? 1 : 0.15,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                  {/* Thin animated flowing route overlay */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={conn.active ? '#22c55e' : '#14b8a6'}
                    strokeWidth={conn.active ? 1.8 : 1}
                    strokeLinecap="round"
                    className="route-flow-animate"
                    style={{
                      opacity: isConnInFocusPath ? (conn.active ? 1 : 0.5) : 0.05,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {Object.entries(nodePositions).map(([skillName, point]) => {
              const dagNode = SKILL_DAG[skillName];
              const hasSkill = candidateSkills.includes(skillName);
              const peerHasSkill = selectedPeer ? selectedPeer.skills.includes(skillName) : false;
              const isDestination = skillName === selectedSkillPath;
              
              const isInspected = selectedMapNode === skillName;
              const hasActiveFocus = selectedMapNode !== null;
              const isNodeInFocusPath = hasActiveFocus ? inspectPrereqs.includes(skillName) : true;

              // Determine 3D gradient id
              let fillGradient = 'url(#sphere-teal)';
              let strokeColor = '#14b8a6';
              if (isDestination) {
                fillGradient = 'url(#sphere-blue)';
                strokeColor = '#2563eb';
              } else if (hasSkill) {
                fillGradient = 'url(#sphere-green)';
                strokeColor = '#22c55e';
              } else if (peerHasSkill) {
                fillGradient = 'url(#sphere-purple)';
                strokeColor = '#a855f7';
              }

              // Compute rank delay for staggered entry cascade animation
              const delay = dagNode ? dagNode.rank * 0.18 : 0;

              return (
                <motion.g
                  key={`node-${skillName}`}
                  initial={{ x: point.x, y: point.y, opacity: 0, scale: 0.1 }}
                  animate={{ 
                    x: point.x, 
                    y: point.y, 
                    opacity: isNodeInFocusPath ? 1 : 0.25, 
                    scale: isInspected ? 1.1 : 1,
                    transition: {
                      delay: hasActiveFocus ? 0 : delay,
                      type: 'spring',
                      stiffness: 85,
                      damping: 11
                    }
                  }}
                  whileHover={{ scale: 1.15 }}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering background deselect
                    setSelectedMapNode(selectedMapNode === skillName ? null : skillName);
                  }}
                >
                  {/* Outer Pulsing Glow */}
                  <circle
                    r={isInspected ? "25" : "23"}
                    fill="none"
                    stroke={isInspected ? "#6366f1" : strokeColor}
                    strokeWidth={isInspected ? 3.5 : isDestination ? 2.5 : peerHasSkill ? 2 : 1}
                    className={`transition-all duration-300 ${
                      isInspected
                        ? 'animate-[pulse_1.5s_infinite] opacity-100'
                        : isDestination
                        ? 'animate-[ping_3.5s_ease-in-out_infinite] opacity-35'
                        : peerHasSkill
                        ? 'animate-[pulse_1.8s_infinite] opacity-65'
                        : ''
                    }`}
                  />
                  
                  {/* 3D Sphere Node */}
                  <circle
                    r="17"
                    fill={fillGradient}
                    stroke={isInspected ? "#6366f1" : strokeColor}
                    strokeWidth={isInspected ? 2.5 : isDestination ? 1.5 : 1}
                    filter="url(#shadow)"
                    className="transition-colors duration-300"
                  />

                  {/* Level Tag */}
                  <text
                    y="-24"
                    textAnchor="middle"
                    fill={isInspected ? "#6366f1" : strokeColor}
                    className={`text-[10px] font-extrabold font-mono tracking-tight transition-all duration-350 ${
                      isInspected ? 'scale-110 font-black' : ''
                    }`}
                  >
                    R{dagNode?.rank}
                  </text>

                  {/* Icon details inside circle */}
                  {hasSkill ? (
                    <path
                      d="M -4 0 L -1 3.5 L 4.5 -2.5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : peerHasSkill ? (
                    <circle cx="0" cy="0" r="2.5" fill="#ffffff" className="animate-pulse" />
                  ) : (
                    <circle cx="0" cy="0" r="2" fill="#ffffff" />
                  )}

                  {/* Glassmorphic Skill Text Label */}
                  <foreignObject
                    x="-87.5"
                    y="22"
                    width="175"
                    height="40"
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[11px] font-extrabold text-center px-2 py-0.5 rounded-lg border shadow-sm transition-all duration-300 backdrop-blur-xs ${
                          isInspected
                            ? 'bg-indigo-50/95 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20 scale-105 font-black'
                            : isDestination
                            ? 'bg-blue-50/90 border-blue-200 text-blue-700'
                            : hasSkill
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700'
                            : peerHasSkill
                            ? 'bg-purple-50/90 border-purple-200 text-purple-700'
                            : 'bg-teal-50/90 border-teal-100 text-teal-700'
                        }`}
                      >
                        {skillName}
                      </span>
                    </div>
                  </foreignObject>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {selectedMapNode ? (
          <div className="flex justify-between items-center bg-purple-50 border border-purple-100 rounded-xl p-3.5 text-[11px] text-purple-800 leading-normal shadow-2xs">
            <div className="flex gap-2.5 items-center">
              <Brain className="h-4 w-4 shrink-0 text-purple-600 animate-pulse" />
              <span>
                <strong>Inspecting: <span className="text-[12px] font-black underline decoration-purple-300 decoration-2">{selectedMapNode}</span></strong> (Rank {SKILL_DAG[selectedMapNode]?.rank}) • 
                {candidateSkills.includes(selectedMapNode) ? (
                  <span className="text-emerald-600 font-extrabold ml-1">✓ You have verified this skill</span>
                ) : (
                  <span className="text-amber-600 font-extrabold ml-1">⚠ Missing in your verified profile</span>
                )}
                <span className="text-slate-500 font-semibold ml-2">• Filtered cohort frequency: </span>
                <strong className="text-purple-700 font-extrabold bg-purple-100/60 px-1.5 py-0.5 rounded ml-0.5">
                  {filteredPeers.filter(p => p.skills.includes(selectedMapNode)).length} of {filteredPeers.length} peers
                </strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedMapNode(null)}
              className="text-[10px] font-extrabold text-purple-500 hover:text-purple-700 bg-purple-100/40 hover:bg-purple-100/80 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-purple-200"
            >
              Clear Focus ×
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-[11px] text-blue-700 leading-normal">
            <Target className="h-4 w-4 shrink-0 text-blue-650" />
            <span>
              <strong>Skill Pathway Navigation:</strong> Click nodes or choose tracks to focus on prerequisites and view cohort analytics. Click the background to clear your active focus.
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Expandable Cohort Sidebar */}
      {isSidebarOpen && (
        <div className="lg:w-[33%] flex flex-col gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-900/[0.02] backdrop-blur-md shadow-xs transition-all duration-300">
          
          <AnimatePresence mode="wait">
            {!isPeerListUnlocked ? (
              /* WANNA SEE HOW OTHERS DO? - LIGHT-THEME ALIGNED COVER CTA VIEW */
              <motion.div
                key="locked-cta"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100/70 text-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between gap-6 border border-slate-200 shadow-lg h-full min-h-[500px] hover:shadow-xl transition-shadow duration-300"
              >
                {/* Specular Ambient Glow Orbs */}
                <div className="absolute top-[-20%] right-[-20%] w-[220px] h-[220px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[220px] h-[220px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

                <div className="flex flex-col gap-3.5 relative z-10">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 mb-1">
                    <Users className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-[17px] font-black tracking-tight leading-tight text-slate-900">
                    Compare Cohort Career Paths
                  </h3>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                    Unlock and audit anonymized trajectory blueprints, experience timelines, and skill assets from <strong className="text-teal-650 font-extrabold">{cohortAnalysis.totalPeersMatched}+</strong> engineers targeting the same role.
                  </p>
                </div>

                {/* Micro Stats highlights */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-2xs backdrop-blur-xs">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono block mb-1">Success Rate</span>
                    <span className="text-base font-black text-emerald-600">{cohortAnalysis.successRate}%</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-2xs backdrop-blur-xs">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono block mb-1">Avg Transition</span>
                    <span className="text-base font-black text-blue-600">{(cohortAnalysis.avgMonthsToReach / 12).toFixed(1)} yr</span>
                  </div>
                </div>

                <div className="relative z-10 mt-2">
                  <button
                    onClick={() => setIsPeerListUnlocked(true)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    Reveal Cohort Pathways ➔
                  </button>
                  <p className="text-center text-[9px] text-slate-400 mt-2">
                    Anonymized data processed with differential privacy rules.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* UNLOCKED SIDEBAR CONTENT - PEER LIST & AUDIT ENGINE */
              <motion.div
                key="unlocked-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-4 h-full"
              >
                <div className="border-b border-slate-200/60 pb-3 flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      Peer Career Pathways
                    </h3>
                    <p className="text-[9px] text-slate-505 font-medium leading-none">
                      Compare blueprints for {selectedSkillPath}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPeerListUnlocked(false);
                      setSelectedPeerId(null);
                    }}
                    className="text-[9px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer font-mono border border-slate-200 rounded-md px-2 py-0.5 bg-slate-50 transition-colors"
                  >
                    Lock
                  </button>
                </div>

                {/* Path Statistics */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-2 bg-white border border-slate-200/80 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
                    <span className="text-[7.5px] uppercase font-bold text-slate-400 font-mono block mb-0.5">Success</span>
                    <span className="text-xs font-black text-emerald-600 flex items-center justify-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {cohortAnalysis.successRate}%
                    </span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200/80 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
                    <span className="text-[7.5px] uppercase font-bold text-slate-400 font-mono block mb-0.5">Avg Time</span>
                    <span className="text-xs font-black text-blue-600">
                      {(cohortAnalysis.avgMonthsToReach / 12).toFixed(1)} yr
                    </span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200/80 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
                    <span className="text-[7.5px] uppercase font-bold text-slate-400 font-mono block mb-0.5">Profiles</span>
                    <span className="text-xs font-black text-slate-700">
                      {cohortAnalysis.totalPeersMatched}
                    </span>
                  </div>
                </div>

                {/* UX IMPROVEMENT: PROFESSIONAL COUNTRY FILTER */}
                <div className="flex flex-col gap-1.5 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Filter Cohort by Country</span>
                    {geoFilter !== 'All' && (
                      <button
                        onClick={() => setGeoFilter('All')}
                        className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold cursor-pointer transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="text-[10px]">
                    <select
                      value={geoFilter}
                      onChange={(e) => setGeoFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 outline-none cursor-pointer hover:border-slate-350 focus:border-blue-500 font-medium transition-colors"
                    >
                      <option value="All">All Countries</option>
                      {uniqueGeos.map(geo => (
                        <option key={geo} value={geo}>{geo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Peer Selection List */}
                <div className="flex flex-col gap-2 flex-1 min-h-[320px]">
                  <h4 className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center justify-between">
                    <span>Compare Blueprints ({filteredPeers.length})</span>
                    {filteredPeers.length === 0 && (
                      <span className="text-[8px] text-rose-500 font-bold">No matches</span>
                    )}
                  </h4>
                  <div className="flex flex-col gap-2.5 overflow-y-auto pr-1.5 custom-scrollbar flex-1 max-h-[320px]">
                    {filteredPeers.slice(0, 15).map((peer) => {
                      const isSelected = selectedPeerId === peer.id;
                      const cleanId = peer.id.replace('peer-', '');
                      
                      return (
                        <div
                          key={peer.id}
                          onClick={() => setSelectedPeerId(isSelected ? null : peer.id)}
                          className={`p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.01)] ${
                            isSelected
                              ? 'border-purple-500 bg-white ring-2 ring-purple-500/10'
                              : 'border-slate-200/60 bg-white/70 hover:bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-mono font-bold text-[9.5px] text-purple-700">Candidate Trajectory #{cleanId}</span>
                            <span
                              className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                peer.reachedTarget
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                  : 'bg-amber-50 text-amber-700 border border-amber-150'
                              }`}
                            >
                              {peer.reachedTarget ? 'Transitioned' : 'Active'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1 text-[8.5px] text-slate-500 font-bold font-mono">
                            <span>EXP: {(peer.totalExperienceMonths / 12).toFixed(1)}y</span>
                            <span>GEO: {peer.geo}</span>
                            <span className="text-right text-purple-500">{peer.skillCount} SKILLS</span>
                          </div>

                          {selectedMapNode && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[8px] font-bold font-mono">
                              <span className="text-slate-400 uppercase">Focus Skill:</span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                peer.skills.includes(selectedMapNode)
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}>
                                {peer.skills.includes(selectedMapNode) ? `✓ Has ${selectedMapNode}` : `× Lacks ${selectedMapNode}`}
                              </span>
                            </div>
                          )}
                          
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-purple-100 flex flex-col gap-1">
                              <span className="text-[8px] font-bold font-mono text-purple-600 uppercase tracking-wider">Milestones:</span>
                              <div className="flex flex-col gap-0.5 pl-2 border-l border-purple-300/60 text-[9px] text-slate-650 font-medium">
                                {peer.pathSteps.map((step, sIdx) => (
                                  <span key={sIdx} className="block truncate">
                                    • {step}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredPeers.length === 0 && (
                      <div className="text-center p-6 text-slate-450 italic text-[11px] bg-white border border-slate-200/80 rounded-xl">
                        No candidate profiles match the selected filters.
                      </div>
                    )}
                  </div>
                </div>

                {/* Gap Analysis & Advisory Panel */}
                <div className="pt-2 border-t border-slate-200/60">
                  <AnimatePresence mode="wait">
                    {selectedPeer ? (
                      <motion.div
                        key={selectedPeer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="p-3.5 rounded-xl border border-purple-200 bg-white shadow-sm flex flex-col gap-2.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="text-[11px] font-bold text-purple-800">Skill Gap Audit</span>
                        </div>

                        {/* Skill lists */}
                        <div className="flex flex-col gap-2 text-[10px]">
                          <div>
                            <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block mb-1">
                              Shared Skills ({selectedPeer.skills.filter(s => candidateSkills.includes(s)).length})
                            </span>
                            {(() => {
                              const shared = selectedPeer.skills.filter(s => candidateSkills.includes(s));
                              return shared.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {shared.map(s => (
                                    <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8px] font-bold">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">No skills shared.</span>
                              );
                            })()}
                          </div>

                          <div>
                            <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block mb-1">
                              Gap Missing Skills ({selectedPeer.skills.filter(s => !candidateSkills.includes(s)).length})
                            </span>
                            {(() => {
                              const missing = selectedPeer.skills.filter(s => !candidateSkills.includes(s));
                              return missing.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {missing.map(s => (
                                    <span key={s} className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-250 text-amber-700 text-[8px] font-bold">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-bold">Closed trajectory gap!</span>
                              );
                            })()}
                          </div>

                          <div className="mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[9.5px] leading-relaxed text-slate-600">
                            {(() => {
                              const missing = selectedPeer.skills.filter(s => !candidateSkills.includes(s));
                              const cleanId = selectedPeer.id.replace('peer-', '');
                              
                              return missing.length > 0 ? (
                                <span>
                                  <strong>Gap Advice:</strong> To match Candidate #{cleanId}'s path, prioritize learning <strong>{missing.join(', ')}</strong>. You can schedule study modules during Sabbaticals on your timeline to close these gaps.
                                </span>
                              ) : (
                                <span>
                                  <strong>Gap Advice:</strong> Your skillset fully aligns with Candidate #{cleanId}. Focus on deployment architectures and systems optimization.
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-white shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-blue-650" />
                          <span className="text-[11px] font-bold text-blue-800">Career Path Advisory</span>
                        </div>
                        {(() => {
                          const generalMissing = cohortAnalysis.topSkills
                            .filter(ts => !candidateSkills.includes(ts.skill))
                            .slice(0, 3);
                          
                          return (
                            <div className="text-[9.5px] leading-relaxed text-slate-650 flex flex-col gap-2">
                              {generalMissing.length > 0 ? (
                                <p>
                                  Successful candidates targeting <strong>{selectedSkillPath}</strong> frequently possess skills you are missing: <strong>{generalMissing.map(s => s.skill).join(', ')}</strong>.
                                </p>
                              ) : (
                                <p>
                                  You possess all standard skills required for the <strong>{selectedSkillPath}</strong> role. Use the timeline to audit transition hazard risks.
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-[8px] font-bold text-blue-650 font-mono bg-blue-50 px-2 py-1 rounded">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span>Audit specific gap variations by clicking peer cards above.</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      )}
      </div>
    </div>
  );
}
