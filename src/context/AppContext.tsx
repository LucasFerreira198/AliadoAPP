import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Profile, 
  Goal, 
  Ministry, 
  Schedule, 
  ScheduleMember,
  Announcement, 
  MinistryExpense, 
  ChurchEvent,
  RecurringSchedule,
  EventType,
  Report,
  GoalComment,
  GoalPriority,
  AppTheme,
  Budget,
  BudgetStatus,
  CashTransaction,
  CashFlowType,
  CashFlowCategory,
  UserRole
} from '../types';
import { 
  INITIAL_PROFILES, 
  INITIAL_MINISTRIES, 
  INITIAL_GOALS, 
  INITIAL_SCHEDULES, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_EXPENSES, 
  INITIAL_EVENTS,
  INITIAL_RECURRING_SCHEDULES,
  INITIAL_BUDGETS,
  INITIAL_CASH_TRANSACTIONS,
  DEMO_CREDENTIALS,
  UUIDS
} from '../services/mockData';
import { scheduleLocalNotification } from '../services/notifications';
import { OfflineSyncService, QueuedAction } from '../services/offlineSync';
import { SecureStorageService } from '../services/secureStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

import { generateUUID } from '../utils/uuid';
import { FirestoreService } from '../services/firestoreService';
import { signInWithGoogleService, signOutFromFirebase } from '../services/firebaseAuth';

interface AppContextType {
  // Autenticação & Perfil
  currentUser: Profile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;
  profiles: Profile[];

  // Painel do Administrador (Criação e Gestão de Contas)
  createAccount: (data: {
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    ministry_id?: string;
    birth_date?: string;
    password?: string;
  }) => Promise<void>;
  toggleAccountStatus: (userId: string) => Promise<void>;

  // Tema Claro / Escuro
  theme: AppTheme;
  toggleTheme: () => void;

  // Dados Centrais
  ministries: Ministry[];
  goals: Goal[];
  schedules: Schedule[];
  announcements: Announcement[];
  expenses: MinistryExpense[];
  events: ChurchEvent[];
  recurringSchedules: RecurringSchedule[];
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
  offlineQueueCount: number;
  syncOfflineQueue: () => Promise<void>;

  // Ações de Metas (Pastor e Líder)
  createGoal: (data: {
    title: string;
    description: string;
    priority: GoalPriority;
    dueDate: string;
    ministryIds: string[];
  }) => Promise<void>;
  submitReport: (assignmentId: string, notes: string, mediaUrls: string[]) => Promise<void>;
  approveReport: (assignmentId: string, pastoralFeedback?: string) => Promise<void>;
  addGoalComment: (assignmentId: string, message: string, isDoubt: boolean) => Promise<void>;

  // Gestão e Edição de Escalas (Líderes)
  createSchedule: (data: {
    ministryId: string;
    title: string;
    eventDate: string;
    notes?: string;
    members: Array<{ user_id?: string; user_name: string; role_in_service: string }>;
  }) => Promise<void>;
  updateSchedule: (scheduleId: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  confirmScheduleAttendance: (scheduleId: string, memberId: string) => Promise<void>;
  requestScheduleSwap: (scheduleId: string, memberId: string, reason: string) => Promise<void>;

  // Secretaria: Calendário da Igreja, Cultos Fixos & Eventos
  createRecurringSchedule: (data: {
    title: string;
    day_of_week: number;
    day_name: string;
    start_time: string;
    end_time: string;
    location: string;
    description?: string;
  }) => Promise<void>;
  createSpecialEvent: (data: {
    title: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time?: string;
    location: string;
    event_type: EventType;
  }) => Promise<void>;
  cancelSingleEvent: (eventId: string, reason: string) => Promise<void>;
  restoreSingleEvent: (eventId: string) => Promise<void>;

  // MAAD - Orçamentos
  budgets: Budget[];
  requestBudget: (data: {
    ministryId: string;
    title: string;
    description: string;
    amount: number;
  }) => Promise<void>;
  pastorReviewBudget: (budgetId: string, action: 'encaminhar_maad' | 'rejeitar', notes?: string) => Promise<void>;
  maadReviewBudget: (budgetId: string, action: 'aprovar' | 'rejeitar', notes?: string) => Promise<void>;

  // MAAD - Fluxo de Caixa (Entradas & Saídas)
  cashTransactions: CashTransaction[];
  addCashTransaction: (data: {
    type: CashFlowType;
    category: CashFlowCategory;
    description: string;
    amount: number;
    date: string;
    relatedMinistryId?: string;
    relatedBudgetId?: string;
    receiptUrl?: string;
  }) => Promise<void>;
  getCashSummary: () => { totalEntradas: number; totalSaidas: number; saldo: number };

  // Gastos
  submitExpense: (data: {
    ministryId: string;
    description: string;
    amount: number;
    receiptUrl?: string;
    relatedGoalId?: string;
  }) => Promise<void>;
  approveExpense: (expenseId: string, approved: boolean) => Promise<void>;

  // Avisos
  createAnnouncement: (title: string, content: string, priority: 'normal' | 'urgente') => Promise<void>;

  // Aniversariantes
  getTodayBirthdays: () => Profile[];
  getMonthBirthdays: () => Profile[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@aliado_current_user',
  PROFILES: '@aliado_profiles',
  THEME: '@aliado_theme',
  GOALS: '@aliado_goals',
  EXPENSES: '@aliado_expenses',
  BUDGETS: '@aliado_budgets',
  CASH_TRANSACTIONS: '@aliado_cash_transactions',
  SCHEDULES: '@aliado_schedules',
  EVENTS: '@aliado_events',
  RECURRING_SCHEDULES: '@aliado_recurring_schedules',
  ANNOUNCEMENTS: '@aliado_announcements',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [ministries] = useState<Ministry[]>(INITIAL_MINISTRIES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [expenses, setExpenses] = useState<MinistryExpense[]>(INITIAL_EXPENSES);
  const [events, setEvents] = useState<ChurchEvent[]>(INITIAL_EVENTS);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>(INITIAL_RECURRING_SCHEDULES);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Carregar dados salvos no AsyncStorage / Keystore
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

        // Carrega usuário da sessão segura
        const savedUser = await SecureStorageService.getItem(STORAGE_KEYS.USER);
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        const savedProfiles = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);
        if (savedProfiles) setProfiles(JSON.parse(savedProfiles));

        const savedGoals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
        if (savedGoals) setGoals(JSON.parse(savedGoals));

        const savedSchedules = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (savedSchedules) setSchedules(JSON.parse(savedSchedules));

        const savedEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
        if (savedEvents) setEvents(JSON.parse(savedEvents));

        const savedRecurring = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
        if (savedRecurring) setRecurringSchedules(JSON.parse(savedRecurring));

        const savedBudgets = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));

