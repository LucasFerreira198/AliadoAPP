-- ====================================================================
-- IGREJA METODISTA ALIADO - SCHEMA COMPLETO DO SUPABASE (POSTGRESQL)
-- GESTÃO MINISTERIAL, METAS, SECRETARIA, TESOURARIA & MAAD
-- ====================================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT, -- Telefone com DDD (Ex: 5511999999999) para integração WhatsApp
    birth_date DATE, -- Para a central de aniversariantes
    role TEXT NOT NULL DEFAULT 'leader' CHECK (role IN ('admin', 'pastor', 'secretaria', 'maad', 'leader', 'volunteer', 'member')),
    avatar_url TEXT,
    expo_push_token TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE MINISTÉRIOS
CREATE TABLE IF NOT EXISTS public.ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT NOT NULL DEFAULT '#DC2626', -- Paleta Chama Metodista
    icon_name TEXT NOT NULL DEFAULT 'users',
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MEMBROS DO MINISTÉRIO
CREATE TABLE IF NOT EXISTS public.ministry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_ministry TEXT NOT NULL DEFAULT 'membro' CHECK (role_in_ministry IN ('lider', 'vice_lider', 'membro', 'voluntario')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ministry_id, user_id)
);

-- 4. METAS E OBJETIVOS PASTORAIS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ATRIBUIÇÃO DE METAS (BROADCAST PASTOR -> MÚLTIPLOS MINISTÉRIOS)
CREATE TABLE IF NOT EXISTS public.goal_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'duvida', 'concluida', 'em_atraso')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(goal_id, ministry_id)
);

-- 6. RELATÓRIOS DE CONCLUSÃO (LÍDERES)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.goal_assignments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'aprovado', 'ajustes_solicitados')),
    pastoral_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MÍDIAS DOS RELATÓRIOS (FOTOS E VÍDEOS)
CREATE TABLE IF NOT EXISTS public.report_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DÚVIDAS E COMENTÁRIOS DA META (ALINHAMENTO PASTORAL)
CREATE TABLE IF NOT EXISTS public.goal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.goal_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_doubt BOOLEAN NOT NULL DEFAULT FALSE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ESCALAS DE VOLUNTÁRIOS (EDITÁVEIS PELOS LÍDERES)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedule_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_service TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('confirmado', 'pendente', 'solicitou_troca')),
    swap_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(schedule_id, user_id)
);

