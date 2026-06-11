'use client';

import React, { useState, useMemo } from 'react';
import { useCareerEngine } from '../hooks/useCareerEngine';
import { CohortPeerSummary } from '../lib/careerEngine';
import { 
  Users, TrendingUp, Briefcase, Compass, Brain, Building2, MapPin, DollarSign, Calendar, BarChart3, Clock, Target, ShieldCheck
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// CohortInsights: Anonymized peer trajectories, statistics,
// company tier breakdown, and matched job openings.
// ──────────────────────────────────────────────────────────────

type TabId = 'overview' | 'peers' | 'jobs';

export default function CohortInsights() {
  const { cohortAnalysis, selectedSkillPath, candidateSkills } = useCareerEngine();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedPeer, setExpandedPeer] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [peersPage, setPeersPage] = useState(0);
  const PEERS_PER_PAGE = 12;

  if (!cohortAnalysis) {
    return (
      <div style={styles.emptyState}>
        <div style={{ ...styles.emptyIcon, color: '#64748b', display: 'flex', justifyContent: 'center' }}>
          <BarChart3 className="h-12 w-12" />
        </div>
        <h3 style={styles.emptyTitle}>Cohort Analysis Unavailable</h3>
        <p style={styles.emptyDesc}>
          Complete your onboarding and select a target career pathway to see
          anonymized peer trajectories, progression statistics, and job matches.
        </p>
      </div>
    );
  }

  const {
    targetRole,
    totalPeersMatched,
    successRate,
    avgMonthsToReach,
    medianMonthsToReach,
    topSkills,
    tierProgression,
    peerSummaries,
    matchedJobs
  } = cohortAnalysis;

  // Filter jobs by search
  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return matchedJobs;
    const q = jobSearch.toLowerCase();
    return matchedJobs.filter(
      j =>
        j.role.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(q))
    );
  }, [matchedJobs, jobSearch]);

  // Paginated peer summaries
  const pagedPeers = peerSummaries.slice(
    peersPage * PEERS_PER_PAGE,
    (peersPage + 1) * PEERS_PER_PAGE
  );
  const totalPeerPages = Math.ceil(peerSummaries.length / PEERS_PER_PAGE);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Statistics', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'peers', label: 'Peer Trajectories', icon: <Users className="h-4 w-4" />, count: peerSummaries.length },
    { id: 'jobs', label: 'Job Matches', icon: <Briefcase className="h-4 w-4" />, count: filteredJobs.length }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
              <Compass className="h-5 w-5" />
            </span>{' '}
            Cohort Career Intelligence
          </h2>
          <p style={styles.subtitle}>
            Analyzing <strong>{totalPeersMatched.toLocaleString()}</strong> anonymized peer profiles targeting{' '}
            <span style={styles.roleHighlight}>{targetRole}</span>
          </p>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.liveIndicator}>●</span> Live Analysis
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>{tab.icon}</span> {tab.label}
            {tab.count !== undefined && (
              <span style={styles.tabBadge}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ────────────── OVERVIEW TAB ────────────── */}
      {activeTab === 'overview' && (
        <div style={styles.tabContent}>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            <KpiCard
              label="Peers Matched"
              value={totalPeersMatched.toLocaleString()}
              icon={<Users className="h-5 w-5" />}
              color="#6366f1"
            />
            <KpiCard
              label="Success Rate"
              value={`${successRate}%`}
              icon={<Target className="h-5 w-5" />}
              color={successRate >= 60 ? '#10b981' : successRate >= 40 ? '#f59e0b' : '#ef4444'}
            />
            <KpiCard
              label="Avg Time to Target"
              value={`${Math.round(avgMonthsToReach / 12 * 10) / 10} yr`}
              subvalue={`${avgMonthsToReach} months`}
              icon={<Clock className="h-5 w-5" />}
              color="#3b82f6"
            />
            <KpiCard
              label="Median Time"
              value={`${Math.round(medianMonthsToReach / 12 * 10) / 10} yr`}
              subvalue={`${medianMonthsToReach} months`}
              icon={<BarChart3 className="h-5 w-5" />}
              color="#8b5cf6"
            />
          </div>

          {/* Skills Heatmap */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <Brain className="h-4 w-4" />
              </span>{' '}
              Top Skills Among Peers Who Reached Target
            </h3>
            <div style={styles.skillHeatmap}>
              {topSkills.map((s, idx) => {
                const userHas = candidateSkills.includes(s.skill);
                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.skillChip,
                      background: userHas
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))'
                        : `linear-gradient(135deg, rgba(99,102,241,${0.05 + s.percentage / 200}), rgba(99,102,241,0.04))`,
                      borderColor: userHas ? '#10b981' : `rgba(99,102,241,${0.2 + s.percentage / 300})`
                    }}
                  >
                    <span style={styles.skillName}>{s.skill}</span>
                    <span style={{
                      ...styles.skillPct,
                      color: userHas ? '#10b981' : '#a5b4fc'
                    }}>
                      {s.percentage}%
                    </span>
                    {userHas && <span style={styles.skillMatch}>✓ You</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Progression */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Building2 className="h-4 w-4" />
              </span>{' '}
              Company Tier Progression
            </h3>
            <div style={styles.tierGrid}>
              {tierProgression.map((t, idx) => (
                <div key={idx} style={styles.tierCard}>
                  <div style={styles.tierLabel}>{t.tier}</div>
                  <div style={styles.tierBar}>
                    <div
                      style={{
                        ...styles.tierBarFill,
                        width: `${Math.min(100, (t.count / totalPeersMatched) * 100)}%`
                      }}
                    />
                  </div>
                  <div style={styles.tierMeta}>
                    <span>{t.count} peers</span>
                    <span>Avg {t.avgDurationMonths}m tenure</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────── PEERS TAB ────────────── */}
      {activeTab === 'peers' && (
        <div style={styles.tabContent}>
          <p style={styles.peerDisclaimer}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 6, verticalAlign: 'middle', color: '#a5b4fc' }}>
              <ShieldCheck className="h-4 w-4 inline" />
            </span>{' '}
            All profiles are fully anonymized. Company names are replaced with tier classifications.
            No personally identifiable information is displayed.
          </p>
          <div style={styles.peerGrid}>
            {pagedPeers.map(peer => (
              <PeerCard
                key={peer.id}
                peer={peer}
                expanded={expandedPeer === peer.id}
                onToggle={() =>
                  setExpandedPeer(expandedPeer === peer.id ? null : peer.id)
                }
              />
            ))}
          </div>
          {totalPeerPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: peersPage === 0 ? 0.4 : 1
                }}
                disabled={peersPage === 0}
                onClick={() => setPeersPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={styles.pageInfo}>
                Page {peersPage + 1} of {totalPeerPages}
              </span>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: peersPage >= totalPeerPages - 1 ? 0.4 : 1
                }}
                disabled={peersPage >= totalPeerPages - 1}
                onClick={() => setPeersPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────── JOBS TAB ────────────── */}
      {activeTab === 'jobs' && (
        <div style={styles.tabContent}>
          <div style={styles.jobSearchWrap}>
            <input
              type="text"
              placeholder="Search roles, companies, skills..."
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              style={styles.jobSearchInput}
            />
          </div>
          <div style={styles.jobGrid}>
            {filteredJobs.slice(0, 30).map(job => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <div>
                    <h4 style={styles.jobRole}>{job.role}</h4>
                    <p style={styles.jobCompany}>{job.company}</p>
                  </div>
                  <div style={{
                    ...styles.matchBadge,
                    background: job.matchPercentage >= 70
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : job.matchPercentage >= 40
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  }}>
                    {job.matchPercentage}% match
                  </div>
                </div>
                <div style={styles.jobMeta}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPin className="h-3 w-3 text-slate-400" /> {job.location}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <DollarSign className="h-3 w-3 text-slate-400" /> {job.salary}
                  </span>
                </div>
                <p style={styles.jobDesc}>{job.description}</p>
                <div style={styles.jobSkills}>
                  {job.requiredSkills.map((sk, i) => {
                    const has = candidateSkills.includes(sk);
                    return (
                      <span
                        key={i}
                        style={{
                          ...styles.jobSkillTag,
                          background: has ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                          borderColor: has ? '#10b981' : 'rgba(255,255,255,0.1)',
                          color: has ? '#6ee7b7' : '#94a3b8'
                        }}
                      >
                        {sk}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                No jobs match your search. Try different keywords.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────

function KpiCard({
  label,
  value,
  subvalue,
  icon,
  color
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div style={{ ...styles.kpiCard, borderColor: color + '44' }}>
      <div style={{ ...styles.kpiIcon, background: color + '22', color }}>{icon}</div>
      <div>
        <div style={{ ...styles.kpiValue, color }}>{value}</div>
        <div style={styles.kpiLabel}>{label}</div>
        {subvalue && <div style={styles.kpiSub}>{subvalue}</div>}
      </div>
    </div>
  );
}

function PeerCard({
  peer,
  expanded,
  onToggle
}: {
  peer: CohortPeerSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={styles.peerCard} onClick={onToggle}>
      <div style={styles.peerHeader}>
        <div>
          <span style={styles.peerId}>{peer.id}</span>
          <span style={{
            ...styles.peerStatus,
            background: peer.reachedTarget ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: peer.reachedTarget ? '#6ee7b7' : '#fca5a5'
          }}>
            {peer.reachedTarget ? '✓ Reached Target' : '◯ In Progress'}
          </span>
        </div>
        <span style={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
      </div>
      <div style={styles.peerMeta}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Target className="h-3 w-3 text-slate-400" /> {peer.targetRole}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MapPin className="h-3 w-3 text-slate-400" /> {peer.geo}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Calendar className="h-3 w-3 text-slate-400" /> {Math.round(peer.totalExperienceMonths / 12 * 10) / 10} yr exp
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Brain className="h-3 w-3 text-slate-400" /> {peer.skillCount} skills
        </span>
      </div>
      {expanded && (
        <div style={styles.peerTimeline}>
          <h5 style={styles.timelineTitle}>Career Progression</h5>
          {peer.pathSteps.map((step, idx) => (
            <div key={idx} style={styles.timelineStep}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineLabel}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────
// STYLES
// ────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    minHeight: '100%'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 0 6px 0'
  },
  titleIcon: { fontSize: 20 },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0
  },
  roleHighlight: {
    color: '#a5b4fc',
    fontWeight: 600
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#10b981',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 20,
    padding: '4px 12px',
    whiteSpace: 'nowrap' as const
  },
  liveIndicator: {
    fontSize: 8,
    animation: 'pulse 2s infinite'
  },

  // Tab Bar
  tabBar: {
    display: 'flex',
    gap: 4,
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabActive: {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
    color: '#e2e8f0',
    boxShadow: '0 0 12px rgba(99,102,241,0.15)'
  },
  tabBadge: {
    fontSize: 10,
    background: 'rgba(99,102,241,0.3)',
    color: '#c7d2fe',
    borderRadius: 10,
    padding: '1px 7px',
    fontWeight: 600
  },

  tabContent: {
    animation: 'fadeIn 0.3s ease'
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 24
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 18px',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 14,
    transition: 'border-color 0.3s'
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
    marginTop: 2
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1
  },

  // Sections
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14
  },

  // Skill Heatmap
  skillHeatmap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8
  },
  skillChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 12,
    transition: 'all 0.2s'
  },
  skillName: {
    color: '#e2e8f0',
    fontWeight: 500
  },
  skillPct: {
    fontSize: 10,
    fontWeight: 700
  },
  skillMatch: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: 700,
    background: 'rgba(16,185,129,0.1)',
    padding: '1px 5px',
    borderRadius: 4
  },

  // Tier Progression
  tierGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10
  },
  tierCard: {
    padding: '12px 16px',
    background: 'rgba(15,23,42,0.5)',
    border: '1px solid rgba(99,102,241,0.08)',
    borderRadius: 10
  },
  tierLabel: {
    fontSize: 12,
    color: '#c7d2fe',
    fontWeight: 600,
    marginBottom: 6
  },
  tierBar: {
    height: 6,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 4
  },
  tierBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    borderRadius: 3,
    transition: 'width 0.8s ease'
  },
  tierMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#64748b'
  },

  // Peers
  peerDisclaimer: {
    fontSize: 11,
    color: '#94a3b8',
    background: 'rgba(99,102,241,0.06)',
    border: '1px solid rgba(99,102,241,0.1)',
    borderRadius: 8,
    padding: '8px 14px',
    marginBottom: 16,
    lineHeight: 1.5
  },
  peerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 10
  },
  peerCard: {
    padding: '14px 16px',
    background: 'rgba(15,23,42,0.5)',
    border: '1px solid rgba(99,102,241,0.1)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  peerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  peerId: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
    marginRight: 8
  },
  peerStatus: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10
  },
  expandIcon: {
    fontSize: 10,
    color: '#64748b'
  },
  peerMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    fontSize: 11,
    color: '#94a3b8'
  },
  peerTimeline: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(99,102,241,0.1)'
  },
  timelineTitle: {
    fontSize: 11,
    color: '#a5b4fc',
    fontWeight: 600,
    marginBottom: 8,
    margin: '0 0 8px 0'
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#6366f1',
    flexShrink: 0
  },
  timelineLabel: {
    fontSize: 11,
    color: '#cbd5e1'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(99,102,241,0.08)'
  },
  pageBtn: {
    padding: '6px 16px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8,
    color: '#c7d2fe',
    fontSize: 12,
    cursor: 'pointer'
  },
  pageInfo: {
    fontSize: 12,
    color: '#64748b'
  },

  // Jobs
  jobSearchWrap: {
    marginBottom: 16
  },
  jobSearchInput: {
    width: '100%',
    padding: '10px 16px',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 12
  },
  jobCard: {
    padding: '16px 18px',
    background: 'rgba(15,23,42,0.5)',
    border: '1px solid rgba(99,102,241,0.1)',
    borderRadius: 14,
    transition: 'border-color 0.2s'
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  jobRole: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f1f5f9',
    margin: '0 0 2px 0'
  },
  jobCompany: {
    fontSize: 11,
    color: '#94a3b8',
    margin: 0
  },
  matchBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 12,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0
  },
  jobMeta: {
    display: 'flex',
    gap: 16,
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8
  },
  jobDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.5,
    marginBottom: 10
  },
  jobSkills: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4
  },
  jobSkillTag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid',
    fontWeight: 500
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    maxWidth: 400,
    lineHeight: 1.6
  }
};
