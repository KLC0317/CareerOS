import { CareerNode, JobPosting, PeerProfile, PeerMilestone, CompanyTier } from './careerEngine';

// Raw Resume Text for the Ingestion Matrix Left-Pane
export interface RawResumeChunk {
  id: string;
  title: string;
  text: string;
  highlightColor: string;
}

export const RAW_RESUME_CHUNKS: RawResumeChunk[] = [
  {
    id: 'chunk-1',
    title: 'Candidate Summary & Core Tech Stack',
    text: 'Highly motivated Software Engineer with 5+ years of experience specializing in web applications and AI. Core languages include Python and JavaScript. Deeply passionate about moving into AI Engineering and System Architecture roles.',
    highlightColor: 'border-blue-500 bg-blue-500/10'
  },
  {
    id: 'chunk-2',
    title: 'Experience: Grab (Jan 2022 - Jun 2024)',
    text: 'Role: Software Engineer II. Worked in the Passenger App team. Scaled core React Native applications and optimized performance. Integrated map services using TypeScript, JavaScript, and HTML/CSS. Led state management cleanups.',
    highlightColor: 'border-emerald-500 bg-emerald-500/10'
  },
  {
    id: 'chunk-3',
    title: 'Sabbatical: Independent AI Research (Jun 2024 - Nov 2024)',
    text: 'Took a self-directed career break to study modern deep learning models. Completed advanced coursework in Linear Algebra. Built personal vision and NLP projects using Python, PyTorch, and Linux environments.',
    highlightColor: 'border-amber-500 bg-amber-500/10'
  },
  {
    id: 'chunk-4',
    title: 'Experience: Petronas AI Division (Nov 2024 - Present)',
    text: 'Role: AI Specialist. Developing predictive maintenance models. Architecting distributed systems pipelines. Working with Cloud Computing infrastructure and PyTorch models. Interfacing with system design layers.',
    highlightColor: 'border-purple-500 bg-purple-500/10'
  },
  {
    id: 'chunk-5',
    title: 'Education: University of Malaya (Sep 2018 - Jul 2021)',
    text: 'Bachelor of Computer Science. Solid foundation in Software Engineering, Computer Networking, and Linux systems. Conducted a senior project in web application architecture.',
    highlightColor: 'border-pink-500 bg-pink-500/10'
  }
];

// Initial Career Nodes parsed from Resume
export const INITIAL_CAREER_NODES: CareerNode[] = [
  {
    id: 'node-education',
    role: 'B.Sc. Computer Science',
    organization: 'University of Malaya',
    type: 'academic',
    startDate: '2018-09',
    endDate: '2021-07',
    description: 'Bachelor of Computer Science. Specialized in Software Engineering and Computer Networking. Built base programming skills.',
    skills: [
      { name: 'JavaScript', level: 'Rank-1' },
      { name: 'Linux', level: 'Rank-1' },
      { name: 'Computer Networking', level: 'Rank-1' },
      { name: 'Software Engineering', level: 'Rank-1' }
    ]
  },
  {
    id: 'node-grab',
    role: 'Software Engineer II',
    organization: 'Grab',
    type: 'employment',
    startDate: '2022-01',
    endDate: '2024-06',
    description: 'Scaled core mobile/web passenger applications. Optimized render performance and implemented global state systems.',
    skills: [
      { name: 'JavaScript', level: 'Rank-1' },
      { name: 'TypeScript', level: 'Rank-1' },
      { name: 'HTML/CSS', level: 'Rank-1' },
      { name: 'State Management', level: 'Rank-1' }
    ]
  },
  {
    id: 'node-sabbatical',
    role: 'Independent AI Research',
    organization: 'Self-Directed Sabbatical',
    type: 'sabbatical',
    startDate: '2024-06',
    endDate: '2024-11',
    description: 'Sabbatical focused on AI transitioning. Completed advanced Linear Algebra, PyTorch, and deep learning tracks.',
    skills: [
      { name: 'Python', level: 'Rank-1' },
      { name: 'Linear Algebra', level: 'Rank-1' },
      { name: 'PyTorch', level: 'Rank-1' }
    ],
    sabbaticalSkills: ['Python', 'Linear Algebra', 'PyTorch'],
    achievements: [
      'Completed Deep Learning Specialization courses',
      'Built custom Object Detection pipelines on Linux VMs'
    ]
  },
  {
    id: 'node-petronas',
    role: 'AI Specialist',
    organization: 'Petronas',
    type: 'employment',
    startDate: '2024-11',
    endDate: 'Present',
    description: 'Developing deep learning algorithms for asset monitoring. Scaling Cloud Computing clusters and cloud pipelines.',
    skills: [
      { name: 'Deep Learning', level: 'Rank-2' },
      { name: 'Cloud Computing', level: 'Rank-1' },
      { name: 'PyTorch', level: 'Rank-1' }
    ]
  }
];

