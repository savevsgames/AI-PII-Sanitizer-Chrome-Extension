import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

/**
 * GitHub OAuth Token Exchange Cloud Function
 *
 * This function exchanges a GitHub authorization code for an access token,
 * then creates a Firebase custom token for the user.
 *
 * Called by: Chrome extension after user authorizes via GitHub OAuth
 */
export const githubAuth = onCall(async (request) => {
  const { code } = request.data;

  if (!code) {
    throw new HttpsError(
      'invalid-argument',
      'Authorization code is required'
    );
  }

  try {
    console.log('[GitHub Auth] Exchanging authorization code for access token...');

    // Get GitHub OAuth App credentials from environment
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!githubClientId || !githubClientSecret) {
      console.error('[GitHub Auth] Missing GitHub OAuth credentials in environment');
      throw new HttpsError(
        'failed-precondition',
        'GitHub OAuth not configured'
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[GitHub Auth] GitHub token exchange error:', tokenData.error_description);
      throw new HttpsError(
        'internal',
        `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new HttpsError(
        'internal',
        'No access token received from GitHub'
      );
    }

    console.log('[GitHub Auth] Access token received, fetching user info...');

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.id) {
      throw new HttpsError(
        'internal',
        'Failed to fetch GitHub user info'
      );
    }

    console.log('[GitHub Auth] User info received:', {
      id: githubUser.id,
      login: githubUser.login,
      email: githubUser.email,
    });

    // Create or update Firebase user
    const uid = `github:${githubUser.id}`;
    let firebaseUser;

    const auth = getAuth();

    try {
      // Try to get existing user
      firebaseUser = await auth.getUser(uid);
      console.log('[GitHub Auth] Existing user found:', uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        console.log('[GitHub Auth] Creating new user:', uid);
        firebaseUser = await auth.createUser({
          uid,
          email: githubUser.email || `${githubUser.login}@github.placeholder`,
          displayName: githubUser.name || githubUser.login,
          photoURL: githubUser.avatar_url,
          emailVerified: !!githubUser.email,
        });
      } else {
        throw error;
      }
    }

    // Create custom token for the user
    const customToken = await auth.createCustomToken(uid);

    console.log('[GitHub Auth] Custom token created successfully');

    return {
      token: customToken,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
    };

  } catch (error: any) {
    console.error('[GitHub Auth] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      `GitHub authentication failed: ${error.message}`
    );
  }
});
