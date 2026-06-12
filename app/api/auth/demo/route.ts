import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';
import bcryptjs from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // 1. Find template user
    const templateEmail = 'demouser@example.com'.toLowerCase();
    const templateUserRes = await query('SELECT * FROM users WHERE email = $1', [templateEmail]);
    const template = templateUserRes.rows[0] || null;

    // 2. Find existing demo users to increment the counter
    const existingDemoUsers = await query("SELECT email FROM users WHERE email LIKE 'demouser_%@example.com'");
    let maxNum = 0;
    for (const row of existingDemoUsers.rows) {
      const match = row.email.match(/^demouser_(\d+)@example\.com$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    const newEmail = `demouser_${nextNum}@example.com`;

    let newUser: any;

    if (template) {
      // 3a. Clone template user
      const insertUserRes = await query(
        `INSERT INTO users (name, email, password_hash, target_role, market_analysis, pdf_data, profile_picture)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, target_role, market_analysis, pdf_data, profile_picture`,
        [
          `Demo User ${nextNum}`,
          newEmail,
          template.password_hash,
          template.target_role,
          template.market_analysis,
          template.pdf_data,
          template.profile_picture
        ]
      );
      newUser = insertUserRes.rows[0];

      // 4a. Clone milestones
      const milestonesRes = await query(
        'SELECT role, organization, type, start_date, end_date, description, skills FROM milestones WHERE user_id = $1',
        [template.id]
      );
      for (const row of milestonesRes.rows) {
        await query(
          `INSERT INTO milestones (user_id, role, organization, type, start_date, end_date, description, skills)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newUser.id,
            row.role,
            row.organization,
            row.type,
            row.start_date,
            row.end_date,
            row.description,
            JSON.stringify(row.skills)
          ]
        );
      }

      // 5a. Clone profile versions
      const versionsRes = await query(
        'SELECT version_number, resume_filename, target_role, milestones, market_analysis, pdf_data FROM profile_versions WHERE user_id = $1',
        [template.id]
      );
      for (const row of versionsRes.rows) {
        await query(
          `INSERT INTO profile_versions (user_id, version_number, resume_filename, target_role, milestones, market_analysis, pdf_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newUser.id,
            row.version_number,
            row.resume_filename,
            row.target_role,
            JSON.stringify(row.milestones),
            row.market_analysis,
            row.pdf_data
          ]
        );
      }
    } else {
      // 3b. Create fresh user if template does not exist yet
      const salt = await bcryptjs.genSalt(10);
      const hash = await bcryptjs.hash('abc1234', salt);
      const insertUserRes = await query(
        `INSERT INTO users (name, email, password_hash, target_role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, target_role, market_analysis, pdf_data, profile_picture`,
        [`Demo User ${nextNum}`, newEmail, hash, 'PENDING_ONBOARDING']
      );
      newUser = insertUserRes.rows[0];
    }

    // Retrieve milestones for the newly created user to return in session payload
    const finalMilestonesRes = await query(
      'SELECT id, role, organization, type, start_date AS "startDate", end_date AS "endDate", description, skills FROM milestones WHERE user_id = $1',
      [newUser.id]
    );
    const milestones = finalMilestonesRes.rows.map((row: any) => ({
      ...row,
      id: String(row.id)
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        targetRole: newUser.target_role,
        marketAnalysis: newUser.market_analysis,
        pdfData: newUser.pdf_data,
        isPremium: newUser.is_premium || false,
        profilePicture: newUser.profile_picture || null,
        lastLogin: new Date().toISOString(),
        milestones
      }
    });

  } catch (error: any) {
    // console.error('Demo Login API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