// 5 Representative Job Postings at Southeast Asian Regional Companies
export const MOCK_JOBS: JobPosting[] = [
  {
    id: 'job-1',
    role: 'AI Architect',
    company: 'Petronas Digital',
    location: 'Kuala Lumpur, Malaysia',
    salary: 'RM 15,000 - RM 22,000 / mo',
    requiredSkills: ['AI Architect', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems', 'Cloud Computing'],
    baseTransitionRate: 0.04,
    description: 'Lead the architectural design of Petronas core AI pipelines. Responsible for large-scale distributed training on cloud infrastructure and optimizing deep learning inference deployment.'
  },
  {
    id: 'job-2',
    role: 'Frontend Architect',
    company: 'Grab Tech',
    location: 'Singapore / KL (Hybrid)',
    salary: 'S$ 8,000 - S$ 12,000 / mo',
    requiredSkills: ['Frontend Architect', 'Advanced React', 'Performance Tuning', 'State Management', 'Browser Engines', 'Web Performance', 'TypeScript'],
    baseTransitionRate: 0.05,
    description: 'Own the web performance metrics and client-side architecture of Grab Transport products. Define global state guidelines, bundle optimization steps, and lead junior engineering squads.'
  },
  {
    id: 'job-3',
    role: 'Engineering Director',
    company: 'Sunway Group',
    location: 'Subang Jaya, Selangor',
    salary: 'RM 20,000 - RM 28,000 / mo',
    requiredSkills: ['Engineering Director', 'Technical Leadership', 'Product Strategy', 'Agile Delivery', 'System Design', 'Market Analysis', 'Communication'],
    baseTransitionRate: 0.03,
    description: 'Steer the engineering team in developing modern smart-city IoT solutions. Collaborate with product strategy stakeholders and shape technical delivery milestones across multiple business units.'
  },
  {
    id: 'job-4',
    role: 'Senior Deep Learning Engineer',
    company: 'MIMOS Berhad',
    location: 'Bukit Jalil, KL',
    salary: 'RM 12,000 - RM 17,000 / mo',
    requiredSkills: ['Deep Learning', 'PyTorch', 'Linear Algebra', 'Python', 'Linux'],
    baseTransitionRate: 0.045,
    description: 'Design and deploy production-grade computer vision models for national smart monitoring initiatives. Involves PyTorch modeling, dataset curation, and edge hardware deployment.'
  },
  {
    id: 'job-5',
    role: 'Senior React Developer',
    company: 'Carsome Tech',
    location: 'Mutiara Damansara, PJ',
    salary: 'RM 9,000 - RM 14,000 / mo',
    requiredSkills: ['Advanced React', 'State Management', 'TypeScript', 'JavaScript', 'HTML/CSS'],
    baseTransitionRate: 0.055,
    description: 'Build fast, high-conversion web portals for automotive e-commerce. Work closely with UI designers and optimize state management performance.'
  }
];

// Employer Workspace Workforce Data (for Retention Churn Signal dashboard)
export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  tenureMonths: number;
  skills: string[];
  targetPathSkills: string[];
}

