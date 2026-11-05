# Backlog de Tarefas — Weather App

> Derivado de `plans/weather-app-plan.md` e rastreável aos requisitos e critérios
> de `specs/weather-app-spec.md`. Os campos mínimos de clima ainda dependem de
> aprovação de stakeholders; as tarefas implementam o contrato provisório do
> plano, sem incluir métricas complementares fora do MVP.
>
> Os IDs existentes foram preservados; a ordem de execução é definida pelas
> entregas e dependências, não pela ordem numérica dos IDs.

## Entrega 1 — Tipos do domínio

### T-01 — Definir os tipos do domínio
- **Tipo:** Data
- **Descrição:** Criar os contratos compartilhados de unidade, cidade, clima atual, previsão, dados meteorológicos, estado assíncrono e erro.
- **Critérios de aceite:** `pnpm exec tsc -b` conclui sem erros; `Unit` aceita apenas `celsius`/`fahrenheit`; os tipos incluem os campos obrigatórios de cidade, clima atual e cinco dias, além dos cinco estados assíncronos e quatro tipos de erro do plano. **Rastreabilidade:** RF-01–RF-06; plano: Data Model e State Management.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`

## Entrega 2 — Funções puras

### T-02 — Implementar conversão e formatação de temperatura
- **Tipo:** Data
- **Descrição:** Criar funções puras para converter Celsius em Fahrenheit e formatar valor e unidade para apresentação.
- **Critérios de aceite:** testes confirmam `0 °C = 32 °F`, `100 °C = 212 °F`, `-40 °C = -40 °F` e identidade em Celsius; a formatação apresenta `°C`/`°F` conforme a unidade e sempre recebe o valor original em Celsius. **Rastreabilidade:** AC-04.1–AC-04.4.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`

### T-03 — Mapear códigos meteorológicos WMO
- **Tipo:** Data
- **Descrição:** Traduzir códigos WMO reconhecidos para condições em pt-BR, sem inventar descrição para códigos desconhecidos.
- **Critérios de aceite:** cada código incluído no mapa retorna um rótulo pt-BR não vazio; código ausente ou fora do mapa retorna resultado não interpretável; a validação do clima atual rejeita esse resultado como condição obrigatória inválida. **Rastreabilidade:** AC-02.1, AC-02.4, AC-03.3.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`

### T-04 — Formatar datas locais da previsão
- **Tipo:** Data
- **Descrição:** Criar funções puras para apresentar datas civis da cidade sem convertê-las para o fuso do navegador.
- **Critérios de aceite:** testes com data civil fixa confirmam que a data `YYYY-MM-DD` não muda ao variar o fuso do processo; a data de referência e o dia seguinte recebem rótulos “Hoje” e “Amanhã”; datas seguintes são formatadas em pt-BR. **Rastreabilidade:** AC-03.1, AC-03.5; RNF-05.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/format.ts`

## Entrega 3 — Services

