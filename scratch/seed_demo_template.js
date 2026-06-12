const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const databaseUrl = "";

const INITIAL_CAREER_NODES = [
  {
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
    ]
  },
  {
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

async function run() {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    const email = 'demouser@example.com'.toLowerCase();
    const name = 'Demo Template User';
    const password = 'abc1234';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Clean up existing template user
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    console.log(`Deleted existing template user with email: ${email}`);

    // Insert template user
    const insertRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, target_role, market_analysis)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email`,
      [
        name,
        email,
        hash,
        'AI Architect',
        JSON.stringify({
          geo: 'Kuala Lumpur, MY',
          marketDemand: 'High demand in energy, finance, and logistics sectors for AI pipeline orchestration.',
          justification: 'AI Architect roles in Southeast Asia are growing at 35% YoY with competitive salaries.'
        })
      ]
    );

    const user = insertRes.rows[0];
    console.log('Successfully created template user:', user);

    // Insert milestones
    for (const node of INITIAL_CAREER_NODES) {
      await pool.query(
        `INSERT INTO milestones (user_id, role, organization, type, start_date, end_date, description, skills)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          node.role,
          node.organization,
          node.type,
          node.startDate,
          node.endDate,
          node.description,
          JSON.stringify(node.skills)
        ]
      );
    }
    console.log(`Successfully seeded ${INITIAL_CAREER_NODES.length} milestones for template user.`);

    // Insert profile version
    await pool.query(
      `INSERT INTO profile_versions (user_id, version_number, resume_filename, target_role, milestones, market_analysis)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        1,
        'Demo Profile (Sample Data)',
        'AI Architect',
        JSON.stringify(INITIAL_CAREER_NODES),
        JSON.stringify({
          geo: 'Kuala Lumpur, MY',
          marketDemand: 'High demand in energy, finance, and logistics sectors for AI pipeline orchestration.',
          justification: 'AI Architect roles in Southeast Asia are growing at 35% YoY with competitive salaries.'
        })
      ]
    );
    console.log('Successfully seeded profile version for template user.');

  } catch (err) {
    console.error('Error seeding template user:', err);
  } finally {
    await pool.end();
  }
}

run();
