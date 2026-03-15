import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, ChevronLeft, ChevronRight, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Penalty {
  id: string;
  student_id: string;
  penalty_type: string;
  reason: string;
  issued_by: string | null;
  issued_at: string;
  expires_at: string | null;
  active: boolean;
  parent_notified: boolean;
  student: {
    display_name: string;
  };
  issuer: {
    display_name: string;
  } | null;
}

interface Appeal {
  id: string;
  penalty_id: string;
  student_id: string;
  appeal_text: string;
  appeal_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_response: string | null;
  created_at: string;
  student: {
    display_name: string;
  };
  penalty: {
    penalty_type: string;
    reason: string;
  };
}

export function AdminPenaltiesPanel() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"penalties" | "appeals">("penalties");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (activeTab === "penalties") {
      loadPenalties();
    } else {
      loadAppeals();
    }
  }, [activeTab, filterActive, currentPage]);

  const loadPenalties = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("user_penalties")
        .select(`
          *,
          student:students!user_penalties_student_id_fkey(display_name),
          issuer:profiles(display_name)
        `, { count: "exact" })
        .order("issued_at", { ascending: false })
        .range(from, to);

      if (filterActive === "active") {
        query = query.eq("active", true);
      } else if (filterActive === "expired") {
        query = query.eq("active", false);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setPenalties(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error("Error loading penalties:", error);
      toast.error("Erro ao carregar penalidades");
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("penalty_appeals")
        .select(`
          *,
          student:students(display_name),
          penalty:user_penalties(penalty_type, reason)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filterActive !== "all") {
        query = query.eq("appeal_status", filterActive);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setAppeals(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error("Error loading appeals:", error);
      toast.error("Erro ao carregar recursos");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAbility = async (penaltyId: string) => {
    try {
      const { error } = await supabase
        .from("user_penalties")
        .update({ active: false })
        .eq("id", penaltyId);

      if (error) throw error;

      toast.success("Penalidade revogada com sucesso");
      loadPenalties();
    } catch (error) {
      console.error("Error revoking penalty:", error);
      toast.error("Erro ao revogar penalidade");
    }
  };

  const handleAppealAction = async (appealId: string, action: "approve" | "deny", response: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: appealError } = await supabase
        .from("penalty_appeals")
        .update({
          appeal_status: action === "approve" ? "approved" : "denied",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_response: response,
        })
        .eq("id", appealId);

      if (appealError) throw appealError;

      if (action === "approve") {
        const appeal = appeals.find((a) => a.id === appealId);
        if (appeal) {
          const { error: penaltyError } = await supabase
            .from("user_penalties")
            .update({ active: false })
            .eq("id", appeal.penalty_id);

          if (penaltyError) throw penaltyError;
        }
      }

      toast.success(action === "approve" ? "Recurso aprovado" : "Recurso negado");
      loadAppeals();
    } catch (error) {
      console.error("Error handling appeal:", error);
      toast.error("Erro ao processar recurso");
    }
  };

  const getPenaltyBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      warning: { label: "Aviso", className: "bg-yellow-500", icon: AlertTriangle },
      temp_ban: { label: "Suspensão Temporária", className: "bg-orange-500", icon: Clock },
      perm_ban: { label: "Banimento Permanente", className: "bg-red-500", icon: Ban },
    };

    const config = variants[type] || { label: type, className: "bg-gray-500", icon: Shield };
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getAppealBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      approved: { label: "Aprovado", className: "bg-green-500" },
      denied: { label: "Negado", className: "bg-red-500" },
    };

    const config = variants[status] || { label: status, className: "bg-gray-500" };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestão de Penalidades</h3>
          <p className="text-sm text-muted-foreground">
            {totalItems} {activeTab === "penalties" ? "penalidades" : "recursos"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "penalties" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("penalties");
              setCurrentPage(1);
            }}
          >
            Penalidades
          </Button>
          <Button
            variant={activeTab === "appeals" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("appeals");
              setCurrentPage(1);
            }}
          >
            Recursos
          </Button>
        </div>
      </div>

      <Select
        value={filterActive}
        onValueChange={(value) => {
          setFilterActive(value);
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtrar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {activeTab === "penalties" ? (
            <>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="denied">Negados</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : activeTab === "penalties" ? (
        <>
          {penalties.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma penalidade encontrada
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {penalties.map((penalty) => (
                <Card key={penalty.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {penalty.student?.display_name || "Utilizador"}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(penalty.issued_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                          {penalty.expires_at &&
                            ` • Expira: ${format(new Date(penalty.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        {getPenaltyBadge(penalty.penalty_type)}
                        {penalty.active ? (
                          <Badge className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Motivo:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {penalty.reason}
                      </p>
                    </div>

                    {penalty.issuer && (
                      <p className="text-sm text-muted-foreground">
                        Aplicado por: {penalty.issuer.display_name}
                      </p>
                    )}

                    {penalty.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeAbility(penalty.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Revogar Penalidade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {appeals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum recurso encontrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appeals.map((appeal) => (
                <Card key={appeal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Recurso de {appeal.student?.display_name || "Utilizador"}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(appeal.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </CardDescription>
                      </div>
                      {getAppealBadge(appeal.appeal_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Penalidade Original:</p>
                      <div className="bg-muted p-3 rounded space-y-2">
                        {getPenaltyBadge(appeal.penalty.penalty_type)}
                        <p className="text-sm text-muted-foreground">{appeal.penalty.reason}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Justificação do Recurso:</p>
                      <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                        {appeal.appeal_text}
                      </p>
                    </div>

                    {appeal.admin_response && (
                      <div>
                        <p className="text-sm font-medium mb-2">Resposta do Administrador:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appeal.admin_response}
                        </p>
                      </div>
                    )}

                    {appeal.appeal_status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            const response = prompt("Resposta ao recurso:");
                            if (response) {
                              handleAppealAction(appeal.id, "approve", response);
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const response = prompt("Motivo da recusa:");
                            if (response) {
                              handleAppealAction(appeal.id, "deny", response);
                            }
                          }}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Negar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

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
    </div>
  );
}