### T-05 — Implementar tratamento comum de erros e timeout
- **Tipo:** Data
- **Descrição:** Preparar tratamento de falha de rede, HTTP, timeout e resposta inválida no serviço.
- **Critérios de aceite:** testes provocam falhas de rede, HTTP não-2xx, timeout e JSON inválido e verificam, respectivamente, `network`, `api`, `timeout` e `invalid-response`; timeout cancela apenas o sinal da operação testada; JSON inválido nunca retorna estado vazio. **Rastreabilidade:** AC-01.6, AC-02.4, AC-03.4, AC-06.4; RNF-03.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-06 — Implementar busca de cidades Open-Meteo
- **Tipo:** Data
- **Descrição:** Implementar `searchCities` e normalizar a resposta de geocodificação para `City`.
- **Critérios de aceite:** teste de requisição comprova `name` trimado e preservação de acentos/pontuação, além de `count`, `language=pt` e `format=json`; fixture com resultados normaliza coordenadas e metadados; resposta válida sem localidades retorna `[]`, enquanto falha HTTP/JSON rejeita a promessa. **Rastreabilidade:** AC-01.1–AC-01.6; RNF-07.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-07 — Implementar consulta do clima atual
- **Tipo:** Data
- **Descrição:** Consultar e normalizar clima atual em operação independente.
- **Critérios de aceite:** teste de URL verifica coordenadas, `temperature_unit=celsius`, `timezone=auto` e `current=temperature_2m,weather_code`; resposta válida mapeia temperatura/código e horário válido; temperatura ou condição ausente/inválida rejeita a operação; horário inválido é omitido. **Rastreabilidade:** AC-02.1, AC-02.4, AC-02.5.
- **Dependências:** T-01, T-03, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-08 — Implementar consulta da previsão de cinco dias
- **Tipo:** Data
- **Descrição:** Consultar e normalizar previsão diária, mantendo datas civis locais.
- **Critérios de aceite:** teste de URL verifica `daily=temperature_2m_min,temperature_2m_max,weather_code`, `forecast_days=5` e `timezone=auto`; fixture válida gera cinco itens alinhados; datas faltantes, duplicadas, não consecutivas ou mínimas/máximas não numéricas rejeitam a operação; código inválido é omitido. **Rastreabilidade:** AC-03.1, AC-03.3–AC-03.5.
- **Dependências:** T-01, T-03, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

## Entrega 4 — Hook

### T-15 — Orquestrar busca e resultados no hook
- **Tipo:** Data
- **Descrição:** Controlar termo, submissão e estado dos resultados da busca.
- **Critérios de aceite:** testes do hook confirmam zero chamadas para termo vazio; respostas mockadas produzem estados `loading`, `empty`, `success` e `error`; editar o termo limpa opções antigas imediatamente; uma promessa antiga resolvida por último não substitui os resultados do termo atual. **Rastreabilidade:** AC-01.1–AC-01.6, AC-01.8, AC-06.1.
- **Dependências:** T-01, T-06
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-16 — Orquestrar seleção e carregamento meteorológico
- **Tipo:** Data
- **Descrição:** Selecionar cidade explicitamente e iniciar consultas de clima atual e previsão em paralelo.
- **Critérios de aceite:** ao selecionar um resultado, mocks confirmam uma chamada de clima atual e uma de previsão antes de qualquer resolução; cada seção pode resolver/rejeitar independentemente; nova seleção limpa os dados da cidade anterior; sucesso de uma seção permanece após falha da outra. **Rastreabilidade:** AC-01.7, AC-06.1, AC-06.2, AC-06.5.
- **Dependências:** T-07, T-08, T-15
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-17 — Implementar retry isolado por seção
- **Tipo:** Data
- **Descrição:** Expor novas tentativas separadas para clima atual e previsão.
- **Critérios de aceite:** testes iniciam retry de cada seção e verificam incremento de chamada somente no serviço correspondente; após sucesso ou falha, os dados da outra seção permanecem iguais; timeout de uma promessa não aborta a outra. **Rastreabilidade:** AC-02.4, AC-03.4, AC-06.2–AC-06.4.
- **Dependências:** T-16
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-18 — Controlar a unidade no hook
- **Tipo:** Data
- **Descrição:** Manter unidade de exibição no estado compartilhado da tela.
- **Critérios de aceite:** teste do hook verifica valor inicial `celsius`; após alternar para `fahrenheit` e voltar, cidade, datas, códigos e estados de disponibilidade permanecem iguais e os mocks de serviço não recebem chamadas adicionais. **Rastreabilidade:** AC-04.1–AC-04.4.
- **Dependências:** T-02, T-16
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

## Entrega 5 — Componentes

