import { useState } from 'react';
import jsPDF from 'jspdf';
import { getFefcoBlueprint } from '../utils/FefcoEngine';

// ─── helpers ──────────────────────────────────────────────────────────────────
const LAYER_LABELS = {
  L1: 'Top Liner',
  L2: 'Fluting',
  L3: 'Mid-Liner',
  L4: 'Fluting 2',
  L5: 'Bot. Liner',
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ReportExport({ fefcoCode, metrics, dimensions, ply, dimensionType, layers }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // ─── Page setup ──────────────────────────────────────────────────────
      const doc    = new jsPDF('landscape', 'mm', 'a4');
      const PW     = 297, PH = 210;
      const M      = 10;

      // ─── Apply same OD→ID correction as all visualizers ────────────────
      // (Both BoxVisualizer and SheetVisualizer do this; the PDF must too)
      const brdT  = metrics?.thickness || 3;
      let   iL    = dimensions.length;
      let   iW    = dimensions.width;
      let   iH    = dimensions.height;
      if (dimensionType === 'OD') {
        iL = Math.max(iL - brdT * 2, 10);
        iW = Math.max(iW - brdT * 2, 10);
        iH = Math.max(iH - brdT * 4, 10);
      }
      // idDims is what the die-cut layout is drawn at (matches SheetVisualizer exactly)
      const idDims = { length: iL, width: iW, height: iH };

      // ─── Blueprint (same call as SheetVisualizer) ────────────────────────
      const blueprint = getFefcoBlueprint(fefcoCode || '0201', idDims);
      const { topFlapL, topFlapW, bottomFlapL, bottomFlapW, glueFlap } = blueprint;
      const isTelescope    = !!blueprint.isTelescope;
      const isTrayWithLid  = !!blueprint.isTrayWithLid;
      const isHingedFolder = !!blueprint.isHingedFolder;

      // ─── Logo ────────────────────────────────────────────────────────────
      const img = new Image();
      img.src = '/msp-logo.png';
      await new Promise(res => { img.onload = res; img.onerror = res; });

      // ─── Watermark ───────────────────────────────────────────────────────
      if (img.width > 0) {
        const wa = img.width / img.height;
        const ww = 150, wh = ww / wa;
        doc.setGState(new doc.GState({ opacity: 0.07 }));
        doc.addImage(img, 'PNG', (PW-ww)/2, (PH-wh)/2, ww, wh, 'wm', 'FAST');
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }

      // ─── Border + engineering grid ───────────────────────────────────────
      doc.setLineWidth(0.5); doc.setDrawColor(0);
      doc.rect(M, M, PW-M*2, PH-M*2);
      doc.setFontSize(8);
      for (let i = 1; i < 6; i++) {
        const x = M + (PW-M*2)*(i/6);
        doc.text(String(i), x, M-3);
        doc.text(String(i), x, PH-M+6);
      }
      ['A','B','C','D'].forEach((c, i) => {
        const y = M + (PH-M*2)*((i+1)/5);
        doc.text(c, M-5, y); doc.text(c, PW-M+2, y);
      });

      // ─── Red notice strip ────────────────────────────────────────────────
      doc.setTextColor(220, 38, 38); doc.setFontSize(7.5);
      doc.text(
        'NOTICE: This design is for estimation purposes only. A formal sales quote must be prepared through the MSP ERP System.',
        PW/2, M+5, { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);

      // ─── Title block (bottom 38mm) ────────────────────────────────────────
      const TB_H = 38;
      const tbX  = M, tbY = PH - M - TB_H;
      doc.setLineWidth(0.5);
      doc.rect(tbX, tbY, PW-M*2, TB_H);

      // Logo cell
      const logoColW = 45;
      doc.line(tbX+logoColW, tbY, tbX+logoColW, tbY+TB_H);
      if (img.width > 0) {
        const la = img.width / img.height;
        let lw = 38, lh = lw / la;
        if (lh > 30) { lh = 30; lw = lh * la; }
        doc.addImage(img, 'PNG', tbX+(logoColW-lw)/2, tbY+(TB_H-lh)/2, lw, lh, 'logo', 'FAST');
      }

      // Grid lines inside title block
      const C1 = tbX + logoColW;
      const C2 = C1 + 62, C3 = C2 + 62, C4 = C3 + 58;
      const R1 = tbY + 13, R2 = tbY + 26;
      doc.line(C1, R1, PW-M, R1);
      doc.line(C1, R2, PW-M, R2);
      doc.line(C2, R1, C2, tbY+TB_H);
      doc.line(C3, R1, C3, tbY+TB_H);
      doc.line(C4, R1, C4, R2);

      // Header row
      doc.setFontSize(13); doc.setFont(undefined, 'bold');
      doc.text('MSP Box Engineering Printout', C1+4, tbY+9);
      doc.setFontSize(9);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, PW-M-3, tbY+9, { align: 'right' });

      // Helper: labelled cell
      const cell = (lbl, val, cx, ry) => {
        doc.setFontSize(7); doc.setFont(undefined, 'normal');
        doc.text(lbl, cx+3, ry);
        doc.setFont(undefined, 'bold');
        doc.text(val, cx+3, ry+6);
      };

      // Row 1 data
      cell('BOX TYPE:', `${fefcoCode} · ${blueprint.name}`,                     C1, R1+4);
      cell('BOARD GRADE:', metrics.boardGradeCode,                               C2, R1+4);
      cell(`DIMENSIONS (${dimensionType}):`,
        `${dimensions.length}×${dimensions.width}×${dimensions.height} mm`,     C3, R1+4);
      // Weight: approximate from ID sheet area × GSM
      const sheetArea = ((glueFlap + 2*iL + 2*iW) * (Math.max(topFlapL,topFlapW) + iH + Math.max(bottomFlapL,bottomFlapW))) / 1e6;
      const estGrams  = (sheetArea * metrics.expectedGSM).toFixed(1);
      cell('EST. WEIGHT | THICKNESS:',
        `${estGrams} g  |  ${metrics.thickness.toFixed(2)} mm`,                  C4, R1+4);

      // Row 2 data
      cell(`PLY | EXPECTED GSM:`,
        `${ply}-Ply  |  ${metrics.expectedGSM} gsm  (±5%: ${metrics.gsmRangeFrom}–${metrics.gsmRangeTo})`, C1, R2+4);
      cell('DRAWN BY / TOLERANCE:', 'MSP Configurator  |  ±5% GSM',             C2, R2+4);
      cell('PREPARED BY SIGNATURE:', '',                                         C3, R2+4);
      cell('CUSTOMER APPROVAL SIG.:', '',                                        C4, R2+4);

      // ─── Layout zones ─────────────────────────────────────────────────────
      // Main content: from y=M+8 to tbY-4
      const drawY  = M + 9;
      const drawH  = tbY - drawY - 5;

      // Left zone: die-cut sheet
      const sheetZX = M + 12; // Shifted right away from border
      const sheetZW = 162;    // Compensated width to maintain right zone position

      // Right zone: 3D views + technical metrics
      const rightZX = sheetZX + sheetZW + 4;
      const rightZW = PW - M - rightZX - 2;    // ≈ 85–90mm

      // Zone titles
      doc.setFontSize(9); doc.setFont(undefined, 'bold');
      doc.text('Die-cut Sheet Layout', sheetZX + sheetZW/2, drawY + 4, { align: 'center' });
      doc.text('3D Projection', rightZX + rightZW/2, drawY + 4, { align: 'center' });

      const cY = drawY + 6;   // content top
      const cH = drawH - 6;   // content height

      // ─── RIGHT PANEL: 3D view ─────────────────────────────────────────────
      const getColor = (type) => ({
        KL: [166,124,82], WTTL: [240,238,220], CWTTL: [240,238,220],
        TL: [196,154,108], FL: [181,139,94], WSF: [181,139,94],
      }[type] || [196,154,108]);

      const rgb   = getColor(layers.L1.type);
      const shade = f => rgb.map(c => Math.max(0, Math.floor(c*f)));

      // Shared isometric projection helper
      const isoProj = (cx, cy, sc, aX, aZ) => {
        const ax = aX*Math.PI/180, az = aZ*Math.PI/180;
        return (X,Y,Z) => ({
          u: cx + (X*Math.cos(ax) - Z*Math.cos(az)) * sc,
          v: cy + (X*Math.sin(ax) + Z*Math.sin(az) - Y) * sc,
        });
      };
      const isoPoly = (pts, col) => {
        doc.setFillColor(...col); doc.setDrawColor(0); doc.setLineWidth(0.2);
        const d = [];
        for (let i=1; i<pts.length; i++) d.push([pts[i].u-pts[i-1].u, pts[i].v-pts[i-1].v]);
        doc.lines(d, pts[0].u, pts[0].v, [1,1], 'FD', true);
      };

      const drawOpenBox3D = (cx, cy, L, W, H, aX, aZ, sc) => {
        const proj = isoProj(cx, cy, sc, aX, aZ);
        const p000=proj(0,0,0),pL00=proj(L,0,0),p00W=proj(0,0,W),pL0W=proj(L,0,W);
        const p0H0=proj(0,H,0),pLH0=proj(L,H,0),p0HW=proj(0,H,W),pLHW=proj(L,H,W);
        const fLn = topFlapL>0?topFlapL:W/2;
        const a45 = Math.PI/4;
        const dY = fLn*Math.sin(a45), dXZ = fLn*Math.cos(a45);
        const f10=proj(0,H+dY,-dXZ),f1L=proj(L,H+dY,-dXZ);
        isoPoly([p0H0,pLH0,f1L,f10], rgb);
        const f40=proj(-dXZ,H+dY,0),f4W=proj(-dXZ,H+dY,W);
        isoPoly([p0H0,p0HW,f4W,f40], shade(0.95));
        isoPoly([p000,pL00,pL0W,p00W], shade(0.85));
        isoPoly([p000,p0H0,pLH0,pL00], shade(0.95));
        isoPoly([p000,p0H0,p0HW,p00W], shade(0.75));
        isoPoly([p00W,p0HW,pLHW,pL0W], rgb);
        isoPoly([pL00,pLH0,pLHW,pL0W], shade(0.95));
        const f20=proj(L+dXZ,H+dY,0),f2W=proj(L+dXZ,H+dY,W);
        isoPoly([pLH0,pLHW,f2W,f20], shade(0.95));
        const f30=proj(0,H+dY,W+dXZ),f3L=proj(L,H+dY,W+dXZ);
        isoPoly([p0HW,pLHW,f3L,f30], rgb);
        doc.setFontSize(6); doc.setFont(undefined,'normal'); doc.setTextColor(40,80,150);
        doc.text(`L=${L}`, (p00W.u+pL0W.u)/2, (p00W.v+pL0W.v)/2+3, {align:'center'});
        doc.text(`W=${W}`, (pL00.u+pL0W.u)/2+2, (pL00.v+pL0W.v)/2+2, {align:'left'});
        doc.text(`H=${H}`, (p00W.u+p0HW.u)/2-2, (p00W.v+p0HW.v)/2, {align:'right'});
        doc.setTextColor(0,0,0);
      };

      // Draws a tray box with walls + open lid in isometric projection
      const drawTrayBox3D = (cx, cy, L, W, H, aX, aZ, sc) => {
        const proj = isoProj(cx, cy, sc, aX, aZ);
        // Bottom face
        const b00=proj(0,0,0), bL0=proj(L,0,0), b0W=proj(0,0,W), bLW=proj(L,0,W);
        isoPoly([b00,bL0,bLW,b0W], shade(0.85));
        // Front wall (+Z)
        const fH0=proj(0,H,0), fHL=proj(L,H,0);
        isoPoly([b00,bL0,fHL,fH0], shade(0.95));
        // Right wall (+X)
        const rHW=proj(L,H,W);
        isoPoly([bL0,bLW,rHW,fHL], shade(0.90));
        // Left wall (-X, partially visible)
        const lHW=proj(0,H,W);
        isoPoly([b00,b0W,lHW,fH0], shade(0.75));
        // Back wall (-Z, behind)
        isoPoly([b0W,bLW,rHW,lHW], rgb);
        // Lid – open at ~45° backward from back wall top edge
        const lidAngle = 40 * Math.PI / 180;
        const lidDy = W * Math.cos(lidAngle);
        const lidDup = W * Math.sin(lidAngle);
        const lid0=proj(0, H + lidDup, W);
        const lidL=proj(L, H + lidDup, W);
        const lid0b=proj(0, H + lidDup, W + lidDy);
        const lidLb=proj(L, H + lidDup, W + lidDy);
        isoPoly([lHW, rHW, lidL, lid0], shade(1.05));
        // Lid top surface
        isoPoly([lid0, lidL, lidLb, lid0b], shade(0.92));
        // Dimension labels
        doc.setFontSize(6); doc.setFont(undefined,'normal'); doc.setTextColor(40,80,150);
        doc.text(`L=${L}`, (b00.u+bL0.u)/2, (b00.v+bL0.v)/2+3, {align:'center'});
        doc.text(`W=${W}`, (bL0.u+bLW.u)/2+2, (bL0.v+bLW.v)/2+2, {align:'left'});
        doc.text(`H=${H}`, (b00.u+fH0.u)/2-2, (b00.v+fH0.v)/2, {align:'right'});
        doc.setTextColor(0,0,0);
      };

      const maxD  = Math.max(iL, iW, iH);
      const bsc   = 28 / maxD;
      const boxCX = rightZX + rightZW/2;
      const view3H = 65;  // height of 3D view area

      const c3d = document.querySelector('canvas');
      if (c3d) {
        // Create an offscreen 2D canvas to flatten the transparent WebGL canvas onto a white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = c3d.width;
        tempCanvas.height = c3d.height;
        const tCtx = tempCanvas.getContext('2d');
        
        // Fill white background
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the 3D canvas over the white background
        tCtx.drawImage(c3d, 0, 0);
        
        // Export as JPEG (no transparency issues)
        const snapshotData = tempCanvas.toDataURL('image/jpeg', 1.0);

        // High fidelity actual 3D render snapshot
        doc.addImage(snapshotData, 'JPEG', rightZX, cY, rightZW, 60, undefined, 'FAST');
      } else {
        // Fallback to basic wireframe isometric
        if (isTrayWithLid) {
          drawTrayBox3D(boxCX, cY + 22, iL, iW, iH, 30, 30, bsc);
        } else {
          drawOpenBox3D(boxCX, cY + 22, iL, iW, iH, 30, 30, bsc);
        }
        doc.setFontSize(8); doc.setFont(undefined,'bold');
        doc.text('Isometric View (Vector Fallback)', boxCX, cY + view3H, {align:'center'});
      }



      // VIP flag removed
      // ─── LEFT PANEL: Die-cut sheet ────────────────────────────────────────
      const shCX = sheetZX;
      const shCY = cY + 2;
      const shCW = sheetZW;
      const shCH = cH - 2;

      // ── helper: creased line style ──
      const setCrease = () => {
        doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5); doc.setLineDash([2, 1.5], 0);
      };
      const setCut = () => {
        doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.55); doc.setLineDash([], 0);
      };
      const resetColor = () => { doc.setDrawColor(0); doc.setTextColor(0,0,0); };

      const drawHDim = (x1, x2, y, label) => {
        doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.3); doc.setTextColor(220, 38, 38);
        doc.setFontSize(5.5); doc.setFont(undefined, 'bold');
        doc.line(x1, y - 1.5, x1, y + 1.5); doc.line(x2, y - 1.5, x2, y + 1.5);
        doc.line(x1, y, x2, y);
        doc.lines([[1.5, 1], [-1.5, -1], [1.5, -1]], x1, y, [1,1], 'S', true);
        doc.lines([[-1.5, 1], [1.5, -1], [-1.5, -1]], x2, y, [1,1], 'S', true);
        doc.text(label, (x1 + x2) / 2, y - 1.5, { align: 'center' });
        resetColor();
      };

      const drawVDim = (y1, y2, x, label) => {
        doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.3); doc.setTextColor(220, 38, 38);
        doc.setFontSize(5.5); doc.setFont(undefined, 'bold');
        doc.line(x - 1.5, y1, x + 1.5, y1); doc.line(x - 1.5, y2, x + 1.5, y2);
        doc.line(x, y1, x, y2);
        doc.lines([[1, 1.5], [-1, -1.5], [-1, 1.5]], x, y1, [1,1], 'S', true);
        doc.lines([[1, -1.5], [-1, 1.5], [-1, -1.5]], x, y2, [1,1], 'S', true);
        doc.text(label, x - 2, (y1 + y2) / 2, { align: 'right' });
        resetColor();
      };

      if (isTelescope) {
        // ──────────────────────────────────────────────────────────────────
        // TELESCOPE DIE-CUT
        // Two blanks drawn to scale:
        //   1. Lid tray cross-shape  (L+ × W+ with v-deep rims)  ×2
        //   2. Base body strip       (L W L W) × H + v-tabs
        // ──────────────────────────────────────────────────────────────────
        const v   = blueprint.lidDepth || Math.round(iH * 0.35);
        const gf  = blueprint.glueFlap  || 30;
        const Lp  = iL + 6;   // lid length outer (+2 board thicknesses)
        const Wp  = iW + 6;   // lid width  outer

        const lidBW   = Lp + 2*v;      // lid blank overall width
        const lidBH   = Wp + 2*v;      // lid blank overall height
        const stripW  = gf + iL + iW + iL + iW;  // base strip width
        const stripH  = iH + v;        // base strip height incl. v-tabs

        const intGap  = 8;             // gap (mm in PDF) between lid and base
        const totalTW = Math.max(lidBW, stripW);
        const totalTH = lidBH + intGap/*, ignored */+ stripH;

        const tsc = Math.min(shCW / totalTW, shCH / totalTH) * 0.85;

        // Origins
        const ox = shCX + (shCW - totalTW * tsc) / 2;
        const oy = shCY + Math.min(15, (shCH - totalTH * tsc) / 2);

        // Scaled values
        const sv  = v  * tsc;
        const sLp = Lp * tsc;
        const sWp = Wp * tsc;
        const sgf = gf * tsc;
        const sL  = iL * tsc;
        const sW  = iW * tsc;
        const sH  = iH * tsc;

        // Lid blank starts centered horizontally
        const lox = ox + (totalTW - lidBW) / 2 * tsc;
        const loy = oy;

        // ── Lid blank (cross) ──
        // Cross path: 12-segment polygon, starting top-left of top rim
        const cStart = [lox + sv, loy];
        const crossDeltas = [
          [sLp, 0],   // → top-right of top rim
          [0,   sv],  // ↓ inner corner
          [sv,  0],   // → outer right top
          [0,   sWp], // ↓ right side
          [-sv, 0],   // ← inner corner
          [0,   sv],  // ↓ bottom of right flap
          [-sLp,0],   // ← bottom rim
          [0,  -sv],  // ↑ inner corner
          [-sv, 0],   // ← outer left bottom
          [0,  -sWp], // ↑ left side
          [sv,  0],   // → inner corner (back to start)
        ];

        doc.setFillColor(248, 250, 252);
        setCut();
        doc.lines(crossDeltas, cStart[0], cStart[1], [1,1], 'FD', true);

        // Crease lines (inner rectangle = top face)
        setCrease();
        doc.rect(lox + sv, loy + sv, sLp, sWp);
        doc.setLineDash([],0); resetColor();

        // Labels
        drawHDim(lox + sv, lox + sv + sLp, loy + sv - 4, `L+: ${Lp}mm`);
        drawVDim(loy + sv, loy + sv + sWp, lox + sv + sLp + sv + 4, `W+: ${Wp}mm`);
        
        doc.setFontSize(6); doc.setFont(undefined,'normal'); doc.setTextColor(100,116,139);
        doc.text(`v: ${v}mm`, lox + sv + sLp/2, loy + sv/2 + 1, {align:'center'});
        doc.text(`v: ${v}mm`, lox + sv/2, loy + sv + sWp/2 + 1, {align:'center'});
        doc.setFontSize(9); doc.setFont(undefined,'bold'); doc.setTextColor(30,41,59);
        doc.text('×2', lox + sv + sLp + sv + 12, loy + sv + sWp/2);

        // ── Base strip ──
        const bx = ox + (totalTW - stripW) / 2 * tsc;
        const by = oy + lidBH * tsc + intGap;

        // v-tabs at top of each panel
        const panelDefs = [
          { x: bx + sgf,           w: sL },
          { x: bx + sgf + sL,      w: sW },
          { x: bx + sgf + sL + sW, w: sL },
          { x: bx + sgf + sL + sW + sL, w: sW },
        ];
        doc.setFillColor(241,245,249);
        setCut();
        doc.setLineDash([1.5,1.5],0);
        panelDefs.forEach(p => doc.rect(p.x+1, by-sv, p.w-2, sv, 'FD'));
        doc.setLineDash([],0);

        // Panel bodies
        const colL = [255,251,245];
        const colW = [240,249,255];
        setCrease();
        panelDefs.forEach((p, i) => {
          doc.setFillColor(...(i % 2 === 0 ? colL : colW));
          doc.rect(p.x, by, p.w, sH, 'FD');
        });
        doc.setLineDash([],0); resetColor();

        // Right cut edge
        setCut();
        doc.line(bx + sgf + sL + sW + sL + sW, by, bx + sgf + sL + sW + sL + sW, by + sH);

        // Glue flap
        if (gf > 0) {
          doc.setFillColor(241,245,249);
          const s15 = 15 * tsc;
          const gfPts = [[sgf, -s15], [0, sH], [-sgf, -s15]];
          doc.lines(gfPts, bx, by+s15, [1,1], 'FD', true);
          setCrease();
          doc.line(bx+sgf, by, bx+sgf, by+sH);
          doc.setLineDash([],0); resetColor();
        }

        // Base strip labels
        const stripY = by - sv - 4;
        drawHDim(panelDefs[0].x, panelDefs[0].x + sL, stripY, `L: ${iL}mm`);
        drawHDim(panelDefs[1].x, panelDefs[1].x + sW, stripY, `W: ${iW}mm`);
        drawHDim(panelDefs[2].x, panelDefs[2].x + sL, stripY, `L: ${iL}mm`);
        drawHDim(panelDefs[3].x, panelDefs[3].x + sW, stripY, `W: ${iW}mm`);
        drawVDim(by, by + sH, bx - 6, `H: ${iH}mm`);
        doc.setFontSize(6); doc.setFont(undefined,'normal'); doc.setTextColor(148,163,184);
        doc.text(`v: ${v}mm`,  panelDefs[0].x + panelDefs[0].w/2, by - sv/2 + 1, {align:'center'});
        doc.setTextColor(0,0,0);

        // Model name sub-label
        doc.setFontSize(7); doc.setFont(undefined,'italic');
        doc.text(blueprint.name, shCX + shCW/2, oy + totalTH * tsc + 6, {align:'center'});

      } else if (isTrayWithLid) {
        // ──────────────────────────────────────────────────────────────────
        // TRAY WITH LID DIE-CUT (0426 / 0427) — Horizontal mailer box
        // Panels L→R: Tuck(t) | Lid(W) | Back(H) | Bottom(W) | Front(H)
        // Side wings extend above/below Bottom panel
        // ──────────────────────────────────────────────────────────────────
        const is0427 = blueprint.code === '0427';
        const tFlap  = blueprint.tuckFlap || Math.max(15, Math.round(iH * 0.4));

        const BW = tFlap + iW + iH + iW + iH;
        const sideExt = is0427 ? (2 * iH) : iH;
        const BH = iL + 2 * sideExt;

        const tsc = Math.min(shCW / BW, shCH / BH) * 0.85;
        const ox  = shCX + (shCW - BW * tsc) / 2;
        const oy  = shCY + Math.min(15, (shCH - BH * tsc) / 2);

        // Scaled segments
        const st  = tFlap * tsc;
        const sW  = iW * tsc;
        const sH  = iH * tsc;
        const sL  = iL * tsc;
        const sExt = sideExt * tsc;

        // X boundaries (left → right)
        const xc0 = ox;
        const xc1 = xc0 + st;   // tuck/lid
        const xc2 = xc1 + sW;   // lid/back
        const xc3 = xc2 + sH;   // back/bottom
        const xc4 = xc3 + sW;   // bottom/front
        const xc5 = xc4 + sH;   // front right edge

        // Y boundaries
        const yc1 = oy + sExt;  // top of body
        const yc2 = yc1 + sL;   // bottom of body

        // Helper to draw an absolute polygon
        const drawAbsPoly = (pts, fillCol) => {
          doc.setFillColor(...fillCol);
          setCut();
          const d = [];
          for (let i = 1; i < pts.length; i++) {
            d.push([pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]]);
          }
          doc.lines(d, pts[0][0], pts[0][1], [1,1], 'FD', true);
        };

        const s10 = 10 * tsc, s2 = 2 * tsc, s5 = 5 * tsc, s8 = 8 * tsc, s12 = 12 * tsc;

        // ── Main panels (Rectangles) ──
        doc.setFillColor(219, 234, 254); doc.rect(xc1, yc1, sW, sL, 'FD'); // Lid
        doc.setFillColor(255, 251, 245); doc.rect(xc2, yc1, sH, sL, 'FD'); // Back
        doc.setFillColor(254, 249, 195); doc.rect(xc3, yc1, sW, sL, 'FD'); // Bottom
        doc.setFillColor(255, 251, 245); doc.rect(xc4, yc1, sH, sL, 'FD'); // Front

        // ── Tuck flap (chamfered left) ──
        const slant = Math.min(10, iH * 0.15) * tsc;
        drawAbsPoly([[xc1, yc1], [xc0, yc1 + slant], [xc0, yc2 - slant], [xc1, yc2]], [224, 242, 254]);

        // ── Dust Flaps (Ears) ──
        const earLidC = [219, 234, 254], earW = [255, 251, 245];
        // Lid ears
        drawAbsPoly([[xc1,yc1], [xc1+s10, yc1-sH+s2], [xc2-s10, yc1-sH+s2], [xc2,yc1]], earLidC);
        drawAbsPoly([[xc1,yc2], [xc1+s10, yc2+sH-s2], [xc2-s10, yc2+sH-s2], [xc2,yc2]], earLidC);
        // Back ears
        drawAbsPoly([[xc2,yc1], [xc2+s5, yc1-sH+s2], [xc3-s5, yc1-sH+s2], [xc3,yc1]], earW);
        drawAbsPoly([[xc2,yc2], [xc2+s5, yc2+sH-s2], [xc3-s5, yc2+sH-s2], [xc3,yc2]], earW);
        // Front ears
        drawAbsPoly([[xc4,yc1], [xc4+s5, yc1-sH+s2], [xc5-s5, yc1-sH+s2], [xc5,yc1]], earW);
        drawAbsPoly([[xc4,yc2], [xc4+s5, yc2+sH-s2], [xc5-s5, yc2+sH-s2], [xc5,yc2]], earW);

        // ── Side wings (above/below Bottom panel) ──
        const wingC = [220, 252, 231];
        if (is0427) {
          const tW = Math.max(12, Math.round(iW * 0.15)) * tsc;
          const tO1 = iW * 0.25 * tsc - tW / 2;
          const tO2 = iW * 0.75 * tsc - tW / 2;

          drawAbsPoly([
            [xc3,yc1], [xc3,yc1-sH], [xc3+s12,yc1-2*sH], [xc3+tO1,yc1-2*sH], [xc3+tO1,yc1-2*sH-s8], 
            [xc3+tO1+tW,yc1-2*sH-s8], [xc3+tO1+tW,yc1-2*sH], [xc3+tO2,yc1-2*sH], [xc3+tO2,yc1-2*sH-s8], 
            [xc3+tO2+tW,yc1-2*sH-s8], [xc3+tO2+tW,yc1-2*sH], [xc4-s12,yc1-2*sH], [xc4,yc1-sH], [xc4,yc1]
          ], wingC);

          drawAbsPoly([
            [xc3,yc2], [xc3,yc2+sH], [xc3+s12,yc2+2*sH], [xc3+tO1,yc2+2*sH], [xc3+tO1,yc2+2*sH+s8], 
            [xc3+tO1+tW,yc2+2*sH+s8], [xc3+tO1+tW,yc2+2*sH], [xc3+tO2,yc2+2*sH], [xc3+tO2,yc2+2*sH+s8], 
            [xc3+tO2+tW,yc2+2*sH+s8], [xc3+tO2+tW,yc2+2*sH], [xc4-s12,yc2+2*sH], [xc4,yc2+sH], [xc4,yc2]
          ], wingC);
          
          // Lock slots
          setCut(); doc.setLineWidth(0.4);
          doc.line(xc3 + tO1, yc1, xc3 + tO1 + tW, yc1);
          doc.line(xc3 + tO2, yc1, xc3 + tO2 + tW, yc1);
          doc.line(xc3 + tO1, yc2, xc3 + tO1 + tW, yc2);
          doc.line(xc3 + tO2, yc2, xc3 + tO2 + tW, yc2);
          doc.setLineWidth(0.2); resetColor();
        } else {
          drawAbsPoly([[xc3, yc1], [xc3, yc1 - sH], [xc4, yc1 - sH], [xc4, yc1]], wingC);
          drawAbsPoly([[xc3, yc2], [xc3, yc2 + sH], [xc4, yc2 + sH], [xc4, yc2]], wingC);
        }

        // ── Right cut edge ──
        setCut();
        doc.line(xc5, yc1, xc5, yc2);

        // ── Crease lines ──
        setCrease();
        // Vertical creases between panels
        doc.line(xc1, yc1, xc1, yc2);
        doc.line(xc2, yc1, xc2, yc2);
        doc.line(xc3, yc1, xc3, yc2);
        doc.line(xc4, yc1, xc4, yc2);
        // Horizontal creases at side wing attachment
        doc.line(xc3, yc1, xc4, yc1);
        doc.line(xc3, yc2, xc4, yc2);
        
        // 0427: rollover crease lines on side wings
        if (is0427) {
          doc.line(xc3, yc1 - sH, xc4, yc1 - sH);
          doc.line(xc3, yc2 + sH, xc4, yc2 + sH);
        }
        doc.setLineDash([],0); resetColor();

        // ── Panel labels ──
        doc.setFontSize(5.5); doc.setFont(undefined,'bold'); doc.setTextColor(30,41,59);
        const midY = yc1 + sL/2 + 1;
        doc.text('TUCK', xc0 + st/2, midY, {align:'center'});
        doc.text('LID', xc1 + sW/2, midY, {align:'center'});
        doc.text('BACK', xc2 + sH/2, midY, {align:'center'});
        doc.text('BOTTOM', xc3 + sW/2, midY, {align:'center'});
        doc.text('FRONT', xc4 + sH/2, midY, {align:'center'});

        // Side wing labels
        doc.setTextColor(22, 163, 74);
        doc.text('SIDE', xc3 + sW/2, yc1 - sH/2 + 1, {align:'center'});
        doc.text('SIDE', xc3 + sW/2, yc2 + sH/2 + 1, {align:'center'});

        // Dimension labels above panels
        const topY = yc1 - 6;
        drawHDim(xc0, xc1, topY, `t: ${tFlap}mm`);
        drawHDim(xc1, xc2, topY, `W: ${iW}mm`);
        drawHDim(xc2, xc3, topY, `H: ${iH}mm`);
        drawHDim(xc3, xc4, yc1 - sExt - 6, `W: ${iW}mm`);
        drawHDim(xc4, xc5, topY, `H: ${iH}mm`);
        drawVDim(yc1, yc2, ox - 6, `L: ${iL}mm`);

        // Total dimensions
        doc.setFontSize(5); doc.setFont(undefined,'normal'); doc.setTextColor(100,116,139);
        doc.text(`Blank: ${BW} × ${BH} mm`, xc0 + (xc5 - xc0)/2, yc2 + sExt + 4, {align:'center'});
        doc.setTextColor(0,0,0);

        // Model name
        doc.setFontSize(7); doc.setFont(undefined,'italic');
        doc.text(blueprint.name, shCX + shCW/2, yc2 + sExt + 10, {align:'center'});

      } else if (isHingedFolder) {
        // ──────────────────────────────────────────────────────────────────
        // HINGED FOLDER DIE-CUT (0409)
        // Horizontal strip: W | H | W | H, height = L, plus lid tab on panel 4
        // ──────────────────────────────────────────────────────────────────
        const ld = blueprint.lidDepth || Math.round(iW / 2);
        const BW = iW + iH + iW + iH;   // total blank width
        const BH = iL + ld;              // total blank height

        const tsc = Math.min(shCW / BW, shCH / BH) * 0.85;
        const ox  = shCX + (shCW - BW * tsc) / 2;
        const oy  = shCY + Math.min(15, (shCH - BH * tsc) / 2);

        const sW  = iW * tsc, sH = iH * tsc;
        const sL  = iL * tsc, sld = ld * tsc;

        // Panel x boundaries
        const px0 = ox, px1 = ox+sW, px2 = ox+sW+sH, px3 = ox+sW+sH+sW, px4 = ox+sW+sH+sW+sH;
        const y0 = oy, y1 = oy + sL, y2 = oy + sL + sld;

        // Main body (all 4 panels, height=L)
        const colW1 = [255,251,245];
        const colH  = [240,249,255];
        const colW2 = [254,249,195];

        doc.setFillColor(...colW1); doc.rect(px0, y0, sW, sL, 'F');
        doc.setFillColor(...colH);  doc.rect(px1, y0, sH, sL, 'F');
        doc.setFillColor(...colW2); doc.rect(px2, y0, sW, sL, 'F');
        doc.setFillColor(...colH);  doc.rect(px3, y0, sH, sL, 'F');

        // Lid tab on panel 4 only
        doc.setFillColor(219,234,254);
        doc.rect(px3, y1, sH, sld, 'F');

        // Outer cut lines
        setCut();
        const dLine = [
          [BW*tsc, 0], [0, sL+sld], [-sH, 0], [0, -sld], [-(BW*tsc - sH), 0], [0, -sL]
        ];
        doc.lines(dLine, px0, y0, [1,1], 'S', true);

        // Crease / fold lines
        setCrease();
        doc.line(px1, y0, px1, y1);
        doc.line(px2, y0, px2, y1);
        doc.line(px3, y0, px3, y2);
        doc.line(px3, y1, px4, y1); // hinge line
        doc.setLineDash([],0); resetColor();

        // Labels
        const topLblY = y0 - 6;
        drawHDim(px0, px1, topLblY, `W: ${iW}mm`);
        drawHDim(px1, px2, topLblY, `H: ${iH}mm`);
        drawHDim(px2, px3, topLblY, `W: ${iW}mm`);
        drawHDim(px3, px4, topLblY, `H: ${iH}mm`);

        drawVDim(y0, y1, ox - 6, `L: ${iL}mm`);
        drawVDim(y1, y2, px3 - 6, `v: ${ld}mm`);
        doc.setFontSize(7); doc.setFont(undefined,'italic');
        doc.text(blueprint.name, shCX + shCW/2, y2 + 5, {align:'center'});

      } else {
        // ──────────────────────────────────────────────────────────────────
        // STANDARD DIE-CUT (slotted layout)
        // Matches SheetVisualizer StandardLayout exactly
        // ──────────────────────────────────────────────────────────────────
        const maxTF  = Math.max(topFlapL, topFlapW);
        const maxBF  = Math.max(bottomFlapL, bottomFlapW);
        const totalSW = glueFlap + iL + iW + iL + iW;
        const totalSH = maxTF + iH + maxBF;

        const ssc = Math.min(shCW / totalSW, shCH / totalSH) * 0.85;

        const ox = shCX + (shCW - totalSW * ssc) / 2;
        const oy = shCY + Math.min(15, (shCH - totalSH * ssc) / 2);

        const scGf  = glueFlap    * ssc;
        const scL   = iL          * ssc;
        const scW   = iW          * ssc;
        const scH   = iH          * ssc;
        const scTFL = topFlapL    * ssc;
        const scTFW = topFlapW    * ssc;
        const scBFL = bottomFlapL * ssc;
        const scBFW = bottomFlapW * ssc;
        const scMTF = maxTF       * ssc;

        const startX = ox + scGf;
        const startY = oy + scMTF;

        // Panel bodies (crease lines = blue dashed)
        const colL = [255,251,245];
        const colW = [240,249,255];
        setCrease();
        doc.setFillColor(...colL); doc.rect(startX,           startY, scL, scH, 'FD');
        doc.setFillColor(...colW); doc.rect(startX+scL,       startY, scW, scH, 'FD');
        doc.setFillColor(...colL); doc.rect(startX+scL+scW,   startY, scL, scH, 'FD');
        doc.setFillColor(...colW); doc.rect(startX+scL*2+scW, startY, scW, scH, 'FD');
        doc.setLineDash([],0); resetColor();

        // Flaps (cut lines = dark solid)
        doc.setFillColor(248,250,252);
        setCut();
        if (scTFL > 0) {
          doc.rect(startX,           startY-scTFL, scL, scTFL, 'FD');
          doc.rect(startX+scL+scW,   startY-scTFL, scL, scTFL, 'FD');
        }
        if (scTFW > 0) {
          doc.rect(startX+scL,       startY-scTFW, scW, scTFW, 'FD');
          doc.rect(startX+scL*2+scW, startY-scTFW, scW, scTFW, 'FD');
        }
        if (!blueprint.isCrashLock) {
          if (scBFL > 0) {
            doc.rect(startX,           startY+scH, scL, scBFL, 'FD');
            doc.rect(startX+scL+scW,   startY+scH, scL, scBFL, 'FD');
          }
          if (scBFW > 0) {
            doc.rect(startX+scL,       startY+scH, scW, scBFW, 'FD');
            doc.rect(startX+scL*2+scW, startY+scH, scW, scBFW, 'FD');
          }
        } else {
          // Crash-lock bottom flaps mapped exactly like SheetVisualizer
          const drawAbsPoly = (pts, fillCol) => {
            doc.setFillColor(...fillCol);
            setCut();
            const d = [];
            for(let i=1; i<pts.length; i++) d.push([pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]]);
            doc.lines(d, pts[0][0], pts[0][1], [1,1], 'FD', true);
          };

          const sW2 = scW / 2;
          const sx = startX;
          const sy = startY + scH;
          
          // Panel 1
          drawAbsPoly([
            [sx, sy], [sx, sy+sW2], [sx+scL*0.2, sy+sW2], 
            [sx+scL*0.3, sy+sW2+20*ssc], [sx+scL, sy+sW2+20*ssc], [sx+scL, sy]
          ], [241,245,249]);
          
          // Panel 2
          doc.setFillColor(224,242,254); setCut();
          doc.rect(sx+scL, sy, scW, sW2, 'FD');
          setCrease();
          doc.line(sx+scL+scW, sy, sx+scL+scW*0.3, sy+sW2);
          
          // Panel 3
          drawAbsPoly([
            [sx+scL+scW, sy], [sx+scL+scW+20*ssc, sy+sW2+20*ssc],
            [sx+scL+scW+scL, sy+sW2+20*ssc], [sx+scL+scW+scL, sy]
          ], [241,245,249]);
          
          // Panel 4
          doc.setFillColor(224,242,254); setCut();
          doc.rect(sx+scL+scW+scL, sy, scW, sW2, 'FD');
          setCrease();
          doc.line(sx+scL+scW+scL, sy, sx+scL+scW+scL+scW*0.7, sy+sW2);
        }

        // Glue flap
        if (glueFlap > 0) {
          doc.setFillColor(241,245,249);
          const s15 = 15 * ssc;
          const gfPts = [[scGf, -s15], [0, scH], [-scGf, -s15]];
          doc.lines(gfPts, ox, startY+s15, [1,1], 'FD', true);
          setCrease();
          doc.line(startX, startY, startX, startY+scH);
          doc.setLineDash([],0); resetColor();
        }

        // Right cut edge
        setCut();
        doc.line(startX+scL*2+scW*2, startY, startX+scL*2+scW*2, startY+scH);
        resetColor();

        // Dimension labels
        const lblY = oy + scMTF - scMTF/2 - 1;
        if (scMTF > 0) doc.text(`Flap: ${maxTF}mm`, startX + scL/2, lblY, {align:'center'});
        const topLblY = oy - 4;
        drawHDim(startX, startX + scL, topLblY, `L: ${iL}mm`);
        drawHDim(startX + scL, startX + scL + scW, topLblY, `W: ${iW}mm`);
        drawHDim(startX + scL + scW, startX + scL*2 + scW, topLblY, `L: ${iL}mm`);
        drawHDim(startX + scL*2 + scW, startX + scL*2 + scW*2, topLblY, `W: ${iW}mm`);

        drawVDim(startY, startY + scH, ox - 4, `H: ${iH}mm`);
        
        doc.setFontSize(6); doc.setFont(undefined,'normal'); doc.setTextColor(148,163,184);
        doc.text(`Panel L`, startX + scL/2,          startY + scH/2, {align:'center'});
        doc.text(`Panel W`, startX + scL + scW/2,    startY + scH/2, {align:'center'});
        doc.text(`Panel L`, startX + scL+scW + scL/2,startY + scH/2, {align:'center'});
        doc.text(`Panel W`, startX + scL*2+scW+scW/2,startY + scH/2, {align:'center'});
        doc.setTextColor(0,0,0);

        // Model name sub-label
        doc.setFontSize(7); doc.setFont(undefined,'italic');
        doc.text(blueprint.name, shCX + shCW/2, startY + scH + Math.max(scBFL, scBFW) + 9, {align:'center'});
      }

      // ─── Legend ───────────────────────────────────────────────────────────
      const legY = tbY - 5;
      doc.setFontSize(6); doc.setFont(undefined,'normal');
      setCut();
      doc.line(sheetZX, legY, sheetZX+16, legY);
      resetColor();
      doc.text('Cutting Line', sheetZX+18, legY+1);
      setCrease();
      doc.line(sheetZX+55, legY, sheetZX+71, legY);
      doc.setLineDash([],0); resetColor();
      doc.text('Fold / Crease Line', sheetZX+73, legY+1);

      doc.save(`MSP_Printout_${fefcoCode || '0201'}.pdf`);

    } catch (err) {
      console.error('PDF Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        onClick={() => handleExport()}
        disabled={isExporting}
        style={{
          width: '100%', padding: '0.75rem',
          background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: '0.5rem',
          cursor: isExporting ? 'wait' : 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
          opacity: isExporting ? 0.65 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isExporting ? '⏳ Generating PDF…' : '↓ Generate Vector Printout'}
      </button>

      <p style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
        * The 3D Projection area uses a live snapshot if you view the 3D Box tab first.
      </p>
    </div>
  );
}
