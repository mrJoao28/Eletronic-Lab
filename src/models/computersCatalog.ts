import type { ModelInfo } from './catalog.ts';
const inspection =
  ' Estudo visual original aproximado, sem emulação, teste de compatibilidade ou CAD de fabricação. Contatos e circuitos menores são ilustrativos.';
const items = {
  cpu: {
    title: 'Processador desktop · LGA',
    category: 'PROCESSAMENTO',
    dimensions: 'Estudo de formato · 37,5 × 45 mm',
    description:
      'Substrato, tampa de distribuição de calor, referência de orientação e contatos inferiores. Inspirado no formato LGA1700; não reproduz a distribuição elétrica dos 1700 contatos.' +
      inspection,
    source: 'https://www.intel.com/content/www/us/en/support/articles/000088402/processors.html',
  },
  ram: {
    title: 'Memória DDR4 · DIMM',
    category: 'MEMÓRIA',
    dimensions: 'PCB nominal · 133,35 × 31,25 mm',
    description:
      'Módulo desktop com chips nas duas faces, contatos dourados, chave de orientação e identificação. Representação de formato DDR4; capacidade e organização não são simuladas.' +
      inspection,
    source: 'https://www.micron.com/products/memory/dram-modules/udimm',
  },
  sodimm: {
    title: 'Memória DDR4 · SO-DIMM',
    category: 'MEMÓRIA',
    dimensions: 'PCB nominal · 69,6 × 30 mm',
    description:
      'Memória compacta de notebook com chips, contatos de borda e recuos laterais. SO-DIMM e DIMM possuem formatos diferentes.' +
      inspection,
    source: 'https://www.micron.com/products/memory/dram-modules/sodimm',
  },
  motherboard: {
    title: 'Placa-mãe · microATX',
    category: 'PLACA-MÃE',
    dimensions: 'PCB representativo · 244 × 244 mm',
    description:
      'Socket LGA, quatro slots DIMM, PCIe, conectores SATA/ATX, chipset, VRM e painel traseiro. Layout genérico para reconhecer os conjuntos; não representa um modelo comercial nem uma netlist.' +
      inspection,
    source: 'https://www.asus.com/motherboards-components/motherboards/prime/prime-b760m-a-d4/',
  },
  gpu: {
    title: 'Placa de vídeo · duas ventoinhas',
    category: 'EXPANSÃO',
    dimensions: 'Estudo aproximado · 240 × 110 × 40 mm',
    description:
      'PCB, interface de borda PCIe, carenagem, duas ventoinhas, dissipador e espelho com saídas de vídeo. Projeto visual genérico; não atribui desempenho a uma GPU comercial.' +
      inspection,
    source: 'https://www.nvidia.com/en-us/geforce/graphics-cards/',
  },
  nvme: {
    title: 'SSD NVMe · M.2 2280',
    category: 'ARMAZENAMENTO',
    dimensions: 'PCB nominal · 22 × 80 mm',
    description:
      'Formato M.2 com chave M representativa, controlador, memórias NAND e ponto de fixação. A identificação 2280 refere-se a 22 mm de largura por 80 mm de comprimento.' +
      inspection,
    source: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/980pro/',
  },
  satassd: {
    title: 'SSD SATA · 2,5 polegadas',
    category: 'ARMAZENAMENTO',
    dimensions: 'Carcaça aproximada · 100 × 69,85 × 7 mm',
    description:
      'Carcaça fina, parafusos e conectores separados de alimentação e dados SATA com chaves em L.' +
      inspection,
    source: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/870evo/',
  },
  hdd: {
    title: 'HDD · 3,5 polegadas aberto',
    category: 'ARMAZENAMENTO',
    dimensions: 'Corpo aproximado · 147 × 101,6 × 26 mm',
    description:
      'Vista didática sem tampa: prato magnético, eixo, braço atuador e bloco de cabeças. A abertura é um corte ilustrativo para estudo; não simula leitura ou mecânica de precisão.' +
      inspection,
    source: 'https://www.seagate.com/products/hard-drives/barracuda-hard-drive/',
  },
  psu: {
    title: 'Fonte de alimentação · ATX',
    category: 'ALIMENTAÇÃO',
    dimensions: 'Caixa representativa · 150 × 140 × 86 mm',
    description:
      'Caixa fechada, ventoinha, grade, entrada IEC, chave e conectores modulares genéricos. Não há acesso interno nem simulação de rede elétrica.' +
      inspection,
    source: 'https://www.corsair.com/us/en/explorer/diy-builder/power-supply-units/',
  },
  fan: {
    title: 'Ventoinha de gabinete · 120 mm',
    category: 'REFRIGERAÇÃO',
    dimensions: 'Moldura nominal · 120 × 120 × 25 mm',
    description:
      'Moldura aberta, furos de montagem, cubo, sete pás curvas e suportes. Geometria estática, sem CFD ou cálculo de vazão.' +
      inspection,
    source: 'https://noctua.at/en/nf-f12-pwm/specification',
  },
  cooler: {
    title: 'Cooler de CPU · torre',
    category: 'REFRIGERAÇÃO',
    dimensions: 'Estudo aproximado · 95 × 90 × 150 mm',
    description:
      'Base de contato, heatpipes de cobre, pilha de aletas e ventoinha superior para revelar os conjuntos. Configuração didática genérica, sem capacidade térmica calculada.' +
      inspection,
    source: 'https://noctua.at/en/products/cpu-cooler-retail',
  },
  nic: {
    title: 'Placa de rede · PCIe x1',
    category: 'REDE',
    dimensions: 'PCB aproximado · 100 × 65 mm',
    description:
      'Controlador Ethernet, conector RJ45, contatos PCIe e espelho metálico. Layout genérico, sem transmissão de pacotes ou velocidade nominal atribuída.' +
      inspection,
    source: 'https://www.tp-link.com/us/home-networking/pci-adapter/tg-3468/',
  },
  wifi: {
    title: 'Adaptador Wi-Fi · PCIe',
    category: 'REDE',
    dimensions: 'PCB aproximado · 80 × 55 mm',
    description:
      'Módulo blindado, cabos de antena, conector de borda e duas antenas no espelho traseiro. Representação visual sem simulação de rádio.' +
      inspection,
    source: 'https://www.tp-link.com/us/home-networking/pci-adapter/archer-tx3000e/',
  },
  satacable: {
    title: 'Cabo SATA · dados',
    category: 'CABOS E CONECTORES',
    dimensions: 'Trecho didático · cerca de 120 mm',
    description:
      'Cabo flexível e dois conectores com sete contatos e chave em L. Não confundir com o conector SATA de alimentação.' +
      inspection,
    source: 'https://www.startech.com/en-us/cables/sata18',
  },
  atxcable: {
    title: 'Cabo ATX · 24 pinos',
    category: 'CABOS E CONECTORES',
    dimensions: 'Conector representativo · 12 × 2 vias',
    description:
      'Conector principal da placa-mãe com trava, 24 cavidades e fios individuais. Cores são apenas ilustrativas; não usar esta geometria como guia de pinagem elétrica.' +
      inspection,
    source: 'https://www.corsair.com/us/en/explorer/diy-builder/power-supply-units/',
  },
  coinbattery: {
    title: 'Bateria de CMOS · CR2032',
    category: 'ALIMENTAÇÃO',
    dimensions: 'Formato nominal · Ø20 × 3,2 mm',
    description:
      'Célula tipo moeda usada em diversas placas para manter o relógio em tempo real. Tampa positiva, junta isolante e corpo metálico.' +
      inspection,
    source: 'https://data.energizer.com/pdfs/cr2032.pdf',
  },
} satisfies Record<string, ModelInfo>;

export const computersCatalog = Object.fromEntries(
  Object.entries(items).map(([id, info]) => [id, { ...info, family: 'computers' as const }]),
) as { [K in keyof typeof items]: ModelInfo };
