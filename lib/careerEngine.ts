// Career OS Core Mathematical & Mock Logic Engine
// Implements:
// 1. The Temporal Knowledge Graph (TKG) structures and skill dependency traversals.
// 2. The Step Semi-Markov Process (SSMP) hazard rate models.

export interface SkillNode {
  name: string;
  level: 'Rank-1' | 'Rank-2' | 'Rank-3';
}

export interface CareerNode {
  id: string;
  role: string;
  organization: string;
  type: 'employment' | 'sabbatical' | 'academic' | 'project';
  startDate: string; // YYYY-MM
  endDate: string;   // YYYY-MM or "Present"
  description: string;
  skills: SkillNode[];
  // Metadata for densified sabbaticals
  sabbaticalSkills?: string[];
  achievements?: string[];
}

export interface SkillDAGNode {
  name: string;
  rank: 0 | 1 | 2 | 3;
  prerequisites: string[];
}

// Explicit Skill DAG definition
export const SKILL_DAG: Record<string, SkillDAGNode> = {
  // AI Architect Track
  'AI Architect': { name: 'AI Architect', rank: 3, prerequisites: ['Deep Learning', 'System Architecture'] },
  'Deep Learning': { name: 'Deep Learning', rank: 2, prerequisites: ['PyTorch', 'Linear Algebra'] },
  'System Architecture': { name: 'System Architecture', rank: 2, prerequisites: ['Distributed Systems', 'Cloud Computing'] },
  'PyTorch': { name: 'PyTorch', rank: 1, prerequisites: ['Python'] },
  'Distributed Systems': { name: 'Distributed Systems', rank: 1, prerequisites: ['Linux', 'Computer Networking'] },
  'Cloud Computing': { name: 'Cloud Computing', rank: 1, prerequisites: ['Linux'] },
  'Python': { name: 'Python', rank: 0, prerequisites: [] },
  'Linear Algebra': { name: 'Linear Algebra', rank: 0, prerequisites: [] },
  'Linux': { name: 'Linux', rank: 0, prerequisites: [] },
  'Computer Networking': { name: 'Computer Networking', rank: 0, prerequisites: [] },

  // Frontend Architect Track
  'Frontend Architect': { name: 'Frontend Architect', rank: 3, prerequisites: ['Advanced React', 'Performance Tuning'] },
  'Advanced React': { name: 'Advanced React', rank: 2, prerequisites: ['State Management', 'TypeScript'] },
  'Performance Tuning': { name: 'Performance Tuning', rank: 2, prerequisites: ['Browser Engines', 'Web Performance'] },
  'State Management': { name: 'State Management', rank: 1, prerequisites: ['JavaScript'] },
  'Browser Engines': { name: 'Browser Engines', rank: 1, prerequisites: ['JavaScript'] },
  'Web Performance': { name: 'Web Performance', rank: 1, prerequisites: ['HTML/CSS'] },
  'TypeScript': { name: 'TypeScript', rank: 1, prerequisites: ['JavaScript'] },
  'JavaScript': { name: 'JavaScript', rank: 0, prerequisites: [] },
  'HTML/CSS': { name: 'HTML/CSS', rank: 0, prerequisites: [] },

  // Engineering Director Track
  'Engineering Director': { name: 'Engineering Director', rank: 3, prerequisites: ['Technical Leadership', 'Product Strategy'] },
  'Technical Leadership': { name: 'Technical Leadership', rank: 2, prerequisites: ['Agile Delivery', 'System Design'] },
  'Product Strategy': { name: 'Product Strategy', rank: 2, prerequisites: ['Agile Delivery', 'Market Analysis'] },
  'Agile Delivery': { name: 'Agile Delivery', rank: 1, prerequisites: ['Communication'] },
  'System Design': { name: 'System Design', rank: 1, prerequisites: ['Software Engineering'] },
  'Market Analysis': { name: 'Market Analysis', rank: 1, prerequisites: ['Communication'] },
  'Communication': { name: 'Communication', rank: 0, prerequisites: [] },
  'Software Engineering': { name: 'Software Engineering', rank: 0, prerequisites: [] }
};

// Breadth-first search to get all pre-requisites recursively
export function getPreRequisitesRecursive(skillName: string): string[] {
  const visited = new Set<string>();
  const queue: string[] = [skillName];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const dagNode = SKILL_DAG[current];
    if (dagNode) {
      for (const prereq of dagNode.prerequisites) {
        if (!visited.has(prereq)) {
          visited.add(prereq);
          queue.push(prereq);
        }
      }
    }
  }
  
  return Array.from(visited);
}

