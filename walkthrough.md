# Career OS UI, Auth, and Onboarding System Walkthrough

We have successfully built and verified the core components of **Career OS**: a next-generation trajectory mapping and transition forecasting application featuring secure PostgreSQL database persistence, interactive client-side simulations, and a fully automated Onboarding Wizard.

---

## 1. Onboarding Wizard & OCR Resume Analysis

The Onboarding Wizard isolates new profiles when registering, guiding them through a high-fidelity intake process before accessing the career workspace dashboards:

### A. Step 1: Simulated OCR Parser
- **Flexible Ingestion**: Accept PDF, TXT, or Word files, or direct unstructured text pastes.
- **Dynamic Text Analysis**: A local heuristics engine scans the intake text for:
  - **Malaysian / Southeast Asian Organizations**: e.g., Grab, Petronas, Shopee, Carsome, Maxis, Maybank, University of Malaya, etc.
  - **Custom Companies**: Extracts patterns following "work at", "developer at", "engineer at", etc.
  - **Job Titles**: Maps titles like Software Engineer, AI Specialist, Team Lead, etc.
  - **Chronological Intervals**: Extracts years using regex patterns to establish start and end dates.
  - **Associated Skills**: Cross-references against the core `SKILL_DAG` nodes.
- **Laser-Scanning Animation**: Renders a vertical moving glow bar over a mock document sheet alongside a real-time parsing terminal console.
- **Tailored Console Output**: Logs update dynamically based on the specific organizations, roles, and skills detected in the user's resume.

### B. Step 2: Milestone Verification Form
- Displays a clean checklist of parsed academic, sabbatical, and employment milestones.
- Enables the user to manually edit roles, companies, dates, descriptions, or add/remove associated skills from the `SKILL_DAG`.

### C. Step 3: Trajectory Selection with Smart Recommendations
- The analysis engine computes scores for the three pathways based on skill matches and keywords:
  - **AI Architect**
  - **Frontend Architect**
  - **Engineering Director**
- Highlights the best-fit track with a prominent `★ Recommended` badge in Step 3.
- Clicking "Launch Career OS" writes the target role and parsed milestones into PostgreSQL.

---

## 2. PostgreSQL Database Schema & Persistence

All candidate profiles and trajectories are securely stored in the PostgreSQL database on your VPS.

- **`users` Table**: Tracks user account credentials, password hashes (compiled with 10-round bcrypt), reset tokens, and `target_role` (defaults to `'PENDING_ONBOARDING'`).
- **`milestones` Table**: Houses parsed and verified career nodes referencing `users(id)`. Stores metadata like start date, end date, role, company, type, and associated skills as structured JSONB.
- **`profile_versions` Table**: Stores the snapshots of candidates' career profiles (milestones and target pathways) to support auditing, multiple uploads, and version restoration/rollbacks.
- **Onboarding Synchronizer**: the `onboard/route.ts` API endpoint handles atomic onboarding updates. It clears any prior milestones and pushes the newly reviewed list to the database, switching the user out of the pending onboarding state.
- **Resilient Fallback Mode**: If PostgreSQL is offline, Career OS seamlessly falls back to a browser-encrypted cookie/React state database, printing warning indicators in the header but remaining fully functional.

---

## 3. UI, Animation, and Color Design

The application's theme and visual design have been updated for a premium, growth-oriented aesthetic:
- **Palette**: Trustworthy Blue-Teal accents (`#2563EB` and `#14B8A6`) with Green success points (`#22C55E`) and crisp light backgrounds (`#F8FAFC`).
- **Skill Activation Map**: Smoothly glides SVG nodes when center tracks are changed. Shows flowing green dashes for met requirements and teal dashes for planned paths.
- **Forecasting Simulator**: Trajectory curves animate with speed-scaled flowing particles that move faster or slower based on the transition probability.
- **Retention Churn Charts**: Hazard curve pools bend and locator dots glide organically on the Employer Dashboard when evaluating workforce flight risks.

---

