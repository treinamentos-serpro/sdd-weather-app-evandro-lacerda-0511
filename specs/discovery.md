# Discovery: Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação de previsão do tempo para que usuários consultem as condições meteorológicas de cidades. O produto deve permitir buscar cidades, visualizar o clima atual e uma previsão para cinco dias, escolher entre Celsius e Fahrenheit e usar a aplicação em dispositivos móveis.

O briefing define as capacidades principais, mas ainda não especifica público-alvo, plataformas, detalhes da experiência de busca ou critérios de qualidade. Algumas decisões iniciais já foram tomadas; as lacunas restantes precisam ser esclarecidas antes de fechar a especificação e as decisões técnicas.

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
|---|---|---|
| Usar Open-Meteo como fonte de dados, sem API key. | Atende à necessidade de dados meteorológicos sem exigir uma chave de API para a integração inicial, simplificando a configuração do serviço. | Resolve qual provedor será usado e se a integração exige API key. Permanecem em aberto cobertura necessária, limites e condições de uso/licença. |
| Definir a previsão de cinco dias como hoje e os quatro dias seguintes. | Torna explícito o período incluído na consulta e reduz interpretações diferentes de “cinco dias”. | Resolve se o dia atual está incluído. Permanecem em aberto granularidade, campos e fuso/calendário usados para delimitar os dias. |
| Usar Celsius como unidade padrão, mantendo a alternância para Fahrenheit. | Oferece um padrão definido para a primeira visualização sem retirar a opção de unidade prevista no briefing. | Resolve qual unidade será apresentada inicialmente. Permanecem em aberto persistência da preferência e unidades de outras grandezas, se forem exibidas. |
| Não exigir autenticação nem persistir dados no servidor. | Evita introduzir contas e armazenamento de dados no servidor no escopo inicial. | Resolve se haverá autenticação ou persistência de servidor. Persistência local no navegador, como unidade ou cidade recente, continua em aberto. |
| Exibir a interface em português do Brasil (pt-BR). | Define o idioma inicial da experiência para o público previsto nesta etapa. | Resolve qual idioma a UI deve usar. Formatos regionais de data/hora e o tratamento de localidades em outros idiomas continuam em aberto. |

## Personas (Hipóteses)

Os perfis abaixo são hipóteses para orientar o discovery, não segmentos confirmados por pesquisa. As metas de tempo são propostas iniciais para testes de usabilidade e devem ser ajustadas com usuários reais.

### Marina, consulta rápida antes de sair

- **Objetivo principal:** verificar rapidamente o clima atual e a previsão próxima para decidir o que vestir ou se precisa se preparar para chuva.
- **Contexto de uso:** principalmente mobile, em pausas curtas e às vezes ao ar livre ou com conexão instável.
- **Métrica de sucesso:** encontrar a cidade correta e consultar o clima atual em até 30 segundos, sem precisar repetir a busca; validar esse limite em testes com usuários.

### Rafael, planejador da semana

- **Objetivo principal:** consultar e comparar a previsão de cinco dias para escolher quando realizar atividades ou organizar compromissos.
- **Contexto de uso:** principalmente desktop em casa ou no trabalho para planejar; pode voltar ao mobile para uma consulta rápida.
- **Métrica de sucesso:** localizar a previsão da cidade e identificar os dias relevantes em até 1 minuto, sem confundir datas; validar se os dados apresentados permitem essa decisão.

### Camila, viajante em destino novo

