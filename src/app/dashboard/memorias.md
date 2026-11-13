# Memórias da Tela: Visão Geral & Estúdio da Carteirinha (/dashboard)

**Rota:** `/dashboard`  
**Arquivo Fonte:** `src/app/dashboard/page.tsx`  
**Finalidade:** Centro de comando do Super Admin para gerenciar o Estúdio da Carteirinha Digital (upload e galeria de backgrounds feitos no Canva com prévia 3D em tempo real), link do Canal Oficial no WhatsApp e datas das doações em grupo.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026 a 09/10/2026:** Criação do dashboard com métricas em tempo real e menu off-canvas responsivo.
- **11/11/2026:** Transformação do painel em um centro de gestão focado no carro-chefe do app (**Estúdio da Carteirinha Digital - Modelo Canva**), gestão de datas de mutirões e configuração do Canal no WhatsApp.

## 2. Regras de Negócio e Comportamento
- **Estúdio da Carteirinha Digital (Canva):**
  - Permite subir novas artes de fundo (`1012 x 638 px` / proporção `1.586:1`) diretamente para o pasta autenticada do usuário no bucket `avatars` (`${session.user.id}/card-bg-${Date.now()}.${ext}`), respeitando a política RLS do Supabase Storage.
  - **Galeria de Modelos:** Armazena os backgrounds enviados em `projectConfig.cardBackgrounds`, permitindo alternar com um clique entre diferentes artes do Canva enquanto testa os modelos, ou restaurar o fundo vermelho original.
  - **Toggle de Topo/Logo:** Opção `Ocultar título/logo padrão do topo (usar quando sua arte do Canva já possui logo)` (`hideDefaultHeaderOnCustomBg`).
  - **Prévia 3D em Tempo Real:** Renderiza `<DonorCard />` ao lado dos controles para visualizar exatamente como a foto 3x4 e os dados ficam posicionados sobre a arte do Canva.

## 3. Bugs Conhecidos e Correções Aplicadas
- **11/11/2026 (`ReferenceError: handleSaveConfig is not defined`):** Corrigido restaurando a função `handleSaveConfig` e salvando automaticamente qualquer upload ou troca de modelo do Canva no banco de dados.
- **11/11/2026 (Permissão RLS no Upload do Background):** Ajustado o caminho de upload de `config/card-bg-...` para `${session.user.id}/card-bg-...` para cumprir a regra RLS `(storage.foldername(name))[1] = auth.uid()::text` do bucket `avatars`.

## 4. Pendências e Próximos Passos para Produção
- [ ] Adicionar métricas comparativas por ano de campanha.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | Bugfix & Estúdio Canva | Correção do `handleSaveConfig`, ajuste de RLS no upload de background para `${userId}/card-bg-...`, galeria de backgrounds do Canva para troca rápida e prévia 3D ao vivo com `<DonorCard />`. | Antigravity |
| 11/11/2026 | Mutirões (Limite 20) | Exibição da contagem `X/20 confirmados` e lista nominal dos doadores que confirmaram presença em cada mutirão cadastrado. | Antigravity |
| 11/11/2026 | Navegação Unificada (Bottom Bar) | Substituída a barra lateral (Sidebar) em `/dashboard/*` pela mesma barra de navegação inferior fixa de ícones (`Início`, `Doações`, `Carteirinha`, `Medalhas`, `Perfil`, `Gestão`), eliminando mudanças bruscas de UI ao alternar entre Medalhas/Carteirinha e Gestão. | Antigravity |
| 11/11/2026 | UI Mobile Coesa (Sem Menu Superior) | Removido o menu superior extra de `/dashboard/layout.tsx` e redesenhada a tela `/dashboard` para seguir exatamente o mesmo padrão visual mobile-first de `/doador/*` (header slim, cards 2x2 compactos que cabem perfeitamente na tela do celular, atalhos integrados para Membros e Mural, e preview vertical da Carteirinha do Canva). | Antigravity |
| 11/11/2026 | Reagendamento, SOS & Notificações | Adicionada edição/reagendamento de mutirões (com disparo automático de alerta de nova data aos membros), módulo de Rede de Apoio SOS (cadastro de quem precisa de sangue com cruzamento em tempo real de membros compatíveis e aptos para convite via WhatsApp), e formulário para disparo de avisos/notificações no app. | Antigravity |
| 12/11/2026 | Gestão de Membros & Liberação de Medalhas com Notificação | Inclusão de seção dedicada no Dashboard principal para visualização de membros e liberação individual de medalhas especiais (Membro Fundador, Mutirões 1º, 2º... e Herói da Rede SOS) pós-encerramento das campanhas. Cada liberação manual dispara automaticamente uma notificação pessoal comemorativa no app do doador. | Antigravity |
| 12/11/2026 | UI Refinamento | Remoção das tags de medalhas dos cards de membros na área de gestão para manter a interface limpa e despoluída; a conferência e liberação das medalhas é feita diretamente ao clicar no botão "Liberar Medalhas". | Antigravity |
| 13/11/2026 | Gestão de Confirmações de Mutirão | Adicionado botão de remoção individual `(X)` ao lado de cada participante confirmado nos cards de mutirão do Dashboard, permitindo ao administrador remover presenças diretamente pelo painel via `adminRemoveCampaignParticipant`. Implementado filtro de integridade em `fetchGroupCampaigns` para descartar qualquer resíduo ou simulação de diagnóstico. | Antigravity |
