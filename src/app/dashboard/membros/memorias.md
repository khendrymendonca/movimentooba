# Memórias da Tela: Gestão de Membros e Cartões (/dashboard/membros)

**Rota:** `/dashboard/membros`  
**Arquivo Fonte:** `src/app/dashboard/membros/page.tsx`  
**Finalidade:** Gerenciamento completo de doadores, filtro em menu suspenso (UX/UI mobile), ativação/desativação de carteirinhas, visualização ao vivo da carteirinha do membro com arte do Canva, impressão A4 frente e verso e atendimento de solicitações/bugs.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026 a 09/10/2026:** Listagem de membros, seleção múltipla para renovação em lote e impressão A4 (`#carteirinha-print`).
- **11/11/2026:** Redesenho slim para mobile e desktop, conversão dos filtros para **Menu Suspenso (`<select>`)** seguindo boas práticas de UX mobile, e integração do componente `<DonorCard />` dentro do modal de gerenciamento do membro.

## 2. Regras de Negócio e Comportamento
- **Menu Suspenso de Filtros:** Permite filtrar rapidamente por:
  - `Todos os membros`
  - `Aptos para doar (60d/120d)`
  - `Em intervalo biológico`
  - `Carteirinha pendente/revogada`
  - `Com Solicitação / Bug` (exibe membros que enviaram chamados pela tela Meu Perfil).
- **Prévia Interativa da Carteirinha no Modal:** Ao clicar em `Gerenciar`, o Super Admin vê a carteirinha real do membro (com a foto 3x4 dele e o background ativo do Canva), podendo girá-la em 3D, ativar/desativar imediatamente ou renovar por 1 ou 2 anos.
- **Impressão A4 Frente e Verso:** O bloco `#carteirinha-print` renderiza a frente (com o background do Canva, foto 3x4, sangue e validade) e o verso (com QR Code de validação oficial) na medida exata de crachá CR80 (`3.375in x 2.125in`).
- **Gestão de Chamados (Solicitações/Bugs):** Exibe o alerta no card do membro e permite ler a mensagem e clicar em `Marcar Resolvido` dentro do modal.

## 3. Bugs Conhecidos e Correções Aplicadas
- Correção da leitura polimórfica de `membro.cards` (`Array.isArray(membro.cards) ? membro.cards[0] : membro.cards`).
- Restauração da impressão frente e verso completa com suporte à arte do Canva.

## 4. Pendências e Próximos Passos para Produção
- [ ] Exportação da lista filtrada em CSV.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | UI & Mobile | Redesenho limpo com cards no mobile e tabela no desktop | Antigravity |
| 11/11/2026 | UX, Carteirinha & Chamados | Menu suspenso com filtro de Solicitações/Bugs, prévia 3D da carteirinha do membro com arte do Canva no modal, ativação/desativação em 1 toque e impressão A4 frente/verso com Canva. | Antigravity |
| 12/11/2026 | Regra & Limpeza | Remoção de validade da carteirinha e do select de renovação; gestão simplificada em Ativar / Desativar membro. Bloqueio estrito de doações fora do intervalo ou extrapolando o limite da janela de 12 meses usando `validateNewDonation`. Impressão A4 padronizada com identidade visual corporativa oficial. | Antigravity |
| 12/11/2026 | Gestão de Medalhas Especiais | Adição de controles no modal do membro para habilitar/desabilitar com 1 clique a medalha de Membro Fundador (2026), medalhas personalizadas por cada mutirão cadastrado e medalha de Herói da Rede SOS. Inclusão de botão de concessão de Membro Fundador em lote na barra de seleção múltipla. | Antigravity |
