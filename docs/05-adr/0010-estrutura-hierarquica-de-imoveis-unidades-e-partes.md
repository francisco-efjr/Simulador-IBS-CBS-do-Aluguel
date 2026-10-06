# ADR-0010: Estrutura Hierárquica Multinível (Imóvel-Unidade), Menus de Locadores/Fiadores e Limite Comercial

**Data:** 2026-10-05  
**Status:** Aceita  

---

## Contexto

Em alinhamento estratégico entre Francisco Ferreira Jr e Jacqueline Moraes de Aguiar, foram estabelecidas as diretrizes centrais de produto, arquitetura e posicionamento da **Águia Systems** (`aguiasystems.com.br`, classe 42 no INPI):

1. **Estrutura de Imóveis:** O modelo anterior tratava o imóvel como uma entidade plana e única. Em condomínios, prédios comerciais ou vilas familiares, isso impedia a locação simultânea de salas/apartamentos sem violar a restrição de sobreposição temporal GiST no PostgreSQL.
2. **Titularidade dos Bens:** Os imóveis pertencem a diferentes membros da família e holdings societárias, demandando a separação formal de Locadores e Fiadores.
3. **Modelo Comercial:** Foi fixada a restrição do plano gratuito em até 3 imóveis cadastrados, com proporção padrão de 1 inquilino por unidade vinculada.
4. **Padronização Contratual:** Necessidade de numeração uniforme no formato `número/ano` (ex.: `001/2026`), com 6 minutas contratuais padronizadas e geração de PDF com e-mails das partes para assinatura digital.

---

## Decisão

1. **Árvore Hierárquica em Dois Níveis:**
   - **Nó Primário (Imóvel Macro):** Representa o terreno, condomínio, prédio ou casa principal. Contém nome, endereço, matrícula no cartório de imóveis, número CIB (Receita Federal) e suporte a múltiplos números de IPTU.
   - **Nó Secundário (Unidade):** Representa a sala, apartamento, loja ou módulo comercial. Contém complemento, códigos de fornecimento de energia e água, taxa de condomínio e taxas extras customizáveis (ex.: taxa de poço artesiano de R$ 30,00 mensais).
   - **Vínculo Contratual:** O contrato de locação passa a ser atrelado diretamente à **unidade**, e não ao imóvel macro.

2. **Novos Menus e Cadastros Dedicados:**
   - Adicionar menu lateral específico para **Locadores** com dados civis, fiscais e bancários para repasse.
   - Adicionar cadastro formal para **Fiadores** com qualificação de outorga uxória do cônjuge.
   - Atualizar cadastro de **Inquilinos** com RG facultativo (alinhado à Nova Carteira de Identidade Nacional - CIN), endereço de contato secundário com observação de origem e validação de e-mail.

3. **Governança de Contratos:**
   - Padronizar numeração sequencial no formato `número/ano` (ex.: `001/2026`).
   - Apresentação em lista expansível por imóvel macro com badges de status por unidade.
   - Integração de 6 minutas padrão (residencial x comercial, com/sem fiador, com/sem caução).
   - Geração de PDF contendo e-mails formais de todas as partes intervenientes.

4. **Regra Comercial do Perfil Gratuito:**
   - Aplicação de limite rígido de até 3 imóveis macro cadastrados para contas no plano gratuito.

---

## Consequências

### Positivas
- **Escalabilidade Sem Limite de Inquilinos:** Permite dezenas de inquilinos em um mesmo condomínio macro sem violar restrições de integridade temporal no banco de dados.
- **Rastreabilidade de Consumo:** A inclusão dos códigos de medidores de água e luz agiliza conferências em vistorias de saída.
- **Segurança Jurídica:** Contratos vinculam o locador familiar correto e qualificam fiadores e 2 testemunhas conforme o art. 784, III do CPC.
- **Alavanca Comercial:** O limite de 3 imóveis estabelece o gatilho natural de monetização do software.

### Negativas e Riscos Mitigados
- **Migração de Dados:** Exige rotina de migração para que imóveis unifamiliares existentes criem automaticamente uma unidade default 1:1, preservando compatibilidade retroativa.
- **Complexidade de Interface:** Requer a substituição de tabelas simples por listas expansíveis hierárquicas, compensada por navegação mais intuitiva.
