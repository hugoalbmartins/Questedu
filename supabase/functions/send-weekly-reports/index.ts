import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WeeklyReportData {
  student_id: string;
  student_name: string;
  parent_email: string;
  parent_user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: studentsData, error: studentsError } = await supabase
      .rpc("get_students_for_weekly_reports");

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      throw studentsError;
    }

    const students = studentsData as WeeklyReportData[];
    const results = [];

    for (const student of students) {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const { data: reportId, error: reportError } = await supabase
          .rpc("generate_weekly_progress_report", {
            student_id_param: student.student_id,
            week_start_param: weekStart.toISOString(),
            week_end_param: new Date().toISOString(),
          });

        if (reportError) {
          console.error(`Error generating report for ${student.student_name}:`, reportError);
          results.push({
            student: student.student_name,
            success: false,
            error: reportError.message,
          });
          continue;
        }

        const { data: report, error: fetchError } = await supabase
          .from("progress_reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (fetchError) {
          console.error(`Error fetching report:`, fetchError);
          results.push({
            student: student.student_name,
            success: false,
            error: fetchError.message,
          });
          continue;
        }

        const emailHtml = generateEmailHTML(student.student_name, report);

        const { error: emailError } = await supabase.functions.invoke("send-email", {
          body: {
            to: student.parent_email,
            subject: `Relatório Semanal: ${student.student_name}`,
            html: emailHtml,
          },
        });

        if (emailError) {
          console.error(`Error sending email to ${student.parent_email}:`, emailError);
          results.push({
            student: student.student_name,
            success: false,
            error: emailError.message,
          });
          continue;
        }

        await supabase
          .from("progress_reports")
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq("id", reportId);

        results.push({
          student: student.student_name,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing ${student.student_name}:`, error);
        results.push({
          student: student.student_name,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${students.length} students`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function generateEmailHTML(studentName: string, report: any): string {
  const subjectsMap: Record<string, string> = {
    portugues: "Português",
    matematica: "Matemática",
    estudo_meio: "Estudo do Meio",
    ingles: "Inglês",
  };

  let subjectsHTML = "";
  if (report.subjects_practiced && typeof report.subjects_practiced === "object") {
    for (const [subject, stats] of Object.entries(report.subjects_practiced)) {
      const subjectName = subjectsMap[subject] || subject;
      const subjectStats = stats as any;
      subjectsHTML += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${subjectName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${subjectStats.total}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${subjectStats.correct}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${subjectStats.accuracy}%</td>
        </tr>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">📊 Relatório Semanal</h1>
          <p style="color: white; margin: 10px 0 0 0;">${studentName}</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">${report.parent_message}</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin-top: 0;">Resumo Geral</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Perguntas Respondidas:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${report.total_questions_answered}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Respostas Corretas:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${report.correct_answers}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Precisão:</strong></td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #667eea;">${report.accuracy_percentage}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Dias Ativos:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${report.days_active} / 7 dias</td>
              </tr>
            </table>
          </div>

          ${subjectsHTML ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #667eea;">Desempenho por Disciplina</h2>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Disciplina</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Total</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Corretas</th>
                    <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Precisão</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectsHTML}
                </tbody>
              </table>
            </div>
          ` : ""}

          ${report.notable_achievements && report.notable_achievements.length > 0 ? `
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <h3 style="color: #047857; margin-top: 0;">🎉 Conquistas da Semana</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${report.notable_achievements.map((achievement: string) => `<li>${achievement}</li>`).join("")}
              </ul>
            </div>
          ` : ""}

          ${report.improvement_areas && report.improvement_areas.length > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <h3 style="color: #b45309; margin-top: 0;">💡 Áreas de Melhoria</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${report.improvement_areas.map((area: string) => `<li>${area}</li>`).join("")}
              </ul>
            </div>
          ` : ""}

          ${report.top_subject ? `
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              <strong>Disciplina Forte:</strong> ${subjectsMap[report.top_subject] || report.top_subject}
            </p>
          ` : ""}

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Continue a acompanhar o progresso no dashboard parental
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
