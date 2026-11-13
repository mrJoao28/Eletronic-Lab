# Acervo de hardware

As geometrias são originais e gratuitas (MIT), geradas por `npm run models:generate`, em GLB binário com unidade em metros. Não usam downloads de terceiros, assinaturas, texturas remotas ou serviços de IA. As fontes dos glifos mantêm a licença em `public/licenses/Helvetiker.txt` e nos metadados dos arquivos.

O atlas abre apenas o GLB selecionado, permite busca por nome/categoria, filtro por família, vistas superior/inferior/frontal, rotação, modo leve e download. A troca de modelo preserva a montagem do editor.

## Eletrônica

Além do resistor axial, capacitor eletrolítico e somador, há LED, diodo de sinal, NPN TO-92, MOSFET TO-220, regulador TO-220, botão, potenciômetro, capacitor cerâmico, capacitor de filme, indutor toroidal, relé, buzzer, cristal, fusível, bateria PP3, display de sete segmentos, OLED, Arduino UNO, ESP32 e protoboard.

**Adicionar à bancada** aparece somente para dispositivos que já possuem terminais e modelo elétrico suportados pelo motor: resistor, eletrolítico, somador, LED, diodo, NPN, botão, potenciômetro e protoboard. O restante está identificado como inspeção visual, sem cálculo elétrico ou execução de firmware.

## Computadores

O acervo completo possui 40 modelos. A família de computadores inclui a Raspberry Pi e 16 novos estudos: processador desktop LGA, DDR4 DIMM, DDR4 SO-DIMM, placa-mãe microATX, placa de vídeo com duas ventoinhas, SSD NVMe M.2 2280, SSD SATA 2,5 polegadas, HDD aberto 3,5 polegadas, fonte ATX, ventoinha 120 mm, cooler de torre, placa Ethernet PCIe x1, adaptador Wi-Fi PCIe, cabo SATA de dados, cabo ATX 24 pinos e bateria CR2032.

Peças de computador são inspecionáveis e exportáveis; não se conectam ao motor elétrico da protoboard nem substituem o simulador didático de CPU já existente. As dimensões são informadas por item e a câmera permite inspecionar tanto um pequeno componente quanto uma placa-mãe inteira.

## Fidelidade e referências

Cada item informa família, dimensões nominais ou aproximadas, função, limites e referência técnica. São estudos de formatos reais com materiais PBR, terminais, encapsulamentos e marcações. Passivos, trilhas e posicionamentos menores de placas são ilustrativos. Não são CAD de fabricação, projetos elétricos certificados ou garantia de compatibilidade mecânica. Conferir o datasheet do código e revisão de compra para montagem física.

O build verifica todos os arquivos listados no manifesto, incluindo assinatura GLB, versão, comprimento e tamanho. A suíte hospedada baixa todos os modelos para detectar arquivos ausentes e respostas HTML indevidas. Os testes de geometria verificam números finitos, ausência de texturas remotas e pontos estruturais relevantes.
