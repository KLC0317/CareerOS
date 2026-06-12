'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { SKILL_DAG, getPreRequisitesRecursive, DEFAULT_ROADMAP_METADATA } from '../lib/careerEngine';
import roadmapData from '../public/roadmap.json';
import { Award, Layers, Target, CheckCircle2, XCircle, Users, TrendingUp, Brain, BookOpen, Eye, EyeOff, Send, Calendar, Trophy, Archive, X, FileText, HelpCircle, ArrowDown, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

const FlowArrow = ({ active }: { active: boolean }) => (
  <div className="hidden md:flex items-center justify-center shrink-0 w-12 mx-1">
    <svg className="w-12 h-6 overflow-visible" viewBox="0 0 48 24">
      {/* Background path line */}
      <path
        d="M 2 12 L 44 12"
        stroke="currentColor"
        className="text-slate-200 dark:text-slate-800 transition-colors"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Active trace path */}
      <motion.path
        d="M 2 12 L 44 12"
        stroke="url(#flowArrowGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: [0, 1], opacity: [0.3, 1, 0.3] } : { pathLength: 0, opacity: 0 }}
        transition={active ? {
          pathLength: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        } : {}}
      />
      {/* Flow particle */}
      {active && (
        <motion.circle
          cx="2"
          cy="12"
          r="3"
          className="fill-indigo-500 shadow-sm"
          style={{ filter: "drop-shadow(0 0 3px rgba(99, 102, 241, 0.8))" }}
          animate={{ cx: [2, 44] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Glowing Arrowhead */}
      <path
        d="M 38 6 L 44 12 L 38 18"
        stroke="currentColor"
        className={`transition-colors duration-300 ${active ? 'text-indigo-500' : 'text-slate-350 dark:text-slate-700'}`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id="flowArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const VerticalFlowArrow = ({ active }: { active: boolean }) => (
  <div className="flex md:hidden items-center justify-center shrink-0 h-12 my-1">
    <svg className="h-12 w-6 overflow-visible" viewBox="0 0 24 48">
      {/* Background path line */}
      <path
        d="M 12 2 L 12 44"
        stroke="currentColor"
        className="text-slate-200 dark:text-slate-800 transition-colors"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Active trace path */}
      <motion.path
        d="M 12 2 L 12 44"
        stroke="url(#flowArrowGradVert)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: [0, 1], opacity: [0.3, 1, 0.3] } : { pathLength: 0, opacity: 0 }}
        transition={active ? {
          pathLength: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        } : {}}
      />
      {/* Flow particle */}
      {active && (
        <motion.circle
          cx="12"
          cy="2"
          r="3"
          className="fill-indigo-500"
          style={{ filter: "drop-shadow(0 0 3px rgba(99, 102, 241, 0.8))" }}
          animate={{ cy: [2, 44] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Glowing Arrowhead */}
      <path
        d="M 6 38 L 12 44 L 18 38"
        stroke="currentColor"
        className={`transition-colors duration-300 ${active ? 'text-indigo-500' : 'text-slate-350 dark:text-slate-700'}`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id="flowArrowGradVert" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default function SkillActivationMap() {
  const {
    candidateSkills,
    selectedSkillPath,
    setSelectedSkillPath,
    cohortAnalysis,
    userProfile,
    careerPaths,
    applications,
    setActivePersona,
    setActiveStatusTab,
    markSkillAsAcquired
  } = useCareerEngine();

  const primaryRole = useMemo(() => {
    if (userProfile.targetRole && userProfile.targetRole !== 'PENDING_ONBOARDING') {
      return userProfile.targetRole;
    }
    return 'AI Architect';
  }, [userProfile.targetRole]);

  const alternativeRoles = useMemo(() => {
    const allPaths = ['AI Architect', 'Frontend Architect', 'Engineering Director'];
    const filtered = allPaths.filter(p => p.toLowerCase() !== primaryRole.toLowerCase());
    return filtered.slice(0, 2);
  }, [primaryRole]);

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  // Filter States
  const [geoFilter, setGeoFilter] = useState<string>('All');

  // Interactive Node Inspection Focus State
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  // Tooltip / Data Ingestion Flow Animation States
  const [showDataFlowInfo, setShowDataFlowInfo] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [showPeerPathwaysInfo, setShowPeerPathwaysInfo] = useState(false);

  useEffect(() => {
    if (!showDataFlowInfo) return;
    const interval = setInterval(() => {
      setActiveFlowStep(prev => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [showDataFlowInfo]);

  // Greeting Banner visibility state
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const initialSelectionDone = useRef(false);

  const peerPathwaysTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPeerPathwaysInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        peerPathwaysTooltipRef.current && 
        !peerPathwaysTooltipRef.current.contains(target) &&
        !target.closest('.peer-pathways-help-trigger')
      ) {
        setShowPeerPathwaysInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPeerPathwaysInfo]);

  // Zoom & Pan State for SVG Map
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (e.button !== 0 || target.tagName === 'circle' || target.tagName === 'text' || target.closest('.zoom-controls')) return;
    setIsDragging(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPanOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = zoomScale;
    if (e.deltaY < 0) {
      newScale = Math.min(2.5, zoomScale * zoomFactor);
    } else {
      newScale = Math.max(0.6, zoomScale / zoomFactor);
    }
    setZoomScale(newScale);
  };

  const resetZoomPan = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);
  };

  useEffect(() => {
    if (careerPaths.length > 0 && !initialSelectionDone.current) {
      // If the hook's selectedSkillPath is missing or invalid, set to first path
      if (!selectedSkillPath || !careerPaths.includes(selectedSkillPath)) {
        setSelectedSkillPath(careerPaths[0]);
      }
      initialSelectionDone.current = true;
    }
  }, [careerPaths]);
  // Auto-open sidebar logic removed because cohort context is now permanent

  // Auto-select first career path as default if none selected
  useEffect(() => {
    if (careerPaths.length > 0 && !selectedSkillPath) {
      setSelectedSkillPath(careerPaths[0]);
    }
  }, [careerPaths, selectedSkillPath, setSelectedSkillPath]);

  const selectedPeer = useMemo(() => {
    if (!cohortAnalysis) return null;
    return cohortAnalysis.peerSummaries.find(p => p.id === selectedPeerId) || null;
  }, [cohortAnalysis, selectedPeerId]);

  const activeRoadmap = useMemo(() => {
    let match: any = roadmapData?.roadmaps?.find((r: any) => r.title === selectedSkillPath);
    if (!match) {
      match = DEFAULT_ROADMAP_METADATA.find(r => r.title === selectedSkillPath);
    }
    return match || null;
  }, [selectedSkillPath]);

  const inspectPrereqs = useMemo(() => {
    if (!selectedMapNode) return [];
    return [selectedMapNode, ...getPreRequisitesRecursive(selectedMapNode)];
  }, [selectedMapNode]);

  const emergingPaths = useMemo(() => {
    return careerPaths.filter(track => track !== selectedSkillPath).slice(0, 2);
  }, [selectedSkillPath, careerPaths]);

  const roadmapLayout = useMemo(() => {
    if (!activeRoadmap || !activeRoadmap.content) {
      return { nodes: [], containers: [], connections: [], width: 1000, height: 600 };
    }

    interface NodeLayout {
      id: string;
      name: string;
      type: 'branch' | 'topic' | 'item';
      x: number;
      y: number;
      width: number;
      height: number;
      verified: boolean;
      peerHas: boolean;
    }

    interface ContainerLayout {
      id: string;
      title: string;
      x: number;
      y: number;
      width: number;
      height: number;
      items: NodeLayout[];
    }

    interface ConnectionLayout {
      id: string;
      d: string;
      type: 'solid' | 'dotted';
      active: boolean;
    }

    const nodes: NodeLayout[] = [];
    const containers: ContainerLayout[] = [];
    const connections: ConnectionLayout[] = [];

    const centerX = 500;
    const leftX = centerX - 330;
    const rightX = centerX + 120;

    const branchWidth = 260;
    const branchHeight = 44;
    const topicWidth = 180;
    const topicHeight = 34;
    const itemWidth = 185;
    const itemHeight = 32;

    let currentY = 60;

    activeRoadmap.content.forEach((c: any, index: number) => {
      const branchName = c.branch;
      const branchY = currentY;

      // 1. Calculate height of topics (left column)
      let topicsHeight = 0;
      const topicsCount = c.topics ? c.topics.length : 0;
      if (topicsCount > 0) {
        topicsHeight = topicsCount * topicHeight + (topicsCount - 1) * 12;
      }

      // 2. Calculate height of sub-branches (right column)
      let subBranchesHeight = 0;
      const subBranchesList = c.sub_branches || [];
      const subBranchContainerLayouts: any[] = [];

      subBranchesList.forEach((sb: any) => {
        const itemsCount = sb.items ? sb.items.length : 0;
        const containerH = 28 + itemsCount * 38 + 8;
        subBranchContainerLayouts.push({
          title: sb.title,
          items: sb.items || [],
          height: containerH
        });
        subBranchesHeight += containerH + 16;
      });
      if (subBranchesHeight > 0) {
        subBranchesHeight -= 16;
      }

      const rowHeight = Math.max(topicsHeight, subBranchesHeight, branchHeight) + 40;

      // Place branch node
      nodes.push({
        id: `branch-${index}`,
        name: branchName,
        type: 'branch',
        x: centerX - branchWidth / 2,
        y: branchY - branchHeight / 2,
        width: branchWidth,
        height: branchHeight,
        verified: candidateSkills.includes(branchName),
        peerHas: selectedPeer ? selectedPeer.skills.includes(branchName) : false
      });

      // Place topics on the left
      if (topicsCount > 0) {
        const topicsStartY = branchY - topicsHeight / 2;
        const busX = leftX + topicWidth + 15;

        // Draw horizontal line from branch node left to left bus
        connections.push({
          id: `conn-branch-to-left-bus-${index}`,
          d: `M ${centerX - branchWidth / 2} ${branchY} L ${busX} ${branchY}`,
          type: 'dotted',
          active: false
        });

        c.topics.forEach((topicName: string, tIdx: number) => {
          const topicY = topicsStartY + tIdx * (topicHeight + 12);
          const isTopicVerified = candidateSkills.includes(topicName);
          const isTopicPeer = selectedPeer ? selectedPeer.skills.includes(topicName) : false;

          nodes.push({
            id: `topic-${index}-${tIdx}`,
            name: topicName,
            type: 'topic',
            x: leftX,
            y: topicY,
            width: topicWidth,
            height: topicHeight,
            verified: isTopicVerified,
            peerHas: isTopicPeer
          });

          // Orthogonal connector line: branch left -> go to midX, down/up to topicY, left to topic box
          connections.push({
            id: `conn-left-bus-to-topic-${index}-${tIdx}`,
            d: `M ${busX} ${branchY} Q ${busX} ${topicY + topicHeight / 2} ${leftX + topicWidth} ${topicY + topicHeight / 2}`,
            type: 'dotted',
            active: false
          });
        });
      }

      // Place sub-branches on the right
      if (subBranchesList.length > 0) {
        let subBranchY = branchY - subBranchesHeight / 2;
        const busX = rightX - 15;

        // Draw connection bus line to right
        connections.push({
          id: `conn-branch-to-right-bus-${index}`,
          d: `M ${centerX + branchWidth / 2} ${branchY} L ${rightX} ${branchY}`,
          type: 'dotted',
          active: false
        });

        subBranchContainerLayouts.forEach((sbLayout, sbIdx) => {
          const containerItems: NodeLayout[] = [];

          sbLayout.items.forEach((itemName: string, itemIdx: number) => {
            const isItemVerified = candidateSkills.includes(itemName);
            const isItemPeer = selectedPeer ? selectedPeer.skills.includes(itemName) : false;

            containerItems.push({
              id: `item-${index}-${sbIdx}-${itemIdx}`,
              name: itemName,
              type: 'item',
              x: rightX + 10,
              y: subBranchY + 32 + itemIdx * 38,
              width: itemWidth,
              height: itemHeight,
              verified: isItemVerified,
              peerHas: isItemPeer
            });
          });

          containers.push({
            id: `container-${index}-${sbIdx}`,
            title: sbLayout.title,
            x: rightX,
            y: subBranchY,
            width: 205,
            height: sbLayout.height,
            items: containerItems
          });

          subBranchY += sbLayout.height + 16;
        });
      }

      // Connect vertical flow down to next branch
      if (index < activeRoadmap.content.length - 1) {
        const nextBranchY = branchY + rowHeight;
        connections.push({
          id: `conn-vertical-flow-${index}`,
          d: `M ${centerX} ${branchY + branchHeight / 2} L ${centerX} ${nextBranchY - branchHeight / 2}`,
          type: 'solid',
          active: candidateSkills.includes(branchName)
        });
      }

      currentY += rowHeight;
    });

    return {
      nodes,
      containers,
      connections,
      width: 1000,
      height: currentY + 40
    };
  }, [activeRoadmap, candidateSkills, selectedPeer]);


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
      {/* Greeting Banner */}
      {isBannerVisible && (
        <div className="greeting-banner relative z-20 flex items-center gap-3.5 px-4 py-3 rounded-xl shadow-xs overflow-hidden border">
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-400 rounded-l-xl" />

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 ml-1">
            <span className="text-[11px] font-black text-purple-700">
              {(userProfile.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] leading-snug greeting-banner-body">
              <span className="font-bold greeting-banner-name">{userProfile.name ? `Hi ${userProfile.name.split(' ')[0]}! ` : 'Welcome back'}</span>
              Targeting <span className="font-semibold text-purple-600">{primaryRole}</span>
              {alternativeRoles.length > 0 && (
                <>
                  {'? '}
                  <span className="font-medium greeting-banner-trending">
                    {alternativeRoles[0]}
                    {alternativeRoles[1] && ` and ${alternativeRoles[1]}`} are trending.
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Dismiss Banner Button */}
          <button
            onClick={() => setIsBannerVisible(false)}
            className="p-1.5 hover:bg-purple-100/50 rounded-lg transition-colors cursor-pointer shrink-0 greeting-banner-dismiss"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Job Applications KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'Applied Positions',
            count: applications ? applications.length : 0,
            description: 'Total applications sent',
            colorClass: 'text-blue-600 dark:text-blue-400',
            bgClass: 'bg-blue-50/60 dark:bg-blue-900/20',
            iconClass: 'text-blue-500 dark:text-blue-400',
            icon: <Send className="h-4 w-4" />,
            cardStyle: 'kpi-card-blue',
            statusKey: 'applied'
          },
          {
            title: 'Interviews',
            count: applications ? applications.filter((a: any) => a.status === 'interviewing').length : 0,
            description: 'In-progress review rounds',
            colorClass: 'text-amber-600 dark:text-amber-400',
            bgClass: 'bg-amber-50/60 dark:bg-amber-900/20',
            iconClass: 'text-amber-600 dark:text-amber-400',
            icon: <Calendar className="h-4 w-4" />,
            cardStyle: 'kpi-card-amber',
            statusKey: 'interviewing'
          },
          {
            title: 'Offers Received',
            count: applications ? applications.filter((a: any) => a.status === 'offered').length : 0,
            description: 'Active contract proposals',
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            bgClass: 'bg-emerald-50/60 dark:bg-emerald-900/20',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
            icon: <Trophy className="h-4 w-4" />,
            cardStyle: 'kpi-card-emerald',
            statusKey: 'offered'
          },
          {
            title: 'Archived / Rejections',
            count: applications ? applications.filter((a: any) => a.status === 'rejected').length : 0,
            description: 'Closed opportunities',
            colorClass: 'text-rose-600 dark:text-rose-400',
            bgClass: 'bg-rose-50/60 dark:bg-rose-900/20',
            iconClass: 'text-rose-500 dark:text-rose-400',
            icon: <Archive className="h-4 w-4" />,
            cardStyle: 'kpi-card-rose',
            statusKey: 'rejected'
          }
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => {
              setActivePersona('jobs');
              setActiveStatusTab(kpi.statusKey as any);
            }}
            className={`kpi-card ${kpi.cardStyle} p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-1.5 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-mono">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-lg ${kpi.bgClass}`}>
                <span className={kpi.iconClass}>{kpi.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${kpi.colorClass}`}>
                {kpi.count}
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {kpi.description}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
        {/* Inline styles for connection dash flow keyframes */}
        <style dangerouslySetInnerHTML={{
          __html: `
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
        <div className="transition-all duration-300 w-full lg:w-[67%] flex flex-col gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white relative shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-850 tracking-tight">Cohort-Derived Skill Blueprint</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <Users className="h-3 w-3 text-teal-500" />
                <span>Generated by analyzing <strong className="text-teal-650">{cohortAnalysis?.totalPeersMatched || 0}+</strong> peer trajectories for <strong className="text-indigo-650">{selectedSkillPath}</strong>.</span>
              </div>
            </div>

            {/* Controls - Contains track path selectors only */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {careerPaths.slice(0, 3).map((track) => (
                  <button
                    key={track}
                    onClick={() => {
                      setSelectedSkillPath(track);
                      setSelectedPeerId(null); // Clear selected peer when track changes
                      setSelectedMapNode(null); // Clear map node focus
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider uppercase border transition-all duration-200 cursor-pointer ${selectedSkillPath === track
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

          <div className="relative w-full bg-slate-900/[0.02] border border-slate-200/80 rounded-xl p-2 overflow-hidden">
            {/* Legend */}
            <div className="graph-legend absolute top-3 right-3 flex flex-wrap items-center gap-3 text-[9px] px-2.5 py-1.5 rounded-lg border backdrop-blur-md z-20 shadow-xs">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px #22c55e' }}></span>
                <span className="graph-legend-label font-semibold">Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-indigo-500" style={{ boxShadow: '0 0 6px #6366f1' }}></span>
                <span className="graph-legend-label font-medium">Cohort Match %</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-teal-500" style={{ boxShadow: '0 0 6px #14b8a6' }}></span>
                <span className="graph-legend-label font-medium">Planned</span>
              </div>
              <div className="h-3 w-px bg-slate-350 dark:bg-slate-700 mx-0.5" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDataFlowInfo(prev => !prev);
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors font-extrabold ${showDataFlowInfo
                    ? 'bg-indigo-650 text-white border border-indigo-700 shadow-sm'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
              >
                <HelpCircle className="h-3 w-3 shrink-0" />
                <span>How It Works?</span>
              </button>
            </div>

            {/* Verification Flow Modal Overlay */}
            <AnimatePresence>
              {showDataFlowInfo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDataFlowInfo(false)}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4 cursor-default"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 md:p-8 shadow-2xl max-w-3xl w-full flex flex-col gap-6 relative overflow-hidden animate-fade-in"
                  >
                    {/* Top Accent Gradient Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500" />

                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 max-w-[90%]">
                        <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono tracking-widest">
                          Calculation Pipeline
                        </span>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                          Wanna Know How We Calculate Gaps?
                        </h3>
                        <p className="text-xs text-slate-550 dark:text-slate-450 leading-normal">
                          Our engine maps gaps strictly by comparing your profile with verified peer cohort data.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDataFlowInfo(false)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Visual Steps Flow (Desktop: Row, Mobile: Col) */}
                    <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 py-2">
                      {/* Step 1: Raw Cohort Data */}
                      <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeFlowStep === 0
                          ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                        }`}>
                        {/* Visual Animation Box */}
                        <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                          {/* Floating peer node icons */}
                          <div className="absolute inset-0 flex items-center justify-center gap-3">
                            <motion.div
                              animate={activeFlowStep === 0 ? {
                                y: [0, -6, 0],
                                scale: [1, 1.05, 1],
                                borderColor: ['rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 1)', 'rgba(99, 102, 241, 0.4)']
                              } : { y: [0, -3, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-10 h-10 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs"
                            >
                              <Users className="h-4 w-4 text-indigo-500" />
                            </motion.div>

                            <motion.div
                              animate={activeFlowStep === 0 ? {
                                y: [0, 6, 0],
                                scale: [1, 1.05, 1],
                                borderColor: ['rgba(20, 184, 166, 0.4)', 'rgba(20, 184, 166, 1)', 'rgba(20, 184, 166, 0.4)']
                              } : { y: [0, 3, 0] }}
                              transition={{ duration: 2.4, repeat: Infinity }}
                              className="w-10 h-10 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs"
                            >
                              <Users className="h-4 w-4 text-teal-500" />
                            </motion.div>

                            <motion.div
                              animate={activeFlowStep === 0 ? {
                                y: [0, -4, 0],
                                scale: [1, 1.05, 1],
                                borderColor: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.4)']
                              } : { y: [0, -2, 0] }}
                              transition={{ duration: 1.8, repeat: Infinity }}
                              className="w-10 h-10 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs"
                            >
                              <Users className="h-4 w-4 text-blue-500" />
                            </motion.div>
                          </div>

                          {/* Animated data packet traveling out */}
                          {activeFlowStep === 0 && (
                            <motion.div
                              initial={{ x: -40, opacity: 0 }}
                              animate={{ x: 60, opacity: [0, 1, 1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute w-3 h-3 rounded-full bg-indigo-500 shadow-md shadow-indigo-400"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className={`h-4 w-4 shrink-0 ${activeFlowStep === 0 ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <h4 className="text-xs font-bold tracking-tight">1. Cohort Data</h4>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          Resumes & timelines of 1,200+ verified professionals.
                        </p>
                      </div>

                      {/* Arrow 1 */}
                      <div className="flex md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                        <FlowArrow active={activeFlowStep === 0} />
                        <VerticalFlowArrow active={activeFlowStep === 0} />
                      </div>

                      {/* Step 2: NLP Normalizer */}
                      <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeFlowStep === 1
                          ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                        }`}>
                        {/* Visual Animation Box */}
                        <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                          {/* Funnel animation */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Raw skill tag entering */}
                            <motion.div
                              animate={activeFlowStep === 1 ? {
                                x: [-50, 0, 0, 50],
                                opacity: [0, 1, 1, 0],
                                scale: [0.9, 1, 1, 0.9]
                              } : {}}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-mono border border-slate-300 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-300"
                            >
                              {activeFlowStep === 1 ? "python3" : "py"}
                            </motion.div>

                            {/* Scanner bar */}
                            <motion.div
                              animate={activeFlowStep === 1 ? {
                                opacity: [0.3, 1, 0.3],
                                scaleY: [0.8, 1.1, 0.8]
                              } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute w-0.5 h-12 bg-indigo-500 shadow-xs shadow-indigo-500"
                            />

                            {/* Clean tag exiting on the right */}
                            <motion.div
                              animate={activeFlowStep === 1 ? {
                                x: [0, 45],
                                opacity: [0, 1],
                                scale: [0.8, 1]
                              } : { opacity: 0.2 }}
                              transition={{ delay: 0.8, duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                              className="absolute px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30"
                            >
                              Python
                            </motion.div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className={`h-4 w-4 shrink-0 ${activeFlowStep === 1 ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <h4 className="text-xs font-bold tracking-tight">2. NLP Normalizer</h4>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
                          Maps spelling variations into standardized skill nodes.
                        </p>
                      </div>

                      {/* Arrow 2 */}
                      <div className="flex md:flex-col items-center justify-center shrink-0 py-1 md:py-0">
                        <FlowArrow active={activeFlowStep === 1} />
                        <VerticalFlowArrow active={activeFlowStep === 1} />
                      </div>

                      {/* Step 3: Math Overlaps */}
                      <div className={`flex-1 flex flex-col p-4 rounded-2xl border transition-all duration-300 ${activeFlowStep === 2
                          ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500 shadow-md text-slate-900 dark:text-slate-100 scale-102 z-10'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-150 dark:border-slate-900 text-slate-500 dark:text-slate-400 opacity-70'
                        }`}>
                        {/* Visual Animation Box */}
                        <div className="h-28 w-full flex items-center justify-center relative bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-3 border border-slate-200/40 dark:border-slate-800/40">
                          {/* Venn diagram layout */}
                          <div className="relative w-28 h-16 flex items-center justify-center">
                            {/* Cohort Circle */}
                            <motion.div
                              animate={activeFlowStep === 2 ? {
                                scale: [1, 1.03, 1],
                                backgroundColor: ['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.15)']
                              } : {}}
                              transition={{ duration: 2.5, repeat: Infinity }}
                              className="absolute left-2 w-12 h-12 rounded-full border border-indigo-500/60 bg-indigo-500/15 flex items-center justify-center text-[8px] font-black text-indigo-600 dark:text-indigo-400"
                            >
                              Cohort
                            </motion.div>

                            {/* You Circle */}
                            <motion.div
                              animate={activeFlowStep === 2 ? {
                                scale: [1, 1.03, 1],
                                backgroundColor: ['rgba(20, 184, 166, 0.15)', 'rgba(20, 184, 166, 0.25)', 'rgba(20, 184, 166, 0.15)']
                              } : {}}
                              transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
                              className="absolute right-2 w-12 h-12 rounded-full border border-teal-500/60 bg-teal-500/15 flex items-center justify-center text-[8px] font-black text-teal-600 dark:text-teal-400"
                            >
                              You
                            </motion.div>

                            {/* Overlap Gap Highlight */}
                            {activeFlowStep === 2 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="absolute w-5 h-8 bg-amber-500/30 dark:bg-amber-500/40 rounded-full border border-amber-500 flex items-center justify-center text-[7px] font-black text-amber-800 dark:text-amber-300 z-10 shadow-xs"
                              >
                                Gap
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <Target className={`h-4 w-4 shrink-0 ${activeFlowStep === 2 ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <h4 className="text-xs font-bold tracking-tight">3. Gap Match</h4>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
                          Identifies overlap differences. Strictly calculation-driven.
                        </p>
                      </div>
                    </div>

                    {/* Bottom disclaimer badge - Highlighting "No Predictions" */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3.5 mt-1">
                      <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono tracking-widest">
                          Analysis Guaranteed
                        </span>
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-normal">
                          Our system maps pathways strictly by evaluating overlapping patterns inside verified profiles. <strong>We never predict or guess.</strong>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <svg
              viewBox={`0 0 1000 ${roadmapLayout.height}`}
              className={`w-full h-auto min-w-[900px] overflow-visible select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
            >
              {/* Click background to reset selected node focus */}
              <rect
                width="1000"
                height={roadmapLayout.height}
                fill="none"
                pointerEvents="all"
                className="cursor-default"
                onClick={() => setSelectedMapNode(null)}
              />

              <g
                transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}
                style={{
                  transformOrigin: '500px 100px',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
              >
                {/* Connection lines */}
                {roadmapLayout.connections.map(conn => {
                  const isDotted = conn.type === 'dotted';
                  const isConnFocused = !selectedMapNode || (() => {
                    if (conn.id.startsWith('conn-vertical-flow-')) {
                      const idx = parseInt(conn.id.replace('conn-vertical-flow-', ''), 10);
                      const nextBranch = activeRoadmap?.content[idx + 1]?.branch;
                      return inspectPrereqs.includes(nextBranch);
                    }
                    if (conn.id.startsWith('conn-left-bus-to-topic-')) {
                      const parts = conn.id.replace('conn-left-bus-to-topic-', '').split('-');
                      const bIdx = parseInt(parts[0], 10);
                      const tIdx = parseInt(parts[1], 10);
                      const topicName = activeRoadmap?.content[bIdx]?.topics?.[tIdx];
                      return topicName ? inspectPrereqs.includes(topicName) : false;
                    }
                    if (conn.id.startsWith('conn-branch-to-right-bus-')) {
                      const idx = parseInt(conn.id.replace('conn-branch-to-right-bus-', ''), 10);
                      const branchData = activeRoadmap?.content[idx];
                      if (branchData && branchData.sub_branches) {
                        return branchData.sub_branches.some((sb: any) =>
                          sb.items && sb.items.some((item: string) => inspectPrereqs.includes(item))
                        );
                      }
                      return false;
                    }
                    return false;
                  })();

                  return (
                    <path
                      key={conn.id}
                      d={conn.d}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={isDotted ? "2.5" : "4"}
                      strokeLinecap="round"
                      strokeDasharray={isDotted ? "4 4" : "none"}
                      className={conn.active ? 'route-flow-animate' : ''}
                      style={{
                        opacity: isConnFocused ? 1 : 0.15,
                        transition: 'opacity 0.3s ease'
                      }}
                    />
                  );
                })}

                {/* Sub-branch Group Containers */}
                {roadmapLayout.containers.map(container => {
                  const hasFocusedItem = !selectedMapNode || container.items.some(item => inspectPrereqs.includes(item.name));

                  return (
                    <foreignObject
                      key={container.id}
                      x={container.x}
                      y={container.y}
                      width={container.width}
                      height={container.height}
                      className="overflow-visible"
                    >
                      <div
                        className={`w-full h-full bg-white border-2 border-black rounded-lg shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] p-2.5 flex flex-col gap-2 transition-all duration-300 ${selectedMapNode && !hasFocusedItem ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                          }`}
                      >
                        <span className="text-[10px] font-black text-slate-850 border-b border-slate-200 pb-1.5 uppercase tracking-wider block text-center font-mono">
                          {container.title}
                        </span>
                        <div className="flex flex-col gap-2 flex-1 justify-center">
                          {container.items.map(item => {
                            const isItemFocused = !selectedMapNode || inspectPrereqs.includes(item.name);
                            const isInspected = selectedMapNode === item.name;
                            const peerMatchCount = filteredPeers.filter(p => p.skills.includes(item.name)).length;
                            const peerMatchPct = filteredPeers.length > 0 ? Math.round((peerMatchCount / filteredPeers.length) * 100) : 0;

                            return (
                              <div
                                key={item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMapNode(isInspected ? null : item.name);
                                }}
                                className={`w-full h-8 flex items-center justify-center rounded border border-black bg-[#FFEAA7] hover:bg-[#FFE082] text-black font-extrabold text-[10px] px-2 text-center transition-all cursor-pointer relative shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${selectedMapNode && !isItemFocused ? 'opacity-30' : 'opacity-100'
                                  } ${isInspected ? 'ring-2 ring-indigo-500 bg-[#FFE082]' : ''}`}
                              >
                                <div className="absolute -top-1.5 -left-1.5 flex gap-0.5 z-30">
                                  {peerMatchPct > 0 && (
                                    <span className="bg-indigo-500 text-white rounded px-1 flex items-center justify-center text-[7px] font-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                                      {peerMatchPct}%
                                    </span>
                                  )}
                                </div>
                                <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 z-30">
                                  {item.verified && (
                                    <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-black">
                                      ✓
                                    </span>
                                  )}
                                  {item.peerHas && (
                                    <span className="w-3.5 h-3.5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-black">
                                      •
                                    </span>
                                  )}
                                </div>
                                <span className="line-clamp-2 leading-none font-sans">{item.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </foreignObject>
                  );
                })}

                {/* Branch & Topic Nodes */}
                {roadmapLayout.nodes.map(node => {
                  const isNodeFocused = !selectedMapNode || inspectPrereqs.includes(node.name);
                  const isInspected = selectedMapNode === node.name;
                  const peerMatchCount = filteredPeers.filter(p => p.skills.includes(node.name)).length;
                  const peerMatchPct = filteredPeers.length > 0 ? Math.round((peerMatchCount / filteredPeers.length) * 100) : 0;

                  return (
                    <foreignObject
                      key={node.id}
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      className="overflow-visible"
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMapNode(isInspected ? null : node.name);
                        }}
                        className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-black transition-all cursor-pointer select-none text-center px-3 relative shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${node.type === 'branch'
                            ? 'bg-[#FFE600] text-black font-extrabold text-[12.5px]'
                            : 'bg-[#FFEAA7] hover:bg-[#FFE082] text-black font-extrabold text-[10.5px]'
                          } ${selectedMapNode && !isNodeFocused ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                          } ${isInspected ? 'ring-2 ring-indigo-500 border-indigo-600' : ''}`}
                      >
                        <div className="absolute -top-2 -left-2 flex gap-0.5 z-30">
                          {peerMatchPct > 0 && (
                            <span className="bg-indigo-500 text-white rounded px-1.5 flex items-center justify-center text-[9px] font-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                              {peerMatchPct}%
                            </span>
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 flex gap-0.5 z-30">
                          {node.verified && (
                            <span className="w-4.5 h-4.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                              ✓
                            </span>
                          )}
                          {node.peerHas && (
                            <span className="w-4.5 h-4.5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                              •
                            </span>
                          )}
                        </div>
                        <span className="line-clamp-2 leading-snug font-sans">{node.name}</span>
                      </div>
                    </foreignObject>
                  );
                })}

              </g>
            </svg>


            {/* Zoom / Pan Floating Controls */}
            <div className="zoom-controls absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg p-1 z-20 shadow-sm">
              <button
                onClick={() => setZoomScale(prev => Math.min(2.5, prev * 1.2))}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(0.6, prev / 1.2))}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={resetZoomPan}
                className="px-1.5 h-6 flex items-center justify-center text-[10px] font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer uppercase tracking-wider"
                title="Reset Zoom & Pan"
              >
                Reset
              </button>
            </div>
            {/* Selected Node Modal - Positioned absolutely within the map container */}
            <AnimatePresence>
              {selectedMapNode && (() => {
                const peerMatchCount = filteredPeers.filter(p => p.skills.includes(selectedMapNode)).length;
                const peerMatchPct = filteredPeers.length > 0 ? Math.round((peerMatchCount / filteredPeers.length) * 100) : 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-3 top-3 w-64 md:w-72 max-h-[85%] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/80 p-3.5 flex flex-col gap-3.5 z-50 overflow-y-auto custom-scrollbar"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 max-w-[85%]">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 leading-snug">
                          <Brain className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">{selectedMapNode}</span>
                        </h3>
                        <div>
                          <span className="inline-block text-[8px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded font-mono tracking-wide uppercase">
                            Rank {SKILL_DAG[selectedMapNode]?.rank || 0}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMapNode(null)}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-650 leading-relaxed shadow-inner">
                      <p>
                        {SKILL_DAG[selectedMapNode]?.description || 'A key technical skill or framework within the selected career trajectory.'}
                      </p>
                      {SKILL_DAG[selectedMapNode]?.url && (
                        <a
                          href={SKILL_DAG[selectedMapNode]?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex mt-1.5 text-indigo-650 hover:text-indigo-850 font-black hover:underline text-[10px] items-center gap-0.5"
                        >
                          Learn More →
                        </a>
                      )}
                    </div>

                    {/* Prerequisites */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[10px] font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-blue-500" /> Prerequisites
                      </h4>
                      {SKILL_DAG[selectedMapNode]?.prerequisites && SKILL_DAG[selectedMapNode].prerequisites.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {SKILL_DAG[selectedMapNode].prerequisites.map((prereq: string) => (
                            <span key={prereq} className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded">
                              {prereq}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9.5px] text-slate-500 italic">No prerequisites.</span>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <h4 className="text-[10px] font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-emerald-500" /> Profile Status
                      </h4>
                      {candidateSkills.includes(selectedMapNode) ? (
                        <div className="bg-emerald-50/80 border border-emerald-200/65 rounded-lg p-2 flex items-center justify-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-emerald-700 font-extrabold text-[9.5px] uppercase tracking-wider">Acquired Skill</span>
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 border border-amber-200/80 rounded-lg p-2.5 flex flex-col gap-2 shadow-2xs">
                          <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px]">
                            <XCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Skill Gaps
                          </div>

                          <div className="flex flex-col gap-1 bg-white/60 p-2 rounded-md border border-amber-100">
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 font-mono">
                              <span>Cohort Match Rate</span>
                              <span className="text-indigo-650">{peerMatchPct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                              {peerMatchPct > 0 && (
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${peerMatchPct}%` }}
                                />
                              )}
                            </div>
                            <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">
                              {peerMatchCount} of {filteredPeers.length} cohort peers have this.
                            </span>
                          </div>

                          <button
                            onClick={() => markSkillAsAcquired(selectedMapNode)}
                            className="w-full bg-white border border-amber-250 text-amber-700 hover:bg-amber-100/60 font-extrabold text-[9px] py-1 rounded-md transition-colors cursor-pointer"
                          >
                            Mark as Acquired
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          <div className="graph-helper flex gap-2 items-center rounded-xl p-3.5 text-[11px] leading-normal mt-2">
            <Target className="h-4 w-4 shrink-0 graph-helper-icon" />
            <span>
              <strong className="graph-helper-title">Skill Pathway Navigation:</strong>{' '}
              <span className="graph-helper-body">Click nodes or choose tracks to focus on prerequisites and view cohort analytics. Click the background to clear your active focus.</span>
            </span>
          </div>
        </div>



        {/* Right Column: Permanent Cohort Sidebar */}
        <div id="cohort-network-section" className="w-full lg:w-[33%] flex flex-col gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-900/[0.02] backdrop-blur-md shadow-xs relative z-20">
          <div className="flex flex-col gap-4 h-full">
            <div className="border-b border-slate-200/60 pb-3 flex items-center justify-between gap-2 relative">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Peer Career Pathways
                </h3>
                <p className="text-[9px] text-slate-505 dark:text-slate-400 font-medium leading-none">
                  Compare blueprints for {selectedSkillPath}
                </p>
              </div>
              <button
                onClick={() => setShowPeerPathwaysInfo(prev => !prev)}
                className="peer-pathways-help-trigger p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                title="Tiers explanation"
              >
                <HelpCircle className="h-3.5 w-3.5 pointer-events-none" />
              </button>

              {/* Tooltip Legend Overlay */}
              <AnimatePresence>
                {showPeerPathwaysInfo && (
                  <motion.div
                    ref={peerPathwaysTooltipRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-11 z-50 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed flex flex-col gap-2"
                  >
                    <div className="font-bold text-slate-850 dark:text-white uppercase tracking-wider text-[8px] border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between items-center">
                      <span>Cohort Legend</span>
                      <span className="text-[7.5px] font-normal lowercase text-slate-400 dark:text-slate-500">Tiers</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5 items-start">
                        <span className="px-1 py-0.2 text-[7px] font-black rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/50 uppercase shrink-0">Transitioned</span>
                        <span>Peer has successfully acquired all blueprint skills and completed transition.</span>
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <span className="px-1 py-0.2 text-[7px] font-black rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-150 dark:border-amber-900/50 uppercase shrink-0">Active</span>
                        <span>Peer is currently taking courses or learning milestones along this track.</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[7.5px] text-slate-450 dark:text-slate-500 py-1 border-t border-slate-100 dark:border-slate-800">
                        <span><strong>EXP:</strong> Experience</span>
                        <span>•</span>
                        <span><strong>GEO:</strong> Country</span>
                        <span>•</span>
                        <span><strong>SKILLS:</strong> Count</span>
                      </div>

                      <div className="flex flex-col gap-0.5 text-[8px] leading-normal text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                        <strong className="text-slate-700 dark:text-slate-300">Company Tiers (Tier 1-5):</strong>
                        <span>For strict privacy protection, exact employer names are anonymized and represented by industry classifications (e.g. Tier-1 Tech Giant, Tier-4 Startup).</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Path Statistics */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)] dark:shadow-none">
                <span className="text-[7.5px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono block mb-0.5">Success</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {cohortAnalysis.successRate}%
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)] dark:shadow-none">
                <span className="text-[7.5px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono block mb-0.5">Avg Time</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {(cohortAnalysis.avgMonthsToReach / 12).toFixed(1)} yr
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.01)] dark:shadow-none">
                <span className="text-[7.5px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono block mb-0.5">Profiles</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {cohortAnalysis.totalPeersMatched}
                </span>
              </div>
            </div>

            {/* UX IMPROVEMENT: PROFESSIONAL COUNTRY FILTER */}
            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800 p-3 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs dark:shadow-none">
              <div className="flex justify-between items-center">
                <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono block">Filter Cohort by Country</span>
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
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-350 dark:hover:border-slate-600 focus:border-blue-500 font-medium transition-colors"
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
                      className={`p-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.01)] dark:shadow-none ${isSelected
                        ? 'border-purple-500 bg-white dark:bg-slate-800 ring-2 ring-purple-500/10 dark:ring-purple-500/20'
                        : 'border-slate-200/60 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono font-bold text-[9.5px] text-purple-700">Candidate Trajectory #{cleanId}</span>
                        <span
                          className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${peer.reachedTarget
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
                          <span className={`px-1.5 py-0.5 rounded ${peer.skills.includes(selectedMapNode)
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
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
                  <div className="text-center p-6 text-slate-450 dark:text-slate-500 italic text-[11px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl">
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
                    className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300">Skill Gap Audit</span>
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
                                <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-150 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold">
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
                                <span key={s} className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-250 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[8px] font-bold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-emerald-600 font-bold">Closed trajectory gap!</span>
                          );
                        })()}
                      </div>

                      <div className="mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 text-[9.5px] leading-relaxed text-slate-600 dark:text-slate-400">
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
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-blue-650 dark:text-blue-400" />
                      <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Career Path Advisory</span>
                    </div>
                    {(() => {
                      const generalMissing = cohortAnalysis.topSkills
                        .filter(ts => !candidateSkills.includes(ts.skill))
                        .slice(0, 3);

                      return (
                        <div className="text-[9.5px] leading-relaxed text-slate-650 dark:text-slate-400 flex flex-col gap-2">
                          {generalMissing.length > 0 ? (
                            <p>
                              Successful candidates targeting <strong>{selectedSkillPath}</strong> frequently possess skills you are missing: <strong>{generalMissing.map(s => s.skill).join(', ')}</strong>.
                            </p>
                          ) : (
                            <p>
                              You possess all standard skills required for the <strong>{selectedSkillPath}</strong> role. Use the timeline to audit transition hazard risks.
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-[8px] font-bold text-blue-650 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
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
          </div>
        </div>
      </div>
    </div>
  );
}