export const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-1',
    name: 'Ahmad Rafiq',
    role: 'Senior AI Engineer',
    tenureMonths: 23, // approaching peak transition risk (24 months)
    skills: ['Python', 'Linear Algebra', 'PyTorch', 'Deep Learning'],
    targetPathSkills: ['AI Architect']
  },
  {
    id: 'emp-2',
    name: 'Sarah Lim',
    role: 'React Engineer',
    tenureMonths: 35, // past peak, very high flight hazard if static
    skills: ['JavaScript', 'HTML/CSS', 'TypeScript', 'State Management'],
    targetPathSkills: ['Frontend Architect']
  },
  {
    id: 'emp-3',
    name: 'Daniel Raj',
    role: 'Engineering Manager',
    tenureMonths: 11, // low tenure, low transition risk
    skills: ['Communication', 'Software Engineering', 'System Design', 'Agile Delivery', 'Technical Leadership'],
    targetPathSkills: ['Engineering Director']
  },
  {
    id: 'emp-4',
    name: 'Nisha Amin',
    role: 'Junior Web Dev',
    tenureMonths: 8, // early stage
    skills: ['JavaScript', 'HTML/CSS'],
    targetPathSkills: ['Advanced React']
  },
  {
    id: 'emp-5',
    name: 'Marcus Chen',
    role: 'Cloud Architect',
    tenureMonths: 26, // high risk transition
    skills: ['Linux', 'Computer Networking', 'Cloud Computing', 'Distributed Systems', 'System Architecture'],
    targetPathSkills: ['AI Architect']
  }
];

// ──────────────────────────────────────────────────────────────
// SEEDED PRNG (for deterministic mock data across reloads)
// ──────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ──────────────────────────────────────────────────────────────
// 1,000 ANONYMIZED PEER RESUME PROFILES
// ──────────────────────────────────────────────────────────────

const PEER_TARGET_ROLES = [
  'AI Architect', 'Frontend Architect', 'Engineering Director',
  'Data Scientist', 'ML Engineer', 'DevOps Lead', 'Cloud Architect',
  'Backend Architect', 'Product Manager', 'Mobile Lead',
  'Security Engineer', 'Platform Engineer', 'Full-Stack Lead',
  'QA Automation Lead', 'Site Reliability Engineer'
];

const PEER_ENTRY_ROLES = [
  'Junior Developer', 'Software Engineer', 'Graduate Trainee',
  'Intern', 'Associate Engineer', 'Junior Data Analyst',
  'Frontend Developer', 'Backend Developer', 'IT Support',
  'Web Developer', 'QA Tester', 'Systems Administrator'
];

const PEER_MID_ROLES = [
  'Software Engineer II', 'Senior Developer', 'Tech Lead',
  'Senior Frontend Engineer', 'Senior Backend Engineer',
  'Data Engineer', 'ML Engineer', 'DevOps Engineer',
  'Product Analyst', 'Solutions Architect', 'Scrum Master',
  'Engineering Manager', 'Senior QA Engineer', 'Cloud Engineer'
];

const PEER_SENIOR_ROLES = [
  'Staff Engineer', 'Principal Engineer', 'VP Engineering',
  'Director of Engineering', 'Chief Architect', 'Head of AI',
  'Distinguished Engineer', 'CTO', 'Head of Product',
  'Lead Architect', 'Engineering Fellow'
];

const COMPANY_TIERS: CompanyTier[] = [
  'Tier-1 Tech Giant', 'Tier-2 Corporate', 'Tier-3 Growth-Stage',
  'Tier-4 Startup', 'Tier-5 Freelance/Agency'
];

const GEO_LOCATIONS = [
  'Kuala Lumpur, MY', 'Singapore, SG', 'Jakarta, ID', 'Bangkok, TH',
  'Ho Chi Minh City, VN', 'Manila, PH', 'Penang, MY', 'Johor Bahru, MY',
  'Bangalore, IN', 'Sydney, AU', 'Remote (APAC)', 'Taipei, TW',
  'Seoul, KR', 'Tokyo, JP', 'Shenzhen, CN'
];

const ALL_SKILLS = [
  'Python', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems',
  'Cloud Computing', 'Linear Algebra', 'Linux', 'Computer Networking', 'Advanced React',
  'Performance Tuning', 'State Management', 'Browser Engines', 'Web Performance',
  'TypeScript', 'JavaScript', 'HTML/CSS', 'Technical Leadership', 'Product Strategy',
  'Agile Delivery', 'System Design', 'Market Analysis', 'Communication', 'Software Engineering',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'PostgreSQL', 'MongoDB', 'Redis',
  'GraphQL', 'REST APIs', 'CI/CD', 'Terraform', 'Go', 'Rust', 'Java', 'C++',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'TensorFlow', 'NLP',
  'Computer Vision', 'Data Pipelines', 'Apache Spark', 'Kafka', 'Elasticsearch'
];