### T-22 — Implementar estado de carregamento
- **Tipo:** UI
- **Descrição:** Criar componente acessível para indicar operação em andamento.
- **Critérios de aceite:** teste de componente encontra a mensagem por role `status`; ao renderizar carregamento de uma seção, não há valores de sucesso anterior nessa mesma seção. **Rastreabilidade:** AC-06.1; RNF-04.
- **Dependências:** —
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`

### T-23 — Implementar estado vazio
- **Tipo:** UI
- **Descrição:** Criar componente para entrada vazia e busca sem resultados.
- **Critérios de aceite:** teste de componente encontra mensagem de ausência de cidades e não encontra role `alert` de falha; o campo de busca continua habilitado e editável. **Rastreabilidade:** AC-01.5.
- **Dependências:** —
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`

### T-24 — Implementar estado de erro
- **Tipo:** UI
- **Descrição:** Criar componente de erro recuperável com ação de retry opcional.
- **Critérios de aceite:** teste encontra mensagem por role `alert`; texto não inclui corpo bruto/stack da resposta; botão de retry, quando fornecido, chama o callback uma vez e não é renderizado sem ação recuperável. **Rastreabilidade:** AC-01.6, AC-02.4, AC-03.4, AC-06.2–AC-06.4; RNF-04.
- **Dependências:** —
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`

### T-25 — Implementar busca e seleção de cidades
- **Tipo:** UI
- **Descrição:** Criar formulário de busca e lista de resultados selecionáveis.
- **Critérios de aceite:** teste de interação submete por Enter, não chama busca com campo vazio/espaços, exibe nome e metadados fornecidos, mantém resultados não selecionados até ação explícita e permite selecionar opção por teclado. **Rastreabilidade:** AC-01.1–AC-01.5, AC-01.7–AC-01.8; AC-05.2; RNF-04.
- **Dependências:** T-15, T-22, T-23, T-24
- **Arquivos prováveis:** `src/components/SearchBar.tsx`

### T-26 — Apresentar clima atual
- **Tipo:** UI
- **Descrição:** Exibir cidade, temperatura, unidade e condição atuais.
- **Critérios de aceite:** com fixture, teste encontra nome da cidade, temperatura/unidade e rótulo de condição esperados; estado de erro não mostra temperatura/condição presumida e aciona apenas retry atual. **Rastreabilidade:** AC-02.1, AC-02.4.
- **Dependências:** T-02, T-03, T-16, T-17, T-22, T-24
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-27 — Implementar item individual da previsão
- **Tipo:** UI
- **Descrição:** Apresentar uma data e suas temperaturas mínima e máxima.
- **Critérios de aceite:** teste com fixture encontra a data, mínima e máxima daquela fixture com unidade ativa; duas fixtures com valores distintos não trocam seus dados; código opcional ausente não gera condição visível inventada. **Rastreabilidade:** AC-03.1–AC-03.3, AC-04.2–AC-04.3.
- **Dependências:** T-02, T-04
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`

### T-28 — Compor lista da previsão
- **Tipo:** UI
- **Descrição:** Apresentar a coleção de dias e o estado da seção de previsão.
- **Critérios de aceite:** teste com cinco fixtures encontra cinco itens em ordem e respectivas datas; em erro, botão de retry chama somente a ação da previsão e o conteúdo de clima atual não é removido. **Rastreabilidade:** AC-03.1, AC-03.4, AC-06.2–AC-06.3.
- **Dependências:** T-16, T-17, T-22, T-24, T-27
- **Arquivos prováveis:** `src/components/ForecastList.tsx`

