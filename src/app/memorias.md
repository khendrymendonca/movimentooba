# Memórias da Tela: Landing Page Institucional (/)

**Rota:** `/`  
**Arquivo Fonte:** `src/app/page.tsx`  
**Finalidade:** Página institucional amigável, sutil e acolhedora do projeto O Bom Amigo.

---

## 1. Histórico e Decisões Anteriores
- **08/10/2026:** Construção da página institucional com design minimalista e frase "O Bom amigo é aquele que dá a vida pelo outro".
- **09/10/2026:** Interceptador na rota inicial para capturar `?code=` de recuperação de senha e redirecionar para `/nova-senha`.
- **11/11/2026:**
  - Padronizada a nomenclatura e localização: botão único **"Canal no WhatsApp"** (`https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z`) na Hero Section, sem duplicação na barra superior.
  - Detecção híbrida e instantânea de tamanho de tela (`window.matchMedia('(max-width: 1024px)')` + classes responsivas `lg:hidden`): quando acessado em celular ou tablet, exibe automaticamente o botão **"Área de Membros"**.
  - Botão **"Área de Membros"** e demais botões refinados para um estilo slim, limpo e sutil (borda leve `border-slate-200`, fundo neutro, tipografia `font-normal`, sem sombras pesadas ou efeitos neon/gradientes agressivos).
  - Seção de **Próximas Doações em Grupo** limpa, exibindo apenas as datas agendadas.
- **12/11/2026:**
  - Remoção dos espaços placeholder de imagens da landing page (no Hero e na Iniciativa) e da caixa "Quem sou eu?".
  - Implementação do **Card de Impacto Coletivo de Sangue Doado** no Hero da landing page: exibe o cumulativo de sangue doado (450 ml por doação registrada) desde o marco inicial de 12/09/2026, com total de doações e estimativa de vidas impactadas.
  - Adicionado atalho no Header do aplicativo do doador (`/doador`) e no Perfil (`/doador/perfil`) para voltar rapidamente ao site institucional (`/`).
