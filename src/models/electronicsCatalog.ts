import type { ModelInfo } from './catalog.ts';
const visual =
  ' Geometria original aproximada para identificação e estudo; não é CAD de fabricação. Inspeção visual, sem simulação elétrica deste dispositivo.';
export const electronicsCatalog = {
  led: {
    title: 'LED vermelho · 5 mm',
    category: 'OPTOELETRÔNICA',
    dimensions: 'Corpo representativo · Ø5 mm',
    description:
      'Lente, flange, eletrodos internos e terminais A/K. Pode ser inserido na simulação linear por trechos da bancada.',
    source: 'https://www.kingbrightusa.com/images/catalog/SPEC/WP7113ID.pdf',
    benchKind: 'led',
  },
  diode: {
    title: 'Diodo de sinal · 1N4148',
    category: 'SEMICONDUTORES',
    dimensions: 'Encapsulamento representativo · DO-35',
    description:
      'Corpo de vidro, faixa do cátodo e terminais axiais. Disponível na bancada com modelo didático linear por trechos.',
    source: 'https://www.vishay.com/docs/81857/1n4148.pdf',
    benchKind: 'diode',
  },
  transistor: {
    title: 'Transistor NPN · TO-92',
    category: 'SEMICONDUTORES',
    dimensions: 'Corpo aproximado · 5 × 5 × 4 mm',
    description:
      'Encapsulamento com face plana e três terminais. Na bancada representa o 2N3904 somente como chave NPN aproximada; não calcula ganho linear.',
    source: 'https://www.onsemi.com/pdf/datasheet/2n3903-d.pdf',
    benchKind: 'transistor',
  },
  mosfet: {
    title: 'MOSFET · TO-220',
    category: 'SEMICONDUTORES',
    dimensions: 'Corpo aproximado · 10 × 15 × 4,5 mm',
    description:
      'Transistor de potência: aba metálica perfurada, corpo moldado e três terminais. A pinagem depende do código do componente.' +
      visual,
    source: 'https://www.infineon.com/part/IRF540N',
  },
  regulator: {
    title: 'Regulador linear · TO-220',
    category: 'ALIMENTAÇÃO',
    dimensions: 'Corpo aproximado · 10 × 15 × 4,5 mm',
    description:
      'Estudo de encapsulamento de regulador da família 7805: entrada, terra e saída. Conferir dissipação e pinagem no datasheet.' +
      visual,
    source: 'https://www.ti.com/product/LM7805',
  },
  button: {
    title: 'Botão tátil · SPST',
    category: 'CONTROLES',
    dimensions: 'Corpo aproximado · 6 × 6 mm',
    description:
      'Corpo metálico, atuador e dois contatos elétricos didáticos. Na bancada funciona como chave SPST ideal, sem bounce.',
    source: 'https://www.omron.com/ecb/products/sw/2/b3f.html',
    benchKind: 'button',
  },
  potentiometer: {
    title: 'Potenciômetro · 10 kΩ',
    category: 'CONTROLES',
    dimensions: 'Corpo aproximado · 9 × 9 mm',
    description:
      'Pista resistiva representada por corpo, cursor e ajuste. A bancada calcula duas resistências ideais ajustáveis pelo cursor W.',
    source: 'https://www.bourns.com/docs/product-datasheets/3386.pdf',
    benchKind: 'potentiometer',
  },
  ceramic: {
    title: 'Capacitor cerâmico · disco',
    category: 'PASSIVOS',
    dimensions: 'Disco representativo · Ø6 mm',
    description:
      'Dielétrico cerâmico com revestimento e dois terminais radiais; marcação 104 representativa.' +
      visual,
    source: 'https://www.vishay.com/capacitors/ceramic/',
  },
  film: {
    title: 'Capacitor de filme · radial',
    category: 'PASSIVOS',
    dimensions: 'Corpo aproximado · 13 × 10 × 5 mm',
    description:
      'Caixa retangular de capacitor não polarizado, com dois terminais e marcação de capacitância.' +
      visual,
    source: 'https://www.vishay.com/capacitors/film/',
  },
  inductor: {
    title: 'Indutor toroidal',
    category: 'PASSIVOS',
    dimensions: 'Núcleo representativo · Ø16 mm',
    description:
      'Núcleo toroidal, enrolamento de cobre isolado e terminais. A visualização mostra como o fio envolve o núcleo.' +
      visual,
    source:
      'https://www.coilcraft.com/en-us/edu/series/a-guide-to-understanding-common-mode-chokes/',
  },
  relay: {
    title: 'Relé eletromecânico · SPDT',
    category: 'ACIONAMENTO',
    dimensions: 'Caixa aproximada · 19 × 16 × 15 mm',
    description:
      'Caixa, bobina e contatos COM/NO/NC representativos de um relé com cinco terminais.' + visual,
    source: 'https://components.omron.com/us-en/products/relays/G5LE',
  },
  buzzer: {
    title: 'Buzzer piezoelétrico',
    category: 'ACIONAMENTO',
    dimensions: 'Corpo representativo · Ø12 mm',
    description:
      'Invólucro cilíndrico com abertura acústica e dois terminais; identificação de polaridade.' +
      visual,
    source: 'https://www.murata.com/en-us/products/sound',
  },
  crystal: {
    title: 'Cristal de quartzo · HC-49',
    category: 'TEMPORIZAÇÃO',
    dimensions: 'Corpo aproximado · 11 × 4 × 4 mm',
    description:
      'Cápsula metálica selada, base isolante e dois terminais; marcação de 16 MHz ilustrativa.' +
      visual,
    source: 'https://www.abracon.com/Resonators/ab.pdf',
  },
  fuse: {
    title: 'Fusível de vidro · 5 × 20',
    category: 'PROTEÇÃO',
    dimensions: 'Cartucho nominal · Ø5 × 20 mm',
    description:
      'Tampas metálicas, tubo translúcido e elemento fusível interno. O modelo não prevê corrente ou tempo de atuação.' +
      visual,
    source:
      'https://www.littelfuse.com/products/fuses-overcurrent-protection/fuses/cartridge-fuses',
  },
  battery: {
    title: 'Bateria · formato PP3',
    category: 'ALIMENTAÇÃO',
    dimensions: 'Corpo aproximado · 26 × 17 × 49 mm',
    description:
      'Carcaça, capa e dois terminais de encaixe com polaridades diferentes. Não inserir como fonte de 9 V na bancada limitada a 5 V.' +
      visual,
    source: 'https://data.energizer.com/pdfs/522.pdf',
  },
  sevensegment: {
    title: 'Display de sete segmentos',
    category: 'DISPLAYS',
    dimensions: 'Corpo aproximado · 19 × 13 × 8 mm',
    description:
      'Sete barras, ponto decimal e dez terminais. Segmentos iluminados apenas para identificação visual.' +
      visual,
    source:
      'https://www.kingbrightusa.com/category.asp?catalog_name=LED&category_name=7-Segment+Display&Page=1',
  },
  oled: {
    title: 'Módulo OLED · 0,96 polegada',
    category: 'DISPLAYS',
    dimensions: 'PCB aproximado · 27 × 27 mm',
    description:
      'Placa de módulo I²C com tela e header de quatro pinos; layout genérico, sem emulação de pixels ou barramento.' +
      visual,
    source: 'https://learn.adafruit.com/monochrome-oled-breakouts',
  },
  uno: {
    title: 'Arduino UNO R3 · estudo visual',
    category: 'PLACAS DE DESENVOLVIMENTO',
    dimensions: 'PCB nominal · 68,6 × 53,4 mm',
    description:
      'Estudo da versão com microcontrolador DIP: headers, USB-B, alimentação e reset. Componentes menores e trilhas ilustrativos. Sem execução de sketches.' +
      visual,
    source: 'https://docs.arduino.cc/hardware/uno-rev3/',
  },
  esp32: {
    title: 'ESP32 DevKit · estudo visual',
    category: 'PLACAS DE DESENVOLVIMENTO',
    dimensions: 'PCB representativo · 54 × 28 mm',
    description:
      'Placa inspirada na DevKitC com módulo blindado, antena, USB e headers de expansão. Não representa uma revisão específica e não emula firmware.' +
      visual,
    source:
      'https://documentation.espressif.com/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html',
  },
  breadboard: {
    title: 'Protoboard · 400 pontos',
    category: 'PROTOTIPAGEM',
    dimensions: 'Corpo aproximado · 85 × 55 mm',
    description:
      'Matriz de 300 furos e quatro trilhos de 25 furos, grupos de cinco e canal central. Na bancada os terminais e trilhos possuem conectividade elétrica.',
    source: 'https://learn.adafruit.com/breadboards-for-beginners',
    benchKind: 'board',
  },
} satisfies Record<string, ModelInfo>;
