import { NextResponse } from 'next/server';

const ALLOWED_SKILLS = [
  'Python', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems',
  'Cloud Computing', 'Linear Algebra', 'Linux', 'Computer Networking', 'Advanced React',
  'Performance Tuning', 'State Management', 'Browser Engines', 'Web Performance',
  'TypeScript', 'JavaScript', 'HTML/CSS', 'Technical Leadership', 'Product Strategy',
  'Agile Delivery', 'System Design', 'Market Analysis', 'Communication', 'Software Engineering'
];

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Prompt query string is required.'
      }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini API key is configured
    if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
      // Execute the local regex fallback parsing
      const parsedFilters = runLocalFallbackParser(prompt);
      return NextResponse.json({
        success: true,
        fallback: true,
        filters: parsedFilters,
        message: 'Parsed criteria locally (Offline fallback mode activated).'
      });
    }

    const systemPrompt = `
You are an expert AI Recruitment Assistant for Career OS.
Analyze the following natural language query from an employer looking for candidates:
"${prompt}"

Your goal is to parse this search query into structured search filters. Return a JSON object conforming exactly to this schema:
{
  "minCgpa": number | null, // The minimum academic CGPA requirement out of 4.0 if mentioned (e.g., 3.7 if they say "CGPA > 3.7", "GPA of 3.7", or "CGPA of 3.7 and above"). Otherwise, null.
  "top50University": boolean, // Set to true if they mention "top 50 universities", "QS top 50", "Ivy League", or top universities like "NUS", "NTU", "UM", "University of Malaya", "Monash", "IIT", "Stanford", "MIT", etc. Otherwise, false.
  "pastRoles": string[], // List of companies or titles they want the candidate to have worked in (e.g. ["Grab", "Shopee", "Senior", "Intern"]).
  "skills": string[], // List of skills they require. You MUST ONLY extract skills that match values from the Allowed Skills list below (case-sensitive).
  "explanation": "string (a brief, polite summary of the requirements you extracted, e.g. 'Filtered for candidates with CGPA >= 3.7, top university background, PyTorch skills, and past experience at Grab.')"
}

Allowed Skills:
${JSON.stringify(ALLOWED_SKILLS)}

Do not include any Markdown wrap blocks like \`\`\`json. Return only the raw JSON conforming strictly to the requested schema.
`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      // console.error('Gemini API Error in Filter Endpoint:', errorData);
      // Fail over to local parser if API returns error
      const parsedFilters = runLocalFallbackParser(prompt);
      return NextResponse.json({
        success: true,
        fallback: true,
        filters: parsedFilters,
        message: 'Parsed criteria locally (Gemini API error failover).'
      });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      const parsedFilters = runLocalFallbackParser(prompt);
      return NextResponse.json({
        success: true,
        fallback: true,
        filters: parsedFilters,
        message: 'Parsed criteria locally (Gemini returned an empty response).'
      });
    }

    try {
      const parsedJSON = JSON.parse(resultText.trim());
      return NextResponse.json({
        success: true,
        fallback: false,
        filters: {
          minCgpa: parsedJSON.minCgpa ?? null,
          top50University: !!parsedJSON.top50University,
          pastRoles: Array.isArray(parsedJSON.pastRoles) ? parsedJSON.pastRoles : [],
          skills: Array.isArray(parsedJSON.skills) ? parsedJSON.skills.filter((s: string) => ALLOWED_SKILLS.includes(s)) : [],
          explanation: parsedJSON.explanation || 'Extracted candidate criteria using Gemini.'
        }
      });
    } catch (parseErr) {
      // console.error('Failed to parse Gemini output JSON in Filter Endpoint:', resultText);
      const parsedFilters = runLocalFallbackParser(prompt);
      return NextResponse.json({
        success: true,
        fallback: true,
        filters: parsedFilters,
        message: 'Parsed criteria locally (JSON parse error on Gemini response).'
      });
    }

  } catch (error: any) {
    // console.error('Employer Filter Endpoint Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server encountered an error processing the search query.'
    }, { status: 500 });
  }
}

// Resilient Regex and Heuristics Parser for Offline Fallback
function runLocalFallbackParser(prompt: string) {
  const pLower = prompt.toLowerCase();
  
  // 1. CGPA Extraction (e.g. CGPA > 3.7, 3.5 GPA)
  let minCgpa: number | null = null;
  const cgpaRegex = /(?:cgpa|gpa)\s*(?:>|>=|of|above|minimum|min)?\s*([0-3]\.[0-9]{1,2}|4\.0)/i;
  const match = pLower.match(cgpaRegex);
  if (match && match[1]) {
    minCgpa = parseFloat(match[1]);
  } else {
    // Attempt general decimal check
    const decMatch = pLower.match(/\b([23]\.[0-9]{1,2}|4\.0)\b/);
    if (decMatch && decMatch[1]) {
      minCgpa = parseFloat(decMatch[1]);
    }
  }

  // 2. University Check (top 50, qs, specific top names)
  const topUnis = ['nus', 'ntu', 'um', 'university of malaya', 'monash', 'stanford', 'mit', 'ivy league', 'top 50', 'qs'];
  const top50University = topUnis.some(uni => pLower.includes(uni));

  // 3. Past Roles / Companies
  const companies = ['grab', 'shopee', 'petronas', 'carsome', 'maxis', 'mimos', 'fave', 'zalora', 'tm', 'axiata', 'celcom', 'intern', 'senior', 'lead', 'manager', 'director'];
  const pastRoles: string[] = [];
  companies.forEach(company => {
    if (pLower.includes(company)) {
      pastRoles.push(company.charAt(0).toUpperCase() + company.slice(1));
    }
  });

  // 4. Skills extraction from dictionary
  const skills: string[] = [];
  ALLOWED_SKILLS.forEach(skill => {
    if (pLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  // Synthesize Explanation
  let explanationParts = [];
  if (minCgpa !== null) explanationParts.push(`CGPA ≥ ${minCgpa}`);
  if (top50University) explanationParts.push('top QS university degree');
  if (pastRoles.length > 0) explanationParts.push(`experience at ${pastRoles.join('/')}`);
  if (skills.length > 0) explanationParts.push(`skills: ${skills.join(', ')}`);

  const explanation = explanationParts.length > 0
    ? `Offline helper parsed requirements: ${explanationParts.join(', ')}.`
    : 'No specific filters detected in your prompt. Displaying all candidates.';

  return {
    minCgpa,
    top50University,
    pastRoles,
    skills,
    explanation
  };
}
