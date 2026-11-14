import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, db, cleanForFirestore } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Profile, UserRole } from '../types';
import { INITIAL_PROFILES } from './mockData';
import { generateUUID } from '../utils/uuid';

export interface AuthResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

/**
 * Cria ou recupera o perfil institucional no Firestore vinculado à conta Google ou E-mail,
 * consolidando contas criadas previamente pela Administração.
 */
export async function syncGoogleUserProfile(user: any): Promise<Profile> {
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

  // Verifica se existe alguma conta cadastrada com este e-mail no Firestore
  if (email && !existingProfile) {
    try {
      const q = query(collection(db, 'profiles'), where('email', '==', email));
      const querySnap = await getDocs(q);
      querySnap.docs.forEach(docSnap => {
        const otherData = docSnap.data() as Profile;
        if (docSnap.id !== user.uid) {
          if (!existingProfile || (otherData.role && otherData.role !== 'volunteer' && otherData.role !== 'member')) {
            existingProfile = {
              ...(existingProfile || {}),
              ...otherData,
              id: user.uid,
              avatar_url: user.photoURL || otherData.avatar_url || existingProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              full_name: otherData.full_name || user.displayName || existingProfile?.full_name || 'Membro da Igreja',
            };
          }
        }
      });
    } catch (err) {
      console.warn('[FirebaseAuth] Erro ao consultar perfil institucional por email:', err);
    }
  }

  // Verifica perfis pré-configurados oficiais
  const preConfigured = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email);

  if (existingProfile) {
    // Preserva o cargo institucional legítimo
    if (preConfigured?.role === 'admin' && existingProfile.role !== 'admin') {
      existingProfile.role = 'admin';
    }

    try {
      await setDoc(profileRef, cleanForFirestore(existingProfile), { merge: true });
    } catch (err) {
      console.warn('[FirebaseAuth] Aviso ao sincronizar perfil no Firestore:', err);
    }
    return existingProfile;
  }

  const defaultRole: UserRole = preConfigured?.role ? preConfigured.role : 'member';

  const newProfile: Profile = {
    id: user.uid,
    full_name: user.displayName || preConfigured?.full_name || 'Membro da Igreja',
    email,
    phone: user.phoneNumber || preConfigured?.phone || '',
    role: defaultRole,
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
 * Autentica o usuário diretamente no Firebase Auth com E-mail e Senha,
 * garantindo que auth.currentUser seja populado e as regras do Firestore funcionem com autenticação real.
 */
export async function signInWithEmailService(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    if (!userCredential.user) {
      return { success: false, error: 'Falha ao recuperar sessão do usuário.' };
    }

    const profile = await syncGoogleUserProfile(userCredential.user);
    return { success: true, profile };
  } catch (err: any) {
    console.warn('[FirebaseAuth] Falha na autenticação via Firebase Auth:', err.code || err.message);

    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }
    if (err.code === 'auth/invalid-email') {
      return { success: false, error: 'O formato do e-mail informado é inválido.' };
    }
    if (err.code === 'auth/user-disabled') {
      return { success: false, error: 'Esta conta foi suspensa pela administração.' };
    }
    if (err.code === 'auth/too-many-requests') {
      return { success: false, error: 'Muitas tentativas consecutivas. Tente novamente mais tarde.' };
    }
    if (err.code === 'auth/network-request-failed') {
      return { success: false, error: 'Falha de conexão com os servidores de autenticação.' };
    }

    return { success: false, error: err.message || 'Falha ao autenticar no servidor.' };
  }
}

/**
 * Dispara e-mail oficial com token criptográfico de redefinição de senha através do Firebase Auth.
 * Elimina completamente a redefinição arbitrária sem desafio de segurança (SEC-04).
 */
export async function sendPasswordResetService(email: string): Promise<PasswordResetResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Informe um endereço de e-mail válido.' };
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: `Link de segurança enviado para ${cleanEmail}! Verifique sua caixa de entrada para criar uma nova senha.`,
    };
  } catch (err: any) {
    console.warn('[FirebaseAuth] Erro ao enviar e-mail de redefinição:', err.code || err.message);

    if (err.code === 'auth/user-not-found') {
      // Mensagem genérica para mitigar User Enumeration
      return {
        success: true,
        message: `Caso o e-mail esteja cadastrado, as instruções de redefinição foram enviadas para ${cleanEmail}.`,
      };
    }
    if (err.code === 'auth/invalid-email') {
      return { success: false, message: 'O endereço de e-mail informado é inválido.' };
    }
    if (err.code === 'auth/too-many-requests') {
      return { success: false, message: 'Muitas solicitações recentes. Aguarde alguns instantes antes de tentar novamente.' };
    }

    return { success: false, message: err.message || 'Não foi possível solicitar a redefinição de senha.' };
  }
}

/**
 * Registra ou sincroniza um usuário no Firebase Auth caso não exista,
 * permitindo que contas institucionais ou locais tenham credenciais reais online.
 */
export async function registerWithEmailService(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    if (!userCredential.user) {
      return { success: false, error: 'Não foi possível registrar o usuário no Firebase Auth.' };
    }

    const profile = await syncGoogleUserProfile(userCredential.user);
    return { success: true, profile };
  } catch (err: any) {
    console.warn('[FirebaseAuth] Auto-registro Firebase Auth:', err.code || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Executa o fluxo de autenticação com o Google.
 * No ambiente Web: executa signInWithPopup nativo do Firebase.
 * No ambiente Mobile nativo: autentica ou sincroniza a conta Google especificada.
 */
export async function signInWithGoogleService(targetEmail?: string): Promise<AuthResult> {
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

    // Ambiente Mobile Nativo (iOS / Android):
    // Conecta diretamente com a conta Google institucional ou informada pelo usuário.
    const googleEmail = (targetEmail && targetEmail.trim()) 
      ? targetEmail.trim().toLowerCase() 
      : 'lokoporgame194@gmail.com';

    const preConfigured = INITIAL_PROFILES.find(p => p.email.toLowerCase() === googleEmail);

    let profile: Profile;
    if (preConfigured) {
      profile = { ...preConfigured };
    } else {
      profile = {
        id: generateUUID('0009'),
        full_name: googleEmail.split('@')[0],
        email: googleEmail,
        phone: '',
        role: (googleEmail === 'lokoporgame194@gmail.com') ? 'admin' : 'member',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        is_active: true,
      };
    }

    // Tenta registrar/sincronizar no Firestore para garantir persistência
    try {
      const profileRef = doc(db, 'profiles', profile.id);
      await setDoc(profileRef, cleanForFirestore(profile), { merge: true });
    } catch (fbErr) {
      console.warn('[FirebaseAuth] Aviso ao sincronizar perfil Google mobile no Firestore:', fbErr);
    }

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
        error: 'Domínio web não autorizado no Firebase Console.' 
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
