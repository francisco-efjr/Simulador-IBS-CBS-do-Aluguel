![](https://img.shields.io/badge/page--author-Águia%20Systems-green?logo=azuredevops&logoColor=white)
![](https://img.shields.io/badge/modulo-unidades-blue?logo=postgresql&logoColor=white)

[[_TOC_]]

## Objetivo
Governar a estrutura de unidades habitacionais e comerciais vinculadas a um imóvel macro na Águia Systems, gerenciando dados operacionais específicos (complemento, códigos de energia e água, taxa de condomínio e taxas extras customizáveis como taxa de poço), servindo como o nó intermediário da árvore hierárquica onde os contratos de locação são atrelados com a proporção padrão de 1 inquilino por unidade.

## Contexto  
  
Conforme definição estratégica entre Francisco Ferreira Jr e Jacqueline Moraes de Aguiar, o sistema opera sob uma **árvore hierárquica estrita**:  
1. **Imóvel Macro (Primário):** Prédio, condomínio, vila, galpão ou terreno.  
2. **Unidades (Sublinks):** Unidades habitacionais ou comerciais individuais vinculadas ao imóvel macro.  
3. **Contratos:** Atrelados diretamente à **unidade**, e não ao imóvel macro.  

Esta separação atende cenários reais de condomínios, vilas e prédios comerciais, eliminando a limitação na quantidade total de inquilinos na holding (já que cada unidade recebe seu próprio inquilino e contrato independente).  

Além dos dados físicos básicos, o cadastro da unidade incorpora elementos operacionais essenciais para a cobrança do aluguel e despesas de consumo:
- **Complemento do Endereço:** Bloco, andar, número da sala, apartamento ou fundos.
- **Códigos de Fornecimento de Concessionárias:** Código da conta de energia elétrica e código da conta de água (para controle de titularidade e religação).
- **Taxa de Condomínio:** Flag de existência (Sim/Não) e valor mensal.
- **Taxas Extras Customizáveis:** Lançamento de despesas fixas recorrentes do condomínio/vila, com o exemplo acordado da **Taxa de Poço Artesiano de R$ 30,00 mensais**.

---  
  
## Fluxo Atual vs Proposto (Estrutura Hierárquica em 2 Níveis)  
 
```mermaid
graph TD
    subgraph ImovelMacro["1. Imóvel Macro (Primário)"]
        IM["Edifício Central / Condomínio Aguiar<br/>(Matrícula, CIB, Múltiplos IPTUs, Endereço Macro)"]
    end

    subgraph UnidadesFilhas["2. Unidades Habitacionais / Comerciais (Sublinks)"]
        U1["Unidade 101 (Residencial)<br/>- Complemento: Bloco A, Apto 101<br/>- Energia: 1092837 | Água: 99281<br/>- Condomínio: R$ 350,00<br/>- Taxa Extra: Poço R$ 30,00"]
        U2["Unidade 102 (Residencial)<br/>- Complemento: Bloco A, Apto 102<br/>- Energia: 1092838 | Água: 99282<br/>- Condomínio: R$ 350,00<br/>- Taxa Extra: Poço R$ 30,00"]
        U3["Sala Comercial 01<br/>- Complemento: Térreo, Loja 1<br/>- Energia: 2049182 | Água: 88192<br/>- Condomínio: Isento"]
    end

    subgraph ContratosVinculados["3. Contratos de Locação (Atrelados à Unidade)"]
        C1["Contrato 001/2026<br/>Inquilino A (1 por unidade)"]
        C2["Contrato 002/2026<br/>Inquilino B (1 por unidade)"]
        C3["Contrato 003/2026<br/>Inquilino C (1 por unidade)"]
    end

    IM --> U1
    IM --> U2
    IM --> U3
    U1 --> C1
    U2 --> C2
    U3 --> C3
```

---  
  
### O Problema  
  
O modelo anterior não comportava a complexidade de vilas e prédios fracionados:
  
| Cenário | Comportamento esperado | Comportamento real (Legado) |  
|---|---|---|  
| Prédio com 6 apartamentos e poço artesiano | Cadastro de 1 imóvel macro e 6 unidades, cada uma com sua taxa de condomínio e taxa de poço de R$ 30 | O operador precisava criar 6 imóveis independentes e calcular o poço de cabeça ou em planilha externa |  
| Transferência de titularidade de energia e água | Armazenamento do código do medidor/fornecimento na unidade para conferência rápida | Os códigos das concessionárias ficavam em pastas de arquivo ou anotações físicas |  
| Aluguel de 2 salas no mesmo andar | Contratos simultâneos ativos sem conflito temporal | A restrição GiST do banco barrava o 2º contrato porque o imóvel era tratado como peça única |  
| Proporção de ocupantes por unidade | 1 inquilino titular responsável formalmente por contrato de unidade | Indefinição sobre quem respondia pelo contrato em imóveis compartilhados |  
  
**Resultado:** Desorganização na prestação de contas de consumo (água e luz), impossibilidade de gerenciar taxas específicas da comunidade (como poço) e barreiras técnicas na emissão de contratos simultâneos.  
  
---  
  
## Fluxo Proposto (V2 — Modelagem da Unidade e Taxas Operacionais)  
  
```mermaid
erDiagram
    IMOVEIS ||--o{ IMOVEL_UNIDADES : "possui sublinks (1:N)"
    IMOVEL_UNIDADES ||--o{ CONTRATOS : "atrelado a (1:0..1)"
    IMOVEL_UNIDADES ||--o{ TAXAS_EXTRAS : "possui (1:N)"

    IMOVEL_UNIDADES {
        uuid id PK
        uuid imovel_id FK "imóvel macro primário"
        text identificador "ex: Apto 101, Sala 2, Galpão A"
        text complemento "ex: Bloco B, 2º Andar, Fundos"
        text tipo_unidade "residencial ou comercial"
        text codigo_energia "código de instalação da concessionária"
        text codigo_agua "código do hidrômetro/fornecimento"
        boolean tem_condominio "indica se cobra condomínio"
        numeric valor_condominio "valor mensal do condomínio"
        text status "vago, alugado, em_manutencao, inativo"
        uuid inquilino_atual FK "1 inquilino vinculado"
    }

    TAXAS_EXTRAS {
        uuid id PK
        uuid unidade_id FK
        text descricao "ex: Taxa de Poço Artesiano"
        numeric valor "ex: 30.00"
        text periodicidade "mensal"
        boolean ativa "true"
    }

    CONTRATOS {
        uuid id PK
        text numero "formato 001/2026"
        uuid unidade_id FK "vínculo obrigatório"
        numeric valor_aluguel
        daterange vigencia
    }
```

---  

## Rastreabilidade e Ciclo de Vida da Unidade

O ciclo de vida da unidade habitacional ou comercial é independente das demais unidades do mesmo imóvel:  
**`VAGA ⇄ ALUGADA ⇄ EM_MANUTENCAO ⇄ INATIVA`**  
  
| Transição | Quando ocorre |  
|---|---|  
| `(criação)` → `VAGA` | Unidade cadastrada com seus códigos de energia, água e taxas associadas |  
| `VAGA` → `ALUGADA` | Ativação de contrato de locação apontando para a unidade com 1 inquilino vinculado |  
| `ALUGADA` → `VAGA` | Encerramento ou rescisão do contrato de locação da unidade |  
| `VAGA` ⇄ `EM_MANUTENCAO` | Indicação de reformas, pintura ou troca de fiação/encanamento na unidade |  
| `VAGA` → `INATIVA` | Desativação da unidade (ex: reintegração da área a outra unidade) |  

### **1. Taxas de Condomínio e Taxas Extras Customizáveis**  
  
- **Taxa de Condomínio:**
  - Se `tem_condominio = true`, o campo `valor_condominio` torna-se obrigatório. Esse valor é somado na composição da cobrança mensal enviada ao inquilino.
- **Taxas Extras Customizáveis (`TAXAS_EXTRAS`):**
  - Permite adicionar N taxas fixas vinculadas à unidade.
  - Caso padrão implementado: **Taxa de Poço Artesiano** (R$ 30,00/mês), cobrada em imóveis que compartilham poço em substituição ou complemento à rede pública.
  - Outras taxas suportadas: Taxa de Limpeza de Fossa, Fundo de Reserva, Internet Coletiva.
  
### **2. Códigos de Fornecimento de Água e Energia**  
  
| Campo | Finalidade Operacional | Validação |  
|---|---|---|  
| `codigo_energia` | Identificador da conta de energia elétrica (instalação/unidade consumidora) | Texto alfanumérico, visível na ficha da unidade |  
| `codigo_agua` | Identificador da conta de água/saneamento (hidrômetro/RGI) | Texto alfanumérico, visível na ficha da unidade |  
| Vistoria de Saída | Verificação de débitos nas concessionárias pelo código | Permite ao operador consultar débitos pendentes no encerramento |  

---

## Comparativo V1 x V2
  
| Critério | V1 —> Imóvel Plano | V2 —> Árvore Hierárquica Águia Systems |  
|---|---|---|  
| Estrutura de Cadastro | 1 nível apenas | 2 níveis: Imóvel Macro → Unidades Filhas |  
| Vínculo do Contrato | Direto no Imóvel | Atrelado à Unidade específica |  
| Códigos de Energia e Água | Inexistentes | Armazenados por unidade para gestão de consumo |  
| Gestão de Condomínio | Apenas despesa genérica | Taxa de condomínio parametrizada na unidade |  
| Taxas Extras Customizáveis | Não suportadas | Suporte a taxas como taxa de poço (R$ 30,00) |  
| Proporção de Inquilinos | Ambígua | 1 inquilino vinculado por unidade |  

---  
  
## Importante (Impacto e Observações)
  
- **Escalabilidade Sem Limite de Inquilinos:** A holding pode gerenciar dezenas de inquilinos em um único imóvel macro (como um condomínio de vilas ou prédio), pois a validação de sobreposição temporal opera por `unidade_id`.  
- **Composição da Cobrança:** O valor total da cobrança mensal da unidade passa a ser calculado pela fórmula:  
  $$\text{Total Mensal} = \text{Aluguel} + \text{Condomínio (se houver)} + \sum(\text{Taxas Extras (ex: Poço)})$$  
- **Facilidade em Vistorias:** Os códigos das concessionárias impressos no contrato e na ficha da unidade agilizam a conferência de quitação de água e luz na entrega das chaves.
