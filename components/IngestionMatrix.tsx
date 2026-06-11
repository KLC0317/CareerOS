'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { RAW_RESUME_CHUNKS } from '../lib/mockData';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Eye, Edit3, Check, Calendar, Briefcase, Award, GraduationCap, Plus, Trash } from 'lucide-react';
import { SKILL_DAG } from '../lib/careerEngine';

export default function IngestionMatrix() {
  const {
    candidateNodes,
    updateNode,
    addNode,
    deleteNode,
    hoveredSchemaId,
    setHoveredSchemaId
  } = useCareerEngine();

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Map between chunk ID and node ID
  const chunkToNodeMap: Record<string, string> = {
    'chunk-2': 'node-grab',
    'chunk-3': 'node-sabbatical',
    'chunk-4': 'node-petronas',
    'chunk-5': 'node-education'
  };

  const nodeToChunkMap: Record<string, string> = {
    'node-grab': 'chunk-2',
    'node-sabbatical': 'chunk-3',
    'node-petronas': 'chunk-4',
    'node-education': 'chunk-5'
  };

  // Re-calculate connection line coordinates based on hover state
  useEffect(() => {
    if (!hoveredSchemaId || !containerRef.current) {
      setLineCoords(null);
      return;
    }

    const chunkId = nodeToChunkMap[hoveredSchemaId] || hoveredSchemaId;
    const nodeId = chunkToNodeMap[chunkId] || hoveredSchemaId;

    const leftEl = leftRefs.current[chunkId];
    const rightEl = rightRefs.current[nodeId];

    if (!leftEl || !rightEl) {
      setLineCoords(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();

    const x1 = leftRect.right - containerRect.left;
    const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;

    const x2 = rightRect.left - containerRect.left;
    const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

    setLineCoords({ x1, y1, x2, y2 });
  }, [hoveredSchemaId]);

  const availableSkillNames = Object.keys(SKILL_DAG);

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Transparent Ingestion Matrix</h2>
        </div>
        <p className="text-xs text-slate-500">
          Auditable parsing parser layer. Overwrite parsed values or dates on the right to immediately recalculate the Semi-Markov transition hazard.
        </p>
      </div>

      {/* Grid Canvas for connection drawing */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        
        {/* Connection Line Overlay */}
        {lineCoords && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 hidden lg:block">
            <defs>
              <linearGradient id="connector-gradient-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
              </linearGradient>
              <filter id="shadow-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.2"/>
              </filter>
            </defs>
            <path
              d={`M ${lineCoords.x1} ${lineCoords.y1} C ${(lineCoords.x1 + lineCoords.x2) / 2} ${lineCoords.y1}, ${(lineCoords.x1 + lineCoords.x2) / 2} ${lineCoords.y2}, ${lineCoords.x2} ${lineCoords.y2}`}
              stroke="url(#connector-gradient-light)"
              strokeWidth="2.5"
              fill="none"
              filter="url(#shadow-glow)"
              strokeDasharray="4 2"
              className="animate-[dash_20s_linear_infinite]"
            />
            <circle cx={lineCoords.x1} cy={lineCoords.y1} r="4" fill="#2563eb" />
            <circle cx={lineCoords.x2} cy={lineCoords.y2} r="4" fill="#14b8a6" />
          </svg>
        )}

        {/* LEFT COLUMN: RAW TEXT CHUNKS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Raw Unstructured Text Chunks</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 flex items-center gap-1 font-mono">
              <Eye className="h-3 w-3" /> Parser Input
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {RAW_RESUME_CHUNKS.map((chunk) => {
              const linkedNodeId = chunkToNodeMap[chunk.id];
              const isHovered = hoveredSchemaId === chunk.id || (linkedNodeId && hoveredSchemaId === linkedNodeId);
              
              // Custom bg for light theme highlights
              let chunkBg = 'bg-white border-slate-200 text-slate-650';
              if (isHovered) {
                if (chunk.id === 'chunk-1') chunkBg = 'border-blue-500 bg-blue-50/60 text-slate-800 shadow-xs';
                else if (chunk.id === 'chunk-2') chunkBg = 'border-emerald-500 bg-emerald-50/60 text-slate-800 shadow-xs';
                else if (chunk.id === 'chunk-3') chunkBg = 'border-amber-500 bg-amber-50/60 text-slate-800 shadow-xs';
                else if (chunk.id === 'chunk-4') chunkBg = 'border-purple-500 bg-purple-50/60 text-slate-800 shadow-xs';
                else chunkBg = 'border-pink-500 bg-pink-50/60 text-slate-800 shadow-xs';
              }
              
              return (
                <div
                  key={chunk.id}
                  ref={(el) => { leftRefs.current[chunk.id] = el; }}
                  onMouseEnter={() => setHoveredSchemaId(chunk.id)}
                  onMouseLeave={() => setHoveredSchemaId(null)}
                  className={`p-4 rounded-xl border text-xs leading-relaxed transition-all duration-300 ${chunkBg}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2 w-2 rounded-full ${
                      chunk.id === 'chunk-1' ? 'bg-blue-650' :
                      chunk.id === 'chunk-2' ? 'bg-emerald-600' :
                      chunk.id === 'chunk-3' ? 'bg-amber-600' :
                      chunk.id === 'chunk-4' ? 'bg-purple-600' : 'bg-pink-600'
                    }`}></span>
                    <h4 className="font-bold text-slate-800">{chunk.title}</h4>
                  </div>
                  <p>{chunk.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: STRUCTURAL SCHEMA OVERRIDES */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Structured State Overrides</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 flex items-center gap-1 font-mono">
              <Edit3 className="h-3 w-3" /> Recalculator Engine
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {candidateNodes.map((node) => {
              const linkedChunkId = nodeToChunkMap[node.id];
              const isHovered = hoveredSchemaId === node.id || (linkedChunkId && hoveredSchemaId === linkedChunkId);

              const handleFieldChange = (field: keyof typeof node, value: any) => {
                updateNode(node.id, { [field]: value });
              };

              const handleAddSkill = () => {
                const updatedSkills = [...node.skills, { name: availableSkillNames[0], level: 'Rank-1' as const }];
                updateNode(node.id, { skills: updatedSkills });
              };

              const handleRemoveSkill = (index: number) => {
                const updatedSkills = node.skills.filter((_, idx) => idx !== index);
                updateNode(node.id, { skills: updatedSkills });
              };

              const handleUpdateSkill = (index: number, skillName: string, level?: 'Rank-1' | 'Rank-2' | 'Rank-3') => {
                const updatedSkills = node.skills.map((s, idx) => {
                  if (idx === index) {
                    return {
                      name: skillName,
                      level: level || s.level
                    };
                  }
                  return s;
                });
                updateNode(node.id, { skills: updatedSkills });
              };

              return (
                <div
                  key={node.id}
                  ref={(el) => { rightRefs.current[node.id] = el; }}
                  onMouseEnter={() => setHoveredSchemaId(node.id)}
                  onMouseLeave={() => setHoveredSchemaId(null)}
                  className={`p-4 rounded-xl border bg-white transition-all duration-300 relative ${
                    isHovered
                      ? 'border-blue-500 ring-2 ring-blue-500/5 shadow-md scale-[1.01]'
                      : 'border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <button
                    onClick={() => deleteNode(node.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Delete milestone"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    {node.type === 'employment' && <Briefcase className="h-4 w-4 text-emerald-600" />}
                    {node.type === 'sabbatical' && <Award className="h-4 w-4 text-amber-600" />}
                    {node.type === 'academic' && <GraduationCap className="h-4 w-4 text-pink-600" />}
                    {node.type === 'project' && <Briefcase className="h-4 w-4 text-blue-600" />}
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-50 border border-slate-200 text-slate-600 capitalize">
                      {node.type}
                    </span>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                        Role / Title
                      </label>
                      <input
                        type="text"
                        value={node.role}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={node.organization}
                        onChange={(e) => handleFieldChange('organization', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                        Start Date (YYYY-MM)
                      </label>
                      <input
                        type="text"
                        value={node.startDate}
                        placeholder="e.g. 2024-01"
                        onChange={(e) => handleFieldChange('startDate', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                        End Date (YYYY-MM or Present)
                      </label>
                      <input
                        type="text"
                        value={node.endDate}
                        placeholder="e.g. Present"
                        onChange={(e) => handleFieldChange('endDate', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                        Mapped Skills DAG Nodes
                      </label>
                      <button
                        onClick={handleAddSkill}
                        className="text-[10px] text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Skill
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {node.skills.map((skill, idx) => (
                        <div
                          key={`${node.id}-skill-${idx}`}
                          className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md pl-2 pr-1 py-1 text-[11px]"
                        >
                          <select
                            value={skill.name}
                            onChange={(e) => handleUpdateSkill(idx, e.target.value)}
                            className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer pr-1"
                          >
                            {availableSkillNames.map((sName) => (
                              <option key={sName} value={sName} className="bg-white text-slate-855">
                                {sName}
                              </option>
                            ))}
                          </select>
                          <select
                            value={skill.level}
                            onChange={(e) =>
                              handleUpdateSkill(
                                idx,
                                skill.name,
                                e.target.value as 'Rank-1' | 'Rank-2' | 'Rank-3'
                              )
                            }
                            className="bg-transparent text-teal-600 font-bold focus:outline-none cursor-pointer px-1 border-l border-slate-200"
                          >
                            <option value="Rank-1" className="bg-white text-slate-700 font-semibold">R1</option>
                            <option value="Rank-2" className="bg-white text-slate-700 font-semibold">R2</option>
                            <option value="Rank-3" className="bg-white text-slate-700 font-semibold">R3</option>
                          </select>
                          <button
                            onClick={() => handleRemoveSkill(idx)}
                            className="text-slate-400 hover:text-rose-500 font-black ml-1.5 px-0.5 cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              variant="secondary"
              onClick={() =>
                addNode({
                  role: 'New Role',
                  organization: 'Organization',
                  type: 'employment',
                  startDate: '2025-01',
                  endDate: 'Present',
                  description: 'Brief description of the milestone...',
                  skills: []
                })
              }
              className="mt-2 py-2.5 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-500 hover:text-slate-700"
            >
              <Plus className="h-4 w-4" /> Add New Milestone Node
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
