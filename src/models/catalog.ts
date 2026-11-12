export type ModelId = 'pi4' | 'hc283' | 'resistor' | 'capacitor';
export const modelCatalog: Record<
  ModelId,
  { title: string; category: string; dimensions: string; description: string; source: string }
> = {
  pi4: {
    title: 'Raspberry Pi 4 Model B',
    category: 'COMPUTADOR DE PLACA ÚNICA',
    dimensions: 'PCB · 85 × 56 mm',
    description:
      'Estudo visual da placa: GPIO, processador, memória e conectores. Sem emulação de CPU ou GPIO. Posições dos pequenos componentes e trilhas são ilustrativas; não é CAD para fabricação.',
    source: 'https://www.raspberrypi.com/products/raspberry-pi-4-model-b/specifications/',
  },
  hc283: {
    title: 'CD74HC283 · PDIP-16',
    category: 'LÓGICA DIGITAL',
    dimensions: 'Corpo · 19,31 × 6,35 mm',
    description:
      'Somador de 4 bits. Encapsulamento com 16 terminais, indicação do pino 1 e identificação das entradas e saídas. A simulação a 5 V está disponível na bancada de arquitetura.',
    source: 'https://www.ti.com/lit/ds/symlink/cd74hc283.pdf',
  },
  resistor: {
    title: 'Resistor axial · 10 kΩ',
    category: 'COMPONENTE PASSIVO',
    dimensions: 'Corpo · 6,5 × 2,5 mm',
    description:
      'Modelo representativo MRS25 de filme metálico, cinco faixas para 10 kΩ / 1%. Terminais formados para a bancada. A geometria não é um desenho de fabricação.',
    source: 'https://www.vishay.com/docs/28724/mrs16m25.pdf',
  },
  capacitor: {
    title: 'Capacitor radial · 100 µF',
    category: 'COMPONENTE PASSIVO',
    dimensions: 'Corpo representativo · Ø8 × 11,5 mm',
    description:
      'Eletrolítico polarizado representativo da família UHE / 16 V, com faixa negativa e respiro superior. Carcaça ilustrativa; conferir dimensões do código de compra.',
    source: 'https://www.nichicon.com/getmedia/5ee6e3a3-2d90-4858-bed0-89ef58a93bc3/e-uhe.pdf',
  },
};
