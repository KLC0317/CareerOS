import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = new URL(request.url).origin;
    
    // Read Client ID from process.env or fallback to the provided value
    const client_id = process.env.CLIENT_ID || '816892311453-gg62qqf35t0iegqasjfbrttr96iovgpo.apps.googleusercontent.com';
    const redirect_uri = `${origin}/api/auth/google/callback`;
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;
    
    return NextResponse.redirect(googleAuthUrl);
  } catch (error: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