## 4. Build & Verification Status

The project compiles cleanly with zero TypeScript or Turbopack bundling errors.

```text
▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 3.9s
  Running TypeScript ...
  Finished TypeScript in 8.1s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (12/12) ...
✓ Generating static pages in 452ms
  Finalizing page optimization ...
```

---

## 5. Bug Fixes & Correctness Audits

- **Database Node ID Casting**: 
  - **Issue**: SQL primary keys for user milestones return as integers (`number`) at runtime. When the frontend timeline canvas executed `.split('-')` on the node ID to calculate hover state mappings, it threw a browser crash: `TypeError: node.id.split is not a function`.
  - **Solution**: Cast milestone IDs to strings at the API boundary in [login/route.ts](file:///d:/CareerOS/app/api/auth/login/route.ts) using `.map()` and added a safe-type check in [TemporalCanvas.tsx](file:///d:/CareerOS/components/TemporalCanvas.tsx) ensuring the ID string contains a hyphen before splitting.

- **Candidate Dashboard Import Clashing**:
  - **Issue**: Duplicate React, useState, useCareerEngine, and Lucide icon import statements at the top of [CandidateDashboard.tsx](file:///d:/CareerOS/components/CandidateDashboard.tsx) prevented Next.js from compiling the dashboard, throwing TypeScript redeclaration errors and returning 500 error pages.
  - **Solution**: Removed duplicate block of code and merged imports into a single clean set.

- **Auto-populating Version History for Existing Users**:
  - **Issue**: Candidates who registered/onboarded prior to the introduction of the version control schema had no records in the `profile_versions` table, displaying an empty timeline history.
  - **Solution**: Implemented a dynamic query check on the GET endpoint of `/api/profile/versions` which automatically checks for existing milestones and back-populates a "Version 1" snapshot record in `profile_versions` if no versions are found.

- **API Configurations**:
  - **Issue**: `GEMINI_API_KEY` was missing from `.env.local`, causing confusion on how to configure the Gemini integration.
  - **Solution**: Populated `.env.local` with a clear placeholder template: `GEMINI_API_KEY="YOUR_GEMINI_API_KEY"`.

---

## 6. Gemini Geo-Location & Market Pathway Integration

We have integrated a location-aware career recommendation system powered by Gemini:

- **Geo-Location Detection**: The `gemini-3.1-flash-lite` model extracts the applicant's location (or infers it from education and company hubs listed on their resume) during the scan phase.
- **Regional Market Analysis**: The model conducts a local market technology demand assessment specifically focused on the target pathway.
- **SQL Schema Alterations**: 
  - Automatically migrates existing tables to append `market_analysis TEXT` to both the `users` and `profile_versions` tables on the VPS database.
- **Automatic Back-Population for Existing Profiles**:
  - If a pre-existing user logs in, our GET `/api/profile/versions` endpoint automatically computes and updates their profile and Version 1 history records with a localized Southeast Asian tech market default matching their target pathway.
- **Fully Dynamic Roles**:
  - Replaced the strict constraint requiring candidates to select one of three pre-defined pathways ("AI Architect", "Frontend Architect", "Engineering Director"). The Gemini prompt now requests custom recommended roles dynamically suited to the resume details.
  - Replaced dropdown elements and hardcoded radio loops with dynamic AI-recommended selector cards and customizable free-text input fields in both the Onboarding Wizard (Step 3) and the Candidate Dashboard settings. Candidates can now type or edit *any* target technical career role.
- **UI Integration**:
  - **Onboarding Wizard**: Step 3 renders a beautifully styled **AI Regional Market Intelligence** card showing the candidate's detected region, local tech demand outlook details, and path suitability justification.
  - **Candidate Dashboard**: Shows a permanent **Active Path Market Insights** card displaying the regional tech outlook, alongside geo tags (e.g. `📍 Malaysia (Inferred)`) on each historical upload item in their version timeline.

---

## 7. Cohort Filter Controls & Traversal Map Interactivity UX Redesign

We redesigned the Traversal Map tab to provide professional-grade filter controls and fluid interactive feedback:

- **Clean Emoji Cleanup**: Removed all legacy rocket `🚀` emojis from cohort pathway headers, CTA unlock panels, and reveal buttons to align with a sleek, enterprise-ready look.
- **Country-Only Filter**: Simplified cohort filter controls in the sidebar to only include a clean **Country dropdown select** (scanning the matching cohort profiles for country geos dynamically) and removed the redundant status and experience filters.
- **Differentiated Header Navigation**:
  - **Removed Reset View**: Deleted the "Reset View" button from the traversal map control panel.
  - **Relocated Sidebar Toggle**: Moved the "Collapse Insights / View Cohort Insights" toggle button from the right side of the header to the left side (immediately adjacent to the map title). Separated it with a vertical divider line (`span h-4 w-px bg-slate-200`) and styled it with distinct blue borders/bg so it is visually separate and conceptualized differently from the grey/slate pathway track selectors on the right.
- **Traversal Map Node Highlight Focus**:
  - **Stable Target Paths**: Disconnected the node-click click event from modifying the target track/cohort selection (`selectedSkillPath`). This prevents the graph from collapsing to a single node when clicked.
  - **Spreading Activation Focus**: Clicking a node sets a local `selectedMapNode` focus state. Unrelated nodes and connections fade out to a subtle `0.25` opacity, while the clicked node and its recursive prerequisites path glow brightly.
  - **Easy Deselect Reset**: Users can click the SVG background area to clear the map focus, or click the active node a second time to toggle it off.
  - **Detailed Focus Inspect Box**: When a node is clicked, an dynamic inspect card displays below the map, showing the node rank, candidate verification status, and the precise count of peers in the filtered cohort that have acquired this skill.
  - **Visual Badges on Peer Cards**: While a skill is focused, every candidate card in the cohort sidebar displays a color-coded tag showing whether that candidate possesses the focused skill (e.g., `✓ Has Distributed Systems` in purple vs `× Lacks Distributed Systems` in grey), making trajectory comparison incredibly fast and intuitive.

---

## 8. Catchy Technical Renaming & Timeline Cleanups

We updated titles and mathematical labels across key components to be more professional, interesting, and easy to understand:

### A. Skill Activation Map (`components/SkillActivationMap.tsx`)
- `Spreading Activation Traversal Map` -> **`Skill Dependency Map`**
- `Cohort Career Insights Offline` -> **`Cohort Insights Offline`**
- `Wanna See How Others Do?` -> **`Compare Cohort Career Paths`**
- `Anonymous Trajectories` -> **`Peer Career Pathways`**
- `Select Profile` -> **`Compare Blueprints`**
- `Anomaly Audit Analysis` -> **`Skill Gap Audit`**
- `General Trajectory Advice` -> **`Career Path Advisory`**
- `Spreading Activation Traversal` -> **`Skill Pathway Navigation`**
- **Enlarged Layout**: Increased the graph SVG height rendering space to `480px` (from `360px`) and sidebar list view containers to `320px` / `500px` (from `190px` / `380px`) to significantly expand the visual viewport.
- **Personalized Greeting Hook Banner**: Added a gradient banner at the top greeting the candidate by name (e.g., `Hi, Kian Lok! 🎯`) and noting their current active track alongside emerging alternative paths (e.g., if targeting *AI Architect*, the banner highlights *Frontend Architect* and *Engineering Director* as emerging alternatives).

### B. Temporal Canvas (`components/TemporalCanvas.tsx`)
- **Milestone Timeline Removal**: Completely removed the redundant and cluttered horizontal "Milestone Career Timeline" (TemporalCanvas timeline view) from the Traversal Map tab, prioritizing the main enlarged interactive skill path map and peer insights column.

### C. Forecasting Simulator (`components/ForecastingSimulator.tsx`)
- `Stochastic Forecasting Simulator` -> **`Career Transition Simulator`**
- `Semi-Markov Covariates` -> **`Simulation Parameters`**
- `Transition Branching Tree` -> **`Role Transition Tree`**
- `"Show Your Work" Diagnostics` -> **`Transition Formula Audit`**
- Covariates variable descriptions updated from mathematical terms to clean career-factor definitions.

### D. Enterprise Emoji Polish (Professionalization)
- Removed all raw emojis from user-facing screens and control headers, replacing them with professional, styled Lucide icons (`Globe`, `MapPin`, `FileText`, `BarChart3`, `TrendingUp`, `Users`, `Briefcase`, `Compass`, `Brain`, `Building2`, `ShieldCheck`, `Clock`, `Target`, `Zap`, `AlertCircle`) to elevate the interface.

---

## 9. Live CV Resume Builder & Interactive AI Realignment Agent

We have implemented a fully interactive Live CV and Resume Builder with complete content preservation, real database snapshot saving, and typing simulations:

- **Original Resume PDF & Text Storage**:
  - Modified `app/api/auth/onboard` and `/api/profile/versions` to store base64 Data URLs and tailored resume text layouts directly inside the database `users` and `profile_versions` tables under the `pdf_data` column.
  - Client-side file uploading now parses file contents via a `FileReader` as base64 strings and binds them to the active user session metadata.
- **Content-Preserving AI Realignment Engine**:
  - Upgraded `tailorCVForTarget` in `lib/careerEngine.ts` to retain the exact roles, descriptions, and accomplishments of candidate milestones uploaded by the user, rather than overwriting them with generic mock values.
  - Highlighted realignment segments using soft green inline backgrounds (`[[OPT:...]]`) to visually show where the AI agent adjusted their experience.
- **Interactive AI Agent Realignment Dashboard**:
  - Replaced the passive insights panel with a command console containing a **matching Relevance Dial**, a **custom constraints textarea** (where users can instruct the agent, e.g. "emphasize cloud security architecture"), and a **step progress checklist** (Scan, Recontextualize, Live Type, Commit to DB).
  - Shows a glowing alert banner instructing users to trigger a realignment sweep whenever their target pathway diverges from the resume's active state.
- **High-Fidelity Realignment Simulations**:
  - Clicking "Align Now" or "Optimize Resume" triggers a horizontal neon scanning laser sweep that glides down the resume page.
  - Types out the tailored texts word-by-word with a blinking terminal block cursor (`█`) in the professional summary, titles, and accomplishments list.
  - Ticks up the match relevance gauge and streams detailed step-by-step logs through a styled terminal block console.
  - Automatically triggers a database commit of the compiled tailored resume text to the PostgreSQL snapshot history upon completion of the typewriter run.
- **Premium Skeleton Placeholders for Empty States**:
  - If a user starts with an empty profile or clears all milestones, the resume canvas renders beautifully styled dashed skeleton cards (suggesting "Your Role Title", "Organization", and "+ Add Skill") to retain the premium serif aesthetic and direct the user to load snapshots or insert new records.

---

## 10. Honest Offline Parsing & Base64 PDF Retrieval

We refactored the resume intake flows and parsing logic to enforce absolute truthfulness, ensuring Career OS never fabricates resume experiences:

- **Dynamic, Honest Fallback Parser**:
  - Rewrote the local regex-based engine `analyzeResumeText` in [careerEngine.ts](file:///d:/CareerOS/lib/careerEngine.ts) to extract dates, roles, organizations, and descriptions dynamically from raw text tokens.
  - Eliminated hardcoded fallback mock companies (such as Grab, Petronas, University of Malaya, and Shopee). If a resume doesn't match predefined regional entities, the engine extracts whatever organizations and roles are in the text.
  - If no dates or structure can be found, the engine falls back to a clean, single timeline milestone using only the user's actual skills and file info (or leaves it empty), never creating fake history.
- **Client-Side Text File Reading**:
  - Updated both [OnboardingWizard.tsx](file:///d:/CareerOS/components/OnboardingWizard.tsx) and [CandidateDashboard.tsx](file:///d:/CareerOS/components/CandidateDashboard.tsx) to check if an uploaded file is a plain text `.txt` file.
  - Plain text files are now read on the client side using `FileReader.readAsText` and the exact text is passed directly into the parser. If the Gemini API key is missing or unreachable, the local offline parser processes this actual text with 100% fidelity.
- **Full Database Sync of PDF/Text Bytes**:
  - Integrated `pdfData` into the client-side user profile context in [useCareerEngine.tsx](file:///d:/CareerOS/hooks/useCareerEngine.tsx).
  - Updated the database endpoints (login, onboarding, versions restore/save) to retrieve, update, and return the base64-encoded `pdf_data` file bytes. The dashboard's local `uploadedPdfData` state is synchronized with `userProfile.pdfData` from the database so that the uploaded resume data is preserved across sessions.

---

## 11. Profile Workspace Layout Redesign & Snapshot Restoration Fixes

We have finalized the layout redesign, background database syncing, and simulation speed optimization:

- **Sleek 3-Column IDE Workspace**:
  - Re-arranged the workspace layout on desktop viewports to place settings on the left ([CandidateDashboard.tsx](file:///d:/CareerOS/components/CandidateDashboard.tsx)), the premium serif resume sheet in the center, and the AI Copilot diagnostic tools and logs on the right.
- **Instant Snapshot Rollbacks**:
  - Fixed the synchronization bug where restored milestones from the history timeline were blocked from rendering on the canvas due to stale mismatch flags. Restored snapshots now update immediately.
- **Background DB Auto-Commit Hooks**:
  - Configured `updateNode`, `addNode`, and `deleteNode` handlers inside [useCareerEngine.tsx](file:///d:/CareerOS/hooks/useCareerEngine.tsx) to automatically synchronize any additions, edits, or removals of milestones to the active user profile table in the background without needing manual commits.
- **Readable AI Agent Typewriter Simulation**:
  - Decreased the typing simulation speed to a realistic cadence (1 word per tick at an 80ms interval) to make the live AI experience tailoring feel interactive, readable, and highly polished.
- **Active Snapshot Promotion on Generation**:
  - Configured the tailoring save endpoint to synchronize the newly generated tailored milestones and target role directly to the active milestones and user profile tables in PostgreSQL.
  - Updated the typewriter simulation success handler to refresh active client React states immediately, making the generated version active on the timeline automatically.
- **Live CV Settings Card UX Refactoring**:
  - Refactored all flex selectors and grid actions inside [CandidateDashboard.tsx](file:///d:/CareerOS/components/CandidateDashboard.tsx) to align vertically as full-width blocks, eliminating horizontal squeeze and text wrapping.
  - Appended `truncate` styling to all selector inputs to cleanly handle long pathway names and job options, guaranteeing zero layout overflows in narrow viewports.

- **Exclusive Snapshot Highlighting & Client State Synchronization**:
  - **Single Active Highlight**: Modified the timeline rendering check inside [CandidateDashboard.tsx](file:///d:/CareerOS/components/CandidateDashboard.tsx) to scan the versions list dynamically (ordered latest-to-earliest) and flag only the single most recent matching snapshot as active, preventing multiple identical versions from being highlighted simultaneously.
  - **Manual Save State Sync**: Integrated state updates into the manual "Save Snapshot" and "Export CV (PDF)" click handlers so that they immediately commit base64-encoded plain text snapshots of the canvas to the database and update client states (`candidateNodes`, `userProfile.marketAnalysis` and `pdfData`).
  - **Reactive Summary Reset**: Configured milestone mutation operations (`updateNode`, `addNode`, `deleteNode`) in [useCareerEngine.tsx](file:///d:/CareerOS/hooks/useCareerEngine.tsx) and the `/api/profile/versions` active milestones sync route to clear the cached tailored summary in both the React profile state and the PostgreSQL database. This ensures that any manual resume edit resets the summary and forces future AI tailoring sweeps to generate factually from the updated milestones.

- **Manual Actions Loading Indicators & Button Styling Repairs**:
  - **Global Overlay Loading Screen**: Added a high-fidelity, blur-backdrop progress modal controlled by local `isSavingSnapshot` and `isExportingPdf` loading states that activates when manual saves or exports are processing. It informs the user with progress status indicators (e.g., "Saving Profile Snapshot..." and "Preparing PDF Export...").
  - **Tailwind Color Verification**: Replaced the invalid Tailwind class `bg-teal-655` on the PDF Export button with a standard color shade `bg-teal-600 hover:bg-teal-700` which restores the background color, resolving the invisible white text problem and ensuring visual compliance.
  - **Delayed Print Flow**: Set a short `setTimeout` delay (150ms) for `window.print()` triggers during export runs, allowing the asynchronous database saves and local state updates to resolve cleanly and close the loading screen before the browser print dialog blocks rendering.

---

## 12. Dark Mode Optimizations, Simplified Database Terminology, and URL-Synced Persistent Sub-Tabs

We have implemented key upgrades for theme accessibility, deployment-ready text refinement, and persistent web navigation:

### A. Dark Mode Accessibility & Grid Lines
- **Subtle Background Grids**: Redefined `.bg-grid-pattern` in dark mode to use a faint opacity (`0.015`), softening the harsh grid lines and keeping them subtle.
- **Enhanced Text Legibility**: Added CSS variables overrides under the `.dark` class block in `app/globals.css` for custom slates (such as `slate-250`, `slate-455`, `slate-505`, `slate-550`) and accent palettes (`teal`, `blue`, `emerald`, `amber`, `indigo`). This makes all badge counts, sub-tab labels, and custom icons instantly readable against the deep slate background.

### B. Deployment-Ready Terminology Cleanups
- **Removed Tech Mentions**: Stripped all database-specific terms like "PostgreSQL", "database", and "DB" from user-facing success notifications. The profile update and versions sync responses now display a clean, minimal `"Saved"` status message.
- **Sandbox Offline Banner**: Updated the offline sandbox warning banner on the Profile Settings page to state: *"Offline fallback is active. Changes made here will be saved locally."*
- **Immediate Settings Exit**: Form updates on the Profile Settings page now immediately return the user to the candidate dashboard persona (exiting settings view) upon successful save.

### C. Persistent Navigation & Browser Back/Forth Support
- **Query Parameter Synchronization**: Fully synchronized active views to search parameters (`?tab=...&status=...&phase=...&applicant=...`), covering Job Board sub-tabs, Recruiter phase sub-tabs, and the employer selected applicant drawer.
- **Browser History Integration**: Implemented comprehensive popstate event listeners that allow physical back/forward buttons to step through active tabs, phase changes, and applicant drawer toggles.
- **Session Caching**: User profile data, active job applications, and milestones timeline data automatically persist in `localStorage` and recover instantly upon page reload.

### D. Production Logging Cleanup
### E. New Interactive Enhancements & UI Redesign
- **KPI Card Gradients & Glow**: Added premium linear gradients and soft glowing shadows to all statistics cards on the Employer Dashboard.
- **Collapsible Banner**: Upgraded the greeting banner in the Skill Dependency Map to support collapsible toggle state and a light, elegant pastel gradient.
- **Candidate Status Read-Only UX**: Removed dropdown selectors from the candidate-facing Job Board to ensure recruitment phases are maintained solely by the employer.
- **Z-Index Drawer Fix**: Corrected the stacking context by removing `z-10` from the `<main>` container in `app/page.tsx`, allowing the Inspect Profile drawer to slide smoothly over the sticky headers and footers.
- **Filter Param Persistence**: Synchronized all directory filters (CGPA, keyword lists, company searches, top university filters) to the URL query string, maintaining state across browser back/forth navigation.
- **Intelligent Settings Redirection**: Modified the Profile Settings page to dynamically track the user's previous persona and redirect back to it upon save or cancel.

