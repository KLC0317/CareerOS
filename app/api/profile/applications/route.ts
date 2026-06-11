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

    const applicationsRes = await query(
      `SELECT ja.job_id AS "jobId", ja.status, ja.applied_at AS "appliedAt"
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       WHERE u.email = $1
       ORDER BY ja.applied_at DESC`,
      [email.toLowerCase().trim()]
    );

    return NextResponse.json({ success: true, applications: applicationsRes.rows });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, jobId, status } = body;

    if (!email || !jobId || !status) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Fields email, jobId, and status are required.' }, { status: 400 });
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Find user by email
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND', message: 'User with this email does not exist.' }, { status: 404 });
    }

    const userId = userRes.rows[0].id;

    // Upsert application
    const upsertRes = await query(
      `INSERT INTO job_applications (user_id, job_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, job_id)
       DO UPDATE SET status = EXCLUDED.status, applied_at = CURRENT_TIMESTAMP
       RETURNING job_id AS "jobId", status, applied_at AS "appliedAt"`,
      [userId, jobId, status]
    );

    return NextResponse.json({ success: true, application: upsertRes.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
