# Guia Rápido - Integração Stripe

## Status: ✅ PRONTO PARA USAR

---

## 🚀 Como Usar

### 1. Para Criar um Pagamento (Frontend)

```typescript
// Exemplo: Botão de Premium
const handleUpgrade = async (plan: 'monthly' | 'annual') => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    toast.error('Por favor, faça login primeiro');
    return;
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: currentStudent.id,
        plan: plan, // 'monthly' ou 'annual'
        promoCode: promoCodeInput, // opcional
        associationCode: associationCode // opcional
      })
    }
  );

  const { url, error } = await response.json();

  if (error) {
    toast.error(error);
    return;
  }

  // Redirecionar para checkout do Stripe
  window.location.href = url;
};
```

### 2. Para Verificar Status Premium

```typescript
// Verificar se estudante tem premium ativo
const checkPremiumStatus = async (studentId: string) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-subscription`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId })
    }
  );

  const data = await response.json();

  return {
    isPremium: data.subscribed,
    expiresAt: data.subscription_end,
    planType: data.subscription_type // 'monthly', 'annual', ou 'admin_grant'
  };
};
```

### 3. Para Abrir Portal do Cliente

```typescript
// Botão "Gerir Subscrição"
const openCustomerPortal = async () => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const { url } = await response.json();
  window.location.href = url; // Redirecionar para portal Stripe
};
```

---

## 💳 Métodos de Pagamento

O Stripe irá mostrar automaticamente:
- 💳 Cartão de Crédito/Débito
- 🏦 Multibanco
- 📱 MB WAY

Não é necessário configurar nada adicional.

---

## 🎟️ Códigos Promocionais

### Criar Código (Admin - SQL)

```sql
-- Código com 20% desconto por 3 meses
INSERT INTO promo_codes (
  code,
  promo_type,
  discount_percent,
  discount_amount,
  discount_duration_months,
  max_uses,
  is_active,
  expires_at
) VALUES (
  'WELCOME20',
  'discount',
  20,
  0,
  3,
  100,
  true,
  '2026-12-31'
);

-- Código com €5 desconto único
INSERT INTO promo_codes (
  code,
  promo_type,
  discount_percent,
  discount_amount,
  discount_duration_months,
  max_uses,
  is_active,
  expires_at
) VALUES (
  'SAVE5',
  'discount',
  0,
  5.00,
  0,
  50,
  true,
  '2026-06-30'
);
```

### Usar Código (Frontend)

```typescript
// No formulário de checkout
<Input
  placeholder="Código promocional (opcional)"
  value={promoCode}
  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
/>

// Ao criar checkout, passar o código
body: JSON.stringify({
  studentId: student.id,
  plan: 'monthly',
  promoCode: promoCode // será validado automaticamente
})
```

---

## 🔧 Configuração Webhook (OBRIGATÓRIO)

### Passo a Passo

1. **Ir para Stripe Dashboard**
   ```
   https://dashboard.stripe.com/webhooks
   ```

2. **Clicar em "Add endpoint"**

3. **Configurar**:
   - **Endpoint URL**:
     ```
     https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook
     ```

   - **Events to send**:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`

4. **Copiar Signing Secret**
   - Após criar, copiar o `whsec_...`
   - Verificar se está configurado como `STRIPE_WEBHOOK_SECRET` no Supabase

---

## 🧪 Testar com Cartões de Teste

### Cartões Stripe para Testes

```
✅ Sucesso:
   4242 4242 4242 4242

✅ Requer 3D Secure:
   4000 0025 0000 3155

❌ Recusado:
   4000 0000 0000 9995

CVV: qualquer 3 dígitos (ex: 123)
Data: qualquer data futura (ex: 12/30)
Nome: qualquer nome
```

### Testar MB WAY

No ambiente de teste do Stripe, o MB WAY aparecerá como opção mas não processará pagamento real.

---

## 📊 Monitorar Pagamentos

### Stripe Dashboard
- **Pagamentos**: https://dashboard.stripe.com/payments
- **Clientes**: https://dashboard.stripe.com/customers
- **Subscrições**: https://dashboard.stripe.com/subscriptions
- **Webhooks**: https://dashboard.stripe.com/webhooks