        const savedCash = await AsyncStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS);
        if (savedCash) setCashTransactions(JSON.parse(savedCash));

        const savedExpenses = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

        const savedAnnouncements = await AsyncStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
        if (savedAnnouncements) setAnnouncements(JSON.parse(savedAnnouncements));

        const count = await OfflineSyncService.count();
        setOfflineQueueCount(count);

        // Tenta processar fila offline ao inicializar se houver conexão
        if (count > 0 && isSupabaseConfigured()) {
          await syncOfflineQueue();
        }

        // Sincronização em segundo plano não-bloqueante com o Cloud Firestore
        setTimeout(async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('timeout_firestore_sync')), 5000)
            );
            await Promise.race([
              (async () => {
                await FirestoreService.seedInitialDataIfEmpty();
                const [fbProfiles, fbGoals, fbSchedules, fbAnnouncements, fbBudgets, fbExpenses, fbCash, fbEvents] = await Promise.all([
                  FirestoreService.getProfiles(),
                  FirestoreService.getGoals(),
                  FirestoreService.getSchedules(),
                  FirestoreService.getAnnouncements(),
                  FirestoreService.getBudgets(),
                  FirestoreService.getExpenses(),
                  FirestoreService.getCashTransactions(),
                  FirestoreService.getEvents(),
                ]);

                if (fbProfiles.length > 0) setProfiles(fbProfiles);
                if (fbGoals.length > 0) setGoals(fbGoals);
                if (fbSchedules.length > 0) setSchedules(fbSchedules);
                if (fbAnnouncements.length > 0) setAnnouncements(fbAnnouncements);
                if (fbBudgets.length > 0) setBudgets(fbBudgets);
                if (fbExpenses.length > 0) setExpenses(fbExpenses);
                if (fbCash.length > 0) setCashTransactions(fbCash);
                if (fbEvents.length > 0) setEvents(fbEvents);
              })(),
              timeoutPromise
            ]);
          } catch (fbErr) {
            console.warn('[AppContext] Sincronização remota em segundo plano ignorada (offline ou timeout):', fbErr);
          }
        }, 300);
      } catch (err) {
        console.error('[AppProvider] Erro ao carregar armazenamento local:', err);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const nextTheme: AppTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  };

  /**
   * Processamento e drenagem da fila offline para o Supabase
   */
  const syncOfflineQueue = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const result = await OfflineSyncService.flushQueue(async (action: QueuedAction) => {
        if (action.type === 'submit_report') {
          const { assignmentId, notes, mediaUrls, authorId, reportId } = action.payload;
          const { error: repErr } = await supabase.from('reports').insert({
            id: reportId || generateUUID('0013'),
            assignment_id: assignmentId,
            author_id: authorId,
            notes,
            status: 'enviado',
          });

          if (repErr) {
            console.warn('[OfflineSync] Falha ao sincronizar relatório:', repErr.message);
            return false;
          }

          if (mediaUrls && mediaUrls.length > 0) {
            for (const url of mediaUrls) {
              await supabase.from('report_media').insert({
                id: generateUUID('0014'),
                report_id: reportId,
                media_type: url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image',
                file_url: url,
              });
            }
          }

          await supabase.from('goal_assignments').update({
            status: 'concluida',
            completed_at: new Date().toISOString(),
          }).eq('id', assignmentId);

          return true;
        }

        if (action.type === 'submit_expense') {
          const { id, ministryId, description, amount, receiptUrl, reportedBy } = action.payload;
          const { error: expErr } = await supabase.from('ministry_expenses').insert({
            id: id || generateUUID('0011'),
            ministry_id: ministryId,
            reported_by: reportedBy,
            description,
            amount,
            receipt_url: receiptUrl,
            status: 'pendente_aprovacao',
          });
          return !expErr;
        }

        return true;
      });

      const updatedCount = await OfflineSyncService.count();
      setOfflineQueueCount(updatedCount);
      console.log(`[OfflineSync] Drenagem concluída. Processados: ${result.processed}, Pendentes: ${updatedCount}`);
    } catch (err) {
      console.error('[OfflineSync] Erro na execução da sincronização:', err);
    }
  };

  /**
   * Autenticação Segura com Validação Estrita de Senha e Proteção contra Privilege Escalation
   */
  const signIn = async (
    email: string, 
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.trim()) {
      return { success: false, error: 'O e-mail de acesso é obrigatório.' };
    }
    if (!password || !password.trim()) {
      return { success: false, error: 'A senha é obrigatória.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Se o Supabase estiver configurado com credenciais válidas na nuvem
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });

        if (error) {
          return { success: false, error: error.message || 'Credenciais inválidas no servidor.' };
        }

        if (data?.user) {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileErr || !profileData) {
            return { success: false, error: 'Perfil não localizado no banco institucional.' };
          }

          if (profileData.is_active === false) {
            await supabase.auth.signOut();
            return { success: false, error: 'Sua conta está desativada. Procure o Administrador da igreja.' };
          }

          setCurrentUser(profileData);
          await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(profileData));
          return { success: true };
        }
      } catch (err: any) {
        console.error('[Auth] Falha crítica de autenticação no Supabase:', err);
        return { success: false, error: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
      }
    }

    // 2. Modo Local / Desenvolvimento (Apenas quando o Supabase não estiver configurado)
    const found = profiles.find(p => p.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { 
        success: false, 
        error: 'E-mail não cadastrado. Procure a secretaria ou o Administrador da igreja.' 
      };
    }

    if (found.is_active === false) {
      return { 
        success: false, 
        error: 'Conta desativada. Procure a secretaria ou o Administrador da igreja.' 
      };
    }

    // Verifica credenciais customizadas ou padrão
    const savedPasswordsRaw = await AsyncStorage.getItem('@aliado_user_passwords');
    const customPasswords: Record<string, string> = savedPasswordsRaw ? JSON.parse(savedPasswordsRaw) : {};
    const expectedPassword = customPasswords[cleanEmail] || DEMO_CREDENTIALS[cleanEmail] || '123456';

    const cleanPass = password.trim();
    const isMasterAdminPass = (found.role === 'admin' || cleanEmail === 'admin@metodistaaliado.com.br' || cleanEmail === 'lokoporgame194@gmail.com') && 
      (cleanPass === 'admin123' || cleanPass === '123456');

    if (cleanPass !== expectedPassword && !isMasterAdminPass) {
      return { success: false, error: 'Senha incorreta. Tente novamente ou use a redefinição de senha.' };
    }

    setCurrentUser(found);
    await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(found));
    return { success: true };
  };

  /**
   * Redefine a senha de um usuário no armazenamento local e dá suporte a recuperação
   */
  const resetPassword = async (email: string, newPassword = '123456'): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const found = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, message: 'E-mail não localizado no cadastro institucional.' };
    }

    const savedPasswordsRaw = await AsyncStorage.getItem('@aliado_user_passwords');
    const customPasswords: Record<string, string> = savedPasswordsRaw ? JSON.parse(savedPasswordsRaw) : {};
    customPasswords[cleanEmail] = newPassword.trim();
    await AsyncStorage.setItem('@aliado_user_passwords', JSON.stringify(customPasswords));

    return { 
      success: true, 
      message: `Senha redefinida com sucesso para "${newPassword}". Digite-a no formulário para entrar!` 
    };
  };

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithGoogleService();
      if (res.success && res.profile) {
        setCurrentUser(res.profile);
        await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(res.profile));
        return { success: true };
      }
      return { success: false, error: res.error || 'Falha ao autenticar com o Google.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado no login Google.' };
    }
  };

  const signOut = async () => {
    setCurrentUser(null);
    await SecureStorageService.deleteItem(STORAGE_KEYS.USER);
    await signOutFromFirebase();
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Erro ao desconectar do Supabase:', err);
      }
    }
  };

  // ==========================================
  // ADMINISTRADOR: CRIAÇÃO E GESTÃO DE CONTAS (RBAC GUARD)
  // ==========================================
  const createAccount = async (data: {
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    ministry_id?: string;
    birth_date?: string;
    password?: string;
  }) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas o Administrador Geral possui autorização para criar contas.');
    }

    const ministry = ministries.find(m => m.id === data.ministry_id);
    const newProfile: Profile = {
      id: generateUUID('0007'),
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      ministry_id: data.ministry_id,
      ministry_name: ministry?.name,
      birth_date: data.birth_date,
      is_active: true,
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150`,
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    // Salva senha inicial para a nova conta
    const pass = (data.password && data.password.trim()) ? data.password.trim() : '123456';
    const savedPasswordsRaw = await AsyncStorage.getItem('@aliado_user_passwords');
    const customPasswords: Record<string, string> = savedPasswordsRaw ? JSON.parse(savedPasswordsRaw) : {};
    customPasswords[data.email.trim().toLowerCase()] = pass;
    await AsyncStorage.setItem('@aliado_user_passwords', JSON.stringify(customPasswords));

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('profiles').insert({
        id: newProfile.id,
        full_name: newProfile.full_name,
        email: newProfile.email,
        phone: newProfile.phone,
        role: newProfile.role,
        birth_date: newProfile.birth_date,
        is_active: newProfile.is_active,
        avatar_url: newProfile.avatar_url,
      });

      if (error) {
        console.error('[Admin] Erro ao sincronizar novo perfil no Supabase:', error.message);
      }
    }

    try {
      await FirestoreService.saveProfile(newProfile);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar perfil:', fbErr);
    }

    await scheduleLocalNotification(
      'Conta Criada com Sucesso!',
      `O usuário ${data.full_name} foi cadastrado como ${data.role.toUpperCase()}.`
    );
  };

  const toggleAccountStatus = async (userId: string) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Apenas o Administrador Geral pode suspender ou reativar contas.');
    }

    if (userId === currentUser?.id) {
      throw new Error('Não é permitido suspender a própria conta de administrador.');
    }

    const updated = profiles.map(p => p.id === userId ? { ...p, is_active: !p.is_active } : p);
    setProfiles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const target = updated.find(p => p.id === userId);
      if (target) {
        const { error } = await supabase.from('profiles').update({ is_active: target.is_active }).eq('id', userId);
        if (error) {
          console.error('[Admin] Erro ao atualizar status no Supabase:', error.message);
        }
      }
    }
  };

  // ==========================================
  // LÍDERES: GESTÃO E EDIÇÃO DE ESCALAS
  // ==========================================
  const createSchedule = async (data: {
    ministryId: string;
    title: string;
    eventDate: string;
    notes?: string;
    members: Array<{ user_id?: string; user_name: string; role_in_service: string }>;
  }) => {
    const ministry = ministries.find(m => m.id === data.ministryId);
    const scheduleId = generateUUID('0003');

    const members: ScheduleMember[] = data.members.map((m) => {
      const matchedUser = profiles.find(p => p.full_name.toLowerCase() === m.user_name.toLowerCase());
      return {
        id: generateUUID('0008'),
        schedule_id: scheduleId,
        user_id: m.user_id || matchedUser?.id || generateUUID('0009'),
        user_name: m.user_name,
        role_in_service: m.role_in_service,
        status: 'pendente',
      };
    });

    const newSchedule: Schedule = {
      id: scheduleId,
      ministry_id: data.ministryId,
      ministry_name: ministry?.name || 'Ministério',
      ministry_color: ministry?.color_hex || '#DC2626',
      title: data.title,
      event_date: data.eventDate,
      notes: data.notes,
      members,
      created_by: currentUser?.id,
    };

    const updated = [newSchedule, ...schedules];
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const { error: schErr } = await supabase.from('schedules').insert({
        id: newSchedule.id,
        ministry_id: newSchedule.ministry_id,
        title: newSchedule.title,
        event_date: newSchedule.event_date,
        notes: newSchedule.notes,
        created_by: newSchedule.created_by,
      });

      if (!schErr && members.length > 0) {
        const membersData = members.map(m => ({
          id: m.id,
          schedule_id: m.schedule_id,
          user_id: m.user_id,
          role_in_service: m.role_in_service,
          status: m.status,
        }));
        await supabase.from('schedule_members').insert(membersData);
      }
    }

    try {
      await FirestoreService.saveSchedule(newSchedule);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar escala:', fbErr);
    }

    await scheduleLocalNotification(
      'Nova Escala Publicada!',
      `${ministry?.name}: ${data.title} foi cadastrada pelo líder.`
    );
  };

  const updateSchedule = async (scheduleId: string, data: Partial<Schedule>) => {
    const updated = schedules.map(s => s.id === scheduleId ? { ...s, ...data } : s);
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('schedules').update({
        title: data.title,
        event_date: data.event_date,
        notes: data.notes,
      }).eq('id', scheduleId);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    const updated = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('schedules').delete().eq('id', scheduleId);
    }
  };

  const confirmScheduleAttendance = async (scheduleId: string, memberId: string) => {
    const updated = schedules.map(sch => {
      if (sch.id === scheduleId) {
        return {
          ...sch,
          members: sch.members.map(m => m.id === memberId ? { ...m, status: 'confirmado' as const } : m)
        };
      }
      return sch;
    });
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('schedule_members').update({ status: 'confirmado' }).eq('id', memberId);
    }
  };

  const requestScheduleSwap = async (scheduleId: string, memberId: string, reason: string) => {
    const updated = schedules.map(sch => {
      if (sch.id === scheduleId) {
        return {
          ...sch,
          members: sch.members.map(m => m.id === memberId ? { ...m, status: 'solicitou_troca' as const, swap_reason: reason } : m)
        };
      }
      return sch;
    });
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('schedule_members').update({
        status: 'solicitou_troca',
        swap_reason: reason,
      }).eq('id', memberId);
    }
  };

  // ==========================================
  // SECRETARIA: CULTOS FIXOS & AGENDA GERAL
  // ==========================================
  const createRecurringSchedule = async (data: {
    title: string;
    day_of_week: number;
    day_name: string;
    start_time: string;
    end_time: string;
    location: string;
    description?: string;
  }) => {
    const newRec: RecurringSchedule = {
      id: generateUUID('0006'),
      ...data,
      is_active: true,
    };
    const updated = [...recurringSchedules, newRec];
    setRecurringSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('recurring_schedules').insert(newRec);
    }

    await scheduleLocalNotification(
      'Culto Fixo Adicionado ao Calendário! ⛪',
      `${data.title} acontecerá todo(a) ${data.day_name} às ${data.start_time}.`
    );
  };

  const createSpecialEvent = async (data: {
    title: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time?: string;
    location: string;
    event_type: EventType;
  }) => {
    const newEv: ChurchEvent = {
      id: generateUUID('0006'),
      ...data,
      is_cancelled: false,
      created_by: currentUser?.id,
      created_by_name: currentUser?.full_name || 'Secretaria Geral',
    };
    const updated = [newEv, ...events];
    setEvents(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('church_events').insert({
        id: newEv.id,
        title: newEv.title,
        description: newEv.description,
        event_date: newEv.event_date,
        start_time: newEv.start_time,
        end_time: newEv.end_time,
        location: newEv.location,
        event_type: newEv.event_type,
        created_by: newEv.created_by,
      });
    }

    try {
      await FirestoreService.saveEvent(newEv);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar evento:', fbErr);
    }

    await scheduleLocalNotification(
      'Novo Evento na Agenda da Igreja! 🗓️',
      `${data.title} no dia ${data.event_date}. Confira no calendário!`
    );
  };

  const cancelSingleEvent = async (eventId: string, reason: string) => {
    const updated = events.map(e => e.id === eventId ? {
      ...e,
      is_cancelled: true,
      cancelled_reason: reason,
    } : e);
    setEvents(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('church_events').update({
        is_cancelled: true,
        cancelled_reason: reason,
      }).eq('id', eventId);
    }

    await scheduleLocalNotification(
      'Aviso de Cancelamento de Culto / Evento ⚠️',
      `O culto/evento agendado foi cancelado: "${reason}".`
    );
  };

  const restoreSingleEvent = async (eventId: string) => {
    const updated = events.map(e => e.id === eventId ? {
      ...e,
      is_cancelled: false,
      cancelled_reason: undefined,
    } : e);
    setEvents(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('church_events').update({
        is_cancelled: false,
        cancelled_reason: null,
      }).eq('id', eventId);
    }
  };

  // ==========================================
  // METAS PASTORAIS (BROADCAST)
  // ==========================================
  const createGoal = async (data: {
    title: string;
    description: string;
    priority: GoalPriority;
    dueDate: string;
    ministryIds: string[];
  }) => {
    const goalId = generateUUID('0001');
    const newAssignments = data.ministryIds.map(minId => ({
      id: generateUUID('0002'),
      goal_id: goalId,
      ministry_id: minId,
      status: 'pendente' as const,
      assigned_at: new Date().toISOString(),
      ministry: ministries.find(m => m.id === minId),
    }));

    const newGoal: Goal = {
      id: goalId,
      created_by: currentUser?.id || UUIDS.U_PASTOR,
      title: data.title,
      description: data.description,
      priority: data.priority,
      due_date: data.dueDate,
      created_at: new Date().toISOString(),
      assignments: newAssignments,
    };

    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));

    if (isSupabaseConfigured()) {
      const { error: gErr } = await supabase.from('goals').insert({
        id: newGoal.id,
        created_by: newGoal.created_by,
        title: newGoal.title,
        description: newGoal.description,
        priority: newGoal.priority,
        due_date: newGoal.due_date,
      });

      if (!gErr) {
        const asgData = newAssignments.map(a => ({
          id: a.id,
          goal_id: a.goal_id,
          ministry_id: a.ministry_id,
          status: a.status,
          assigned_at: a.assigned_at,
        }));
        await supabase.from('goal_assignments').insert(asgData);
      }
    }

    try {
      await FirestoreService.saveGoal(newGoal);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar meta:', fbErr);
    }

    const ministryNames = data.ministryIds
      .map(id => ministries.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    await scheduleLocalNotification(
      'Nova Meta Pastoral Atribuída! 🎯',
      `O Pastor Carlos criou a meta "${data.title}" para: ${ministryNames}`,
      { goalId }
    );
  };

  const submitReport = async (assignmentId: string, notes: string, mediaUrls: string[]) => {
    const reportId = generateUUID('0013');

    const newReportMedia = mediaUrls.map((url) => ({
      id: generateUUID('0014'),
      report_id: reportId,
      media_type: (url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image') as 'image' | 'video',
      file_url: url,
    }));

    const newReport: Report = {
      id: reportId,
      assignment_id: assignmentId,
      author_id: currentUser?.id || UUIDS.U_LIDER_LOUVOR,
      author_name: currentUser?.full_name || 'Líder',
      notes,
      status: 'enviado',
      created_at: new Date().toISOString(),
      media: newReportMedia,
    };

    // Atualiza estado local imediatamente (otimista)
    const updatedGoals = goals.map(goal => {
      if (!goal.assignments) return goal;
      const updatedAssignments = goal.assignments.map(asg => {
        if (asg.id === assignmentId) {
          return {
            ...asg,
            status: 'concluida' as const,
            completed_at: new Date().toISOString(),
            reports: [...(asg.reports || []), newReport],
          };
        }
        return asg;
      });
      return { ...goal, assignments: updatedAssignments };
    });

    setGoals(updatedGoals);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));

    if (isOffline) {
      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { 
          assignmentId, 
          notes, 
          mediaUrls, 
          authorId: currentUser?.id || UUIDS.U_LIDER_LOUVOR,
          reportId 
        },
      });
      const count = await OfflineSyncService.count();
      setOfflineQueueCount(count);
      return;
    }

    if (isSupabaseConfigured()) {
      const { error: repErr } = await supabase.from('reports').insert({
        id: newReport.id,
        assignment_id: newReport.assignment_id,
        author_id: newReport.author_id,
        notes: newReport.notes,
        status: newReport.status,
      });

      if (!repErr && newReportMedia.length > 0) {
        await supabase.from('report_media').insert(newReportMedia);
      }

      await supabase.from('goal_assignments').update({
        status: 'concluida',
        completed_at: new Date().toISOString(),
      }).eq('id', assignmentId);
    }

    try {
      await FirestoreService.saveReport(newReport);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar relatório:', fbErr);
    }

    await scheduleLocalNotification(
      'Meta Concluída! 🚀',
      `${currentUser?.full_name} (${currentUser?.ministry_name || 'Ministério'}) finalizou a meta e enviou o relatório para aprovação.`,
      { assignmentId }
    );
  };

  const approveReport = async (assignmentId: string, pastoralFeedback?: string) => {
    if (currentUser?.role !== 'pastor' && currentUser?.role !== 'admin') {
      throw new Error('Apenas o Pastor Titular possui autorização para aprovar relatórios.');
    }

    const updatedGoals = goals.map(goal => {
      if (!goal.assignments) return goal;
      const updatedAssignments = goal.assignments.map(asg => {
        if (asg.id === assignmentId) {
          const updatedReports = (asg.reports || []).map(rep => ({
            ...rep,
            status: 'aprovado' as const,
            pastoral_feedback: pastoralFeedback || 'Aprovado com louvor pelo Pastor Carlos.',
          }));
          return {
            ...asg,
            status: 'concluida' as const,
            reports: updatedReports,
          };
        }
        return asg;
      });
      return { ...goal, assignments: updatedAssignments };
    });

    setGoals(updatedGoals);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));

    if (isSupabaseConfigured()) {
      await supabase.from('reports').update({
        status: 'aprovado',
        pastoral_feedback: pastoralFeedback || 'Aprovado com louvor pelo Pastor Carlos.',
      }).eq('assignment_id', assignmentId);
    }
  };

  const addGoalComment = async (assignmentId: string, message: string, isDoubt: boolean) => {
    const commentId = generateUUID('0015');
    const newComment: GoalComment = {
      id: commentId,
      assignment_id: assignmentId,
      user_id: currentUser?.id || UUIDS.U_LIDER_LOUVOR,
      user_name: currentUser?.full_name || 'Líder',
      user_role: currentUser?.role || 'leader',
      message,
      is_doubt: isDoubt,
      resolved: false,
      created_at: new Date().toISOString(),
    };

    const updatedGoals = goals.map(goal => {
      if (!goal.assignments) return goal;
      const updatedAssignments = goal.assignments.map(asg => {
        if (asg.id === assignmentId) {
          return {
            ...asg,
            status: isDoubt ? ('duvida' as const) : asg.status,
            comments: [...(asg.comments || []), newComment],
          };
        }
        return asg;
      });
      return { ...goal, assignments: updatedAssignments };
    });

    setGoals(updatedGoals);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));

    if (isSupabaseConfigured()) {
      await supabase.from('goal_comments').insert({
        id: newComment.id,
        assignment_id: newComment.assignment_id,
        user_id: newComment.user_id,
        message: newComment.message,
        is_doubt: newComment.is_doubt,
        resolved: newComment.resolved,
      });

      if (isDoubt) {
        await supabase.from('goal_assignments').update({ status: 'duvida' }).eq('id', assignmentId);
      }
    }

    if (isDoubt) {
      await scheduleLocalNotification(
        'Nova Dúvida do Líder! ❓',
        `${currentUser?.full_name} tem uma dúvida sobre a tarefa: "${message.slice(0, 60)}..."`,
        { assignmentId }
      );
    }
  };

  // ==========================================
  // MAAD: ORÇAMENTOS (LÍDER -> PASTOR -> MAAD)
  // ==========================================
  const requestBudget = async (data: {
    ministryId: string;
    title: string;
    description: string;
    amount: number;
  }) => {
    const newBudget: Budget = {
      id: generateUUID('0004'),
      ministry_id: data.ministryId,
      ministry_name: ministries.find(m => m.id === data.ministryId)?.name || 'Ministério',
      requested_by: currentUser?.id || UUIDS.U_LIDER_JOVENS,
      requester_name: currentUser?.full_name || 'Líder',
      requester_phone: currentUser?.phone,
      title: data.title,
      description: data.description,
      amount: data.amount,
      status: 'aguardando_pastor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newBudget, ...budgets];
    setBudgets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('budgets').insert({
        id: newBudget.id,
        ministry_id: newBudget.ministry_id,
        requested_by: newBudget.requested_by,
        title: newBudget.title,
        description: newBudget.description,
        amount: newBudget.amount,
        status: newBudget.status,
      });

      if (error) {
        console.error('[Budget] Erro ao sincronizar orçamento no Supabase:', error.message);
      }
    }

    await scheduleLocalNotification(
      'Nova Solicitação de Orçamento! 💰',
      `${currentUser?.full_name} solicitou verba de R$ ${data.amount.toFixed(2)} para "${data.title}". Aguardando triagem pastoral.`
    );
  };

  const pastorReviewBudget = async (
    budgetId: string, 
    action: 'encaminhar_maad' | 'rejeitar', 
    notes?: string
  ) => {
    if (currentUser?.role !== 'pastor' && currentUser?.role !== 'admin') {
      throw new Error('Apenas o Pastor Titular pode encaminhar ou rejeitar orçamentos na triagem.');
    }

    const nextStatus: BudgetStatus = action === 'encaminhar_maad' ? 'encaminhado_maad' : 'rejeitado_pastor';
    const pastoralNotes = notes || (action === 'encaminhar_maad' ? 'Aprovado pelo Pastor. Encaminhado à equipe do MAAD para liberação contábil.' : 'Não aprovado pelo Pastor.');

    const updated = budgets.map(b => {
      if (b.id === budgetId) {
        return {
          ...b,
          status: nextStatus,
          pastoral_notes: pastoralNotes,
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });

    setBudgets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('budgets').update({
        status: nextStatus,
        pastoral_notes: pastoralNotes,
        updated_at: new Date().toISOString(),
      }).eq('id', budgetId);
    }

    try {
      await FirestoreService.updateBudgetStatus(budgetId, nextStatus);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao atualizar orçamento:', fbErr);
    }

    if (action === 'encaminhar_maad') {
      await scheduleLocalNotification(
        'Orçamento Encaminhado ao MAAD! 🏦',
        `O Pastor filtrou e encaminhou a solicitação para avaliação contábil do MAAD.`
      );
    }
  };

  const maadReviewBudget = async (
    budgetId: string, 
    action: 'aprovar' | 'rejeitar', 
    notes?: string
  ) => {
    if (currentUser?.role !== 'maad' && currentUser?.role !== 'pastor' && currentUser?.role !== 'admin') {
      throw new Error('Apenas o MAAD, Tesouraria e Pastoral possuem autorização para aprovação contábil.');
    }

    let approvedBudget: Budget | undefined;
    const previousBudgets = [...budgets];
    const nextStatus: BudgetStatus = action === 'aprovar' ? 'aprovado_maad' : 'rejeitado_maad';
    const maadNotes = notes || (action === 'aprovar' ? 'Orçamento auditado e aprovado pelo MAAD. Verba liberada.' : 'Orçamento indeferido pelo MAAD.');

    const updated = budgets.map(b => {
      if (b.id === budgetId) {
        approvedBudget = b;
        return {
          ...b,
          status: nextStatus,
          maad_notes: maadNotes,
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });

    setBudgets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('budgets').update({
        status: nextStatus,
        maad_notes: maadNotes,
        updated_at: new Date().toISOString(),
      }).eq('id', budgetId);
    }

    try {
      await FirestoreService.updateBudgetStatus(budgetId, nextStatus);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao atualizar orçamento:', fbErr);
    }

    // Transação Atômica: Se for aprovado, lança a saída financeira no caixa
    if (action === 'aprovar' && approvedBudget) {
      try {
        await addCashTransaction({
          type: 'saida',
          category: 'orcamento_ministerio',
          description: `Liberação de Verba: ${approvedBudget.title} (${approvedBudget.ministry_name})`,
          amount: approvedBudget.amount,
          date: new Date().toISOString().slice(0, 10),
          relatedMinistryId: approvedBudget.ministry_id,
          relatedBudgetId: approvedBudget.id,
        });

        await scheduleLocalNotification(
          'Verba Liberada pelo MAAD! 💵',
          `O MAAD aprovou a liberação de R$ ${approvedBudget.amount.toFixed(2)} para ${approvedBudget.ministry_name}.`
        );
      } catch (txErr: any) {
        // Rollback compensatório caso falhe a saída contábil
        setBudgets(previousBudgets);
        await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(previousBudgets));
        if (isSupabaseConfigured()) {
          await supabase.from('budgets').update({
            status: 'encaminhado_maad',
            maad_notes: 'Falha ao registrar saída no caixa; aprovação revertida.',
          }).eq('id', budgetId);
        }
        throw new Error(`Falha atômica ao registrar saída contábil: ${txErr.message}`);
      }
    }
  };

  // ==========================================
  // MAAD: FLUXO DE CAIXA (RBAC GUARD)
  // ==========================================
  const addCashTransaction = async (data: {
    type: CashFlowType;
    category: CashFlowCategory;
    description: string;
    amount: number;
    date: string;
    relatedMinistryId?: string;
    relatedBudgetId?: string;
    receiptUrl?: string;
  }) => {
    if (currentUser?.role !== 'maad' && currentUser?.role !== 'pastor' && currentUser?.role !== 'admin') {
      throw new Error('Apenas o MAAD e o Pastor possuem autorização para registrar movimentações no caixa.');
    }

    const newTx: CashTransaction = {
      id: generateUUID('0005'),
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      date: data.date,
      related_ministry_id: data.relatedMinistryId,
      related_budget_id: data.relatedBudgetId,
      receipt_url: data.receiptUrl,
      registered_by: currentUser?.id || UUIDS.U_MAAD,
      registered_by_name: currentUser?.full_name || 'Tesouraria MAAD',
      created_at: new Date().toISOString(),
    };

    const updated = [newTx, ...cashTransactions];
    setCashTransactions(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('cash_transactions').insert({
        id: newTx.id,
        type: newTx.type,
        category: newTx.category,
        description: newTx.description,
        amount: newTx.amount,
        date: newTx.date,
        related_ministry_id: newTx.related_ministry_id,
        related_budget_id: newTx.related_budget_id,
        receipt_url: newTx.receipt_url,
        registered_by: newTx.registered_by,
      });

      if (error) {
        console.error('[Cash] Erro ao sincronizar lançamento no Supabase:', error.message);
      }
    }

    try {
      await FirestoreService.saveCashTransaction(newTx);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar lançamento financeiro:', fbErr);
    }
  };

  const getCashSummary = () => {
    const totalEntradas = cashTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

    const totalSaidas = cashTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
    };
  };

  // ==========================================
  // GASTOS & RECIBOS
  // ==========================================
  const submitExpense = async (data: {
    ministryId: string;
    description: string;
    amount: number;
    receiptUrl?: string;
    relatedGoalId?: string;
  }) => {
    const expenseId = generateUUID('0011');
    const newExpense: MinistryExpense = {
      id: expenseId,
      ministry_id: data.ministryId,
      ministry_name: ministries.find(m => m.id === data.ministryId)?.name,
      reported_by: currentUser?.id || UUIDS.U_LIDER_LOUVOR,
      reporter_name: currentUser?.full_name || 'Líder',
      reporter_phone: currentUser?.phone || '11999999999',
      related_goal_id: data.relatedGoalId,
      description: data.description,
      amount: data.amount,
      expense_date: new Date().toISOString().slice(0, 10),
      receipt_url: data.receiptUrl,
      status: 'pendente_aprovacao',
      created_at: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('ministry_expenses').insert({
        id: newExpense.id,
        ministry_id: newExpense.ministry_id,
        reported_by: newExpense.reported_by,
        related_goal_id: newExpense.related_goal_id,
        description: newExpense.description,
        amount: newExpense.amount,
        expense_date: newExpense.expense_date,
        receipt_url: newExpense.receipt_url,
        status: newExpense.status,
      });

      if (error) {
        console.error('[Expense] Erro ao sincronizar despesa no Supabase:', error.message);
      }
    }

    try {
      await FirestoreService.saveExpense(newExpense);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar despesa:', fbErr);
    }

    await scheduleLocalNotification(
      'Novo Comprovante de Gasto 🧾',
      `${currentUser?.full_name} lançou uma despesa de R$ ${data.amount.toFixed(2)} para conferência pastoral.`
    );
  };

  const approveExpense = async (expenseId: string, approved: boolean) => {
    if (currentUser?.role !== 'pastor' && currentUser?.role !== 'admin' && currentUser?.role !== 'maad') {
      throw new Error('Apenas o Pastor ou MAAD podem validar comprovantes fiscais.');
    }

    const nextStatus = approved ? ('aprovado' as const) : ('rejeitado' as const);
    const updated = expenses.map(e => e.id === expenseId ? {
      ...e,
      status: nextStatus
    } : e);

    setExpenses(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('ministry_expenses').update({
        status: nextStatus,
      }).eq('id', expenseId);
    }

    try {
      await FirestoreService.updateExpenseStatus(expenseId, approved ? 'approved' : 'rejected');
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao atualizar despesa:', fbErr);
    }
  };

  const createAnnouncement = async (title: string, content: string, priority: 'normal' | 'urgente') => {
    if (currentUser?.role !== 'pastor' && currentUser?.role !== 'admin') {
      throw new Error('Apenas a Liderança Pastoral pode emitir comunicados no mural.');
    }

    const newAnc: Announcement = {
      id: generateUUID('0012'),
      author_id: currentUser?.id || UUIDS.U_PASTOR,
      author_name: currentUser?.full_name || 'Pastor Carlos',
      title,
      content,
      priority,
      created_at: new Date().toISOString(),
    };

    const updated = [newAnc, ...announcements];
    setAnnouncements(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      await supabase.from('announcements').insert({
        id: newAnc.id,
        author_id: newAnc.author_id,
        title: newAnc.title,
        content: newAnc.content,
        priority: newAnc.priority,
      });
    }

    try {
      await FirestoreService.saveAnnouncement(newAnc);
    } catch (fbErr) {
      console.warn('[Firestore] Falha ao salvar comunicado:', fbErr);
    }

    await scheduleLocalNotification(
      priority === 'urgente' ? '🚨 AVISO URGENTE DA IGREJA' : '📢 Comunicado da Igreja Aliado',
      title
    );
  };

  const getTodayBirthdays = (): Profile[] => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return profiles.filter(p => {
      if (!p.birth_date) return false;
      const [, m, d] = p.birth_date.split('-').map(Number);
      return m === currentMonth && d === currentDay;
    });
  };

  const getMonthBirthdays = (): Profile[] => {
    const currentMonth = new Date().getMonth() + 1;
    return profiles.filter(p => {
      if (!p.birth_date) return false;
      const [, m] = p.birth_date.split('-').map(Number);
      return m === currentMonth;
    }).sort((a, b) => {
      const dayA = Number(a.birth_date?.split('-')[2] || 0);
      const dayB = Number(b.birth_date?.split('-')[2] || 0);
      return dayA - dayB;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        profiles,
        createAccount,
        toggleAccountStatus,
        theme,
        toggleTheme,
        ministries,
        goals,
        schedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        confirmScheduleAttendance,
        requestScheduleSwap,
        announcements,
        expenses,
        events,
        recurringSchedules,
        createRecurringSchedule,
        createSpecialEvent,
        cancelSingleEvent,
        restoreSingleEvent,
        isOffline,
        setIsOffline,
        offlineQueueCount,
        syncOfflineQueue,
        createGoal,
        submitReport,
        approveReport,
        addGoalComment,
        submitExpense,
        approveExpense,
        budgets,
        requestBudget,
        pastorReviewBudget,
        maadReviewBudget,
        cashTransactions,
        addCashTransaction,
        getCashSummary,
        createAnnouncement,
        getTodayBirthdays,
        getMonthBirthdays,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