### T-29 — Implementar controle de unidade
- **Tipo:** UI
- **Descrição:** Criar controle acessível para alternar Celsius e Fahrenheit.
- **Critérios de aceite:** teste de interação verifica seleção acessível e estado selecionado para Celsius/Fahrenheit; teclado alterna a opção; callbacks atualizam unidade sem invocar serviços. **Rastreabilidade:** AC-04.1–AC-04.4, AC-05.2; RNF-04.
- **Dependências:** T-18
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`

## Entrega 6 — Integração

### T-45 — Integrar busca e clima atual no App
- **Tipo:** UI
- **Descrição:** Entregar a primeira tela funcional conectando busca, seleção explícita e apresentação do clima atual.
- **Critérios de aceite:** a tela permite buscar e selecionar uma cidade; a seleção inicia as consultas previstas pelo hook e exibe cidade, temperatura e condição atuais; falha de clima atual mostra estado recuperável; sem cidade selecionada não mostra dados meteorológicos nem solicita geolocalização. **Rastreabilidade:** AC-01.1–AC-01.7, AC-02.1, AC-02.4, AC-06.5.
- **Dependências:** T-25, T-26
- **Arquivos prováveis:** `src/App.tsx`

### T-30 — Compor a aplicação
- **Tipo:** UI
- **Descrição:** Conectar o hook aos componentes na tela principal.
- **Protótipo de layout:** usar o mock offline e o controle explícito dos cinco estados descritos no plano para desenvolver a UI. Essa etapa não conclui os critérios de integração com o hook.
- **Critérios de aceite:** teste de integração renderiza busca e unidade sem cidade inicial; geolocation não é solicitada; após seleção, cada componente recebe dados/callbacks correspondentes do hook e falha de uma seção não oculta sucesso da outra. **Rastreabilidade:** AC-01.7, AC-06.2, AC-06.5; RF-01–RF-04.
- **Dependências:** T-45, T-28, T-29
- **Arquivos prováveis:** `src/App.tsx`

### T-31 — Aplicar layout responsivo
- **Tipo:** UI
- **Descrição:** Ajustar estilos globais e layout da aplicação para telas móveis e desktop.
- **Critérios de aceite:** teste no navegador em viewport de 320 px confirma `documentElement.scrollWidth <= documentElement.clientWidth`; busca, resultados, clima, cinco dias e unidade estão visíveis e interativos sem sobreposição. **Rastreabilidade:** AC-05.1; RNF-01.
- **Dependências:** T-30
- **Arquivos prováveis:** `src/styles/index.css`

## Entrega 7 — Testes

### T-09 — Testar conversão de temperatura
- **Tipo:** Test
- **Descrição:** Cobrir as funções de conversão e formatação de temperatura.
- **Critérios de aceite:** Vitest passa casos `0`, `100` e `-40 °C`, identidade Celsius, símbolo de ambas as unidades e alternância repetida derivada do mesmo valor Celsius, sem acúmulo de arredondamento. **Rastreabilidade:** AC-04.1–AC-04.4.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`

### T-10 — Testar códigos meteorológicos
- **Tipo:** Test
- **Descrição:** Cobrir o mapeamento de códigos WMO e a condição desconhecida.
- **Critérios de aceite:** Vitest verifica ao menos um código de cada grupo suportado no mapa e confirma que código ausente/desconhecido não retorna rótulo de condição. **Rastreabilidade:** AC-02.1, AC-02.4, AC-03.3.
- **Dependências:** T-03
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`

### T-11 — Testar formatação de datas
- **Tipo:** Test
- **Descrição:** Cobrir rótulos de data sem depender do fuso do navegador.
- **Critérios de aceite:** Vitest usa uma data de referência fixa e pelo menos dois fusos de processo; a mesma data civil mantém o mesmo dia, com “Hoje”, “Amanhã” e rótulo pt-BR nos dias seguintes. **Rastreabilidade:** AC-03.1, AC-03.5; RNF-05.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/unit/format.test.ts`

