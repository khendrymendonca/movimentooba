# Memórias da Tela: Solicitação de Produtos Oficiais (/doador/camisa)

**Rota:** `/doador/camisa`  
**Arquivo Fonte:** `src/app/doador/camisa/page.tsx`  
**Finalidade:** Permitir aos membros solicitarem produtos oficiais do Movimento O Bom Amigo (ex: Camisa, Caneca, etc.) quando habilitados pelo Admin em Pré-Save ou Solicitação Oficial.

---

## 1. Histórico e Decisões Anteriores
- **16/11/2026:** Evolução para **Produtos Oficiais**:
  - Exibe apenas produtos habilitados pelo Admin (`pre_save` dentro da data limite ou `oficial`).
  - Se o produto estiver como `encomendado` ou `inativo`, não aparece para os membros.
  - Suporte tanto a produtos com grade de tamanhos (vestuário) quanto produtos de tamanho único (ex: caneca).
  - Arte oficial opcional (exibida assim que o Admin subir a imagem).

## 2. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 16/11/2026 | Inicialização | Lançamento da tela de solicitação | Antigravity |
| 16/11/2026 | Regra/UI | Adaptação para Produtos Oficiais genéricos com ciclo completo controlado pelo Admin | Antigravity |
