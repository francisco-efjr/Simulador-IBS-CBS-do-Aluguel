# Referências do estudo de produto

> Referências no padrão **ABNT NBR 6023:2018**. Cada artigo traz a síntese em poucas linhas, com
> palavras nossas, a ideia que serve a este produto e onde ela foi aplicada. Nada aqui é transcrição:
> quem quiser o argumento completo deve ler o original.

## Como o estudo foi feito

A pasta de estudo tem 99 artigos dos anais do **27º Congresso Mundial da IPMA** (International
Project Management Association), publicados em *Procedia — Social and Behavioral Sciences*, v. 119,
2014. Não é um livro sobre Product Owner: a maior parte trata de obras, megaprojetos, parcerias
público-privadas, ensino e maturidade de gerenciamento de projetos.

1. **Triagem pelo título e pelo resumo** dos 99 artigos, procurando o que toca o papel de dono do
   produto (valor, prioridade, partes interessadas, decisão, mudança, sucesso, incerteza) e o domínio
   (imóveis, conciliação, sistemas web de gestão).
2. **Leitura integral de 11 artigos** (marcados **[integral]** abaixo) e **leitura parcial** — resumo,
   método e conclusão — **de 4** (marcados **[parcial]**).
3. Para cada um, registro da ideia central e de onde ela entra no produto.

Os números de página citados são os do intervalo publicado de cada artigo, nunca de um trecho
específico.

### O que ficou de fora e por quê

| Grupo de artigos | Exemplos | Motivo do descarte |
| :-- | :-- | :-- |
| Obras, BIM, custo de construção, produtividade de mão de obra | BIM & 5D; Roof Types; Planning Engineers' Estimates; Integrated Project Delivery | Tratam de executar obra, não de gerir carteira de aluguéis |
| Megaprojetos, PPP, infraestrutura pública | Risk Management in Megaprojects; PPP Model; Partnering in Infrastructure | Escala e governança públicas sem paralelo com uma holding familiar |
| Ensino, competências e maturidade de gerentes | Teaching OPM; Key Competences of Public Sector; Maturity Models | Falam do profissional, não do produto |
| Portfólio corporativo e PMO | Models of PMO; Portfolio Manager's Role; New Methodological Approaches to PPM | Supõem vários projetos e equipes; aproveitamos só o de priorização (Purnus e Bodea) |
| Temas alheios | Kindergarten; Eyjafjallajökull; Stress Detection; Croatian Marketing | Sem relação com o produto |
| Valor por risco com cálculo financeiro pesado | Risk-based Project Value (Sato) | Lido o resumo: exige rede de atividades e probabilidades que o produto não tem |

---

## Artigos usados

### 1. Stare — agilidade em desenvolvimento de produto [integral]

STARE, Aljaž. Agile project management in product development projects. **Procedia — Social and
Behavioral Sciences**, [Amsterdam], v. 119, p. 295-304, 2014. DOI: 10.1016/j.sbspro.2014.03.034.

- **Síntese.** Pesquisa-piloto com 21 projetos de desenvolvimento de produto em cinco empresas
  eslovenas. Separa as práticas ágeis em quatro grupos — requisitos, cronograma, equipe e colaboração
  do cliente — e mede qual delas se associa a projeto no prazo e a sucesso financeiro. A amostra é
  pequena e o próprio autor pede cautela, mas três correlações aparecem com significância: dar
  **peso de importância às funções** anda junto com menos atraso e menos estouro de custo; **cortar
  as funções menos importantes** anda junto com mais sucesso financeiro; e o **cliente testar as
  entregas parciais** com regularidade também.
- **Ideia aplicável.** Ordenar o backlog por valor, tirar dele o que vale pouco e pôr o usuário para
  conferir cada entrega são as três alavancas com evidência. É exatamente o trabalho do PO.