- **Objetivo principal:** encontrar o clima de uma cidade que não conhece e interpretar a temperatura na unidade com que está familiarizada.
- **Contexto de uso:** principalmente mobile durante o deslocamento, com buscas por cidades homônimas e possíveis diferenças de idioma, fuso e unidade.
- **Métrica de sucesso:** selecionar a localidade correta e visualizar o clima na unidade desejada em até 45 segundos, sem erro de cidade ou interpretação; validar o limite e os cenários em pesquisa.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise uma cidade e selecione o local desejado para consultar seus dados meteorológicos.
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir a previsão do tempo para hoje e os quatro dias seguintes da cidade selecionada.
- **RF-04 — Alternar unidades:** apresentar temperaturas em Celsius por padrão e permitir alternar entre Celsius e Fahrenheit.
- **RF-05 — Usar em dispositivos móveis:** disponibilizar uma experiência utilizável em dispositivos móveis, incluindo acesso às funções de busca, consulta e alternância de unidade.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** a interface deve se adaptar a dispositivos móveis; dimensões de tela e navegadores suportados ainda precisam ser definidos.
- **RNF-02 — Usabilidade:** as funções essenciais devem estar acessíveis e compreensíveis em dispositivos móveis e nos demais dispositivos suportados.
- **RNF-03 — Desempenho, disponibilidade e acessibilidade:** metas mensuráveis e requisitos específicos não foram informados e devem ser definidos antes da implementação.
- **RNF-04 — Idioma:** a interface deve ser apresentada em português do Brasil (pt-BR).

## Riscos

As probabilidades são avaliações iniciais com base nas lacunas do briefing, não em dados históricos. Devem ser revistas quando público, provedor, plataforma e metas forem definidos.

| Categoria | Risco | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|---|
| Produto | Público-alvo, problema principal e critérios de sucesso não definidos podem levar a um produto que entrega as funções previstas, mas não atende à necessidade prioritária. | Alta | Alto: decisões de conteúdo e prioridade podem ser retrabalhadas; o sucesso do produto fica difícil de demonstrar. | Validar segmentos e casos de uso com stakeholders e usuários; definir métricas de sucesso e critérios para o MVP antes de fechar a especificação. |
| Produto | O conteúdo do clima atual e a granularidade da previsão ainda podem ser interpretados de formas diferentes entre stakeholders e usuários. | Média | Alto: telas, dados e testes de aceite podem divergir do que se espera entregar. | Definir campos, granularidade e exemplos de resultados; revisar protótipos e critérios de aceite com stakeholders. |
| Produto | Cidades com nomes iguais ou busca limitada podem levar o usuário a consultar a localidade errada ou não encontrar sua cidade. | Média | Alto: previsões incorretas para a intenção do usuário reduzem confiança e utilidade. | Definir cobertura geográfica e exibir país/região nos resultados; testar cidades homônimas, nomes localizados e buscas sem resultado. |
| Técnico | Dependência do Open-Meteo sujeita a indisponibilidade, limites de requisição, cobertura insuficiente ou mudanças nas condições de uso. | Média | Alto: consulta atual e previsão podem ficar indisponíveis ou deixar de atender à cobertura necessária. | Confirmar limites, cobertura e condições de uso; implementar timeout, tratamento de erros, monitoramento e estratégia de contingência compatível com a licença. |
| Técnico | Dados atrasados, ausentes ou apresentados no fuso horário incorreto podem ser confundidos com condições atuais. | Média | Alto: decisões do usuário podem se basear em informação enganosa. | Definir frescor máximo e tratamento para dados incompletos; exibir horário e fuso da atualização; testar limites de data e fuso. |
| Técnico | Latência da busca ou do serviço meteorológico pode degradar especialmente o uso em redes móveis. | Média | Médio/alto: usuários podem abandonar a consulta ou repetir ações, aumentando carga e chamadas externas. | Definir metas de desempenho por fluxo e dispositivo; medir em redes móveis; otimizar chamadas e interface e apresentar estados de carregamento e recuperação. |
| Técnico / experiência | Compatibilidade móvel e responsividade não especificadas podem deixar funções indisponíveis ou difíceis de usar em certos dispositivos. | Média | Alto: parte do público pode não conseguir buscar ou interpretar a previsão. | Definir navegadores, sistemas e larguras suportados; estabelecer critérios de responsividade; testar fluxos essenciais em dispositivos móveis reais ou representativos. |
| Técnico / conformidade | Acessibilidade não especificada pode resultar em barreiras para usuários de teclado, leitores de tela ou com baixa visão. | Média | Alto: usuários podem ser excluídos e correções tardias podem exigir retrabalho amplo. | Definir padrão e nível de conformidade; incluir critérios de teclado, foco, semântica, contraste e testes automatizados e manuais no ciclo de desenvolvimento. |
| Produto / privacidade | Geolocalização, histórico ou preferências podem ser adicionados sem decisão clara sobre consentimento, retenção e finalidade. | Média | Alto: perda de confiança, exposição de dados ou descumprimento de políticas e leis aplicáveis. | Não coletar localização ou histórico sem necessidade; decidir escopo e consentimento antes da implementação; minimizar, proteger e definir retenção para os dados coletados. |
| Produto / técnico | Formatos regionais de data/hora e unidades de outras grandezas ainda indefinidos podem produzir informações confusas. | Média | Médio: aumenta erros de interpretação e reduz adoção fora da configuração presumida. | Definir formatação localizada e unidades para cada grandeza exibida; testar Celsius/Fahrenheit e datas em diferentes fusos. |

