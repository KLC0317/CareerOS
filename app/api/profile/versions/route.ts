import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Email search parameter is required.' }, { status: 400 });
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Retrieve all historical versions for this user
    let versionsRes = await query(
      `SELECT pv.id, pv.version_number AS "versionNumber", pv.resume_filename AS "resumeFilename", 
              pv.target_role AS "targetRole", pv.milestones, pv.market_analysis AS "marketAnalysis", pv.created_at AS "createdAt"
       FROM profile_versions pv
       JOIN users u ON u.id = pv.user_id
       WHERE u.email = $1
       ORDER BY pv.version_number DESC`,
      [email.toLowerCase()]
    );

    if (versionsRes.rows.length === 0) {
      // Check if user has milestones in the database
      const userRes = await query('SELECT id, target_role, market_analysis FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        if (user.target_role !== 'PENDING_ONBOARDING') {
          const milestonesRes = await query(
            'SELECT id, role, organization, type, start_date AS "startDate", end_date AS "endDate", description, skills FROM milestones WHERE user_id = $1',
            [user.id]
          );
          if (milestonesRes.rows.length > 0) {
            const milestones = milestonesRes.rows.map((row: any) => ({
              ...row,
              id: String(row.id)
            }));
            
            let fallbackAnalysis = user.market_analysis;
            if (!fallbackAnalysis) {
              const defaultGeo = 'Malaysia (Inferred)';
              let defaultDemand = '';
              let defaultJustification = '';
              if (user.target_role === 'AI Architect') {
                defaultDemand = 'Very High. AI engineering demand is surging in regional hubs due to Sovereign AI initiatives, data center clusters, and custom localized LLM deployments.';
                defaultJustification = 'Your PyTorch, Deep Learning, and System Architecture skills align perfectly with regional companies and technology centers investing heavily in AI tooling.';
              } else if (user.target_role === 'Frontend Architect') {
                defaultDemand = 'High. In demand for e-commerce, localized superapps, and banking platforms looking to optimize browser engine performance and web UI responsiveness.';
                defaultJustification = 'Your expertise in React, TypeScript, and state management fits regional engineering centers focusing on scaling web applications and high-fidelity user flows.';
              } else {
                defaultDemand = 'Strong. Tech teams scaling in Kuala Lumpur and Singapore have high demand for experienced engineering leaders to guide agile sprints and system design.';
                defaultJustification = 'Your background in software development combined with technical leadership skills makes you a prime candidate to lead cross-functional engineering teams in the region.';
              }
              fallbackAnalysis = JSON.stringify({
                geo: defaultGeo,
                marketDemand: defaultDemand,
                justification: defaultJustification
              });

              // Save this back to the user record
              await query('UPDATE users SET market_analysis = $1 WHERE id = $2', [fallbackAnalysis, user.id]);
            }

            // Insert a Version 1 automatically from active database milestones
            await query(
              `INSERT INTO profile_versions (user_id, version_number, resume_filename, target_role, milestones, market_analysis)
               VALUES ($1, 1, $2, $3, $4, $5)`,
              [user.id, 'Imported Active Milestones', user.target_role, JSON.stringify(milestones), fallbackAnalysis]
            );

            // Re-fetch versions
            versionsRes = await query(
              `SELECT pv.id, pv.version_number AS "versionNumber", pv.resume_filename AS "resumeFilename", 
                      pv.target_role AS "targetRole", pv.milestones, pv.market_analysis AS "marketAnalysis", pv.created_at AS "createdAt"
               FROM profile_versions pv
               JOIN users u ON u.id = pv.user_id
               WHERE u.email = $1
               ORDER BY pv.version_number DESC`,
              [email.toLowerCase()]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      versions: versionsRes.rows
    });

  } catch (error: any) {
    console.error('Fetch Profile Versions Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, versionId } = await req.json();

    if (!email || !versionId) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Email and versionId are required.' }, { status: 400 });
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Retrieve the target profile version
    const findVersion = await query(
      `SELECT pv.target_role, pv.milestones, pv.market_analysis, u.id AS user_id 
       FROM profile_versions pv
       JOIN users u ON u.id = pv.user_id
       WHERE pv.id = $1 AND u.email = $2`,
      [versionId, email.toLowerCase()]
    );

    if (findVersion.rows.length === 0) {
      return NextResponse.json({ error: 'VERSION_NOT_FOUND', message: 'Profile version record not found.' }, { status: 404 });
    }

    const { target_role: targetRole, milestones, market_analysis: marketAnalysis, user_id: userId } = findVersion.rows[0];

    // 1. Update target_role and market_analysis on user profile
    await query('UPDATE users SET target_role = $1, market_analysis = $2 WHERE id = $3', [targetRole, marketAnalysis, userId]);

    // 2. Delete current active milestones
    await query('DELETE FROM milestones WHERE user_id = $1', [userId]);

    // 3. Re-insert milestones from version
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

    return NextResponse.json({
      success: true,
      message: `Profile successfully rolled back to target version.`,
      targetRole,
      marketAnalysis,
      milestones
    });

  } catch (error: any) {
    console.error('Restore Profile Version Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
