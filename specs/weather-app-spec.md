# Especificação de Produto — Weather App

> **Fonte de contexto:** [discovery.md](./discovery.md) · **Fase SDD:** Spec  
> **Status:** Proposta para validação · **Idioma da interface:** pt-BR

## 1. Overview

### 1.1 Visão geral

Aplicação web responsiva para buscar uma cidade e consultar seu clima atual e
a previsão diária para hoje e os quatro dias seguintes. A interface é em
português do Brasil, não exige autenticação e apresenta temperaturas em Celsius
inicialmente, com opção de alternar para Fahrenheit.

### 1.2 Objetivos

- Permitir identificar e selecionar a localidade correta, inclusive entre
  cidades homônimas.
- Ajudar na consulta rápida do clima atual e no planejamento dos próximos dias.
- Tornar busca, consulta e escolha de unidade utilizáveis em dispositivos
  móveis e nos demais dispositivos suportados.
- Comunicar estados de carregamento, ausência de resultados e falhas sem
  apresentar dados incompletos como se fossem completos.

### 1.3 Usuários-alvo

As personas de Marina, Rafael e Camila são hipóteses de discovery, não segmentos
validados. Representam, respectivamente, consulta rápida em contexto móvel,
planejamento de atividades e busca por localidades desconhecidas ou homônimas.

### 1.4 Não-objetivos (resumo)

