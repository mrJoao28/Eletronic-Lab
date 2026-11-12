# Eletronic Lab

Laboratório virtual de engenharia da computação com montagem 3D, simulação elétrica, instrumentos, esquema sincronizado e estudos de arquitetura. Funciona no navegador, sem conta, backend, IA ou assets pagos.

## Executar

Node.js **22.18+** e npm:

```sh
npm ci
npm run dev
```

Abra a URL exibida pelo Vite. `npm run build` gera `dist/` para hospedagem estática. A geração dos quatro GLBs ocorre automaticamente antes do servidor e durante o build; `npm run models:generate` permite gerá-los separadamente. A operação da aplicação usa recursos locais, sem chamadas a serviços externos. Links de datasheets abrem sites dos fabricantes por ação do usuário.

## Bancada e componentes

Abra os exemplos no botão **Abrir**:

- RC de primeira ordem, com carga e descarga calculadas a partir das conexões.
- Somador CD74HC283 de 4 bits, com 512 combinações possíveis de A/B/Cin.
- LED com resistor e botão, chave NPN, divisor com potenciômetro e dois capacitores independentes.

A biblioteca analógica oferece fonte de 0–5 V, protoboard, resistores, capacitores, LED WP7113ID, diodo 1N4148, botão SPST, potenciômetro linear e NPN 2N3904 como chave. Modelos, pinos e limites são descritos no painel de inspeção. Geometrias novas são próprias e gratuitas, sem texturas externas.

Selecione uma peça para editar valor, posição e orientação. Arraste com **Mover**: R, C, CI e os novos componentes encaixam quando todos os terminais coincidem com furos livres de uma mesma protoboard. Uma indicação verde confirma o encaixe. Não há detecção geral de colisão entre carcaças.

**Conectar terminais** cria fios pela cena ou pelas listas de origem/destino. Selecione o fio para mudar cor, altura do jumper ou remover. Mover/girar peças altera suas conexões por inserção; fios explícitos acompanham seus terminais. Desfazer/refazer guarda até 80 edições. Excluir uma peça remove seus fios e desconecta sondas que dependam dela.

A protoboard didática tem 400 pontos: 30 colunas, grupos a–e/f–j isolados e quatro trilhos contínuos de 25 furos. Verifique continuidade na protoboard física: modelos comerciais podem interromper trilhos.

## Instrumentos e diagnóstico

Fonte, multímetro e osciloscópio possuem representações 3D. Nas telas dos instrumentos, selecione uma ponta e clique no terminal da montagem. O osciloscópio permite alterar V/div e s/div na bancada e no painel. O multímetro tem **pontas independentes** do CH1, preservadas no projeto.

- **V DC:** diferença de potencial entre as pontas, com impedância infinita ideal.
- **Resistência:** equivalente de uma rede de resistores, potenciômetros e chaves. Requer fonte a 0 V, omitida da rede de medição; redes com capacitores ou semicondutores são recusadas. Isso é uma simplificação: desligue e desconecte a fonte ao realizar a medição física.
- **Continuidade:** limiar didático de 50 Ω, indicação visual CONT/OL, sem áudio.
- **Analisador lógico:** canais reconectáveis, estados 0/1/X e amostras de tempo simulado.

O painel **Diagnóstico** identifica curto entre polos da fonte, conflitos, entradas indefinidas, inversão de polaridade e corrente/dissipação excessiva nos casos cobertos. Abre a inspeção das peças afetadas; erros identificados recebem marcação na cena. Ausência de alertas não certifica uma montagem física.

## Esquema elétrico

**Esquema** alterna para símbolos e terminais sincronizados com a montagem. Etiquetas iguais N1/N2/etc. indicam um mesmo nó elétrico, incluindo fios e inserções na protoboard. A seleção de peças é compartilhada com a vista 3D; os terminais também podem ser usados para conectar fios ou sondas. A tabela inferior explicita as conexões. Exporte uma cópia SVG pelo próprio esquema.

O arranjo dos símbolos é automático e usa etiquetas de nós em vez de desenhar todos os cruzamentos. `/#schematic` abre essa vista diretamente.

## Arquitetura: CPU e lógica

**CPU e lógica** abre estudos de portas, flip-flop D, registrador, ALU, memória e CPU. `/#cpu` abre a estação diretamente. A bancada elétrica é preservada e pausada ao entrar.

O motor digital usa eventos ordenados, atrasos de propagação configuráveis e estado X para sinais indefinidos/conflitantes. O flip-flop amostra na borda 0 → 1. A ALU opera com bytes e flags Z/C; em subtração, C indica ausência de empréstimo. Não modela setup/hold, glitches elétricos, ruído ou fanout.

