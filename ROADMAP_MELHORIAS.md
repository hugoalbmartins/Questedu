# 🚀 ROADMAP DE MELHORIAS - Quest Game
## Plano Completo de Implementação de Funcionalidades

**Data**: 15 de Março de 2026
**Versão**: 1.0
**Status**: Documento de Planeamento

---

## ✅ FASE 1 - IMPLEMENTADAS (15/03/2026)

### 🛡️ Segurança Online

#### 1.1 Sistema de Denúncia de Mensagens ✅
- **Status**: IMPLEMENTADO
- **Componente**: `ReportMessageModal.tsx`
- **Base de Dados**: Tabela `message_reports`
- **Funcionalidades**:
  - Botão de denúncia em cada mensagem recebida
  - 6 motivos pré-definidos + campo de texto livre
  - Sistema de revisão por administradores
  - Estados: pending, reviewed, action_taken, dismissed
  - Alertas sobre denúncias falsas

#### 1.2 Filtro Automático de Profanidade ✅
- **Status**: IMPLEMENTADO
- **Base de Dados**: Tabelas `profanity_list`, `chat_violations`
- **Funções**: `check_message_profanity()`
- **Funcionalidades**:
  - Lista configurável de palavras proibidas (PT)
  - 4 níveis de severidade: low, medium, high, extreme
  - Bloqueio automático de mensagens
  - Log de violações para auditoria
  - Mensagens não são enviadas quando detectada violação

#### 1.3 Rate Limiting de Chat ✅
- **Status**: IMPLEMENTADO
- **Base de Dados**: Tabela `chat_rate_limits`
- **Função**: `check_chat_rate_limit()`
- **Limite**: 10 mensagens por minuto por utilizador
- **Janela**: Renovação a cada minuto
- **Feedback**: Mensagem clara ao utilizador quando limite atingido

---

### 📚 Pedagógica

#### 1.4 Caderno de Erros ✅
- **Status**: IMPLEMENTADO
- **Componente**: `ErrorNotebookModal.tsx`
- **Base de Dados**: Tabela `error_notebook`
- **Funcionalidades**:
  - Registo automático de respostas erradas
  - Filtro por disciplina
  - Estados: não revisto, revisto, dominado
  - Contador de revisões
  - Explicações detalhadas (campo `explanation` em `questions`)
  - Interface amigável com badges coloridos
  - Estatísticas: total erros, por rever, dominados
  - Acesso via painel de definições do jogo

#### 1.5 Dashboard de Progresso Parental ✅
- **Status**: IMPLEMENTADO
- **Componente**: `StudentProgressDashboard.tsx`
- **Base de Dados**: Tabela `student_progress_analytics`
- **Funcionalidades**:
  - Precisão global em percentagem
  - Total de questões respondidas
  - Desempenho por disciplina (Português, Matemática, Estudo do Meio, Inglês)
  - Sequência atual e máxima (streaks)
  - Último quiz realizado
  - Alertas de inatividade (>3 dias)
  - Alertas de desempenho baixo (<50% com 5+ questões)
  - Badges de excelente desempenho (≥80% com 10+ questões)
  - Integração com caderno de erros
  - Sugestões automáticas aos pais

---

### ♿ Acessibilidade

#### 1.6 Text-to-Speech ✅
- **Status**: IMPLEMENTADO
- **Lib**: `textToSpeech.ts`
- **API**: Web Speech API (nativa do browser)
- **Funcionalidades**:
  - Botão toggle no quiz modal
  - Leitura automática de perguntas e opções
  - Voz portuguesa (pt-PT, fallback pt-BR)
  - Controles: play, pause, stop
  - Velocidade ajustada para clareza (0.9x)
  - Limpeza automática ao fechar quiz
  - Suporte para deficiência visual
  - Auxílio à leitura para crianças

---

## 🔄 FASE 2 - PRIORITÁRIAS (Próximas 2 Semanas)

### 🛡️ Segurança Online

#### 2.1 Admin Dashboard para Denúncias 🔴 ALTA
- **Objetivo**: Interface para administradores gerirem denúncias
- **Tarefas**:
  - [ ] Criar `AdminReportsPanel.tsx`
  - [ ] Listar denúncias pendentes
  - [ ] Visualizar conteúdo da mensagem reportada
  - [ ] Adicionar notas de administrador
  - [ ] Ações: Aprovar, Dispensar, Tomar Ação
  - [ ] Histórico de ações tomadas
  - [ ] Estatísticas de moderação

