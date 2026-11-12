# Memórias da Tela: Central de Apoio ao Doador (/doador/apoio)

**Rota:** `/doador/apoio`  
**Arquivo Fonte:** `src/app/doador/apoio/page.tsx`  
**Finalidade:** Permitir ao membro abrir chamados diretos para a coordenação para solicitar ajustes de nome na carteirinha digital, relatar bugs no app e enviar sugestões, acompanhando os prazos em dias úteis e o parecer oficial.

---

## 1. Prazos e Categorias (SLAs Oficiais)
- **Ajuste no nome da carteirinha:** Prazo de **até 2 dias úteis**.
  - O membro informa o nome completo oficial desejado e o motivo do ajuste.
- **Relatar bug:** Prazo de **até 5 dias úteis**.
  - O membro seleciona a tela/área afetada (Carteirinha, Doações, Medalhas, Login, etc.) e descreve o ocorrido.
- **Sugestão de melhoria:** Prazo de **até 5 dias úteis**.
  - Envio de ideias para melhoria do aplicativo e do projeto.
- **Outro assunto / Dúvidas:** Prazo de **2 a 5 dias úteis**.

## 2. Regras de Negócio e Comportamento
- Design mobile-first estrito, alinhado à identidade visual do O Bom Amigo.
- Geração automática de protocolo único padronizado no formato `#APO-2026-XXXX`.
- Exibição de histórico de chamados do próprio usuário com status visual:
  - 🟡 Pendente (Aguardando atendimento)
  - 🔵 Em Análise (Coordenação trabalhando na solicitação)
  - 🟢 Resolvido (Concluído com parecer oficial do gestor)
- Modal com detalhes completos do chamado e parecer da coordenação.

## 3. Diário de Bordo
| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 12/11/2026 | Concepção & Criação | Criação da Central de Apoio ao Doador com abertura de chamados com prazos explícitos (ajuste no nome: 2 dias úteis; bugs/sugestões: 5 dias úteis), geração de protocolos `#APO-2026-XXXX` e acompanhamento de status em tempo real. | Antigravity |