// Check what prerequisites are met based on candidate's skills
export function verifyPrerequisites(candidateSkills: string[], targetSkill: string) {
  const required = getPreRequisitesRecursive(targetSkill);
  if (SKILL_DAG[targetSkill]) {
    required.unshift(targetSkill); // include the skill itself
  }
  
  const met = required.filter(skill => candidateSkills.includes(skill));
  const missing = required.filter(skill => !candidateSkills.includes(skill));
  
  return {
    required,
    met,
    missing,
    percentage: required.length > 0 ? (met.length / required.length) * 100 : 100
  };
}

export interface JobPosting {
  id: string;
  role: string;
  company: string;
  location: string;
  salary: string;
  requiredSkills: string[];
  baseTransitionRate: number; // baseline hazard lambda_0
  description: string;
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experienceLevel?: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  workMode?: 'On-site' | 'Hybrid' | 'Remote';
  createdAt?: string; // ISO date string
}

export interface HazardResult {
  hazardRate: number; // lambda(t)
  baselineHazard: number; // lambda_0(t)
  transitionProbability: number; // P(Transition)
  factors: {
    label: string;
    effect: number; // e.g. +0.25 (which means e^0.25 = +28%)
    description: string;
  }[];
}

// Calculate the Step Semi-Markov Process (SSMP) Hazard Rate and Transition Probabilities
// Formula: lambda(t) = lambda_0(t) * exp(beta * X)
export function calculateHazardRate(
  tenureMonths: number,
  candidateSkills: string[],
  targetRoleSkills: string[],
  educationMatch: boolean = true,
  continuousTrack: boolean = true
): HazardResult {
  // 1. Baseline Hazard rate lambda_0(t) - non-linear curve peaking at 18-36 months (centered around 24)
  // We model this as a lognormal-like curve:
  // lambda_0(t) = 0.08 * exp( - (ln(t) - ln(24))^2 / (2 * 0.4^2) )
  const t = Math.max(1, tenureMonths);
  const mu = Math.log(24);
  const sigma = 0.45;
  const baselineHazard = 0.07 * Math.exp(-Math.pow(Math.log(t) - mu, 2) / (2 * Math.pow(sigma, 2)));

  // 2. Covariates X and weights beta
  const factors: HazardResult['factors'] = [];

  let betaSum = 0;

  // A. Skill Match Score (X_skills: percentage of target skills met)
  const skillMatch = verifyPrerequisites(candidateSkills, targetRoleSkills[0] || '');
  const skillMatchScore = skillMatch.percentage / 100; // 0 to 1
  const betaSkills = 0.8;
  const skillEffect = betaSkills * skillMatchScore;
  betaSum += skillEffect;
  factors.push({
    label: 'Skill Pre-requisites Match',
    effect: Math.round((Math.exp(skillEffect) - 1) * 100),
    description: `Possess ${skillMatch.met.length}/${skillMatch.required.length} skills in target path (+${Math.round(skillMatchScore * 100)}% coverage)`
  });

  // B. Has Rank-3 (highest rank) skill in candidates list increases transition rate by 25% (beta = 0.223)
  const hasRank3 = candidateSkills.some(s => SKILL_DAG[s]?.rank === 3);
  if (hasRank3) {
    const betaRank3 = 0.223;
    betaSum += betaRank3;
    factors.push({
      label: 'Rank-3 Skill Leadership',
      effect: 25,
      description: 'Possess a senior Rank-3 expert certification or skill in trajectory'
    });
  }

  // C. Educational background match (X_edu: boolean)
  if (educationMatch) {
    const betaEdu = 0.15;
    betaSum += betaEdu;
    factors.push({
      label: 'Academic Track Alignment',
      effect: 16, // e^0.15 - 1
      description: 'Degree or formal credentials align with target sector'
    });
  } else {
    const betaEdu = -0.2;
    betaSum += betaEdu;
    factors.push({
      label: 'Academic Divergence',
      effect: -18, // e^-0.2 - 1
      description: 'Formal academic background lies outside target technical domain'
    });
  }

  // D. Continuous track (X_track: boolean, working with minimal career gaps)
  if (continuousTrack) {
    const betaTrack = 0.1;
    betaSum += betaTrack;
    factors.push({
      label: 'Continuous Track Compound',
      effect: 10, // e^0.1 - 1
      description: 'Minimal temporal gaps between successive role milestones'
    });
  } else {
    const betaTrack = -0.15;
    betaSum += betaTrack;
    factors.push({
      label: 'Career Re-entry Friction',
      effect: -14, // e^-0.15 - 1
      description: 'Active transition/sabbatical phase reduces baseline hazard rate'
    });
  }

  // Calculate Hazard Rate lambda(t)
  const multiplier = Math.exp(betaSum);
  const hazardRate = baselineHazard * multiplier;

  // Transition probability in next 3 months (representing a planning quarter)
  // P(Transition in next 3 months) = 1 - exp(-3 * lambda(t))
  const transitionProbability = 1 - Math.exp(-3 * hazardRate);

  return {
    hazardRate,
    baselineHazard,
    transitionProbability,
    factors
  };
}

