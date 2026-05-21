export const fefcoModels = {
  '0110': {
    name: 'Flat Corrugated Sheet',
    description: 'A simple flat corrugated board with no creases or flaps.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 0
  },
  '0200': {
    name: 'Half Slotted Container (HSC)',
    description: 'Open top box with bottom flaps only.',
    hasTopFlaps: false,
    hasBottomFlaps: true,
    flapLengthFormula: (W) => W / 2,
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },
  '0201': {
    name: 'Regular Slotted Container (RSC)',
    description: 'Standard box with flaps meeting in the middle.',
    hasTopFlaps: true,
    hasBottomFlaps: true,
    flapLengthFormula: (W) => W / 2,
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },
  '0201D': {
    name: '0201D (Variation)',
    description: 'Variation of the RSC.',
    hasTopFlaps: true,
    hasBottomFlaps: true,
    flapLengthFormula: (W) => W / 2,
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },
  '0201S': {
    name: '0201S (Variation)',
    description: 'Variation of the RSC.',
    hasTopFlaps: true,
    hasBottomFlaps: true,
    flapLengthFormula: (W) => W / 2,
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },
  '0202': {
    name: 'Overlap Slotted Container (OSC)',
    description: 'Major outer flaps (W-panels) overlap each other by ~25 mm for secure closure.',
    hasTopFlaps: true,
    hasBottomFlaps: true,
    // L-panel flaps = inner (fold first) = W/2
    flapLengthFormula: (W) => Math.round(W / 2),
    // W-panel flaps = outer (fold second, overlap by ~25 mm)
    flapWidthFormula:  (W) => Math.round(W / 2) + 25,
    glueFlap: 30
  },
  '0203': {
    name: 'Full Overlap Slotted Container (FOL)',
    description: 'Major (outer) flaps span the full box length for double-layer coverage.',
    hasTopFlaps: true,
    hasBottomFlaps: true,
    // L-panel flaps = major/outer → fold 2nd, depth = W (full coverage of top/bottom)
    flapLengthFormula: (W) => W,
    // W-panel flaps = minor/inner → fold 1st, depth = W/2 (standard half-width)
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },

  // ── Telescope boxes ──────────────────────────────────────────────────────
  // isTelescope: true  → SheetVisualizer renders the 2-piece die-cut layout
  //                    → BoxVisualizer renders the TelescopeBoxModel
  // lidDepthFormula    → returns the rim depth "v" (mm) for the lid tray
  '0301': {
    name: 'Full Telescope Box (FTB)',
    description: 'Two-piece box: lid telescopes FULLY over base — lid depth equals full body height.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTelescope: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 30,
    // Full telescope: lid covers 100% of body height
    lidDepthFormula: (W, L, H) => H
  },
  '0306': {
    name: 'Telescope Design Box (TDB)',
    description: 'Two-piece box: lid covers approx. 1/3 of the base.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTelescope: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 30,
    lidDepthFormula: (W, L, H) => Math.round(H * 0.33)
  },
  '0310': {
    name: 'Telescope Box (0310)',
    description: 'Two-piece telescope box.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTelescope: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 30,
    lidDepthFormula: (W, L, H) => Math.round(H * 0.4)
  },
  '0320': {
    name: 'Telescope Box (0320)',
    description: 'Two-piece telescope box.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTelescope: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 30,
    lidDepthFormula: (W, L, H) => Math.round(H * 0.4)
  },

  // ── Tray-style boxes (04xx) ──────────────────────────────────────────────
  // isTrayWithLid: true  → SheetVisualizer renders horizontal mailer box layout
  //                      → BoxVisualizer renders TrayWithLidModel
  '0426': {
    name: 'Folder Tray with Hinged Lid (0426)',
    description: 'One-piece folder tray. Single-wall self-locking side walls fold up. Hinged lid attached at back folds over to close.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTrayWithLid: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 0,
    lidDepthFormula: (W) => W,
    tuckFlapFormula: (W, L, H) => Math.max(15, Math.round(H * 0.4))
  },
  '0427': {
    name: 'Folder Tray with Extended Lid (0427)',
    description: 'One-piece folder tray. Double-wall side walls with roll-over auto-lock tabs. Lid with tuck-in panel.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isTrayWithLid: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 0,
    lidDepthFormula: (W) => W,
    tuckFlapFormula: (W, L, H) => Math.max(18, Math.round(H * 0.45))
  },

  // ── Hinged-Lid Folder Box (04xx) ─────────────────────────────────────────
  // FEFCO 0409: One-piece blank. Panels: W | H | W | H horizontally (L vertical).
  // The box assembles as: base (L×W) + 2 front/back walls (L×H) + 2 side walls (fold
  // from the W panels). One H-wall has a hinged lid (depth = W/2) that folds over.
  // isHingedFolder: true → SheetVisualizer renders the 0409 correct layout
  //                       → BoxVisualizer renders HingedFolderModel
  '0409': {
    name: 'Hinged Lid Folder Box (0409)',
    description: 'One-piece folder-type box. Panels W-H-W-H horizontal, L runs vertical. Hinged lid on one end wall folds to close.',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    isHingedFolder: true,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 0,
    // The lid depth = roughly W/2 (tucking flap, labeled '<' in FEFCO PDF)
    lidDepthFormula: (W) => Math.round(W / 2)
  },

  '0711': {
    name: 'Ready-Glued Auto-Lock Bottom (0711)',
    description: 'Pre-glued crash-lock bottom box with regular slotted top flaps. Assembles automatically when popped open.',
    hasTopFlaps: true,
    hasBottomFlaps: false, // Handled by custom crash-lock geometry
    isCrashLock: true,
    flapLengthFormula: (W) => W / 2,
    flapWidthFormula: (W) => W / 2,
    glueFlap: 30
  },

  '0916': {
    name: 'Interior Fitment',
    hasTopFlaps: false,
    hasBottomFlaps: false,
    flapLengthFormula: () => 0,
    flapWidthFormula: () => 0,
    glueFlap: 0
  },
};

