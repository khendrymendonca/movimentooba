# Memórias da Tela: Meu Perfil Unificado (/dashboard/perfil)

**Rota:** `/dashboard/perfil`  
**Arquivo Fonte:** `src/app/dashboard/perfil/page.tsx`  
**Finalidade:** Renderizar exatamente a mesma tela unificada de `Meu Perfil` (`/doador/perfil`) sem distinção visual de `"Coordenação"`, mantendo a experiência de perfil idêntica para todos os membros do projeto.

---

## 1. Histórico e Decisões Anteriores
- **06/10/2026:** Header dinâmico refletindo iniciais e foto do perfil logado.
- **08/10/2026:** Upload de avatar com persistência no bucket `avatars` do Supabase Storage.
- **11/11/2026:** Unificação arquitetural: `/dashboard/perfil/page.tsx` passou a re-exportar o componente `PerfilDoador` (`@/app/doador/perfil/page`), eliminando o título `"Meu Perfil (Coordenação)"` e disponibilizando foto 3x4, sangue, sexo, alteração de e-mail, alteração de senha e envio de solicitações/bugs em um único lugar.

## 2. Regras de Negócio e Comportamento
- Não deve exibir textos como `"Coordenação"` ou `"Administrador"` no perfil. A diferença do Super Admin está exclusivamente nas telas e funções extras na barra de navegação.
- Permite trocar foto 3x4 da carteirinha, nome, nascimento, sexo biológico, tipo sanguíneo, e-mail e senha.

## 3. Bugs Conhecidos e Correções Aplicadas
- Corrigida a divergência onde o Super Admin via uma tela antiga chamada `"Meu Perfil (Coordenação)"` sem opção de trocar senha, e-mail, tipo sanguíneo ou reportar bug.

## 4. Pendências e Próximos Passos para Produção
- [x] Permitir alteração de senha e e-mail diretamente dentro da tela de perfil logado.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
| 11/11/2026 | Arquitetura & UI | Substituição da tela separada de "Coordenação" pela re-exportação direta do perfil unificado (`/doador/perfil`), garantindo que o Meu Perfil seja igual para todos os usuários. | Antigravity |