export interface ChurnPrediction {
  employeeId: string;
  name: string;
  role: string;
  tenureMonths: number;
  skills: string[];
  churnProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  hazardCurve: { months: number; rate: number }[];
}

// Calculate employee retention / churn signals
export function predictEmployeeChurn(
  tenureMonths: number,
  skills: string[],
  careerPathSkills: string[]
): ChurnPrediction {
  // Churn is modeled as a hazard transition away from current role.
  // High transition pressure means high churn risk if not promoted/transitioned inside the company.
  // Tenure peaks at 18-36 months.
  const hazardData = calculateHazardRate(tenureMonths, skills, careerPathSkills, true, true);
  const churnProb = 1 - Math.exp(-6 * hazardData.hazardRate); // 6-month churn probability

  let riskLevel: ChurnPrediction['riskLevel'] = 'Low';
  if (churnProb > 0.45) riskLevel = 'High';
  else if (churnProb > 0.25) riskLevel = 'Medium';

  // Generate 48-month hazard curve data for charting
  const hazardCurve = Array.from({ length: 49 }, (_, i) => {
    const rateData = calculateHazardRate(i, skills, careerPathSkills, true, true);
    return {
      months: i,
      rate: rateData.hazardRate
    };
  });

  return {
    employeeId: '', // set in caller
    name: '',
    role: '',
    tenureMonths,
    skills,
    churnProbability: churnProb,
    riskLevel,
    hazardCurve
  };
}

export interface MarketAnalysis {
  geo: string;
  marketDemand: string;
  justification: string;
}

export interface RecommendedRoleOption {
  role: string;
  justification: string;
}

export interface ParsedResult {
  nodes: CareerNode[];
  recommendedRole: string;
  recommendedRoles?: RecommendedRoleOption[];
  detectedSkills: string[];
  marketAnalysis?: MarketAnalysis;
}

