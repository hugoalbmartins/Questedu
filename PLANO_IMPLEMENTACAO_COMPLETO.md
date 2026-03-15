# 🎯 PLANO DE IMPLEMENTAÇÃO COMPLETO
## Vila dos Sabichões - Roadmap Técnico Detalhado

**Data de Criação**: 15 de Março de 2026
**Última Atualização**: 15 de Março de 2026
**Versão**: 2.0

---

## 📊 VISÃO GERAL DO PROJETO

### Status Atual
- ✅ **Base do Jogo**: 100% implementada
- ✅ **Sistema de Quiz**: Completo com 1000+ perguntas
- ✅ **Vila Isométrica**: Funcional com 15+ edifícios
- ✅ **Autenticação**: Supabase Auth completo
- ✅ **Controlo Parental**: Dashboard implementado
- ✅ **Segurança**: Chat moderado, filtros, denúncias
- ✅ **Acessibilidade**: Text-to-Speech, alto contraste
- ✅ **Monetização**: Stripe integrado (Premium €4.99/mês)
- ✅ **Documentação Legal**: Termos, Privacidade, Cookies

### Próximos Objetivos (Q2 2026)
1. **Melhorar Retenção**: D7 de 45% → 65%
2. **Aumentar Conversão**: Free→Premium de 3% → 8%
3. **Expandir Conteúdo**: +500 questões novas
4. **Lançar Mobile Apps**: iOS e Android
5. **B2B**: Fechar 10 escolas parceiras

---

## 🚀 FASE 2A - SPRINT 1 (Semana 1-2)
### Tema: Monetização & Premium Features

---

### 2A.1 - Sistema de Trial Premium (7 Dias) 🔴 CRÍTICO

#### Objetivo
Permitir que novos utilizadores testem Premium gratuitamente por 7 dias para aumentar conversão.

#### Base de Dados
```sql
-- Migration: add_premium_trial_system.sql

-- Adicionar campos à tabela subscriptions
ALTER TABLE subscriptions
ADD COLUMN trial_start_date timestamptz,
ADD COLUMN trial_end_date timestamptz,
ADD COLUMN trial_used boolean DEFAULT false,
ADD COLUMN trial_converted boolean DEFAULT false;

-- Índice para query de trials a expirar
CREATE INDEX idx_subscriptions_trial_end
ON subscriptions(trial_end_date)
WHERE status = 'trialing';

-- Função para ativar trial automaticamente
CREATE OR REPLACE FUNCTION activate_premium_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para estudantes que nunca usaram trial
  IF NEW.role = 'student' AND NEW.trial_used = false THEN
    UPDATE subscriptions
    SET
      status = 'trialing',
      trial_start_date = now(),
      trial_end_date = now() + interval '7 days',
      trial_used = true
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger em users para ativar trial
CREATE TRIGGER on_user_created_activate_trial
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION activate_premium_trial();

-- Função para verificar trials expirados
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'inactive'
  WHERE status = 'trialing'
  AND trial_end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Edge Function
```typescript
// supabase/functions/check-trial-expiration/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar trials que expiram em 2 dias
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    const { data: expiringTrials } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users!inner(email, display_name)
      `)
      .eq('status', 'trialing')
      .lte('trial_end_date', twoDaysFromNow.toISOString())
      .is('trial_converted', false)

    // Enviar emails de lembrete
    for (const trial of expiringTrials || []) {
      await supabase.functions.invoke('send-email', {
        body: {
          to: trial.users.email,
          subject: '⏰ O teu Premium gratuito acaba em 2 dias!',
          html: `
            <h2>Olá ${trial.users.display_name}!</h2>
            <p>O teu período de teste Premium gratuito acaba em 2 dias.</p>
            <p>Não percas acesso a:</p>
            <ul>
              <li>✅ Quizzes ilimitados</li>
              <li>✅ Sem anúncios</li>
              <li>✅ Relatórios avançados</li>
              <li>✅ Conteúdo exclusivo</li>
            </ul>
            <a href="https://viladossabichoes.pt/game">Continuar Premium →</a>
          `
        }
      })
    }

    // Verificar e desativar trials expirados
    await supabase.rpc('check_expired_trials')

    return new Response(
      JSON.stringify({
        success: true,
        notified: expiringTrials?.length || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

#### Frontend - TrialBanner Component
```typescript
// src/components/game/TrialBanner.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";

