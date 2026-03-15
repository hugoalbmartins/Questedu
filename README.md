# QuestEduca - Plataforma Educativa Gamificada

Plataforma educativa portuguesa para alunos do 1º ao 4º ano com sistema de aprendizagem gamificada através de construção de vilas isométricas.

## Características Principais

### Sistema de Aprendizagem
- **Múltiplas disciplinas**: Matemática, Português, Estudo do Meio e Inglês
- **Mais de 1000 questões** adaptadas ao currículo português
- **Dificuldade progressiva** com sistema adaptativo
- **Testes mensais** e avaliações de progresso
- **Caderno de erros** para revisão personalizada

### Gamificação
- **Vila isométrica** em 3D construída respondendo a quizzes
- **Sistema de recursos**: madeira, pedra, moedas e moedas premium
- **Conquistas e badges** desbloqueáveis
- **Rankings** por escola, distrito e nacional
- **Streaks diários** com bónus de recompensa
- **Missões e desafios** semanais

### Social e Competição
- **Sistema de amigos** e chat moderado
- **Duelos de quiz** em tempo real
- **Torneios sazonais**
- **Troca de recursos** entre jogadores
- **Equipas colaborativas**

### Painel de Pais
- **Monitorização de progresso** em tempo real
- **Relatórios semanais** automáticos por email
- **Controlo de chat** e bloqueio de utilizadores
- **Definição de prioridades** por disciplina
- **Análise de lacunas** de conhecimento
- **Configurações de acessibilidade**

### Premium
- **Sistema de subscrição** via Stripe
- **Planos familiares** com desconto
- **Trial de 7 dias** gratuito
- **Gift cards** e códigos promocionais
- **Recursos extra** e conteúdos exclusivos

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Pagamentos**: Stripe
- **PWA**: Instalável em dispositivos móveis
- **Canvas**: Renderização isométrica otimizada

## Instalação Local

### Pré-requisitos
- Node.js 18+ e npm
- Conta Supabase (gratuita)

### Configuração

1. Clone o repositório:
```bash
git clone <YOUR_GIT_URL>
cd questeduca
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um ficheiro `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Aceda à aplicação em `http://localhost:5173`

## Build para Produção

```bash
npm run build
```

Os ficheiros otimizados estarão na pasta `dist/`.

## Deploy

O projeto está configurado para deploy automático via:
- **Vercel** (configuração em `vercel.json`)
- **PWA** com service worker automático

## Estrutura do Projeto

```
questeduca/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   │   ├── game/      # Componentes do jogo
│   │   ├── parent/    # Dashboard de pais
│   │   ├── admin/     # Painel administrativo
│   │   └── ui/        # Componentes UI base (shadcn)
│   ├── pages/         # Páginas da aplicação
│   ├── lib/           # Utilitários e lógica
│   ├── hooks/         # React hooks personalizados
│   ├── contexts/      # Contextos React (Auth, etc)
│   ├── data/          # Dados estáticos (questões)
│   └── integrations/  # Integrações externas (Supabase)
├── supabase/
│   ├── migrations/    # Migrações SQL
│   └── functions/     # Edge Functions
└── public/            # Assets estáticos
```

## Base de Dados

O schema completo está nas migrations do Supabase em `supabase/migrations/`.

Principais tabelas:
- `profiles` - Perfis de utilizadores
- `game_progress` - Progresso no jogo
- `quiz_sessions` - Sessões de quiz
- `buildings` - Construções da vila
- `achievements` - Sistema de conquistas
- `subscriptions` - Gestão de subscrições

## Edge Functions

Funções serverless em Deno:
- `check-subscription` - Validação de subscrições
- `create-checkout` - Criação de sessões Stripe
- `stripe-webhook` - Webhook de eventos Stripe
- `send-email` - Envio de emails transacionais
- `send-weekly-reports` - Relatórios semanais automáticos

## Segurança

- **RLS (Row Level Security)** ativado em todas as tabelas
- **Autenticação** via Supabase Auth
- **Moderação de chat** com sistema de denúncias
- **Controlo parental** completo
- **Validação de dados** em backend e frontend

## Acessibilidade

- Leitor de texto
- Alto contraste
- Tamanho de fonte ajustável
- Lupa virtual
- Destaque de texto
- Compatível com leitores de ecrã

## Contribuir

Este é um projeto educativo português. Contribuições são bem-vindas!

## Licença

Todos os direitos reservados © 2026 QuestEduca

## Suporte

- **Email**: suporte@questeduca.pt
- **FAQ**: /faq
- **Privacidade**: privacidade@questeduca.pt

---

Desenvolvido com 💙 para crianças portuguesas
