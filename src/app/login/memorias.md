# Memórias da Tela: Autenticação e Login (/login)

**Rota:** `/login`  
**Arquivo Fonte:** `src/app/login/page.tsx`  
**Finalidade:** Ponto de acesso único para doadores e administradores da plataforma.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Integração real ao Supabase Auth com signInWithPassword.
- **06/10/2026:** Roteamento condicional: administradores (role === admin) vão para /dashboard e doadores comuns vão para /doador.
- **09/10/2026:** Ajustes de navegação e integração com links de cadastro e recuperação de senha.

## 2. Regras de Negócio e Comportamento
- Autenticação de email e senha via Supabase Auth.
- Consulta imediata ao campo role da tabela profiles para definir o destino do redirecionamento.
- Persistência segura de sessão nos cookies/armazenamento local via Supabase SSR client.

## 3. Bugs Conhecidos e Correções Aplicadas
- Tratamento de mensagens de credenciais inválidas para evitar vazamento de dados sobre existência prévia de e-mail.

## 4. Pendências e Próximos Passos para Produção
- [ ] Auto-redirecionamento caso o usuário já possua sessão ativa salva ao visitar a tela de login.
- [ ] Opção visual de exibir/ocultar senha (ícone de olho).

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | Bug & Headers | Correção de CSP/HSTS e remoção do recurso obsoleto 'interest-cohort' do Permissions-Policy no next.config.ts que bloqueava WebSockets HMR e gerava recusa de conexão em dev local; mensagens detalhadas de feedback e console.error no login. | Antigravity |