### T-12 — Testar serviço de geocodificação
- **Tipo:** Test
- **Descrição:** Verificar requisição, normalização e falhas de `searchCities` com `fetch` controlado.
- **Critérios de aceite:** Vitest com `fetch` mockado verifica parâmetros e mapeamento, termo Unicode, metadados opcionais, resposta vazia distinta de erro e rejeição em HTTP/rede/timeout/JSON inválido; nenhum teste faz requisição de rede real. **Rastreabilidade:** AC-01.1–AC-01.6; RNF-07.
- **Dependências:** T-05, T-06
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-13 — Testar serviço de clima atual
- **Tipo:** Test
- **Descrição:** Verificar requisição e validação da resposta atual.
- **Critérios de aceite:** Vitest com `fetch` mockado verifica parâmetros e campos mapeados; ausência/invalidez de temperatura ou condição rejeita; horário inválido é omitido; HTTP/rede/timeout/JSON inválido rejeitam; nenhuma chamada real é feita. **Rastreabilidade:** AC-02.1, AC-02.4, AC-02.5.
- **Dependências:** T-05, T-07
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-14 — Testar serviço de previsão
- **Tipo:** Test
- **Descrição:** Verificar parâmetros, alinhamento de arrays e validação dos cinco dias.
- **Critérios de aceite:** Vitest com `fetch` mockado verifica parâmetros e cinco itens alinhados; cada caso com data ausente/duplicada/não consecutiva ou mínima/máxima inválida rejeita; código opcional inválido é omitido; HTTP/rede/timeout/JSON inválido rejeitam sem chamada real. **Rastreabilidade:** AC-03.1, AC-03.3–AC-03.5.
- **Dependências:** T-05, T-08
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-19 — Testar busca e resultados do hook
- **Tipo:** Test
- **Descrição:** Testar submissão, estados e invalidação de respostas obsoletas.
- **Critérios de aceite:** Vitest passa casos para termo vazio sem chamada, cada estado de busca, invalidação após edição e duas respostas resolvidas fora de ordem, mantendo somente resultados do termo mais recente. **Rastreabilidade:** AC-01.1–AC-01.6, AC-01.8, AC-06.1.
- **Dependências:** T-15
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

### T-20 — Testar carregamento e retry do hook
- **Tipo:** Test
- **Descrição:** Testar seleção, sucesso parcial e novas tentativas meteorológicas.
- **Critérios de aceite:** Vitest confirma ambas as chamadas iniciadas na seleção, quatro combinações de sucesso/falha parcial e retries isolados; em cada cenário a seção bem-sucedida mantém os mesmos dados após falha, retry ou timeout da outra. **Rastreabilidade:** AC-01.7, AC-06.1–AC-06.4.
- **Dependências:** T-16, T-17
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

### T-21 — Testar unidade no hook
- **Tipo:** Test
- **Descrição:** Verificar estado inicial e atualização da unidade de exibição.
- **Critérios de aceite:** Vitest verifica estado inicial Celsius, transições C→F→C, igualdade de cidade/datas/condições/estados antes e depois e contagem inalterada de chamadas aos serviços. **Rastreabilidade:** AC-04.1–AC-04.4.
- **Dependências:** T-18
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

### T-32 — Testar componentes de estado
- **Tipo:** Test
- **Descrição:** Verificar apresentação e acessibilidade dos estados de loading, vazio e erro.
- **Critérios de aceite:** Testing Library encontra loading por `status`, erro por `alert` e texto vazio distinto; botão de erro chama callback uma vez; estado vazio não renderiza retry de falha. **Rastreabilidade:** AC-01.5–AC-01.6, AC-06.1; RNF-04.
- **Dependências:** T-22, T-23, T-24
- **Arquivos prováveis:** `tests/unit/states.test.tsx`

### T-33 — Testar busca e seleção na interface
- **Tipo:** Test
- **Descrição:** Validar interações do formulário e da lista de cidades.
- **Critérios de aceite:** Testing Library submete por Enter, confirma zero chamadas para termo vazio, verifica região/país nas opções e seleciona uma cidade por teclado somente após ação explícita. **Rastreabilidade:** AC-01.1–AC-01.4, AC-01.7–AC-01.8, AC-05.2.
- **Dependências:** T-25
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`

### T-34 — Testar apresentação do clima atual
- **Tipo:** Test
- **Descrição:** Verificar dados, unidade e erro no componente de clima atual.
- **Critérios de aceite:** Testing Library confere valores exatos da fixture e unidade exibida; erro não renderiza valores meteorológicos e retry chama somente o callback atual uma vez. **Rastreabilidade:** AC-02.1, AC-02.4.
- **Dependências:** T-26
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`

