import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';
import bcryptjs from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Token and password are required.' }, { status: 400 });
    }

    // Verify database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      return NextResponse.json({ error: 'POSTGRESQL_OFFLINE', message: dbStatus.message }, { status: 503 });
    }

    // Retrieve user by reset token
    const findUser = await query('SELECT * FROM users WHERE reset_token = $1', [token]);
    if (findUser.rows.length === 0) {
      return NextResponse.json({ error: 'INVALID_TOKEN', message: 'Password reset token is invalid or has expired.' }, { status: 400 });
    }

    const user = findUser.rows[0];

    // Check expiry
    const now = new Date();
    const expiry = new Date(user.reset_token_expiry);
    if (now > expiry) {
      return NextResponse.json({ error: 'INVALID_TOKEN', message: 'Password reset token has expired.' }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    // Update password and clear token fields
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hash, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated.'
    });

  } catch (error: any) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