export function analyzeResumeText(text: string): ParsedResult {
  const normalizedText = text.toLowerCase();
  
  // 1. Gather all skills in SKILL_DAG
  const availableSkills = Object.keys(SKILL_DAG);
  const detectedSkills = availableSkills.filter(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  });

  // Calculate scores for tracks
  const aiSkillsList = ['AI Architect', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems', 'Cloud Computing', 'Python', 'Linear Algebra', 'Linux', 'Computer Networking'];
  const feSkillsList = ['Frontend Architect', 'Advanced React', 'Performance Tuning', 'State Management', 'Browser Engines', 'Web Performance', 'TypeScript', 'JavaScript', 'HTML/CSS'];
  const mgtSkillsList = ['Engineering Director', 'Technical Leadership', 'Product Strategy', 'Agile Delivery', 'System Design', 'Market Analysis', 'Communication', 'Software Engineering'];

  let aiScore = 0;
  let feScore = 0;
  let mgtScore = 0;

  detectedSkills.forEach(s => {
    if (aiSkillsList.includes(s)) aiScore += 2;
    if (feSkillsList.includes(s)) feScore += 2;
    if (mgtSkillsList.includes(s)) mgtScore += 2;
  });

  const aiKeywords = ['ai', 'deep learning', 'machine learning', 'pytorch', 'model', 'neural', 'vision', 'nlp', 'prediction', 'analytics', 'data science'];
  const feKeywords = ['react', 'frontend', 'web', 'ui', 'ux', 'css', 'html', 'javascript', 'typescript', 'browser', 'vue', 'angular', 'tailwind', 'sass', 'responsive'];
  const mgtKeywords = ['manager', 'director', 'lead', 'agile', 'scrum', 'product', 'project', 'management', 'team', 'people', 'scrummaster', 'delivery', 'leadership'];

  aiKeywords.forEach(kw => {
    if (normalizedText.includes(kw)) aiScore += 1;
  });
  feKeywords.forEach(kw => {
    if (normalizedText.includes(kw)) feScore += 1;
  });
  mgtKeywords.forEach(kw => {
    if (normalizedText.includes(kw)) mgtScore += 1;
  });

  let recommendedRole = 'AI Architect';
  if (feScore > aiScore && feScore > mgtScore) {
    recommendedRole = 'Frontend Architect';
  } else if (mgtScore > aiScore && mgtScore > feScore) {
    recommendedRole = 'Engineering Director';
  }

  const nodes: CareerNode[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Date ranges regex matching formats like:
  // Jan 2022 - Jun 2024, 2022-01 to Present, 2022 - 2024, Jan 2022 to Present, etc.
  const dateRangeRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,./-]*\d{4}|\d{4}[\s,./-]*\d{2}|\b\d{4}\b)[\s,./-]*(?:to|and|-|–|—)[\s,./-]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,./-]*\d{4}|\d{4}[\s,./-]*\d{2}|\b\d{4}\b|\bPresent\b|\bCurrent\b)/i;
  const INVALID_ORG_WORDS = ['date', 'dates', 'period', 'timeline', 'year', 'years', 'duration', 'time', 'when', 'from', 'to'];
  const ROLE_KEYWORDS = [
    'engineer', 'developer', 'architect', 'designer', 'manager', 'director', 'lead',
    'specialist', 'consultant', 'analyst', 'administrator', 'officer', 'intern',
    'scientist', 'researcher', 'programmer', 'expert', 'head', 'vp', 'cto', 'ceo',
    'bachelor', 'b.sc', 'b.s', 'master', 'm.sc', 'm.s', 'ph.d', 'phd', 'doctor',
    'associate', 'diploma', 'graduate', 'student', 'fellow', 'founder', 'co-founder'
  ];

  const isRoleOrDegree = (str: string): boolean => {
    const lower = str.toLowerCase();
    return ROLE_KEYWORDS.some(kw => lower.includes(kw));
  };

  const parseDateString = (str: string): string => {
    if (!str) return '2024-01';
    const clean = str.trim().toLowerCase();
    if (clean.includes('present') || clean.includes('current') || clean.includes('now')) {
      return 'Present';
    }
    const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : '2024';
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    for (let i = 0; i < months.length; i++) {
      if (clean.includes(months[i])) {
        const monthNum = String(i + 1).padStart(2, '0');
        return `${year}-${monthNum}`;
      }
    }
    
    const yyyymm = clean.match(/\b\d{4}-\d{2}\b/);
    if (yyyymm) return yyyymm[0];
    
    return `${year}-01`;
  };

  const milestoneIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (dateRangeRegex.test(lines[i])) {
      milestoneIndices.push(i);
    }
  }

  if (milestoneIndices.length > 0) {
    for (let idx = 0; idx < milestoneIndices.length; idx++) {
      const lineIdx = milestoneIndices[idx];
      const currentLine = lines[lineIdx];
      
      const dateMatch = currentLine.match(dateRangeRegex);
      if (!dateMatch) continue;
      
      const startDate = parseDateString(dateMatch[1]);
      const endDate = parseDateString(dateMatch[2]);

      let headerText = currentLine.replace(dateRangeRegex, '').trim();
      headerText = headerText.replace(/^[\s,.:;•/|()\-–—\[\]]+|[\s,.:;•/|()\-–—\[\]]+$/g, '').trim();

      const cleanHeaderLower = headerText.toLowerCase().replace(/[^a-z]/g, '');
      if (headerText.length < 3 || INVALID_ORG_WORDS.includes(cleanHeaderLower)) {
        headerText = '';
      }

      if (!headerText && lineIdx > 0) {
        headerText = lines[lineIdx - 1];
        if (headerText.length < 5 && lineIdx > 1) {
          headerText = lines[lineIdx - 2] + ' ' + headerText;
        }
      }

      let role = '';
      let organization = '';

      const separators = [/\s+at\s+/i, /\s+@\s+/, /\s*\|\s*/, /\s*–\s*/, /\s*—\s*/, /\s*-\s*/, /,\s*/];
      let splitDone = false;
      for (const sep of separators) {
        if (sep.test(headerText)) {
          const parts = headerText.split(sep).map(p => p.trim()).filter(p => p.length > 0);
          if (parts.length >= 2) {
            const part0Role = isRoleOrDegree(parts[0]);
            const part1Role = isRoleOrDegree(parts[1]);
            
            if (part0Role && !part1Role) {
              role = parts[0];
              organization = parts[1];
            } else if (part1Role && !part0Role) {
              role = parts[1];
              organization = parts[0];
            } else {
              role = parts[0];
              organization = parts[1];
            }
            splitDone = true;
            break;
          }
        }
      }

      if (!splitDone || !role || !organization) {
        if (isRoleOrDegree(headerText)) {
          role = headerText;
          if (lineIdx > 0 && lines[lineIdx - 1] && !isRoleOrDegree(lines[lineIdx - 1])) {
            organization = lines[lineIdx - 1];
          } else if (lineIdx < lines.length - 1 && lines[lineIdx + 1] && !isRoleOrDegree(lines[lineIdx + 1]) && !dateRangeRegex.test(lines[lineIdx + 1])) {
            organization = lines[lineIdx + 1];
          } else {
            organization = 'Independent';
          }
        } else {
          organization = headerText || 'Independent';
          if (lineIdx > 0 && lines[lineIdx - 1] && isRoleOrDegree(lines[lineIdx - 1])) {
            role = lines[lineIdx - 1];
          } else {
            role = recommendedRole === 'AI Architect' ? 'AI Specialist' : (recommendedRole === 'Frontend Architect' ? 'Frontend Developer' : 'Software Professional');
          }
        }
      }

      role = role.replace(/^[\s,.:;•/|()\-–—\[\]]+|[\s,.:;•/|()\-–—\[\]]+$/g, '').trim();
      organization = organization.replace(/^[\s,.:;•/|()\-–—\[\]]+|[\s,.:;•/|()\-–—\[\]]+$/g, '').trim();

      const descLines: string[] = [];
      const endSearchIdx = (idx < milestoneIndices.length - 1) ? milestoneIndices[idx + 1] : lines.length;
      for (let j = lineIdx + 1; j < endSearchIdx; j++) {
        const descLine = lines[j];
        if (descLine && !dateRangeRegex.test(descLine)) {
          descLines.push(descLine);
        }
      }
      
      const description = descLines.slice(0, 3).join(' ') || `Role at ${organization}.`;

      let type: 'employment' | 'academic' | 'sabbatical' | 'project' = 'employment';
      const orgLower = organization.toLowerCase();
      const roleLower = role.toLowerCase();
      if (orgLower.includes('university') || orgLower.includes('college') || orgLower.includes('school') || orgLower.includes('institute') || roleLower.includes('degree') || roleLower.includes('bachelor') || roleLower.includes('master') || roleLower.includes('phd') || roleLower.includes('b.sc') || roleLower.includes('m.sc')) {
        type = 'academic';
      } else if (orgLower.includes('sabbatical') || roleLower.includes('sabbatical') || orgLower.includes('break') || roleLower.includes('break') || roleLower.includes('independent research')) {
        type = 'sabbatical';
      }

      const nodeSkills = detectedSkills.filter(s => {
        const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const r = new RegExp(`\\b${escaped}\\b`, 'i');
        return r.test(role + ' ' + organization + ' ' + description);
      }).map(s => ({ name: s, level: 'Rank-1' as const }));

      nodes.push({
        id: `parsed-${organization.replace(/\s+/g, '-').toLowerCase()}-${idx}-${Date.now()}`,
        role,
        organization,
        type,
        startDate,
        endDate,
        description,
        skills: nodeSkills.length > 0 ? nodeSkills : detectedSkills.slice(0, 3).map(s => ({ name: s, level: 'Rank-1' as const }))
      });
    }
  }

  if (nodes.length === 0) {
    const defaultRole = recommendedRole === 'AI Architect' ? 'AI Developer' : (recommendedRole === 'Frontend Architect' ? 'Frontend Developer' : 'Software Professional');
    nodes.push({
      id: `parsed-profile-${Date.now()}`,
      role: defaultRole,
      organization: 'Independent / Candidate Profile',
      type: 'employment',
      startDate: '2024-01',
      endDate: 'Present',
      description: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
      skills: detectedSkills.slice(0, 4).map(s => ({ name: s, level: 'Rank-1' as const }))
    });
  }

  // Infer location
  let geo = 'Southeast Asia (Inferred)';
  if (/singapore|nus|ntu/i.test(normalizedText)) {
    geo = 'Singapore (Inferred)';
  } else if (/malaysia|um\b|petronas|maxis|maybank|shopee|grab/i.test(normalizedText)) {
    geo = 'Malaysia (Inferred)';
  }

  let marketDemand = '';
  let justification = '';

  if (recommendedRole === 'AI Architect') {
    marketDemand = 'Very High. AI engineering demand is surging in regional hubs due to Sovereign AI initiatives, data center clusters, and custom localized LLM deployments.';
    justification = 'Your PyTorch, Deep Learning, and System Architecture skills align perfectly with regional companies and technology centers investing heavily in AI tooling.';
  } else if (recommendedRole === 'Frontend Architect') {
    marketDemand = 'High. In demand for e-commerce, localized superapps, and banking platforms looking to optimize browser engine performance and web UI responsiveness.';
    justification = 'Your expertise in React, TypeScript, and state management fits regional engineering centers focusing on scaling web applications and high-fidelity user flows.';
  } else {
    marketDemand = 'Strong. Tech teams scaling in Kuala Lumpur and Singapore have high demand for experienced engineering leaders to guide agile sprints and system design.';
    justification = 'Your background in software development combined with technical leadership skills makes you a prime candidate to lead cross-functional engineering teams in the region.';
  }

  const rolesList = [
    {
      role: 'AI Architect',
      justification: 'Your PyTorch, Deep Learning, and System Architecture skills align perfectly with regional companies and technology centers investing heavily in AI tooling.'
    },
    {
      role: 'Frontend Architect',
      justification: 'Your expertise in React, TypeScript, and state management fits regional engineering centers focusing on scaling web applications and high-fidelity user flows.'
    },
    {
      role: 'Engineering Director',
      justification: 'Your background in software development combined with technical leadership skills makes you a prime candidate to lead cross-functional engineering teams in the region.'
    }
  ];

  const matchedRole = rolesList.find(r => r.role === recommendedRole) || rolesList[0];
  const recommendedRoles = [
    matchedRole,
    ...rolesList.filter(r => r.role !== matchedRole.role)
  ];

  return {
    nodes,
    recommendedRole,
    recommendedRoles,
    detectedSkills,
    marketAnalysis: {
      geo,
      marketDemand,
      justification
    }
  };
}