Não fazem parte do escopo atual aplicativo nativo, autenticação, persistência
de dados no servidor, consulta obrigatória por localização do dispositivo ou
funcionamento offline. Ver [Out of Scope](#9-out-of-scope).

### 1.5 Prontidão para desenvolvimento

**Não está pronta para desenvolvimento completo e aceite de produção sem
decisões adicionais.** A equipe pode iniciar protótipos e trabalho reversível
com o escopo mínimo descrito, mas os bloqueios de produto e de qualidade em
[Open Questions](#10-open-questions) devem ser resolvidos antes de fechar os
critérios de implementação e lançamento. As demais questões estão explicitamente
fora do MVP ou podem ser decididas depois.

## 2. Functional Requirements

Cada requisito tem critérios de aceite na
[seção 4](#4-acceptance-criteria). Os campos mínimos listados nesta seção são
uma base proposta para validar respostas parciais; confirmar sua composição é
uma questão de negócio em aberto.

- **RF-01 — Buscar e selecionar cidades:** permitir informar e submeter
  explicitamente um termo de cidade,
  apresentar resultados que permitam distinguir localidades (nome e, quando
  disponível, região/estado e país) e exigir seleção explícita antes de
  consultar o clima. A busca usa Open-Meteo como fonte, sem API key. Espaços
  externos não alteram a consulta; caracteres válidos, inclusive acentos e
  pontuação de nomes, devem ser aceitos. Autocomplete não é requisito do MVP.
- **RF-02 — Consultar clima atual:** para a localidade selecionada, apresentar
  temperatura e condição meteorológica, com a unidade da temperatura visível.
  São os campos mínimos propostos para o MVP; sua aprovação é bloqueante para
  fechar a especificação. Sensação térmica, umidade, velocidade do vento e
  horário de atualização não são garantidos no MVP. Se aprovados para inclusão,
  devem ter unidade/contexto identificável e nunca ser inventados quando
  ausentes.
- **RF-03 — Consultar previsão de cinco dias:** apresentar dados diários para
  hoje e os quatro dias locais seguintes. Data e temperaturas mínima e máxima
  são os campos mínimos propostos para cada dia; sua aprovação é bloqueante
  para fechar a especificação. Descrição/ícone da condição e outras métricas
  não são garantidos no MVP. O dia é determinado pelo calendário/fuso local da
  cidade.
- **RF-04 — Alternar unidade de temperatura:** iniciar em Celsius e permitir
  alternar para Fahrenheit. A unidade escolhida aplica-se a todas as
  temperaturas do MVP (temperatura atual e mínimas/máximas). Se campos
  complementares de temperatura forem aprovados, também usarão a unidade
  ativa. Persistência da escolha entre sessões não está definida.
- **RF-05 — Usar em dispositivos móveis e desktop:** permitir executar busca,
  seleção, consulta e alternância de unidade em telas móveis e desktop, sem
  exigir instalação.
- **RF-06 — Comunicar estados e recuperar falhas:** indicar carregamento,
  resultados vazios e falhas de busca ou de cada seção meteorológica. Oferecer
  nova tentativa para a operação que falhou, sem descartar dados de outra
  seção que tenha carregado com sucesso.

## 3. User Stories

- **US-01 (Marina; RF-01, RF-02):** Como pessoa que consulta o clima antes de
  sair, quero buscar minha cidade e ver as condições atuais para decidir o que
  vestir e se preciso me preparar para chuva.
- **US-02 (Rafael; RF-03):** Como pessoa que planeja atividades, quero consultar
  a previsão de hoje e dos quatro dias seguintes para escolher quando realizá-las.
- **US-03 (Camila; RF-01):** Como pessoa que viaja para um destino novo, quero
  distinguir localidades homônimas nos resultados para selecionar a cidade
  correta.
- **US-04 (Camila; RF-04):** Como pessoa familiarizada com Fahrenheit, quero
  alternar a unidade de temperatura para interpretar os valores sem convertê-los
  mentalmente.
- **US-05 (Marina; RF-05):** Como pessoa que consulta o clima pelo celular,
  quero usar as funções principais em uma interface adaptada à tela para
  concluir a consulta com facilidade.
- **US-06 (Marina; RF-06):** Como pessoa que pode estar com conexão instável,
  quero entender se uma consulta está carregando ou falhou e poder tentar de
  novo para recuperar os dados.

## 3.1 Matriz de rastreabilidade

Os identificadores AC apontam para critérios da seção 4. Os RNFs são os
requisitos não funcionais definidos na seção 5.

| User Story | Requisitos funcionais | Acceptance Criteria | RNFs relevantes |
|---|---|---|---|
| US-01 — Buscar cidade e consultar clima atual | RF-01, RF-02 | AC-01.1–AC-01.3, AC-01.5–AC-01.7; AC-02.1–AC-02.5; AC-06.1 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-07 |
| US-02 — Consultar previsão de cinco dias | RF-03, RF-06 | AC-03.1–AC-03.5; AC-06.1–AC-06.4 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-07 |
| US-03 — Distinguir cidades homônimas | RF-01 | AC-01.2–AC-01.5, AC-01.8 | RNF-01, RNF-03, RNF-04, RNF-07 |
| US-04 — Alternar unidade de temperatura | RF-04 | AC-04.1–AC-04.5 | RNF-01, RNF-04 |
| US-05 — Usar funções em dispositivos móveis | RF-05 | AC-05.1–AC-05.2; AC-01.7; AC-06.4 | RNF-01, RNF-02, RNF-04 |
| US-06 — Entender e recuperar falhas | RF-01, RF-02, RF-03, RF-06 | AC-01.1–AC-01.2, AC-01.5–AC-01.6; AC-02.4; AC-03.4; AC-06.1–AC-06.5 | RNF-02, RNF-03, RNF-04, RNF-07 |

Uma faixa de IDs, por exemplo `AC-02.1–AC-02.5`, inclui todos os critérios
numerados dentro daquele requisito. Critérios técnicos transversais como
RNF-02 e RNF-07 aplicam-se aos fluxos que dependem de tempos de resposta e
serviços externos.

## 4. Acceptance Criteria

Os cenários abaixo são verificáveis por interação de interface e respostas
controladas. “Falha” inclui erro do serviço, resposta inválida e expiração do
tempo limite da operação. O limite numérico de timeout permanece pendente;
nos testes de falha, o timeout configurado para o ambiente de teste deve ser
usado como referência.

Os IDs são estáveis para referência em tarefas e testes; não devem ser
renumerados sem atualizar esta matriz.

### RF-01 — Buscar e selecionar cidades (US-01, US-03)

- **AC-01.1 — Given** que o campo de busca está vazio ou contém apenas espaços,
  **When** o usuário tenta pesquisar, **Then** nenhuma solicitação de
  geocodificação é enviada e nenhuma cidade é selecionada.
- **AC-01.2 — Given** que o campo contém um termo não vazio após remover espaços
  externos, **When** o usuário inicia a busca, **Then** a consulta usa o termo
  sem espaços externos, preservando acentos e pontuação interna, e a interface
  mostra o estado de carregamento.
- **AC-01.3 — Given** que a geocodificação retorna uma ou mais localidades,
  **When** os resultados são exibidos, **Then** cada opção mostra o nome da
  cidade e, quando fornecidos, região/estado e país; nenhuma localidade é
  selecionada implicitamente.
- **AC-01.4 — Given** que existem resultados homônimos com região ou país diferentes,
  **When** a lista é exibida, **Then** os atributos de localização disponíveis
  permitem diferenciá-los.
- **AC-01.5 — Given** que uma busca retorna zero resultados, **When** a resposta é
  apresentada, **Then** a interface informa que não encontrou cidades e
  permite alterar o termo sem exibir mensagem de falha de serviço.
- **AC-01.6 — Given** que a geocodificação falha ou excede o timeout configurado,
  **When** a operação termina, **Then** a interface mostra erro de busca e
  permite tentar novamente; não apresenta a falha como “nenhum resultado”.
- **AC-01.7 — Given** que há resultados disponíveis, **When** o usuário seleciona um
  resultado por mouse, toque ou teclado, **Then** a cidade selecionada é
  identificada e a consulta de clima é iniciada para essa localidade.
- **AC-01.8 — Given** que resultados estão disponíveis, **When** o usuário altera o
  termo de busca, **Then** os resultados antigos não podem ser selecionados
  como correspondência ao termo novo.

### RF-02 — Consultar clima atual (US-01)

- **AC-02.1 — Given** que uma cidade foi selecionada e o serviço retorna os campos
  obrigatórios atuais (temperatura e condição), **When** a resposta é exibida,
  **Then** ambos aparecem associados à cidade selecionada e a temperatura
  mostra `°C` ou `°F` conforme a unidade ativa.
- **AC-02.2 — Given** que a resposta atual contém campos complementares, **When** esses
  campos são exibidos, **Then** cada valor mantém seu significado e unidade
  identificáveis; velocidade do vento nunca é apresentada sem unidade.
- **AC-02.3 — Given** que um ou mais campos complementares estão ausentes ou inválidos,
  **When** o clima atual é exibido, **Then** os campos ausentes são omitidos ou
  indicados como indisponíveis e os campos válidos continuam visíveis.
- **AC-02.4 — Given** que falta temperatura ou condição, ou que a resposta atual falha,
  **When** a operação termina, **Then** a seção de clima atual mostra estado
  indisponível/erro e opção de nova tentativa, sem fabricar valores.
- **AC-02.5 — Given** que a resposta atual fornece horário de atualização, **When** esse
  horário é exibido, **Then** ele corresponde ao horário local da cidade; se
  ausente, não é substituído por um horário presumido.

### RF-03 — Consultar previsão de cinco dias (US-02)

- **AC-03.1 — Given** que uma cidade foi selecionada e a previsão contém cinco datas
  locais consecutivas, começando hoje, com mínima e máxima para cada data,
  **When** a previsão é exibida, **Then** há cinco itens, um para hoje e quatro
  para os dias locais seguintes, com data e valores mínimo/máximo.
- **AC-03.2 — Given** que a previsão oferece condição ou métricas complementares,
  **When** esses dados são exibidos, **Then** permanecem associados à data
  correta e qualquer unidade numérica é identificável.
- **AC-03.3 — Given** que um campo complementar de um dia está ausente ou inválido,
  **When** a previsão é exibida, **Then** somente esse campo é omitido ou
  indicado como indisponível; os demais dados válidos permanecem.
- **AC-03.4 — Given** que falta uma data, mínima ou máxima em qualquer dia, há datas
  duplicadas/não consecutivas, ou a resposta da previsão falha, **When** a
  operação termina, **Then** a previsão é marcada como indisponível/erro e
  pode ser tentada novamente, sem afirmar que a previsão completa foi carregada.
- **AC-03.5 — Given** que a cidade está em fuso cujo dia local difere do dia de
  referência do dispositivo, **When** o intervalo de previsão é determinado,
  **Then** hoje e os quatro dias seguintes correspondem ao calendário local
  da cidade, não ao calendário do dispositivo.

### RF-04 — Alternar unidade de temperatura (US-04)

- **AC-04.1 — Given** que é uma nova sessão sem preferência persistida disponível,
  **When** as temperaturas são exibidas, **Then** a unidade inicial é Celsius
  e os valores têm o símbolo `°C`.
- **AC-04.2 — Given** que temperaturas estão visíveis, **When** o usuário seleciona
  Fahrenheit, **Then** todos os valores de temperatura válidos (atual,
  sensação térmica, mínima e máxima) passam a Fahrenheit e mostram `°F`.
- **AC-04.3 — Given** que Fahrenheit está ativo, **When** o usuário seleciona Celsius,
  **Then** todos os valores de temperatura voltam a Celsius e mostram `°C`.
- **AC-04.4 — Given** que existem dados meteorológicos carregados, **When** a unidade é
  alternada, **Then** a escolha não altera cidade, datas, condições nem
  disponibilidade dos dados.
- **AC-04.5 — Given** que há valor de velocidade do vento, **When** a unidade de
  temperatura é alternada, **Then** o vento mantém a unidade própria indicada;
  o controle Celsius/Fahrenheit não converte nem renomeia essa grandeza.

### RF-05 — Usar em dispositivos móveis e desktop (US-05)

- **AC-05.1 — Given** que a aplicação é aberta em viewport de 320 px ou maior, **When**
  o usuário navega pelas funções da aplicação, **Then** busca, resultados,
  clima atual, previsão e controle de unidade permanecem utilizáveis, sem
  rolagem horizontal da página.
- **AC-05.2 — Given** que há resultados ou dados meteorológicos, **When** a interface é
  usada por toque, teclado ou mouse, **Then** as ações de busca, seleção,
  alternância e nova tentativa permanecem acessíveis.

### RF-06 — Comunicar estados e recuperar falhas (US-06)

- **AC-06.1 — Given** que uma busca ou consulta meteorológica foi iniciada, **When** a
  resposta ainda não chegou, **Then** a área correspondente indica carregamento
  e impede que dados antigos sejam apresentados como resposta nova.
- **AC-06.2 — Given** que clima atual e previsão são carregados por operações
  independentes, **When** uma operação falha e a outra tem sucesso, **Then** a
  seção bem-sucedida permanece visível e somente a seção com falha mostra erro
  e opção de nova tentativa.
- **AC-06.3 — Given** que uma tentativa de nova consulta é iniciada para uma seção com
  falha, **When** a tentativa termina, **Then** seu resultado atualiza somente
  essa seção e não apaga dados válidos da outra.
- **AC-06.4 — Given** que uma operação não responde até o timeout configurado,
  **When** o tempo limite é atingido, **Then** a operação termina com mensagem
  de falha recuperável e opção de tentar novamente; a outra operação
  independente não é cancelada por essa expiração.
- **AC-06.5 — Given** que nenhuma cidade foi selecionada, **When** a aplicação é aberta,
  **Then** não solicita localização do dispositivo nem mostra dados
  meteorológicos de uma localidade presumida.

## 5. Non-Functional Requirements

- **RNF-01 — Responsividade:** atender à faixa de viewport a partir de 320 px,
  sem rolagem horizontal da página e com acesso às funções RF-01 a RF-06.
  Navegadores e largura máxima suportados são questões em aberto.
- **RNF-02 — Desempenho:** não há meta de latência aprovada. Antes do aceite
  de produção, stakeholders devem definir os limites para carregamento
  inicial, geocodificação e carregamento de cada conjunto meteorológico. A
  medição deverá registrar percentis, dispositivo, navegador, localidade,
  condições de rede, volume/amostra, início e fim de cada operação. Até a
  definição dos limites, desempenho é meta pendente, não critério de aprovação;
  limites aprovados são bloqueantes para aceite de produção, não para
  prototipagem ou desenvolvimento reversível.
- **RNF-03 — Timeout e disponibilidade:** um timeout deve encerrar a operação
  afetada, apresentar erro recuperável e respeitar a independência entre
  geocodificação, clima atual e previsão. Duração de timeout, disponibilidade
  esperada e política de repetição automática/manual dependem de decisão dos
  stakeholders. Definir o timeout e a política de repetição é bloqueante para
  critérios de aceite de produção; a implementação inicial pode usar um valor
  de ambiente de teste, sem tratá-lo como meta aprovada.
- **RNF-04 — Acessibilidade e usabilidade:** funções principais devem ser
  operáveis por teclado e toque; foco e estado selecionado/carregando/erro
  devem ser perceptíveis; mensagens de estado devem ser identificáveis por
  tecnologias assistivas; texto e controles devem manter contraste e rótulos
  compreensíveis. Padrão e nível de conformidade ainda precisam ser definidos.
- **RNF-05 — Idioma e localização:** interface em pt-BR. Datas e horários
  meteorológicos exibidos referem-se ao fuso local da cidade. Convenções
  adicionais (12/24 horas, nomes locais de localidades internacionais) estão
  em aberto.
- **RNF-06 — Privacidade:** não exigir conta nem persistir dados no servidor.
  A aplicação não solicita geolocalização do dispositivo. Coleta de analytics,
  retenção local e requisitos legais/corporativos precisam ser decididos antes
  de eventual inclusão.
- **RNF-07 — Fonte de dados:** usar Open-Meteo, sem API key, conforme decisão
  registrada em discovery. Cobertura, limites de uso e condições de licença
  devem ser confirmados antes do lançamento.

## 6. Edge Cases

- Busca vazia ou somente espaços: não consultar geocodificação nem substituir
  a busca por uma localidade padrão (RF-01, RF-06).
- Acentos, letras Unicode e pontuação interna em nomes (por exemplo,
  apóstrofos ou hífens): preservar o termo de busca; a resposta pode ter zero
  resultados sem que isso, por si só, signifique entrada inválida (RF-01).
- Nenhum resultado: mensagem de ausência de resultados, distinta de erro de
  rede, resposta inválida ou timeout (RF-01).
- Resultados homônimos ou com metadados regionais ausentes: mostrar todos os
  atributos de localização disponibilizados; não selecionar automaticamente
  uma opção ambígua (RF-01).
- Alteração do termo durante busca pendente: resultados de termo anterior não
  podem ser tratados como resultados atuais; o comportamento de cancelamento
  técnico não é definido por esta especificação (RF-01).
- Geocodificação indisponível/timeout: mostrar falha de busca e permitir
  tentativa posterior; não mostrar estado vazio (RF-01, RF-06).
- Clima atual ou previsão indisponível separadamente: preservar a seção que
  carregou; permitir tentar novamente a seção que falhou (RF-02, RF-03, RF-06).
- Resposta parcialmente preenchida: temperatura e condição são obrigatórias
  para o clima atual; para cada dia da previsão, data local, mínima e máxima
  são obrigatórias. Ausência/invalidez de campo obrigatório invalida apenas
  sua seção. Campo complementar ausente/inválido não invalida a seção e não
  deve gerar valor presumido (RF-02, RF-03).
- Resposta duplicada, fora de ordem ou com menos/mais de cinco datas: não
  declarar uma previsão válida de cinco dias; apresentar falha da previsão
  conforme RF-03.
- Unidade ou valor não reconhecido: não apresentar valor com rótulo incorreto;
  marcar o dado afetado como indisponível. Temperatura deve ser rotulada em
  Celsius/Fahrenheit; vento, se exibido, requer unidade própria (RF-02 a RF-04).
- Timeout de uma operação: terminar apenas a operação correspondente, com
  erro recuperável; o tempo numérico precisa ser decidido e deve ser o mesmo
  parâmetro considerado em critérios, testes e mensagens (RF-06, RNF-03).
- Nenhuma cidade escolhida e permissão de localização disponível/negada:
  não solicitar nem usar localização do dispositivo nesta versão; a consulta
  depende de busca e seleção explícita (RF-01, RF-06).
- Sem conexão ou com falha geral do provedor: mostrar erro de cada operação
  afetada, manter dados válidos que já tenham sido carregados e não prometer
  funcionamento offline (RF-06).

## 7. Assumptions

- Open-Meteo é o provedor meteorológico inicial e não exige API key, conforme
  decisão confirmada em [discovery](./discovery.md).
- “Cinco dias” significa hoje e os quatro dias seguintes no calendário local
  da cidade, conforme decisão confirmada em discovery.
- Celsius é a unidade inicial; Fahrenheit também deve estar disponível,
  conforme decisão confirmada em discovery.
- A interface inicial é pt-BR; não há autenticação nem persistência no servidor,
  conforme decisões confirmadas em discovery.
- O acesso a dados meteorológicos começa por busca e seleção explícita de
  cidade; localização do dispositivo não é obrigatória nem presumida.
- Para tornar respostas parciais testáveis, temperatura e condição atuais e,
  para cada dia, data, mínima e máxima são tratados como campos obrigatórios.
  Essa definição mínima de conteúdo precisa de confirmação de stakeholders;
  outros campos são complementares até essa confirmação.
- O mínimo de 320 px é a referência de teste inicial para responsividade, não
  uma declaração de navegadores suportados nem compromisso de conformidade
  final até aprovação da matriz de suporte.
- As personas e suas métricas de tempo de tarefa de discovery são hipóteses a
  validar com usuários, não metas de performance da aplicação.

## 8. Risks

- **Cobertura, limites ou licença do provedor:** podem impedir cobertura
  pretendida ou uso no lançamento. **Mitigação:** confirmar cobertura,
  limites e condições de uso/licença de Open-Meteo antes de lançar; comunicar
  indisponibilidade sem inventar dados.
- **Ambiguidade na seleção de localidades:** nomes iguais ou metadados
  insuficientes podem levar à consulta da cidade errada. **Mitigação:** exibir
  região/país quando disponíveis e exigir seleção explícita.
- **Dados incompletos ou inconsistentes:** respostas parciais, datas ou unidades
  incorretas comprometem interpretação. **Mitigação:** validar campos
  obrigatórios, ocultar campos opcionais ausentes e identificar unidade.
- **Falhas independentes confundidas:** uma falha de previsão pode esconder
  clima atual válido (ou vice-versa). **Mitigação:** estados, erros e novas
  tentativas independentes por seção, verificados por RF-06.
- **Timeout/desempenho sem metas aprovadas:** critérios incompatíveis podem
  atrasar aprovação ou gerar experiência lenta. **Mitigação:** decidir limites,
  método de medição e política de timeout antes de implementação/lançamento.
- **Usabilidade e acessibilidade não validadas:** uso móvel, teclado ou leitor
  de tela pode ser prejudicado. **Mitigação:** validar os critérios RNF-01 e
  RNF-04; definir formalmente padrão e navegadores suportados.
- **Preferências locais e privacidade indefinidas:** persistir cidade ou unidade
  sem decisão pode surpreender usuários ou criar risco de privacidade.
  **Mitigação:** não assumir persistência; obter decisão antes de introduzi-la.

## 9. Out of Scope

- **Plataforma e acesso:** aplicativos nativos, instalação, uso offline,
  autenticação, contas ou persistência de dados no servidor.
- **Localização e histórico:** geolocalização automática ou por permissão,
  seleção de cidade presumida, histórico de consultas, lembrança de última
  cidade ou persistência local de preferência entre sessões.
- **Busca avançada:** autocomplete/sugestões durante a digitação, busca por
  coordenadas/endereço, filtros, ordenação configurável ou busca em lote.
  No MVP, a consulta começa por submissão explícita de termo de cidade.
- **Dados meteorológicos além do mínimo:** vento, sensação térmica, umidade,
  horário de atualização, ícones/descrições complementares e demais métricas
  não são compromisso do MVP até aprovação explícita. Em particular, vento
  não será exibido no MVP sem decisão de inclusão e unidade.
- **Outras capacidades:** alertas, notificações, mapas, widgets, compartilhamento,
  previsão além dos cinco dias definidos, histórico meteorológico, comparação
  de cidades ou integração com provedores adicionais.
- **Garantias não aprovadas:** SLA/disponibilidade, metas numéricas de
  desempenho, navegadores não definidos e conformidade com nível de
  acessibilidade ainda não aprovado.

## 10. Open Questions

As questões abaixo estão classificadas para não confundir bloqueios de
especificação/produção com decisões que podem aguardar além do MVP.

### Bloqueios para fechar critérios de produção

1. **Aprovação do conteúdo mínimo meteorológico:** confirmar temperatura e
   condição como campos obrigatórios do clima atual e data, mínima e máxima
   como campos obrigatórios de cada dia. A spec usa esses campos para definir
   resposta parcial; sem aprovação, não há contrato de conteúdo final.
2. **Metas de desempenho e timeout:** definir limites mensuráveis para
   carregamento inicial, geocodificação, clima atual e previsão; dispositivo,
   rede e percentis da medição; duração do timeout por operação e política de
   nova tentativa. Sem isso, não é possível aprovar desempenho nem o
   comportamento de expiração em produção.
3. **Matriz de suporte e acessibilidade:** definir navegadores/sistemas e
   padrão/nível de acessibilidade exigidos para o lançamento. O viewport de
   320 px e os requisitos funcionais de acessibilidade desta spec são
   referências provisórias, não uma matriz de conformidade aprovada.
4. **Liberação do provedor:** confirmar cobertura requerida e limites/condições
   de uso e licença de Open-Meteo antes do lançamento. A escolha do provedor
   está confirmada; a aptidão para a cobertura/uso final não está.

Esses bloqueios impedem declarar a especificação pronta para produção, mas não
impedem prototipagem nem desenvolvimento reversível do escopo mínimo. Vento e
outros campos complementares estão explicitamente excluídos do MVP; não são
bloqueio enquanto não forem adicionados ao escopo.

### Decisões pós-MVP ou não bloqueantes para o escopo mínimo

1. **Busca avançada:** tamanho máximo/ordenação da lista, número mínimo de
   caracteres e inclusão futura de autocomplete. O MVP usa submissão explícita
   e seleção de resultados; metadados de região/país são exibidos quando
   fornecidos.
2. **Unidades de outras grandezas:** decidir unidade e convenção regional para
   vento ou outras métricas somente se forem aprovadas para uma versão futura.
   Celsius/Fahrenheit para temperatura já está decidido.
3. **Preferências locais:** decidir se unidade ou última cidade serão lembradas
   entre sessões. Não são persistidas no MVP.
4. **Localização cultural:** decidir formatos de hora (12/24 h) e tratamento de
   nomes locais para cidades fora do Brasil, além do fuso local requerido para
   delimitar os dias.
5. **Operação e privacidade além do mínimo:** definir meta de disponibilidade,
   responsáveis por incidentes, analytics, requisitos legais/corporativos e
   retenção antes de incluir monitoramento/coleta ou compromissos de SLA.
6. **Métricas de sucesso:** validar em pesquisa se as metas hipotéticas de
   discovery (Marina: até 30 s; Rafael: até 1 min; Camila: até 45 s) são
   apropriadas; não são metas de latência do sistema nem bloqueiam a construção.

---

> **Próxima fase:** Plan Agent → `plans/weather-app-plan.md`, consumindo esta
> especificação e mantendo as questões acima explícitas.
