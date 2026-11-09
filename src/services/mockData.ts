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

export const INITIAL_MINISTRIES: Ministry[] = [
  {
    id: UUIDS.MIN_MAAD,
    name: 'MAAD - Administração & Contabilidade',
    description: 'Aprovação de orçamentos, lançamentos contábeis, tesouraria e fluxo financeiro',
    color_hex: '#059669',
    icon_name: 'landmark',
    leader_id: UUIDS.U_MAAD,
    leader_name: 'Equipe MAAD',
    leader_phone: '11988887777',
    member_count: 5,
  },
  {
    id: UUIDS.MIN_LOUVOR,
    name: 'Ministério de Louvor',
    description: 'Adoração e equipes de músicos e vocalistas',
    color_hex: '#DC2626',
    icon_name: 'music',
    leader_id: UUIDS.U_LIDER_LOUVOR,
    leader_name: 'Mariana Ramos',
    leader_phone: '11991234567',
    member_count: 14,
  },
  {
    id: UUIDS.MIN_JOVENS,
    name: 'Sociedade de Jovens',
    description: 'Juventude Metodista Aliado, retiros e discipulado',
    color_hex: '#EA580C',
    icon_name: 'flame',
    leader_id: UUIDS.U_LIDER_JOVENS,
    leader_name: 'Lucas Souza',
    leader_phone: '11982345678',
    member_count: 28,
  },
  {
    id: UUIDS.MIN_EBD,
    name: 'Ministério Infantil & EBD',
    description: 'Escola Bíblica Dominical e salas temáticas',
    color_hex: '#F59E0B',
    icon_name: 'smile',
    leader_id: UUIDS.U_LIDER_EBD,
    leader_name: 'Débora Lima',
    leader_phone: '11973456789',
    member_count: 12,
  },
  {
    id: UUIDS.MIN_DIACONIA,
    name: 'Diaconia & Recepção',
    description: 'Ordem no templo, acolhimento de visitantes e Santa Ceia',
    color_hex: '#2563EB',
    icon_name: 'heart-handshake',
    leader_id: UUIDS.U_LIDER_DIACONIA,
    leader_name: 'Marcos Vinicius',
    leader_phone: '11964567890',
    member_count: 18,
  },
  {
    id: UUIDS.MIN_COMUNICACAO,
    name: 'Comunicação & Mídia',
    description: 'Transmissão de cultos, fotografia e mídias sociais',
    color_hex: '#7C3AED',
    icon_name: 'camera',
    member_count: 8,
  },
  {
    id: UUIDS.MIN_MULHERES,
    name: 'Sociedade de Mulheres',
    description: 'Intercessão, comunhão e apoio às famílias',
    color_hex: '#DB2777',
    icon_name: 'flower-2',
    member_count: 32,
  },
  {
    id: UUIDS.MIN_HOMENS,
    name: 'Sociedade de Homens',
    description: 'Homens metodistas de oração e trabalho',
    color_hex: '#0F172A',
    icon_name: 'shield',
    member_count: 24,
  },
  {
    id: UUIDS.MIN_MISSOES,
    name: 'Ação Social & Missões',
    description: 'Distribuição de alimentos e apoio à comunidade',
    color_hex: '#16A34A',
    icon_name: 'globe',
    member_count: 15,
  }
];

export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_RECURRING_SCHEDULES: RecurringSchedule[] = [];
export const INITIAL_EVENTS: ChurchEvent[] = [];
export const INITIAL_SCHEDULES: Schedule[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_EXPENSES: MinistryExpense[] = [];
