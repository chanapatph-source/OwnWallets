import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedGsiUser: User | null = null;

export class UnauthorizedDomainError extends Error {
  code: string = 'auth/unauthorized-domain';
  domain: string;
  projectId: string;
  settingsUrl: string;

  constructor(domain: string, projectId: string) {
    super(`โดเมน "${domain}" ยังไม่ได้รับอนุญาตใน Firebase Authentication (auth/unauthorized-domain)`);
    this.name = 'UnauthorizedDomainError';
    this.domain = domain;
    this.projectId = projectId;
    this.settingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  }
}

export const getDomainConfig = () => {
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId;
  return {
    currentDomain,
    recommendedWildcard: 'run.app',
    projectId,
    settingsUrl: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
  };
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else if (cachedGsiUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(cachedGsiUser, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      cachedGsiUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Attempt sign-in via Google Identity Services (GSI) Token Client
 */
export const signInWithGSI = async (): Promise<{ user: User; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services (GSI) ยังโหลดไม่เสร็จสิ้น'));
    }

    try {
      const allScopes = [
        ...SCOPES,
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ].join(' ');

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: allScopes,
        callback: async (response: any) => {
          if (response.error) {
            return reject(new Error(response.error_description || response.error));
          }
          if (!response.access_token) {
            return reject(new Error('ไม่ได้รับ Access Token'));
          }

          cachedAccessToken = response.access_token;

          try {
            // Fetch user info using the token
            const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const info = await infoRes.json();
            const syntheticUser = {
              uid: info.sub || `gsi-${Date.now()}`,
              email: info.email || null,
              displayName: info.name || info.email || 'ผู้ใช้งาน Google',
              photoURL: info.picture || null,
              emailVerified: Boolean(info.email_verified),
            } as unknown as User;

            cachedGsiUser = syntheticUser;
            resolve({ user: syntheticUser, accessToken: response.access_token });
          } catch (fetchErr) {
            const fallbackUser = {
              uid: `gsi-${Date.now()}`,
              email: null,
              displayName: 'ผู้ใช้งาน Google',
              photoURL: null,
              emailVerified: true,
            } as unknown as User;
            cachedGsiUser = fallbackUser;
            resolve({ user: fallbackUser, accessToken: response.access_token });
          }
        },
        error_callback: (err: any) => {
          reject(err);
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Primary sign-in function:
 * First tries GSI token client (which does not check Firebase Authorized Domains).
 * If GSI is unavailable or fails, falls back to Firebase signInWithPopup.
 * If Firebase throws auth/unauthorized-domain, throws structured UnauthorizedDomainError.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  isSigningIn = true;
  try {
    // 1. Try Google Identity Services Token Client if available in window
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const gsiResult = await signInWithGSI();
        return gsiResult;
      } catch (gsiErr: any) {
        console.warn('GSI attempt failed, falling back to Firebase Auth:', gsiErr);
        // If user cancelled, don't fallback to another popup
        if (gsiErr?.message?.includes('closed') || gsiErr?.type === 'popup_closed') {
          throw gsiErr;
        }
      }
    }

    // 2. Fallback to Firebase signInWithPopup
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับ Access Token จาก Google ได้');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('auth/unauthorized-domain')
    ) {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new UnauthorizedDomainError(currentDomain, firebaseConfig.projectId);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  cachedAccessToken = null;
  cachedGsiUser = null;
};
