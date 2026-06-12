import { NextResponse } from 'next/server';

// Compact candidate type sent from the frontend
interface CandidateContext {
  id: string;
  name: string;
  role: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  missingSkills: string[];
  cgpa: number;
  university: string;
  trajectory: string;
  lastInstitution: string;
  resumeText: string;
}

// University alias lookup — maps abbreviations and common names to full canonical names
const UNI_ALIASES: Record<string, string> = {
  'nus': 'National University of Singapore',
  'ntu': 'Nanyang Technological University',
  'um': 'University of Malaya',
  'uom': 'University of Malaya',
  'university of malaya': 'University of Malaya',
  'monash': 'Monash University',
  'sunway': 'Sunway University',
  'taylor': "Taylor's University",
  'taylors': "Taylor's University",
  'apu': 'Asia Pacific University',
  'mmu': 'Multimedia University',
  'multimedia university': 'Multimedia University',
  'uitm': 'Universiti Teknologi MARA',
  'utp': 'Universiti Teknologi Petronas',
};

// Resolve a prompt mention to a canonical university name (or null if not mentioned)
function resolveUniversity(promptLower: string): string | null {
  for (const [alias, full] of Object.entries(UNI_ALIASES)) {
    if (promptLower.includes(alias)) return full;
  }
  return null;
}

