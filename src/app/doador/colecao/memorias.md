# Memórias da Tela: Coleção de Selos e Gamificação (/doador/colecao)

**Rota:** `/doador/colecao`  
**Arquivo Fonte:** `src/app/doador/colecao/page.tsx`  
**Finalidade:** Incentivar a frequência de doações através de selos anuais de gamificação e regras biológicas de limite de doações.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Concepção inicial da coleção de selos baseada no ano corrente.
- **09/10/2026:** Criação de rota e tela dedicada /doador/colecao na barra de navegação.
- **09/10/2026:** Substituição de texto estático por guia visual interativo que exibe os selos desbloqueáveis com base no sexo biológico do doador.

## 2. Regras de Negócio e Comportamento
- Cálculo de selos desbloqueados a partir do histórico de doações do ano atual.
- Regras biológicas do Ministério da Saúde: Homens podem doar até 4x por ano (intervalo mínimo 60 dias); Mulheres até 3x por ano (intervalo mínimo 90 dias).
- Exibição dos selos conquistados coloridos e dos futuros selos bloqueados/silhueta.

## 3. Bugs Conhecidos e Correções Aplicadas
- Correção de comentário de código vazado na tela anterior de perfil antes da criação da rota dedicada.

## 4. Pendências e Próximos Passos para Produção
- [ ] Animação comemorativa e som leve/efeito háptico quando o doador completa a meta anual de selos.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 12/11/2026 | Gamificação & UI Duolingo | Redesenho completo da tela no estilo gamificado do Duolingo: seções organizadas por ano (Medalhas de 2026, 2025, etc.), grid de 3 colunas, medalhas com aro 3D vibrante desbloqueadas de acordo com as doações reais, medalhas bloqueadas com cadeado cinza em relevo e modal explicativo/comemorativo ao tocar em cada medalha. | Antigravity |
| 12/11/2026 | Divisão Biológica Oficial | Ajustada a coleção anual para refletir com precisão a frequência biológica: homens possuem até 4 medalhas por ano (1ª Bronze, 2ª Prata, 3ª Ouro e 4ª Diamante); mulheres possuem até 3 jóias por ano (1ª Rubi, 2ª Pérola e 3ª Diamante). As medalhas desbloqueiam sequencialmente conforme cada doação registrada no ano, mantendo o visual 3D em relevo com cadeados estilo Duolingo. | Antigravity |
| 12/11/2026 | Medalhas Especiais & Início 2026 | Configuração do marco inicial do projeto em 2026 (não exibe anos anteriores). Implementação da seção nobre de Conquistas & Medalhas Especiais: Membro Fundador (pioneiro de 2026), Medalha por cada Mutirão registrado no sistema e Herói da Rede SOS (doação direta para quem precisava). | Antigravity |
| 12/11/2026 | Nomenclatura Mutirões & Títulos Completos | Ajuste nos títulos de todas as medalhas para exibição por completo (sem corte/truncamento). Nomenclatura ordinal oficial dos mutirões (1º Mutirão O Bom Amigo, 2º Mutirão O Bom Amigo, etc.) com liberação manual exclusiva pelo Super Admin após conferência presencial de comparecimento. | Antigravity |
| 12/11/2026 | UI Refinamento | Remoção do efeito de ponto piscante (`animate-ping`) em todas as medalhas desbloqueadas (Fundador, Mutirões, SOS e Anuais), mantendo um acabamento 3D limpo, estável e elegante. | Antigravity |