### T-35 — Testar item de previsão
- **Tipo:** Test
- **Descrição:** Verificar apresentação de uma data e suas temperaturas.
- **Critérios de aceite:** Testing Library confere data, mínima, máxima e unidade da fixture; com código opcional ausente não renderiza condição presumida. **Rastreabilidade:** AC-03.1–AC-03.3, AC-04.2–AC-04.3.
- **Dependências:** T-27
- **Arquivos prováveis:** `tests/unit/ForecastCard.test.tsx`

### T-36 — Testar lista e estado da previsão
- **Tipo:** Test
- **Descrição:** Verificar composição dos cinco itens e retry da previsão.
- **Critérios de aceite:** Testing Library conta exatamente cinco itens e verifica a ordem das datas; em erro, retry chama uma vez apenas a ação de previsão. **Rastreabilidade:** AC-03.1, AC-03.4, AC-06.2–AC-06.3.
- **Dependências:** T-28
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`

### T-37 — Testar controle de unidade
- **Tipo:** Test
- **Descrição:** Verificar interação acessível do seletor de unidade.
- **Critérios de aceite:** Testing Library verifica estado selecionado inicial Celsius, mudança para Fahrenheit por teclado, mudança de volta e callback correto em cada mudança. **Rastreabilidade:** AC-04.1–AC-04.4, AC-05.2.
- **Dependências:** T-29
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`

### T-38 — Testar composição da aplicação
- **Tipo:** Test
- **Descrição:** Verificar integração de estados e seções no componente principal.
- **Critérios de aceite:** Testing Library confirma ausência inicial de dados meteorológicos e de solicitação de geolocalização; seleção aciona consulta; sucesso parcial mantém uma seção enquanto a outra mostra erro/retry. **Rastreabilidade:** AC-01.7, AC-06.2, AC-06.5.
- **Dependências:** T-30
- **Arquivos prováveis:** `tests/unit/App.test.tsx`

### T-46 — Testar a primeira fatia integrada
- **Tipo:** Test
- **Descrição:** Validar no App o fluxo inicial de busca, seleção de cidade e consulta do clima atual.
- **Critérios de aceite:** Testing Library com serviços mockados confirma busca, seleção explícita, cidade/temperatura/condição exibidas e estado de erro recuperável; antes da seleção não há dados meteorológicos nem solicitação de geolocalização. **Rastreabilidade:** AC-01.1–AC-01.7, AC-02.1, AC-02.4, AC-06.5.
- **Dependências:** T-33, T-45
- **Arquivos prováveis:** `tests/unit/App.test.tsx`

### T-39 — Testar fluxo integrado com Playwright
- **Tipo:** Test
- **Descrição:** Cobrir busca, seleção, consulta, unidade e retry com APIs interceptadas.
- **Critérios de aceite:** Playwright intercepta as APIs; após busca e seleção explícita verifica clima atual e cinco dias visíveis; nenhuma consulta meteorológica ocorre antes da seleção; alternar C/F não aumenta a contagem de requests; falhar e tentar novamente uma seção altera somente essa seção. **Rastreabilidade:** AC-01.3, AC-01.7, AC-02.1, AC-03.1, AC-04.2–AC-04.4, AC-06.2–AC-06.3.
- **Dependências:** T-30, T-31
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`

### T-40 — Testar acessibilidade básica e viewport móvel
- **Tipo:** Test
- **Descrição:** Executar o fluxo principal completo por teclado/toque no viewport mínimo da spec.
- **Critérios de aceite:** Playwright em 320 px confirma `documentElement.scrollWidth <= documentElement.clientWidth`; com APIs interceptadas, busca e seleção exibem clima atual e cinco dias; teclado/toque permite busca, seleção, alternância e retry; foco visível e mensagens de loading/erro são localizáveis por roles acessíveis. **Rastreabilidade:** AC-01.7, AC-02.1, AC-03.1, AC-05.1–AC-05.2, AC-06.2; RNF-01, RNF-04.
- **Dependências:** T-30, T-31, T-39
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`