export const TrialBanner = () => {
  const [trialInfo, setTrialInfo] = useState<any>(null);

  useEffect(() => {
    fetchTrialInfo();
  }, []);

  const fetchTrialInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'trialing')
      .maybeSingle();

    if (data) setTrialInfo(data);
  };

  if (!trialInfo) return null;

  const daysLeft = differenceInDays(
    new Date(trialInfo.trial_end_date),
    new Date()
  );
  const hoursLeft = differenceInHours(
    new Date(trialInfo.trial_end_date),
    new Date()
  );

  return (
    <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          <div>
            <h3 className="font-bold text-lg">Premium Gratuito Ativo!</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {daysLeft > 0
                ? `${daysLeft} dias restantes`
                : `${hoursLeft} horas restantes`}
            </p>
          </div>
        </div>
        <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          Continuar Premium
        </Button>
      </div>
    </Card>
  );
};
```

#### Cron Job (Supabase)
```sql
-- Setup cron para verificar trials diariamente às 9h
SELECT cron.schedule(
  'check-trial-expiration',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_ID].supabase.co/functions/v1/check-trial-expiration',
    headers := '{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);
```

#### KPIs a Monitorizar
- Trial activation rate: >95%
- Trial→Paid conversion: >25%
- Email open rate (expiring): >40%
- Days active during trial: média >5

---

### 2A.2 - Plano Familiar €12.99/mês (até 5 filhos) 🔴 CRÍTICO

#### Objetivo
Maximizar LTV de famílias com múltiplos filhos oferecendo plano mais económico.

#### Stripe Setup
```typescript
// Script para criar produto no Stripe
// scripts/create-family-plan.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createFamilyPlan() {
  // Criar produto
  const product = await stripe.products.create({
    name: 'Premium Familiar',
    description: 'Acesso Premium para até 5 filhos',
    metadata: {
      type: 'family',
      max_students: '5'
    }
  });

  // Criar preço mensal
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1299, // €12.99
    currency: 'eur',
    recurring: {
      interval: 'month'
    },
    metadata: {
      plan_type: 'family'
    }
  });

  console.log('Family Plan Created:');
  console.log('Product ID:', product.id);
  console.log('Price ID:', price.id);
}

createFamilyPlan();
```

#### Base de Dados
```sql
-- Migration: add_family_plan_subscription.sql

-- Adicionar tipo de plano
ALTER TABLE subscriptions
ADD COLUMN plan_type text CHECK (plan_type IN ('individual', 'family')) DEFAULT 'individual',
ADD COLUMN family_group_id uuid REFERENCES family_groups(id);

-- Criar tabela de grupos familiares
CREATE TABLE family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id),
  max_students integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de membros do grupo familiar
CREATE TABLE family_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid REFERENCES family_groups(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(family_group_id, student_id)
);

-- RLS
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own family group"
  ON family_groups FOR ALL
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can manage family members"
  ON family_group_members FOR ALL
  TO authenticated
  USING (
    family_group_id IN (
      SELECT id FROM family_groups WHERE parent_id = auth.uid()
    )
  );