const DEGREE_TYPES = [
  'B.Sc. Computer Science', 'B.Eng. Software Engineering', 'B.Sc. Information Technology',
  'B.Sc. Data Science', 'B.Sc. Electrical Engineering', 'B.A. Information Systems',
  'M.Sc. Computer Science', 'M.Sc. Artificial Intelligence', 'M.Eng. Software Engineering',
  'Ph.D. Computer Science', 'Diploma in IT', 'B.Sc. Mathematics'
];

function generatePeerResumes(count: number): PeerProfile[] {
  const rng = mulberry32(42);
  const peers: PeerProfile[] = [];

  for (let i = 0; i < count; i++) {
    const id = `peer-${String(i + 1).padStart(4, '0')}`;
    const targetRole = seededPick(PEER_TARGET_ROLES, rng);
    const geo = seededPick(GEO_LOCATIONS, rng);
    const reachedTarget = rng() < 0.62; // 62% success rate

    const milestones: PeerMilestone[] = [];
    let totalMonths = 0;

    // Academic phase
    const degreeYears = rng() < 0.15 ? 5 : (rng() < 0.3 ? 2 : 3);
    const degreeMonths = degreeYears * 12;
    milestones.push({
      role: seededPick(DEGREE_TYPES, rng),
      companyTier: 'Tier-2 Corporate' as CompanyTier, // Universities are Tier-2 level
      type: 'academic',
      durationMonths: degreeMonths,
      skills: seededShuffle(ALL_SKILLS, rng).slice(0, 2 + Math.floor(rng() * 3))
    });
    totalMonths += degreeMonths;

    // Employment milestones (2-5 career hops)
    const hopCount = 2 + Math.floor(rng() * 4);
    for (let h = 0; h < hopCount; h++) {
      const tenure = 8 + Math.floor(rng() * 40); // 8-47 months
      const isEarly = h === 0;
      const isMid = h >= 1 && h < hopCount - 1;
      const isSenior = h === hopCount - 1 && reachedTarget;

      let role: string;
      let tier: CompanyTier;

      if (isEarly) {
        role = seededPick(PEER_ENTRY_ROLES, rng);
        tier = seededPick(['Tier-4 Startup', 'Tier-3 Growth-Stage', 'Tier-5 Freelance/Agency'] as CompanyTier[], rng);
      } else if (isSenior) {
        role = seededPick(PEER_SENIOR_ROLES, rng);
        tier = seededPick(['Tier-1 Tech Giant', 'Tier-2 Corporate'] as CompanyTier[], rng);
      } else {
        role = seededPick(PEER_MID_ROLES, rng);
        tier = seededPick(COMPANY_TIERS, rng);
      }

      const skillCount = 2 + Math.floor(rng() * 5);
      milestones.push({
        role,
        companyTier: tier,
        type: 'employment',
        durationMonths: tenure,
        skills: seededShuffle(ALL_SKILLS, rng).slice(0, skillCount)
      });
      totalMonths += tenure;

      // 15% chance of sabbatical between jobs
      if (isMid && rng() < 0.15) {
        const sabbaticalMonths = 2 + Math.floor(rng() * 8);
        milestones.push({
          role: seededPick(['Career Break', 'Independent Study', 'Open Source Sabbatical', 'Travel & Research'], rng),
          companyTier: 'Tier-5 Freelance/Agency',
          type: 'sabbatical',
          durationMonths: sabbaticalMonths,
          skills: seededShuffle(ALL_SKILLS, rng).slice(0, 1 + Math.floor(rng() * 3))
        });
        totalMonths += sabbaticalMonths;
      }
    }

    // Aggregate all unique skills
    const allSkills = Array.from(new Set(milestones.flatMap(m => m.skills)));

    peers.push({
      id,
      targetRole,
      reachedTarget,
      geo,
      totalExperienceMonths: totalMonths,
      milestones,
      skills: allSkills
    });
  }

  return peers;
}

// ──────────────────────────────────────────────────────────────
// 250 DYNAMIC JOB OPENINGS
// ──────────────────────────────────────────────────────────────

