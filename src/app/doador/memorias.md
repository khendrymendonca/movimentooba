# Memórias da Tela: Home do Doador (/doador)

**Rota:** `/doador`  
**Arquivo Fonte:** `src/app/doador/page.tsx`  
**Finalidade:** Página inicial do doador de sangue contendo comunicados do mural, banner oficial para agendamento no Hemominas e atalhos rápidos.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Configuração da navegação fixa em abas e layout inicial.
- **08/10/2026:** Inclusão do banner fixo com horários, telefone e link do MG Gov para agendamento presencial no Hemominas.
- **08/10/2026:** Feed dinâmico consumindo dados reais da tabela news.
- **09/10/2026:** Remoção do formato restrito de app móvel no desktop; expansão para sidebar responsiva e barra inferior no celular.

## 2. Regras de Negócio e Comportamento
- Exibição das notícias mais recentes com imagens e resumos.
- Banner em destaque para agendamento com link oficial para o MG Gov Hemominas.
- Acesso direto às abas Carteirinha, Doações, Coleção e Perfil.

## 3. Bugs Conhecidos e Correções Aplicadas
- Ajuste na responsividade do layout entre celular (bottom bar) e computador (sidebar expandida).

## 4. Pendências e Próximos Passos para Produção
- [ ] Card dinâmico informando se o doador já está apto a doar hoje ou quantos dias faltam.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | UI & Readequação | Limpeza do excesso de texto explicativo e remoção do bloco de agendamento em degradê pesado; card de situação enxuto, atalho rápido para Super Admin alternar para o Painel de Membros no celular e design slim e limpo. | Antigravity |
| 11/11/2026 | Regra de Mutirão (20 vagas) | Adicionada confirmação de presença nos mutirões (`Confirmar presença neste mutirão`) com contador `X/20`. Ao atingir 20 confirmações, o mutirão bloqueia novas confirmações em grupo e informa que será necessário agendar individualmente pelo site naquela data. | Antigravity |
| 11/11/2026 | Rede de Apoio SOS & Sino de Notificações | Adicionado sino de notificações no header com badge de não lidas e painel modal consolidado (reagendamentos, avisos do app, notícias e alertas SOS). Adicionada a seção "Rede de Apoio: Precisando de Sangue", com detecção automática de compatibilidade sanguínea e prazo do doador, instruções de doação direcionada e compartilhamento rápido. | Antigravity |
| 12/11/2026 | UX / Notificações | Implementação da limpeza imediata e persistente de notificações: ao clicar no botão "Limpar tudo" ou no botão individual de fechar (X) de uma notificação, o item desaparece imediatamente da tela, é registrado em `cleared_notif_ids` e o contador/badge do sino é zerado sem reaparecer ao reabrir. | Antigravity |
| 12/11/2026 | Correção Mutirões & RSVP | Substituição da inversão cega por chamada idempotente `set_campaign_rsvp` (com `p_confirm` booleano explícito), permitindo confirmar ou cancelar presença no mutirão de forma segura por qualquer membro. Adicionado bypass de cache HTTP no cliente do navegador (`cache: 'no-store'`) para sincronização em tempo real entre celulares. | Antigravity |
