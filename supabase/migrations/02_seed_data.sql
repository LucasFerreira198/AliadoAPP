-- ====================================================================
-- SEED DATA INICIAL PARA IGREJA METODISTA ALIADO
-- ====================================================================

-- MINISTÉRIOS OFICIAIS
INSERT INTO public.ministries (id, name, description, color_hex, icon_name)
VALUES
    ('a0000001-0000-0000-0000-000000000000', 'MAAD - Administração & Contabilidade', 'Aprovação de orçamentos, lançamentos contábeis, tesouraria e fluxo financeiro', '#059669', 'landmark'),
    ('a0000001-0000-0000-0000-000000000001', 'Ministério de Louvor', 'Adoração, grupos musicais, instrumentistas e coral da igreja', '#DC2626', 'music'),
    ('a0000001-0000-0000-0000-000000000002', 'Sociedade de Jovens', 'Juventude Metodista Aliado, encontros, retiros e discipulado', '#EA580C', 'flame'),
    ('a0000001-0000-0000-0000-000000000003', 'Ministério Infantil & EBD', 'Escola Bíblica Dominical, crianças e departamentos educacionais', '#F59E0B', 'smile'),
    ('a0000001-0000-0000-0000-000000000004', 'Diaconia & Recepção', 'Serviço da Santa Ceia, acolhimento de visitantes, portaria e ordem', '#2563EB', 'heart-handshake'),
    ('a0000001-0000-0000-0000-000000000005', 'Comunicação & Mídia', 'Transmissão ao vivo, fotografia, som, redes sociais e design', '#7C3AED', 'camera'),
    ('a0000001-0000-0000-0000-000000000006', 'Sociedade de Mulheres', 'Mulheres Metodistas, intercessão, chá e apoio às famílias', '#DB2777', 'flower-2'),
    ('a0000001-0000-0000-0000-000000000007', 'Sociedade de Homens', 'Homens de honra, apoio aos trabalhos operacionais e oração', '#0F172A', 'shield'),
    ('a0000001-0000-0000-0000-000000000008', 'Ação Social & Missões', 'Distribuição de cestas básicas, visitas em hospitais e evangelismo', '#16A34A', 'globe')
ON CONFLICT (id) DO NOTHING;

-- CULTOS FIXOS RECORRENTES DA SECRETARIA
INSERT INTO public.recurring_schedules (id, title, day_of_week, day_name, start_time, end_time, location, description)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Culto de Celebração da Família', 0, 'Domingo', '19:00', '21:00', 'Templo Principal', 'Culto solene de domingo com pregação pastoral e Santa Ceia'),
    ('c0000001-0000-0000-0000-000000000002', 'Escola Bíblica Dominical (EBD)', 0, 'Domingo', '09:00', '11:00', 'Salas Educacionais', 'Classes por faixa etária: Infantil, Jovens e Adultos'),
    ('c0000001-0000-0000-0000-000000000003', 'Culto de Oração e Estudo Bíblico', 2, 'Terça-feira', '19:30', '21:00', 'Templo Principal', 'Reunião de oração e estudo das Sagradas Escrituras')
ON CONFLICT (id) DO NOTHING;
