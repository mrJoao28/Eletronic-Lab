# Plano de implementação

Repositório inspecionado em 2026-11-11: vazio, sem AGENTS.md ou convenções existentes. Stack: TypeScript, React, Vite, Three.js / React Three Fiber. Sem IA, backend ou serviços pagos.

1. **Base e motor**: definições elétricas independentes, terminais explícitos, união de nós da protoboard, RC linear de um capacitor e somador CD74HC283. Testar topologia, resposta analítica e 512 combinações digitais.
2. **Experiência RC completa**: bancada 3D paramétrica em milímetros, editor de fios e componentes, fonte DC, osciloscópio e voltímetro com pontas conectáveis, execução/pausa/passo, exemplo desmontável.
3. **Arquitetura completa**: PDIP-16 com pinagem do datasheet TI, entradas CMOS em 5 V, soma e carry calculados pelas conexões, inspeção digital e exemplo desmontável.
4. **Persistência e entrega**: histórico de montagem, projetos locais, JSON versionado validado, guia físico, catálogo de assets e fontes. Build, testes automatizados e fluxos no navegador; registrar limites de desempenho e validação.

## Referências consultadas antes da implementação

- TI CD74HC283, SCHS176E: https://www.ti.com/lit/ds/symlink/cd74hc283.pdf — pinagem PDIP-16, alimentação HC de 2–6 V; usar somente HC, não inferir equivalência com HCT/LS.
- Vishay MRS25: https://www.vishay.com/docs/28724/mrs16m25.pdf — resistor axial, 1%, modelo ôhmico ideal.
- Nichicon UHE: https://www.nichicon.com/getmedia/5ee6e3a3-2d90-4858-bed0-89ef58a93bc3/e-uhe.pdf — capacitor eletrolítico polarizado, tolerância ±20%; modelo capacitivo ideal.

## Escopo declarado

RC linear com uma capacitância dinâmica, sem ESR, fuga, tolerância, aquecimento ou parasitas. Digital combinacional estático com estados 0/1/X, sem atrasos de propagação ou simulação de transistores. Instrumentos ideais sem carga. Não substitui SPICE nem instrumento de segurança. Recursos de evolução são planejamento, não funcionalidades.

## Resultado das etapas

As quatro etapas de implementação estão entregues: motor independente, experiência RC, somador CD74HC283, editor 3D e instrumentos, persistência e documentação. Verificações: 15 testes de motor, 512 combinações digitais, quatro cenários de navegador e build de produção. A cena também foi exercitada por cliques em furos e arraste real. Os resultados e as próximas dependências de cada etapa estão em `docs/VALIDATION.md`.

A validação em GPU integrada física e a reprodução em bancada real permanecem pendentes; os testes de navegador usam SwiftShader. Não declarar estes ensaios físicos concluídos.

## Expansão entregue em 2026-11-12

1. Eletrônica ampliada: cinco componentes adicionais, presets e estados independentes de vários capacitores.
2. Diagnóstico contextual: erros, advertências, terminais e seleção de peças afetadas.
3. Instrumentos 3D: controles funcionais, sondas independentes e resistência/continuidade em redes passivas.
4. Esquema: mesmos nós da montagem, seleção compartilhada e exportação SVG.
5. Arquitetura: portas por eventos, flip-flop, registrador, ALU, RAM e CPU de 8 bits com ISA própria e assembler.
6. Inspeção: vista explodida, grupos ocultáveis e altura de jumpers.
7. Acervo e desafios: vários projetos locais, arquivamento/restauração, quatro investigações avaliadas pela simulação e programas assembly salvos.

O README atual substitui os limites da primeira entrega descritos acima. Permanecem distintos o motor elétrico da bancada e o motor lógico da CPU. A CPU 3D é um diagrama conceitual, sem montagem elétrica pino a pino ou emulação comercial. Medidas físicas e desempenho em GPU integrada real não foram realizados.
