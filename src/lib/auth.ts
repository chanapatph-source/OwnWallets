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
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Standard Firebase Google Sign-In with Sheets and Drive Scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  isSigningIn = true;
  try {
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
};
