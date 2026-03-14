#!/bin/bash

# Script de Teste da Integração Stripe
# Este script verifica se todas as configurações estão corretas

echo "🔍 Testando Integração Stripe..."
echo ""

SUPABASE_URL="https://bvhwlejjuacxgylwazck.supabase.co"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")

    if [ "$response" -eq 200 ] || [ "$response" -eq 401 ] || [ "$response" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} (HTTP $response - Endpoint is reachable)"
    else
        echo -e "${RED}✗${NC} (HTTP $response - Endpoint may be down)"
    fi
}

echo "1️⃣  Testando Edge Functions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "create-checkout" "$SUPABASE_URL/functions/v1/create-checkout" "OPTIONS"
test_endpoint "stripe-webhook" "$SUPABASE_URL/functions/v1/stripe-webhook" "OPTIONS"
test_endpoint "check-subscription" "$SUPABASE_URL/functions/v1/check-subscription" "OPTIONS"
test_endpoint "customer-portal" "$SUPABASE_URL/functions/v1/customer-portal" "OPTIONS"

echo ""
echo "2️⃣  Verificando Documentação..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "STRIPE_INTEGRATION.md" ]; then
    echo -e "${GREEN}✓${NC} STRIPE_INTEGRATION.md encontrado"
else
    echo -e "${RED}✗${NC} STRIPE_INTEGRATION.md não encontrado"
fi

if [ -f "STRIPE_KEYS_VERIFICATION.md" ]; then
    echo -e "${GREEN}✓${NC} STRIPE_KEYS_VERIFICATION.md encontrado"
else
    echo -e "${RED}✗${NC} STRIPE_KEYS_VERIFICATION.md não encontrado"
fi

echo ""
echo "3️⃣  Verificando Variáveis de Ambiente..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Arquivo .env encontrado"

    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL configurado"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_URL não encontrado"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY configurado"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_ANON_KEY não encontrado"
    fi
else
    echo -e "${RED}✗${NC} Arquivo .env não encontrado"
fi

echo ""
echo "4️⃣  Verificando Edge Functions no Filesystem..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_function() {
    local func_name=$1
    local func_path="supabase/functions/$func_name/index.ts"

    if [ -f "$func_path" ]; then
        echo -e "${GREEN}✓${NC} $func_name encontrado"

        # Verificar se usa Deno.serve
        if grep -q "Deno.serve" "$func_path"; then
            echo -e "  ${GREEN}✓${NC} Usando Deno.serve (correto)"
        else
            echo -e "  ${YELLOW}⚠${NC}  Não usa Deno.serve"
        fi

        # Verificar CORS headers
        if grep -q "Access-Control-Allow-Origin" "$func_path"; then
            echo -e "  ${GREEN}✓${NC} CORS headers configurados"
        else
            echo -e "  ${RED}✗${NC} CORS headers ausentes"
        fi

        # Verificar imports NPM
        if grep -q "npm:stripe" "$func_path"; then
            echo -e "  ${GREEN}✓${NC} Stripe importado via npm:"
        fi
    else
        echo -e "${RED}✗${NC} $func_name não encontrado em $func_path"
    fi
}

check_function "create-checkout"
check_function "stripe-webhook"
check_function "check-subscription"
check_function "customer-portal"

echo ""
echo "5️⃣  Informações de Configuração..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Supabase URL: $SUPABASE_URL"
echo "Webhook URL: $SUPABASE_URL/functions/v1/stripe-webhook"
echo ""
echo "Price IDs configurados:"
echo "  • Mensal: price_1T8ov5RwhbKQXE0J8GCqt40W (€1.99/mês)"
echo "  • Anual: price_1T8ovyRwhbKQXE0JlTXYTU7D (€21.49/ano)"

echo ""
echo "6️⃣  Próximos Passos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}⚠${NC}  Ações manuais necessárias:"
echo ""
echo "1. Configurar Webhook no Stripe Dashboard:"
echo "   https://dashboard.stripe.com/webhooks"
echo ""
echo "2. Adicionar endpoint:"
echo "   $SUPABASE_URL/functions/v1/stripe-webhook"
echo ""
echo "3. Selecionar eventos:"
echo "   • checkout.session.completed"
echo "   • customer.subscription.updated"
echo "   • customer.subscription.deleted"
echo "   • invoice.payment_succeeded"
echo "   • invoice.payment_failed"
echo ""
echo "4. Copiar Signing Secret (whsec_...)"
echo ""
echo "5. Verificar se STRIPE_WEBHOOK_SECRET está configurado"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Verificação completa!"
echo ""
echo "Documentação detalhada:"
echo "  • STRIPE_INTEGRATION.md - Guia completo"
echo "  • STRIPE_KEYS_VERIFICATION.md - Verificação de chaves"