export const getFefcoBlueprint = (code, dimensions) => {
  const model = fefcoModels[code] || fefcoModels['0201'];
  const { length, width, height } = dimensions;

  const fL = model.flapLengthFormula(width, length);
  const fW = model.flapWidthFormula(width, length);
  const lidDepth = model.lidDepthFormula
    ? model.lidDepthFormula(width, length, height)
    : 0;
  const tuckFlap = model.tuckFlapFormula
    ? model.tuckFlapFormula(width, length, height)
    : 0;

  return {
    ...model,
    code,
    topFlapL:    model.hasTopFlaps    ? fL : 0,
    topFlapW:    model.hasTopFlaps    ? fW : 0,
    bottomFlapL: model.hasBottomFlaps ? fL : 0,
    bottomFlapW: model.hasBottomFlaps ? fW : 0,
    lidDepth,
    tuckFlap,
    // Max extents for SVG viewbox estimation
    totalSheetWidth: model.isTrayWithLid
      ? tuckFlap + width * 2 + height * 2   // Horizontal layout: Tuck + Lid(W) + Back(H) + Bottom(W) + Front(H)
      : model.isHingedFolder
        ? width * 2 + height * 2            // 0409: W+H+W+H panels horizontal
        : length * 2 + width * 2 + model.glueFlap,
    totalSheetHeight: model.isTrayWithLid
      ? (code === '0427' ? length + height * 4 + 20 : length + height * 2 + 10)
      : model.isHingedFolder
        ? length + lidDepth                 // 0409: L body height + lid tuck depth
        : model.isCrashLock
          ? height + (model.hasTopFlaps ? fL : 0) + (width / 2 + 30) // Body + Top Flap + Crash Lock Bottom
          : height
            + (model.hasTopFlaps ? Math.max(fL, fW) : 0)
            + (model.hasBottomFlaps ? Math.max(fL, fW) : 0)
  };
};