- **Onde entra.** Método de priorização e regra de corte do [backlog](backlog.md#método-de-priorização);
  "demonstração ao usuário" na [Definition of Done](backlog.md#definition-of-done-dod); a exigência de
  critério de aceitação testável em cada [história](historias-e-cenarios.md).

### 2. Crawford — equilíbrio entre estratégia e entrega [integral]

CRAWFORD, Lynn. Balancing strategy and delivery: the executive view. **Procedia — Social and Behavioral
Sciences**, [Amsterdam], v. 119, p. 857-866, 2014. DOI: 10.1016/j.sbspro.2014.03.096.

- **Síntese.** Entrevistas com executivos de seis setores sobre o que decide o desempenho de uma
  empresa. Em todos, **desempenho financeiro** e **capacidade de execução** aparecem no topo; em
  finanças, pesa ainda a **previsibilidade** — acertar o que se disse que ia acontecer. A autora
  propõe que quem gerencia projetos torne explícita a ligação entre o que entrega e o que preocupa a
  direção.
- **Ideia aplicável.** Para o sócio, o produto vale pelo que ele responde: "quanto entrou, quanto saiu,
  o que vai vencer". Cada item de backlog precisa dizer a qual objetivo da família serve.
- **Onde entra.** [Product Goal](README.md#product-goal) formulado em termos de resultado (fechar o mês,
  não esquecer reajuste nem IPTU); persona do [sócio](personas.md#1-seu-antônio--sócio-fundador); coluna
  "serve a qual objetivo" no [backlog](backlog.md).

### 3. Johansen, Eik-Andresen e Ekambaram — benefício por parte interessada [integral]

JOHANSEN, Agnar; EIK-ANDRESEN, Petter; EKAMBARAM, Anandasivakumar. Stakeholder benefit assessment:
project success through management of stakeholders. **Procedia — Social and Behavioral Sciences**,
[Amsterdam], v. 119, p. 581-590, 2014. DOI: 10.1016/j.sbspro.2014.03.065.

- **Síntese.** Quinze anos de oficinas de incerteza mostram que os projetos listam ameaças com
  facilidade e quase nunca oportunidades; quando perguntam primeiro pelas oportunidades, aparecem
  muito mais ideias. Cada parte interessada enxerga oportunidade a partir do próprio papel, e
  aproveitá-la exige alguém com autoridade para mudar o plano. Os autores sugerem perguntar, para cada
  mudança, **quem ganha** com ela.
- **Ideia aplicável.** O PO é quem tem a autoridade para aceitar mudança de plano quando ela vale a
  pena, e o mapa de partes interessadas deve dizer o benefício de cada uma, não só o risco.
- **Onde entra.** Mapa de [partes interessadas](README.md#partes-interessadas) com a coluna "o que ganha";
  seção "oportunidades" do [backlog](backlog.md#oportunidades-antes-das-ameaças); o inquilino tratado como
  parte interessada que também ganha (recibo discriminado, cobrança correta).

### 4. Serrador e Turner — eficiência não é sucesso [integral]

SERRADOR, Pedro; TURNER, J. Rodney. The relationship between project success and project efficiency.
**Procedia — Social and Behavioral Sciences**, [Amsterdam], v. 119, p. 75-84, 2014.
DOI: 10.1016/j.sbspro.2014.03.011.

- **Síntese.** Levantamento com 1.386 projetos. Cumprir prazo, custo e escopo explica só parte da
  satisfação das partes interessadas (os autores relatam R² de cerca de 0,36); o resto vem de o
  resultado servir para o que se esperava. Entre os três itens de eficiência, **escopo** é o que mais
  se relaciona com o sucesso percebido.
- **Ideia aplicável.** "Pronto" não basta: a entrega tem de ser usada e resolver. Por isso a DoD inclui
  critério de uso real, e o Product Goal é medido por resultado na operação, não por número de telas.
- **Onde entra.** Indicadores do [Product Goal](README.md#product-goal); DoD com "funciona com dado real da
  holding"; justificativa para a nota de **valor ao usuário** pesar mais que o tamanho no
  [WSJF](backlog.md#método-de-priorização).

### 5. Ramos e Mota — sucesso e fracasso em projetos de TI no Brasil [integral]

RAMOS, Pâmela; MOTA, Caroline. Perceptions of success and failure factors in information technology
projects: a study from Brazilian companies. **Procedia — Social and Behavioral Sciences**, [Amsterdam],
v. 119, p. 349-357, 2014. DOI: 10.1016/j.sbspro.2014.03.040.

- **Síntese.** Entrevistas com gerentes de dez empresas de TI brasileiras e questionário em 33. A falta
  de **comunicação** é o fator de fracasso mais lembrado; linguagem técnica demais afasta o cliente;
  partes interessadas formam percepções diferentes quando não têm voz; e o processo de decisão lento
  gera insatisfação.
- **Ideia aplicável.** Para um público de 40 a 90 anos, a linguagem é requisito, não acabamento.
  Mensagens de erro dizem o que fazer; o feed de novidades fala sem jargão; o dono do produto decide
  rápido e registra a decisão.
- **Onde entra.** Critério "mensagem diz o que fazer" na [Definition of Ready](backlog.md#definition-of-ready-dor)
  e na DoD; [personas](personas.md) com necessidades de leitura; registro de decisões no
  [backlog](backlog.md#decisões-pendentes-do-dono).

### 6. Haselberger e Motschnig — mudança em ambiente complexo [integral]

HASELBERGER, David; MOTSCHNIG, Renate. Dealing with change in a complex environment from a
person-centered, systemic perspective. **Procedia — Social and Behavioral Sciences**, [Amsterdam],
v. 119, p. 268-277, 2014. DOI: 10.1016/j.sbspro.2014.03.031.

- **Síntese.** Oficina com gerentes de TI sobre resistência a mudar a forma de trabalhar. Conclusões:
  a pergunta de cada pessoa é "por que eu deveria mudar?"; **visão compartilhada** e **vocabulário
  comum** reduzem mal-entendidos; a mudança anda melhor com um exemplo a seguir e num clima em que
  errar é permitido.
- **Ideia aplicável.** A família troca planilha e papel pelo sistema. Cada entrega precisa responder
  "o que eu ganho com isso" para quem opera, e o produto precisa de um **glossário** único (competência,
  baixa, conciliação, parcial) usado igual na tela, no relatório e na documentação.
- **Onde entra.** Coluna "para" (valor) obrigatória em toda [história](historias-e-cenarios.md);
  [glossário](README.md#glossário) no README; plano de adoção por persona em [personas](personas.md).

### 7. du Preez — conciliação como base da gestão de reclamações [integral]

DU PREEZ, Olive. Conciliation: a founding element in claims management. **Procedia — Social and
Behavioral Sciences**, [Amsterdam], v. 119, p. 115-123, 2014. DOI: 10.1016/j.sbspro.2014.03.015.

- **Síntese.** Em obras na África do Sul, diferenças entre as partes viram disputa quando não são
  resolvidas cedo, no local, por acordo. A conciliação — negociação facilitada em que as próprias
  partes decidem, com consenso, continuidade da relação e confidencialidade — evita custo e tempo de
  arbitragem, e o acordo deve ser **registrado por escrito**.
- **Atenção ao termo.** O artigo trata de **conciliação de conflitos**, não de conciliação bancária. O
  que se aproveita é o princípio: **divergência pequena, tratada cedo e registrada, não vira disputa**.
- **Ideia aplicável.** Aluguel pago a menor, pago em duplicidade ou fora do dia é uma divergência com o
  inquilino. O sistema deve mostrá-la no dia em que o extrato chega, deixar registrar o que foi
  combinado e manter a relação — não esperar o fim do ano.
- **Onde entra.** Regras propostas [RN-FIN-09](regras-de-negocio.md#rn-fin-09) (recebimento parcial com
  saldo em aberto e registro do combinado) e [RN-FIN-08](regras-de-negocio.md#rn-fin-08) (conciliar
  contra a receita prevista); história H-17 em [histórias](historias-e-cenarios.md).

### 8. Zujo, Car-Pusic e Zileska-Pancovska — estimativa de valor de imóvel [integral]

ZUJO, Vahida; CAR-PUSIC, Diana; ZILESKA-PANCOVSKA, Valentina. Cost and experience based real estate
estimation model. **Procedia — Social and Behavioral Sciences**, [Amsterdam], v. 119, p. 672-681,
2014. DOI: 10.1016/j.sbspro.2014.03.075.

- **Síntese.** Modelo em planilha para estimar valor de mercado de imóvel pelo método do custo: valor de
  construção novo, menos depreciação pela idade, mais terreno e custos acessórios, multiplicado por um
  fator de mercado (localização, entorno, oferta e procura). Os autores lembram que sem metodologia
  única a estimativa gera dúvida e disputa.
- **Ideia aplicável.** O campo `valor_estimado` do imóvel hoje é um número solto. Para o sócio decidir
  vender, reformar ou manter, a estimativa precisa dizer **como foi feita e quando** (método, data,
  quem estimou). A reforma de um imóvel vago é justamente um dos usos que o artigo prevê para o modelo.
- **Onde entra.** Regra proposta [RN-IMV-06](regras-de-negocio.md#rn-imv-06) (valor estimado com data e
  método) e item de backlog correspondente; persona do sócio.

### 9. Hanák e Korytárová — estimativa de danos a imóveis [integral]

HANÁK, Tomáš; KORYTÁROVÁ, Jana. Estimating large-scale damages to real property. **Procedia — Social
and Behavioral Sciences**, [Amsterdam], v. 119, p. 829-836, 2014. DOI: 10.1016/j.sbspro.2014.03.093.

- **Síntese.** Metodologia tcheca para estimar dano de enchente a imóveis de uma região: primeiro o
  valor dos imóveis por categoria de área, depois o percentual de dano por intensidade do evento. A
  principal limitação apontada é a **falta de dado atualizado do valor dos imóveis** e de histórico de
  sinistros; os preços precisam ser atualizados por índice.
- **Ideia aplicável.** Mesmo numa carteira pequena, seguro e sinistro dependem de ter valor e histórico
  à mão. O produto já tem o tipo de obrigação "seguro" em IPTU e taxas e despesas por imóvel; falta
  juntar o histórico de sinistros e manter o valor de referência atualizado.
- **Onde entra.** Oportunidade registrada no [backlog](backlog.md#oportunidades-antes-das-ameaças)
  (histórico de sinistros por imóvel), sem regra nova nesta rodada — o valor é real, mas baixo diante do
  resto.

### 10. Rocha — decidir como decidir [integral]

ROCHA, Luiz. Beyond project decisions: deciding on how to decide. **Procedia — Social and Behavioral
Sciences**, [Amsterdam], v. 119, p. 40-45, 2014. DOI: 10.1016/j.sbspro.2014.03.007.

- **Síntese.** O autor, vice-presidente da IPMA Brasil, argumenta que decisões são um processo social e
  não um evento, e que é preciso **desenhar o processo de decisão** antes de decidir. Propõe a
  governança de projetos com alinhamento à estratégia, gestão de riscos, papéis claros, engajamento das
  partes interessadas — primeiro alinhando os de dentro, depois os de fora — e avaliação periódica.
- **Ideia aplicável.** Quem decide o quê fica escrito: o dono do produto ordena o backlog; o
  administrador concede acesso; a regra legal é conferida com o advogado ou a contadora antes de virar
  código. Alinhar a família antes de falar com inquilinos e fornecedores.
- **Onde entra.** Seção [Como o backlog é gerido](README.md#como-o-backlog-é-gerido) (quem decide, com que
  frequência); lista de [decisões pendentes do dono](backlog.md#decisões-pendentes-do-dono).

### 11. Purnus e Bodea — priorização e desempenho da carteira [integral]

PURNUS, Augustin; BODEA, Constanta-Nicoleta. Project prioritization and portfolio performance
measurement in project oriented organizations. **Procedia — Social and Behavioral Sciences**,
[Amsterdam], v. 119, p. 339-348, 2014. DOI: 10.1016/j.sbspro.2014.03.039.

- **Síntese.** Critica a priorização por um só critério (em geral, lucro) e o tratamento determinístico
  dos números. Simula cinco esquemas de prioridade numa carteira de obras e mostra que mudar o critério
  muda o resultado; em ambiente de caixa apertado, esquemas que olham o **fluxo de caixa** se saem
  melhor que o de lucro máximo. Conclui que a priorização é **contínua**: muda quando o contexto muda.
- **Ideia aplicável.** Prioridade por vários critérios, revista a cada ciclo. Para a holding, o fluxo de
  caixa (aluguel que entra no dia, reajuste que não se perde) é critério explícito.
- **Onde entra.** WSJF com três componentes de custo do atraso no [backlog](backlog.md#método-de-priorização)
  e revisão da ordem a cada entrega.

### 12. Johansen, Halvorsen, Haddadi e Langlo — gestão da incerteza em nove passos [parcial]

JOHANSEN, Agnar; HALVORSEN, Siri Bøe; HADDADI, Amin; LANGLO, Jan Alexander. Uncertainty management: a
methodological framework beyond "the six W's". **Procedia — Social and Behavioral Sciences**,
[Amsterdam], v. 119, p. 566-575, 2014. DOI: 10.1016/j.sbspro.2014.03.063.

- **Síntese (resumo e conclusão).** Propõe tratar a incerteza como processo contínuo, olhando as
  incertezas dos **próximos 3 a 6 meses**, com acompanhamento mensal e revisão geral uma ou duas vezes
  por ano; ferramentas simples (planilha e cavalete) bastam.
- **Onde entra.** Cadência de revisão do backlog e da lista de riscos em [Como o backlog é
  gerido](README.md#como-o-backlog-é-gerido): horizonte de 3 a 6 meses, revisão mensal.

### 13. Ozorhon, Karatas e Demirkesen — sistema web como memória da organização [parcial]

OZORHON, Beliz; KARATAS, Cenap G.; DEMIRKESEN, Sevilay. A web-based database system for managing
construction project knowledge. **Procedia — Social and Behavioral Sciences**, [Amsterdam], v. 119,
p. 377-386, 2014. DOI: 10.1016/j.sbspro.2014.03.043.

- **Síntese (resumo, avaliação e conclusão).** Um sistema web de documentos e decisões funciona como
  **memória da organização**; os usuários o acharam útil, mas previram que a adoção levaria tempo pelo
  hábito antigo.
- **Onde entra.** Justifica tratar a trilha de auditoria e os anexos como ativo do produto (regras
  RN-AUD) e prever a adoção gradual nas [personas](personas.md).

### 14. Obradovic *et al.* — ferramentas web e competência de gestão [parcial]

OBRADOVIC, Vladimir; JOVANOVIC, Petar; PETROVIC, Dejan; MIHIC, Marko; BJELICA, Dragan. Web-based project
management influence on project portfolio managers' technical competencies. **Procedia — Social and
Behavioral Sciences**, [Amsterdam], v. 119, p. 387-396, 2014. DOI: 10.1016/j.sbspro.2014.03.044.

- **Síntese (resumo, resultados e conclusão).** Pesquisa com 51 gestores: os módulos de ferramenta web
  que mais ajudam são os de **recursos** e **finanças**; o de informação e documentação foi o menos
  valorizado e o de maior dispersão de opinião.
- **Onde entra.** Reforça dar prioridade ao núcleo financeiro (conciliação, receitas previstas, reajuste)
  sobre funcionalidades de documento no [backlog](backlog.md).

### 15. Gardiner — criar e apropriar valor [parcial]

GARDINER, Paul D. Creating and appropriating value from project management resource assets using an
integrated systems approach. **Procedia — Social and Behavioral Sciences**, [Amsterdam], v. 119,
p. 85-94, 2014. DOI: 10.1016/j.sbspro.2014.03.012.

- **Síntese (introdução e conclusão).** Descreve a passagem de "fazer os projetos direito" para "fazer
  os projetos certos" e aponta o conhecimento tácito e a liderança como fonte de valor; relata que
  lições aprendidas só funcionam onde errar não é punido.
- **Onde entra.** Apoio à definição do papel do PO no [README](README.md#o-papel-do-product-owner-neste-produto)
  (escolher o que fazer, não só fazer bem).

---

## Outras fontes (não vêm dos artigos)

Usadas para o que os artigos não cobrem. São conhecimento consolidado da área ou norma legal.

| Fonte | Uso neste material |
| :-- | :-- |
| SCHWABER, Ken; SUTHERLAND, Jeff. **The Scrum Guide**: the definitive guide to Scrum: the rules of the game. [S. l.]: Scrum.org, nov. 2020. | Responsabilidade (*accountability*) do PO, Product Goal, Product Backlog, Definition of Done |
| WAKE, Bill. INVEST in good stories, and SMART tasks. **XP123**, 17 ago. 2003. | Checagem INVEST das histórias |
| CUCUMBER. **Gherkin reference**. [S. l.]: Cucumber, [2024]. | Palavras-chave em português (`Funcionalidade`, `Contexto`, `Cenário`, `Esquema do Cenário`, `Exemplos`, `Dado/Quando/Então/E/Mas`) |
| REINERTSEN, Donald G. **The principles of product development flow**: second generation lean product development. Redondo Beach: Celeritas, 2009. | Custo do atraso e sequenciamento pelo menor trabalho de maior custo de atraso (WSJF) |
| CLEGG, Dai; BARKER, Richard. **Case method fast-track**: a RAD approach. Wokingham: Addison-Wesley, 1994. | Classificação MoSCoW |
| MOORE, Geoffrey A. **Crossing the chasm**. New York: HarperBusiness, 1991. | Modelo da frase de visão do produto |
| W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. [S. l.]: W3C, 2023. | Acessibilidade na DoD |
| BRASIL. Lei nº 8.245, de 18 de outubro de 1991. Dispõe sobre as locações dos imóveis urbanos e os procedimentos a elas pertinentes. **Diário Oficial da União**, Brasília, DF, 21 out. 1991. | Garantias (arts. 37 e 38), multa proporcional (art. 4º), obrigações de locador e locatário (arts. 22 e 23), aluguel (art. 17) |
| BRASIL. Lei nº 10.192, de 14 de fevereiro de 2001. Dispõe sobre medidas complementares ao Plano Real. **Diário Oficial da União**, Brasília, DF, 16 fev. 2001. | Reajuste com periodicidade mínima anual (art. 2º, § 1º) |
| BRASIL. Lei nº 5.172, de 25 de outubro de 1966 (Código Tributário Nacional). **Diário Oficial da União**, Brasília, DF, 27 out. 1966. | IPTU (art. 32) |
| BRASIL. Emenda Constitucional nº 132, de 20 de dezembro de 2023. **Diário Oficial da União**, Brasília, DF, 21 dez. 2023. | Reforma Tributária (IBS/CBS) |
| BRASIL. Lei Complementar nº 214, de 16 de janeiro de 2025. **Diário Oficial da União**, Brasília, DF, 16 jan. 2025. | Regime de bens imóveis no IBS/CBS — os artigos usados pelo simulador estão em [`docs/simulador.md`](../simulador.md) |
| BRASIL. Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais). **Diário Oficial da União**, Brasília, DF, 15 ago. 2018. | Dados do inquilino (regra proposta RN-INQ-06) |
| BRASIL. Receita Federal. Instrução Normativa RFB nº 2.229, de 2024. | CNPJ alfanumérico — citada na migração [`20260919120001_regras_de_negocio.sql`](../../supabase/migrations/20260919120001_regras_de_negocio.sql); **conferir a data exata antes de citar em documento externo** |

> **Aviso.** As regras que tocam a Lei do Inquilinato, o IPTU e a Reforma Tributária foram redigidas a
> partir da leitura da lei, não de parecer jurídico. Antes de virar código, cada uma passa pela
> conferência da contadora ou do advogado da holding — ver
> [decisões pendentes](backlog.md#decisões-pendentes-do-dono).
