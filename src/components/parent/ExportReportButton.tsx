import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, Loader as Loader2, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { generateStudentReportPDF, generateComprehensiveReport } from "@/lib/pdfExport";

interface ExportReportButtonProps {
  studentId: string;
  studentName: string;
  schoolYear: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportReportButton({
  studentId,
  studentName,
  schoolYear,
  variant = "default",
  size = "default",
}: ExportReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (daysBack: number, periodName: string) => {
    setLoading(true);
    try {
      toast.info(`A gerar relatório de ${periodName}...`);

      const report = await generateComprehensiveReport(
        studentId,
        studentName,
        schoolYear,
        daysBack
      );

      await generateStudentReportPDF(report);

      toast.success(`Relatório de ${periodName} gerado com sucesso!`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              A gerar...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar Relatório
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Período do Relatório
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(7, "Última Semana")}
          disabled={loading}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Última Semana (7 dias)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport(30, "Último Mês")}
          disabled={loading}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Último Mês (30 dias)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport(90, "Últimos 3 Meses")}
          disabled={loading}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Últimos 3 Meses (90 dias)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(365, "Último Ano")}
          disabled={loading}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Último Ano Completo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
