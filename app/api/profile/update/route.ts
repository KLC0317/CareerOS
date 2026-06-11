import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, name, targetRole, isPremium, profilePicture } = await req.json();

    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Email and name are required fields.'
      }, { status: 400 });
    }

    try {
      // Execute PostgreSQL query
      await query(
        'UPDATE users SET name = $1, target_role = $2, is_premium = $3, profile_picture = $4 WHERE email = $5',
        [name, targetRole || 'AI Architect', !!isPremium, profilePicture || null, email.toLowerCase()]
      );

      return NextResponse.json({
        success: true,
        message: 'Saved',
        user: {
          name,
          email: email.toLowerCase(),
          targetRole: targetRole || 'AI Architect',
          isPremium: !!isPremium,
          profilePicture: profilePicture || null
        }
      });

    } catch (dbError: any) {
      if (dbError.message && dbError.message.includes('POSTGRESQL_OFFLINE')) {
        // Return failover response to let frontend save in sandbox
        return NextResponse.json({
          success: false,
          error: 'POSTGRESQL_OFFLINE',
          message: 'Fallback mode is active.'
        }, { status: 200 });
      }
      throw dbError;
    }

  } catch (error: any) {
    // console.error('Profile Update Endpoint Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Server encountered an error updating profile settings.'
    }, { status: 500 });
  }
}
