type PartInsightType = 'blade' | 'bit' | 'ratchet' | 'assist' | 'lock-chip' | 'general';

export type PartInsight = {
  key: string;
  label: string;
  type: PartInsightType;
  summary: string;
  mechanics: string;
  statAngles: string[];
  tuningTips?: string[];
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const knowledgeTable: Record<string, PartInsight> = {
  'bit flat': {
    key: 'bit flat',
    label: 'Bit Flat',
    type: 'bit',
    summary: 'Bico com base plana que mantém contato constante com o estádio, trocando estabilidade por velocidade lateral.',
    mechanics:
      'A borda plana gera atrito estático mínimo, então o combo derrapa rápido e consegue golpes tangenciais mais longos. Sem garra lateral, perde tração em choques diretos e tende a sair do centro.',
    statAngles: [
      'Procure winrate alto em arenas largas; quedas contra stamina indicam que a derrapagem está fugindo do sweet spot.',
      'Compare turnos decididos por explosão versus contato para confirmar se a agressividade está funcionando.',
    ],
    tuningTips: [
      'Use blades com massas distribuídas nas pontas para aproveitar o arrasto controlado.',
      'Ratchets longos (360+) ajudam a baixar o centro de gravidade e estabilizar a derrapagem.',
    ],
  },
  'bit needle': {
    key: 'bit needle',
    label: 'Bit Needle',
    type: 'bit',
    summary: 'Ponta fina centrada, feita para estacionar no centro e vencer por resistência ou contra-ataque tardio.',
    mechanics:
      'A agulha cria atrito estático alto, reduzindo deslocamento. Absorve impacto transferindo força direto para o eixo, o que exige ratchet rígido.',
    statAngles: ['Winrate depende de turnos longos; se cair cedo, revise a distribuição de massa.', 'Observa poucos KOs, muitos empates.'],
    tuningTips: ['Combine com blades defensivos.', 'Evite arenas com bolsões abertos.'],
  },
  'bit ball': {
    key: 'bit ball',
    label: 'Bit Ball',
    type: 'bit',
    summary: 'Esfera de contato com bom balanço entre estabilidade e mobilidade.',
    mechanics: 'A curvatura permite microajustes de ângulo, útil para combos balance.',
    statAngles: ['Analise splits entre vitórias por resistência x contato.'],
  },
  'meteor dragoon': {
    key: 'meteor dragoon',
    label: 'Meteor Dragoon',
    type: 'blade',
    summary: 'Blade de ataque com garras estendidas e massa distribuída nas extremidades.',
    mechanics:
      'Os ganchos externos criam torque quando a ponta acelera; exige bits agressivos para manter o giro tangencial e punir bordas.',
    statAngles: ['Observe vitórias por KO versus resistência.'],
    tuningTips: ['Emparelhe com ratchets altos (360G) e bits flat para manter o raio de varredura.'],
  },
  'cobalt drake': {
    key: 'cobalt drake',
    label: 'Cobalt Drake',
    type: 'blade',
    summary: 'Blade híbrido ataque/controle, peso deslocado para frente.',
    mechanics: 'O chanfro frontal ajuda a cortar ar e guardar energia para hits curtos em arenas médias.',
    statAngles: ['Procure consistência em arenas fechadas; quedas indicam falta de pressão na saída.'],
    tuningTips: ['Bits flats ou semi-flat para manter pressão, mas ratchets médios (560R) para rigidez.'],
  },
  'whale wave': {
    key: 'whale wave',
    label: 'Whale Wave',
    type: 'blade',
    summary: 'Blade balanceado com asas curvas que distribuem impacto e criam lift.',
    mechanics:
      'As aletas geram fluxo de ar que estabiliza o giro, permitindo contra-ataque quando o opponente se aproxima.',
    statAngles: ['Analise se as vitórias são por resistência; se sim, considere bits mais estáveis.'],
  },
  'ratchet 360': {
    key: 'ratchet 360',
    label: 'Ratchet 360',
    type: 'ratchet',
    summary: 'Ratchet longo que baixa o centro de massa e amplia o raio de ataque.',
    mechanics: 'Os dentes extras seguram assist blades e reduzem flex em choques longos.',
    statAngles: ['Compare winrate por arena; se perder em pisos ásperos, ajuste o bit.'],
  },
  'ratchet 560': {
    key: 'ratchet 560',
    label: 'Ratchet 560',
    type: 'ratchet',
    summary: 'Ratchet médio com foco em rigidez axial.',
    mechanics: 'Entrega torque direto ao blade, bom para combos que alternam ataque/stamina.',
    statAngles: ['Se notar muitos estalos, considere travas extras.'],
  },
  'ratchet 270': {
    key: 'ratchet 270',
    label: 'Ratchet 270',
    type: 'ratchet',
    summary: 'Ratchet curto que prioriza aceleração inicial.',
    mechanics: 'Menor raio significa menos inércia; ideal para combos que precisam reposicionar rápido.',
    statAngles: ['Use em arenas pequenas; quedas em arenas grandes são esperadas.'],
  },
};

const aliasTable: Record<string, string> = {
  flat: 'bit flat',
  'bit-flat': 'bit flat',
  needle: 'bit needle',
  ball: 'bit ball',
  meteor: 'meteor dragoon',
  meteordragoon360g: 'meteor dragoon',
  cobalt: 'cobalt drake',
  drake: 'cobalt drake',
  whale: 'whale wave',
  wave: 'whale wave',
  '360g': 'ratchet 360',
  '560r': 'ratchet 560',
  '270e': 'ratchet 270',
};

export function lookupPartInsight(query: string | undefined | null): PartInsight | null {
  if (!query) return null;
  const normalized = normalizeKey(query);
  if (!normalized) return null;
  const direct = knowledgeTable[normalized];
  if (direct) return direct;
  const aliasKey = aliasTable[normalized];
  if (aliasKey) {
    return knowledgeTable[aliasKey] ?? null;
  }
  if (normalized.includes(' flat')) {
    return knowledgeTable['bit flat'];
  }
  if (normalized.includes(' needle')) {
    return knowledgeTable['bit needle'];
  }
  if (normalized.includes(' ball')) {
    return knowledgeTable['bit ball'];
  }
  return null;
}

export function listPartInsights() {
  return Object.values(knowledgeTable);
}