### Supabase Dashboard
- **Logs**: Ver logs das edge functions
- **Database**: Tabelas `students`, `promo_codes`, `association_donations`

---

## 🎯 Casos de Uso Comuns

### 1. Estudante Faz Upgrade para Premium

```typescript
// 1. Utilizador clica "Tornar-me Premium"
// 2. Seleciona plano (mensal/anual)
// 3. Opcionalmente adiciona código promocional
// 4. Clica "Continuar para Pagamento"
// 5. Sistema cria checkout session
// 6. Redireciona para Stripe
// 7. Stripe processa pagamento
// 8. Webhook ativa premium automaticamente
// 9. Utilizador recebe notificação in-app
// 10. Premium está ativo!
```

### 2. Estudante Cancela Subscrição

```typescript
// 1. Utilizador acede ao portal do cliente
// 2. Clica "Gerir Subscrição"
// 3. No Stripe, clica "Cancelar subscrição"
// 4. Webhook remove premium na data de expiração
// 5. Utilizador recebe notificação
```

### 3. Associação de Pais Recebe Doação

```typescript
// 1. Estudante adiciona código de associação
// 2. Faz upgrade para premium
// 3. Sistema automaticamente calcula 10% do valor
// 4. Regista doação na tabela association_donations
// 5. Atualiza total_raised da associação
// 6. Associação vê total no dashboard
```

---

## ⚠️ Importante

### Ambiente Teste vs Produção

**Modo Teste** (Atual):
- Chaves: `sk_test_...` e `pk_test_...`
- Webhooks: Endpoint de teste
- Pagamentos: Não processados realmente
- Perfeito para desenvolvimento

**Modo Produção** (Quando Lançar):
- Chaves: `sk_live_...` e `pk_live_...`
- Webhooks: Endpoint de produção
- Pagamentos: Processados realmente
- Requer KYC completo no Stripe

### Mudança para Produção

```bash
# 1. No Stripe Dashboard, obter chaves live
# 2. Atualizar secrets no Supabase:
# - STRIPE_SECRET_KEY = sk_live_...
# - STRIPE_WEBHOOK_SECRET = whsec_... (do webhook de produção)

# 3. Criar novo webhook endpoint de produção
# 4. Verificar Price IDs ainda válidos
# 5. Testar com pagamento real pequeno
```

---

## 🆘 Troubleshooting

### Erro: "STRIPE_SECRET_KEY is not set"
✅ **Solução**: Verificar se secret está configurado no Supabase

### Erro: "Webhook signature verification failed"
✅ **Solução**: Verificar se `STRIPE_WEBHOOK_SECRET` está correto

### Erro: "Price not found"
✅ **Solução**: Verificar se Price IDs existem no Stripe

### Premium não ativa após pagamento
✅ **Solução**:
1. Verificar logs do webhook no Stripe
2. Ver logs da edge function no Supabase
3. Confirmar que webhook está configurado

### Código promocional não funciona
✅ **Solução**:
1. Verificar se código está ativo: `is_active = true`
2. Verificar se não expirou: `expires_at > now()`
3. Verificar se ainda tem usos: `current_uses < max_uses`

---

## 📞 Links Úteis

- **Documentação Completa**: `STRIPE_INTEGRATION.md`
- **Verificação de Chaves**: `STRIPE_KEYS_VERIFICATION.md`
- **Status da Integração**: `STRIPE_STATUS.md`
- **Script de Teste**: `./test-stripe-integration.sh`

---

## ✅ Checklist Rápido

Antes de ir para produção:

- [ ] Webhook configurado no Stripe
- [ ] STRIPE_WEBHOOK_SECRET configurado
- [ ] Price IDs testados
- [ ] Pagamento teste completo realizado
- [ ] Cancelamento testado
- [ ] Códigos promocionais testados
- [ ] Doações para associações testadas
- [ ] Notificações funcionando
- [ ] Portal do cliente testado
- [ ] KYC completo no Stripe (produção)

---

**Pronto para usar!** 🎉
