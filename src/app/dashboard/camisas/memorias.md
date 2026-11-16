# Memórias da Tela: Gestão de Camisas Oficiais (/dashboard/camisas)

**Rota:** `/dashboard/camisas`  
**Arquivo Fonte:** `src/app/dashboard/camisas/page.tsx`  
**Finalidade:** Gestão completa das encomendas da camisa oficial do movimento pelo Super Admin: controle financeiro, controle de confecção (grade por tamanhos), marcação de pagamentos/sinal em 1 clique, envio de cobranças no WhatsApp e relação ativa de doadores que ainda não solicitaram.

---

## 1. Histórico e Decisões Anteriores
- **16/11/2026:** Criação do módulo de gestão completo de camisas no painel administrativo:
  - Métricas e Totais: total de unidades, receita prevista, receita arrecadada e pendente.
  - Grade de Produção: contagem por tamanho (PP, P, M, G, GG, XGG, Babylook, Infantil) com botão de cópia de texto formatado para enviar à estamparia/fábrica.
  - Abas e Filtros: Todos os pedidos, Não Pagos, Com Sinal, Quitados e Membros que NÃO solicitaram.
  - Ações Rápidas: Marcar 100% Pago, Marcar Sinal (com definição de valor abatido), Marcar Pendente e Marcar Entregue.
  - Conversa e Cobrança no WhatsApp com mensagens pré-formatadas em 1 toque.
  - Configuração Geral: Alteração em tempo real do preço unitário, imagem/arte oficial da camisa, chave PIX, titular e banco.

## 2. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 16/11/2026 | Inicialização | Criação da tela de gestão e integração com a Sidebar administrativa | Antigravity |
| 16/11/2026 | Regra/UI | Implementação do fluxo de Pré-Save (Fase 1: levantamento de demanda sem cobrança inicial) com botão direto para "Lançar Preço Final & Cobrar Sinal" (Fase 2: oficial) | Antigravity |
| 16/11/2026 | Arquitetura | Inclusão de barra superior administrativa fixa com abas e atalho destacado no dashboard para acesso do Super Usuário | Antigravity |
