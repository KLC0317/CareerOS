import { readFileSync, writeFileSync } from 'fs';

const filePath = 'd:/CareerOS/lib/careerEngine.ts';
let content = readFileSync(filePath, 'utf-8');

const badBlock = `  if (nodes.length === 0) {
    const defaultRole = recommendedRole === 'AI Architect' ? 'AI Developer' : (recommendedRole === 'Frontend Architect' ? 'Frontend Developer' : 'Software Professional');
    nodes.push({
      id: \`parsed-profile-\${Date.now()}\`,
      role: defaultRole,
      organization: 'Independent / Candidate Profile',
      type: 'employment',
      startDate: '2024-01',
      endDate: 'Present',
      description: Demonstrated expertise as a \\ with a strong foundation in \\. Applied technical knowledge and professional judgment to deliver quality outcomes across diverse projects, collaborating effectively with cross-functional stakeholders. Consistently maintained high standards of technical excellence, analytical problem-solving, and continuous learning to stay current with emerging industry trends and best practices.,
      skills: detectedSkills.slice(0, 4).map(s => ({ name: s, level: 'Rank-1' as const }))
    });
  }`;

const goodBlock = `  if (nodes.length === 0) {
    const defaultRole = recommendedRole === 'AI Architect' ? 'AI Developer' : (recommendedRole === 'Frontend Architect' ? 'Frontend Developer' : 'Software Professional');
    const fallbackSkillSummary = detectedSkills.slice(0, 3).join(', ') || 'software engineering and technical systems';
    nodes.push({
      id: \`parsed-profile-\${Date.now()}\`,
      role: defaultRole,
      organization: 'Independent / Candidate Profile',
      type: 'employment',
      startDate: '2024-01',
      endDate: 'Present',
      description: \`Demonstrated expertise as a \${defaultRole} with a strong foundation in \${fallbackSkillSummary}. Applied technical knowledge and professional judgment to deliver quality outcomes across diverse projects, collaborating effectively with cross-functional stakeholders. Consistently maintained high standards of technical excellence, analytical problem-solving, and continuous learning to stay current with emerging industry trends and best practices.\`,
      skills: detectedSkills.slice(0, 4).map(s => ({ name: s, level: 'Rank-1' as const }))
    });
  }`;

if (content.includes(badBlock)) {
  content = content.replace(badBlock, goodBlock);
  writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed successfully!');
} else {
  console.log('Could not find bad block. Current content around line 713-725:');
  const lines = content.split('\n');
  console.log(lines.slice(712, 726).join('\n'));
}
