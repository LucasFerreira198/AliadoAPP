# Igreja Metodista Aliado - Aplicativo Mobile (Android & iOS)

Aplicativo oficial para gestão ministerial, acompanhamento pastoral de metas e objetivos, relatórios com fotos e vídeos, escalas de culto, prestação de contas e integração com a liderança da **Igreja Metodista Aliado**.

---

## 📱 Funcionalidades Principais

### 1. Gestão de Metas Pastorais Multi-Ministérios
- **Criação Broadcast (Pastor $\rightarrow$ N Ministérios):** O pastor pode criar uma meta e atribuí-la a múltiplos ministérios simultaneamente com prazo e nível de prioridade (Baixa, Média, Alta, Urgente).
- **Notificações Inteligentes:**
  - Líderes recebem notificação imediata quando uma meta é designada ao seu ministério.
  - O Pastor é notificado quando um líder envia uma dúvida ou quando a meta é concluída com relatório.
  - Alerta automático quando uma meta entra em atraso.
- **Painel de Indicadores (KPIs):** Total de metas, metas concluídas, metas em atraso e dúvidas aguardando resposta.

### 2. Relatórios Multimídia dos Líderes
- Envio de relatório descritivo com fotos e vídeos capturados pela câmera ou galeria do aparelho.
- Fluxo de aprovação pastoral (*"Aprovar com Louvor"* ou solicitação de ajustes).
- Thread de alinhamento e dúvidas diretamente na tarefa.

### 3. Experiência de Uso (UI/UX Pro Max)
- **💬 Ação Rápida WhatsApp Contextualizada:** Botão de 1 toque nos cards de metas, dúvidas e despesas que abre a conversa com o líder no WhatsApp com mensagem pré-formatada.
- **🎉 Central de Aniversariantes do Dia e do Mês:** Visualização dos aniversariantes com envio de bênção pastoral via WhatsApp.
- **📅 Escalas de Voluntários:** Gestão de voluntários nos cultos com botões de *"Confirmar Presença"* ou *"Solicitar Troca"*.
- **🧾 Comprovantes & Prestação de Contas:** Envio de fotos de cupons fiscais e recibos de gastos com aprovação pastoral.
- **📶 Modo Offline com Sincronização Inteligente:** Permite ao líder registrar relatórios e fotos em retiros ou acampamentos sem sinal, salvando localmente e sincronizando assim que houver conexão.
- **Design System Metodista Cruz e Chama:** Paleta solene em tons Slate Navy (`#0F172A`) e Carmesim/Âmbar (`#DC2626` / `#EA580C`), botões com área de toque $\ge 44\text{px}$, ícones Lucide padronizados e feedback háptico (`expo-haptics`).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ (instalado)
- Expo Go instalado no seu celular Android ou iOS

### Instalação e Execução
```bash
# Iniciar o servidor de desenvolvimento Expo
npm run start
# ou
npx expo start
```

Escaneie o QR Code exibido no terminal com o app **Expo Go** (no Android) ou com a Câmera (no iOS).

### Simulação de Perfis sem necessidade de backend imediato
O app já vem pronto para testes com o seletor rápido no topo da tela:
- **Pastor Carlos Alberto** (Visão completa de Pastor Titular)
- **Mariana Ramos** (Líder do Ministério de Louvor)
- **Lucas Souza** (Líder da Sociedade de Jovens)
- **Débora Lima** (Líder da EBD & Infantil)
- **Marcos Vinicius** (Diaconia & Recepção)

---

## 🗄️ Integração com Supabase (Opcional para Produção)

Os scripts SQL com a criação de tabelas, relacionamentos, políticas de segurança Row Level Security (RLS) e dados iniciais da Igreja Metodista Aliado estão em:
- `supabase/migrations/01_initial_schema.sql` (Estrutura DDL e RLS)
- `supabase/migrations/02_seed_data.sql` (Ministérios e eventos iniciais)

Basta colar os scripts no **SQL Editor** do seu painel do Supabase e configurar as variáveis no arquivo `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

---

## 🧪 Verificações de Qualidade Realizadas
- `npx tsc --noEmit`: **0 erros de tipagem**.
- `npx expo-doctor`: **20/20 checks aprovados**.