## Perguntas em Aberto

Cada pergunta abaixo representa uma decisão que o briefing não resolve. O impacto descreve o risco de avançar sem essa resposta; não implica que a funcionalidade citada já faça parte do escopo.

### Objetivo e público

- **Objetivo e sucesso:** Qual problema de negócio a aplicação deve resolver e como seu sucesso será medido? **Impacto:** sem um resultado esperado e métricas, fica difícil priorizar funcionalidades ou determinar se o produto atende à necessidade.
- **Usuários e contexto:** Quem usará o app e em quais situações (consulta casual, planejamento de viagem, atividade ao ar livre ou outra)? **Impacto:** decisões de conteúdo, prioridade, linguagem e experiência podem atender ao público errado.
- **Prioridade e restrições do projeto:** Qual é o escopo do MVP, a data-alvo, o orçamento e quem aprova as decisões? **Impacto:** estimativas e escolhas de escopo podem não caber nas restrições reais do projeto.

### Plataforma e cobertura

- **Tipo de aplicação:** O produto será um web app responsivo, um app nativo ou ambos? Há necessidade de instalação ou uso offline? **Impacto:** a resposta altera arquitetura, custos, distribuição, capacidades disponíveis e plano de testes.
- **Dispositivos suportados:** Quais sistemas operacionais, navegadores, versões e larguras de tela devem ser suportados? **Impacto:** sem uma matriz de suporte, não há critério objetivo para validar compatibilidade e responsividade.
- **Regiões atendidas:** A busca e os dados devem cobrir quais países ou localidades? **Impacto:** a cobertura do provedor, os formatos de endereço e a desambiguação podem não funcionar para os locais esperados.

### Busca e seleção de local

- **Experiência de busca:** A busca será por nome digitado, com sugestões/autocomplete, seleção explícita de resultado ou outro fluxo? **Impacto:** muda a interação, o volume de consultas e o comportamento esperado da interface.
- **Cidades homônimas:** Quais informações devem distinguir resultados (país, estado/região ou coordenadas)? **Impacto:** o usuário pode selecionar a cidade errada e receber dados irrelevantes.
- **Localização do dispositivo:** O app deve solicitar geolocalização ou a busca manual é suficiente? **Impacto:** a decisão afeta permissões, privacidade, tratamento de recusa e o fluxo inicial.
- **Estados da busca:** O que deve ocorrer em busca vazia, sem resultados, entrada inválida, lentidão ou falha? **Impacto:** sem regras, estados de erro e recuperação ficam inconsistentes ou impedem a conclusão da tarefa.

### Conteúdo e dados meteorológicos

