import type { 
  Goal, 
  Ministry, 
  Profile, 
  Schedule, 
  Announcement, 
  MinistryExpense, 
  ChurchEvent,
  RecurringSchedule,
  Budget,
  CashTransaction 
} from '../types/index.ts';

/**
 * Credenciais autorizadas para login em modo de desenvolvimento / demonstração.
 * Em produção com Supabase configurado, a validação é delegada ao supabase.auth.signInWithPassword.
 */
export const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@metodistaaliado.com.br': '123456',
  'admin@aliado.com': '123456',
  'lokoporgame194@gmail.com': '123456',
};

// UUIDs RFC-4122 determinísticos para interoperabilidade total com o Supabase PostgreSQL
export const UUIDS = {
  // Usuários
  U_ADMIN: '00000000-0000-0000-0000-000000000001',
  U_PASTOR: '00000000-0000-0000-0000-000000000002',
  U_SECRETARIA: '00000000-0000-0000-0000-000000000003',
  U_MAAD: '00000000-0000-0000-0000-000000000004',
  U_LIDER_LOUVOR: '00000000-0000-0000-0000-000000000005',
  U_LIDER_JOVENS: '00000000-0000-0000-0000-000000000006',
  U_LIDER_EBD: '00000000-0000-0000-0000-000000000007',
  U_LIDER_DIACONIA: '00000000-0000-0000-0000-000000000008',

  // Ministérios
  MIN_MAAD: 'a0000001-0000-0000-0000-000000000000',
  MIN_LOUVOR: 'a0000001-0000-0000-0000-000000000001',
  MIN_JOVENS: 'a0000001-0000-0000-0000-000000000002',
  MIN_EBD: 'a0000001-0000-0000-0000-000000000003',
  MIN_DIACONIA: 'a0000001-0000-0000-0000-000000000004',
  MIN_COMUNICACAO: 'a0000001-0000-0000-0000-000000000005',
  MIN_MULHERES: 'a0000001-0000-0000-0000-000000000006',
  MIN_HOMENS: 'a0000001-0000-0000-0000-000000000007',
  MIN_MISSOES: 'a0000001-0000-0000-0000-000000000008',
};

export const INITIAL_PROFILES: Profile[] = [
  {
    id: UUIDS.U_ADMIN,
    full_name: 'Administrador do Sistema',
    email: 'admin@metodistaaliado.com.br',
    phone: '11999990000',
    role: 'admin',
    birth_date: '1985-01-10',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000099',
    full_name: 'Lucas Ferreira (Admin)',
    email: 'lokoporgame194@gmail.com',
    phone: '11999999999',
    role: 'admin',
    birth_date: '1995-01-01',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_active: true,
  },
];

// Ministérios apagados a pedido do administrador para cadastro limpo via painel admin
export const INITIAL_MINISTRIES: Ministry[] = [];

export const DEFAULT_FEATURE_SETTINGS: Record<string, boolean> = {
  schedules: true,
  goals: true,
  maad: true,
  budgets: true,
  expenses: true,
  announcements: true,
  calendar: true,
  birthdays: true,
  reports: true,
};

export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_RECURRING_SCHEDULES: RecurringSchedule[] = [];
export const INITIAL_EVENTS: ChurchEvent[] = [];
export const INITIAL_SCHEDULES: Schedule[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_EXPENSES: MinistryExpense[] = [];
