import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleAlert as AlertCircle, Ban, CircleCheck as CheckCircle, Circle as XCircle, Eye, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_message_id: string | null;
  reason: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  message_context: any[];
  action_details: any;
  reporter: {
    display_name: string;
  };
  reported_user: {
    display_name: string;
  };
  message: {
    content: string;
  } | null;
}

export function AdminReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadReports();
  }, [filterStatus, currentPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("message_reports")
        .select(`
          *,
          reporter:students!message_reports_reporter_id_fkey(display_name),
          reported_user:students!message_reports_reported_user_id_fkey(display_name),
          message:chat_messages(content)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setReports(data || []);
      setTotalReports(count || 0);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Erro ao carregar denúncias");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "dismiss" | "ban_user" | "warn_user") => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const actionDetails = {
        action,
        timestamp: new Date().toISOString(),
        notes: adminNotes,
      };

      let newStatus: string;
      switch (action) {
        case "approve":
          newStatus = "action_taken";
          break;
        case "dismiss":
          newStatus = "dismissed";
          break;
        case "ban_user":
        case "warn_user":
          newStatus = "action_taken";
          break;
        default:
          newStatus = "reviewed";
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("message_reports")
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          action_details: actionDetails,
        })
        .eq("id", selectedReport.id);

      if (updateError) throw updateError;

      if (action === "ban_user" || action === "warn_user") {
        const strikeCount = await getStrikeCount(selectedReport.reported_user_id);

        let penaltyType: string;
        let expiresAt: string | null = null;
        let reason: string;

        if (action === "warn_user") {
          penaltyType = "warning";
          reason = `Aviso por comportamento inadequado. Denúncia: ${selectedReport.reason}`;
        } else {
          if (strikeCount === 0) {
            penaltyType = "temp_ban";
            expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            reason = "Primeira suspensão (24h) por violação das regras de chat";
          } else if (strikeCount === 1) {
            penaltyType = "temp_ban";
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            reason = "Segunda suspensão (7 dias) por violações repetidas";
          } else {
            penaltyType = "perm_ban";
            reason = "Banimento permanente por múltiplas violações";
          }
        }

        const { error: penaltyError } = await supabase
          .from("user_penalties")
          .insert({
            student_id: selectedReport.reported_user_id,
            penalty_type: penaltyType,
            reason: adminNotes || reason,
            violation_ids: [selectedReport.id],
            issued_by: user.id,
            expires_at: expiresAt,
            active: true,
          });

        if (penaltyError) throw penaltyError;

        toast.success(
          action === "warn_user"
            ? "Aviso aplicado com sucesso"
            : `Penalidade aplicada: ${penaltyType === "perm_ban" ? "Banimento permanente" : `Suspensão até ${format(new Date(expiresAt!), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}`
        );
      } else {
        toast.success(
          action === "approve" ? "Denúncia aprovada" : "Denúncia dispensada"
        );
      }

      setSelectedReport(null);
      setAdminNotes("");
      loadReports();
    } catch (error) {
      console.error("Error handling action:", error);
      toast.error("Erro ao processar ação");
    } finally {
      setActionLoading(false);
    }
  };

  const getStrikeCount = async (studentId: string): Promise<number> => {
    const { data, error } = await supabase.rpc("get_strike_count", {
      student_id_param: studentId,
    });

    if (error) {
      console.error("Error getting strike count:", error);
      return 0;
    }

    return data || 0;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      reviewed: { label: "Revisto", className: "bg-blue-500" },
      action_taken: { label: "Ação Tomada", className: "bg-green-500" },
      dismissed: { label: "Dispensado", className: "bg-gray-500" },
    };

    const config = variants[status] || { label: status, className: "bg-gray-500" };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const totalPages = Math.ceil(totalReports / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Moderação de Denúncias</h3>
          <p className="text-sm text-muted-foreground">
            {totalReports} denúncias {filterStatus !== "all" && `(${filterStatus})`}
          </p>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="reviewed">Revistas</SelectItem>
            <SelectItem value="action_taken">Ação Tomada</SelectItem>
            <SelectItem value="dismissed">Dispensadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma denúncia encontrada
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Denúncia de {report.reporter?.display_name || "Utilizador"}
                      </CardTitle>
                      <CardDescription>
                        Contra: <strong>{report.reported_user?.display_name || "Utilizador"}</strong>
                        {" • "}
                        {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Motivo:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {report.reason}
                    </p>
                  </div>

                  {report.message && (
                    <div>
                      <p className="text-sm font-medium mb-2">Mensagem reportada:</p>
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <p className="text-sm">{report.message.content}</p>
                      </div>
                    </div>
                  )}

                  {report.admin_notes && (
                    <div>
                      <p className="text-sm font-medium mb-2">Notas do Administrador:</p>
                      <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                        {report.admin_notes}
                      </p>
                    </div>
                  )}

                  {report.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes("");
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Analisar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {selectedReport && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Análise de Denúncia</CardTitle>
            <CardDescription>
              Reportado por: {selectedReport.reporter?.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notas do Administrador:
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione notas sobre esta denúncia..."
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar Denúncia
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("warn_user")}
                disabled={actionLoading}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Avisar Utilizador
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction("ban_user")}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Banir Utilizador
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("dismiss")}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Dispensar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedReport(null);
                  setAdminNotes("");
                }}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
