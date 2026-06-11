import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, targetRole, milestones, resumeFilename, marketAnalysis, pdfData } = await req.json();

    if (!email || !targetRole || !Array.isArray(milestones)) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Email, targetRole, and milestones are required.' }, { status: 400 });
    }

    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Find the user ID
    const findUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (findUser.rows.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND', message: 'User account not found.' }, { status: 404 });
    }

    const userId = findUser.rows[0].id;

    // Update target_role, market_analysis, and pdf_data
    const marketAnalysisStr = marketAnalysis ? (typeof marketAnalysis === 'object' ? JSON.stringify(marketAnalysis) : marketAnalysis) : null;
    await query('UPDATE users SET target_role = $1, market_analysis = $2, pdf_data = $4 WHERE id = $3', [targetRole, marketAnalysisStr, userId, pdfData || null]);

    // Delete existing milestones to avoid duplicate accumulation
    await query('DELETE FROM milestones WHERE user_id = $1', [userId]);

    // Delete existing profile versions to start a fresh history for this new upload
    await query('DELETE FROM profile_versions WHERE user_id = $1', [userId]);

    // Insert new milestones
    for (const node of milestones) {
      await query(
        `INSERT INTO milestones (user_id, role, organization, type, start_date, end_date, description, skills) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          node.role,
          node.organization,
          node.type,
          node.startDate,
          node.endDate,
          node.description || '',
          JSON.stringify(node.skills || [])
        ]
      );
    }

    // Record Profile Version History
    const versionRes = await query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM profile_versions WHERE user_id = $1',
      [userId]
    );
    const nextVersion = versionRes.rows[0].next_version;

    await query(
      `INSERT INTO profile_versions (user_id, version_number, resume_filename, target_role, milestones, market_analysis, pdf_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        nextVersion,
        resumeFilename || 'Initial Onboarding',
        targetRole,
        JSON.stringify(milestones),
        marketAnalysisStr,
        pdfData || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Saved'
    });

  } catch (error: any) {
    // console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
