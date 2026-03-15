import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Plus, Copy, CircleCheck as CheckCircle, Circle as XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GiftCard {
  id: string;
  code: string;
  card_type: string;
  plan_type: string;
  price_paid: number;
  premium_days: number;
  coins_value: number;
  diamonds_value: number;
  max_redemptions: number;
  current_redemptions: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  notes: string | null;
}

const PLAN_CONFIGS: Record<string, { label: string; price: number; premium_days: number; card_type: string }> = {
  individual_monthly: { label: "Individual Mensal", price: 1.99, premium_days: 30, card_type: "premium_month" },
  family_monthly: { label: "Familiar Mensal", price: 4.99, premium_days: 30, card_type: "premium_month" },
  individual_annual: { label: "Individual Anual", price: 21.49, premium_days: 365, card_type: "premium_year" },
  family_annual: { label: "Familiar Anual", price: 53.88, premium_days: 365, card_type: "premium_year" },
  custom: { label: "Personalizado", price: 0, premium_days: 0, card_type: "bundle" },
};

export function GiftCardsTab() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkCodes, setBulkCodes] = useState<string[]>([]);
  const [lastPlanType, setLastPlanType] = useState("individual_monthly");

  const [newCard, setNewCard] = useState({
    planType: "individual_monthly",
    premiumDays: 30,
    coinsValue: 0,
    diamondsValue: 0,
    maxRedemptions: 1,
    expiresInDays: 365,
    notes: "",
    quantity: 1,
  });

  useEffect(() => {
    loadGiftCards();
  }, []);

  const loadGiftCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiftCards((data || []) as GiftCard[]);
    } catch (error) {
      console.error("Error loading gift cards:", error);
      toast.error("Erro ao carregar gift cards");
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handlePlanTypeChange = (value: string) => {
    const config = PLAN_CONFIGS[value];
    setNewCard(prev => ({
      ...prev,
      planType: value,
      premiumDays: config.premium_days,
      coinsValue: 0,
      diamondsValue: 0,
    }));
  };

  const handleCreateCards = async () => {
    const qty = Math.min(Math.max(1, newCard.quantity), 100);
    setCreating(true);
    setBulkCodes([]);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const config = PLAN_CONFIGS[newCard.planType];
      const expiresAt = newCard.expiresInDays > 0
        ? new Date(Date.now() + newCard.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const records = Array.from({ length: qty }, () => ({
        code: generateCode(),
        card_type: config.card_type,
        plan_type: newCard.planType,
        price_paid: config.price,
        premium_days: newCard.planType === "custom" ? newCard.premiumDays : config.premium_days,
        coins_value: newCard.coinsValue,
        diamonds_value: newCard.diamondsValue,
        max_redemptions: newCard.maxRedemptions,
        expires_at: expiresAt,
        created_by: user.id,
        notes: newCard.notes || null,
      }));

      const { data: inserted, error } = await supabase
        .from("gift_cards")
        .insert(records)
        .select("code");

      if (error) throw error;

      const codes = (inserted || []).map((r: any) => r.code);
      setLastPlanType(newCard.planType);
      setBulkCodes(codes);

      if (qty === 1) {
        await navigator.clipboard.writeText(codes[0]);
        toast.success(`Gift card criado: ${codes[0]} — copiado!`);
      } else {
        toast.success(`${qty} gift cards criados com sucesso!`);
      }

      setNewCard(prev => ({ ...prev, quantity: 1, notes: "" }));
      loadGiftCards();
    } catch (error) {
      console.error("Error creating gift cards:", error);
      toast.error("Erro ao criar gift cards");
    } finally {
      setCreating(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(bulkCodes.join("\n"));
    toast.success("Todos os códigos copiados!");
  };

  const downloadCsv = () => {
    const config = PLAN_CONFIGS[lastPlanType];
    const expiryDate = newCard.expiresInDays > 0
      ? format(new Date(Date.now() + newCard.expiresInDays * 24 * 60 * 60 * 1000), "dd/MM/yyyy")
      : "Sem limite";
    const csv = ["Código,Plano,Valor,Comissão Associação,Validade"].concat(
      bulkCodes.map(c =>
        `${c},${config.label},€${config.price.toFixed(2)},€${(config.price * 0.20).toFixed(2)},${expiryDate}`
      )
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `giftcards-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("gift_cards")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Gift card desativado" : "Gift card ativado");
      loadGiftCards();
    } catch (error) {
      console.error("Error toggling gift card:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const getPlanBadge = (planType: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      individual_monthly: { label: "Individual Mensal", className: "bg-blue-500" },
      family_monthly: { label: "Familiar Mensal", className: "bg-green-500" },
      individual_annual: { label: "Individual Anual", className: "bg-amber-500" },
      family_annual: { label: "Familiar Anual", className: "bg-orange-500" },
      custom: { label: "Personalizado", className: "bg-slate-500" },
    };
    const config = variants[planType] || variants.custom;
    return <Badge className={`${config.className} text-white`}>{config.label}</Badge>;
  };

  const selectedConfig = PLAN_CONFIGS[newCard.planType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Criar Gift Cards
          </CardTitle>
          <CardDescription>
            Gera códigos para oferecer acesso premium. Podes criar um ou vários de uma vez (máx. 100).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Plano</Label>
              <Select value={newCard.planType} onValueChange={handlePlanTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_monthly">Individual Mensal — €1,99</SelectItem>
                  <SelectItem value="family_monthly">Familiar Mensal — €4,99</SelectItem>
                  <SelectItem value="individual_annual">Individual Anual — €21,49</SelectItem>
                  <SelectItem value="family_annual">Familiar Anual — €53,88</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {newCard.planType !== "custom" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Valor: €{selectedConfig.price.toFixed(2)} · Comissão associação: €{(selectedConfig.price * 0.20).toFixed(2)} (20%)
                </p>
              )}
            </div>

            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newCard.quantity}
                onChange={(e) => setNewCard({ ...newCard, quantity: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Máx. 100 por vez</p>
            </div>
          </div>

          {newCard.planType === "custom" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Dias Premium</Label>
                <Input
                  type="number"
                  min="0"
                  value={newCard.premiumDays}
                  onChange={(e) => setNewCard({ ...newCard, premiumDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Moedas</Label>
                <Input
                  type="number"
                  min="0"
                  value={newCard.coinsValue}
                  onChange={(e) => setNewCard({ ...newCard, coinsValue: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Diamantes</Label>
                <Input
                  type="number"
                  min="0"
                  value={newCard.diamondsValue}
                  onChange={(e) => setNewCard({ ...newCard, diamondsValue: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Máximo de Usos por Código</Label>
              <Input
                type="number"
                min="1"
                value={newCard.maxRedemptions}
                onChange={(e) => setNewCard({ ...newCard, maxRedemptions: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Validade (dias após criação)</Label>
              <Input
                type="number"
                min="0"
                value={newCard.expiresInDays}
                onChange={(e) => setNewCard({ ...newCard, expiresInDays: parseInt(e.target.value) || 0 })}
                placeholder="365 = 1 ano"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = sem expiração</p>
            </div>
          </div>

          <div>
            <Label>Notas Internas</Label>
            <Textarea
              value={newCard.notes}
              onChange={(e) => setNewCard({ ...newCard, notes: e.target.value })}
              placeholder="Ex: Campanha Natal 2025, Parceria Escola XYZ..."
              rows={2}
            />
          </div>

          <Button onClick={handleCreateCards} disabled={creating} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {creating
              ? "A criar..."
              : newCard.quantity > 1
                ? `Criar ${newCard.quantity} Gift Cards`
                : "Criar Gift Card"}
          </Button>
        </CardContent>
      </Card>

      {bulkCodes.length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-base">
              {bulkCodes.length} código{bulkCodes.length > 1 ? "s" : ""} gerado{bulkCodes.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-48 overflow-y-auto bg-white rounded border p-3">
              {bulkCodes.map((code) => (
                <div key={code} className="flex items-center justify-between py-1 border-b last:border-0">
                  <code className="font-mono text-sm">{code}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyCode(code)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAllCodes} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCsv} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4">Gift Cards Criados</h3>
        {loading ? (
          <div className="text-center py-8">A carregar...</div>
        ) : giftCards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum gift card criado ainda
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {giftCards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPlanBadge(card.plan_type || "custom")}
                      {card.is_active ? (
                        <Badge className="bg-green-500 text-white">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                      {card.price_paid > 0 && (
                        <Badge variant="outline" className="text-xs">
                          €{Number(card.price_paid).toFixed(2)} · comissão €{(Number(card.price_paid) * 0.20).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {card.current_redemptions} / {card.max_redemptions} usos
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                      {card.code}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyCode(card.code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {card.premium_days > 0 && (
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="font-semibold text-blue-900">{card.premium_days} dias</p>
                        <p className="text-blue-700 text-xs">Premium</p>
                      </div>
                    )}
                    {card.coins_value > 0 && (
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="font-semibold text-yellow-900">{card.coins_value}</p>
                        <p className="text-yellow-700 text-xs">Moedas</p>
                      </div>
                    )}
                    {card.diamonds_value > 0 && (
                      <div className="bg-cyan-50 p-2 rounded">
                        <p className="font-semibold text-cyan-900">{card.diamonds_value}</p>
                        <p className="text-cyan-700 text-xs">Diamantes</p>
                      </div>
                    )}
                  </div>

                  {card.notes && (
                    <p className="text-sm text-muted-foreground italic">{card.notes}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Criado: {format(new Date(card.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {card.expires_at && (
                      <span>
                        Expira: {format(new Date(card.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={card.is_active ? "destructive" : "default"}
                    onClick={() => handleToggleActive(card.id, card.is_active)}
                    className="w-full"
                  >
                    {card.is_active ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