// ──────────────────────────────────────────────────────────────
// PEER COHORT & ANONYMIZED TRAJECTORY TYPES & ALGORITHM
// ──────────────────────────────────────────────────────────────

export type CompanyTier = 'Tier-1 Tech Giant' | 'Tier-2 Corporate' | 'Tier-3 Growth-Stage' | 'Tier-4 Startup' | 'Tier-5 Freelance/Agency';

export interface PeerMilestone {
  role: string;
  companyTier: CompanyTier;
  type: 'employment' | 'academic' | 'sabbatical';
  durationMonths: number;
  skills: string[];
}

export interface PeerProfile {
  id: string;              // e.g. "peer-0347"
  targetRole: string;      // The role they eventually reached
  reachedTarget: boolean;  // Whether they successfully transitioned
  geo: string;
  totalExperienceMonths: number;
  milestones: PeerMilestone[];
  skills: string[];        // All unique skills
}

export interface CohortPeerSummary {
  id: string;
  targetRole: string;
  reachedTarget: boolean;
  totalExperienceMonths: number;
  geo: string;
  pathSteps: string[];     // e.g. ["Tier-4 Startup SE (18m)", "Tier-2 Corp Senior (30m)", …]
  skillCount: number;
  skills: string[];
}

export interface CohortAnalysisResult {
  targetRole: string;
  totalPeersMatched: number;
  successRate: number;           // 0-100
  avgMonthsToReach: number;
  medianMonthsToReach: number;
  topSkills: { skill: string; count: number; percentage: number }[];
  tierProgression: { tier: CompanyTier; avgDurationMonths: number; count: number }[];
  peerSummaries: CohortPeerSummary[];
  matchedJobs: (JobPosting & { matchPercentage: number })[];
}