-- 10. SECRETARIA: CULTOS FIXOS RECORRENTES
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    day_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Templo Principal',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SECRETARIA: CALENDÁRIO DA IGREJA & EVENTOS ESPECIAIS
CREATE TABLE IF NOT EXISTS public.church_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    location TEXT NOT NULL DEFAULT 'Templo Principal',
    event_type TEXT NOT NULL DEFAULT 'culto_fixo' CHECK (event_type IN ('culto_fixo', 'evento_especial', 'confraternizacao')),
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_reason TEXT,
    recurring_schedule_id UUID REFERENCES public.recurring_schedules(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. MAAD: ORÇAMENTOS (LÍDER -> PASTOR -> MAAD)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'aguardando_pastor' CHECK (status IN ('aguardando_pastor', 'rejeitado_pastor', 'encaminhado_maad', 'aprovado_maad', 'rejeitado_maad')),
    pastoral_notes TEXT,
    maad_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. MAAD: LIVRO CAIXA & FLUXO FINANCEIRO (ENTRADAS & SAÍDAS)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    category TEXT NOT NULL CHECK (category IN ('dizimo', 'oferta', 'doacao', 'campanha', 'despesa_fixa', 'orcamento_ministerio', 'manutencao', 'outro')),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    related_ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    related_budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    receipt_url TEXT,
    registered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. COMPROVANTES E GASTOS INDIVIDUAIS DOS MINISTÉRIOS
CREATE TABLE IF NOT EXISTS public.ministry_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente_aprovacao' CHECK (status IN ('pendente_aprovacao', 'aprovado', 'rejeitado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. MURAL DE AVISOS PASTORAIS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. NOTIFICAÇÕES EM TEMPO REAL
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ÍNDICES DE ALTA PERFORMANCE (FKs, DATAS E CAMPOS CRÍTICOS DE FILTRO)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_ministries_leader_id ON public.ministries(leader_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_id ON public.ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_user_id ON public.ministry_members(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_by ON public.goals(created_by);
CREATE INDEX IF NOT EXISTS idx_goals_due_date ON public.goals(due_date);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_goal_id ON public.goal_assignments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_ministry_id ON public.goal_assignments(ministry_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_status ON public.goal_assignments(status);
CREATE INDEX IF NOT EXISTS idx_reports_assignment_id ON public.reports(assignment_id);
CREATE INDEX IF NOT EXISTS idx_reports_author_id ON public.reports(author_id);
CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON public.report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_goal_comments_assignment_id ON public.goal_comments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_goal_comments_user_id ON public.goal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_ministry_id ON public.schedules(ministry_id);
CREATE INDEX IF NOT EXISTS idx_schedules_event_date ON public.schedules(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_members_schedule_id ON public.schedule_members(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_members_user_id ON public.schedule_members(user_id);
CREATE INDEX IF NOT EXISTS idx_church_events_event_date ON public.church_events(event_date);
CREATE INDEX IF NOT EXISTS idx_budgets_ministry_id ON public.budgets(ministry_id);
CREATE INDEX IF NOT EXISTS idx_budgets_requested_by ON public.budgets(requested_by);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON public.cash_transactions(category);
CREATE INDEX IF NOT EXISTS idx_ministry_expenses_ministry_id ON public.ministry_expenses(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_expenses_reported_by ON public.ministry_expenses(reported_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ====================================================================
-- FUNÇÕES DE SEGURANÇA (SECURITY DEFINER) - ELIMINA RECURSÃO INFINITA
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_pastor_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_maad_pastor_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('maad', 'pastor', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_secretaria_pastor_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('secretaria', 'pastor', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ====================================================================
-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS RLS ROBUSTAS E SEM RECURSÃO PARA TODAS AS TABELAS
-- ====================================================================

-- 1. PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (public.is_admin());

-- 2. MINISTRIES
CREATE POLICY "ministries_select" ON public.ministries FOR SELECT USING (true);
CREATE POLICY "ministries_all" ON public.ministries FOR ALL USING (public.is_pastor_or_admin());

-- 3. MINISTRY_MEMBERS
CREATE POLICY "ministry_members_select" ON public.ministry_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ministry_members_all" ON public.ministry_members FOR ALL USING (public.is_pastor_or_admin());

-- 4. GOALS
CREATE POLICY "goals_select" ON public.goals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "goals_all" ON public.goals FOR ALL USING (public.is_pastor_or_admin());

-- 5. GOAL_ASSIGNMENTS
CREATE POLICY "goal_assignments_select" ON public.goal_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "goal_assignments_insert" ON public.goal_assignments FOR INSERT WITH CHECK (public.is_pastor_or_admin());
CREATE POLICY "goal_assignments_update" ON public.goal_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "goal_assignments_delete" ON public.goal_assignments FOR DELETE USING (public.is_pastor_or_admin());

-- 6. REPORTS
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (author_id = auth.uid() OR public.is_pastor_or_admin());
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (author_id = auth.uid() OR public.is_admin());

-- 7. REPORT_MEDIA
CREATE POLICY "report_media_select" ON public.report_media FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "report_media_insert" ON public.report_media FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "report_media_delete" ON public.report_media FOR DELETE USING (public.is_pastor_or_admin());

-- 8. GOAL_COMMENTS
CREATE POLICY "goal_comments_select" ON public.goal_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "goal_comments_insert" ON public.goal_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "goal_comments_update" ON public.goal_comments FOR UPDATE USING (user_id = auth.uid() OR public.is_pastor_or_admin());
CREATE POLICY "goal_comments_delete" ON public.goal_comments FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- 9. SCHEDULES
CREATE POLICY "schedules_select" ON public.schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "schedules_delete" ON public.schedules FOR DELETE USING (public.is_pastor_or_admin());

-- 10. SCHEDULE_MEMBERS
CREATE POLICY "schedule_members_select" ON public.schedule_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "schedule_members_insert" ON public.schedule_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "schedule_members_update" ON public.schedule_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "schedule_members_delete" ON public.schedule_members FOR DELETE USING (public.is_pastor_or_admin());

-- 11. RECURRING_SCHEDULES
CREATE POLICY "recurring_schedules_select" ON public.recurring_schedules FOR SELECT USING (true);
CREATE POLICY "recurring_schedules_all" ON public.recurring_schedules FOR ALL USING (public.is_secretaria_pastor_or_admin());

-- 12. CHURCH_EVENTS
CREATE POLICY "church_events_select" ON public.church_events FOR SELECT USING (true);
CREATE POLICY "church_events_all" ON public.church_events FOR ALL USING (public.is_secretaria_pastor_or_admin());

-- 13. BUDGETS
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (
    auth.uid() = requested_by OR public.is_maad_pastor_or_admin()
);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (
    auth.uid() = requested_by OR public.is_pastor_or_admin()
);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (
    public.is_maad_pastor_or_admin() OR auth.uid() = requested_by
);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (public.is_admin());

-- 14. CASH_TRANSACTIONS
CREATE POLICY "cash_transactions_select" ON public.cash_transactions FOR SELECT USING (public.is_maad_pastor_or_admin());
CREATE POLICY "cash_transactions_all" ON public.cash_transactions FOR ALL USING (public.is_maad_pastor_or_admin());

-- 15. MINISTRY_EXPENSES
CREATE POLICY "ministry_expenses_select" ON public.ministry_expenses FOR SELECT USING (
    reported_by = auth.uid() OR public.is_maad_pastor_or_admin()
);
CREATE POLICY "ministry_expenses_insert" ON public.ministry_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "ministry_expenses_update" ON public.ministry_expenses FOR UPDATE USING (
    public.is_maad_pastor_or_admin() OR reported_by = auth.uid()
);
CREATE POLICY "ministry_expenses_delete" ON public.ministry_expenses FOR DELETE USING (public.is_admin());

-- 16. ANNOUNCEMENTS
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "announcements_all" ON public.announcements FOR ALL USING (public.is_pastor_or_admin());

-- 17. NOTIFICATIONS
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (recipient_id = auth.uid() OR public.is_admin());
