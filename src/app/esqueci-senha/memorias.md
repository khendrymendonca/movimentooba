# Memórias da Tela: Recuperação de Senha (/esqueci-senha)

**Rota:** `/esqueci-senha`  
**Arquivo Fonte:** `src/app/esqueci-senha/page.tsx`  
**Finalidade:** Permitir que usuários que esqueceram suas credenciais recebam instruções seguras de recuperação de acesso por e-mail.

---

## 1. Histórico e Decisões Anteriores
- **09/10/2026:** Implementação da tela limpa com disparo de e-mail via Supabase resetPasswordForEmail.

## 2. Regras de Negócio e Comportamento
- Envio de e-mail com magic link / token apontando para a rota de definição de nova senha.
- Feedback seguro informando o envio sem confirmar explicitamente se o e-mail está cadastrado no sistema.

## 3. Bugs Conhecidos e Correções Aplicadas
- Alinhamento do redirectTo para respeitar as URLs autorizadas no painel do Supabase.

## 4. Pendências e Próximos Passos para Produção
- [ ] Personalizar o template de e-mail de recuperação dentro do console Supabase.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
