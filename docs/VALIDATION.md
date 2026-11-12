# Verificação da primeira entrega

Ambiente: Windows, Node.js 26.8.1, Chromium headless via Playwright. Data: 2026-11-11. Cenários e verificações são reproduzíveis pelos comandos do README; a validação física em bancada real não foi realizada.

| Etapa                     | Evidência                                                                                                                                                                                                                                                                                                                               | Próxima dependência                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Domínio elétrico       | 15 testes Vitest passaram. Todos os grupos de cinco furos, colunas e trilhos verificados. Inserção por coordenadas e desconexão ao mover verificadas. RC comparado à solução analítica em 200 passos com precisão de 10 casas decimais; variação de R/C, descarga, circuito aberto e curto da fonte cobertos.                           | Mais capacitores exigem um integrador generalizado e novos testes, ainda não disponíveis.         |
| 2. RC e editor            | Fluxo Chromium confirma execução/pausa, resposta de tensão, alteração de R e τ, desfazer/refazer, fonte, sondas, posição e orientação, fios e exclusão. Teste específico projeta coordenadas físicas e clica em furos reais: cria e persiste j30 → j28. Arraste no canvas desloca a fonte, salva as coordenadas e Desfazer as recupera. | Ensaiar manualmente ergonomia de montagem e reprodução física com tolerâncias reais.              |
| 3. Arquitetura            | 16 × 16 × 2 = 512 combinações de A/B/Cin verificadas, incluindo carry. Alimentação/entrada desconectada produz X. Religação de entrada altera resultado. Navegador confirma entradas e carry-in, resultado binário, guia e exportação.                                                                                                  | Portas, flip-flops e clock dependem de modelos próprios e motor de eventos temporizados.          |
| 4. Persistência e entrega | JSON v1 preserva montagem e comportamento; rejeita versão desconhecida, terminais fantasmas e valores inválidos. Navegador confirma salvar/reabrir e importação/exportação. Build TypeScript + Vite passou. CI configurada para repetir motor/build/Chromium; execução remota da CI não é presumida.                                    | Revisar necessidades de múltiplos projetos e migrar esquema apenas com compatibilidade explícita. |

## Navegador

`npm run test:e2e`: quatro cenários aprovados. Cobrem os três fluxos gerais de `tests/lab.spec.ts` e a interação direta na cena de `tests/scene.spec.ts`. A última verificação específica da cena inclui também arraste e recuperação por desfazer. Layout exercitado em 1440 × 1000 e 390 × 844. Sem erros de página no fluxo RC monitorado.

A primeira execução a frio excedeu o timeout inicial de 30 segundos durante compilação do Vite; a configuração de teste usa 90 segundos por cenário e 15 segundos para expectativas. Execuções posteriores concluíram os quatro cenários. Isso não é uma garantia de tempo de carregamento em todos os dispositivos.

Auditoria adicional reproduzível, com o servidor ativo: `node scripts/browser-audit.mjs`. Gera `docs/browser-audit.json` e prévias RC/somador. Verifica HTTP, renderer, erros de página, requisições externas e importação de um arquivo válido. O ensaio não depende de conta ou backend.

## Gráficos e desempenho

- 400 furos renderizados por uma malha instanciada; materiais/geometrias paramétricos simples.
- Renderização sob demanda. A cena é memoizada: o avanço temporal não redesenha a geometria estática; a camada de tensões, quando habilitada, atualiza com as leituras.
- Opções de terminais memoizadas, evitando recriar milhares de opções a cada amostra.
- Carregamento separado da bancada 3D, código principal e Three.js. O bundle Three.js gera aviso de tamanho no Vite; build termina com sucesso.
- Qualidade alta: sombras 1024², DPR limitado a 1,5. Modo leve: sem sombras e antialiasing, DPR 1. Histórico limitado a 2000 amostras e passo nominal de 50 ms.

**Limite da evidência:** o Chromium desta sessão usa ANGLE/SwiftShader, com renderização por software. A auditoria registra intervalos de requestAnimationFrame, que medem o agendamento do navegador e **não** FPS efetivos da cena. Os resultados variam com a carga do ambiente e não comprovam desempenho em GPU integrada real. Não se declara 60 FPS nem certificação em hardware integrado. O passo é tempo simulado: sob carga, a simulação pode avançar mais devagar que o relógio real, preservando os cálculos.

A auditoria final registrou média rAF de aproximadamente 126 ms no modo alto e 147 ms no leve, com p95 próximo de 333 ms em ambos. Este ambiente por software apresentou baixa fluidez; o modo leve não demonstrou ganho consistente nesse ensaio. As otimizações removem trabalho redundante, mas não autorizam afirmar que o requisito de desempenho em hardware integrado foi validado. HTTP 200, nenhuma requisição externa, nenhum erro de página e recuperação via JSON válido foram confirmados na mesma auditoria.

