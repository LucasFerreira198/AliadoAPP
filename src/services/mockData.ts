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
  'pastor@metodistaaliado.com.br': '123456',
  'secretaria@metodistaaliado.com.br': '123456',
  'maad@metodistaaliado.com.br': '123456',
  'mariana.louvor@metodistaaliado.com.br': '123456',
  'lucas.jovens@metodistaaliado.com.br': '123456',
  'debora.ebd@metodistaaliado.com.br': '123456',
  'marcos.diaconia@metodistaaliado.com.br': '123456',
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
    id: UUIDS.U_PASTOR,
    full_name: 'Pastor Carlos Alberto',
    email: 'pastor@metodistaaliado.com.br',
    phone: '11987654321',
    role: 'pastor',
    birth_date: '1978-11-28',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    is_active: true,
  },
  {
    id: UUIDS.U_SECRETARIA,
    full_name: 'Fernanda Rocha (Secretaria)',
    email: 'secretaria@metodistaaliado.com.br',
    phone: '11977776666',
    role: 'secretaria',
    birth_date: '1989-06-20',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    ministry_name: 'Secretaria & Agenda',
    is_active: true,
  },
  {
    id: UUIDS.U_MAAD,
    full_name: 'Tesouraria MAAD (Contabilidade)',
    email: 'maad@metodistaaliado.com.br',
    phone: '11988887777',
    role: 'maad',
    birth_date: '1982-08-15',
    ministry_id: UUIDS.MIN_MAAD,
    ministry_name: 'MAAD - Administração & Contabilidade',
    avatar_url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150',
    is_active: true,
  },
  {
    id: UUIDS.U_LIDER_LOUVOR,
    full_name: 'Mariana Ramos',
    email: 'mariana.louvor@metodistaaliado.com.br',
    phone: '11991234567',
    role: 'leader',
    birth_date: new Date().toISOString().slice(0, 10),
    ministry_id: UUIDS.MIN_LOUVOR,
    ministry_name: 'Ministério de Louvor',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    is_active: true,
  },
  {
    id: UUIDS.U_LIDER_JOVENS,
    full_name: 'Lucas Souza',
    email: 'lucas.jovens@metodistaaliado.com.br',
    phone: '11982345678',
    role: 'leader',
    birth_date: '1998-11-12',
    ministry_id: UUIDS.MIN_JOVENS,
    ministry_name: 'Sociedade de Jovens',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    is_active: true,
  },
  {
    id: UUIDS.U_LIDER_EBD,
    full_name: 'Débora Lima',
    email: 'debora.ebd@metodistaaliado.com.br',
    phone: '11973456789',
    role: 'leader',
    birth_date: '1985-11-25',
    ministry_id: UUIDS.MIN_EBD,
    ministry_name: 'Ministério Infantil & EBD',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    is_active: true,
  },
  {
    id: UUIDS.U_LIDER_DIACONIA,
    full_name: 'Diácono Marcos Vinicius',
    email: 'marcos.diaconia@metodistaaliado.com.br',
    phone: '11964567890',
    role: 'leader',
    birth_date: '1980-05-18',
    ministry_id: UUIDS.MIN_DIACONIA,
    ministry_name: 'Diaconia & Recepção',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    is_active: true,
  }
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

export const INITIAL_RECURRING_SCHEDULES: RecurringSchedule[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    title: 'Culto de Celebração da Família',
    day_of_week: 0,
    day_name: 'Domingo',
    start_time: '19:00',
    end_time: '21:00',
    location: 'Templo Principal',
    description: 'Culto solene de domingo com pregação pastoral e louvor congregacional.',
    is_active: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    title: 'Escola Bíblica Dominical (EBD)',
    day_of_week: 0,
    day_name: 'Domingo',
    start_time: '09:00',
    end_time: '11:00',
    location: 'Salas Educacionais',
    description: 'Classes bíblicas para todas as idades: Infantil, Jovens e Adultos.',
    is_active: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    title: 'Culto de Oração & Estudo Bíblico',
    day_of_week: 2,
    day_name: 'Terça-feira',
    start_time: '19:30',
    end_time: '21:00',
    location: 'Templo Principal',
    description: 'Intercessão pelas famílias e estudo das Sagradas Escrituras.',
    is_active: true,
  }
];