## Entrega 8 — Hardening e prontidão para produção

### T-41 — Aprovar os campos meteorológicos mínimos
- **Tipo:** Infra
- **Descrição:** Registrar decisão dos stakeholders sobre os campos obrigatórios provisórios do MVP.
- **Critérios de aceite:** a spec registra decisão aprovada/rejeitada para temperatura e condição atuais e data/mínima/máxima diárias; a seção de questões em aberto é atualizada de acordo e nenhuma decisão fica implícita. **Rastreabilidade:** RF-02, RF-03; Open Questions 10.1.
- **Dependências:** T-39, T-40
- **Arquivos prováveis:** `specs/weather-app-spec.md`

### T-42 — Definir metas operacionais de desempenho e timeout
- **Tipo:** Infra
- **Descrição:** Registrar limites de desempenho, duração de timeout e política de retry para produção.
- **Critérios de aceite:** spec registra para carregamento inicial, busca, clima atual e previsão os limites, percentis, dispositivo, navegador, rede e amostra aprovados; registra timeout e política de retry por operação; plano e spec não divergem. **Rastreabilidade:** AC-01.6, AC-06.4; RNF-02, RNF-03; Open Questions 10.2.
- **Dependências:** T-39, T-40
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`

### T-43 — Definir suporte e critério formal de acessibilidade
- **Tipo:** Infra
- **Descrição:** Confirmar navegadores/sistemas suportados e padrão/nível de acessibilidade requerido.
- **Critérios de aceite:** spec registra navegadores/sistemas suportados e padrão/nível de acessibilidade aprovado; viewport de referência e critérios de teste são atualizados se a decisão divergir da referência provisória de 320 px. **Rastreabilidade:** AC-05.1–AC-05.2; RNF-01, RNF-04; Open Questions 10.3.
- **Dependências:** T-39, T-40
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`

