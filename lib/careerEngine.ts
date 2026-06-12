// Career OS Core Mathematical & Mock Logic Engine
// Implements:
// 1. The Temporal Knowledge Graph (TKG) structures and skill dependency traversals.
// 2. The Step Semi-Markov Process (SSMP) hazard rate models.

import roadmapData from '../public/roadmap.json';

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
  description?: string;
  url?: string;
}

// Explicit Skill DAG definition with mock descriptions
export const SKILL_DAG: Record<string, SkillDAGNode> = {
  // AI Architect Track
  'AI Architect': { name: 'AI Architect', rank: 3, prerequisites: ['Deep Learning', 'System Architecture'], description: 'A senior engineering role responsible for designing robust, scalable, and secure artificial intelligence and machine learning architectures for enterprise applications.', url: 'https://roadmap.sh/ai-data-scientist' },
  'Deep Learning': { name: 'Deep Learning', rank: 2, prerequisites: ['PyTorch', 'Linear Algebra'], description: 'A subset of machine learning based on artificial neural networks with multiple layers, used to model complex patterns in data.', url: 'https://www.deeplearning.ai/' },
  'System Architecture': { name: 'System Architecture', rank: 2, prerequisites: ['Distributed Systems', 'Cloud Computing'], description: 'The conceptual model that defines the structure, behavior, and more views of a system, crucial for ensuring scalability and resilience.', url: 'https://roadmap.sh/software-architect' },
  'PyTorch': { name: 'PyTorch', rank: 1, prerequisites: ['Python'], description: 'An open source machine learning framework based on the Torch library, used for applications such as computer vision and natural language processing.', url: 'https://pytorch.org/' },
  'Distributed Systems': { name: 'Distributed Systems', rank: 1, prerequisites: ['Linux', 'Computer Networking'], description: 'A system whose components are located on different networked computers, which communicate and coordinate their actions by passing messages.', url: 'https://en.wikipedia.org/wiki/Distributed_computing' },
  'Cloud Computing': { name: 'Cloud Computing', rank: 1, prerequisites: ['Linux'], description: 'The on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user.', url: 'https://cloud.google.com/learn/what-is-cloud-computing' },
  'Python': { name: 'Python', rank: 0, prerequisites: [], description: 'A high-level, general-purpose programming language widely used in data science, machine learning, and backend development.', url: 'https://www.python.org/' },
  'Linear Algebra': { name: 'Linear Algebra', rank: 0, prerequisites: [], description: 'The branch of mathematics concerning linear equations, linear maps and their representations in vector spaces, fundamental for ML algorithms.', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/' },
  'Linux': { name: 'Linux', rank: 0, prerequisites: [], description: 'A family of open-source Unix-like operating systems based on the Linux kernel, essential for server management and deployment.', url: 'https://www.linux.org/' },
  'Computer Networking': { name: 'Computer Networking', rank: 0, prerequisites: [], description: 'The study and implementation of interconnected computing devices that exchange data and share resources with each other.', url: 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-computer-networking.html' },

  // Frontend Architect Track
  'Frontend Architect': { name: 'Frontend Architect', rank: 3, prerequisites: ['Advanced React', 'Performance Tuning'], description: 'Technical leader responsible for the macro-level architecture, performance, and tooling of front-end applications.', url: 'https://roadmap.sh/frontend' },
  'Advanced React': { name: 'Advanced React', rank: 2, prerequisites: ['State Management', 'TypeScript'], description: 'Deep understanding of React.js including custom hooks, context API, concurrent rendering, and architecture patterns.', url: 'https://react.dev/' },
  'Performance Tuning': { name: 'Performance Tuning', rank: 2, prerequisites: ['Browser Engines', 'Web Performance'], description: 'The practice of optimizing web applications to reduce load times, improve responsiveness, and lower resource consumption.', url: 'https://web.dev/fast/' },
  'State Management': { name: 'State Management', rank: 1, prerequisites: ['JavaScript'], description: 'Techniques and libraries (like Redux, Zustand) used to manage the data state of a user interface across multiple components.', url: 'https://redux.js.org/' },
  'Browser Engines': { name: 'Browser Engines', rank: 1, prerequisites: ['JavaScript'], description: 'The core software component of every major web browser that transforms HTML documents and other resources into an interactive visual representation.', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work' },
  'Web Performance': { name: 'Web Performance', rank: 1, prerequisites: ['HTML/CSS'], description: 'The objective measurement and perceived user experience of load time and runtime of a web site or application.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Performance' },
  'TypeScript': { name: 'TypeScript', rank: 1, prerequisites: ['JavaScript'], description: 'A strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.', url: 'https://www.typescriptlang.org/' },
  'JavaScript': { name: 'JavaScript', rank: 0, prerequisites: [], description: 'The core scripting language of the Web, enabling dynamic content, control over multimedia, and animate images.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  'HTML/CSS': { name: 'HTML/CSS', rank: 0, prerequisites: [], description: 'The foundational markup and styling languages used to create and design the visual structure of web pages.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },

  // Engineering Director Track
  'Engineering Director': { name: 'Engineering Director', rank: 3, prerequisites: ['Technical Leadership', 'Product Strategy'], description: 'A high-level management role overseeing engineering teams, driving technical strategy, and ensuring alignment with business goals.', url: 'https://roadmap.sh/engineering-manager' },
  'Technical Leadership': { name: 'Technical Leadership', rank: 2, prerequisites: ['Agile Delivery', 'System Design'], description: 'The ability to guide technical decisions, mentor engineers, and foster a strong engineering culture.', url: 'https://leaddev.com/' },
  'Product Strategy': { name: 'Product Strategy', rank: 2, prerequisites: ['Agile Delivery', 'Market Analysis'], description: 'The high-level plan describing what a business hopes to accomplish with its product and how it plans to do so.', url: 'https://www.productplan.com/glossary/product-strategy/' },
  'Agile Delivery': { name: 'Agile Delivery', rank: 1, prerequisites: ['Communication'], description: 'Iterative approach to software delivery that builds software incrementally from the start of the project.', url: 'https://agilemanifesto.org/' },
  'System Design': { name: 'System Design', rank: 1, prerequisites: ['Software Engineering'], description: 'The process of defining the architecture, modules, interfaces, and data for a system to satisfy specified requirements.', url: 'https://github.com/donnemartin/system-design-primer' },
  'Market Analysis': { name: 'Market Analysis', rank: 1, prerequisites: ['Communication'], description: 'The quantitative and qualitative assessment of a market, crucial for aligning technical products with user needs.', url: 'https://en.wikipedia.org/wiki/Market_analysis' },
  'Communication': { name: 'Communication', rank: 0, prerequisites: [], description: 'Effective verbal and written exchange of ideas, vital for cross-functional collaboration and leadership.', url: 'https://hbr.org/topic/subject/communication' },
  'Software Engineering': { name: 'Software Engineering', rank: 0, prerequisites: [], description: 'The systematic application of engineering approaches to the development of software.', url: 'https://en.wikipedia.org/wiki/Software_engineering' }
};

export const DEFAULT_ROADMAP_METADATA = [
  {
    id: "ai_architect",
    title: "AI Architect",
    related_roadmaps: ["MLOps", "Engineering Manager"],
    prerequisites: ["Python", "Linear Algebra"],
    content: [
      {
        branch: "Foundations",
        topics: ["Python", "Linear Algebra", "Linux", "Computer Networking"]
      },
      {
        branch: "Core Frameworks",
        topics: ["PyTorch", "Distributed Systems", "Cloud Computing"]
      },
      {
        branch: "Advanced Systems",
        topics: ["Deep Learning", "System Architecture"]
      },
      {
        branch: "AI Trajectory Specialization",
        topics: ["AI Architect"]
      }
    ]
  },
  {
    id: "frontend_architect",
    title: "Frontend Architect",
    related_roadmaps: ["UX Design"],
    prerequisites: ["JavaScript", "HTML/CSS"],
    content: [
      {
        branch: "Foundations",
        topics: ["JavaScript", "HTML/CSS"]
      },
      {
        branch: "Core Frameworks",
        topics: ["State Management", "Browser Engines", "Web Performance", "TypeScript"]
      },
      {
        branch: "Advanced Systems",
        topics: ["Advanced React", "Performance Tuning"]
      },
      {
        branch: "Frontend Trajectory Specialization",
        topics: ["Frontend Architect"]
      }
    ]
  },
  {
    id: "engineering_director",
    title: "Engineering Director",
    related_roadmaps: ["Engineering Manager", "Product Manager"],
    prerequisites: ["Communication", "Software Engineering"],
    content: [
      {
        branch: "Foundations",
        topics: ["Communication", "Software Engineering"]
      },
      {
        branch: "Core Frameworks",
        topics: ["Agile Delivery", "System Design", "Market Analysis"]
      },
      {
        branch: "Advanced Systems",
        topics: ["Technical Leadership", "Product Strategy"]
      },
      {
        branch: "Management Trajectory Specialization",
        topics: ["Engineering Director"]
      }
    ]
  }
];


// Dynamically seed SKILL_DAG from public/roadmap.json
try {
  if (roadmapData && roadmapData.roadmaps) {
    roadmapData.roadmaps.forEach((roadmap: any) => {
      const roadmapTitle = roadmap.title;
      
      // Seed Rank 3 (Roadmap itself)
      if (!SKILL_DAG[roadmapTitle]) {
        SKILL_DAG[roadmapTitle] = {
          name: roadmapTitle,
          rank: 3,
          prerequisites: roadmap.content.map((c: any) => c.branch)
        };
      }

      roadmap.content.forEach((c: any) => {
        // Seed Rank 2 (Branch)
        if (!SKILL_DAG[c.branch]) {
          const branchPrereqs: string[] = [];
          if (c.topics) {
            branchPrereqs.push(...c.topics);
          }
          if (c.sub_branches) {
            branchPrereqs.push(...c.sub_branches.map((sb: any) => sb.title));
          }
          SKILL_DAG[c.branch] = {
            name: c.branch,
            rank: 2,
            prerequisites: branchPrereqs
          };
        }

        // Seed Rank 1 Topics
        if (c.topics) {
          c.topics.forEach((topic: string) => {
            if (!SKILL_DAG[topic]) {
              SKILL_DAG[topic] = {
                name: topic,
                rank: 1,
                prerequisites: []
              };
            }
          });
        }

        // Seed Rank 1 Sub-branches & Rank 0 Items
        if (c.sub_branches) {
          c.sub_branches.forEach((sb: any) => {
            if (!SKILL_DAG[sb.title]) {
              SKILL_DAG[sb.title] = {
                name: sb.title,
                rank: 1,
                prerequisites: sb.items || []
              };
            }

            if (sb.items) {
              sb.items.forEach((item: string) => {
                if (!SKILL_DAG[item]) {
                  SKILL_DAG[item] = {
                    name: item,
                    rank: 0,
                    prerequisites: []
                  };
                }
              });
            }
          });
        }
      });
    });
  }
} catch (e) {
  // console.error("Error seeding SKILL_DAG from roadmap.json:", e);
}

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

export interface CohortReadinessFactor {
  label: string;
  effect: number;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface CohortReadinessResult {
  ctriScore: number;
  tsmiScore: number;
  tenureScore: number;
  academicScore: number;
  continuityScore: number;
  cohortMedianTenure: number;
  matchedSkillsCount: number;
  totalSkillsCount: number;
  factors: CohortReadinessFactor[];
}

export function calculateCohortReadiness(
  tenureMonths: number,
  tsmiScore: number,
  educationMatch: boolean,
  seniorityMatch: boolean,
  cohortMedianTenure: number
): CohortReadinessResult {
  // 1. TSMI (Skill Compatibility Score)
  // Supplied directly as a parameter for perfect consistency with Resume Builder

  // 2. Tenure alignment score: bell curve peaking at cohortMedianTenure
  // Formula: S_tenure = 100 * exp(-0.5 * ((t - M_cohort) / 12)^2)
  const t = tenureMonths;
  const M_cohort = cohortMedianTenure || 28;
  const sigma = 12; // standard deviation of 1 year
  const tenureScore = Math.round(100 * Math.exp(-0.5 * Math.pow((t - M_cohort) / sigma, 2)));

  // 3. Academic Compatibility Score
  const academicScore = educationMatch ? 100 : 30;

  // 4. Seniority / Leadership Match Score
  const seniorityScore = seniorityMatch ? 100 : 40;

  // Weighted CTRI Calculation
  // CTRI = 0.45 * TSMI + 0.25 * S_tenure + 0.15 * S_academic + 0.15 * S_seniority
  const ctriScore = Math.round(
    0.45 * tsmiScore +
    0.25 * tenureScore +
    0.15 * academicScore +
    0.15 * seniorityScore
  );

  // Factors breakdown
  const factors: CohortReadinessFactor[] = [];

  // TSMI factor
  factors.push({
    label: 'Skill Pre-requisites (TSMI)',
    effect: Math.round(0.45 * tsmiScore),
    description: `Resume keyword verification shows ${tsmiScore}% weighted alignment with target requirements`,
    type: tsmiScore >= 75 ? 'positive' : tsmiScore >= 40 ? 'neutral' : 'negative'
  });

  // Tenure alignment factor
  let tenureType: 'positive' | 'neutral' | 'negative' = 'neutral';
  let tenureDesc = '';
  if (t < M_cohort - 6) {
    tenureType = 'neutral';
    tenureDesc = `Current tenure of ${t}m is below the cohort typical transition window peak of ${M_cohort}m.`;
  } else if (t > M_cohort + 12) {
    tenureType = 'negative';
    tenureDesc = `Tenure of ${t}m exceeds typical cohort transition sweet spot (${M_cohort}m). Consider a move to avoid stagnation.`;
  } else {
    tenureType = 'positive';
    tenureDesc = `Current tenure of ${t}m aligns optimally with the cohort's prime transition window (${M_cohort}m).`;
  }
  factors.push({
    label: 'Tenure Window Alignment',
    effect: Math.round(0.25 * tenureScore),
    description: tenureDesc,
    type: tenureType
  });

  // Academic alignment factor
  factors.push({
    label: 'Academic Track Alignment',
    effect: Math.round(0.15 * academicScore),
    description: educationMatch
      ? 'Formal credentials match cohort entry requirements (+15% weight)'
      : 'Degree background is outside target technical domain (requires self-taught validation)',
    type: educationMatch ? 'positive' : 'negative'
  });

  // Seniority Match factor
  factors.push({
    label: 'Seniority Level Alignment',
    effect: Math.round(0.15 * seniorityScore),
    description: seniorityMatch
      ? 'Held progressive senior milestones (Senior, Lead, or Architect titles) in your timeline (+15% weight)'
      : 'Limited senior leadership titles in milestones (requires strategic positioning)',
    type: seniorityMatch ? 'positive' : 'neutral'
  });

  return {
    ctriScore,
    tsmiScore,
    tenureScore,
    academicScore,
    continuityScore: seniorityScore, // mapped to continuityScore field for schema compatibility
    cohortMedianTenure: M_cohort,
    matchedSkillsCount: 0, // calculated on frontend
    totalSkillsCount: 0,
    factors
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
  const dateRangeRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,./-]*\d{4}|\d{4}[\s,./-]*\d{2}|\b\d{4}\b)[\s,./-]*(?:to|and|-|â€“|â€”)[\s,./-]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,./-]*\d{4}|\d{4}[\s,./-]*\d{2}|\b\d{4}\b|\bPresent\b|\bCurrent\b)/i;
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
      headerText = headerText.replace(/^[\s,.:;â€¢/|()\-â€“â€”\[\]]+|[\s,.:;â€¢/|()\-â€“â€”\[\]]+$/g, '').trim();

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

      const separators = [/\s+at\s+/i, /\s+@\s+/, /\s*\|\s*/, /\s*â€“\s*/, /\s*â€”\s*/, /\s*-\s*/, /,\s*/];
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

      role = role.replace(/^[\s,.:;â€¢/|()\-â€“â€”\[\]]+|[\s,.:;â€¢/|()\-â€“â€”\[\]]+$/g, '').trim();
      organization = organization.replace(/^[\s,.:;â€¢/|()\-â€“â€”\[\]]+|[\s,.:;â€¢/|()\-â€“â€”\[\]]+$/g, '').trim();

      const descLines: string[] = [];
      const endSearchIdx = (idx < milestoneIndices.length - 1) ? milestoneIndices[idx + 1] : lines.length;
      for (let j = lineIdx + 1; j < endSearchIdx; j++) {
        const descLine = lines[j];
        if (descLine && !dateRangeRegex.test(descLine)) {
          descLines.push(descLine);
        }
      }
      
      // Build a professional description from extracted content, ensuring ~60 words minimum
      const rawDesc = descLines.join(' ').trim();
      
      // Determine type-based language for the role
      const typeStr = (() => {
        const ol = organization.toLowerCase();
        const rl = role.toLowerCase();
        if (ol.includes('university') || ol.includes('college') || ol.includes('institute') || rl.includes('bachelor') || rl.includes('master') || rl.includes('phd') || rl.includes('b.sc') || rl.includes('m.sc')) {
          return 'academic';
        } else if (ol.includes('sabbatical') || rl.includes('sabbatical') || rl.includes('independent research') || ol.includes('break')) {
          return 'sabbatical';
        }
        return 'employment';
      })();

      // Build a professional description from what we have, expanding if too short
      let description = rawDesc;

      const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

      if (wordCount(description) < 55) {
        // Supplement with professional context based on type and role
        if (typeStr === 'academic') {
          const degreePrefix = role.toLowerCase().includes('master') || role.toLowerCase().includes('m.sc') ? 'postgraduate' : 'undergraduate';
          const academicFill = `Pursued a ${degreePrefix} programme in ${role} at ${organization}, developing a strong foundation in core theoretical concepts and applied technical competencies. The programme emphasised analytical thinking, research methodology, and collaborative problem-solving across a structured academic curriculum. ${rawDesc ? rawDesc + '.' : ''}Graduated with comprehensive knowledge of the subject domain, preparing for industry application through practical project work and academic research.`;
          description = academicFill.trim();
        } else if (typeStr === 'sabbatical') {
          description = `Undertook a self-directed period of independent learning, research, and professional development as a ${role}. Invested time in deepening technical expertise, exploring emerging domain trends, and building new capabilities aligned with long-term career objectives. ${rawDesc ? rawDesc + '.' : ''}Applied structured study and self-initiated project work to maintain and extend professional competency during this independent phase.`.trim();
        } else {
          // Employment: construct a professional paragraph
          const nodeSkillsContext = detectedSkills
            .filter(s => {
              const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              const r = new RegExp(`\\b${escaped}\\b`, 'i');
              return r.test(role + ' ' + organization + ' ' + rawDesc);
            })
            .slice(0, 3)
            .join(', ');

          const skillSentence = nodeSkillsContext
            ? `Applied core competencies in ${nodeSkillsContext} to deliver quality outcomes.`
            : 'Applied strong technical and analytical skills to deliver results across key initiatives.';

          description = `Served as ${role} at ${organization}, ${rawDesc ? 'contributing to ' + rawDesc + '. ' : ''}taking end-to-end ownership of critical responsibilities and collaborating closely with cross-functional stakeholders to ensure project objectives were achieved on schedule and within quality standards. ${skillSentence} Demonstrated professional judgment and initiative in resolving technical challenges, consistently adding measurable value to the organisation.`.trim();
        }
      }

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
    const fallbackSkillSummary = detectedSkills.slice(0, 3).join(', ') || 'software engineering and technical systems';
    nodes.push({
      id: `parsed-profile-${Date.now()}`,
      role: defaultRole,
      organization: 'Independent / Candidate Profile',
      type: 'employment',
      startDate: '2024-01',
      endDate: 'Present',
      description: `Demonstrated expertise as a ${defaultRole} with a strong foundation in ${fallbackSkillSummary}. Applied technical knowledge and professional judgment to deliver quality outcomes across diverse projects, collaborating effectively with cross-functional stakeholders. Consistently maintained high standards of technical excellence, analytical problem-solving, and continuous learning to stay current with emerging industry trends and best practices.`,
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PEER COHORT & ANONYMIZED TRAJECTORY TYPES & ALGORITHM
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  pathSteps: string[];     // e.g. ["Tier-4 Startup SE (18m)", "Tier-2 Corp Senior (30m)", â€¦]
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LIVE CV TAILORING ENGINE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    const sumWeights = (skills: string[]) => skills.reduce((sum, s) => sum + (1 + (SKILL_DAG[s]?.rank ?? 0)), 0);
    const wMatched = sumWeights(matchedKeywords);
    const wRequired = sumWeights(requiredSkills);
    matchScore = wRequired > 0 ? Math.round((wMatched / wRequired) * 100) : 0;
    // Give a small boost if they have experience in the exact same field
    const hasRoleOverlap = nodes.some(n => n.role.toLowerCase().includes(normTarget) || normTarget.includes(n.role.toLowerCase()));
    if (hasRoleOverlap) matchScore = Math.min(100, matchScore + 10);
    matchScore = Math.min(100, matchScore);
  }

  logs.push(`[Live CV] Weighted Jaccard TSMI score calculated at ${matchScore}% based on skill rank dependencies.`);

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