// Build rich, human-readable candidate descriptions for the LLM context
function buildCandidateContext(candidates: CandidateContext[]): string {
  return candidates.map((c, i) =>
    `[${i + 1}] ID: ${c.id}
  Name: ${c.name}
  Applied Role: ${c.role} (${c.jobType}, ${c.experienceLevel})
  University: ${c.university}
  CGPA: ${c.cgpa.toFixed(2)} / 4.0
  Career Path: ${c.trajectory}
  Last Institution: ${c.lastInstitution}
  Skills: ${c.skills.join(', ') || 'None listed'}
  Missing Skills: ${c.missingSkills.join(', ') || 'None'}
  Professional Summary: ${c.resumeText}`
  ).join('\n\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, candidates } = body as { prompt: string; candidates?: CandidateContext[] };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Prompt query string is required.'
      }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // No API key — run strict local fallback
    if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
      const result = runLocalFallback(prompt, candidates || []);
      return NextResponse.json({
        success: true,
        fallback: true,
        ...result,
        message: 'Matched candidates locally (Offline mode — configure GEMINI_API_KEY for AI-powered semantic matching).'
      });
    }

    const candidateBlock = buildCandidateContext(candidates || []);

    const systemPrompt = `You are an expert AI Recruiter Assistant for CareerOS, a Malaysian Applicant Tracking System.

## Platform Context (Malaysia)
- University aliases: NUS = National University of Singapore, NTU = Nanyang Technological University, UM = University of Malaya, Monash = Monash University, APU = Asia Pacific University, MMU = Multimedia University, UiTM = Universiti Teknologi MARA, UTP = Universiti Teknologi Petronas, Sunway = Sunway University, Taylor's = Taylor's University
- Banking sector companies: Maybank, CIMB, RHB, Public Bank, Bank Rakyat, Hong Leong Bank, AmBank, Bank Negara
- Major Malaysian employers: Petronas, AirAsia, Axiata, Maxis, Telekom Malaysia (TM), Genting, Grab

## Recruiter Query
"${prompt}"

## Candidate Database (${(candidates || []).length} candidates)
${candidateBlock}

## Your Task
Analyse the recruiter query and the candidate database above. Return ONLY a raw JSON object (no markdown, no explanation outside JSON) with this exact schema:

{
  "matchedIds": ["id1", "id2", ...],
  "filters": {
    "minCgpa": number | null,
    "top50University": boolean,
    "specificUniversity": string | null,
    "pastRoles": string[],
    "skills": string[],
    "resumeKeywords": string[],
    "explanation": string
  }
}

## Matching Rules
1. **Role**: Match candidates whose "Applied Role" aligns with the role mentioned. "React architect" or "React developer" → "Senior Frontend Engineer". "AI architect" or "ML engineer" → "AI Architect". "Data scientist" → "Data Science Intern". "Product manager" or "PM" → "Product Manager".
2. **University**: If a specific university is named (e.g. "NUS", "Monash"), ONLY include candidates from that exact university using the aliases above. Do NOT include candidates from other universities.
3. **CGPA**: If "CGPA > X" or "GPA of X" is mentioned, exclude all candidates with CGPA below X.
4. **Sector/Company**: If "banking" or a specific company is mentioned, only include candidates whose career trajectory or professional summary contains matching companies.
5. **Skills**: Prefer candidates who have the mentioned skills in their Skills field.
6. "matchedIds" must be SORTED: best matches first. IDs are the exact "ID:" value from each candidate entry above.
7. If fewer than 3 candidates match ALL criteria, return the best partial matches rather than an empty array.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    if (!response.ok) {
      const result = runLocalFallback(prompt, candidates || []);
      return NextResponse.json({ success: true, fallback: true, ...result, message: 'Gemini API error — using local fallback.' });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      const result = runLocalFallback(prompt, candidates || []);
      return NextResponse.json({ success: true, fallback: true, ...result, message: 'Gemini returned empty response — using local fallback.' });
    }

    try {
      const parsed = JSON.parse(resultText.trim());
      return NextResponse.json({
        success: true,
        fallback: false,
        matchedIds: Array.isArray(parsed.matchedIds) ? parsed.matchedIds : [],
        filters: {
          minCgpa: parsed.filters?.minCgpa ?? null,
          top50University: !!parsed.filters?.top50University,
          specificUniversity: parsed.filters?.specificUniversity || null,
          pastRoles: Array.isArray(parsed.filters?.pastRoles) ? parsed.filters.pastRoles : [],
          skills: Array.isArray(parsed.filters?.skills) ? parsed.filters.skills : [],
          resumeKeywords: Array.isArray(parsed.filters?.resumeKeywords) ? parsed.filters.resumeKeywords : [],
          explanation: parsed.filters?.explanation || 'AI-matched candidates based on your query.'
        }
      });
    } catch {
      const result = runLocalFallback(prompt, candidates || []);
      return NextResponse.json({ success: true, fallback: true, ...result, message: 'JSON parse error on Gemini response — using local fallback.' });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server error processing the search query.'
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strict local fallback — hierarchical filtering with proper alias resolution
// ─────────────────────────────────────────────────────────────────────────────
function runLocalFallback(prompt: string, candidates: CandidateContext[]) {
  const p = prompt.toLowerCase();

  // 1. CGPA
  let minCgpa: number | null = null;
  const cgpaMatch = p.match(/(?:cgpa|gpa)\s*(?:>|>=|of|above|minimum|min)?\s*([0-3]\.[0-9]{1,2}|4\.0)/i);
  if (cgpaMatch?.[1]) minCgpa = parseFloat(cgpaMatch[1]);
  else {
    const dec = p.match(/\b([23]\.[0-9]{1,2}|4\.0)\b/);
    if (dec?.[1]) minCgpa = parseFloat(dec[1]);
  }

  // 2. Specific university (exact match via alias table)
  const specificUniversity = resolveUniversity(p);
  const top50Terms = ['top 50', 'qs', 'top university', 'top uni', 'prestigious'];
  const top50University = !specificUniversity && top50Terms.some(t => p.includes(t));
  const TOP_50_LIST = [
    'National University of Singapore',
    'Nanyang Technological University',
    'University of Malaya',
    'Monash University',
    'Sunway University',
  ];

  // 3. Target role — comprehensive synonym table
  const ROLE_MAP: { keywords: string[]; role: string }[] = [
    { keywords: ['product manager', 'product management', ' pm ', 'product lead'], role: 'Product Manager' },
    { keywords: ['react', 'frontend engineer', 'frontend developer', 'front end', 'ui engineer', 'web engineer'], role: 'Senior Frontend Engineer' },
    { keywords: ['ai architect', 'ml architect', 'machine learning architect', 'ai engineer', 'deep learning engineer'], role: 'AI Architect' },
    { keywords: ['data science intern', 'data scientist intern', 'data intern', 'data science'], role: 'Data Science Intern' },
    { keywords: ['technical support', 'tech support', 'support engineer'], role: 'Technical Support' },
  ];
  const targetRole = ROLE_MAP.find(m => m.keywords.some(k => p.includes(k)))?.role;

  // 4. Experience type
  const wantsFresh = p.includes('fresh') || p.includes('graduate') || (p.includes('intern') && !targetRole?.includes('Data Science'));
  const wantsExperienced = p.includes('senior') || p.includes('experienced') || p.includes('professional') || p.includes('architect');

  // 5. Sector requirements
  const BANK_TERMS = ['bank', 'banking', 'fintech', 'financial institution', 'maybank', 'cimb', 'rhb', 'public bank', 'ambank', 'hong leong'];
  const BANK_NAMES = ['maybank', 'cimb', 'rhb', 'public bank', 'ambank', 'hong leong', 'bank rakyat', 'bank negara', 'bank ', ' bank', 'fintech', 'financial services'];
  const wantsBanking = BANK_TERMS.some(t => p.includes(t));

  const TELCO_TERMS = ['telco', 'telecommunication', 'maxis', 'celcom', 'digi', 'axiata'];
  const wantsTelco = TELCO_TERMS.some(t => p.includes(t));

  const ENERGY_TERMS = ['petronas', 'oil', 'energy', 'tenaga'];
  const wantsEnergy = ENERGY_TERMS.some(t => p.includes(t));

  const KNOWN_COMPANIES = ['grab', 'shopee', 'lazada', 'airasia', 'genting', 'mimos', 'carsome', 'fave'];
  const mentionedCompanies = KNOWN_COMPANIES.filter(c => p.includes(c));

  // 6. Skill requirements
  const SKILL_MAP: Record<string, string> = {
    'product strategy': 'Product Strategy',
    'agile': 'Agile Delivery',
    'deep learning': 'Deep Learning',
    'pytorch': 'PyTorch',
    'python': 'Python',
    'typescript': 'TypeScript',
    'advanced react': 'Advanced React',
    'html': 'HTML/CSS',
    'system architecture': 'System Architecture',
    'system design': 'System Design',
    'communication': 'Communication',
    'linear algebra': 'Linear Algebra',
    'linux': 'Linux',
    'computer networking': 'Computer Networking',
    'market analysis': 'Market Analysis',
    'cloud computing': 'Cloud Computing',
    'distributed systems': 'Distributed Systems',
    'technical leadership': 'Technical Leadership',
  };
  const requiredSkills = Object.entries(SKILL_MAP)
    .filter(([kw]) => p.includes(kw))
    .map(([, skill]) => skill);

  // ── Apply filters in order of specificity ──────────────────────────────────
  let filtered = [...candidates];

  // Role — hard filter
  if (targetRole) {
    filtered = filtered.filter(c => c.role === targetRole);
  }

  // CGPA — hard filter
  if (minCgpa !== null) {
    filtered = filtered.filter(c => c.cgpa >= minCgpa!);
  }

  // Specific university — hard filter (exact name match)
  if (specificUniversity) {
    filtered = filtered.filter(c =>
      c.university.toLowerCase().includes(specificUniversity.toLowerCase().split(' ')[0].toLowerCase()) ||
      c.university === specificUniversity
    );
  } else if (top50University) {
    // Generic top-50 filter
    filtered = filtered.filter(c => TOP_50_LIST.some(u => c.university === u));
  }

  // Experience type
  if (wantsFresh && !wantsExperienced) filtered = filtered.filter(c => c.experienceLevel === 'fresh');
  if (wantsExperienced && !wantsFresh) filtered = filtered.filter(c => c.experienceLevel === 'experienced');

  // Banking sector
  if (wantsBanking) {
    filtered = filtered.filter(c => {
      const combined = `${c.trajectory} ${c.resumeText} ${c.lastInstitution}`.toLowerCase();
      return BANK_NAMES.some(b => combined.includes(b));
    });
  }

  // Telco sector
  if (wantsTelco) {
    filtered = filtered.filter(c => {
      const combined = `${c.trajectory} ${c.resumeText} ${c.lastInstitution}`.toLowerCase();
      return ['maxis', 'celcom', 'digi', 'axiata', 'telekom', 'tm ', 'telco'].some(t => combined.includes(t));
    });
  }

  // Energy sector
  if (wantsEnergy) {
    filtered = filtered.filter(c => {
      const combined = `${c.trajectory} ${c.resumeText} ${c.lastInstitution}`.toLowerCase();
      return ['petronas', 'tenaga', 'oil', 'energy'].some(e => combined.includes(e));
    });
  }

  // Specific companies
  mentionedCompanies.forEach(company => {
    filtered = filtered.filter(c => {
      const combined = `${c.trajectory} ${c.resumeText} ${c.lastInstitution}`.toLowerCase();
      return combined.includes(company);
    });
  });

  // Skills — try hard match first, fall back to sorted soft match
  if (requiredSkills.length > 0) {
    const allSkillsMatch = filtered.filter(c => requiredSkills.every(s => c.skills.includes(s)));
    if (allSkillsMatch.length > 0) {
      filtered = allSkillsMatch;
    } else {
      filtered = filtered.sort((a, b) => {
        const aScore = requiredSkills.filter(s => a.skills.includes(s)).length;
        const bScore = requiredSkills.filter(s => b.skills.includes(s)).length;
        return bScore - aScore;
      });
    }
  }

  const matchedIds = filtered.map(c => c.id);

  // Build explanation
  const parts: string[] = [];
  if (targetRole) parts.push(`role: ${targetRole}`);
  if (specificUniversity) parts.push(`university: ${specificUniversity}`);
  else if (top50University) parts.push('top 50 QS university');
  if (minCgpa !== null) parts.push(`CGPA ≥ ${minCgpa}`);
  if (wantsBanking) parts.push('banking/fintech experience');
  if (wantsTelco) parts.push('telco experience');
  if (wantsEnergy) parts.push('energy sector experience');
  if (requiredSkills.length > 0) parts.push(`skills: ${requiredSkills.join(', ')}`);
  if (wantsFresh && !wantsExperienced) parts.push('fresh graduates');
  if (wantsExperienced && !wantsFresh) parts.push('experienced professionals');

  const explanation = parts.length > 0
    ? `Filtered for ${parts.join(', ')}.`
    : 'Showing all candidates. Refine your query to filter by role, university, CGPA, skills, or sector.';

  return {
    matchedIds,
    filters: {
      minCgpa,
      top50University: top50University || !!specificUniversity,
      specificUniversity: specificUniversity || null,
      pastRoles: wantsBanking ? ['Banking/Fintech'] : mentionedCompanies,
      skills: requiredSkills,
      resumeKeywords: wantsBanking ? ['banking', 'fintech'] : [],
      explanation
    }
  };
}
