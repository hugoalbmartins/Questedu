import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Plus, Copy, CircleCheck as CheckCircle, Circle as XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GiftCard {
  id: string;
  code: string;
  card_type: string;
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

export function GiftCardsTab() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [newCard, setNewCard] = useState({
    cardType: "premium_month",
    premiumDays: 30,
    coinsValue: 0,
    diamondsValue: 0,
    maxRedemptions: 1,
    expiresInDays: 90,
    notes: "",
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

      setGiftCards(data || []);
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

  const handleCreateCard = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      const expiresAt = newCard.expiresInDays > 0
        ? new Date(Date.now() + newCard.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("gift_cards").insert({
        code,
        card_type: newCard.cardType,
        premium_days: newCard.premiumDays,
        coins_value: newCard.coinsValue,
        diamonds_value: newCard.diamondsValue,
        max_redemptions: newCard.maxRedemptions,
        expires_at: expiresAt,
        created_by: user.id,
        notes: newCard.notes || null,
      });

      if (error) throw error;

      toast.success(`Gift card criado: ${code}`);
      await navigator.clipboard.writeText(code);
      toast.info("Código copiado para clipboard!");

      setNewCard({
        cardType: "premium_month",
        premiumDays: 30,
        coinsValue: 0,
        diamondsValue: 0,
        maxRedemptions: 1,
        expiresInDays: 90,
        notes: "",
      });

      loadGiftCards();
    } catch (error) {
      console.error("Error creating gift card:", error);
      toast.error("Erro ao criar gift card");
    } finally {
      setCreating(false);
    }
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

  const getCardTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      premium_trial: { label: "Trial Premium", className: "bg-blue-500" },
      premium_month: { label: "Premium 1 Mês", className: "bg-purple-500" },
      premium_year: { label: "Premium 1 Ano", className: "bg-amber-500" },
      coins: { label: "Moedas", className: "bg-yellow-500" },
      diamonds: { label: "Diamantes", className: "bg-cyan-500" },
      bundle: { label: "Pacote", className: "bg-green-500" },
    };

    const config = variants[type] || { label: type, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Criar Novo Gift Card
          </CardTitle>
          <CardDescription>
            Cria códigos promocionais para oferecer premium, moedas ou diamantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Gift Card</Label>
              <Select
                value={newCard.cardType}
                onValueChange={(value) => {
                  const premiumDays =
                    value === "premium_trial" ? 7 :
                    value === "premium_month" ? 30 :
                    value === "premium_year" ? 365 : 0;

                  setNewCard({
                    ...newCard,
                    cardType: value,
                    premiumDays,
                    coinsValue: value === "coins" ? 1000 : 0,
                    diamondsValue: value === "diamonds" ? 100 : 0,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium_trial">Trial Premium (7 dias)</SelectItem>
                  <SelectItem value="premium_month">Premium 1 Mês</SelectItem>
                  <SelectItem value="premium_year">Premium 1 Ano</SelectItem>
                  <SelectItem value="coins">Moedas</SelectItem>
                  <SelectItem value="diamonds">Diamantes</SelectItem>
                  <SelectItem value="bundle">Pacote Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Máximo de Usos</Label>
              <Input
                type="number"
                min="1"
                value={newCard.maxRedemptions}
                onChange={(e) =>
                  setNewCard({ ...newCard, maxRedemptions: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Dias Premium</Label>
              <Input
                type="number"
                min="0"
                value={newCard.premiumDays}
                onChange={(e) =>
                  setNewCard({ ...newCard, premiumDays: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label>Moedas</Label>
              <Input
                type="number"
                min="0"
                value={newCard.coinsValue}
                onChange={(e) =>
                  setNewCard({ ...newCard, coinsValue: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label>Diamantes</Label>
              <Input
                type="number"
                min="0"
                value={newCard.diamondsValue}
                onChange={(e) =>
                  setNewCard({ ...newCard, diamondsValue: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div>
            <Label>Expira em (dias)</Label>
            <Input
              type="number"
              min="0"
              value={newCard.expiresInDays}
              onChange={(e) =>
                setNewCard({ ...newCard, expiresInDays: parseInt(e.target.value) || 0 })
              }
              placeholder="0 = sem expiração"
            />
          </div>

          <div>
            <Label>Notas Internas</Label>
            <Textarea
              value={newCard.notes}
              onChange={(e) => setNewCard({ ...newCard, notes: e.target.value })}
              placeholder="Ex: Campanha Natal 2024, Parceria Escola XYZ..."
              rows={2}
            />
          </div>

          <Button onClick={handleCreateCard} disabled={creating} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "A criar..." : "Criar Gift Card"}
          </Button>
        </CardContent>
      </Card>

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
                    <div className="flex items-center gap-2">
                      {getCardTypeBadge(card.card_type)}
                      {card.is_active ? (
                        <Badge className="bg-green-500">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
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
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="font-semibold text-purple-900">{card.premium_days} dias</p>
                        <p className="text-purple-700 text-xs">Premium</p>
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
