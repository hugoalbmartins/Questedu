import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Sparkles, Users, Zap, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";

interface Child {
  id: string;
  display_name: string;
  is_premium: boolean;
  trial_used: boolean;
  trial_ends_at: string | null;
  coins: number;
  xp: number;
  village_level: number;
}

interface PremiumUpgradeSectionProps {
  children: Child[];
  onUpgradeChild: (child: Child) => void;
  onManageSubscription: () => void;
}

const FREE_LIMITS = [
  "Sem bónus de recompensas",
  "Evolução de aldeia limitada",
  "Sem monumentos exclusivos",
  "Sem desafios de eventos premium",
];

const PREMIUM_BENEFITS = [
  "+15% em todas as recompensas de quiz",
  "Evolução de aldeia ilimitada",
  "Monumentos e edifícios exclusivos",
  "Acesso a torneios e eventos premium",
  "Conteúdo semanal exclusivo",
];

export const PremiumUpgradeSection = ({
  children,
  onUpgradeChild,
  onManageSubscription,
}: PremiumUpgradeSectionProps) => {
  const [activatingTrial, setActivatingTrial] = useState<string | null>(null);

  const premiumChildren = children.filter((c) => c.is_premium);
  const freeChildren = children.filter((c) => !c.is_premium);
  const allPremium = freeChildren.length === 0;

  const handleActivateTrial = async (child: Child) => {
    if (child.trial_used) {
      toast.error("Este educando já utilizou o período de teste gratuito.");
      return;
    }
    setActivatingTrial(child.id);
    try {
      const { error } = await supabase.rpc("activate_trial" as any, {
        p_student_id: child.id,
      });
      if (error) throw error;
      toast.success(`Período de teste de 7 dias ativado para ${child.display_name}!`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ativar período de teste");
    }
    setActivatingTrial(null);
  };

  if (allPremium && children.length > 0) {
    return (
      <div className="rounded-xl border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 p-4">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" />
          <div>
            <p className="font-bold">Todos os educandos em Premium!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Os seus educandos estão a beneficiar de todas as vantagens Premium.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onManageSubscription} className="ml-auto shrink-0">
            Gerir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {freeChildren.length > 0 && (
        <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">Upgrade para Premium</h3>
              <p className="text-xs text-muted-foreground">
                {freeChildren.length === 1
                  ? `${freeChildren[0].display_name} ainda não é Premium`
                  : `${freeChildren.length} educandos ainda sem Premium`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Plano Gratuito</p>
              <ul className="space-y-1">
                {FREE_LIMITS.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 text-red-400">✗</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300/50 p-3">
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </p>
              <ul className="space-y-1">
                {PREMIUM_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-yellow-800 dark:text-yellow-300">
                    <Check className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-lg mb-3">
            <div>
              <p className="font-bold text-sm">€1,99/mês</p>
              <p className="text-xs text-muted-foreground">ou €21,49/ano (10% desconto)</p>
            </div>
            <Badge className="bg-green-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Poupa €2,39
            </Badge>
          </div>

          <div className="space-y-2">
            {freeChildren.map((child) => {
              const isTrialActive =
                child.trial_ends_at && new Date(child.trial_ends_at) > new Date();
              const trialDays = isTrialActive
                ? Math.ceil(
                    (new Date(child.trial_ends_at!).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;

              return (
                <div
                  key={child.id}
                  className="flex items-center gap-3 bg-white/50 dark:bg-black/10 rounded-lg p-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {child.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{child.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Nível {child.village_level} • {child.xp} XP
                    </p>
                    {isTrialActive && (
                      <p className="text-xs text-amber-600 font-semibold">
                        Trial ativo: {trialDays}d restantes
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => onUpgradeChild(child)}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Button>
                    {!child.trial_used && !isTrialActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleActivateTrial(child)}
                        disabled={activatingTrial === child.id}
                      >
                        {activatingTrial === child.id ? "..." : "7 dias grátis"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {children.length >= 2 && freeChildren.length >= 1 && (
        <FamilyPlanCard
          children={children}
          premiumCount={premiumChildren.length}
          onUpgrade={onManageSubscription}
        />
      )}
    </div>
  );
};

interface FamilyPlanCardProps {
  children: Child[];
  premiumCount: number;
  onUpgrade: () => void;
}

const FamilyPlanCard = ({ children, premiumCount, onUpgrade }: FamilyPlanCardProps) => {
  const totalChildren = children.length;
  const individualCost = totalChildren * 1.99;
  const familyPlanCost = 4.99;
  const savings = (individualCost - familyPlanCost).toFixed(2);

  return (
    <div className="rounded-xl border-2 border-blue-400/50 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm">Plano Familiar</h4>
            <Badge className="bg-blue-500 text-white text-[10px]">Novo</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Todos os {totalChildren} educandos por €{familyPlanCost}/mês
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground line-through">
                €{individualCost.toFixed(2)}/mês
              </p>
              <p className="text-sm font-bold text-blue-600">€{familyPlanCost}/mês</p>
            </div>
            <div className="flex-1">
              <Badge className="bg-green-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Poupa €{savings}/mês
              </Badge>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
              <Check className="w-3 h-3 text-green-500" />
              Até 4 educandos
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
              <Check className="w-3 h-3 text-green-500" />
              Todos os benefícios Premium
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
              <Check className="w-3 h-3 text-green-500" />
              Gestão centralizada
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
              <Check className="w-3 h-3 text-green-500" />
              Relatórios detalhados
            </div>
          </div>
        </div>
      </div>
      <Button
        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
        onClick={onUpgrade}
      >
        <Gift className="w-4 h-4 mr-2" />
        Ativar Plano Familiar
      </Button>
    </div>
  );
};

interface ChildProgressHighlightProps {
  child: Child;
  isPremium: boolean;
}

export const ChildProgressHighlight = ({ child, isPremium }: ChildProgressHighlightProps) => {
  const weeklyCoinsEstimate = Math.round(child.coins * 0.1);
  const premiumBonus = Math.round(weeklyCoinsEstimate * 0.15);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {child.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold">{child.display_name}</p>
          <p className="text-xs text-muted-foreground">Nível {child.village_level}</p>
        </div>
        {isPremium ? (
          <Badge className="ml-auto bg-yellow-500 text-white text-[10px]">
            <Crown className="w-2.5 h-2.5 mr-0.5" /> Premium
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-auto text-[10px]">
            Gratuito
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
          <p className="text-xs text-muted-foreground">Moedas</p>
          <p className="text-sm font-bold text-yellow-600">🪙{child.coins}</p>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
          <p className="text-xs text-muted-foreground">XP Total</p>
          <p className="text-sm font-bold text-green-600">⭐{child.xp}</p>
        </div>
        <div className="text-center p-2 bg-primary/5 rounded">
          <p className="text-xs text-muted-foreground">Nível</p>
          <p className="text-sm font-bold text-primary">Nv{child.village_level}</p>
        </div>
      </div>
      {!isPremium && premiumBonus > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5">
          <Zap className="w-3 h-3 flex-shrink-0" />
          <span>
            Com Premium, ganharia aproximadamente +{premiumBonus} moedas/semana a mais.
          </span>
        </div>
      )}
    </div>
  );
};
