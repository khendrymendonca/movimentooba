# Memórias da Tela: Gestão de Notícias e Mural (/dashboard/noticias)

**Rota:** `/dashboard/noticias`  
**Arquivo Fonte:** `src/app/dashboard/noticias/page.tsx`  
**Finalidade:** Permitir aos administradores criar, publicar, editar e remover avisos, campanhas de doação urgente e anexos informativos.

---

## 1. Histórico e Decisões Anteriores
- **08/10/2026:** Criação da tabela news e do bucket público news_assets no Supabase Storage.
- **08/10/2026:** Implementação de formulário com upload de imagem de capa e upload de anexos em arquivo.

## 2. Regras de Negócio e Comportamento
- Persistência de títulos, corpo da notícia, autor e links para anexos na tabela news.
- Armazenamento de imagens e PDFs no bucket news_assets com geração de URL pública permanente.

## 3. Bugs Conhecidos e Correções Aplicadas
- Sanitização de nomes de arquivos com espaços e acentos no envio ao Supabase Storage.

## 4. Pendências e Próximos Passos para Produção
- [ ] Adicionar flag de notícia urgente com destaque no topo para convocações emergenciais de sangue.

## 5. Diário de Bordo e Correções Futuras
> Sempre que uma alteração visual, correção de bug ou mudança de regra for implementada nesta tela, registre abaixo com a data correspondente.

| Data | Tipo (Bug/UI/Regra) | Descrição da Alteração | Responsável |
|---|---|---|---|
| 11/11/2026 | Inicialização | Criação do arquivo de memórias dedicado da tela | Antigravity |
