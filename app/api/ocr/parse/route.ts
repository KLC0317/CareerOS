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
You are an expert ATS (Applicant Tracking System) parser and career trajectory planning system.
Analyze the provided resume and perform the following tasks:
1. Extract all milestones (academic degrees, employment history, independent research/sabbaticals).
2. Recommend THREE distinct target career roles/trajectories (e.g. "AI Architect", "Frontend Architect", "Lead Platform Engineer", "DevOps Specialist", "Engineering Manager", "Product Manager", etc.) based on their experience and skills, taking into account their location/market.
3. Compile a list of all detected skills matching the allowed skills dictionary.
4. Extract the candidate's geographical location (or infer it from listed entities like companies and universities if not explicitly stated) and analyze the local technology market demand for the recommended roles in that geographical area.

You MUST return a valid JSON object conforming exactly to this TypeScript schema:
{
  "recommendedRole": "string (the primary/highest-match recommended career role/trajectory)",
  "recommendedRoles": [
    {
      "role": "string (recommended career role/trajectory)",
      "justification": "string (brief justification why this pathway is optimal for the candidate given their background and regional context)"
    }
  ],
  "detectedSkills": string[],
  "marketAnalysis": {
    "geo": "Detected city/country or inferred region",
    "marketDemand": "Regional demand analysis, local market outlook, growth prospects, and tech hubs in that area for the primary recommended role",
    "justification": "Why the primary recommended role is optimal given the background and geography"
  },
  "nodes": [
    {
      "role": "Job Title or Degree/Sabbatical Name",
      "organization": "Company, Institution or Self-Directed organization",
      "type": "employment" | "academic" | "sabbatical",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM" or "Present",
      "description": "Short explanation of achievements and tasks performed",
      "skills": [
        {
          "name": "Skill name from dictionary",
          "level": "Rank-1" | "Rank-2" | "Rank-3"
        }
      ]
    }
  ]
}

Ensure the "recommendedRoles" array contains EXACTLY 3 distinct recommendations, sorted by relevance/match score.
If no end date is present for a current job, set "endDate" to "Present".
The "skills" array inside each milestone node should contain skills relevant to that milestone, and the "name" field MUST match one of the values in the Allowed Skills Dictionary below (case-sensitive).

Dictionary of Allowed Skills:
${JSON.stringify(allowedSkills)}

Do not include any Markdown wrap blocks like \`\`\`json. Return only the raw JSON.
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
      console.error('Gemini API Error:', errorData);
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
      console.error('Failed to parse Gemini JSON output:', resultText);
      return NextResponse.json({
        success: false,
        error: 'JSON_PARSE_ERROR',
        message: 'Gemini did not return valid JSON. Response was: ' + resultText
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('OCR Parser Endpoint Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server encountered an error parsing the resume.'
    }, { status: 500 });
  }
}
