# Memórias da Tela: Definição de Nova Senha (/nova-senha)

**Rota:** `/nova-senha`  
**Arquivo Fonte:** `src/app/nova-senha/page.tsx`  
**Finalidade:** Receber o doador ou administrador autenticado temporariamente por link de recuperação e permitir a redefinição segura da senha.

---

## 1. Histórico e Decisões Anteriores
- **09/10/2026:** Criação da tela com verificação de força de senha e confirmação.
- **09/10/2026:** Tratamento de fallback para quando a rota inicial intercepta os parâmetros ?code= do Supabase.

## 2. Regras de Negócio e Comportamento
- Atualização da credencial via supabase.auth.updateUser({ password }).
- Validação de no mínimo 6 caracteres e confirmação idêntica.
- Após sucesso, feedback amigável e redirecionamento para /login.

## 3. Bugs Conhecidos e Correções Aplicadas
- Tratamento para tokens inválidos ou sessões expiradas com alerta claro de reenvio.

## 4. Pendências e Próximos Passos para Produção
- [ ] Adicionar indicador visual de força de senha (fraca, média, forte).

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
