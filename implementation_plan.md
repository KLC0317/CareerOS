# Employer Portal UI Redesign & Dark Mode Enhancements

## Goal Description
We will revamp the employer portal UI to provide a premium, modern experience and fix dark‑mode visibility issues. The work includes:
- Adding gradient backgrounds with subtle glowing effects to KPI cards.
- Making the top banner collapsible with an "X" button and using a light pastel gradient.
- Replacing the "View Cohort" label with a simple remove‑`x` action.
- Introducing sub‑tab navigation for application statuses (All, Applied, Interview, Offer, Rejected) with URL‑synced state.
- Implementing a filter panel and AI‑generated keyword suggestions.
- Ensuring the "Inspect Profile" modal appears above header/footer (high `z-index`).
- Lightening dark‑mode grid lines and fixing low‑contrast text colors.
- Simplifying database save messages to just "Saved".
- Adding a full‑screen profile settings page with avatar upload, dark‑mode toggle, and persistent saves.
- Persisting UI state (selected tab, filters) via URL query parameters for back/forward navigation.
- Removing all `console.*` statements and any production‑level logging.
- Updating Tailwind classes to avoid invalid colors and ensure accessibility.

## User Review Required
> [!IMPORTANT]
> Please confirm that the proposed UI redesign direction meets your expectations. Specifically:
> - Do you approve the KPI card gradient style (`bg-gradient-to-r` with `from-indigo-100 via-purple-100 to-pink-100` and a soft `box‑shadow` glow)?
> - Is the banner gradient (`bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100`) acceptable?
> - Should the AI keyword generator modal be triggered by a button labeled **"Generate Keywords"**?
> - Do you want the profile settings page to be a separate route (`/settings`) with a back‑button that returns to the previous page?

If any of these items need adjustment, let us know before we start implementation.

## Open Questions
> [!WARNING]
> - Should the filter panel be collapsible on mobile viewports?
> - Do you want server‑side rendering for the new settings page or client‑only?
> - Which storage strategy for the avatar upload (e.g., store as base64 in DB, or upload to a storage bucket)?

## Proposed Changes
---
### UI Components
- **[MODIFY] `components/EmployerDashboard.tsx`**
  - Add gradient + glow to KPI card containers.
  - Replace `<Card>` usage with a new `KpiCard` component that includes the styles.
  - Insert sub‑tab navigation component at the top; update routing to use `router.push('?status=applied')`.
  - Adjust filter panel to include new fields (CGPA, University, Past Position) and bind to state.
  - Ensure the "Inspect Profile" modal receives `z-index: 60`.

- **[MODIFY] `components/OnboardingWizard.tsx` (banner)**
  - Wrap banner in a collapsible container with an `X` button.
  - Apply `bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100`.
  - Remove the "View Cohort" element and replace with a simple `<button aria-label="Remove" class="text-gray-500 hover:text-gray-700">✕</button>`.

- **[MODIFY] `app/globals.css`**
  - Lighten dark‑mode grid lines: change `rgba(255,255,255,0.015)` to `rgba(255,255,255,0.04)`.
  - Replace low‑contrast text classes (`text-slate-500`, `text-slate-600`) with `text-gray-200`/`text-gray-300` for dark mode.

- **[MODIFY] `components/ProfileSettings.tsx`**
  - Build a full settings page with avatar upload preview, editable name/email/role fields, dark‑mode toggle, and a **Save** button.
  - On save, call `/api/profile/update` and show a temporary toast `Saved`.
  - After save, navigate back (or close modal) preserving previous UI state.

- **[MODIFY] `hooks/useCareerEngine.tsx`**
  - Add helper `saveProfileSettings` that POSTs to `/api/profile/update` and clears any console logs.
  - Ensure error handling does not expose credentials.

### Backend Adjustments
- **[MODIFY] `app/api/profile/update/route.ts`** (create if missing)
  - Validate input, update PostgreSQL `users` table, return `{ success: true }`.
  - Remove verbose messages; client will display generic "Saved" toast.

- **[MODIFY] `app/api/employer/filter/route.ts`** (AI keyword generator endpoint)
  - Accept `prompt` and return extracted filters.
  - Ensure no `console.log` statements remain.

### Utility Files
- **[NEW] `components/KpiCard.tsx`**
  - Reusable card component with gradient background, glow, and responsive layout.

- **[NEW] `components/SubTabNav.tsx`**
  - Tabs component that reads/writes `status` query param.

- **[NEW] `components/CollapsibleBanner.tsx`**
  - Handles banner collapse/expand state.

---
## Verification Plan
### Automated Tests
- Run `npm run build` to ensure no TypeScript errors.
- Execute Playwright end‑to‑end suite covering:
  1. KPI card visual style.
  2. Banner collapse and gradient.
  3. Sub‑tab navigation persistence.
  4. Dark‑mode text contrast.
  5. Profile settings save workflow.
  6. No `console.*` statements in production build.

### Manual Verification
- Manually inspect dark‑mode pages for readability.
- Verify that the AI keyword generator produces plausible suggestions.
- Test back/forward navigation retains selected tab and filter state.
- Confirm avatar upload displays preview and persists after page reload.

---
*Implementation will proceed once the above items are approved.*
