export type UserRole = 
  | 'admin' 
  | 'pastor' 
  | 'secretaria' 
  | 'maad' 
  | 'leader' 
  | 'volunteer' 
  | 'member';

export type AppTheme = 'light' | 'dark';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date?: string; // YYYY-MM-DD
  role: UserRole;
  avatar_url?: string;
  expo_push_token?: string;
  ministry_id?: string;
  ministry_name?: string;
  is_active?: boolean;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  color_hex: string;
  icon_name: string;
  leader_id?: string;
  leader_name?: string;
  leader_phone?: string;
  member_count?: number;
}

export type GoalPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type GoalStatus = 'pendente' | 'em_andamento' | 'duvida' | 'concluida' | 'em_atraso';

export interface Goal {
  id: string;
  created_by: string;
  title: string;
  description: string;
  priority: GoalPriority;
  due_date: string;
  created_at: string;
  assignments?: GoalAssignment[];
}

export interface GoalAssignment {
  id: string;
  goal_id: string;
  ministry_id: string;
  status: GoalStatus;
  assigned_at: string;
  completed_at?: string;
  ministry?: Ministry;
  goal?: Goal;
  reports?: Report[];
  comments?: GoalComment[];
}

export type ReportStatus = 'enviado' | 'aprovado' | 'ajustes_solicitados';

export interface ReportMediaItem {
  id: string;
  report_id: string;
  media_type: 'image' | 'video';
  file_url: string;
  thumbnail_url?: string;
  file_size?: number;
}

export interface Report {
  id: string;
  assignment_id: string;
  author_id: string;
  author_name?: string;
  notes: string;
  status: ReportStatus;
  pastoral_feedback?: string;
  created_at: string;
  media?: ReportMediaItem[];
}

export interface GoalComment {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name?: string;
  user_role?: UserRole;
  message: string;
  is_doubt: boolean;
  resolved: boolean;
  created_at: string;
}

// ==========================================
// ESCALAS DOS MINISTÉRIOS (EDITÁVEIS PELOS LÍDERES)
// ==========================================

export type ScheduleStatus = 'confirmado' | 'pendente' | 'solicitou_troca';

export interface ScheduleMember {
  id: string;
  schedule_id: string;
  user_id: string;
  user_name: string;
  role_in_service: string;
  status: ScheduleStatus;
  swap_reason?: string;
}

export interface Schedule {
  id: string;
  ministry_id: string;
  ministry_name?: string;
  ministry_color?: string;
  title: string;
  event_date: string;
  notes?: string;
  members: ScheduleMember[];
  created_by?: string;
}

// ==========================================
// SECRETARIA - AGENDA, CULTOS FIXOS E EVENTOS
// ==========================================

export type EventType = 'culto_fixo' | 'evento_especial' | 'confraternizacao';

export interface RecurringSchedule {
  id: string;
  title: string;
  day_of_week: number; // 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, etc.
  day_name: string;
  start_time: string;
  end_time: string;
  location: string;
  description?: string;
  is_active: boolean;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time?: string;
  location: string;
  event_type: EventType;
  is_cancelled?: boolean;
  cancelled_reason?: string;
  recurring_schedule_id?: string;
  created_by?: string;
  created_by_name?: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgente';
  created_at: string;
}

export type ExpenseStatus = 'pendente_aprovacao' | 'aprovado' | 'rejeitado';

export interface MinistryExpense {
  id: string;
  ministry_id: string;
  ministry_name?: string;
  reported_by: string;
  reporter_name?: string;
  reporter_phone?: string;
  related_goal_id?: string;
  related_goal_title?: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url?: string;
  status: ExpenseStatus;
  created_at: string;
}

// ==========================================
// MAAD - GESTÃO CONTÁBIL & ORÇAMENTOS
// ==========================================

export type BudgetStatus = 
  | 'aguardando_pastor'
  | 'rejeitado_pastor'
  | 'encaminhado_maad'
  | 'aprovado_maad'
  | 'rejeitado_maad';

export interface Budget {
  id: string;
  ministry_id: string;
  ministry_name: string;
  requested_by: string;
  requester_name: string;
  requester_phone?: string;
  title: string;
  description: string;
  amount: number;
  status: BudgetStatus;
  pastoral_notes?: string;
  maad_notes?: string;
  created_at: string;
  updated_at: string;
}

export type CashFlowType = 'entrada' | 'saida';

export type CashFlowCategory = 
  | 'dizimo' 
  | 'oferta' 
  | 'doacao' 
  | 'campanha' 
  | 'despesa_fixa' 
  | 'orcamento_ministerio' 
  | 'manutencao' 
  | 'outro';

export interface CashTransaction {
  id: string;
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  amount: number;
  date: string;
  related_ministry_id?: string;
  related_budget_id?: string;
  receipt_url?: string;
  registered_by: string;
  registered_by_name?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}
