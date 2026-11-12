# Memórias da Tela: Cadastro de Novos Doadores (/cadastro)

**Rota:** `/cadastro`  
**Arquivo Fonte:** `src/app/cadastro/page.tsx`  
**Finalidade:** Permitir que novos membros se cadastrem autonomamente, apresentando de forma clara o Termo de Consentimento LGPD e orientando sobre o acesso à Área de Membros pelo celular.

---

## 1. Histórico e Decisões Anteriores
- **08/10/2026:** Criação da tela independente de cadastro conectada ao Supabase Auth e tabela `profiles`, com trigger automático de carteirinha de 1 ano.
- **11/11/2026:**
  - As informações da **LGPD (Lei nº 13.709/2018)** foram concentradas de forma clara e transparente no checkbox de consentimento desta tela.
  - Após concluir o cadastro, a tela de boas-vindas informa que a **Área de Membros fica disponível somente em celulares** e convida o doador para o **Canal de Novidades no WhatsApp** (`https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z`).

## 2. Regras de Negócio e Comportamento
- Validação de idade (16 a 69 anos), senha segura (mínimo 8 caracteres com letras e números) e confirmação de senha.
- Aceite obrigatório do Termo de Consentimento LGPD antes de criar a conta.