export function analyzeCohortProgress(
  peers: PeerProfile[],
  jobs: JobPosting[],
  targetRole: string,
  currentSkills: string[]
): CohortAnalysisResult {
  const normalizedTarget = targetRole.toLowerCase().trim();

  // Filter peers who targeted or reached a role matching the target
  const matchedPeers = peers.filter(p => {
    const pRole = p.targetRole.toLowerCase().trim();
    return pRole === normalizedTarget ||
      pRole.includes(normalizedTarget) ||
      normalizedTarget.includes(pRole);
  });

  // If very few exact matches, also include peers with similar skills overlap
  let finalPeers = matchedPeers;
  if (finalPeers.length < 20) {
    const skillOverlapPeers = peers.filter(p => {
      if (matchedPeers.includes(p)) return false;
      const overlap = p.skills.filter(s => currentSkills.includes(s));
      return overlap.length >= 3;
    }).slice(0, 80);
    finalPeers = [...matchedPeers, ...skillOverlapPeers];
  }

  // Compute success rate
  const successfulPeers = finalPeers.filter(p => p.reachedTarget);
  const successRate = finalPeers.length > 0
    ? Math.round((successfulPeers.length / finalPeers.length) * 100)
    : 0;

  // Average and median months to reach for successful peers
  const monthsList = successfulPeers.map(p => p.totalExperienceMonths).sort((a, b) => a - b);
  const avgMonths = monthsList.length > 0
    ? Math.round(monthsList.reduce((s, v) => s + v, 0) / monthsList.length)
    : 0;
  const medianMonths = monthsList.length > 0
    ? monthsList[Math.floor(monthsList.length / 2)]
    : 0;

  // Top skills among peers
  const skillCounter: Record<string, number> = {};
  finalPeers.forEach(p => {
    p.skills.forEach(s => {
      skillCounter[s] = (skillCounter[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounter)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: finalPeers.length > 0 ? Math.round((count / finalPeers.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Tier progression aggregation
  const tierAgg: Record<string, { totalMonths: number; count: number }> = {};
  finalPeers.forEach(p => {
    p.milestones.filter(m => m.type === 'employment').forEach(m => {
      if (!tierAgg[m.companyTier]) tierAgg[m.companyTier] = { totalMonths: 0, count: 0 };
      tierAgg[m.companyTier].totalMonths += m.durationMonths;
      tierAgg[m.companyTier].count += 1;
    });
  });
  const tierProgression = Object.entries(tierAgg)
    .map(([tier, data]) => ({
      tier: tier as CompanyTier,
      avgDurationMonths: Math.round(data.totalMonths / data.count),
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);

  // Build peer summaries (anonymized)
  const peerSummaries: CohortPeerSummary[] = finalPeers.slice(0, 100).map(p => ({
    id: p.id,
    targetRole: p.targetRole,
    reachedTarget: p.reachedTarget,
    totalExperienceMonths: p.totalExperienceMonths,
    geo: p.geo,
    pathSteps: p.milestones
      .filter(m => m.type !== 'academic')
      .map(m => `${m.companyTier} ${m.role} (${m.durationMonths}m)`),
    skillCount: p.skills.length,
    skills: p.skills
  }));

  // Match jobs to candidate skills
  const matchedJobs = jobs
    .map(job => {
      const jobSkills = job.requiredSkills;
      const matchCount = jobSkills.filter(s => currentSkills.includes(s)).length;
      const matchPercentage = jobSkills.length > 0
        ? Math.round((matchCount / jobSkills.length) * 100)
        : 0;

      // Also boost match if job role matches target
      const roleBoost = job.role.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(job.role.toLowerCase()) ? 15 : 0;

      return {
        ...job,
        matchPercentage: Math.min(100, matchPercentage + roleBoost)
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 50);

  return {
    targetRole,
    totalPeersMatched: finalPeers.length,
    successRate,
    avgMonthsToReach: avgMonths,
    medianMonthsToReach: medianMonths,
    topSkills,
    tierProgression,
    peerSummaries,
    matchedJobs
  };
}

// ──────────────────────────────────────────────────────────────
// LIVE CV TAILORING ENGINE
// ──────────────────────────────────────────────────────────────

export interface TailoredCV {
  summary: string;
  milestones: CareerNode[];
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestedKeywords: string[];
  logs: string[];
}

export function tailorCVForTarget(
  nodes: CareerNode[],
  candidateSkills: string[],
  targetPathOrJob: string,
  customJobDesc?: string,
  originalSummary?: string
): TailoredCV {
  const normTarget = targetPathOrJob.toLowerCase().trim();
  const logs: string[] = [];

  // 1. Get required skills for this pathway or job description
  let requiredSkills: string[] = [];
  if (SKILL_DAG[targetPathOrJob]) {
    requiredSkills = [targetPathOrJob, ...getPreRequisitesRecursive(targetPathOrJob)];
  } else {
    // If it's a custom job description or path, extract keywords matching available skills
    const availableSkills = Object.keys(SKILL_DAG);
    const searchSrc = (customJobDesc || targetPathOrJob).toLowerCase();
    requiredSkills = availableSkills.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(searchSrc);
    });
    // If still empty, supply default technical foundations
    if (requiredSkills.length === 0) {
      requiredSkills = ['Software Engineering', 'Linux', 'Communication'];
    }
  }

  // 2. Identify matches, missing, and suggested skills
  const matchedKeywords = requiredSkills.filter(skill => candidateSkills.includes(skill));
  const missingKeywords = requiredSkills.filter(skill => !candidateSkills.includes(skill));
  
  // Suggested are related prerequisites
  const suggestedKeywords = Object.keys(SKILL_DAG).filter(s => 
    !candidateSkills.includes(s) && 
    (normTarget.includes(s.toLowerCase()) || (customJobDesc && customJobDesc.toLowerCase().includes(s.toLowerCase()))) &&
    !missingKeywords.includes(s)
  );

  let matchScore = 0;
  if (requiredSkills.length > 0) {
    matchScore = Math.round((matchedKeywords.length / requiredSkills.length) * 100);
    // Give a small boost if they have experience in the exact same field
    const hasRoleOverlap = nodes.some(n => n.role.toLowerCase().includes(normTarget) || normTarget.includes(n.role.toLowerCase()));
    if (hasRoleOverlap) matchScore = Math.min(100, matchScore + 10);
  }

  logs.push(`[Live CV] Match score calculated at ${matchScore}% based on ${matchedKeywords.length}/${requiredSkills.length} intent skills.`);

  // Helper function to highlight matches that are already in the text (preserving honesty)
  const highlightText = (text: string, keywords: string[]): string => {
    if (!text) return '';
    let result = text;
    // Sort keywords by length descending to avoid partial matches
    const sortedKws = [...keywords].sort((a, b) => b.length - a.length);
    sortedKws.forEach(kw => {
      if (!kw) return;
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b(${escaped})\\b(?![^\\[]*\\]\\])`, 'gi');
      result = result.replace(regex, '[[OPT:$1]]');
    });
    return result;
  };

  // 3. Tailor CV content based on target (only highlighting matching words, never fabricating)
  let summary = '';
  if (originalSummary) {
    const cleanOrig = originalSummary.replace(/\[\[OPT:.*?\]\]/g, '').trim();
    summary = highlightText(cleanOrig, matchedKeywords);
    logs.push(`[Live CV] Kept original summary and highlighted relevant matching skills.`);
  } else {
    // Factual summary from nodes
    const orgs = nodes.map(n => n.organization).filter(Boolean);
    const roles = nodes.map(n => n.role).filter(Boolean);
    const cleanOrgs = Array.from(new Set(orgs));
    const cleanRoles = Array.from(new Set(roles));
    
    let synthesized = '';
    if (cleanRoles.length > 0 && cleanOrgs.length > 0) {
      synthesized = `Professional with experience as ${cleanRoles.slice(0, 2).join(' and ')} at ${cleanOrgs.slice(0, 2).join(', ')}.`;
    } else {
      synthesized = `Technical professional with experience in software development and technical systems.`;
    }
    summary = highlightText(synthesized, matchedKeywords);
    logs.push(`[Live CV] Generated factual profile summary and highlighted matching skills.`);
  }

  // Handle nodes tailoring (preserves original text exactly, only highlights keywords)
  const tailoredNodes = nodes.map(node => {
    const n = { ...node };
    
    const cleanRole = n.role.replace(/\[\[OPT:.*?\]\]/g, '').trim();
    const cleanDesc = n.description ? n.description.replace(/\[\[OPT:.*?\]\]/g, '').trim() : '';
    const cleanAchievements = (n.achievements || []).map(ach => ach.replace(/\[\[OPT:.*?\]\]/g, '').trim());

    // Highlight matching keywords that are already in the candidate's text
    n.role = highlightText(cleanRole, matchedKeywords);
    n.description = highlightText(cleanDesc, matchedKeywords);
    n.achievements = cleanAchievements.map(ach => highlightText(ach, matchedKeywords));
    
    return n;
  });

  logs.push(`[Live CV] Highlighted matching skills in roles and achievements. Zero fabricated content added.`);

  // 4. Sort skills list so that matched intent keywords are at the front
  tailoredNodes.forEach(node => {
    node.skills = [...node.skills].sort((a, b) => {
      const aMatch = requiredSkills.includes(a.name) ? 1 : 0;
      const bMatch = requiredSkills.includes(b.name) ? 1 : 0;
      return bMatch - aMatch;
    });
  });

  return {
    summary,
    milestones: tailoredNodes,
    matchScore,
    matchedKeywords,
    missingKeywords,
    suggestedKeywords,
    logs
  };
}