#### 2.2 Sistema de Penalidades Automáticas 🔴 ALTA
- **Objetivo**: Ações automáticas baseadas em violações
- **Tarefas**:
  - [ ] Criar tabela `user_penalties`
  - [ ] Sistema de strikes (3 strikes = suspensão temporária)
  - [ ] Tipos: warning, temp_ban, perm_ban
  - [ ] Duração configurável
  - [ ] Notificação aos pais de penalidades
  - [ ] Recurso de apelação

#### 2.3 Validação de Nome de Utilizador 🟡 MÉDIA
- **Objetivo**: Prevenir informação pessoal em display names
- **Tarefas**:
  - [ ] Regex para detetar números de telefone
  - [ ] Regex para detetar emails
  - [ ] Regex para detetar moradas
  - [ ] Lista de nomes comuns (prevenir apelidos completos)
  - [ ] Validação em tempo real no registo
  - [ ] Sugestões alternativas

---

### 📚 Pedagógica

#### 2.4 Explicações em Todas as Questões 🔴 ALTA
- **Objetivo**: Adicionar explicações pedagógicas a todas as 400+ perguntas
- **Tarefas**:
  - [ ] Script para popular campo `explanation` em `questions`
  - [ ] Explicações para Português (100+ questões)
  - [ ] Explicações para Matemática (100+ questões)
  - [ ] Explicações para Estudo do Meio (100+ questões)
  - [ ] Explicações para Inglês (100+ questões)
  - [ ] Revisão por professor qualificado
  - [ ] Mostrar explicação após resposta errada no quiz

#### 2.5 Sistema de Dificuldade Adaptativa 🟡 MÉDIA
- **Objetivo**: Ajustar dificuldade das questões baseado em desempenho
- **Tarefas**:
  - [ ] Criar tabela `student_subject_difficulty`
  - [ ] Tracking de taxa de acerto por disciplina
  - [ ] Algoritmo de ajuste (3 erros seguidos = nível mais fácil)
  - [ ] Algoritmo de aumento (5 acertos seguidos = nível mais difícil)
  - [ ] Limites: não descer abaixo do ano atual -1
  - [ ] UI: Indicador de dificuldade no quiz
  - [ ] Feedback aos pais sobre ajustes

#### 2.6 Relatório Semanal por Email 🟡 MÉDIA
- **Objetivo**: Enviar resumo semanal aos pais
- **Tarefas**:
  - [ ] Edge Function `send-weekly-report`
  - [ ] Cron job (todos os domingos 20h)
  - [ ] Template HTML responsivo
  - [ ] Métricas: quizzes feitos, taxa acerto, streak, tempo jogado
  - [ ] Destaque: conquistas desbloqueadas
  - [ ] Sugestões personalizadas
  - [ ] Link direto para dashboard parental

---

### 🎮 Diversão e Engagement

#### 2.7 Mini-jogos Educativos 🟡 MÉDIA
- **Objetivo**: Variedade de gameplay para manter interesse
- **Tarefas**:
  - [ ] Memory Game (pares de conceitos)
  - [ ] Word Search (vocabulário)
  - [ ] Drag and Drop (ordenação, classificação)
  - [ ] Puzzle Image (monumentos portugueses)
  - [ ] Recompensas específicas para cada mini-jogo
  - [ ] Rotação semanal de mini-jogos disponíveis

#### 2.8 Eventos Sazonais 🟢 BAIXA
- **Objetivo**: Conteúdo temático para datas especiais
- **Tarefas**:
  - [ ] Sistema de eventos em tabela `seasonal_events`
  - [ ] Halloween (Outubro): Questões sobre mitos/lendas
  - [ ] Natal (Dezembro): Questões sobre tradições
  - [ ] Carnaval (Fevereiro): Questões culturais
  - [ ] Santos Populares (Junho): História portuguesa
  - [ ] Decorações especiais na vila
  - [ ] Recompensas exclusivas temporárias
  - [ ] Missões temáticas

#### 2.9 Sistema de Badges e Títulos 🟢 BAIXA
- **Objetivo**: Customização e status social
- **Tarefas**:
  - [ ] Criar tabela `player_badges`
  - [ ] 50+ badges diferentes
  - [ ] Categorias: Académico, Social, Builder, Explorer
  - [ ] Títulos desbloqueáveis
  - [ ] Showcase no perfil
  - [ ] Badge destacado visível para amigos

