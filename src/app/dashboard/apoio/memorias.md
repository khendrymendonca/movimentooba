# Memórias da Tela: Central de Apoio e Gestão de Chamados (/dashboard/apoio)

**Rota:** `/dashboard/apoio`  
**Arquivo Fonte:** `src/app/dashboard/apoio/page.tsx`  
**Finalidade:** Gestão unificada de chamados abertos pelos membros diretamente para o Super Admin/Gestor. Permite atender solicitações com prazos oficiais (SLAs), aplicar ajustes de nome na carteirinha com 1 clique e notificar os usuários.

---

## 1. Prazos Oficiais e Categorias (SLAs)
- **Ajuste no nome da carteirinha:** Prazo de atendimento de **até 2 dias úteis**.
  - Permite ao gestor visualizar o nome atual vs. novo nome solicitado.
  - Botão de 1 clique para aprovar e atualizar diretamente a coluna `name` na tabela `profiles`, concluindo o chamado e enviando notificação no app do membro.
- **Relato de Bug / Falha no Sistema:** Prazo de atendimento de **até 5 dias úteis**.
  - Detalhamento da tela afetada e comportamento anômalo relatado pelo membro.
- **Sugestão de Melhoria:** Prazo de atendimento de **até 5 dias úteis**.
  - Coleta de ideias da comunidade para aprimorar o aplicativo e os mutirões.
- **Outro Assunto / Dúvidas:** Prazo de atendimento de **2 a 5 dias úteis**.

## 2. Regras de Negócio e Comportamento
- Apenas usuários com `role === 'ADM'` possuem permissão de acesso à tela de gestão.
- Cards de métricas superiores (KPIs): Total de Chamados, Pendentes, Ajustes de Nome (2 dias úteis), Bugs (5 dias úteis) e Resolvidos.
- Filtros simultâneos por status (`pendente`, `em_analise`, `resolvido`) e categoria.
- Busca textual por número do protocolo (`#APO-2026-XXXX`), nome do membro, e-mail ou descrição.
- Atalhos de contato direto no modal de atendimento (WhatsApp via link `https://wa.me/...` e E-mail via `mailto:`).
- Disparo de notificações internas comemorativas/informativas para o membro ao responder ou resolver o chamado.

## 3. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 12/11/2026 | Concepção & Criação | Criação da Central de Apoio & Chamados para gestão de bugs (5 dias úteis), sugestões e ajuste de nome na carteirinha (2 dias úteis) com aprovação direta em 1 clique e disparo de notificações automáticas. | Antigravity |
