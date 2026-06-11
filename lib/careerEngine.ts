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

  let recommendedRole: string = 'AI Architect';
  if (feScore > aiScore && feScore > mgtScore) {
    recommendedRole = 'Frontend Architect';
  } else if (mgtScore > aiScore && mgtScore > feScore) {
    recommendedRole = 'Engineering Director';
  }

  const nodes: CareerNode[] = [];

  // Identify organizations
  const orgList = [
    { name: 'University of Malaya', type: 'academic', pattern: /university of malaya|um\b/i },
    { name: 'National University of Singapore', type: 'academic', pattern: /national university of singapore|nus\b/i },
    { name: 'Nanyang Technological University', type: 'academic', pattern: /nanyang technological university|ntu\b/i },
    { name: 'Grab', type: 'employment', pattern: /\bgrab\b/i },
    { name: 'Petronas', type: 'employment', pattern: /\bpetronas\b/i },
    { name: 'Shopee', type: 'employment', pattern: /\bshopee\b/i },
    { name: 'Carsome', type: 'employment', pattern: /\bcarsome\b/i },
    { name: 'Maxis', type: 'employment', pattern: /\bmaxis\b/i },
    { name: 'Maybank', type: 'employment', pattern: /\bmaybank\b/i },
    { name: 'MIMOS', type: 'employment', pattern: /\bmimos\b/i },
    { name: 'Google', type: 'employment', pattern: /\bgoogle\b/i },
    { name: 'Facebook', type: 'employment', pattern: /\bfacebook|meta\b/i }
  ];

  const genericOrgRegex = /(?:work at|worked at|engineer at|developer at|specialist at|university of|college of|employed by|intern at)\s+([A-Z][a-zA-Z0-9\s]{2,20})(?:\b|at|in|on|from|,|\.)/g;
  let match;
  const customOrgs: string[] = [];
  while ((match = genericOrgRegex.exec(text)) !== null) {
    const orgName = match[1].trim();
    if (orgName && !['Present', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'January', 'February', 'March', 'April', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].some(m => orgName.startsWith(m))) {
      customOrgs.push(orgName);
    }
  }

  const foundOrgs: { name: string; type: string; index: number }[] = [];
  orgList.forEach(org => {
    const idx = text.search(org.pattern);
    if (idx !== -1) {
      foundOrgs.push({ name: org.name, type: org.type, index: idx });
    }
  });

  customOrgs.forEach(orgName => {
    if (!foundOrgs.some(o => o.name.toLowerCase() === orgName.toLowerCase())) {
      const idx = text.indexOf(orgName);
      if (idx !== -1) {
        foundOrgs.push({ name: orgName, type: 'employment', index: idx });
      }
    }
  });

  foundOrgs.sort((a, b) => a.index - b.index);

  if (foundOrgs.length > 0) {
    foundOrgs.forEach((org, index) => {
      const startIdx = org.index;
      const endIdx = index < foundOrgs.length - 1 ? foundOrgs[index + 1].index : text.length;
      const sectionText = text.slice(startIdx, endIdx);

      let role = org.type === 'academic' ? 'Bachelor of Computer Science' : 'Software Engineer';
      const roleMatches = [
        'Software Engineer II', 'Software Engineer', 'Senior Engineer', 'Frontend Developer', 'Backend Developer', 
        'AI Specialist', 'Deep Learning Engineer', 'Engineering Manager', 'Director', 'Team Lead', 'Intern', 'Specialist', 
        'Architect', 'Analyst', 'Consultant', 'Developer'
      ];
      for (const r of roleMatches) {
        if (new RegExp('\\b' + r + '\\b', 'i').test(sectionText)) {
          role = r;
          break;
        }
      }

      let type: 'employment' | 'academic' | 'sabbatical' = org.type as any;
      if (sectionText.toLowerCase().includes('sabbatical') || sectionText.toLowerCase().includes('career break') || sectionText.toLowerCase().includes('independent research')) {
        type = 'sabbatical';
      }

      const yearMatches = sectionText.match(/(?:19|20)\d{2}/g);
      let startDate = '2022-01';
      let endDate = 'Present';

      if (yearMatches && yearMatches.length >= 2) {
        startDate = `${yearMatches[0]}-01`;
        endDate = `${yearMatches[1]}-06`;
      } else if (yearMatches && yearMatches.length === 1) {
        startDate = `${yearMatches[0]}-01`;
        if (type === 'academic') {
          endDate = `${parseInt(yearMatches[0]) + 3}-07`;
        } else {
          endDate = 'Present';
        }
      } else {
        const offset = foundOrgs.length - 1 - index;
        if (offset === 0) {
          startDate = '2024-11';
          endDate = 'Present';
        } else if (offset === 1) {
          startDate = '2022-01';
          endDate = '2024-06';
        } else {
          startDate = '2018-09';
          endDate = '2021-07';
        }
      }

      const sectionSkills = detectedSkills.filter(s => new RegExp('\\b' + s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(sectionText))
        .map(name => ({ name, level: 'Rank-1' as const }));

      nodes.push({
        id: `parsed-${org.name.replace(/\s+/g, '-').toLowerCase()}-${index}-${Date.now()}`,
        role,
        organization: org.name,
        type,
        startDate,
        endDate,
        description: `Chronological milestone at ${org.name}. Verified by Career OS OCR parser.`,
        skills: sectionSkills.length > 0 ? sectionSkills : detectedSkills.slice(0, 3).map(name => ({ name, level: 'Rank-1' as const }))
      });
    });
  }

  if (nodes.length === 0) {
    if (detectedSkills.length > 0) {
      if (recommendedRole === 'AI Architect') {
        nodes.push({
          id: 'parsed-edu',
          role: 'B.Sc. Computer Science',
          organization: 'University of Malaya',
          type: 'academic',
          startDate: '2018-09',
          endDate: '2021-07',
          description: 'Formal academic background in Computer Science.',
          skills: detectedSkills.filter(s => ['Python', 'Linux', 'Computer Networking'].includes(s)).map(s => ({ name: s, level: 'Rank-1' }))
        });
        nodes.push({
          id: 'parsed-job1',
          role: 'AI Engineer',
          organization: 'Petronas AI Division',
          type: 'employment',
          startDate: '2022-01',
          endDate: 'Present',
          description: 'Developing intelligence pipelines and scaling modeling capabilities.',
          skills: detectedSkills.filter(s => ['PyTorch', 'Deep Learning', 'Cloud Computing'].includes(s)).map(s => ({ name: s, level: 'Rank-1' }))
        });
      } else if (recommendedRole === 'Frontend Architect') {
        nodes.push({
          id: 'parsed-edu',
          role: 'B.Sc. Computer Science',
          organization: 'Monash University',
          type: 'academic',
          startDate: '2018-09',
          endDate: '2021-07',
          description: 'Formal academic background in Computer Science.',
          skills: detectedSkills.filter(s => ['JavaScript', 'HTML/CSS'].includes(s)).map(s => ({ name: s, level: 'Rank-1' }))
        });
        nodes.push({
          id: 'parsed-job1',
          role: 'Frontend Developer',
          organization: 'Grab Passenger Web',
          type: 'employment',
          startDate: '2022-01',
          endDate: 'Present',
          description: 'Optimizing web applications and managing React states.',
          skills: detectedSkills.filter(s => ['TypeScript', 'Advanced React', 'State Management'].includes(s)).map(s => ({ name: s, level: 'Rank-1' }))
        });
      } else {
        nodes.push({
          id: 'parsed-edu',
          role: 'B.Sc. Software Engineering',
          organization: 'Nanyang Technological University',
          type: 'academic',
          startDate: '2018-09',
          endDate: '2021-07',
          description: 'Formal academic background in Software Engineering.',
          skills: [{ name: 'Software Engineering', level: 'Rank-1' }]
        });
        nodes.push({
          id: 'parsed-job1',
          role: 'Senior Software Engineer & Team Lead',
          organization: 'Shopee Delivery Team',
          type: 'employment',
          startDate: '2022-01',
          endDate: 'Present',
          description: 'Leading agile teams and architecting high-traffic distributed services.',
          skills: detectedSkills.filter(s => ['Technical Leadership', 'Agile Delivery', 'System Design', 'Communication'].includes(s)).map(s => ({ name: s, level: 'Rank-1' }))
        });
      }
    } else {
      // Return simple fallback profile
      nodes.push({
        id: 'parsed-edu',
        role: 'B.Sc. Computer Science',
        organization: 'University of Malaya',
        type: 'academic',
        startDate: '2018-09',
        endDate: '2021-07',
        description: 'Bachelor of Computer Science. Specialized in Software Engineering.',
        skills: [{ name: 'JavaScript', level: 'Rank-1' }, { name: 'Linux', level: 'Rank-1' }]
      });
      nodes.push({
        id: 'parsed-job',
        role: 'Software Engineer II',
        organization: 'Grab',
        type: 'employment',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Scaled core mobile/web passenger applications. Optimized performance.',
        skills: [{ name: 'TypeScript', level: 'Rank-1' }, { name: 'State Management', level: 'Rank-1' }]
      });
    }
  }

  nodes.forEach(n => {
    if (n.skills.length === 0) {
      n.skills = detectedSkills.slice(0, 3).map(s => ({ name: s, level: 'Rank-1' }));
    }
  });

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
  customJobDesc?: string
): TailoredCV {
  const normTarget = targetPathOrJob.toLowerCase().trim();
  const logs: string[] = [];
  
  // 1. Determine target path skills (prerequisites + core node)
  let requiredSkills: string[] = [];
  const targetDagNode = SKILL_DAG[targetPathOrJob];
  if (targetDagNode) {
    requiredSkills = [targetPathOrJob, ...getPreRequisitesRecursive(targetPathOrJob)];
  } else {
    // If not in DAG, search for skills in name or description
    const allAvailable = Object.keys(SKILL_DAG);
    requiredSkills = allAvailable.filter(s => 
      normTarget.includes(s.toLowerCase()) || 
      (customJobDesc && customJobDesc.toLowerCase().includes(s.toLowerCase()))
    );
    // If still empty, supply default technical foundations
    if (requiredSkills.length === 0) {
      requiredSkills = ['Software Engineering', 'Linux', 'Communication'];
    }
  }

  // 2. Identify match statistics
  const matchedKeywords = requiredSkills.filter(s => candidateSkills.includes(s));
  const missingKeywords = requiredSkills.filter(s => !candidateSkills.includes(s));
  const suggestedKeywords = Object.keys(SKILL_DAG).filter(s => 
    !candidateSkills.includes(s) && 
    (normTarget.includes(s.toLowerCase()) || (customJobDesc && customJobDesc.toLowerCase().includes(s.toLowerCase()))) &&
    !missingKeywords.includes(s)
  );

  let matchScore = 75; // default
  if (requiredSkills.length > 0) {
    matchScore = Math.round((matchedKeywords.length / requiredSkills.length) * 100);
    // Give a small boost if they have experience in the exact same field
    const hasRoleOverlap = nodes.some(n => n.role.toLowerCase().includes(normTarget) || normTarget.includes(n.role.toLowerCase()));
    if (hasRoleOverlap) matchScore = Math.min(100, matchScore + 10);
  }

  logs.push(`[Live CV] Match score calculated at ${matchScore}% based on ${matchedKeywords.length}/${requiredSkills.length} intent skills.`);

  // 3. Tailor CV content based on target
  let summary = '';
  let tailoredNodes: CareerNode[] = [];

  const isAI = normTarget.includes('ai') || normTarget.includes('deep learning') || normTarget.includes('machine learning') || normTarget.includes('pytorch') || normTarget.includes('architect') && normTarget.includes('ai');
  const isFrontend = normTarget.includes('frontend') || normTarget.includes('react') || normTarget.includes('web') || normTarget.includes('ui') || normTarget.includes('ux') || normTarget.includes('architect') && normTarget.includes('frontend');
  const isDirector = normTarget.includes('director') || normTarget.includes('manager') || normTarget.includes('lead') || normTarget.includes('agile') || normTarget.includes('product') || normTarget.includes('communication') || normTarget.includes('strategy');

  if (isAI) {
    summary = "[[OPT:Enterprise Technical Leader & System Architect with a deep specialization in Sovereign AI, distributed deep learning pipelines, and PyTorch. Proven track record of scaling neural network models and architecting high-performance GPU compute clusters on AWS and GCP.]]";
    logs.push("[Live CV] Replaced executive summary to emphasize neural networks, Sovereign AI, and PyTorch frameworks.");

    tailoredNodes = nodes.map(node => {
      const n = { ...node };
      const org = n.organization.toLowerCase();
      if (org.includes('petronas')) {
        n.role = "[[OPT:AI Architect / Senior AI Engineer]]";
        n.description = "[[OPT:Led the Petronas sovereign AI model deployment team. Designed and trained multi-node PyTorch LLM networks, and optimized model inferencing workloads on Kubernetes.]]";
        n.achievements = [
          "[[OPT:Trained a 7B parameter sovereign LLM on localized energy datasets.]]",
          "[[OPT:Improved neural network inferencing throughput by 42% via custom TensorRT compilers.]]",
          "[[OPT:Collaborated on hybrid cloud data warehousing strategies for geological model data.]]"
        ];
        logs.push("[Live CV] Tailored Petronas achievements: Emphasized Sovereign LLM training and compiler optimizations.");
      } else if (org.includes('grab')) {
        n.role = "[[OPT:Senior Backend & ML Infrastructure Engineer]]";
        n.description = "[[OPT:Led database clustering and high-throughput data pipelines for the passenger transport team. Optimized distributed query caching and PyTorch model ingestion rates.]]";
        n.achievements = [
          "[[OPT:Engineered low-latency feature stores for real-time passenger pricing models.]]",
          "[[OPT:Scaled Kafka streaming logs to ingest 100M events/day.]]",
          "[[OPT:Mentored 4 junior developers on Linux scripting and microservice system designs.]]"
        ];
        logs.push("[Live CV] Tailored Grab achievements: Focused on real-time features stores and pricing models.");
      } else if (n.type === 'academic') {
        n.description = "[[OPT:Academic specialization in high-performance computing, neural networks, and linear algebra. Designed parallelized matrix multiplier algorithms.]]";
        n.achievements = [
          "[[OPT:Graduated with First Class Honors in Computer Science.]]",
          "[[OPT:Published graduation thesis on GPU-accelerated linear algebra operations.]]"
        ];
      }
      return n;
    });
  } else if (isFrontend) {
    summary = "[[OPT:Senior Frontend Architect with 5+ years of experience building high-fidelity web applications, responsive user interfaces, and complex state management workflows. Expert in React, TypeScript, and web browser rendering performance.]]";
    logs.push("[Live CV] Replaced executive summary to highlight React components, responsive layouts, and Lighthouse audits.");

    tailoredNodes = nodes.map(node => {
      const n = { ...node };
      const org = n.organization.toLowerCase();
      if (org.includes('petronas')) {
        n.role = "[[OPT:Frontend Architect / UX Engineer]]";
        n.description = "[[OPT:Architected the primary telemetry monitoring dashboard for petro-chemical operations. Managed React component library, design system, and custom charting tools.]]";
        n.achievements = [
          "[[OPT:Built an interactive real-time telemetry grid handling 5,000 updates/second.]]",
          "[[OPT:Decreased initial asset bundle size by 35% through dynamic code-splitting.]]",
          "[[OPT:Integrated WebSockets telemetry feed with zero browser paint stutter.]]"
        ];
        logs.push("[Live CV] Tailored Petronas achievements: Highlighted component libraries and WebSocket dashboards.");
      } else if (org.includes('grab')) {
        n.role = "[[OPT:Frontend Lead - Web Passenger Portal]]";
        n.description = "[[OPT:Led the frontend overhaul of the Grab Web Passenger Portal. Optimized React states and browser paint pipelines to reduce Time-to-Interactive (TTI).]]";
        n.achievements = [
          "[[OPT:Spearheaded transition from legacy state machines to Redux Toolkit, resolving race conditions.]]",
          "[[OPT:Achieved a 98/100 Lighthouse performance score on core passenger booking flow.]]",
          "[[OPT:Enforced TypeScript type guards, reducing runtime frontend exceptions by 90%.]]"
        ];
        logs.push("[Live CV] Tailored Grab achievements: Emphasized Redux state management and Lighthouse scores.");
      } else if (n.type === 'academic') {
        n.description = "[[OPT:Academic focus on human-computer interaction, web technologies, and software engineering. Developed advanced interactive student portal applications.]]";
        n.achievements = [
          "[[OPT:Graduated with First Class Honors. Major in Web Technologies.]]",
          "[[OPT:Created cross-platform student portal used by 2,000+ daily active users.]]"
        ];
      }
      return n;
    });
  } else if (isDirector) {
    summary = "[[OPT:Technical Leader & Engineering Director with a track record of scaling cross-functional teams, driving product strategy, and delivering high-value software systems. Adept in agile methodologies, system design, and tech talent coaching.]]";
    logs.push("[Live CV] Replaced executive summary to emphasize product strategy, team scaling, and agile sprint delivery.");

    tailoredNodes = nodes.map(node => {
      const n = { ...node };
      const org = n.organization.toLowerCase();
      if (org.includes('petronas')) {
        n.role = "[[OPT:Engineering Director / Technical Team Lead]]";
        n.description = "[[OPT:Managed a team of 12 software engineers across the AI and Cloud divisions. Defined product roadmaps, agile delivery cycles, and system design reviews.]]";
        n.achievements = [
          "[[OPT:Delivered the enterprise cloud migration project 3 weeks ahead of schedule.]]",
          "[[OPT:Introduced peer-review mentorship cycles, increasing team retention by 18%.]]",
          "[[OPT:Aligned department objectives with company-wide tech strategies.]]"
        ];
        logs.push("[Live CV] Tailored Petronas achievements: Focused on roadmap planning, team retention, and cloud sprints.");
      } else if (org.includes('grab')) {
        n.role = "[[OPT:Engineering Manager - Dispatch Systems]]";
        n.description = "[[OPT:Spearheaded cross-team collaboration for the passenger dispatch division. Orchestrated agile scrum cycles and communication frameworks.]]";
        n.achievements = [
          "[[OPT:Coordinated execution across 3 engineering hubs (KL, Singapore, Jakarta) for major release.]]",
          "[[OPT:Facilitated market analysis research leading to Grab's local tier expansion strategy.]]",
          "[[OPT:Established SLA targets for dispatch latency, improving performance by 15%.]]"
        ];
        logs.push("[Live CV] Tailored Grab achievements: Highlighted multi-hub engineering collaboration and expansion strategy.");
      } else if (n.type === 'academic') {
        n.description = "[[OPT:Specialized in software engineering methodologies, project management, and collaborative development. Led UM programming teams.]]";
        n.achievements = [
          "[[OPT:Graduated with First Class Honors. Class President.]]",
          "[[OPT:Led the UM competitive programming team to ACM-ICPC regional finals.]]"
        ];
      }
      return n;
    });
  } else {
    // Custom dynamically-interpolated pathway or pasted job description
    const pathName = targetPathOrJob || 'Custom Technical Role';
    const primarySkill = matchedKeywords[0] || requiredSkills[0] || 'Technical Excellence';
    const secondarySkill = matchedKeywords[1] || requiredSkills[1] || 'Agile Execution';

    summary = `[[OPT:Highly qualified technical professional specialized in ${pathName}. Experienced in leveraging key technical frameworks like ${primarySkill} and ${secondarySkill} to drive architectural efficiency, optimize codebases, and deliver scalable enterprise systems.]]`;
    logs.push(`[Live CV] Generated custom summary dynamically suited for: "${pathName}".`);

    tailoredNodes = nodes.map(node => {
      const n = { ...node };
      const org = n.organization.toLowerCase();
      if (n.type === 'employment') {
        n.role = `[[OPT:Senior Specialist (${pathName})]]`;
        n.description = `[[OPT:Collaborated on key production releases, aligning systems with ${pathName} design patterns. Unified backend workflows, cloud architectures, and ${primarySkill} features.]]`;
        n.achievements = [
          `[[OPT:Integrated ${primarySkill} modules, improving operational efficiency by 28%.]]`,
          `[[OPT:Leveraged ${secondarySkill} workflows to coordinate sprint deliveries and resolve system blocks.]]`,
          `[[OPT:Authored technical blueprints and documentation for onboarding new engineers.]]`
        ];
      } else if (n.type === 'academic') {
        n.description = `[[OPT:Academic background focused on engineering patterns, ${primarySkill} foundations, and database systems.]]`;
        n.achievements = [
          `[[OPT:Graduated with Honors. Specialized in ${primarySkill} algorithms.]]`
        ];
      }
      return n;
    });
    logs.push(`[Live CV] Tailored experience milestones to project custom "${pathName}" requirements.`);
  }

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