- **Clima atual:** Quais condições devem ser exibidas além da temperatura (por exemplo, descrição, sensação térmica, umidade ou vento)? **Impacto:** o conteúdo, os dados necessários e a forma de apresentar o clima ficam indefinidos.
- **Significado de “atual”:** Qual atraso máximo é aceitável e o app deve mostrar horário da última atualização e fuso local? **Impacto:** dados antigos podem ser apresentados como atuais ou em um horário que o usuário interprete incorretamente.
- **Fuso e calendário da previsão:** Como determinar o início e o fim de “hoje + quatro dias” para cidades em fusos diferentes? **Impacto:** a previsão pode começar ou terminar no dia incorreto para a localidade consultada.
- **Detalhe da previsão:** A previsão será diária, horária ou ambas? Quais valores, períodos do dia e condições devem ser mostrados? **Impacto:** não é possível definir a estrutura da tela nem confirmar que a previsão entregue satisfaz o usuário.
- **Condições da fonte de dados:** Quais são a cobertura, frequência, limites e condições de uso/licença do Open-Meteo para o app? **Impacto:** pode haver cobertura insuficiente, bloqueio por limites ou incompatibilidade com o uso pretendido.
- **Falha ou dados ausentes:** O que mostrar quando o provedor falhar, exceder limites ou não tiver previsão para um local? Pode haver cache e qual seria sua validade? **Impacto:** sem contingência, o app pode ficar inutilizável ou exibir informação desatualizada sem aviso.

### Preferências e localização cultural

- **Escopo das unidades:** Celsius/Fahrenheit se aplica apenas à temperatura? Quais unidades serão usadas para vento, precipitação e distância, caso esses dados sejam exibidos? **Impacto:** valores podem ficar inconsistentes ou confusos para o usuário.
- **Persistência da unidade:** A escolha entre Celsius e Fahrenheit deve permanecer após recarregar ou voltar ao app? **Impacto:** sem persistência, a preferência pode se perder e frustrar usuários frequentes.
- **Formatos regionais:** Quais formatos de data/hora e convenções regionais serão usados, especialmente para cidades em outros fusos? **Impacto:** datas e horários podem ser exibidos em formato inadequado ou interpretados incorretamente.
- **Persistência local:** Apesar de não haver autenticação nem persistência no servidor, o app deve guardar localmente unidade, cidade recente ou favoritos? **Impacto:** a decisão altera comportamento entre sessões, uso de armazenamento no dispositivo e expectativas de privacidade.

### Qualidade, operação e privacidade

- **Desempenho:** Quais tempos máximos são aceitáveis para carregar a aplicação, buscar cidades e apresentar dados? Em quais dispositivos e condições de rede serão medidos? **Impacto:** sem metas e contexto de medição, não há como avaliar se a experiência é rápida o bastante.
- **Disponibilidade:** Qual disponibilidade é esperada e como manutenção e falhas do provedor externo serão tratadas? **Impacto:** não é possível dimensionar monitoramento, contingência ou comunicar a confiabilidade esperada.
- **Acessibilidade:** Qual padrão e nível de conformidade devem ser atendidos? Há requisitos para teclado, leitor de tela, contraste e movimento reduzido? **Impacto:** pessoas podem não conseguir usar funções essenciais e a equipe não terá critérios claros de validação.
- **Privacidade e segurança:** Quais dados serão coletados (incluindo localização, analytics ou histórico), por quanto tempo e com qual consentimento? Há requisitos legais ou corporativos aplicáveis? **Impacto:** pode haver coleta excessiva, exposição de dados ou não conformidade regulatória.
- **Observabilidade e suporte:** Quem acompanha erros e disponibilidade, e qual é o processo para responder a incidentes? **Impacto:** falhas podem persistir sem detecção, responsáveis ou comunicação adequada aos usuários.

## Suposições

- A consulta começa após o usuário buscar e selecionar uma cidade; não foi solicitado uso obrigatório da localização do dispositivo.
- Celsius e Fahrenheit são as unidades de temperatura necessárias nesta etapa, com Celsius como padrão.
- A previsão de cinco dias inclui hoje e os quatro dias seguintes; granularidade e fuso/calendário ainda precisam ser definidos.
- A experiência deve funcionar em dispositivos móveis, mas o briefing não exige um aplicativo nativo nem define suporte offline.
- Não haverá autenticação nem persistência de dados no servidor no escopo inicial; persistência local de preferências ainda não foi decidida.