# Catálogo de assets e atribuições

Nenhum arquivo 3D externo, textura comercial, imagem gerada por serviço ou asset de licença desconhecida é usado. Os modelos são construídos em código, sem download em tempo de execução. Escala: 1 unidade Three.js = 1 mm. Geometrias visuais estão em `src/Bench.tsx`; definições elétricas e terminais em `src/engine.ts`.

| Asset                                                    | Origem / autor                                                                                           | Licença e atribuição                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Protoboard paramétrica 400 pontos                        | Original deste projeto / contribuidores Eletronic Lab                                                    | MIT, `LICENSE`; preservar aviso                                                                             |
| MRS25 axial, capacitor radial UHE, PDIP-16 genérico      | Geometrias originais deste projeto; dimensões orientadas pelos datasheets, sem copiar desenhos ou marcas | MIT; preservar aviso. Nomes dos componentes identificam referências técnicas, sem afiliação dos fabricantes |
| Fonte DC e banco de seletores                            | Carcaças e geometria originais deste projeto                                                             | MIT; preservar aviso                                                                                        |
| Fios, pontas didáticas, grade, esquemas e miniaturas SVG | Código original deste projeto                                                                            | MIT; preservar aviso                                                                                        |
| Ícones da interface                                      | Lucide Contributors; partes de Feather por Cole Bemis. https://lucide.dev                                | ISC / avisos Feather MIT, preservados em `public/licenses/Lucide.txt`                                       |
| DM Sans (fontes locais)                                  | The DM Sans Project Authors, via `@fontsource/dm-sans`; https://github.com/googlefonts/dm-fonts          | SIL Open Font License 1.1, aviso integral em `public/licenses/DM-Sans.txt`                                  |
| IBM Plex Mono (fontes locais)                            | IBM Corp., via `@fontsource/ibm-plex-mono`; https://github.com/IBM/plex                                  | SIL Open Font License 1.1, aviso integral em `public/licenses/IBM-Plex-Mono.txt`                            |
| Primitivas e renderizador Three.js                       | Three.js Authors; https://threejs.org                                                                    | MIT, aviso em `public/licenses/Three.txt`                                                                   |

As fontes não são modificadas nem vendidas separadamente. Arquivos de licença são copiados para `dist/licenses/` pelo Vite. Dependências e suas versões exatas estão em `package-lock.json`, com suas licenças originais nas distribuições npm.

## Fontes técnicas primárias

- Texas Instruments, **CD74HC283**, SCHS176E, rev. julho/2022: https://www.ti.com/lit/ds/symlink/cd74hc283.pdf. Pinos PDIP-16 e condições HC. O produto modela HC a 5 V, não HCT/LS. Corpo nominal 19,31 × 6,35 mm, passo dos pinos 2,54 mm.
- Vishay BCcomponents, **MRS16 / MRS25**, documento 28724: https://www.vishay.com/docs/28724/mrs16m25.pdf. MRS25 axial de filme metálico; 1% nominal. Variações de valor no editor são parametrizações da família, sem prometer estoque de todos os valores contínuos.
- Nichicon, **UHE**, CAT.8100M: https://www.nichicon.com/getmedia/5ee6e3a3-2d90-4858-bed0-89ef58a93bc3/e-uhe.pdf. Capacitor radial polarizado, tolerância ±20%. Corpo visual representativo 8 × 11,5 mm; valores editados não regeneram automaticamente a carcaça comercial correspondente.

Consultados antes de implementar em 2026-11-11. Datasheets são referenciados por link, não redistribuídos. A configuração física precisa observar o código de compra e a folha do lote adquirido.

Os terminais do capacitor são representados com formação para passo de 2,54 mm na protoboard; o passo nominal do encapsulamento comprado pode ser diferente. A formação dos terminais e a carcaça representativa são simplificações mecânicas declaradas, sem mudança de polaridade ou comportamento elétrico.

## Modelos de inspeção

- `src/models/hardware.ts`, `electronics.ts` e `computers.ts`: 40 geometrias originais de eletrônica e computadores; lista e limites em `docs/MODEL-LIBRARY.md`. Exportação reproduzível por `scripts/generate-models.mjs`; GLB usa metros. Código e geometrias originais sob MIT.
- Raspberry Pi 4: referência de medidas e interfaces em https://www.raspberrypi.com/products/raspberry-pi-4-model-b/specifications/ e desenho mecânico oficial https://pip.raspberrypi.com/categories/559-mechanical . Contorno nominal 85 × 56 mm; padrão dos furos 58 × 49 mm. Os desenhos não são redistribuídos. A espessura visual 1,6 mm, posicionamento de encapsulamentos, passivos, trilhas e detalhes de conectores são aproximações. Sem logotipo copiado, afiliação ou certificação.
- Inscrições em geometria: Helvetiker, distribuída com Three.js, com aviso MAGENTA Ltd. 2004. Licença integral preservada em `public/licenses/Helvetiker.txt` e nos metadados de cada GLB. Não é uma fonte original do projeto. A licença permite reprodução e distribuição nas condições registradas.
- Os arquivos não dependem de texturas, HDRIs externos, fontes remotas, assets pagos ou serviços de IA.

## Componentes analógicos ampliados

LED WP7113ID: https://www.kingbrightusa.com/images/catalog/SPEC/WP7113ID.pdf ; diodo 1N4148: https://www.vishay.com/docs/81857/1n4148.pdf ; NPN 2N3904: https://www.onsemi.com/pdf/datasheet/2n3904-d.pdf . As pinagens e identificações se referem a essas famílias. Os modelos elétricos são aproximações lineares por trechos explicitadas no editor, sem ajuste a curvas de fabricante. Botão e potenciômetro são dispositivos didáticos genéricos. Geometrias originais em `src/ExtendedModels.tsx`, licença MIT, sem texturas externas.
