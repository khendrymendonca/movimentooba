# Memórias da Tela: Gestão de Produtos Oficiais (/dashboard/camisas)

**Rota:** `/dashboard/camisas`  
**Arquivo Fonte:** `src/app/dashboard/camisas/page.tsx`  
**Finalidade:** Gestão completa de Produtos Oficiais do movimento (ex: Camisa, Caneca, etc.) pelo Super Admin: cadastro de produto, ativação do Pré-Save com data limite, lançamento do preço oficial e cobrança de sinal/total, marcação de produto como Encomendado (ocultando da visão dos membros) e reabilitação para novas remessas.

---

## 1. Histórico e Decisões Anteriores
- **16/11/2026:**Evolução do módulo para **Produtos Oficiais**:
  - Layout original da Gestão preservado sem barra superior azul/escura.
  - Cadastro de múltiplos produtos (com ou sem escolha de tamanho, ex: Caneca vs Camisa) e upload de arte opcional (quando estiver pronta).
  - Ciclo de vida em 4 estados controlados pelo Admin:
    1. `inativo` (Oculto para membros)
    2. `pre_save` (Pré-Save aberto até a data definida pelo Admin)
    3. `oficial` (Solicitações com preço final definido + PIX + controle de sinal/quitação)
    4. `encomendado` (Some imediatamente da visão dos membros, mantendo a lista na Gestão para controle; permite clicar em "Reabilitar Produto" para voltar ao Pré-Save).

## 2. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 16/11/2026 | Inicialização | Criação da tela de gestão | Antigravity |
| 16/11/2026 | Regra/UI | Renomeação para Produtos Oficiais, retorno ao layout original sem barra superior e fluxo completo (Cadastrar Produto -> Pré-Save -> Preço/Gestão -> Encomendado -> Reabilitar) | Antigravity |
