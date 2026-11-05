-- ====================================================================
-- IGREJA METODISTA ALIADO - SCHEMA COMPLETO DO SUPABASE (POSTGRESQL)
-- GESTÃO MINISTERIAL, METAS, SECRETARIA & MAAD (CONTABILIDADE)
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

-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
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

-- POLÍTICAS RLS SEGURAS E RESTRITAS (WCAG & SECURITY BEST PRACTICES)
-- 1. Perfis: Apenas usuários autenticados podem consultar perfis da igreja
CREATE POLICY "Leitura de perfis por autenticados" ON public.profiles FOR SELECT USING (
    auth.role() = 'authenticated'
);
CREATE POLICY "Admin gerencia perfis" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Leitura de ministerios por todos" ON public.ministries FOR SELECT USING (true);

CREATE POLICY "Leitura de metas por todos autenticados" ON public.goals FOR SELECT USING (
    auth.role() = 'authenticated'
);
CREATE POLICY "Pastor e admin criam metas" ON public.goals FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'admin'))
);

-- 2. Orçamentos: Acesso restrito ao solicitante, Pastor, MAAD e Admin (Proteção de dados financeiros)
CREATE POLICY "Leitura de orcamentos autorizados" ON public.budgets FOR SELECT USING (
    auth.uid() = requested_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'maad', 'admin'))
);
CREATE POLICY "Lider cria orcamentos" ON public.budgets FOR INSERT WITH CHECK (
    auth.uid() = requested_by
);
CREATE POLICY "Pastor e MAAD alteram orcamentos" ON public.budgets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'maad', 'admin'))
);

-- 3. Fluxo de Caixa: Apenas Tesouraria MAAD, Pastor e Admin têm acesso total
CREATE POLICY "Pastor e MAAD gerenciam fluxo de caixa" ON public.cash_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pastor', 'maad', 'admin'))
);

CREATE POLICY "Leitura de eventos por todos" ON public.church_events FOR SELECT USING (true);
CREATE POLICY "Secretaria, pastor e admin gerenciam eventos" ON public.church_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('secretaria', 'pastor', 'admin'))
);
