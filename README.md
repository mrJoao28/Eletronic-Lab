# Eletronic Lab

Laboratório virtual 3D de engenharia da computação, com eletrônica e arquitetura na mesma bancada. TypeScript, React, Three.js e React Three Fiber. Execução inteiramente local, sem IA, conta ou backend.

## Executar

Requer Node.js 22.12+ e npm. Instale as dependências uma vez:

```sh
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173/**. Para produção: `npm run build` e `npm run preview`. `dist/` contém uma aplicação estática, incluindo fontes e licenças locais. A instalação inicial requer internet; a aplicação não faz chamadas a serviços externos em operação. Não há assets ou serviços pagos.

## Experimentos disponíveis

- **Eletrônica / RC**: fonte DC 0–5 V, MRS25 10 kΩ, UHE 100 µF / 16 V, terra e protoboard. Carga e descarga calculadas pela montagem. Edite R ou C para mudar τ. Aplique 0 V para descarregar pelo resistor; o botão não abre o circuito.
- **Arquitetura / somador**: CD74HC283 HC PDIP-16, nove seletores SPDT ideais, alimentação de 5 V. As entradas, soma e carry dependem dos fios reais. Entradas flutuantes ou conflitantes produzem X. Guia com pinagem e desacoplamento necessário na bancada física.

O botão **Abrir** carrega os exemplos completos e editáveis, uma bancada vazia, o projeto salvo ou um JSON. Trocar de experiência substitui a montagem; use Salvar/Exportar antes, ou Desfazer para recuperá-la.

## Montar e medir

1. Adicione componentes pela biblioteca. Selecione para editar valor, posição em mm e orientação. Mova arrastando com a ferramenta Mover ou use os campos precisos. Girar aplica 90° por clique.
2. Ative **Conectar terminais** e clique na origem e destino. O painel **Conexões** oferece o mesmo fluxo por listas identificadas, inclusive todos os furos da protoboard. `Esc` cancela a origem.
3. Fios conectam os terminais nas mesmas coordenadas usadas pela cena. Terminais de R, C e CI alinhados a um furo real, a menos de 0,06 mm, são inseridos eletricamente nesse furo. A ligação acompanha posição e orientação. Não há detecção geral de colisão nem autoencaixe de componentes por arraste; os campos permitem alinhamento exato.
4. Selecione um fio na cena ou na lista para inspecionar/remover sem ambiguidade. Desfazer/Refazer guarda até 80 edições. Excluir componente remove seus fios e desconecta suas sondas.
5. Escolha **CH1+ e CH1−** para conectar as pontas. Sondas aparecem tracejadas; não são jumpers. Osciloscópio e voltímetro compartilham explicitamente esse par. A medição é diferencial e pode ser negativa ou indefinida (—).
6. Execute, pause, reinicie ou avance em passos de 50 ms. Escalas V/div e s/div alteram a janela do osciloscópio. O analisador lógico possui canais reconectáveis e registra estados durante execução/passo. Não são curvas pré-gravadas.
7. As camadas de referências e nós são opcionais. Tensões, corrente capacitiva e estados 0/1/X são representações didáticas calculadas, sem representação de elétrons ou de propagação eletromagnética.

Atalhos: Espaço executa/pausa; Ctrl/Cmd+Z desfaz; Ctrl/Cmd+Shift+Z refaz; Delete remove seleção; Ctrl/Cmd+S salva. Campos de formulário preservam seus atalhos de edição.

## Persistência

Salvar grava **uma montagem** no localStorage do navegador (`eletronic-lab.project.v1`). Reabra em Abrir → Reabrir salvo local. JSON v1 inclui referências, valores, posições, orientação, terminais dos fios, cores e sondas. Importação valida versão, limites, IDs únicos e existência dos terminais; máximo 40 peças, 500 fios e arquivo de 2 MB. O estado temporal da simulação e o histórico de desfazer não são persistidos. Exporte JSON para backup: limpar dados do navegador apaga o salvo local.

## Organização

| Arquivo              | Responsabilidade                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/engine.ts`      | Domínio elétrico, terminais, coordenadas físicas, união de nós, solução RC e digital; sem dependência de React/Three |
| `src/examples.ts`    | Montagens reproduzíveis e modificáveis                                                                               |
| `src/Bench.tsx`      | Geometrias paramétricas, seleção, fios e câmera                                                                      |
| `src/App.tsx`        | Editor, instrumentos, gráficos, histórico e arquivos                                                                 |
| `src/engine.test.ts` | Verificações físicas/elétricas e persistência                                                                        |
| `tests/lab.spec.ts`  | Fluxos de navegador                                                                                                  |
| `docs/ASSETS.md`     | Origem, autoria, licenças e atribuições                                                                              |
| `docs/VALIDATION.md` | Evidências e limites da validação                                                                                    |

## Limites desta versão

Não é um substituto de SPICE ou de ferramentas profissionais. Modelo RC linear com **um capacitor polarizado referenciado ao terra**, resistores ideais e **uma fonte DC referenciada ao terra**. A rede resistiva é resolvida por análise nodal; o equivalente de Thévenin visto pelo capacitor fornece a evolução exponencial exata em cada passo. Capacitores sem caminho resistivo conservam sua carga. Ligação direta do capacitor à fonte e outros arranjos não suportados são diagnosticados. Não inclui ESR, fuga, tolerâncias, aquecimento, indutâncias ou condições destrutivas.

Digital suporta **um CD74HC283** em regime estático a **5 V**, com entradas ideais por seletores. Não simula atrasos, glitches, fanout ou curvas de saída. HC não é tratado como HCT/LS. Mais de um capacitor/fonte/somador não é uma extensão suportada do modelo. O voltímetro mede somente tensão DC; não há amperímetro, ohmímetro ou modelo de carga de instrumentos. O osciloscópio usa aquisição contínua sem trigger/AC coupling e janela limitada de amostras; o analisador não resolve eventos menores que o passo de simulação.

Protoboard didática explícita de 400 pontos: 30 colunas com grupos a–e e f–j, canal isolado, quatro trilhos **contínuos de 25 furos** P/N/Q/M, separados entre si. Protoboards comerciais podem interromper trilhos: confira continuidade na peça física. LEDs não estão incluídos; use analisador de 5 V para observar as saídas reais.

## Verificação

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Qualidade alta: sombras 1024², DPR até 1,5. Botão de ajustes ativa modo leve, sem sombras/antialiasing e DPR 1. Cena desenha sob demanda, furos usam uma malha instanciada, histórico gráfico é limitado a 2000 amostras. Veja o relatório sobre a distinção entre testes em Chromium com renderização por software e validação ainda necessária em GPU integrada real.

## Evolução planejada (indisponível nesta versão)

Portas HC e flip-flops com seus próprios datasheets → clock/contadores com motor de eventos → registradores → ALU → memória → CPU de 8 bits com execução passo a passo. Cada etapa requer modelos elétricos, condições físicas, testes e experimentos próprios. `Kind`, definições de terminais, netlist e motor independente são os pontos de extensão; eventos e memória ainda precisam ser implementados.
