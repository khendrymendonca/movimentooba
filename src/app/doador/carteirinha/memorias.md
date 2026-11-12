# Memórias da Tela: Carteirinha Digital do Doador (/doador/carteirinha)

**Rota:** `/doador/carteirinha`  
**Arquivo Fonte:** `src/app/doador/carteirinha/page.tsx` e `src/components/DonorCard.tsx`  
**Finalidade:** Exibição da Carteirinha Digital (carro-chefe do app) com efeito 3D interativo (frente e verso), suporte a backgrounds personalizados criados no Canva pelo Super Admin, sobreposição automática de foto 3x4 e dados do doador, modo tela cheia e QR Code de validação pública.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Padrão Carteirinha 1.0 (gradiente vermelho, foto 3x4, tipo sanguíneo em destaque).
- **08/10/2026:** Verso com aviso restritivo obrigatório e integração de `react-qr-code`.
- **09/10/2026:** Efeito 3D flip ao tocar na carteirinha para girar e ver o verso.
- **11/11/2026:** Criação do componente dedicado e reutilizável `<DonorCard />` (`src/components/DonorCard.tsx`), integrando:
  - Suporte nativo aos backgrounds do Canva (`cardBackgroundUrl`) com opção de ocultar o cabeçalho padrão (`hideDefaultHeaderOnCustomBg`) quando a arte do Canva já inclui a logo.
  - Bloqueio visual automático caso a carteirinha seja desativada/revogada pelo Super Admin (`status === 'Revogada'`).
  - Modo **Tela Cheia** para apresentação rápida e atalho direto para envio da foto 3x4 caso o membro ainda não tenha cadastrado.

## 2. Regras de Negócio e Comportamento
- **Carro-Chefe do App:** Carrega simultaneamente os dados do perfil (`profiles`), status/validade (`cards`) e arte ativa do projeto (`fetchProjectConfig`).
- **Posicionamento Automático sobre Arte do Canva:** Na proporção oficial CR80 (`1.586:1` / `1012x638 px`), posiciona a foto 3x4 à esquerda inferior, nome completo, validade, ID e selo de tipo sanguíneo no canto superior direito.
- **Ativação / Desativação:** Se o status do cartão for `'Revogada'`, exibe selo de carteirinha desativada e bloqueia o uso até reativação pela gestão.

## 3. Bugs Conhecidos e Correções Aplicadas
- Resolvido corte do nome do doador em telas menores com `truncate` e `min-w-0`.
- Preservação da renderização 3D (`transform-style: preserve-3d` e `backface-visibility: hidden`) em navegadores móveis.

## 4. Pendências e Próximos Passos para Produção
- [ ] Opção para baixar imagem da carteirinha para uso offline.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | Carro-Chefe & Canva | Novo componente `<DonorCard />` com suporte completo a backgrounds do Canva, ocultação opcional de topo, modo Tela Cheia, trava visual para carteirinha desativada e alerta de foto 3x4 pendente. | Antigravity |
| 11/11/2026 | UX Tela Cheia | Removido botão extra de sair da tela cheia; agora basta tocar/clicar em qualquer área fora da imagem da carteirinha para sair da tela cheia, enquanto tocar na carteirinha continua girando frente/verso. | Antigravity |
| 12/11/2026 | Identidade & Tipografia | Remoção definitiva de customização do Canva. Limpeza dos rótulos "Carteirinha do Doador" e "Membro Doador", mantendo apenas o Nome em destaque e tipografia padronizada. Remoção completa da validade da carteirinha, mantendo controle exclusivo de Ativar/Desativar membro. | Antigravity |