Validação ainda necessária: Intel UHD/Iris ou AMD integrada real, WebGL2, 1366 × 768 e 1920 × 1080, nos dois níveis de qualidade. Ensaiar órbita, arraste, 20–40 peças, camada de nós e gráficos em execução, observando tempos de quadro, memória e resposta dos controles. Navegadores sem WebGL2 não foram homologados.

## Limitações de engenharia

As limitações do motor e dos instrumentos estão no README e na própria interface. O voltímetro compartilha as pontas do CH1; não oferece corrente/resistência. O osciloscópio não tem trigger ou acoplamento AC. O modelo digital é estático a 5 V. Os esquemas do guia são referências conceituais dos experimentos; a lista de conexões representa a montagem editada. Geometrias não são arquivos CAD de fabricação. Nenhum experimento físico foi medido para ajustar o modelo.

## Evolução: encaixe e atlas de hardware

Nesta revisão, 24 testes unitários passaram e o build de produção passou com geração local dos quatro GLBs. Regressões cobrem conflitos com três drivers, entradas definidas por resistores, encaixe de todos os terminais em furos livres e placas rotacionadas/deslocadas. Os testes geométricos conferem os 40 pinos GPIO, contorno 85 × 56 mm, os 16 pinos do CI e coordenadas finitas sem texturas externas.

Os GLBs gerados foram importados pelo Blender para uma renderização offline do modelo Raspberry Pi, reproduzível com `blender -b --python scripts/render-model-preview.py`. A imagem é uma renderização do asset, não uma captura da aplicação e não comprova interação no navegador.

O navegador de QA desta sessão não criou contexto WebGL (`GL_VENDOR = Disabled`). Portanto, interação, enquadramento e desempenho do novo atlas no navegador ainda não foram confirmados. O cenário `tests/gallery.spec.ts` foi adicionado à CI, mas não foi executado com sucesso nesta sessão. Não interpretar os testes geométricos como evidência de fluidez em GPU integrada.

**Confirmação posterior na CI:** a execução [43135221267](https://github.com/mrJoao28/Eletronic-Lab/actions/runs/43135221267), no commit `fa9432be419515015c5614927f0b73b3dfe87ac0`, terminou com sucesso. Os cinco cenários Chromium passaram, incluindo seleção de partes no atlas, download com validação do cabeçalho GLB2, preservação da montagem ao voltar e os quatro fluxos existentes. Isso confirma os fluxos cobertos na CI; a limitação WebGL do navegador interativo local permanece e desempenho em GPU integrada continua sem medição.

## Expansão de 2026-11-12

Verificação local: **53 testes unitários em 10 arquivos** e build de produção aprovados. Cobertura adicional: LED/chave/polaridade/corrente, potenciômetro, chave NPN, dois capacitores e constantes de tempo distintas, diagnóstico, resistência equivalente e limites do multímetro, esquema derivado da topologia, atraso digital, borda de clock, registrador, ALU com todas as combinações de bytes, assembler, fases de execução, RAM, saltos, inspeção desmontável, migração/acervo e objetivos dos desafios.

Três cenários novos de navegador em `tests/advanced.spec.ts` cobrem eletrônica/esquema/acervo, CPU e resolução de desafio, além dos cinco cenários anteriores. A CI encontrou um conflito de acessibilidade no teste legado de notificações: o elemento `<output>` do multímetro também possuía papel implícito `status`, tornando a seleção ambígua. A leitura foi convertida em texto rotulado, separado do anúncio de notificações, e a correção foi propagada às branches afetadas. Os resultados finais devem ser associados aos SHAs corrigidos, não aos runs anteriores.

Inspeção interativa confirmada: a CPU executou o exemplo de soma, gravou 8 na RAM[240], emitiu saída 8 e parou em HLT após 18 clocks. O desafio de LED inicialmente apagado só foi aprovado após fechar a chave na montagem. A captura `docs/cpu-workbench-preview.jpg` mostra a aplicação real nessa verificação. A estação e o esquema foram acessados por `/#cpu` e `/#schematic`; a limitação WebGL do navegador interativo permanece, e a validação da bancada 3D depende dos cenários Chromium/SwiftShader da CI.

Documentação de modelos atualizada no README e em ASSETS. Nenhuma avaliação física em bancada, validação de fabricação ou medição de desempenho em GPU integrada deve ser inferida desses testes.
