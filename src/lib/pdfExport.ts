interface StudentReport {
  studentName: string;
  schoolYear: number;
  periodStart: string;
  periodEnd: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  coinsEarned: number;
  xpGained: number;
  currentStreak: number;
  longestStreak: number;
  subjectBreakdown: Array<{
    subject: string;
    questions: number;
    correct: number;
    accuracy: number;
    trend: string;
  }>;
  badges: Array<{
    name: string;
    earned_at: string;
  }>;
  weakAreas: Array<{
    subject: string;
    topic: string;
    accuracy: number;
  }>;
  achievements: string[];
}

export async function generateStudentReportPDF(report: StudentReport): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório de Progresso - ${report.studentName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }

    .header h1 {
      color: #1e40af;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header .subtitle {
      color: #64748b;
      font-size: 18px;
    }

    .period {
      text-align: center;
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 14px;
      color: #475569;
    }

    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }

    .section-title {
      color: #1e40af;
      font-size: 22px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .stat-card.blue {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    }

    .stat-card.green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .stat-card.yellow {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .stat-card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-card .label {
      font-size: 14px;
      opacity: 0.9;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .table thead {
      background: #3b82f6;
      color: white;
    }

    .table th,
    .table td {
      padding: 12px 15px;
      text-align: left;
    }

    .table tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }

    .table tbody tr:last-child {
      border-bottom: none;
    }

    .table tbody tr:hover {
      background: #f8fafc;
    }

    .trend-up {
      color: #10b981;
      font-weight: bold;
    }

    .trend-down {
      color: #ef4444;
      font-weight: bold;
    }

    .trend-stable {
      color: #64748b;
      font-weight: bold;
    }

    .badge-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .badge-item {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }

    .badge-item .icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .badge-item .name {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 4px;
    }

    .badge-item .date {
      font-size: 12px;
      color: #64748b;
    }

    .weak-areas {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
    }

    .weak-areas h3 {
      color: #dc2626;
      margin-bottom: 15px;
    }

    .weak-item {
      background: white;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 4px solid #ef4444;
    }

    .achievements {
      background: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
    }

    .achievements h3 {
      color: #16a34a;
      margin-bottom: 15px;
    }

    .achievement-item {
      background: white;
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 8px;
      border-left: 4px solid #22c55e;
    }

    .footer {
      margin-top: 50px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    @media print {
      body {
        padding: 20px;
      }

      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Relatório de Progresso</h1>
    <div class="subtitle">${report.studentName} - ${report.schoolYear}º Ano</div>
  </div>

  <div class="period">
    <strong>Período:</strong> ${new Date(report.periodStart).toLocaleDateString('pt-PT')} - ${new Date(report.periodEnd).toLocaleDateString('pt-PT')}
  </div>

  <div class="section">
    <h2 class="section-title">📈 Estatísticas Gerais</h2>
    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="value">${report.totalQuestions}</div>
        <div class="label">Perguntas Respondidas</div>
      </div>
      <div class="stat-card green">
        <div class="value">${report.accuracy.toFixed(1)}%</div>
        <div class="label">Taxa de Acerto</div>
      </div>
      <div class="stat-card yellow">
        <div class="value">${report.currentStreak}</div>
        <div class="label">Dias de Sequência</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${report.correctAnswers}</div>
        <div class="label">Respostas Corretas</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.coinsEarned}</div>
        <div class="label">Moedas Ganhas 🪙</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.xpGained}</div>
        <div class="label">XP Conquistado ⭐</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">📚 Desempenho por Disciplina</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Disciplina</th>
          <th>Perguntas</th>
          <th>Corretas</th>
          <th>Precisão</th>
          <th>Tendência</th>
        </tr>
      </thead>
      <tbody>
        ${report.subjectBreakdown.map(subject => `
          <tr>
            <td><strong>${getSubjectLabel(subject.subject)}</strong></td>
            <td>${subject.questions}</td>
            <td>${subject.correct}</td>
            <td>${subject.accuracy.toFixed(1)}%</td>
            <td class="trend-${subject.trend === 'improving' ? 'up' : subject.trend === 'declining' ? 'down' : 'stable'}">
              ${subject.trend === 'improving' ? '↑ A melhorar' : subject.trend === 'declining' ? '↓ A descer' : '→ Estável'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${report.badges.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🏆 Conquistas e Badges</h2>
      <div class="badge-list">
        ${report.badges.slice(0, 6).map(badge => `
          <div class="badge-item">
            <div class="icon">🏅</div>
            <div class="name">${badge.name}</div>
            <div class="date">${new Date(badge.earned_at).toLocaleDateString('pt-PT')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  ${report.weakAreas.length > 0 ? `
    <div class="section">
      <div class="weak-areas">
        <h3>⚠️ Áreas que Precisam de Atenção</h3>
        ${report.weakAreas.map(area => `
          <div class="weak-item">
            <strong>${getSubjectLabel(area.subject)}</strong> - ${area.topic}<br>
            <small>Precisão: ${area.accuracy.toFixed(1)}%</small>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  ${report.achievements.length > 0 ? `
    <div class="section">
      <div class="achievements">
        <h3>✨ Destaques do Período</h3>
        ${report.achievements.map(achievement => `
          <div class="achievement-item">✓ ${achievement}</div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  <div class="footer">
    <p>Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
    <p>Vila Aventura - Plataforma Educativa Gamificada</p>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    matematica: 'Matemática',
    portugues: 'Português',
    estudo_meio: 'Estudo do Meio',
    ingles: 'Inglês',
  };
  return labels[subject] || subject;
}

export async function generateComprehensiveReport(
  studentId: string,
  studentName: string,
  schoolYear: number,
  daysBack: number = 30
): Promise<StudentReport> {
  const { supabase } = await import('@/integrations/supabase/client');

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - daysBack);

  const [quizHistory, streakData, badgesData, knowledgeGaps, subjectComparison] = await Promise.all([
    supabase
      .from('quiz_history')
      .select('*, questions(*)')
      .eq('student_id', studentId)
      .gte('answered_at', periodStart.toISOString()),

    supabase
      .from('quiz_streaks')
      .select('current_streak, longest_streak')
      .eq('student_id', studentId)
      .single(),

    supabase
      .from('student_badges')
      .select('*, badges(name)')
      .eq('student_id', studentId)
      .gte('earned_at', periodStart.toISOString())
      .order('earned_at', { ascending: false }),

    supabase
      .from('knowledge_gaps')
      .select('*')
      .eq('student_id', studentId)
      .eq('needs_attention', true)
      .order('failure_rate', { ascending: false })
      .limit(5),

    supabase.rpc('get_subject_comparison', {
      student_id_param: studentId,
    }),
  ]);

  const questions = quizHistory.data || [];
  const totalQuestions = questions.length;
  const correctAnswers = questions.filter((q: any) => q.answered_correctly).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  const coinsEarned = questions.reduce((sum: number, q: any) => sum + (q.coins_earned || 0), 0);
  const xpGained = questions.reduce((sum: number, q: any) => sum + (q.xp_earned || 0), 0);

  const subjectBreakdown = (subjectComparison.data || []).map((subject: any) => ({
    subject: subject.subject,
    questions: subject.total_questions,
    correct: subject.correct_answers,
    accuracy: subject.accuracy,
    trend: subject.trend,
  }));

  const badges = (badgesData.data || []).map((badge: any) => ({
    name: badge.badges?.name || 'Badge',
    earned_at: badge.earned_at,
  }));

  const weakAreas = (knowledgeGaps.data || []).map((gap: any) => ({
    subject: gap.subject,
    topic: gap.topic_name,
    accuracy: (1 - gap.failure_rate) * 100,
  }));

  const achievements: string[] = [];

  if (streakData.data?.current_streak >= 7) {
    achievements.push(`Manteve uma sequência de ${streakData.data.current_streak} dias!`);
  }

  if (accuracy >= 90) {
    achievements.push(`Excelente precisão de ${accuracy.toFixed(1)}%!`);
  } else if (accuracy >= 75) {
    achievements.push(`Boa precisão de ${accuracy.toFixed(1)}%`);
  }

  if (totalQuestions >= 100) {
    achievements.push(`Respondeu a ${totalQuestions} perguntas no período!`);
  }

  if (badges.length >= 3) {
    achievements.push(`Conquistou ${badges.length} badges neste período!`);
  }

  const improvingSubjects = subjectBreakdown.filter((s: any) => s.trend === 'improving');
  if (improvingSubjects.length > 0) {
    achievements.push(`A melhorar em ${improvingSubjects.length} disciplina(s)!`);
  }

  return {
    studentName,
    schoolYear,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalQuestions,
    correctAnswers,
    accuracy,
    coinsEarned,
    xpGained,
    currentStreak: streakData.data?.current_streak || 0,
    longestStreak: streakData.data?.longest_streak || 0,
    subjectBreakdown,
    badges,
    weakAreas,
    achievements,
  };
}
