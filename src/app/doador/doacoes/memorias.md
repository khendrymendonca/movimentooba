# Memórias da Tela: Registro e Histórico de Doações (/doador/doacoes)

**Rota:** `/doador/doacoes`  
**Arquivo Fonte:** `src/app/doador/doacoes/page.tsx`  
**Finalidade:** Permitir ao doador registrar novas doações realizadas e acompanhar a linha do tempo do seu histórico solidário.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Criação da tabela donations e coluna donations_this_year com convenção snake_case.
- **09/10/2026:** Remoção de frases redundantes e excesso de emojis no histórico.
- **09/10/2026:** Substituição de formulário fixo pelo botão clean "Registrar Doação" com expansão sob demanda.

## 2. Regras de Negócio e Comportamento
- Registro de nova doação salvando data e local na tabela donations.
- Atualização da contagem anual de doações do perfil.
- Cálculo e alerta de prazo mínimo para a próxima doação permitida.

## 3. Bugs Conhecidos e Correções Aplicadas
- Ajuste no tratamento de timezone na seleção de data para evitar salvar a data com diferença de dia.

## 4. Pendências e Próximos Passos para Produção
- [ ] Permitir anexar comprovante de doação do hemocentro (foto ou PDF).

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 12/11/2026 | Regra & Limite Anual | Implementação da função `validateNewDonation` com trava estrita: impede registro de doações fora do intervalo mínimo (60d/120d) e bloqueia extrapolação do limite de doações na janela deslizante de 12 meses (4 doações p/ homens, 3 p/ mulheres). O ciclo de 12 meses conta individualmente a partir de cada doação. Exibição de aviso imediato em tempo real no formulário. | Antigravity |
| 12/11/2026 | Correção RLS / Banco de Dados | Correção da política de segurança RLS na tabela `public.donations`: a trava anterior permitia insert apenas para ADMs (`is_admin()`), causando erro 42501 para doadores comuns. A nova policy concede permissão para `(profile_id = auth.uid() OR is_admin())`, restabelecendo o registro autônomo de doações para todos os usuários. | Antigravity |