-- Função para verificar se estudante tem acesso premium via família
CREATE OR REPLACE FUNCTION has_family_premium(student_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM family_group_members fgm
    JOIN family_groups fg ON fg.id = fgm.family_group_id
    JOIN subscriptions s ON s.id = fg.subscription_id
    WHERE fgm.student_id = student_user_id
    AND s.status = 'active'
    AND s.plan_type = 'family'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Frontend - FamilyPlanModal
```typescript
// src/components/game/FamilyPlanModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Check, X } from "lucide-react";

interface FamilyPlanModalProps {
  open: boolean;
  onClose: () => void;
}

export const FamilyPlanModal = ({ open, onClose }: FamilyPlanModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    // Criar checkout session para plano familiar
    const response = await fetch('/functions/v1/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_family_plan_id', // From Stripe
        planType: 'family'
      })
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-8 h-8 text-blue-500" />
            Plano Familiar Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
            <p className="text-5xl font-bold">€12.99</p>
            <p className="text-muted-foreground">por mês</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">
              Até 5 filhos · Economia de 48%
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                Incluído
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Até 5 estudantes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Quizzes ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Sem anúncios
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Relatórios avançados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Conteúdo exclusivo
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold">Comparação</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>Premium Individual</span>
                  <span className="font-bold">€4.99</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded opacity-60">
                  <span>x 5 filhos</span>
                  <span className="font-bold line-through">€24.95</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-950 rounded">
                  <span className="font-bold">Plano Familiar</span>
                  <span className="font-bold text-green-600">€12.99</span>
                </div>
                <p className="text-center text-green-600 font-bold">
                  Poupa €11.96/mês! 🎉
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubscribe}
              className="flex-1"
              size="lg"
              disabled={loading}
            >
              {loading ? "A processar..." : "Subscrever Plano Familiar"}
            </Button>
            <Button onClick={onClose} variant="outline" size="lg">
              Cancelar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Cancela quando quiseres. Sem compromisso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### Integração no Parent Dashboard
```typescript
// Adicionar botão no ParentDashboard.tsx
<Button
  onClick={() => setShowFamilyPlan(true)}
  className="gap-2"
>
  <Users className="w-4 h-4" />
  Upgrade para Plano Familiar
</Button>
```

#### KPIs a Monitorizar
- Individual→Family upgrade rate: >15%
- Family plan adoption: >30% of parents with 2+ kids
- LTV increase: +120%
- Churn rate: <3% (vs 5% individual)

---

### 2A.3 - Gift Cards & Códigos de Presente 🟡 IMPORTANTE

#### Objetivo
Novo canal de aquisição e presente educativo para aniversários/Natal.

#### Base de Dados
```sql
-- Migration: add_gift_cards_system.sql

CREATE TABLE gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  duration_months integer NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  batch_id text,
  notes text
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_active ON gift_cards(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can redeem gift cards"
  ON gift_cards FOR SELECT
  TO authenticated
  USING (is_active = true AND redeemed_at IS NULL);

CREATE POLICY "Admins can create gift cards"
  ON gift_cards FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Função para gerar código único
CREATE OR REPLACE FUNCTION generate_gift_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i % 4 = 0 AND i < 12 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para resgatar gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(gift_code text)
RETURNS jsonb AS $$
DECLARE
  card gift_cards;
  user_id uuid := auth.uid();
BEGIN
  -- Buscar gift card
  SELECT * INTO card
  FROM gift_cards
  WHERE code = UPPER(gift_code)
  AND is_active = true
  AND redeemed_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou já utilizado');
  END IF;

  -- Marcar como resgatado
  UPDATE gift_cards
  SET redeemed_at = now(),
      redeemed_by = user_id
  WHERE id = card.id;

  -- Estender subscrição
  UPDATE subscriptions
  SET
    end_date = COALESCE(end_date, now()) + (card.duration_months || ' months')::interval,
    status = 'active'
  WHERE user_id = user_id;

  RETURN jsonb_build_object(
    'success', true,
    'months_added', card.duration_months,
    'new_end_date', (SELECT end_date FROM subscriptions WHERE user_id = user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Admin Component - Gift Card Generator
```typescript
// src/components/admin/GiftCardsTab.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Gift, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const GiftCardsTab = () => {
  const [quantity, setQuantity] = useState(10);
  const [duration, setDuration] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const generateCodes = async () => {
    setGenerating(true);
    const codes = [];

    for (let i = 0; i < quantity; i++) {
      // Gerar código
      const { data } = await supabase.rpc('generate_gift_code');

      // Inserir na base de dados
      await supabase.from('gift_cards').insert({
        code: data,
        duration_months: duration,
        batch_id: `BATCH_${Date.now()}`
      });

      codes.push(data);
    }

    setGeneratedCodes(codes);
    setGenerating(false);
  };

  const downloadCSV = () => {
    const csv = ['Código,Duração (meses),Valor']
      .concat(generatedCodes.map(code =>
        `${code},${duration},€${duration === 1 ? 4.99 : duration * 4.49}`
      ))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift-cards-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Gerar Gift Cards
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-semibold">Quantidade</label>
            <Input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              min={1}
              max={1000}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Duração</label>
            <Select value={duration.toString()} onValueChange={v => setDuration(Number(v))}>
              <option value="1">1 mês (€4.99)</option>
              <option value="3">3 meses (€13.47)</option>
              <option value="6">6 meses (€26.94)</option>
              <option value="12">12 ano (€53.88)</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={generateCodes} disabled={generating} className="w-full">
              {generating ? "A gerar..." : "Gerar Códigos"}
            </Button>
          </div>
        </div>

        {generatedCodes.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold">
                {generatedCodes.length} códigos gerados
              </p>
              <Button onClick={downloadCSV} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 bg-muted p-3 rounded font-mono text-sm">
              {generatedCodes.map((code, i) => (
                <div key={i} className="flex justify-between">
                  <span>{code}</span>
                  <span className="text-muted-foreground">{duration} mês(es)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
```

#### Frontend - Redeem Modal
```typescript
// src/components/game/RedeemGiftCardModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RedeemGiftCardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RedeemGiftCardModal = ({ open, onClose, onSuccess }: RedeemGiftCardModalProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code || code.length < 10) {
      toast.error("Código inválido");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc('redeem_gift_card', {
      gift_code: code.toUpperCase()
    });

    setLoading(false);

    if (error || !data?.success) {
      toast.error(data?.error || "Erro ao resgatar código");
      return;
    }

    toast.success(`${data.months_added} mês(es) de Premium adicionados! 🎉`);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-500" />
            Resgatar Gift Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 p-6 rounded-lg text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-pink-500" />
            <h3 className="font-bold text-lg mb-2">Tens um código de presente?</h3>
            <p className="text-sm text-muted-foreground">
              Insere o código para adicionar tempo Premium à tua conta!
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Código do Gift Card
            </label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={14}
              className="text-center text-lg font-mono tracking-wider"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: XXXX-XXXX-XXXX
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleRedeem} className="flex-1" disabled={loading}>
              {loading ? "A verificar..." : "Resgatar"}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### Parcerias B2B
```markdown
### Estratégia de Distribuição Gift Cards

1. **Livrarias**
   - FNAC, Bertrand, Wook
   - Comissão: 20% do valor
   - Display físico no balcão

2. **Escolas Privadas**
   - Prémios para melhores alunos
   - Compra em bulk com desconto 15%

3. **Pediatras/Dentistas**
   - Gift cards como "prenda" para crianças
   - Branding co-marketing

4. **Online**
   - Venda directa no site
   - Amazon (PT marketplace)
   - PayShop / CTT
```

#### KPIs
- Gift card redemption rate: >80%
- Average gift value: >€20
- B2B partnerships: 10+ em 6 meses
- Gift card revenue: 10% of total

---

## 🚀 FASE 2B - SPRINT 2 (Semana 3-4)
### Tema: Segurança & Moderação Avançada

---

### 2B.1 - Admin Dashboard para Moderação 🔴 CRÍTICO

#### Objetivo
Interface completa para admins gerirem denúncias, penalidades e moderação.

#### Frontend Components

##### AdminReportsPanel.tsx
```typescript
// src/components/admin/AdminReportsPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Eye, Check, X, Clock } from "lucide-react";

interface Report {
  id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  reporter: { display_name: string };
  reported_user: { display_name: string };
  message: { content: string };
}

export const AdminReportsPanel = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('message_reports')
      .select(`
        *,
        reporter:reporter_id(display_name),
        reported_user:reported_user_id(display_name),
        message:message_id(content)
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false });

    setReports(data || []);
  };

  const handleAction = async (reportId: string, action: string) => {
    await supabase
      .from('message_reports')
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        admin_notes: adminNotes
      })
      .eq('id', reportId);

    // Se ação tomada, criar penalidade
    if (action === 'action_taken') {
      const report = reports.find(r => r.id === reportId);
      await supabase.from('user_penalties').insert({
        user_id: report?.reported_user.id,
        type: 'warning',
        reason: `Denúncia: ${report?.reason}`,
        admin_notes: adminNotes
      });
    }

    fetchReports();
    setSelectedReport(null);
    setAdminNotes("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Denúncias de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {['pending', 'reviewed', 'action_taken', 'dismissed'].map(status => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
                size="sm"
              >
                {status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                {status === 'reviewed' && <Eye className="w-4 h-4 mr-1" />}
                {status === 'action_taken' && <Check className="w-4 h-4 mr-1" />}
                {status === 'dismissed' && <X className="w-4 h-4 mr-1" />}
                {status}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {reports.map(report => (
              <Card key={report.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-sm">
                        {report.reporter.display_name} denunciou {report.reported_user.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <Badge variant="destructive">{report.reason}</Badge>
                  </div>

                  <div className="bg-muted p-3 rounded mb-3">
                    <p className="text-sm font-mono">{report.message.content}</p>
                  </div>

                  {report.details && (
                    <p className="text-sm mb-3">
                      <strong>Detalhes:</strong> {report.details}
                    </p>
                  )}

                  {filter === 'pending' && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Notas do administrador..."
                        value={selectedReport?.id === report.id ? adminNotes : ''}
                        onChange={e => {
                          setSelectedReport(report);
                          setAdminNotes(e.target.value);
                        }}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(report.id, 'action_taken')}
                          className="bg-red-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Tomar Ação
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(report.id, 'dismissed')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Dispensar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {reports.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma denúncia {filter}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

##### AdminPenaltiesPanel.tsx
```typescript
// src/components/admin/AdminPenaltiesPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, UserX, Clock } from "lucide-react";

export const AdminPenaltiesPanel = () => {
  const [penalties, setPenalties] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [penaltyType, setPenaltyType] = useState("warning");
  const [duration, setDuration] = useState(24); // horas

  const createPenalty = async () => {
    if (!selectedUser) return;

    await supabase.from('user_penalties').insert({
      user_id: selectedUser,
      type: penaltyType,
      duration_hours: penaltyType !== 'warning' ? duration : null,
      reason: "Manual - Admin",
      expires_at: penaltyType !== 'warning'
        ? new Date(Date.now() + duration * 3600000).toISOString()
        : null
    });

    fetchPenalties();
  };

  const fetchPenalties = async () => {
    const { data } = await supabase
      .from('user_penalties')
      .select(`
        *,
        user:user_id(display_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    setPenalties(data || []);
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Criar Penalidade Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="ID do utilizador"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            />
            <Select value={penaltyType} onValueChange={setPenaltyType}>
              <option value="warning">Aviso</option>
              <option value="temp_ban">Suspensão Temporária</option>
              <option value="perm_ban">Banimento Permanente</option>
            </Select>
            {penaltyType !== 'warning' && (
              <Input
                type="number"
                placeholder="Duração (horas)"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              />
            )}
            <Button onClick={createPenalty}>
              Aplicar Penalidade
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Penalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {penalties.map((penalty: any) => (
              <Card key={penalty.id}>
                <CardContent className="pt-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{penalty.user.display_name}</p>
                    <p className="text-xs text-muted-foreground">{penalty.user.email}</p>
                    <p className="text-sm mt-1">{penalty.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      penalty.type === 'warning' ? 'default' :
                      penalty.type === 'temp_ban' ? 'destructive' :
                      'outline'
                    }>
                      {penalty.type}
                    </Badge>
                    {penalty.expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expira: {new Date(penalty.expires_at).toLocaleString('pt-PT')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### Integração no Admin Dashboard
```typescript
// Adicionar tabs no AdminDashboard.tsx
import { AdminReportsPanel } from "@/components/admin/AdminReportsPanel";
import { AdminPenaltiesPanel } from "@/components/admin/AdminPenaltiesPanel";

// No componente
<Tabs>
  <TabsList>
    <TabsTrigger value="reports">Denúncias</TabsTrigger>
    <TabsTrigger value="penalties">Penalidades</TabsTrigger>
    <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
  </TabsList>

  <TabsContent value="reports">
    <AdminReportsPanel />
  </TabsContent>

  <TabsContent value="penalties">
    <AdminPenaltiesPanel />
  </TabsContent>

  <TabsContent value="gift-cards">
    <GiftCardsTab />
  </TabsContent>
</Tabs>
```

---

### 2B.2 - Sistema de Penalidades Automáticas 🔴 CRÍTICO

#### Base de Dados
```sql
-- Migration: add_moderation_and_penalties_system.sql

CREATE TABLE user_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('warning', 'temp_ban', 'perm_ban')) NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  duration_hours integer,
  created_by uuid REFERENCES users(id),
  admin_notes text,
  is_active boolean DEFAULT true
);

CREATE INDEX idx_user_penalties_user ON user_penalties(user_id);
CREATE INDEX idx_user_penalties_active ON user_penalties(is_active, expires_at);

-- RLS
ALTER TABLE user_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage penalties"
  ON user_penalties FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Função para contar strikes
CREATE OR REPLACE FUNCTION count_user_strikes(check_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_penalties
    WHERE user_id = check_user_id
    AND type = 'warning'
    AND created_at > now() - interval '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se user está banido
CREATE OR REPLACE FUNCTION is_user_banned(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_penalties
    WHERE user_id = check_user_id
    AND type IN ('temp_ban', 'perm_ban')
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função automática de penalidade baseada em strikes
CREATE OR REPLACE FUNCTION auto_penalize_user()
RETURNS TRIGGER AS $$
DECLARE
  strike_count integer;
BEGIN
  -- Apenas para ações tomadas
  IF NEW.status = 'action_taken' AND OLD.status = 'pending' THEN
    -- Criar warning
    INSERT INTO user_penalties (user_id, type, reason, created_by)
    VALUES (NEW.reported_user_id, 'warning', 'Denúncia verificada: ' || NEW.reason, NEW.reviewed_by);

    -- Contar strikes
    strike_count := count_user_strikes(NEW.reported_user_id);

    -- 3 strikes = suspensão temporária 24h
    IF strike_count >= 3 THEN
      INSERT INTO user_penalties (
        user_id,
        type,
        reason,
        duration_hours,
        expires_at,
        created_by
      ) VALUES (
        NEW.reported_user_id,
        'temp_ban',
        '3 strikes acumulados',
        24,
        now() + interval '24 hours',
        NEW.reviewed_by
      );

      -- Notificar pais
      PERFORM notify_parent_of_penalty(NEW.reported_user_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_action_taken
AFTER UPDATE ON message_reports
FOR EACH ROW
EXECUTE FUNCTION auto_penalize_user();
```

#### Frontend - Penalty Check Hook
```typescript
// src/hooks/usePenaltyCheck.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const usePenaltyCheck = () => {
  const [isBanned, setIsBanned] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkPenalties();
  }, []);

  const checkPenalties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: banned } = await supabase
      .rpc('is_user_banned', { check_user_id: user.id });

    if (banned) {
      const { data: penalty } = await supabase
        .from('user_penalties')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('type.eq.temp_ban,type.eq.perm_ban')
        .maybeSingle();

      setIsBanned(true);
      setPenaltyInfo(penalty);

      if (penalty?.type === 'perm_ban') {
        toast.error("A tua conta foi banida permanentemente.");
        await supabase.auth.signOut();
        navigate('/login');
      } else if (penalty?.type === 'temp_ban') {
        const expiresAt = new Date(penalty.expires_at);
        const hoursLeft = Math.ceil(
          (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        toast.error(`Conta suspensa temporariamente. ${hoursLeft}h restantes.`);
      }
    }
  };

  return { isBanned, penaltyInfo };
};
```

---

## 📊 CRONOGRAMA DETALHADO

### Semana 1
- [ ] Dia 1-2: Setup Trial Premium (DB + Edge Function)
- [ ] Dia 3-4: Frontend Trial (Banner, Modal, Notifications)
- [ ] Dia 5: Testing Trial System

### Semana 2
- [ ] Dia 1-2: Plano Familiar (Stripe + DB)
- [ ] Dia 3-4: Frontend Plano Familiar
- [ ] Dia 5: Gift Cards (DB + Admin)

### Semana 3
- [ ] Dia 1-2: Gift Cards (Frontend Redeem)
- [ ] Dia 3-4: Admin Reports Panel
- [ ] Dia 5: Testing Moderação

### Semana 4
- [ ] Dia 1-2: Admin Penalties System
- [ ] Dia 3-4: Auto Penalties + Notifications
- [ ] Dia 5: Buffer + QA

---

## 🎯 PRIORIDADES ABSOLUTAS

### Top 5 (Fazer Esta Semana)
1. ✅ **Página de Login Melhorada** - FEITO
2. ✅ **Documentação Legal** - FEITO
3. **Trial Premium 7 dias** - COMEÇAR AMANHÃ
4. **Admin Reports Dashboard** - URGENTE
5. **Plano Familiar** - ALTA CONVERSÃO

### Top 10 (Próximas 2 Semanas)
6. Gift Cards System
7. Sistema Penalidades Automáticas
8. Explicações em Questões (batch 1)
9. Mini-jogo: Memory
10. Analytics Setup

---

## 📈 MÉTRICAS DE SUCESSO

### Segurança
- Tempo resolução denúncias: <24h
- False positive rate: <10%
- Parent satisfaction: >4.5/5

### Monetização
- Trial activation: >95%
- Trial→Paid: >25%
- Family plan adoption: >30%
- Gift card revenue: +10%

### Engagement
- D7 Retention: 45% → 65%
- Daily active sessions: +20%
- Average session time: +15%

---

**Status**: 📋 **PLANEAMENTO COMPLETO**
**Próximo Passo**: Implementar Trial Premium
**Responsável**: Equipa de Desenvolvimento
**Deadline Sprint 1**: 29 de Março de 2026