const JOB_ROLE_TEMPLATES = [
  { role: 'AI Engineer', skills: ['Python', 'Deep Learning', 'PyTorch', 'Linux', 'Cloud Computing'] },
  { role: 'AI Architect', skills: ['System Architecture', 'Deep Learning', 'Distributed Systems', 'Cloud Computing', 'Python'] },
  { role: 'ML Engineer', skills: ['Python', 'TensorFlow', 'PyTorch', 'Data Pipelines', 'AWS'] },
  { role: 'Senior Frontend Developer', skills: ['Advanced React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'State Management'] },
  { role: 'Frontend Architect', skills: ['Advanced React', 'Performance Tuning', 'Browser Engines', 'Web Performance', 'TypeScript'] },
  { role: 'Full-Stack Engineer', skills: ['TypeScript', 'JavaScript', 'REST APIs', 'PostgreSQL', 'HTML/CSS'] },
  { role: 'Backend Engineer', skills: ['Java', 'PostgreSQL', 'REST APIs', 'Docker', 'Kubernetes'] },
  { role: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'AWS'] },
  { role: 'Cloud Architect', skills: ['AWS', 'GCP', 'Azure', 'Terraform', 'Cloud Computing'] },
  { role: 'Site Reliability Engineer', skills: ['Linux', 'Kubernetes', 'Docker', 'CI/CD', 'Cloud Computing'] },
  { role: 'Data Scientist', skills: ['Python', 'Linear Algebra', 'Deep Learning', 'Apache Spark', 'Data Pipelines'] },
  { role: 'Data Engineer', skills: ['Python', 'Apache Spark', 'Kafka', 'PostgreSQL', 'Data Pipelines'] },
  { role: 'Engineering Manager', skills: ['Technical Leadership', 'Agile Delivery', 'Communication', 'System Design', 'Product Strategy'] },
  { role: 'Engineering Director', skills: ['Technical Leadership', 'Product Strategy', 'System Design', 'Market Analysis', 'Communication'] },
  { role: 'Product Manager', skills: ['Product Strategy', 'Market Analysis', 'Communication', 'Agile Delivery', 'System Design'] },
  { role: 'Mobile Developer', skills: ['React Native', 'TypeScript', 'JavaScript', 'REST APIs', 'State Management'] },
  { role: 'iOS Developer', skills: ['Swift', 'REST APIs', 'State Management', 'CI/CD', 'System Design'] },
  { role: 'Android Developer', skills: ['Kotlin', 'Java', 'REST APIs', 'State Management', 'CI/CD'] },
  { role: 'Platform Engineer', skills: ['Go', 'Kubernetes', 'Docker', 'Terraform', 'Linux'] },
  { role: 'Security Engineer', skills: ['Linux', 'Computer Networking', 'Cloud Computing', 'Docker', 'CI/CD'] },
  { role: 'NLP Engineer', skills: ['Python', 'NLP', 'Deep Learning', 'PyTorch', 'Linux'] },
  { role: 'Computer Vision Engineer', skills: ['Python', 'Computer Vision', 'PyTorch', 'Deep Learning', 'Linux'] },
  { role: 'QA Automation Engineer', skills: ['JavaScript', 'TypeScript', 'CI/CD', 'Docker', 'REST APIs'] },
  { role: 'Solutions Architect', skills: ['System Architecture', 'Cloud Computing', 'AWS', 'System Design', 'Communication'] },
  { role: 'Technical Lead', skills: ['TypeScript', 'System Design', 'Technical Leadership', 'Agile Delivery', 'Software Engineering'] }
];

const SALARY_RANGES_RM = [
  'RM 4,000 – RM 6,500 / mo', 'RM 5,500 – RM 8,000 / mo', 'RM 7,000 – RM 10,000 / mo',
  'RM 8,500 – RM 13,000 / mo', 'RM 10,000 – RM 15,000 / mo', 'RM 12,000 – RM 18,000 / mo',
  'RM 15,000 – RM 22,000 / mo', 'RM 18,000 – RM 28,000 / mo', 'RM 22,000 – RM 35,000 / mo'
];

const SALARY_RANGES_SGD = [
  'S$ 4,500 – S$ 6,500 / mo', 'S$ 5,500 – S$ 8,000 / mo', 'S$ 7,000 – S$ 10,000 / mo',
  'S$ 8,000 – S$ 12,000 / mo', 'S$ 9,500 – S$ 14,000 / mo', 'S$ 11,000 – S$ 16,000 / mo',
  'S$ 13,000 – S$ 20,000 / mo', 'S$ 16,000 – S$ 25,000 / mo'
];

const JOB_COMPANIES_ANONYMOUS = [
  'Tech Giant (FAANG-tier)', 'Leading E-commerce Platform', 'Regional Super-App',
  'National Oil & Gas Corp', 'Digital Banking Group', 'Fintech Unicorn',
  'Automotive Tech Marketplace', 'Telecom Provider', 'Government Research Institute',
  'AI-First Startup', 'SaaS Scale-Up', 'Cybersecurity Firm',
  'EdTech Platform', 'HealthTech Innovator', 'Logistics Technology Co.',
  'Cloud Infrastructure Provider', 'Gaming Studio', 'InsurTech Company',
  'AgriTech Startup', 'PropTech Scale-Up', 'Media & Entertainment Corp',
  'Semiconductor Manufacturer', 'Consulting Firm', 'Systems Integrator',
  'Defence Contractor', 'Smart City Initiative'
];

const JOB_LOCATIONS = [
  'Kuala Lumpur, Malaysia', 'Singapore (Hybrid)', 'Penang, Malaysia',
  'Johor Bahru, Malaysia', 'Cyberjaya, Malaysia', 'Petaling Jaya, Malaysia',
  'Jakarta, Indonesia', 'Bangkok, Thailand', 'Ho Chi Minh City, Vietnam',
  'Manila, Philippines', 'Remote (APAC)', 'Bangalore, India',
  'Sydney, Australia', 'Taipei, Taiwan', 'Seoul, South Korea'
];

const JOB_DESCRIPTIONS = [
  'Design and implement production-grade systems. Work across teams to ship high-quality software.',
  'Lead architectural decisions and mentor junior engineers. Drive technical excellence.',
  'Build scalable distributed services handling millions of requests per day.',
  'Optimize performance-critical paths and reduce latency across the stack.',
  'Develop AI/ML models for predictive analytics and intelligent automation.',
  'Architect cloud-native applications on modern infrastructure.',
  'Drive agile delivery across cross-functional product engineering teams.',
  'Build and maintain CI/CD pipelines for rapid, reliable deployments.',
  'Design intuitive, performant user interfaces for consumer-facing products.',
  'Implement data pipelines processing terabytes of data daily.',
  'Conduct market research and translate business requirements into technical solutions.',
  'Manage engineering teams and establish technical roadmaps aligned with business goals.'
];

function generateJobOpenings(count: number): JobPosting[] {
  const rng = mulberry32(137);
  const jobs: JobPosting[] = [];

  for (let i = 0; i < count; i++) {
    const template = seededPick(JOB_ROLE_TEMPLATES, rng);
    const location = seededPick(JOB_LOCATIONS, rng);
    const isSG = location.includes('Singapore');
    const salary = isSG ? seededPick(SALARY_RANGES_SGD, rng) : seededPick(SALARY_RANGES_RM, rng);
    const company = seededPick(JOB_COMPANIES_ANONYMOUS, rng);

    // Slightly randomize skill requirements by adding 0-2 extra skills
    const extraSkills = seededShuffle(ALL_SKILLS, rng).filter(s => !template.skills.includes(s)).slice(0, Math.floor(rng() * 3));
    const requiredSkills = [...template.skills, ...extraSkills];

    // Add seniority prefix with some probability
    let role = template.role;
    if (rng() < 0.25) role = 'Senior ' + role;
    else if (rng() < 0.1) role = 'Lead ' + role;
    else if (rng() < 0.08) role = 'Principal ' + role;

    jobs.push({
      id: `job-gen-${String(i + 1).padStart(4, '0')}`,
      role,
      company,
      location,
      salary,
      requiredSkills,
      baseTransitionRate: 0.02 + rng() * 0.06,
      description: seededPick(JOB_DESCRIPTIONS, rng)
    });
  }

  return jobs;
}

// Generate once on module load
export const GENERATED_PEERS: PeerProfile[] = generatePeerResumes(1000);
export const GENERATED_JOBS: JobPosting[] = generateJobOpenings(250);
