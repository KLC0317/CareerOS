# Career OS — Next-Generation Career Trajectory Engine

Career OS is a professional, high-fidelity career planning and intelligence platform designed to help professionals navigate transitions, audit skill dependencies, and gain cohort-driven career insights. 

Built for **TalentBank**, this system models career paths using an interactive, graph-based visual interface and simulated statistical analytics.

---

## 🌟 Core Features

### 1. Skill Dependency & Pathway Navigation
* **Interactive Skill Graph**: Visually traces career prerequisites and learning tracks using a custom-engineered DAG (Directed Acyclic Graph) of technical proficiencies.
* **Progress Visualization**: Color-coded node system representing verified skills (green), peer targets (purple), planned skills (teal), and active goals (blue).
* **Pre-requisite Traversal**: Click on any advanced node to instantly highlight its foundational pre-requisites and dependencies with animated, flowing connection paths.

### 2. Cohort Insights & Blueprint Auditing
* **Anonymized Peer blueprints**: Audit real, anonymized career pathways and timeline stats from professionals targeting the same roles.
* **Country-based Filters**: Refine cohort analytics using geographic filters to see regional success rates and average transition periods.
* **Timeline Visualization**: Compare your current trajectory with peer timelines, highlighting typical durations between seniority levels.

### 3. AI Search Assistant & Employer Portal
* **Candidate Sourcing**: A mock AI-powered candidate search console that allows employers to query competencies and academic criteria.
* **Profile Audits**: Explores cohort competency distributions, candidate status trackers, and pipeline metrics.
* **Seamless Persona Swapping**: Toggle dynamically between **Candidate View**, **Job Openings**, and the **Employer Portal** directly from the header navigation.

### 4. Interactive Onboarding & Trajectory Planning
* **Multi-Step Onboarding Wizard**: Tailors the platform to the user's specific target role, current experience, and technical focus area.
* **Premium Upgrades**: Simulated premium subscription tier offering advanced cohort metrics and automated trajectory advice.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
* **Styling**: Tailwind CSS v4, custom utility classes for absolute light/dark mode contrast consistency
* **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid transitions, layout changes, and dynamic interactive overlays
* **Icons**: [Lucide React](https://lucide.dev/) for cohesive iconography
* **Typography**: Geist Sans & Geist Mono (Vercel's optimized font families)

---

## 📂 Architecture & Key Components

* `app/page.tsx`: The primary application hub managing routing, state shells, profile context rendering, and core layouts.
* `components/SkillActivationMap.tsx`: The core visual engine. Contains the SVG graph renderer, connection animation styling, cohort analysis panels, and interactive filters.
* `components/EmployerDashboard.tsx`: Dashboard containing recruitment pipelines, status updates, and the AI Search Assistant.
* `components/OnboardingWizard.tsx`: The user setup workflow managing profile generation and initial target role selections.
* `hooks/useCareerEngine.tsx`: The state management layer. Coordinates mock database APIs, user authentication, profile saves, and session logic.
* `lib/careerEngine.ts` & `lib/mockData.ts`: Core data schemas including the `SKILL_DAG` definition and pre-populated peer data profiles.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### Installation
1. Clone the repository and navigate into the root directory:
   ```bash
   cd CareerOS
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Application
To run the development server locally:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📐 Custom Trajectory Engine Details

### Spreading Activation Traversal
The skill graph is modeled as a Directed Acyclic Graph (DAG) with ranks representing progression from **Foundations** (Rank 0) through **Specializations** (Rank 3). When selecting any advanced node, the system traverses backwards recursively to find all upstream dependencies using:
```typescript
function getPreRequisitesRecursive(skillName: string): string[]
```
This enables real-time guidance on what foundational skills must be mastered before taking on advanced specializations.
