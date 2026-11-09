import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, db, cleanForFirestore } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Profile, UserRole } from '../types';
import { INITIAL_PROFILES } from './mockData';

export interface GoogleAuthResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

/**
 * Cria ou recupera o perfil institucional no Firestore vinculado à conta Google.
 */
async function syncGoogleUserProfile(user: any): Promise<Profile> {
  const email = (user.email || '').toLowerCase().trim();
  const profileRef = doc(db, 'profiles', user.uid);
  const snap = await getDoc(profileRef);

  // Verifica se o e-mail corresponde a um perfil institucional pré-cadastrado (pastor, admin, lider, etc)
  const preConfigured = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email);

  if (snap.exists()) {
    const existing = { ...snap.data(), id: snap.id } as Profile;
    if ((email === 'lokoporgame194@gmail.com' || preConfigured?.role === 'admin') && existing.role !== 'admin') {
      existing.role = 'admin';
      await setDoc(profileRef, cleanForFirestore({ role: 'admin' }), { merge: true });
    }
    return existing;
  }

  const newProfile: Profile = {
    id: user.uid,
    full_name: user.displayName || preConfigured?.full_name || 'Membro da Igreja',
    email,
    phone: user.phoneNumber || preConfigured?.phone || '',
    role: (email === 'lokoporgame194@gmail.com' ? 'admin' : (preConfigured?.role || 'volunteer')) as UserRole,
    ministry_id: preConfigured?.ministry_id,
    ministry_name: preConfigured?.ministry_name,
    avatar_url: user.photoURL || preConfigured?.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    is_active: true,
  };

  await setDoc(profileRef, cleanForFirestore(newProfile), { merge: true });
  return newProfile;
}

/**
 * Executa o fluxo de autenticação com o Google.
 * No ambiente Web: executa signInWithPopup nativo do Firebase.
 * No ambiente Mobile: executa o fluxo com provedor do Google.
 */
export async function signInWithGoogleService(): Promise<GoogleAuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    if (Platform.OS === 'web') {
      const result: UserCredential = await signInWithPopup(auth, provider);
      if (!result.user) {
        return { success: false, error: 'Não foi possível obter dados do usuário Google.' };
      }

      const profile = await syncGoogleUserProfile(result.user);
      return { success: true, profile };
    }

    // Ambiente Mobile (iOS / Android)
    // No Expo Go / Native, usa signInWithPopup em navegadores ou o redirect
    const result: UserCredential = await signInWithPopup(auth, provider);
    const profile = await syncGoogleUserProfile(result.user);
    return { success: true, profile };
  } catch (err: any) {
    console.warn('[FirebaseAuth] Erro no login com o Google:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'O login foi cancelado pelo usuário.' };
    }
    if (err.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'A solicitação de login foi cancelada.' };
    }
    if (err.code === 'auth/popup-blocked') {
      return { 
        success: false, 
        error: 'A janela de autenticação foi bloqueada pelo navegador. Permita pop-ups para este site ou utilize e-mail e senha.' 
      };
    }
    if (err.code === 'auth/unauthorized-domain') {
      return { 
        success: false, 
        error: 'Domínio web não autorizado no Firebase Console. Para acessar agora, faça login com seu e-mail e senha de administrador.' 
      };
    }
    if (err.code === 'auth/operation-not-allowed') {
      return { 
        success: false, 
        error: 'O provedor Google ainda não foi ativado no Firebase Console (Authentication > Sign-in method).' 
      };
    }
    return { 
      success: false, 
      error: err.message || 'Falha ao autenticar com o Google. Tente novamente ou use e-mail e senha.' 
    };
  }
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('[FirebaseAuth] Erro ao deslogar do Firebase:', err);
  }
}