---

### 💰 Monetização

#### 2.10 Trial Premium (7 dias) 🔴 ALTA
- **Objetivo**: Aumentar conversão para premium
- **Tarefas**:
  - [ ] Lógica de trial em `subscriptions` table
  - [ ] Ativar automaticamente para novos users
  - [ ] Notificações 2 dias antes de expirar
  - [ ] Modal de conversão ao final do trial
  - [ ] Analytics de conversão trial→paid
  - [ ] A/B test de duração (7 vs 14 dias)

#### 2.11 Plano Familiar 🔴 ALTA
- **Objetivo**: Maximizar LTV de famílias com múltiplos filhos
- **Tarefas**:
  - [ ] Novo tipo de subscrição: `family`
  - [ ] Preço: €3.99/mês (vs €1.99×4 = €7.96)
  - [ ] Limite: até 4 educandos
  - [ ] Stripe product e pricing
  - [ ] UI no PremiumModal
  - [ ] Lógica de aplicação a todos os filhos
  - [ ] Upgrade automático de individual→família

#### 2.12 Gift Cards e Códigos de Presente 🟡 MÉDIA
- **Objetivo**: Novos canais de venda
- **Tarefas**:
  - [ ] Gerar códigos únicos (12 caracteres)
  - [ ] Tabela `gift_cards` (código, duração, usado, usado_por)
  - [ ] Durações: 1, 3, 6, 12 meses
  - [ ] Interface de resgate
  - [ ] Validação e aplicação à conta
  - [ ] Email de confirmação
  - [ ] Parcerias com escolas/livrarias

---

## 🔮 FASE 3 - MÉDIO PRAZO (1-3 Meses)

### 📚 Pedagógica Avançada

#### 3.1 Análise de Lacunas de Conhecimento 🟡 MÉDIA
- **Objetivo**: Identificar tópicos específicos com dificuldade
- **Tarefas**:
  - [ ] Tagging de questões por tópico/sub-tópico
  - [ ] Ex: Matemática → Multiplicação → Tabelas
  - [ ] Dashboard mostrando tópicos fracos
  - [ ] Recomendações de prática focada
  - [ ] Quizzes gerados para tópicos específicos
  - [ ] Integração com currículo nacional

#### 3.2 Modo de Estudo com Temporizador Pomodoro 🟢 BAIXA
- **Objetivo**: Sessões de estudo estruturadas
- **Tarefas**:
  - [ ] Timer configurável (25min padrão)
  - [ ] Pausas obrigatórias (5min)
  - [ ] Bloqueio de distrações durante sessão
  - [ ] Recompensas por sessões completas
  - [ ] Estatísticas de tempo de estudo
  - [ ] Gráficos de produtividade

#### 3.3 Recomendações Baseadas em IA 🟢 BAIXA
- **Objetivo**: Sugestões personalizadas de conteúdo
- **Tarefas**:
  - [ ] Integração com OpenAI API
  - [ ] Análise de padrão de erros
  - [ ] Sugestões de tópicos a estudar
  - [ ] Explicações adaptadas ao nível
  - [ ] Custo controlado (cache de respostas)

---

### 🎮 Social e Multiplayer

#### 3.4 Missões Cooperativas 🟡 MÉDIA
- **Objetivo**: Jogabilidade social educativa
- **Tarefas**:
  - [ ] Criar tabela `cooperative_missions`
  - [ ] Missões para 2-4 jogadores
  - [ ] Recompensas partilhadas
  - [ ] Quiz em equipa (todos respondem, maioria ganha)
  - [ ] Construção colaborativa de monumento
  - [ ] Leaderboard de equipas

#### 3.5 Torneios Escolares 🟡 MÉDIA
- **Objetivo**: Competição saudável entre escolas
- **Tarefas**:
  - [ ] Sistema de inscrição de equipas escolares
  - [ ] Torneios mensais
  - [ ] Leaderboard por escola
  - [ ] Prémios para top 3 escolas
  - [ ] Certificados digitais
  - [ ] Marketing para escolas

#### 3.6 Sistema de Clãs/Guildas 🟢 BAIXA
- **Objetivo**: Comunidades dentro do jogo
- **Tarefas**:
  - [ ] Criação de clãs (máx 20 membros)
  - [ ] Chat de clã (moderado)
  - [ ] Objetivos de clã
  - [ ] Ranking de clãs
  - [ ] Emblema customizável
  - [ ] Benefícios de clã (bonus XP)

