import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Users, User } from "lucide-react";

interface SubscriptionDiscount {
  id: string;
  student_id: string | null;
  apply_to_all: boolean;
  discount_percent: number;
  target_months: string[];
  applied: boolean;
  notes: string | null;
  created_at: string;
  students?: { display_name: string; nickname: string | null } | null;
}

export const SubscriptionDiscountsTab = () => {
  const [discounts, setDiscounts] = useState<SubscriptionDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [applyToAll, setApplyToAll] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [targetMonths, setTargetMonths] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadDiscounts(); }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-promo-codes", {
      body: { action: "list_discounts" },
    });
    if (data?.discounts) setDiscounts(data.discounts);
    if (error) toast.error("Erro ao carregar descontos.");
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!discountPercent || !targetMonths) {
      toast.error("Percentagem e meses alvo são obrigatórios.");
      return;
    }

    const months = targetMonths.split(",").map(m => m.trim()).filter(Boolean);
    if (months.length === 0) {
      toast.error("Indique pelo menos um mês (formato: 2026-04).");
      return;
    }

    setCreating(true);

    // If not apply_to_all, resolve student from email
    let student_id = null;
    if (!applyToAll && studentEmail) {
      // Look up student by parent email or student email
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", studentEmail.toLowerCase().trim())
        .limit(1);

      if (profiles && profiles.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id")
          .or(`user_id.eq.${profiles[0].user_id},parent_id.eq.${profiles[0].user_id}`)
          .limit(1);

        if (students && students.length > 0) {
          student_id = students[0].id;
        }
      }

      if (!student_id) {
        toast.error("Aluno não encontrado para este email.");
        setCreating(false);
        return;
      }
    }

    const { error, data } = await supabase.functions.invoke("manage-promo-codes", {
      body: {
        action: "create_discount",
        student_id,
        apply_to_all: applyToAll,
        discount_percent: parseInt(discountPercent),
        target_months: months,
        notes: notes || null,
      },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao criar desconto.");
      return;
    }
    toast.success("Desconto criado!");
    setShowCreate(false);
    resetForm();
    loadDiscounts();
  };

  const resetForm = () => {
    setApplyToAll(false); setStudentEmail(""); setDiscountPercent("");
    setTargetMonths(""); setNotes("");
  };

  const deleteDiscount = async (id: string) => {
    const { error } = await supabase.functions.invoke("manage-promo-codes", {
      body: { action: "delete_discount", discount_id: id },
    });
    if (error) toast.error("Erro ao eliminar.");
    else { toast.success("Desconto eliminado."); loadDiscounts(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Descontos em Subscrição Ativa ({discounts.length})</h2>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Criar Desconto
        </Button>
      </div>

      <p className="font-body text-xs text-muted-foreground">
        Descontos aplicados automaticamente na próxima cobrança do Stripe para meses específicos. Pode aplicar a um aluno ou a todos.
      </p>

      {showCreate && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-display text-sm font-bold">Novo Desconto de Subscrição</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-full flex items-center gap-3">
              <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
              <label className="font-body text-sm">Aplicar a todos os utilizadores</label>
            </div>
            {!applyToAll && (
              <div>
                <label className="font-body text-xs font-medium block mb-1">Email do aluno ou encarregado</label>
                <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="user@email.com" />
              </div>
            )}
            <div>
              <label className="font-body text-xs font-medium block mb-1">Desconto (%)</label>
              <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min="1" max="100" placeholder="20" />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Meses alvo (YYYY-MM, separados por vírgula)</label>
              <Input value={targetMonths} onChange={(e) => setTargetMonths(e.target.value)} placeholder="2026-04, 2026-05" />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Notas (opcional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Razão do desconto..." />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? "A criar..." : "Criar Desconto"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-muted-foreground animate-pulse">A carregar...</p>
      ) : discounts.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">Nenhum desconto configurado.</p>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl border border-border">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-2">Alvo</th>
                <th className="p-2">Desconto</th>
                <th className="p-2">Meses</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Notas</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="p-2">
                    {d.apply_to_all ? (
                      <Badge variant="outline" className="text-[10px]"><Users className="w-3 h-3 mr-1" /> Todos</Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{d.students?.nickname || d.students?.display_name || "—"}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-2 font-bold">{d.discount_percent}%</td>
                  <td className="p-2 text-xs">{d.target_months?.join(", ") || "—"}</td>
                  <td className="p-2">
                    {d.applied
                      ? <Badge className="text-[10px] bg-secondary/20 text-secondary border-secondary/30">Aplicado</Badge>
                      : <Badge variant="outline" className="text-[10px]">Pendente</Badge>}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground max-w-[150px] truncate">{d.notes || "—"}</td>
                  <td className="p-2">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDiscount(d.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