export const INITIAL_EVENTS: ChurchEvent[] = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    title: 'Culto de Celebração da Família (Fixo)',
    description: 'Culto solene de domingo com ministração da Santa Ceia.',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    start_time: '19:00',
    end_time: '21:00',
    location: 'Templo Principal',
    event_type: 'culto_fixo',
    is_cancelled: false,
    recurring_schedule_id: 'c0000001-0000-0000-0000-000000000001',
    created_by_name: 'Secretaria Geral',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000002',
    title: 'Escola Bíblica Dominical (Fixo)',
    description: 'Estudo temático das classes.',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    start_time: '09:00',
    end_time: '11:00',
    location: 'Salas da EBD',
    event_type: 'culto_fixo',
    is_cancelled: false,
    recurring_schedule_id: 'c0000001-0000-0000-0000-000000000002',
    created_by_name: 'Secretaria Geral',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000003',
    title: 'Culto de Oração e Doutrina (Fixo)',
    description: 'Estudo sequencial do livro de Atos dos Apóstolos.',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    start_time: '19:30',
    end_time: '21:00',
    location: 'Templo Principal',
    event_type: 'culto_fixo',
    is_cancelled: false,
    recurring_schedule_id: 'c0000001-0000-0000-0000-000000000003',
    created_by_name: 'Secretaria Geral',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000004',
    title: 'Confraternização Geral de Fim de Ano & Vigília',
    description: 'Grande comunhão de todos os ministérios com jantar comunitário e clamor pela cidade.',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    start_time: '20:00',
    end_time: '23:30',
    location: 'Salão Social e Templo',
    event_type: 'confraternizacao',
    is_cancelled: false,
    created_by_name: 'Secretaria Geral',
  }
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 's0000001-0000-0000-0000-000000000001',
    ministry_id: UUIDS.MIN_LOUVOR,
    ministry_name: 'Ministério de Louvor',
    ministry_color: '#DC2626',
    title: 'Escala: Culto de Domingo à Noite (19h)',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Passagem de som pontualmente às 17h30. Vestimenta: Preto/Branco.',
    members: [
      {
        id: 'sm000001-0000-0000-0000-000000000001',
        schedule_id: 's0000001-0000-0000-0000-000000000001',
        user_id: UUIDS.U_LIDER_LOUVOR,
        user_name: 'Mariana Ramos',
        role_in_service: 'Vocal Líder',
        status: 'confirmado',
      },
      {
        id: 'sm000001-0000-0000-0000-000000000002',
        schedule_id: 's0000001-0000-0000-0000-000000000001',
        user_id: UUIDS.U_LIDER_JOVENS,
        user_name: 'Lucas Souza',
        role_in_service: 'Violão / Guitarra',
        status: 'confirmado',
      }
    ]
  },
  {
    id: 's0000001-0000-0000-0000-000000000002',
    ministry_id: UUIDS.MIN_DIACONIA,
    ministry_name: 'Diaconia & Recepção',
    ministry_color: '#2563EB',
    title: 'Escala: Recepção e Portaria do Culto',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Entregar folhetos de boas-vindas na entrada.',
    members: [
      {
        id: 'sm000001-0000-0000-0000-000000000003',
        schedule_id: 's0000001-0000-0000-0000-000000000002',
        user_id: UUIDS.U_LIDER_DIACONIA,
        user_name: 'Marcos Vinicius',
        role_in_service: 'Coordenação Geral da Recepção',
        status: 'confirmado',
      }
    ]
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    ministry_id: UUIDS.MIN_JOVENS,
    ministry_name: 'Sociedade de Jovens',
    requested_by: UUIDS.U_LIDER_JOVENS,
    requester_name: 'Lucas Souza',
    requester_phone: '11982345678',
    title: 'Adiantamento de Sinal do Transporte para o Retiro',
    description: 'Pagamento de 30% do ônibus fretado para 45 jovens no sítio do Retiro Espiritual.',
    amount: 1800.00,
    status: 'encaminhado_maad',
    pastoral_notes: 'Encaminhado ao MAAD. Verba aprovada na triagem pastoral.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    ministry_id: UUIDS.MIN_EBD,
    ministry_name: 'Ministério Infantil & EBD',
    requested_by: UUIDS.U_LIDER_EBD,
    requester_name: 'Débora Lima',
    requester_phone: '11973456789',
    title: 'Revistas Didáticas do Trimestre para as Crianças',
    description: 'Aquisição de 40 revistas oficiais da Escola Bíblica da Editora Metodista.',
    amount: 520.00,
    status: 'aguardando_pastor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 't0000001-0000-0000-0000-000000000001',
    type: 'entrada',
    category: 'dizimo',
    description: 'Dízimos do Culto de Domingo à Noite',
    amount: 4850.00,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    registered_by: UUIDS.U_MAAD,
    registered_by_name: 'Tesouraria MAAD',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't0000001-0000-0000-0000-000000000002',
    type: 'entrada',
    category: 'oferta',
    description: 'Ofertas do Culto de Oração e Estudo Bíblico',
    amount: 1220.00,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    registered_by: UUIDS.U_MAAD,
    registered_by_name: 'Tesouraria MAAD',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't0000001-0000-0000-0000-000000000003',
    type: 'saida',
    category: 'despesa_fixa',
    description: 'Conta de Energia Elétrica do Templo Principal (Enel)',
    amount: 680.40,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    registered_by: UUIDS.U_MAAD,
    registered_by_name: 'Tesouraria MAAD',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    author_id: UUIDS.U_PASTOR,
    author_name: 'Pastor Carlos Alberto',
    title: 'Reunião Geral de Alinhamento Pastoral e Liderança',
    content: 'Graça e Paz amados líderes! Neste próximo sábado, às 16h, teremos nosso encontro mensal de alinhamento com todos os líderes de ministérios. Favor confirmar presença.',
    priority: 'urgente',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const INITIAL_EXPENSES: MinistryExpense[] = [];
