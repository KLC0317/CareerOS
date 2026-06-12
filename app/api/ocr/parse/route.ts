import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY_MISSING',
        message: 'Please configure GEMINI_API_KEY in your .env.local file to enable advanced AI parsing.'
      }, { status: 200 }); // Return status 200 so the frontend can intercept the structured error gracefully
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('text') as string | null;

    if (!file && !textContent) {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Either file upload or text content is required.'
      }, { status: 400 });
    }

    let contentsParts: any[] = [];

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');
      const fileType = file.type || 'application/pdf';

      contentsParts.push({
        inlineData: {
          mimeType: fileType,
          data: base64Data
        }
      });
    }

    const allowedSkills = [
      'Python', 'Deep Learning', 'System Architecture', 'PyTorch', 'Distributed Systems',
      'Cloud Computing', 'Linear Algebra', 'Linux', 'Computer Networking', 'Advanced React',
      'Performance Tuning', 'State Management', 'Browser Engines', 'Web Performance',
      'TypeScript', 'JavaScript', 'HTML/CSS', 'Technical Leadership', 'Product Strategy',
      'Agile Delivery', 'System Design', 'Market Analysis', 'Communication', 'Software Engineering'
    ];

    const promptText = `
You are a world-class ATS (Applicant Tracking System) resume parser, career strategist, and professional writing specialist. Your role is to extract, analyze, and professionally articulate a candidate's career history based solely on the information provided in their resume.

Analyze the provided resume and perform the following tasks:
1. Extract ALL milestones: academic degrees, employment history, internships, and independent research/sabbaticals — in reverse chronological order (most recent first).
2. Recommend THREE distinct target career roles/trajectories (e.g. "AI Research Engineer", "Frontend Architect", "Lead Platform Engineer", "DevOps Specialist", "Engineering Manager", "Product Manager") based on the candidate's actual experience, skills, and geographical location/market context.
3. Compile a list of all detected skills matching the allowed skills dictionary.
4. Extract the candidate's geographical location (or infer it from company/university entities) and analyze the regional technology market demand for the recommended roles in that area.

═══════════════════════════════════════════════════════════════
INTEGRITY & HONESTY — ABSOLUTE REQUIREMENT:
═══════════════════════════════════════════════════════════════
You MUST ONLY extract and describe what is EXPLICITLY present in the resume text.
- Never assume, invent, or fabricate skills, tools, frameworks, or responsibilities.
- Never add technologies not mentioned (e.g., do NOT list "Next.js" if the resume doesn't explicitly state it).
- Preserve exact organization names, role titles, and dates as written.
- All descriptions must be grounded 100% in real, verifiable content from the resume.

═══════════════════════════════════════════════════════════════
PROFESSIONAL RESUME WRITING STANDARDS — MANDATORY:
═══════════════════════════════════════════════════════════════
For EVERY employment and academic milestone node, the "description" field MUST:

1. WORD COUNT: Contain a minimum of 55 and ideally 60–75 words. Never write short, sparse, or vague descriptions. If the resume provides limited detail, expand on the genuine responsibilities implied by the role title and organization context — but never fabricate.

2. PROFESSIONAL LANGUAGE: Use sophisticated, industry-standard resume language. Use strong action verbs (e.g., "Spearheaded", "Architected", "Delivered", "Orchestrated", "Implemented", "Optimized", "Led", "Developed", "Designed", "Managed"). Avoid weak or generic phrasing like "worked on" or "helped with".

3. REFLECT THE POSITION: Each description must reflect the seniority level and domain of the actual job title. A "Senior Engineer" description must sound distinctly more senior than a "Junior Developer". A "Bachelor's in Computer Science" description must reflect the academic curriculum and specialization.

4. STRUCTURED NARRATIVE FORMAT: Write each description as a coherent, flowing professional narrative paragraph (no bullet symbols, no hyphens at the start, no markdown). The text should read naturally when printed on a professional resume document.

5. SPECIFICITY: Where the resume mentions specific technologies, systems, metrics, or outcomes, incorporate them into the description to add authenticity and credibility. Generic descriptions without any specifics are NOT acceptable.

6. ACHIEVEMENTS VS RESPONSIBILITIES: The description should balance both day-to-day responsibilities and notable achievements or outcomes where evident from the resume.

EXAMPLE of an ACCEPTABLE 60-word description:
"Architected and led the end-to-end development of a high-availability microservices platform serving over two million active users, leveraging Python and distributed systems design patterns. Collaborated cross-functionally with product, QA, and DevOps teams to accelerate delivery cycles by 35%. Established code review standards and mentored a team of five junior engineers, significantly improving codebase quality and team velocity."

EXAMPLE of an UNACCEPTABLE (too short) description:
"Worked on backend systems using Python. Helped the team deliver features."

═══════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT — STRICTLY REQUIRED:
═══════════════════════════════════════════════════════════════
You MUST return a valid JSON object conforming EXACTLY to this TypeScript schema. Do not include any Markdown, code fences, or extra commentary. Return ONLY the raw JSON object.

{
  "recommendedRole": "string (the primary/highest-match recommended career role/trajectory)",
  "recommendedRoles": [
    {
      "role": "string (recommended career role/trajectory)",
      "justification": "string (2–3 sentences justifying why this pathway is optimal for the candidate given their background, skills, and regional market context)"
    }
  ],
  "detectedSkills": "string[] (skills matching the allowed dictionary only)",
  "summary": "string (use the candidate's original professional summary if present in the resume; otherwise synthesize a 40–60 word factual summary from their extracted career history — do not fabricate)",
  "marketAnalysis": {
    "geo": "Detected city/country or inferred region",
    "marketDemand": "2–3 sentence analysis of regional demand, local market outlook, growth prospects, and relevant tech hubs in that area for the primary recommended role",
    "justification": "2–3 sentences explaining why the primary recommended role is optimal given the candidate's background and geography"
  },
  "nodes": [
    {
      "role": "Exact Job Title or Degree Name as written in the resume",
      "organization": "Exact Company, Institution, or Self-Directed organization name",
      "type": "employment | academic | sabbatical",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "description": "A 60-word minimum professional narrative paragraph describing actual responsibilities, accomplishments, technologies used, and key outcomes — grounded entirely in the resume content",
      "skills": [
        {
          "name": "Skill name from the allowed dictionary (case-sensitive exact match)",
          "level": "Rank-1 | Rank-2 | Rank-3"
        }
      ]
    }
  ]
}

RULES:
- "recommendedRoles" array MUST contain EXACTLY 3 items, sorted by relevance/match score descending.
- If no end date is present for a current role, set "endDate" to "Present".
- All skill names in "skills" arrays MUST exactly match an entry in the Allowed Skills Dictionary below (case-sensitive).
- Nodes MUST be ordered most-recent first (reverse chronological).

Allowed Skills Dictionary:
${JSON.stringify(allowedSkills)}
`;


    if (textContent) {
      contentsParts.push({
        text: `Resume Text:\n\n${textContent}\n\n${promptText}`
      });
    } else {
      contentsParts.push({
        text: promptText
      });
    }

    // Call the Gemini API
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
              parts: contentsParts
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
      // console.error('Gemini API Error:', errorData);
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_ERROR',
        message: errorData.error?.message || 'Failed to parse resume using Gemini API.'
      }, { status: 502 });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return NextResponse.json({
        success: false,
        error: 'EMPTY_RESPONSE',
        message: 'No response returned from the Gemini modeling engine.'
      }, { status: 502 });
    }

    try {
      const parsedJSON = JSON.parse(resultText.trim());

      // Ensure node IDs are generated in API for frontend convenience
      if (parsedJSON.nodes && Array.isArray(parsedJSON.nodes)) {
        parsedJSON.nodes = parsedJSON.nodes.map((node: any, idx: number) => ({
          ...node,
          id: `parsed-${node.organization.replace(/\s+/g, '-').toLowerCase()}-${idx}-${Date.now()}`
        }));
      }

      return NextResponse.json({
        success: true,
        data: parsedJSON
      });
    } catch (parseErr: any) {
      // console.error('Failed to parse Gemini JSON output:', resultText);
      return NextResponse.json({
        success: false,
        error: 'JSON_PARSE_ERROR',
        message: 'Gemini did not return valid JSON. Response was: ' + resultText
      }, { status: 502 });
    }

  } catch (error: any) {
    // console.error('OCR Parser Endpoint Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server encountered an error parsing the resume.'
    }, { status: 500 });
  }
}