---

### ♿ Acessibilidade Avançada

#### 3.7 Modo Simplificado 🟡 MÉDIA
- **Objetivo**: UI reduzida para sobrecarga cognitiva
- **Tarefas**:
  - [ ] Toggle "Modo Simples"
  - [ ] Esconder elementos decorativos
  - [ ] Interface minimalista
  - [ ] Texto maior por padrão
  - [ ] Animações reduzidas
  - [ ] Focus em gameplay core

#### 3.8 Legendas Visuais para Sons 🟡 MÉDIA
- **Objetivo**: Acessibilidade auditiva
- **Tarefas**:
  - [ ] Indicadores visuais para SFX
  - [ ] Ex: 🔔 quando notificação
  - [ ] Ex: ⚔️ quando inicia batalha
  - [ ] Customização de ícones
  - [ ] Tamanho ajustável

#### 3.9 Navegação por Teclado Completa 🟡 MÉDIA
- **Objetivo**: Acessibilidade motora
- **Tarefas**:
  - [ ] Keyboard shortcuts documentados
  - [ ] Focus indicators visíveis
  - [ ] Tab order lógico
  - [ ] Atalhos: Q (quiz), B (build), M (map)
  - [ ] Escape fecha modais
  - [ ] Setas navegam opções

---

### 🔧 Técnica e Performance

#### 3.10 Analytics e Tracking 🔴 ALTA
- **Objetivo**: Decisões baseadas em dados
- **Tarefas**:
  - [ ] Integrar Posthog ou Mixpanel
  - [ ] Events: quiz_started, quiz_completed, building_placed
  - [ ] Funnels: registo→primeiro_quiz→premium
  - [ ] Retention cohorts
  - [ ] A/B testing framework
  - [ ] Dashboards de KPIs
  - [ ] Privacy compliant (GDPR)

#### 3.11 Code Splitting e Lazy Loading 🟡 MÉDIA
- **Objetivo**: Melhorar performance inicial
- **Tarefas**:
  - [ ] Lazy load rotas pesadas
  - [ ] Code split por feature
  - [ ] Imagens lazy loaded
  - [ ] Bundle analysis
  - [ ] Tree shaking otimizado
  - [ ] Reduzir bundle de 1.3MB → <800KB

#### 3.12 Offline Mode (PWA) 🟢 BAIXA
- **Objetivo**: Jogo funcional sem internet
- **Tarefas**:
  - [ ] Service worker robusto
  - [ ] Cache de assets críticos
  - [ ] IndexedDB para progresso offline
  - [ ] Sync quando volta online
  - [ ] UI de status de conexão
  - [ ] Modo offline limitado (single-player only)

---

## 🎯 FASE 4 - LONGO PRAZO (3-6 Meses)

### 📱 Mobile Nativo

#### 4.1 App iOS (React Native ou Capacitor) 🔴 ALTA
- **Objetivo**: Presença na App Store
- **Tarefas**:
  - [ ] Setup Capacitor (já existe config)
  - [ ] Builds iOS
  - [ ] Push notifications nativas
  - [ ] In-App Purchases
  - [ ] App Store listing
  - [ ] TestFlight beta
  - [ ] Marketing para App Store

#### 4.2 App Android 🔴 ALTA
- **Objetivo**: Presença na Play Store
- **Tarefas**:
  - [ ] Builds Android
  - [ ] Google Play Billing
  - [ ] Otimizações Android
  - [ ] Play Store listing
  - [ ] Beta testing
  - [ ] ASO (App Store Optimization)

---

### 🌍 Expansão de Conteúdo

#### 4.3 Anos 5º e 6º 🟡 MÉDIA
- **Objetivo**: Expandir para 2º ciclo
- **Tarefas**:
  - [ ] 200+ questões por ano
  - [ ] Disciplinas: PT, MAT, CN, HGP, ING
  - [ ] Ajustar progressão de jogo
  - [ ] Novos monumentos/conteúdo cultural
  - [ ] Beta com escolas parceiras

#### 4.4 Versão Espanhola 🟢 BAIXA
- **Objetivo**: Mercado espanhol (5x maior)
- **Tarefas**:
  - [ ] Tradução completa (questões + UI)
  - [ ] Monumentos espanhóis
  - [ ] Currículo espanhol
  - [ ] Marketing para Espanha
  - [ ] Parcerias com escolas ES
  - [ ] Servidor dedicado ES

