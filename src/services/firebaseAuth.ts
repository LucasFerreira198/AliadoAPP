import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, db, cleanForFirestore } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import type { Profile, UserRole } from '../types';
import { INITIAL_PROFILES } from './mockData';

export interface GoogleAuthResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

/**
 * Cria ou recupera o perfil institucional no Firestore vinculado à conta Google,
 * consolidando contas criadas previamente pelo Administrador por e-mail.
 */
async function syncGoogleUserProfile(user: any): Promise<Profile> {
  const email = (user.email || '').toLowerCase().trim();
  const profileRef = doc(db, 'profiles', user.uid);
  let existingProfile: Profile | null = null;

  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      existingProfile = { ...snap.data(), id: snap.id } as Profile;
    }
  } catch (err) {
    console.warn('[FirebaseAuth] Não foi possível buscar perfil existente por UID:', err);
  }

  // Verifica se existe alguma conta cadastrada pelo Admin com este e-mail no Firestore
  // (pode ter sido criada com um UUID antes do primeiro login Google do usuário)
  if (email) {
    try {
      const q = query(collection(db, 'profiles'), where('email', '==', email));
      const querySnap = await getDocs(q);
      querySnap.docs.forEach(docSnap => {
        const otherData = docSnap.data() as Profile;
        if (docSnap.id !== user.uid) {
          // Se encontrou outra conta criada pelo admin com este e-mail e cargo prioritário
          if (!existingProfile || (otherData.role && otherData.role !== 'volunteer' && otherData.role !== 'member')) {
            existingProfile = {
              ...(existingProfile || {}),
              ...otherData,
              id: user.uid,
              avatar_url: user.photoURL || otherData.avatar_url || existingProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              full_name: otherData.full_name || user.displayName || existingProfile?.full_name || 'Membro da Igreja',
            };
          }
          // Remove documento legado para manter um único ID determinístico (o UID do Firebase Auth)
          deleteDoc(docSnap.ref).catch(() => {});
        } else if (otherData.role && otherData.role !== 'volunteer' && otherData.role !== 'member') {
          if (existingProfile) {
            existingProfile.role = otherData.role;
          }
        }
      });
    } catch (err) {
      console.warn('[FirebaseAuth] Erro ao consolidar contas por email no Firestore:', err);
    }
  }

  // Verifica se o e-mail corresponde a um perfil pré-configurado
  const preConfigured = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email);

  if (existingProfile) {
    if ((email === 'lokoporgame194@gmail.com' || preConfigured?.role === 'admin') && existingProfile.role !== 'admin') {
      existingProfile.role = 'admin';
    }

    try {
      await setDoc(profileRef, cleanForFirestore(existingProfile), { merge: true });
    } catch (err) {
      console.warn('[FirebaseAuth] Aviso ao atualizar cargo no Firestore:', err);
    }
    return existingProfile;
  }

  const newProfile: Profile = {
    id: user.uid,
    full_name: user.displayName || preConfigured?.full_name || 'Membro da Igreja',
    email,
    phone: user.phoneNumber || preConfigured?.phone || '',
    role: (email === 'lokoporgame194@gmail.com' || preConfigured?.role === 'admin')
      ? 'admin'
      : ((preConfigured?.role as UserRole) || 'volunteer'),
    avatar_url: user.photoURL || preConfigured?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    is_active: true,
  };

  if (preConfigured?.ministry_id) {
    newProfile.ministry_id = preConfigured.ministry_id;
  }
  if (preConfigured?.ministry_name) {
    newProfile.ministry_name = preConfigured.ministry_name;
  }

  try {
    await setDoc(profileRef, cleanForFirestore(newProfile), { merge: true });
  } catch (err) {
    console.warn('[FirebaseAuth] Aviso ao gravar novo perfil no Firestore:', err);
  }

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
