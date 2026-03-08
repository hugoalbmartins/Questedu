
# Plano: Corrigir Botão de Logout Não Funcionar Sem Refresh

## Investigação do Problema

Analisando os logs de autenticação, vejo que os logout requests são bem-sucedidos (status 204), mas o problema está no frontend com a gestão de estado ou navegação após logout.

### Análise do Código Atual

**AuthContext (`src/contexts/AuthContext.tsx`)**:
- A função `signOut` apenas chama `supabase.auth.signOut()` e limpa os states locais
- Não faz redirecionamento - depende de cada componente fazer sua própria navegação
- O listener `onAuthStateChange` só é configurado após inicialização, podendo perder eventos

**Problemas Identificados**:
1. **Navegação Manual**: Cada componente tem que chamar `navigate("/")` após `signOut()`, criando inconsistências
2. **Race Condition**: O `navigate("/")` pode ocorrer antes do `onAuthStateChange` processar o logout
3. **Estado Desatualizado**: Components podem não reagir imediatamente à mudança de estado de autenticação

## Solução Proposta

### 1. Centralizar Lógica de Logout no AuthContext
- Mover toda a lógica de redirecionamento para dentro da função `signOut`
- Garantir que a navegação só aconteça após o estado ser completamente limpo

### 2. Melhorar o Listener de Auth Changes
- Remover a condição `initialized.current` que pode estar bloqueando events
- Garantir que o listener processa logout events imediatamente

### 3. Usar useNavigate no AuthContext
- Centralizar a navegação no context para consistência
- Eliminar a necessidade de cada component fazer navegação manual

### Arquitetura da Solução

```text
AuthContext signOut():
┌─ supabase.auth.signOut()
├─ Aguardar confirmação
├─ Limpar estados (user, session, profile, studentData)
└─ navigate("/") automaticamente

Components:
┌─ Apenas chamam signOut()
└─ Não fazem navegação manual
```

### Mudanças Específicas

**AuthContext.tsx**:
- Importar `useNavigate` do react-router-dom
- Modificar `signOut` para incluir navegação automática
- Ajustar o listener `onAuthStateChange` para processar logout imediatamente
- Remover check de `initialized.current` no listener

**Components (AdminDashboard, etc.)**:
- Remover chamadas manuais de `navigate("/")` após `signOut()`
- Simplificar handlers de logout para apenas chamar `signOut()`

### Benefícios

1. **Consistência**: Todos os components terão o mesmo comportamento de logout
2. **Confiabilidade**: Eliminação de race conditions entre estado e navegação  
3. **Manutenibilidade**: Lógica centralizada, mais fácil de debugar
4. **UX**: Logout instantâneo sem necessidade de refresh

### Implementação

1. Modificar `AuthContext.tsx` para incluir navegação automática no `signOut`
2. Ajustar listener de auth changes para reagir imediatamente ao logout
3. Remover navegação manual de todos os components que fazem logout
4. Testar fluxo em todos os tipos de utilizador (admin, parent, student)

Esta solução garante que o logout funcione imediatamente sem refresh em todos os components da aplicação.