---

### 🎓 Parcerias e B2B

#### 4.5 Licenciamento para Escolas 🔴 ALTA
- **Objetivo**: Receita B2B recorrente
- **Tarefas**:
  - [ ] Plano "School" (€500/ano para 100 alunos)
  - [ ] Dashboard de professor
  - [ ] Gestão de turmas
  - [ ] Relatórios de progresso bulk
  - [ ] Integração com sistemas escolares
  - [ ] Materiais de apoio para professores
  - [ ] Formação para docentes

#### 4.6 Programa de Afiliados 🟡 MÉDIA
- **Objetivo**: Marketing de performance
- **Tarefas**:
  - [ ] Sistema de tracking de referrals
  - [ ] Comissão: 20% primeiro ano
  - [ ] Dashboard de afiliado
  - [ ] Materiais de marketing
  - [ ] Onboarding de influencers educação
  - [ ] Payouts mensais

---

## 📊 MÉTRICAS DE SUCESSO

### Pedagógicas
- Taxa de acerto global: Target >70%
- Tempo médio por questão: <45 segundos
- Uso de caderno de erros: >30% dos alunos
- Melhoria após revisão de erro: +15% acerto

### Engagement
- DAU/MAU ratio: >40%
- Sessões/dia: >1.5
- Streak médio: >7 dias
- Retention D7: >60%, D30: >40%

### Monetização
- Conversão free→premium: >5%
- Trial→paid: >25%
- Churn mensal: <5%
- ARPU: >€2.50

### Segurança
- Tempo médio resolução denúncias: <24h
- Taxa de violações: <0.5% mensagens
- Satisfação parental: >4.5/5

---

## 🚦 PRIORIZAÇÃO

### 🔴 CRÍTICO (Fazer Imediatamente)
1. Admin dashboard para denúncias
2. Explicações em todas as questões
3. Trial premium 7 dias
4. Plano familiar
5. Analytics tracking

### 🟡 IMPORTANTE (2-4 Semanas)
6. Sistema de penalidades automáticas
7. Mini-jogos educativos
8. Dificuldade adaptativa
9. Relatório semanal email
10. Missões cooperativas

### 🟢 DESEJÁVEL (1-3 Meses)
11. Eventos sazonais
12. Sistema de badges
13. Gift cards
14. Torneios escolares
15. Mobile apps

---

## 📅 TIMELINE SUGERIDA

### Sprint 1 (Semana 1-2): Segurança + Pedagogia
- ✅ Sistema denúncias [FEITO]
- ✅ Filtro profanidade [FEITO]
- ✅ Caderno erros [FEITO]
- ✅ Dashboard parental [FEITO]
- ✅ TTS [FEITO]
- Admin dashboard denúncias
- Explicações questões (batch 1)

### Sprint 2 (Semana 3-4): Monetização + Engagement
- Trial premium
- Plano familiar
- Explicações questões (batch 2)
- Mini-jogo 1: Memory
- Analytics setup

### Sprint 3 (Semana 5-6): Features Avançadas
- Dificuldade adaptativa
- Relatório semanal
- Sistema penalidades
- Mini-jogo 2: Word Search
- Code splitting

### Sprint 4 (Semana 7-8): Social + Performance
- Missões cooperativas
- Torneios escolares
- Otimizações performance
- Mobile PWA melhorias

---

## 💡 NOTAS IMPORTANTES

### Conformidade Legal
- GDPR: Consentimento parental obrigatório <16 anos ✅
- COPPA (se expandir USA): Requisitos adicionais
- Lei de Proteção de Dados PT: Cumprimento total
- Moderação de conteúdo: Obrigatória para menores

### Escalabilidade
- Infraestrutura atual: Supabase (até ~10k users)
- Plano futuro: Migração para dedicated instance
- CDN: Implementar Cloudflare para assets
- Caching: Redis para queries frequentes

### Testes
- Unit tests: Cobertura mínima 60%
- E2E tests: Fluxos críticos (registo, quiz, pagamento)
- A/B testing: Framework para decisões data-driven
- Beta testers: Grupo de 50 famílias

---

## 🤝 CONTRIBUIÇÕES

Este documento é vivo e deve ser atualizado:
- A cada sprint completado
- Quando prioridades mudam
- Com feedback de users/pais
- Com novas ideias da equipa

**Última atualização**: 15/03/2026
**Próxima revisão**: 22/03/2026
