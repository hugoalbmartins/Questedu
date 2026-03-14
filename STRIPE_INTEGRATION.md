# Integração Stripe - Sistema de Pagamentos

## Visão Geral

O sistema está completamente integrado com o Stripe para processar pagamentos recorrentes de subscrições premium.

## Funcionalidades Implementadas

### 1. Subscrições Recorrentes
- **Plano Mensal**: €1.99/mês
- **Plano Anual**: €21.49/ano (desconto de 10%)
- Cancelamento a qualquer momento através do portal do cliente
- Renovação automática

### 2. Métodos de Pagamento Suportados
- ✅ Cartão de Crédito/Débito (Visa, Mastercard, etc.)
- ✅ Multibanco (pagamento por referência)
- ✅ MB WAY (através do Stripe)

### 3. Códigos Promocionais
- Gestão completa de códigos de desconto no backend
- Tipos de desconto:
  - Percentual (ex: 20% de desconto)
  - Valor fixo (ex: €5 de desconto)
  - Duração configurável (1x, 3 meses, 6 meses, etc.)
- Validações:
  - Expiração de códigos
  - Limite de utilizações
  - Códigos únicos por utilizador
- Integração automática com checkout do Stripe

### 4. Sistema de Doações para Associações de Pais
- 10% de cada pagamento é automaticamente doado à associação
- Cálculo proporcional para associações adicionadas após início da subscrição
- Dashboard para associações acompanharem doações

## Edge Functions Implementadas

### 1. `create-checkout`
**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/create-checkout`

**Propósito**: Cria sessão de checkout do Stripe

**Parâmetros**:
```json
{
  "studentId": "uuid",
  "plan": "monthly" | "annual",
  "promoCode": "CODIGO_OPCIONAL",
  "associationCode": "CODIGO_ASSOCIACAO_OPCIONAL"
}
```

**Headers**: `Authorization: Bearer [JWT_TOKEN]`

**Funcionalidades**:
- Verifica e aplica códigos promocionais
- Incrementa contador de utilizações do código
- Configura métodos de pagamento (card, multibanco)
- Define locale para português
- Adiciona metadata para webhook processar

### 2. `stripe-webhook`
**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook`

**Propósito**: Processa eventos do Stripe

**Eventos Tratados**:
- `checkout.session.completed`: Ativa premium após pagamento
- `customer.subscription.updated`: Atualiza estado da subscrição
- `customer.subscription.deleted`: Remove premium quando cancelado
- `invoice.payment_succeeded`: Renova subscrição
- `invoice.payment_failed`: Notifica utilizador de problema

**Ações Automáticas**:
- Atualização de status premium na base de dados
- Cálculo e registo de doações para associações
- Envio de notificações in-app
- Gestão de datas de expiração

### 3. `check-subscription`
**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/check-subscription`

**Propósito**: Verifica e sincroniza estado da subscrição

**Parâmetros**:
```json
{
  "studentId": "uuid"
}
```

**Funcionalidades**:
- Verifica subscrição ativa no Stripe
- Aplica bónus de 15% na primeira ativação
- Calcula doações proporcionais para associações
- Suporta premium concedido por admin
- Atualiza expiração e tipo de plano

### 4. `customer-portal`
**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/customer-portal`

**Propósito**: Cria sessão do portal do cliente Stripe

**Funcionalidades**:
- Gestão de métodos de pagamento
- Cancelamento de subscrição
- Visualização de histórico de faturas
- Atualização de dados de cobrança

## Configuração do Webhook no Stripe

### 1. Aceder ao Dashboard Stripe
1. Ir para https://dashboard.stripe.com
2. Navegar para **Developers** → **Webhooks**
3. Clicar em **Add endpoint**

### 2. Configurar Endpoint
- **URL**: `https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook`
- **Eventos a ouvir**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Obter Webhook Secret
Após criar o webhook, copiar o **Signing secret** (começa com `whsec_`)

Este secret é automaticamente configurado nas variáveis de ambiente do Supabase.

## Fluxo de Pagamento

### 1. Utilizador Seleciona Plano
```typescript
// Frontend
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    studentId: student.id,
    plan: 'monthly', // ou 'annual'
    promoCode: 'DESCONTO20', // opcional
    associationCode: 'ESCOLA123' // opcional
  })
});

const { url } = await response.json();
window.location.href = url; // Redirecionar para checkout Stripe
```

