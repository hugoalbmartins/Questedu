import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Loader as Loader2, Crown, Coins, Diamond } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface RedeemGiftCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess?: () => void;
}

export function RedeemGiftCardModal({
  open,
  onOpenChange,
  studentId,
  onSuccess,
}: RedeemGiftCardModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [associationCode, setAssociationCode] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    supabase
      .from("students")
      .select("association_code" as any)
      .eq("id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAssociationCode((data as any).association_code || null);
      });
  }, [studentId]);

  const formatCode = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join("-");
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error("Insere um código");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("redeem_gift_card", {
        code_param: code.trim(),
        student_id_param: studentId,
        association_code_param: associationCode || null,
      } as any);

      if (error) throw error;

      const result = (data as any)[0];

      if (!result.success) {
        toast.error(result.error_message || "Código inválido");
        return;
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const rewards = [];
      if (result.premium_days_granted > 0) {
        rewards.push(`${result.premium_days_granted} dias de Premium`);
      }
      if (result.coins_granted > 0) {
        rewards.push(`${result.coins_granted} moedas`);
      }
      if (result.diamonds_granted > 0) {
        rewards.push(`${result.diamonds_granted} diamantes`);
      }

      toast.success(`Gift card resgatado! Recebeste: ${rewards.join(", ")}`);

      setCode("");
      onOpenChange(false);

      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }
    } catch (error) {
      console.error("Error redeeming gift card:", error);
      toast.error("Erro ao resgatar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gift className="w-6 h-6 text-primary" />
            Resgatar Gift Card
          </DialogTitle>
          <DialogDescription>
            Insere o teu código de gift card para receber recompensas incríveis!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gift-code">Código do Gift Card</Label>
            <Input
              id="gift-code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              maxLength={19}
              className="font-mono text-lg tracking-wider"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Insere o código de 16 caracteres que recebeste
            </p>
          </div>

          {associationCode && (
            <div className="bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
              Código de associação ativo: <strong>{associationCode}</strong> — se o gift card incluir dias Premium, 20% do valor equivalente será contabilizado para a associação.
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-sm mb-2 text-amber-900">
              Possíveis Recompensas:
            </h4>
            <ul className="space-y-1 text-sm text-amber-800">
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                Premium (Trial, Mensal ou Anual)
              </li>
              <li className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-600" />
                Moedas de Ouro
              </li>
              <li className="flex items-center gap-2">
                <Diamond className="w-4 h-4 text-cyan-600" />
                Diamantes
              </li>
            </ul>
          </div>

          <Button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A resgatar...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Resgatar Código
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
