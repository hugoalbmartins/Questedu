# Verificação de Chaves API Stripe

## Status da Configuração

### ✅ Variáveis de Ambiente Configuradas

As seguintes variáveis estão configuradas no Supabase:

1. **STRIPE_SECRET_KEY** ✅
   - Chave secreta do Stripe para processar pagamentos
   - Usado em: create-checkout, check-subscription, customer-portal, stripe-webhook
   - Formato: `sk_live_...` (produção) ou `sk_test_...` (teste)

2. **STRIPE_WEBHOOK_SECRET** ✅
   - Secret para validar webhooks do Stripe
   - Usado em: stripe-webhook
   - Formato: `whsec_...`

3. **SUPABASE_URL** ✅
   - URL do projeto Supabase
   - Valor: `https://bvhwlejjuacxgylwazck.supabase.co`

4. **SUPABASE_ANON_KEY** ✅
   - Chave pública para autenticação
   - Usado em todas as edge functions

5. **SUPABASE_SERVICE_ROLE_KEY** ✅
   - Chave com permissões administrativas
   - Usado para operações privilegiadas no backend

## Como Verificar as Chaves

### 1. Verificar Chave Stripe no Dashboard

1. Aceder a https://dashboard.stripe.com/apikeys
2. Verificar se a chave está ativa:
   - **Teste**: `sk_test_...`
   - **Produção**: `sk_live_...`

### 2. Testar Integração com Chave de Teste

```bash
# Instalar Stripe CLI (se necessário)
brew install stripe/stripe-cli/stripe

# Login no Stripe
stripe login

# Testar chave
stripe customer list --api-key sk_test_...
```

### 3. Verificar Webhook Secret

1. Aceder a https://dashboard.stripe.com/webhooks
2. Localizar endpoint: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook`
3. Copiar o "Signing secret" (formato `whsec_...`)
4. Verificar se corresponde ao configurado no Supabase

## Produtos e Preços Configurados

### Produto: Questeduca Premium

#### Preço Mensal
- **Price ID**: `price_1T8ov5RwhbKQXE0J8GCqt40W`
- **Valor**: €1.99/mês
- **Status**: ✅ Configurado nas edge functions

#### Preço Anual
- **Price ID**: `price_1T8ovyRwhbKQXE0JlTXYTU7D`
- **Valor**: €21.49/ano
- **Status**: ✅ Configurado nas edge functions

### Verificar Preços no Stripe

```bash
stripe prices retrieve price_1T8ov5RwhbKQXE0J8GCqt40W
stripe prices retrieve price_1T8ovyRwhbKQXE0JlTXYTU7D
```

Ou no dashboard: https://dashboard.stripe.com/prices

## Edge Functions Status

### 1. create-checkout ✅
- **URL**: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/create-checkout`
- **Usa**: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- **Status**: Deployed e funcional

### 2. stripe-webhook ✅
- **URL**: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook`
- **Usa**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- **Status**: Deployed e funcional

### 3. check-subscription ✅
- **URL**: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/check-subscription`
- **Usa**: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- **Status**: Deployed e funcional

### 4. customer-portal ✅
- **URL**: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/customer-portal`
- **Usa**: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
- **Status**: Deployed e funcional

## Testes de Verificação

### 1. Testar Create Checkout

```bash
curl -X POST https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "UUID_DO_ESTUDANTE",
    "plan": "monthly"
  }'
```

**Resposta Esperada:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_test_..."
}
```

### 2. Testar Check Subscription

```bash
curl -X POST https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/check-subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "UUID_DO_ESTUDANTE"
  }'
```

**Resposta Esperada:**
```json
{
  "subscribed": true/false,
  "subscription_end": "2024-12-31T23:59:59.000Z",
  "subscription_type": "monthly"
}
```

### 3. Testar Webhook (Local)

```bash
# Encaminhar eventos para função local
stripe listen --forward-to https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook

# Em outro terminal, simular evento
stripe trigger checkout.session.completed
```

## Checklist de Configuração

- [x] STRIPE_SECRET_KEY configurado no Supabase
- [x] STRIPE_WEBHOOK_SECRET configurado no Supabase
- [x] Webhook endpoint criado no Stripe Dashboard
- [x] Price IDs configurados nas edge functions
- [x] Edge functions deployed
- [ ] Webhook testado com evento real
- [ ] Pagamento teste completo realizado

## Ambiente de Teste vs Produção

### Modo Teste (Recomendado para Desenvolvimento)
- Usar chaves `sk_test_...` e `pk_test_...`
- Criar webhook de teste no Stripe
- Usar cartões de teste: `4242 4242 4242 4242`
- Nenhum pagamento real é processado

### Modo Produção
- Usar chaves `sk_live_...` e `pk_live_...`
- Criar webhook de produção no Stripe
- Pagamentos reais são processados
- Requer validação KYC do Stripe

## Resolução de Problemas

### Erro: "STRIPE_SECRET_KEY is not set"
- Verificar se a variável está configurada nas edge function secrets
- Redeployar a função após adicionar a chave

### Erro: "Invalid API Key"
- Verificar se a chave não expirou
- Confirmar formato correto (sk_test_ ou sk_live_)
- Verificar no Stripe Dashboard se a chave está ativa

### Erro: "Webhook signature verification failed"
- Verificar se STRIPE_WEBHOOK_SECRET está correto
- Confirmar que o endpoint no Stripe aponta para a URL correta
- Verificar se os eventos corretos estão selecionados

### Erro: "Price not found"
- Verificar se os Price IDs existem no Stripe
- Confirmar se estão no ambiente correto (test vs live)
- Atualizar IDs nas edge functions se necessário

## Monitoramento

### Logs do Stripe
- **Pagamentos**: https://dashboard.stripe.com/payments
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Eventos**: https://dashboard.stripe.com/events
- **Clientes**: https://dashboard.stripe.com/customers

### Logs do Supabase
Ver logs das edge functions no dashboard do Supabase:
- https://bvhwlejjuacxgylwazck.supabase.co/project/_/logs/edge-functions

## Segurança

### ✅ Boas Práticas Implementadas
- Chaves nunca expostas no frontend
- Webhook signature validation
- JWT authentication em funções protegidas
- Uso de HTTPS em todas as comunicações
- Nenhum dado de cartão armazenado

### ⚠️ Importante
- NUNCA commitar chaves no git
- NUNCA expor chaves secretas no código frontend
- SEMPRE usar variáveis de ambiente
- Renovar chaves periodicamente

## Contatos de Suporte

### Stripe Support
- Dashboard: https://support.stripe.com
- Email: support@stripe.com
- Documentação: https://stripe.com/docs

### Supabase Support
- Dashboard: https://supabase.com/dashboard/support
- Discord: https://discord.supabase.com
- Documentação: https://supabase.com/docs
