# Memórias da Tela: Perfil do Doador (/doador/perfil)

**Rota:** `/doador/perfil`  
**Arquivo Fonte:** `src/app/doador/perfil/page.tsx`  
**Finalidade:** Exibir e editar os dados cadastrais do usuário, foto 3x4 (refletida na Carteirinha Digital), alterar e-mail e senha de acesso, enviar solicitações ou reportar bugs para a gestão, e encerrar sessão.

---

## 1. Histórico e Decisões Anteriores
- **08/10/2026:** Upload de avatar com persistência no bucket `avatars` do Supabase Storage.
- **09/10/2026:** Transferência da visualização de selos gamificados para a tela dedicada `/doador/colecao`, limpando o perfil.
- **11/11/2026:** Unificação completa da tela `Meu Perfil` para todos os usuários (doadores e Super Admin), sem qualquer menção ou selo de `"Coordenação"`.

## 2. Regras de Negócio e Comportamento
- **Padronização Universal:** Esta tela é 100% idêntica para qualquer usuário logado (`/doador/perfil` e `/dashboard/perfil` renderizam exatamente o mesmo componente).
- **Foto 3x4 para a Carteirinha:** Upload validado (`validateSafeUpload`) salvo em `${user.id}/avatar.${ext}` no bucket `avatars`, refletindo imediatamente na Carteirinha Digital.
- **Dados Pessoais:** Edição de Nome Completo, Data de Nascimento, Sexo Biológico (`M` 60 dias / `F` 120 dias) e Tipo Sanguíneo (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- **Segurança e Acesso:**
  - **Alterar E-mail:** Utiliza `supabase.auth.updateUser({ email })` com disparo de confirmação.
  - **Alterar Senha:** Utiliza `supabase.auth.updateUser({ password })` validando confirmação e mínimo de 6 caracteres.
- **Solicitação ou Reportar Bug:** Permite ao usuário escolher a categoria (`Solicitação`, `Reportar Bug` ou `Dúvida / Sugestão`), escrever a mensagem e enviá-la com persistência no banco (`profiles.theme_preference` em JSON estruturado `{ type, message, createdAt, status: 'Pendente' }`) para que o Super Admin visualize e resolva em `/dashboard/membros`.

## 3. Bugs Conhecidos e Correções Aplicadas
- Prevenção de cache do navegador em avatares recém-atualizados adicionando timestamp (`?t=...`) na URL da imagem.
- Remoção do cabeçalho `"Meu Perfil (Coordenação)"` que aparecia quando o Super Admin acessava o perfil pelo painel.

## 4. Pendências e Próximos Passos para Produção
- [ ] Permitir edição opcional de telefone de contato pelo próprio doador.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | UI, Segurança & Suporte | Unificação total do Meu Perfil (sem "Coordenação"), adição de alteração de E-mail e Senha, seletor de Tipo Sanguíneo/Sexo e envio persistente de Solicitações/Bugs para o painel de membros. | Antigravity |
| 13/11/2026 | Upload e Ajuste Livre de Fotos | Redesenho completo do componente `ImageCropperModal`: eliminação do zoom excessivo em fotos de alta resolução (ancoragem proporcional com escala `contain`), controle de zoom ampliado de 0.5x a 3.5x com suporte a pinch-to-zoom no celular, seletor de proporção livre pelo usuário (Original/Livre, 1:1 Quadrado e 3:4 Carteirinha), remoção de máscara artificial de rosto e adição de botão direto "Usar Foto Inteira" sem corte forçado. | Antigravity |
