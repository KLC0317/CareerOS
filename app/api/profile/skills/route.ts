import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Email parameter is required.'
      }, { status: 400 });
    }

    try {
      const res = await query(
        `SELECT skill_name FROM acquired_skills 
         JOIN users ON acquired_skills.user_id = users.id 
         WHERE users.email = $1`,
        [email.toLowerCase()]
      );

      const skills = res.rows.map((row: any) => row.skill_name);

      return NextResponse.json({
        success: true,
        skills
      });
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('POSTGRESQL_OFFLINE')) {
        return NextResponse.json({
          success: false,
          error: 'POSTGRESQL_OFFLINE',
          message: 'PostgreSQL database is offline.'
        }, { status: 200 });
      }
      throw dbError;
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Error fetching acquired skills.'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, skillName } = await req.json();

    if (!email || !skillName) {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Email and skillName are required.'
      }, { status: 400 });
    }

    try {
      // Get user id
      const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'No user account matched the provided email.'
        }, { status: 404 });
      }
      const userId = userRes.rows[0].id;

      // Insert skill
      await query(
        `INSERT INTO acquired_skills (user_id, skill_name) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, skill_name) DO NOTHING`,
        [userId, skillName]
      );

      return NextResponse.json({
        success: true,
        message: `Marked "${skillName}" as acquired.`
      });
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('POSTGRESQL_OFFLINE')) {
        return NextResponse.json({
          success: false,
          error: 'POSTGRESQL_OFFLINE',
          message: 'PostgreSQL database is offline.'
        }, { status: 200 });
      }
      throw dbError;
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Error marking skill as acquired.'
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { email, skillName } = await req.json();

    if (!email || !skillName) {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Email and skillName are required.'
      }, { status: 400 });
    }

    try {
      // Get user id
      const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'No user account matched the provided email.'
        }, { status: 404 });
      }
      const userId = userRes.rows[0].id;

      // Delete skill
      await query(
        `DELETE FROM acquired_skills 
         WHERE user_id = $1 AND skill_name = $2`,
        [userId, skillName]
      );

      return NextResponse.json({
        success: true,
        message: `Removed "${skillName}" from acquired skills.`
      });
    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('POSTGRESQL_OFFLINE')) {
        return NextResponse.json({
          success: false,
          error: 'POSTGRESQL_OFFLINE',
          message: 'PostgreSQL database is offline.'
        }, { status: 200 });
      }
      throw dbError;
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Error removing acquired skill.'
    }, { status: 500 });
  }
}
