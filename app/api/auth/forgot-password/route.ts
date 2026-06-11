import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Email is required.' }, { status: 400 });
    }

    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Check if user exists
    const findUser = await query('SELECT name FROM users WHERE email = $1', [email.toLowerCase()]);
    if (findUser.rows.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND', message: 'No account with this email address exists.' }, { status: 404 });
    }

    // Generate secure random token
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour

    // Store token in database
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email.toLowerCase()]
    );

    // Simulated email service output
    console.log(`
      ======================================================
      SIMULATED EMAIL SERVICE: PASSWORD RESET REQUEST
      To: ${email}
      Subject: Reset your Career OS password
      Link: http://localhost:3000/?reset-token=${token}
      ======================================================
    `);

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated. Check server log output.',
      token // Return token so the client demo can simulate password reset easily
    });

  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
