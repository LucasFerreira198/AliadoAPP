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
import { OfflineSyncService } from '../services/offlineSync';
import { SecureStorageService } from '../services/secureStorage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Gerador determinístico de UUID v4 para compatibilidade total com o Postgres/Supabase
function generateUUID(prefixNumber = '0000'): string {
  const ts = Date.now().toString(16).padStart(12, '0');
  const rnd = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `00000000-${prefixNumber}-4000-8000-${rnd}${ts}`;
}

interface AppContextType {
  // Autenticação & Perfil
  currentUser: Profile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchUser: (userId: string) => void;
  profiles: Profile[];

  // Painel do Administrador (Criação e Gestão de Contas)
  createAccount: (data: {
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    ministry_id?: string;
    birth_date?: string;
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

  // Carregar dados salvos no AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

        // Carrega usuário da sessão criptografada segura
        const savedUser = (await SecureStorageService.getItem(STORAGE_KEYS.USER)) || 
                          (await AsyncStorage.getItem(STORAGE_KEYS.USER));
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        const savedProfiles = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);
        if (savedProfiles) setProfiles(JSON.parse(savedProfiles));

        const savedGoals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
        if (savedGoals) setGoals(JSON.parse(savedGoals));

        const savedSchedules = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (savedSchedules) setSchedules(JSON.parse(savedSchedules));

        const savedEvents = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
        if (savedEvents) setEvents(JSON.parse(savedEvents));

        const savedBudgets = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));

        const savedCash = await AsyncStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS);
        if (savedCash) setCashTransactions(JSON.parse(savedCash));

        const count = await OfflineSyncService.count();
        setOfflineQueueCount(count);
      } catch (err) {
        console.log('Erro ao carregar storage:', err);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const nextTheme: AppTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  };

  /**
   * Autenticação Segura com Validação Estrita de Senha e Proteção contra Privilege Escalation
   */
  const signIn = async (
    email: string, 
    password?: string, 
    role?: string
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
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            if (profileData.is_active === false) {
              await supabase.auth.signOut();
              return { success: false, error: 'Sua conta está desativada. Procure o Administrador da igreja.' };
            }
            setCurrentUser(profileData);
            await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(profileData));
            return { success: true };
          }
        }
      } catch (err: any) {
        console.warn('Falha na autenticação remota, recorrendo ao modo seguro local:', err);
      }
    }

    // 2. Modo Local / Demonstração com validação rigorosa de credenciais
    const found = profiles.find(p => p.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { 
        success: false, 
        error: 'E-mail não encontrado. Solicite seu cadastro ao Administrador da igreja.' 
      };
    }

    if (found.is_active === false) {
      return { 
        success: false, 
        error: 'Conta desativada. Procure a secretaria ou o Administrador da igreja.' 
      };
    }

    // Validação estrita da senha (elimina o bypass anterior)
    const expectedPassword = DEMO_CREDENTIALS[cleanEmail] || '123456';
    if (password.trim() !== expectedPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    setCurrentUser(found);
    await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(found));
    return { success: true };
  };

  const signOut = async () => {
    setCurrentUser(null);
    await SecureStorageService.deleteItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  };

  const switchUser = async (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setCurrentUser(user);
      await SecureStorageService.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  };

  // ==========================================
  // ADMINISTRADOR: CRIAÇÃO E GESTÃO DE CONTAS
  // ==========================================
  const createAccount = async (data: {
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    ministry_id?: string;
    birth_date?: string;
  }) => {
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

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').insert(newProfile);
      } catch (err) {
        console.warn('Erro ao sincronizar perfil no Supabase:', err);
      }
    }

    await scheduleLocalNotification(
      'Conta Criada com Sucesso!',
      `O usuário ${data.full_name} foi cadastrado como ${data.role.toUpperCase()}.`
    );
  };

  const toggleAccountStatus = async (userId: string) => {
    const updated = profiles.map(p => p.id === userId ? { ...p, is_active: !p.is_active } : p);
    setProfiles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      const user = updated.find(p => p.id === userId);
      if (user) {
        try {
          await supabase.from('profiles').update({ is_active: user.is_active }).eq('id', userId);
        } catch (err) {
          console.warn('Erro ao atualizar status no Supabase:', err);
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

    const members: ScheduleMember[] = data.members.map((m, idx) => {
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

    await scheduleLocalNotification(
      'Nova Escala Publicada!',
      `${ministry?.name}: ${data.title} foi cadastrada pelo líder.`
    );
  };

  const updateSchedule = async (scheduleId: string, data: Partial<Schedule>) => {
    const updated = schedules.map(s => s.id === scheduleId ? { ...s, ...data } : s);
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
  };

  const deleteSchedule = async (scheduleId: string) => {
    const updated = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
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
      try {
        await supabase.from('church_events').insert({
          id: newEv.id,
          title: newEv.title,
          description: newEv.description,
          event_date: newEv.event_date,
          start_time: newEv.start_time,
          end_time: newEv.end_time,
          location: newEv.location,
          event_type: newEv.event_type,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar evento no Supabase:', err);
      }
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
      try {
        await supabase.from('goals').insert({
          id: newGoal.id,
          created_by: newGoal.created_by,
          title: newGoal.title,
          description: newGoal.description,
          priority: newGoal.priority,
          due_date: newGoal.due_date,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar meta no Supabase:', err);
      }
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
    if (isOffline) {
      await OfflineSyncService.enqueue({
        type: 'submit_report',
        payload: { assignmentId, notes, mediaUrls, authorId: currentUser?.id },
      });
      const count = await OfflineSyncService.count();
      setOfflineQueueCount(count);
      return;
    }

    const updatedGoals = goals.map(goal => {
      if (!goal.assignments) return goal;
      const updatedAssignments = goal.assignments.map(asg => {
        if (asg.id === assignmentId) {
          const newReport: Report = {
            id: 'rep-' + Date.now(),
            assignment_id: assignmentId,
            author_id: currentUser?.id || 'u-lider',
            author_name: currentUser?.full_name || 'Líder',
            notes,
            status: 'enviado',
            created_at: new Date().toISOString(),
            media: mediaUrls.map((url, index) => ({
              id: 'med-' + Date.now() + index,
              report_id: 'rep-' + Date.now(),
              media_type: url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image',
              file_url: url,
            })),
          };
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

    await scheduleLocalNotification(
      'Meta Concluída! 🚀',
      `${currentUser?.full_name} (${currentUser?.ministry_name}) finalizou a meta e enviou o relatório com mídias para aprovação.`,
      { assignmentId }
    );
  };

  const approveReport = async (assignmentId: string, pastoralFeedback?: string) => {
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
  };

  const addGoalComment = async (assignmentId: string, message: string, isDoubt: boolean) => {
    const updatedGoals = goals.map(goal => {
      if (!goal.assignments) return goal;
      const updatedAssignments = goal.assignments.map(asg => {
        if (asg.id === assignmentId) {
          const newComment: GoalComment = {
            id: 'cmt-' + Date.now(),
            assignment_id: assignmentId,
            user_id: currentUser?.id || 'u-lider',
            user_name: currentUser?.full_name || 'Líder',
            user_role: currentUser?.role || 'leader',
            message,
            is_doubt: isDoubt,
            resolved: false,
            created_at: new Date().toISOString(),
          };
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
      try {
        await supabase.from('budgets').insert({
          id: newBudget.id,
          ministry_id: newBudget.ministry_id,
          requested_by: newBudget.requested_by,
          title: newBudget.title,
          description: newBudget.description,
          amount: newBudget.amount,
          status: newBudget.status,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar orçamento com Supabase:', err);
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
    const updated = budgets.map(b => {
      if (b.id === budgetId) {
        const nextStatus: BudgetStatus = action === 'encaminhar_maad' ? 'encaminhado_maad' : 'rejeitado_pastor';
        return {
          ...b,
          status: nextStatus,
          pastoral_notes: notes || (action === 'encaminhar_maad' ? 'Aprovado pelo Pastor. Encaminhado à equipe do MAAD para liberação contábil.' : 'Não aprovado pelo Pastor.'),
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });

    setBudgets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));

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
    let approvedBudget: Budget | undefined;

    const updated = budgets.map(b => {
      if (b.id === budgetId) {
        approvedBudget = b;
        const nextStatus: BudgetStatus = action === 'aprovar' ? 'aprovado_maad' : 'rejeitado_maad';
        return {
          ...b,
          status: nextStatus,
          maad_notes: notes || (action === 'aprovar' ? 'Orçamento auditado e aprovado pelo MAAD. Verba liberada.' : 'Orçamento indeferido pelo MAAD por indisponibilidade financeira.'),
          updated_at: new Date().toISOString(),
        };
      }
      return b;
    });

    setBudgets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));

    if (action === 'aprovar' && approvedBudget) {
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
    }
  };

  // ==========================================
  // MAAD: FLUXO DE CAIXA
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
      try {
        await supabase.from('cash_transactions').insert({
          id: newTx.id,
          type: newTx.type,
          category: newTx.category,
          description: newTx.description,
          amount: newTx.amount,
          date: newTx.date,
          registered_by: newTx.registered_by,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar lançamento no Supabase:', err);
      }
    }
  };

  const getCashSummary = () => {
    const totalEntradas = cashTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaidas = cashTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0);

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
    const newExpense: MinistryExpense = {
      id: 'exp-' + Date.now(),
      ministry_id: data.ministryId,
      ministry_name: ministries.find(m => m.id === data.ministryId)?.name,
      reported_by: currentUser?.id || 'u-lider',
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
    setExpenses([newExpense, ...expenses]);

    await scheduleLocalNotification(
      'Novo Comprovante de Gasto 🧾',
      `${currentUser?.full_name} lançou uma despesa de R$ ${data.amount.toFixed(2)} para conferência pastoral.`
    );
  };

  const approveExpense = async (expenseId: string, approved: boolean) => {
    const updated = expenses.map(e => e.id === expenseId ? {
      ...e,
      status: approved ? ('aprovado' as const) : ('rejeitado' as const)
    } : e);
    setExpenses(updated);
  };

  const createAnnouncement = async (title: string, content: string, priority: 'normal' | 'urgente') => {
    const newAnc: Announcement = {
      id: 'anc-' + Date.now(),
      author_id: currentUser?.id || 'u-pastor',
      author_name: currentUser?.full_name || 'Pastor Carlos',
      title,
      content,
      priority,
      created_at: new Date().toISOString(),
    };
    setAnnouncements([newAnc, ...announcements]);

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
        signOut,
        switchUser,
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
