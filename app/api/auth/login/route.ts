import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';
import bcryptjs from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Email and password are required.' }, { status: 400 });
    }

    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Retrieve user by email
    const findUser = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (findUser.rows.length === 0) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, { status: 400 });
    }

    const user = findUser.rows[0];

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, { status: 400 });
    }

    // Retrieve milestones if already onboarded
    let milestones: any[] = [];
    if (user.target_role !== 'PENDING_ONBOARDING') {
      try {
        const milestonesRes = await query(
          'SELECT id, role, organization, type, start_date AS "startDate", end_date AS "endDate", description, skills FROM milestones WHERE user_id = $1',
          [user.id]
        );
        milestones = milestonesRes.rows.map((row: any) => ({
          ...row,
          id: String(row.id)
        }));
      } catch (err) {
        console.error('Error fetching milestones on login:', err);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetRole: user.target_role,
        marketAnalysis: user.market_analysis,
        milestones
      }
    });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
