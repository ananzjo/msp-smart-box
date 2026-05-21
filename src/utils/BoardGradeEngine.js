export const PAPER_TYPES = {
  FL: { type: 'Flute Liner / Medium', allowedGSM: [80, 85, 90, 100, 110, 120, 150, 175] },
  WTTL: { type: 'White Top Test Liner', allowedGSM: [100, 110, 115, 120, 125, 140] },
  WSF: { type: 'Semi-Chemical Flute', allowedGSM: [127, 150, 160, 175, 200] },
  CWTTL: { type: 'Coated White Top Test Liner', allowedGSM: [130, 140, 160, 180] },
  TL: { type: 'Test Liner', allowedGSM: [80, 85, 90, 100, 110, 120, 140] },
  KL: { type: 'Kraft Liner', allowedGSM: [110, 120, 125, 135, 140, 150] }
};

export const FLUTE_MULTIPLIERS = {
  B: 1.420,
  C: 1.474,
  E: 1.326,
  F: 1.230
};

export const FLUTE_THICKNESS = {
  B: 2.5,
  C: 3.6,
  E: 1.2,
  F: 0.8
};

export const fluteSpecs = {
  B: { height: 2.5, pitch: 6.0 },
  C: { height: 3.6, pitch: 7.5 },
  E: { height: 1.2, pitch: 3.2 },
  F: { height: 0.8, pitch: 2.4 }
};

export const FLUTE_COMBINATIONS_5PLY = ['BE', 'BF'];

export class BoardGradeEngine {
  static validateConfiguration(config) {
    const errors = [];
    const { ply, layers } = config;

    if (!layers.L1 || !layers.L2 || !layers.L5) {
      errors.push('Missing basic layers L1, L2, L5');
      return errors;
    }

    if (ply === 5 && (!layers.L3 || !layers.L4)) {
      errors.push('Missing layers L3, L4 for 5-ply');
      return errors;
    }

    // 1. Layer Exclusivity Rules
    if (['FL', 'WSF'].includes(layers.L1.type)) {
      errors.push('L1 completely blocks the use of FL and WSF.');
    }
    if (['FL', 'WSF'].includes(layers.L5.type)) {
      errors.push('L5 completely blocks the use of FL and WSF.');
    }

    if (!['FL', 'WSF'].includes(layers.L2.type)) {
      errors.push('L2 is restricted exclusively to FL and WSF.');
    }

    if (ply === 5) {
      if (!['FL', 'WSF'].includes(layers.L4.type)) {
        errors.push('L4 is restricted exclusively to FL and WSF.');
      }
      
      if (layers.L3.type !== 'TL') {
        errors.push('L3 is strictly restricted to standard Test Liner (TL).');
      }

      const fluteCombo = `${layers.L2.flute}${layers.L4.flute}`;
      if (!FLUTE_COMBINATIONS_5PLY.includes(fluteCombo)) {
        errors.push(`5-Ply Flute combinations restricted to BE and BF. Current: ${fluteCombo}`);
      }
    }

    // Validate GSMs
    for (const [key, layer] of Object.entries(layers)) {
      if (!layer || !layer.type || !layer.gsm) continue;
      const allowed = PAPER_TYPES[layer.type]?.allowedGSM;
      if (allowed && !allowed.includes(Number(layer.gsm))) {
        errors.push(`Invalid GSM (${layer.gsm}) for ${layer.type} at ${key}. Allowed: ${allowed.join(', ')}`);
      }
    }

    return errors;
  }

  static calculateMetrics(config) {
    const { ply, layers } = config;
    let rawSum = 0;
    
    if (ply === 3) {
      const gsmL1 = Number(layers.L1.gsm);
      const gsmL2 = Number(layers.L2.gsm);
      const gsmL5 = Number(layers.L5.gsm);
      const alphaFlute = FLUTE_MULTIPLIERS[layers.L2.flute];
      
      rawSum = gsmL1 + (gsmL2 * alphaFlute) + gsmL5;
    } else if (ply === 5) {
      const gsmL1 = Number(layers.L1.gsm);
      const gsmL2 = Number(layers.L2.gsm);
      const alphaFlute1 = FLUTE_MULTIPLIERS[layers.L2.flute];
      const gsmL3 = Number(layers.L3.gsm);
      const gsmL4 = Number(layers.L4.gsm);
      const alphaFlute2 = FLUTE_MULTIPLIERS[layers.L4.flute];
      const gsmL5 = Number(layers.L5.gsm);
      
      rawSum = gsmL1 + (gsmL2 * alphaFlute1) + gsmL3 + (gsmL4 * alphaFlute2) + gsmL5;
    }

    const expectedGSM = Math.round(rawSum / 5) * 5;
    const gsmRangeFrom = Math.round(expectedGSM * 0.95);
    const gsmRangeTo = Math.round(expectedGSM * 1.05);

    let thickness = 0;
    if (ply === 3) {
      thickness = FLUTE_THICKNESS[layers.L2.flute] + (0.15 * 2); // Liners approx 0.15mm
    } else if (ply === 5) {
      thickness = FLUTE_THICKNESS[layers.L2.flute] + FLUTE_THICKNESS[layers.L4.flute] + (0.15 * 3);
    }

    const vipRequired = ['KL', 'WTTL', 'CWTTL'].includes(layers.L5.type);

    const boardGradeCode = ply === 3
      ? `${layers.L1.type}+${layers.L2.type}-${layers.L2.flute}+${layers.L5.type}`
      : `${layers.L1.type}+${layers.L2.type}-${layers.L2.flute}+${layers.L3.type}+${layers.L4.type}-${layers.L4.flute}+${layers.L5.type}`;

    return {
      rawSum,
      expectedGSM,
      gsmRangeFrom,
      gsmRangeTo,
      thickness,
      vipRequired,
      boardGradeCode
    };
  }
}