### 2. Stripe Processa Pagamento
- Utilizador preenche dados de pagamento
- Stripe valida e processa
- Redireciona para success_url ou cancel_url

### 3. Webhook Ativa Premium
- Stripe envia evento `checkout.session.completed`
- Webhook atualiza base de dados
- Premium é ativado imediatamente
- Notificação enviada ao utilizador

### 4. Renovações Automáticas
- Stripe cobra automaticamente no período seguinte
- Webhook processa `invoice.payment_succeeded`
- Extensão automática do premium

## Gestão de Códigos Promocionais

### Criar Código no Backend (Admin)
```sql
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
  'NATAL2024',
  'discount',
  25,              -- 25% de desconto
  0,
  3,               -- por 3 meses
  100,             -- máximo 100 utilizações
  true,
  '2024-12-31'     -- expira no fim do ano
);
```

### Tipos de Códigos Suportados

#### Desconto Percentual Único
```sql
discount_percent: 20,
discount_duration_months: 0  -- aplica apenas no primeiro pagamento
```

#### Desconto Valor Fixo
```sql
discount_amount: 5.00,  -- €5 de desconto
discount_duration_months: 0
```

#### Desconto Recorrente
```sql
discount_percent: 15,
discount_duration_months: 6  -- 15% durante 6 meses
```

## Testes

### Cartões de Teste Stripe
```
Sucesso: 4242 4242 4242 4242
Requer Autenticação: 4000 0025 0000 3155
Recusado: 4000 0000 0000 9995

CVV: qualquer 3 dígitos
Data: qualquer data futura
```

### Testar Webhooks Localmente
```bash
# Instalar Stripe CLI
stripe listen --forward-to https://bvhwlejjuacxgylwazck.supabase.co/functions/v1/stripe-webhook

# Trigger eventos
stripe trigger checkout.session.completed
```

## Segurança

### Validações Implementadas
- ✅ JWT verificado em todas as edge functions (exceto webhook)
- ✅ Webhook signature validation
- ✅ Metadata associa pagamento a estudante específico
- ✅ Códigos promocionais validados antes de usar
- ✅ RLS policies protegem dados sensíveis

### Dados Armazenados
- ❌ **NUNCA** armazenar detalhes de cartão
- ✅ Armazenar apenas: customer_id, subscription_id, metadata
- ✅ Stripe é a única fonte de verdade para dados de pagamento

## Monitoring

### Logs no Stripe Dashboard
- Ver todas as transações em **Payments**
- Histórico de webhooks em **Developers** → **Webhooks**
- Subscrições ativas em **Customers**

### Logs no Supabase
```bash
# Ver logs da edge function
supabase functions logs stripe-webhook
supabase functions logs create-checkout
```

## FAQ

### Como cancelar subscrição?
Utilizador acede ao portal do cliente através da função `customer-portal`

### O que acontece quando subscrição expira?
O webhook `customer.subscription.deleted` remove o premium automaticamente

### Como processar reembolsos?
Reembolsos devem ser feitos no Dashboard Stripe e o webhook atualiza automaticamente

### Suporta múltiplos estudantes por conta?
Sim, cada estudante tem sua própria subscrição independente

## Produtos Stripe Configurados

### Produto: Questeduca Premium
**ID Produto**: `prod_XXXXXXXX`

#### Preço Mensal
- **ID**: `price_1T8ov5RwhbKQXE0J8GCqt40W`
- **Valor**: €1.99
- **Recorrência**: Mensal
- **Moeda**: EUR

#### Preço Anual
- **ID**: `price_1T8ovyRwhbKQXE0JlTXYTU7D`
- **Valor**: €21.49
- **Recorrência**: Anual
- **Moeda**: EUR
- **Economia**: ~10% vs mensal

## Próximos Passos

1. ✅ Sistema de pagamentos implementado
2. ✅ Webhooks configurados
3. ✅ Códigos promocionais funcionais
4. ✅ Suporte MB WAY e Multibanco
5. ⚠️ Configurar webhook secret no Stripe Dashboard
6. ⚠️ Testar em ambiente de produção
7. 📋 Criar dashboard de métricas de pagamento