A CPU didática tem acumulador e barramentos de 8 bits, 256 bytes de RAM compartilhada por código/dados, PC, IR, MAR/MDR e registrador de saída. Busca, decodificação, leitura de operando e execução são observáveis por clock. Há pausa, passo por clock/instrução, frequência de 1–16 Hz, breakpoint por PC e edição de memória pausada. A placa 3D é um diagrama conceitual inspecionável, sem implementação elétrica pino a pino.

ISA própria: NOP, LDI, LDA, STA, ADD, SUB, JMP, JZ, OUT, HLT, AND, OR e XOR. ADD/SUB e operações de bits usam imediato; LDA/STA usam endereço. O assembler aceita rótulos, comentários `;` e `.BYTE`, valida bytes e limita programas a 256 bytes. Não executa código JavaScript. Programas de soma, contagem e operações de bits acompanham o editor. **Salvar programa/Reabrir programa** mantém uma fonte assembly local separada das montagens elétricas.

Esta CPU não emula Raspberry Pi, x86 ou processador comercial. Sua ISA e circuito conceitual servem para estudar arquitetura, não para fabricar uma placa.

## Inspeção de hardware

**Modelos 3D** abre Raspberry Pi 4 Model B, CD74HC283, resistor e capacitor, com vistas, giro, partes identificadas e download GLB. A Raspberry Pi é um estudo visual: contorno e padrão de furos seguem referências mecânicas, mas trilhas, passivos e detalhes são ilustrativos. Não emula CPU/GPIO e não é CAD para fabricação.

A vista explodida separa conjuntos e permite ocultar conectores, blindagem e cabos flat. **Remontar modelo** restaura visibilidade/posições. Peças soldadas não são removíveis dessa forma na placa real. O somador e o capacitor da bancada reutilizam os GLBs; o resistor permanece paramétrico para refletir suas faixas.

## Projetos e desafios

**Salvar projeto** mantém a montagem atual e um acervo de até 50 projetos locais. **Abrir → Suas montagens** recupera projetos e permite arquivar/restaurar sem apagar. Alterar o nome de uma montagem salva atualiza seu ID; abrir um exemplo/importar inicia outra identidade. O salvo único de versões anteriores é migrado sem apagar o original.

JSON v1 continua compatível e inclui componentes, orientação, propriedades, fios, altura opcional e sondas do multímetro/CH1. Importação valida o conteúdo; até 40 peças, 500 fios e arquivo de 2 MB. Tempo de simulação e histórico não são persistidos. Limpar os dados do navegador apaga o acervo: exporte cópias JSON.

**Desafios** abre quatro investigações: LED apagado, limitação de corrente, ligação RC interrompida e entrada indefinida do somador. Cada uma traz objetivo, dica, reinício e verificação baseada na simulação da montagem alterada. O progresso concluído é salvo localmente. Salve seu projeto antes de iniciar um desafio.

## Modelos elétricos e limites

- Redes clássicas com um capacitor ao terra e uma fonte preservam a solução exponencial exata do RC linear.
- Redes ampliadas usam análise nodal/MNA, vários capacitores com estados independentes e backward Euler. O avanço normal de 50 ms usa subpassos de até 1 ms. Não use este motor como substituto de SPICE.
- LED: Vf fixo de 1,9 V + 10 Ω; diodo: 0,65 V + 20 Ω. Sem curvas térmicas, recuperação ou ruptura reversa.
- NPN: somente chave aproximada, junção BE de 0,7 V / 50 Ω e caminho CE ligado de 0,2 V / 20 Ω. Não representa ganho de amplificador, saturação completa ou transientes de um BJT real.
- Sem convergência, medições são indefinidas e um diagnóstico é emitido. Não misture o motor ampliado com CIs da bancada digital; essa combinação ainda não é suportada.
- CD74HC283: lógica combinacional estática ideal a 5 V, um CI por montagem, sem atrasos/fanout. HC não é tratado como HCT/LS. O motor por eventos da estação de arquitetura é separado dessa bancada.
- Instrumentos sem carga, amperímetro, trigger ou acoplamento AC. Qualidade alta/leve disponível; desempenho em GPU integrada real ainda requer medição.

## Verificação e organização

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

O motor está em `engine.ts`/`analog.ts`; modelos digitais em `digital/`; instrumentos em `metering.ts`/`Instruments3D.tsx`; diagnóstico, esquema, acervo e desafios têm módulos próprios. Testes cobrem cálculos e fluxos de navegador. Fontes técnicas e licenças estão em `docs/ASSETS.md`; evidências e limites em `docs/VALIDATION.md`.
