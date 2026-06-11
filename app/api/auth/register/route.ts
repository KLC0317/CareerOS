import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';
import bcryptjs from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, targetRole } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Name, email, and password are required.' }, { status: 400 });
    }

    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Check if email already exists
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account with this email already exists.' }, { status: 400 });
    }

    // Hash the password with production grade rounds (10)
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    // Save to PostgreSQL database
    const insertUser = await query(
      'INSERT INTO users (name, email, password_hash, target_role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, target_role',
      [name, email.toLowerCase(), hash, 'PENDING_ONBOARDING']
    );

    const user = insertUser.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetRole: user.target_role
      }
    });

  } catch (error: any) {
    // console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
