# Memórias da Tela: Solicitação da Camisa Oficial (/doador/camisa)

**Rota:** `/doador/camisa`  
**Arquivo Fonte:** `src/app/doador/camisa/page.tsx`  
**Finalidade:** Permitir aos membros solicitarem a camisa oficial do Movimento O Bom Amigo, escolhendo tamanho, quantidade, observações e acompanhando o status do pagamento (pendente, sinal ou quitado) com chave PIX e envio de comprovante no WhatsApp da coordenação.

---

## 1. Histórico e Decisões Anteriores
- **16/11/2026:** Criação da tela de solicitação e acompanhamento da camisa oficial. Visualização da foto/arte oficial, cálculo automático de valor total, chave PIX com botão de cópia de 1 clique, atalho direto para envio do comprovante no WhatsApp e suporte a edição e cancelamento.

## 2. Regras de Negócio e Comportamento
- **Grade de Tamanhos:** PP, P, M, G, GG, XGG, Babylook (P, M, G, GG) e Infantil (10, 12, 14).
- **Valores e Quantidades:** Cálculo em tempo real com base no preço unitário configurado pela coordenação.
- **Status de Pagamento:**
  - `Aguardando Pagamento` (Pendente)
  - `Sinal Pago` (exibe valor abatido e restante a pagar)
  - `Quitado (100% Pago)`
  - `Camisa Entregue`
- **Comunicação:** Link dinâmico para o WhatsApp com mensagem pré-formatada contendo tamanho, quantidade e valores.

## 3. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 16/11/2026 | Inicialização | Lançamento oficial do módulo de Camisas Oficiais para membros | Antigravity |
