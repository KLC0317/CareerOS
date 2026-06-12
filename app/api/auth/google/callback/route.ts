import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection } from '@/lib/db';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');

  if (errorParam) {
    return NextResponse.json({ error: 'OAUTH_ERROR', message: `Google authentication failed: ${errorParam}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Authorization code is missing.' }, { status: 400 });
  }

  // Google credentials
  const client_id = process.env.CLIENT_ID || '';
  const client_secret = process.env.CLIENT_SECRET || '';
  const redirect_uri = `${requestUrl.origin}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code.');
    }

    const { access_token } = tokenData;

    // 2. Fetch user details from Google userinfo API
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      throw new Error(userInfo.error_description || 'Failed to retrieve user information from Google.');
    }

    const userEmail = userInfo.email.toLowerCase();
    const userName = userInfo.name;
    const userPicture = userInfo.picture || '';

    // Check database connection status
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.online) {
      // Fallback mode: Generate client-only profile when PostgreSQL is offline
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Authenticating...</title>
        </head>
        <body style="background-color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="width: 3rem; height: 3rem; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto;"></div>
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 700;">Finalizing Authentication</h2>
            <p style="margin: 0; font-size: 0.875rem; color: #64748b;">PostgreSQL offline. Signing into local sandbox session...</p>
          </div>
          <style>
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
          <script>
            localStorage.setItem('career_os_session_profile', JSON.stringify({
              name: "${userName.replace(/"/g, '\\"')}",
              email: "${userEmail}",
              targetRole: "PENDING_ONBOARDING",
              registered: true,
              isPremium: false,
              profilePicture: "${userPicture}",
              lastLogin: new Date().toISOString()
            }));
            localStorage.removeItem('career_os_session_applications');
            localStorage.removeItem('career_os_session_nodes');
            window.location.replace('/');
          </script>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // 3. Database integration: Check if user exists
    const findUser = await query('SELECT * FROM users WHERE email = $1', [userEmail]);
    let user;

    if (findUser.rows.length === 0) {
      // Insert new user
      const insertUser = await query(
        'INSERT INTO users (name, email, password_hash, target_role, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userName, userEmail, 'google-oauth', 'PENDING_ONBOARDING', userPicture]
      );
      user = insertUser.rows[0];
    } else {
      user = findUser.rows[0];
      // Update last login and profile picture if missing
      await query(
        'UPDATE users SET last_login = NOW(), profile_picture = COALESCE(profile_picture, $1) WHERE id = $2',
        [userPicture, user.id]
      );
      // Fetch latest record after update
      const updatedUser = await query('SELECT * FROM users WHERE id = $1', [user.id]);
      user = updatedUser.rows[0];
    }

    // 4. Fetch user milestones
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
        // console.error('Error fetching milestones during Google OAuth callback:', err);
      }
    }

    // 5. Fetch user job applications
    let applications: any[] = [];
    try {
      const applicationsRes = await query(
        'SELECT job_id AS "jobId", status, applied_at AS "appliedAt" FROM job_applications WHERE user_id = $1',
        [user.id]
      );
      applications = applicationsRes.rows.map((row: any) => ({
        jobId: row.jobId,
        status: row.status,
        appliedAt: row.appliedAt ? new Date(row.appliedAt).toISOString() : new Date().toISOString()
      }));
    } catch (err) {
      // console.error('Error fetching applications during Google OAuth callback:', err);
    }

    // Return HTML redirecting script
    const profileJson = JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      targetRole: user.target_role,
      marketAnalysis: user.market_analysis,
      pdfData: user.pdf_data,
      isPremium: user.is_premium || false,
      profilePicture: user.profile_picture || null,
      lastLogin: new Date().toISOString(),
      registered: true
    });

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
      </head>
      <body style="background-color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="width: 3rem; height: 3rem; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto;"></div>
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 700;">Redirecting to workspace</h2>
          <p style="margin: 0; font-size: 0.875rem; color: #64748b;">Syncing session state...</p>
        </div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
        <script>
          localStorage.setItem('career_os_session_profile', JSON.stringify(${profileJson}));
          localStorage.setItem('career_os_session_applications', JSON.stringify(${JSON.stringify(applications)}));
          ${milestones.length > 0 ? `localStorage.setItem('career_os_session_nodes', JSON.stringify(${JSON.stringify(milestones)}));` : "localStorage.removeItem('career_os_session_nodes');"}
          window.location.replace('/');
        </script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err: any) {
    return NextResponse.json({ error: 'OAUTH_ERROR', message: err.message || 'An error occurred during Google OAuth.' }, { status: 500 });
  }
}
