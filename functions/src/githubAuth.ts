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

    // ACCOUNT LINKING: Check for existing user by email first
    // This allows users to sign in with different providers but keep same UID
    const auth = getAuth();
    let firebaseUser;
    const githubEmail = githubUser.email || `${githubUser.login}@github.placeholder`;

    try {
      // First, try to find existing user by email
      if (githubUser.email) {
        console.log('[GitHub Auth] Checking for existing user with email:', githubEmail);
        try {
          firebaseUser = await auth.getUserByEmail(githubEmail);
          console.log('[GitHub Auth] 🔗 Found existing user by email! Linking accounts...');
          console.log('[GitHub Auth] Existing UID:', firebaseUser.uid);
          console.log('[GitHub Auth] This preserves encrypted data from other sign-in providers');

          // Update user's display name and photo if needed
          await auth.updateUser(firebaseUser.uid, {
            displayName: firebaseUser.displayName || githubUser.name || githubUser.login,
            photoURL: firebaseUser.photoURL || githubUser.avatar_url,
          });
        } catch (emailError: any) {
          if (emailError.code === 'auth/user-not-found') {
            // No existing user with this email, create new one
            console.log('[GitHub Auth] No existing user found, creating new account');
            firebaseUser = null;
          } else {
            throw emailError;
          }
        }
      }

      // If no user found by email, try GitHub UID
      if (!firebaseUser) {
        const githubUid = `github:${githubUser.id}`;
        try {
          firebaseUser = await auth.getUser(githubUid);
          console.log('[GitHub Auth] Existing GitHub user found:', githubUid);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            // Create new user with GitHub UID
            console.log('[GitHub Auth] Creating new user:', githubUid);
            firebaseUser = await auth.createUser({
              uid: githubUid,
              email: githubEmail,
              displayName: githubUser.name || githubUser.login,
              photoURL: githubUser.avatar_url,
              emailVerified: !!githubUser.email,
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('[GitHub Auth] Error during user lookup/creation:', error);
      throw error;
    }

    // Create custom token for the user (using the linked/found UID)
    const customToken = await auth.createCustomToken(firebaseUser.uid);

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