### T-44 — Confirmar aptidão do provedor para lançamento
- **Tipo:** Infra
- **Descrição:** Verificar cobertura, limites de uso e condições de licença da Open-Meteo.
- **Critérios de aceite:** evidência consultável registra cobertura das localidades requeridas, limites de uso e condições/licença da Open-Meteo; a decisão de aptidão ou bloqueio de lançamento fica registrada na spec. **Rastreabilidade:** RNF-07; Open Questions 10.4.
- **Dependências:** T-39, T-40
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`

## Rastreabilidade

| Requisito funcional | Tarefas de implementação | Tarefas de teste/verificação |
| --- | --- | --- |
| RF-01 — Buscar e selecionar cidades | T-06, T-15, T-16, T-23–T-25, T-30, T-45 | T-12, T-19, T-33, T-39–T-40, T-46 |
| RF-02 — Consultar clima atual | T-03, T-07, T-16, T-24, T-26, T-30, T-45 | T-10, T-13, T-20, T-34, T-39–T-40, T-46 |
| RF-03 — Consultar previsão de cinco dias | T-04, T-08, T-16, T-24, T-27–T-28, T-30 | T-11, T-14, T-20, T-35–T-36, T-39–T-40 |
| RF-04 — Alternar unidade de temperatura | T-02, T-18, T-29–T-30 | T-09, T-21, T-37, T-39–T-40 |
| RF-05 — Usar em dispositivos móveis e desktop sem instalação | T-25, T-29–T-31, T-45 | T-33, T-37, T-39–T-40, T-46 |
| RF-06 — Comunicar estados e recuperar falhas | T-05–T-08, T-15–T-17, T-22–T-26, T-28, T-30, T-45 | T-12–T-14, T-19–T-20, T-32–T-34, T-36, T-38–T-40, T-46 |

**Requisitos sem tarefa correspondente:** nenhum. RF-01 a RF-06 têm tarefas de
implementação e tarefas de verificação associadas. Para RF-05, a composição
como aplicação web sem instalação está em T-30; responsividade e validação em
viewport móvel estão em T-31 e T-40.

## Prioridade e tamanho relativo

- **P0:** implementação necessária para entregar o fluxo principal do MVP.
- **P1:** verificação de comportamento e qualidade; concluir antes do aceite do MVP.
- **P2:** decisão externa que não impede protótipo, mas bloqueia o lançamento.
- **P/M/G:** pequeno, médio ou grande; não representa duração fixa.

| Tarefa | Prioridade | Tamanho |
| --- | --- | --- |
| T-01 | P0 | M |
| T-02 | P0 | P |
| T-03 | P0 | M |
| T-04 | P0 | P |
| T-05 | P0 | M |
| T-06 | P0 | M |
| T-07 | P0 | M |
| T-08 | P0 | M |
| T-09 | P1 | P |
| T-10 | P1 | P |
| T-11 | P1 | P |
| T-12 | P1 | M |
| T-13 | P1 | M |
| T-14 | P1 | M |
| T-15 | P0 | M |
| T-16 | P0 | M |
| T-17 | P0 | M |
| T-18 | P0 | P |
| T-19 | P1 | M |
| T-20 | P1 | M |
| T-21 | P1 | P |
| T-22 | P0 | P |
| T-23 | P0 | P |
| T-24 | P0 | P |
| T-25 | P0 | M |
| T-26 | P0 | M |
| T-27 | P0 | P |
| T-28 | P0 | M |
| T-29 | P0 | P |
| T-30 | P0 | M |
| T-31 | P0 | M |
| T-32 | P1 | M |
| T-33 | P1 | M |
| T-34 | P1 | P |
| T-35 | P1 | P |
| T-36 | P1 | P |
| T-37 | P1 | P |
| T-38 | P1 | M |
| T-39 | P1 | G |
| T-40 | P1 | G |
| T-41 | P2 | P |
| T-42 | P2 | M |
| T-43 | P2 | P |
| T-44 | P2 | M |
| T-45 | P0 | M |
| T-46 | P1 | M |

## Sequência sugerida por fatias verticais

As fatias abaixo entregam valor observável progressivamente. As tarefas podem
ser executadas em paralelo dentro de cada fatia quando suas dependências
permitirem.

### Fatia 1 — Buscar cidade e ver clima atual
- **Implementação:** T-01–T-03, T-05–T-08, T-15–T-17, T-22–T-26, T-45.
- **Verificação:** T-09–T-10, T-12–T-13, T-19–T-20, T-32–T-34, T-46.
- **Entrega visível:** pesquisar, distinguir e selecionar uma cidade; consultar e apresentar temperatura/condição atuais; comunicar vazio e falha recuperável.

### Fatia 2 — Completar previsão, unidade e responsividade
- **Implementação:** T-04, T-18, T-27–T-31.
- **Verificação:** T-11, T-14, T-21, T-35–T-40.
- **Entrega visível:** acrescentar os cinco dias locais, alternância Celsius/Fahrenheit e uso em viewport móvel; validar o fluxo integrado.

### Fatia 3 — Liberar para produção
- **Tarefas:** T-41–T-44, após as validações integradas e móveis T-39–T-40.
- **Entrega:** decisões documentadas para conteúdo mínimo, desempenho/timeout, suporte/acessibilidade e aptidão do provedor. Esses gates não bloqueiam as fatias de protótipo, mas bloqueiam o aceite de produção.