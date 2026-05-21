import { getFefcoBlueprint } from '../utils/FefcoEngine';

// ─── Shared dimension-drawing helpers ─────────────────────────────────────────

/** Arrow-marker definitions (injected once inside each <svg><defs>) */
function DimMarkers({ id = 'dim', color = '#dc2626' }) {
  return (
    <>
      <marker id={`${id}-e`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill={color} />
      </marker>
      <marker id={`${id}-s`} markerWidth="7" markerHeight="7" refX="0" refY="3.5" orient="auto-start-reverse">
        <path d="M0,0 L6,3.5 L0,7 Z" fill={color} />
      </marker>
    </>
  );
}

/**
 * Horizontal dimension line with arrowheads + centred label.
 * label placed ABOVE the line (offset -16px by default).
 */
function HDim({ x1, x2, y, label, id = 'dim', color = '#dc2626', fontSize = 13 }) {
  const mx = (x1 + x2) / 2;
  return (
    <g>
      {/* Tick marks */}
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} stroke={color} strokeWidth="1.2" />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} stroke={color} strokeWidth="1.2" />
      {/* Arrow line */}
      <line
        x1={x1} y1={y} x2={x2} y2={y}
        stroke={color} strokeWidth="1.4"
        markerStart={`url(#${id}-s)`} markerEnd={`url(#${id}-e)`}
      />
      {/* Label */}
      <text x={mx} y={y - 8} textAnchor="middle" fill={color}
        fontSize={fontSize} fontWeight="700" dominantBaseline="alphabetic">
        {label}
      </text>
    </g>
  );
}

/**
 * Vertical dimension line with arrowheads + rotated centred label.
 * label placed LEFT of the line (offset -16px by default).
 */
function VDim({ y1, y2, x, label, id = 'dim', color = '#dc2626', fontSize = 13 }) {
  const my = (y1 + y2) / 2;
  return (
    <g>
      {/* Tick marks */}
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} stroke={color} strokeWidth="1.2" />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} stroke={color} strokeWidth="1.2" />
      {/* Arrow line */}
      <line
        x1={x} y1={y1} x2={x} y2={y2}
        stroke={color} strokeWidth="1.4"
        markerStart={`url(#${id}-s)`} markerEnd={`url(#${id}-e)`}
      />
      {/* Rotated label */}
      <text
        x={x - 10} y={my}
        textAnchor="middle" fill={color}
        fontSize={fontSize} fontWeight="700"
        transform={`rotate(-90,${x - 10},${my})`}
      >
        {label}
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard (slotted) die-cut layout — ALL dimensions annotated
// ─────────────────────────────────────────────────────────────────────────────
function StandardLayout({ L, W, H, blueprint }) {
  const { topFlapL, topFlapW, bottomFlapL, bottomFlapW, glueFlap } = blueprint;

  const maxTopFlap = Math.max(topFlapL, topFlapW);
  const maxBotFlap = Math.max(bottomFlapL, bottomFlapW);
  const totalWidth  = glueFlap + L + W + L + W;
  const totalHeight = maxTopFlap + H + maxBotFlap;

  // Generous margins: left for H/glue labels, top for panel-width row, right for flap labels
  const mLeft  = 90;
  const mTop   = 70;   // room for panel width dimension row
  const mRight = 90;   // room for flap-depth annotations
  const mBot   = 70;   // room for bottom flap + legend

  const vbW = totalWidth  + mLeft + mRight;
  const vbH = totalHeight + mTop  + mBot;

  const cut    = '#dc2626';
  const crease = '#16a34a';
  const dimC   = '#dc2626';   // engineering red for dimension annotations
  const dimId  = 'std-dim';

  // Panel origins
  const sx = mLeft + glueFlap;  // x-start of panel 1
  const sy = mTop  + maxTopFlap; // y-start of panels (top of body)

  // Right edge of panel 4
  const rx = sx + L + W + L + W;

  // Dimension row Y (above everything, including top flaps)
  const dimRowY = mTop - 38;

  // Extension lines: thin grey lines projecting up from panel edges to dim row
  const extLineColor = '#94a3b8';
  const extLineY1    = mTop - 40;
  const extLineY2    = sy - maxTopFlap - 4;

  const extX = [sx, sx + L, sx + L + W, sx + L + W + L, rx];

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '90%', height: '90%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
    >
      <defs>
        <pattern id="grid-std" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <DimMarkers id={dimId} color={dimC} />
      </defs>

      {/* Background */}
      <image href={`${import.meta.env.BASE_URL}msp-logo.png`} x={vbW*0.25} y={vbH*0.25} width={vbW*0.5} height={vbH*0.5}
        opacity="0.10" preserveAspectRatio="xMidYMid meet" />
      <rect width="100%" height="100%" fill="url(#grid-std)" />

      {/* ── Extension lines from panel edges up to dimension row ─────── */}
      {extX.map((x, i) => (
        <line key={i} x1={x} y1={extLineY2} x2={x} y2={extLineY1}
          stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
      ))}
      {/* Extension line from glue-flap left edge */}
      {glueFlap > 0 && (
        <line x1={mLeft} y1={extLineY2} x2={mLeft} y2={extLineY1}
          stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
      )}

      {/* ── Panel-width dimension row ─────────────────────────────────── */}
      {/* Glue flap */}
      {glueFlap > 0 && (
        <HDim x1={mLeft} x2={sx} y={dimRowY} label={`Glue: ${glueFlap}mm`} id={dimId} color={dimC} fontSize={11} />
      )}
      {/* Panel 1 – L */}
      <HDim x1={sx}           x2={sx+L}           y={dimRowY} label={`L: ${L}mm`}   id={dimId} color={dimC} />
      {/* Panel 2 – W */}
      <HDim x1={sx+L}         x2={sx+L+W}         y={dimRowY} label={`W: ${W}mm`}   id={dimId} color={dimC} />
      {/* Panel 3 – L */}
      <HDim x1={sx+L+W}       x2={sx+L+W+L}       y={dimRowY} label={`L: ${L}mm`}   id={dimId} color={dimC} />
      {/* Panel 4 – W */}
      <HDim x1={sx+L+W+L}     x2={rx}             y={dimRowY} label={`W: ${W}mm`}   id={dimId} color={dimC} />

      {/* ── Total width dimension (one row above panel row) ───────────── */}
      <HDim
        x1={glueFlap > 0 ? mLeft : sx} x2={rx}
        y={dimRowY - 24}
        label={`Total blank width: ${totalWidth}mm`}
        id={dimId} color="#7c3aed" fontSize={12}
      />

      {/* ── H dimension (left side) ───────────────────────────────────── */}
      <VDim y1={sy} y2={sy + H} x={mLeft - 30} label={`H: ${H}mm`} id={dimId} color={dimC} />

      {/* ── Total height (further left) ──────────────────────────────── */}
      {totalHeight > H && (
        <VDim
          y1={sy - maxTopFlap} y2={sy + H + maxBotFlap}
          x={mLeft - 58}
          label={`Total: ${totalHeight}mm`}
          id={dimId} color="#7c3aed" fontSize={12}
        />
      )}

      {/* ── Top-flap depth annotations (right side) ──────────────────── */}
      {topFlapL > 0 && (
        <>
          {/* Extension lines */}
          <line x1={rx+2} y1={sy - topFlapL} x2={rx + mRight - 10} y2={sy - topFlapL}
            stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
          <line x1={rx+2} y1={sy} x2={rx + mRight - 10} y2={sy}
            stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
          <VDim
            y1={sy - topFlapL} y2={sy}
            x={rx + 45}
            label={`Flap: ${topFlapL}mm`}
            id={dimId} color={dimC} fontSize={12}
          />
        </>
      )}
      {/* If W-flap depth differs from L-flap depth, annotate it too */}
      {topFlapW > 0 && topFlapW !== topFlapL && (
        <>
          <line x1={rx+2} y1={sy - topFlapW} x2={rx + mRight - 10} y2={sy - topFlapW}
            stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
          <VDim
            y1={sy - topFlapW} y2={sy}
            x={rx + 70}
            label={`W-Flap: ${topFlapW}mm`}
            id={dimId} color={dimC} fontSize={12}
          />
        </>
      )}

      {/* ── Bottom-flap depth annotation (right side) ────────────────── */}
      {bottomFlapL > 0 && (
        <>
          <line x1={rx+2} y1={sy + H} x2={rx + mRight - 10} y2={sy + H}
            stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
          <line x1={rx+2} y1={sy + H + bottomFlapL} x2={rx + mRight - 10} y2={sy + H + bottomFlapL}
            stroke={extLineColor} strokeWidth="0.8" strokeDasharray="4,3" />
          <VDim
            y1={sy + H} y2={sy + H + bottomFlapL}
            x={rx + 45}
            label={`Flap: ${bottomFlapL}mm`}
            id={dimId} color={dimC} fontSize={12}
          />
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* DRAWING GEOMETRY                                                 */}
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* Glue flap */}
      {glueFlap > 0 && (
        <>
          <path d={`M ${mLeft} ${sy+15} L ${sx} ${sy} L ${sx} ${sy+H} L ${mLeft} ${sy+H-15} Z`}
            fill="#e2e8f0" stroke={cut} strokeWidth="2" />
          <line x1={sx} y1={sy} x2={sx} y2={sy+H} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
          {/* Glue flap label inside */}
          <text x={mLeft + glueFlap/2} y={sy + H/2} textAnchor="middle"
            fill="#64748b" fontSize="11" transform={`rotate(-90,${mLeft+glueFlap/2},${sy+H/2})`}>
            {glueFlap}mm
          </text>
        </>
      )}

      {/* ── Panels with coloured fills ───────────────────────────────── */}
      {/* Panel 1 (L) – lightest */}
      <rect x={sx}       y={sy} width={L} height={H} fill="#fffbf5" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Panel 2 (W) */}
      <rect x={sx+L}     y={sy} width={W} height={H} fill="#f0f9ff" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Panel 3 (L) */}
      <rect x={sx+L+W}   y={sy} width={L} height={H} fill="#fffbf5" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Panel 4 (W) */}
      <rect x={sx+L+W+L} y={sy} width={W} height={H} fill="#f0f9ff" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />

      {/* Panel labels (inside panel body) */}
      {[
        { x: sx + L/2,       label: `L` },
        { x: sx+L + W/2,     label: `W` },
        { x: sx+L+W + L/2,   label: `L` },
        { x: sx+L+W+L + W/2, label: `W` },
      ].map(({ x, label }, i) => (
        <text key={i} x={x} y={sy + H/2 + 5} textAnchor="middle"
          fill="#cbd5e1" fontSize={Math.min(H * 0.35, 50)} fontWeight="900">
          {label}
        </text>
      ))}

      {/* ── Flaps ─────────────────────────────────────────────────────── */}
      {topFlapL    > 0 && <rect x={sx}       y={sy-topFlapL}    width={L} height={topFlapL}    fill="#f1f5f9" stroke={cut} strokeWidth="2" />}
      {topFlapW    > 0 && <rect x={sx+L}     y={sy-topFlapW}    width={W} height={topFlapW}    fill="#e0f2fe" stroke={cut} strokeWidth="2" />}
      {topFlapL    > 0 && <rect x={sx+L+W}   y={sy-topFlapL}    width={L} height={topFlapL}    fill="#f1f5f9" stroke={cut} strokeWidth="2" />}
      {topFlapW    > 0 && <rect x={sx+L+W+L} y={sy-topFlapW}    width={W} height={topFlapW}    fill="#e0f2fe" stroke={cut} strokeWidth="2" />}

      {bottomFlapL > 0 && <rect x={sx}       y={sy+H}           width={L} height={bottomFlapL} fill="#f1f5f9" stroke={cut} strokeWidth="2" />}
      {bottomFlapW > 0 && <rect x={sx+L}     y={sy+H}           width={W} height={bottomFlapW} fill="#e0f2fe" stroke={cut} strokeWidth="2" />}
      {bottomFlapL > 0 && <rect x={sx+L+W}   y={sy+H}           width={L} height={bottomFlapL} fill="#f1f5f9" stroke={cut} strokeWidth="2" />}
      {bottomFlapW > 0 && <rect x={sx+L+W+L} y={sy+H}           width={W} height={bottomFlapW} fill="#e0f2fe" stroke={cut} strokeWidth="2" />}

      {/* Right cut edge */}
      <line x1={rx} y1={sy} x2={rx} y2={sy+H} stroke={cut} strokeWidth="2.5" />

      {/* ── Flap label inside each flap ───────────────────────────────── */}
      {topFlapL > 0 && (
        <text x={sx + L/2} y={sy - topFlapL/2 + 5} textAnchor="middle"
          fill="#94a3b8" fontSize="11">{topFlapL}mm</text>
      )}
      {topFlapW > 0 && (
        <text x={sx+L + W/2} y={sy - topFlapW/2 + 5} textAnchor="middle"
          fill="#94a3b8" fontSize="11">{topFlapW}mm</text>
      )}
      {bottomFlapL > 0 && (
        <text x={sx + L/2} y={sy + H + bottomFlapL/2 + 5} textAnchor="middle"
          fill="#94a3b8" fontSize="11">{bottomFlapL}mm</text>
      )}
      {bottomFlapW > 0 && (
        <text x={sx+L + W/2} y={sy + H + bottomFlapW/2 + 5} textAnchor="middle"
          fill="#94a3b8" fontSize="11">{bottomFlapW}mm</text>
      )}

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <line x1={mLeft} y1={vbH-22} x2={mLeft+36} y2={vbH-22} stroke={cut} strokeWidth="2" />
      <text x={mLeft+46} y={vbH-17} fontSize="12" fill="#333">Cutting Line</text>
      <line x1={mLeft+160} y1={vbH-22} x2={mLeft+196} y2={vbH-22}
        stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <text x={mLeft+206} y={vbH-17} fontSize="12" fill="#333">Crease / Fold Line</text>
      <line x1={mLeft+340} y1={vbH-22} x2={mLeft+376} y2={vbH-22}
        stroke={dimC} strokeWidth="2"
        markerStart={`url(#${dimId}-s)`} markerEnd={`url(#${dimId}-e)`} />
      <text x={mLeft+386} y={vbH-17} fontSize="12" fill="#333">Dimension</text>

      {/* Model name */}
      <text x={vbW - 10} y={vbH - 10} textAnchor="end" fontSize="11" fill="#94a3b8" fontStyle="italic">
        {blueprint.name}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Telescope die-cut layout — ALL dimensions annotated
// ─────────────────────────────────────────────────────────────────────────────
function TelescopeLayout({ L, W, H, blueprint }) {
  const v   = blueprint.lidDepth || Math.round(H * 0.35);
  const gf  = blueprint.glueFlap || 30;
  const Lp  = L + 6;
  const Wp  = W + 6;

  const cut    = '#1e293b';
  const crease = '#3b82f6';
  const dimC   = '#dc2626';
  const dimId  = 'tel-dim';

  const margin = 60;
  const gap    = 70;   // gap between lid blank and base strip
  const mRight = 100;  // right margin for flap annotations

  const lidBW = Lp + 2 * v;
  const lidBH = Wp + 2 * v;
  const baseStripW = gf + L + W + L + W;
  const baseStripH = H + v;   // panels + v-tab height

  const vbW = Math.max(lidBW, baseStripW) + margin + mRight + margin;
  const vbH = margin + lidBH + gap + baseStripH + margin + 50;

  const lox = margin;
  const loy = margin;
  const bx  = margin;
  const by  = loy + lidBH + gap;

  // Lid cross path
  const lidPath = [
    `M ${lox + v},${loy}`,
    `L ${lox + v + Lp},${loy}`,
    `L ${lox + v + Lp},${loy + v}`,
    `L ${lox + 2*v + Lp},${loy + v}`,
    `L ${lox + 2*v + Lp},${loy + v + Wp}`,
    `L ${lox + v + Lp},${loy + v + Wp}`,
    `L ${lox + v + Lp},${loy + 2*v + Wp}`,
    `L ${lox + v},${loy + 2*v + Wp}`,
    `L ${lox + v},${loy + v + Wp}`,
    `L ${lox},${loy + v + Wp}`,
    `L ${lox},${loy + v}`,
    `L ${lox + v},${loy + v}`,
    'Z',
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '90%', height: '90%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
    >
      <defs>
        <pattern id="grid-tel" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <DimMarkers id={dimId} color={dimC} />
      </defs>

      <image href={`${import.meta.env.BASE_URL}msp-logo.png`} x={vbW*0.25} y={vbH*0.25} width={vbW*0.5} height={vbH*0.5}
        opacity="0.09" preserveAspectRatio="xMidYMid meet" />
      <rect width="100%" height="100%" fill="url(#grid-tel)" />

      {/* ── LID BLANK ─────────────────────────────────────────────────── */}
      <path d={lidPath} fill="#f0f9ff" stroke={cut} strokeWidth="2" strokeLinejoin="round" />

      {/* Crease lines (inner top face) */}
      <line x1={lox+v}    y1={loy+v}    x2={lox+v+Lp} y2={loy+v}    stroke={crease} strokeWidth="2" strokeDasharray="8,5" />
      <line x1={lox+v}    y1={loy+v+Wp} x2={lox+v+Lp} y2={loy+v+Wp} stroke={crease} strokeWidth="2" strokeDasharray="8,5" />
      <line x1={lox+v}    y1={loy+v}    x2={lox+v}    y2={loy+v+Wp} stroke={crease} strokeWidth="2" strokeDasharray="8,5" />
      <line x1={lox+v+Lp} y1={loy+v}    x2={lox+v+Lp} y2={loy+v+Wp} stroke={crease} strokeWidth="2" strokeDasharray="8,5" />

      {/* Top-face tint */}
      <rect x={lox+v} y={loy+v} width={Lp} height={Wp} fill="rgba(255,255,255,0.7)" />

      {/* ── LID DIMENSION ANNOTATIONS ─────────────────────────────────── */}
      {/* L+ (width of top face) */}
      <HDim x1={lox+v} x2={lox+v+Lp} y={loy+v-28} label={`L+: ${Lp}mm`} id={dimId} color={dimC} />
      {/* Lp + 2v = total blank width */}
      <HDim x1={lox} x2={lox+2*v+Lp} y={loy+v-50} label={`Lid blank width: ${lidBW}mm`} id={dimId} color="#7c3aed" fontSize={12} />
      {/* W+ (height of top face) — right side */}
      <VDim y1={loy+v} y2={loy+v+Wp} x={lox+2*v+Lp+30} label={`W+: ${Wp}mm`} id={dimId} color={dimC} />
      {/* Total lid height */}
      <VDim y1={loy} y2={loy+2*v+Wp} x={lox+2*v+Lp+58} label={`Lid blank height: ${lidBH}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* v labels on each rim */}
      {/* Top rim */}
      <VDim y1={loy} y2={loy+v} x={lox+v+Lp/2} label={`v: ${v}mm`} id={dimId} color={dimC} fontSize={11} />
      {/* Bottom rim */}
      <VDim y1={loy+v+Wp} y2={loy+2*v+Wp} x={lox+v+Lp/2} label={`v: ${v}mm`} id={dimId} color={dimC} fontSize={11} />
      {/* Left rim */}
      <HDim x1={lox} x2={lox+v} y={loy+v+Wp/2} label={`v: ${v}mm`} id={dimId} color={dimC} fontSize={11} />
      {/* Right rim */}
      <HDim x1={lox+v+Lp} x2={lox+2*v+Lp} y={loy+v+Wp/2} label={`v: ${v}mm`} id={dimId} color={dimC} fontSize={11} />

      {/* ×2 badge */}
      <text x={lox+lidBW+16} y={loy+lidBH/2+8} textAnchor="start" fill="#334155" fontSize="24" fontWeight="900">×2</text>

      {/* ── BASE BODY STRIP ───────────────────────────────────────────── */}
      {/* Glue flap */}
      {gf > 0 && (
        <>
          <path d={`M ${bx} ${by+15} L ${bx+gf} ${by} L ${bx+gf} ${by+H} L ${bx} ${by+H-15} Z`}
            fill="#e2e8f0" stroke={cut} strokeWidth="2" />
          <line x1={bx+gf} y1={by} x2={bx+gf} y2={by+H}
            stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
          <text x={bx+gf/2} y={by+H/2} textAnchor="middle" fill="#64748b" fontSize="11"
            transform={`rotate(-90,${bx+gf/2},${by+H/2})`}>{gf}mm</text>
          {/* Glue flap dimension */}
          <HDim x1={bx} x2={bx+gf} y={by - v - 28} label={`Glue: ${gf}mm`} id={dimId} color={dimC} fontSize={11} />
        </>
      )}

      {/* Panels */}
      <rect x={bx+gf}         y={by} width={L} height={H} fill="#fffbf5" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <rect x={bx+gf+L}       y={by} width={W} height={H} fill="#f0f9ff" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <rect x={bx+gf+L+W}     y={by} width={L} height={H} fill="#fffbf5" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <rect x={bx+gf+L+W+L}   y={by} width={W} height={H} fill="#f0f9ff" stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />

      {/* Right cut edge */}
      <line x1={bx+gf+L+W+L+W} y1={by} x2={bx+gf+L+W+L+W} y2={by+H} stroke={cut} strokeWidth="2.5" />

      {/* v-tabs at top of each panel */}
      {[bx+gf, bx+gf+L, bx+gf+L+W, bx+gf+L+W+L].map((px, i) => {
        const pw = i % 2 === 0 ? L : W;
        return (
          <rect key={i} x={px+2} y={by-v} width={pw-4} height={v}
            fill="#e0f2fe" stroke={cut} strokeWidth="1.5" strokeDasharray="5,4" />
        );
      })}

      {/* ── BASE STRIP DIMENSION ANNOTATIONS ─────────────────────────── */}
      {/* Panel width dimensions above v-tabs */}
      <HDim x1={bx+gf}         x2={bx+gf+L}       y={by-v-28} label={`L: ${L}mm`} id={dimId} color={dimC} />
      <HDim x1={bx+gf+L}       x2={bx+gf+L+W}     y={by-v-28} label={`W: ${W}mm`} id={dimId} color={dimC} />
      <HDim x1={bx+gf+L+W}     x2={bx+gf+L+W+L}   y={by-v-28} label={`L: ${L}mm`} id={dimId} color={dimC} />
      <HDim x1={bx+gf+L+W+L}   x2={bx+gf+L+W+L+W} y={by-v-28} label={`W: ${W}mm`} id={dimId} color={dimC} />

      {/* Total base strip width */}
      <HDim x1={bx} x2={bx+gf+L+W+L+W} y={by-v-52} label={`Base strip width: ${gf+L+W+L+W}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* H dimension (left side of base strip) */}
      <VDim y1={by} y2={by+H} x={bx-32} label={`H: ${H}mm`} id={dimId} color={dimC} />

      {/* v-tab depth (right side) */}
      <VDim y1={by-v} y2={by} x={bx+gf+L+W+L+W+30} label={`v: ${v}mm`} id={dimId} color={dimC} fontSize={12} />
      {/* Total panel height (H + v) */}
      <VDim y1={by-v} y2={by+H} x={bx+gf+L+W+L+W+58} label={`H+v: ${H+v}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* Panel labels inside panels */}
      {[
        { x: bx+gf + L/2,       lbl: 'L' },
        { x: bx+gf+L + W/2,     lbl: 'W' },
        { x: bx+gf+L+W + L/2,   lbl: 'L' },
        { x: bx+gf+L+W+L + W/2, lbl: 'W' },
      ].map(({ x, lbl }, i) => (
        <text key={i} x={x} y={by + H/2 + 5} textAnchor="middle"
          fill="#cbd5e1" fontSize={Math.min(H*0.35, 50)} fontWeight="900">{lbl}</text>
      ))}

      {/* v-tab labels */}
      <text x={bx+gf + L/2} y={by-v/2+4} textAnchor="middle" fill="#64748b" fontSize="11">v</text>

      {/* ── LEGEND ────────────────────────────────────────────────────── */}
      <line x1={margin} y1={vbH-22} x2={margin+36} y2={vbH-22} stroke={cut} strokeWidth="2" />
      <text x={margin+46} y={vbH-17} fontSize="12" fill="#333">Cutting Line</text>
      <line x1={margin+160} y1={vbH-22} x2={margin+196} y2={vbH-22}
        stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <text x={margin+206} y={vbH-17} fontSize="12" fill="#333">Crease / Fold Line</text>
      <line x1={margin+340} y1={vbH-22} x2={margin+376} y2={vbH-22}
        stroke={dimC} strokeWidth="2"
        markerStart={`url(#${dimId}-s)`} markerEnd={`url(#${dimId}-e)`} />
      <text x={margin+386} y={vbH-17} fontSize="12" fill="#333">Dimension</text>

      {/* Model name */}
      <text x={vbW-10} y={vbH-10} textAnchor="end" fontSize="11" fill="#94a3b8" fontStyle="italic">
        {blueprint.name}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────
// Tray + Hinged Lid die-cut layout (0426 / 0427)
//
// T-shaped blank (one-piece, no glue on body walls):
//
//            ┌──────────────────┐
//            │  LID   (L×ld)  │  ← hinged to back wall
//            └──────────────────┘
// ┌──────────┼──────────────────┼──────────┐
// │ SIDE (W×body)│  BACK  (L×H)  │SIDE (W×body)│
// │ ││ inside crease│  BOTTOM(L×W)  │ ││ inside crease│
// │ double wall   │  FRONT (L×H)  │ double wall   │
// └──────────┼──────────────────┼──────────┘
//            ┌──────────────────┐
//            │ FRONT LIP (L×lp)│
//            └──────────────────┘
//
// Total blank: (W + L + W) wide × (ld + H + W + H + lp) tall
// Side panels span body only (back+bottom+front height = H+W+H)
// Double-wall crease divides each side panel into inner/outer halves
// Lock tab punch-outs at corners of side panels
// ─────────────────────────────────────────────────────────────────────────────────
function TrayWithLidLayout({ L, W, H, blueprint }) {
  const is0427 = blueprint.code === '0427';
  const t = blueprint.tuckFlap || Math.max(15, Math.round(H * 0.4));
  const slant = 10;
  
  const cut      = '#1e293b';
  const crease   = '#3b82f6';
  const dimC     = '#dc2626';
  const dimId    = 'twl-dim';

  // Horizontal segments
  const mLeft = 90;
  const xc0 = mLeft;
  const xc1 = xc0 + t;
  const xc2 = xc1 + W;
  const xc3 = xc2 + H;
  const xc4 = xc3 + W;
  const xc5 = xc4 + H;
  const BW = t + W + H + W + H; // blank width

  // Vertical segments
  const mTop = 90;
  const mBot = 90;
  const ext = is0427 ? (2 * H + 8) : H;
  const yc1 = mTop + ext;
  const yc2 = yc1 + L;
  const BH = L + 2 * ext; // blank height

  const vbW = BW + mLeft * 2 + 20;
  const vbH = BH + mTop + mBot + 40;

  // Paths for panels
  const tuckFlapPath = `M ${xc1},${yc1} L ${xc0},${yc1 + slant} L ${xc0},${yc2 - slant} L ${xc1},${yc2} Z`;
  
  // Lid dust flaps (ears)
  const lidTopFlapPath = `M ${xc1},${yc1} L ${xc1 + 10},${yc1 - H + 2} L ${xc2 - 10},${yc1 - H + 2} L ${xc2},${yc1} Z`;
  const lidBotFlapPath = `M ${xc1},${yc2} L ${xc1 + 10},${yc2 + H - 2} L ${xc2 - 10},${yc2 + H - 2} L ${xc2},${yc2} Z`;
  
  // Back Wall dust flaps
  const backTopFlapPath = `M ${xc2},${yc1} L ${xc2 + 5},${yc1 - H + 2} L ${xc3 - 5},${yc1 - H + 2} L ${xc3},${yc1} Z`;
  const backBotFlapPath = `M ${xc2},${yc2} L ${xc2 + 5},${yc2 + H - 2} L ${xc3 - 5},${yc2 + H - 2} L ${xc3},${yc2} Z`;

  // Front Wall dust flaps
  const frontTopFlapPath = `M ${xc4},${yc1} L ${xc4 + 5},${yc1 - H + 2} L ${xc5 - 5},${yc1 - H + 2} L ${xc5},${yc1} Z`;
  const frontBotFlapPath = `M ${xc4},${yc2} L ${xc4 + 5},${yc2 + H - 2} L ${xc5 - 5},${yc2 + H - 2} L ${xc5},${yc2} Z`;

  // Side Wings:
  // 0426 top/bottom single-wall side wings
  const sideTopPath0426 = `M ${xc3},${yc1} L ${xc3},${yc1 - H} L ${xc4},${yc1 - H} L ${xc4},${yc1} Z`;
  const sideBotPath0426 = `M ${xc3},${yc2} L ${xc3},${yc2 + H} L ${xc4},${yc2 + H} L ${xc4},${yc2} Z`;

  // 0427 double-wall side wings with cherry locks
  const tabW = Math.max(12, Math.round(W * 0.15));
  const tabOffset1 = W * 0.25 - tabW / 2;
  const tabOffset2 = W * 0.75 - tabW / 2;

  const sideTopPath0427 = `M ${xc3},${yc1} 
    L ${xc3},${yc1 - H} 
    L ${xc3 + 12},${yc1 - 2*H} 
    L ${xc3 + tabOffset1},${yc1 - 2*H} 
    L ${xc3 + tabOffset1},${yc1 - 2*H - 8} 
    L ${xc3 + tabOffset1 + tabW},${yc1 - 2*H - 8} 
    L ${xc3 + tabOffset1 + tabW},${yc1 - 2*H}
    L ${xc3 + tabOffset2},${yc1 - 2*H} 
    L ${xc3 + tabOffset2},${yc1 - 2*H - 8} 
    L ${xc3 + tabOffset2 + tabW},${yc1 - 2*H - 8} 
    L ${xc3 + tabOffset2 + tabW},${yc1 - 2*H}
    L ${xc4 - 12},${yc1 - 2*H} 
    L ${xc4},${yc1 - H} 
    L ${xc4},${yc1} Z`;

  const sideBotPath0427 = `M ${xc3},${yc2} 
    L ${xc3},${yc2 + H} 
    L ${xc3 + 12},${yc2 + 2*H} 
    L ${xc3 + tabOffset1},${yc2 + 2*H} 
    L ${xc3 + tabOffset1},${yc2 + 2*H + 8} 
    L ${xc3 + tabOffset1 + tabW},${yc2 + 2*H + 8} 
    L ${xc3 + tabOffset1 + tabW},${yc2 + 2*H}
    L ${xc3 + tabOffset2},${yc2 + 2*H} 
    L ${xc3 + tabOffset2},${yc2 + 2*H + 8} 
    L ${xc3 + tabOffset2 + tabW},${yc2 + 2*H + 8} 
    L ${xc3 + tabOffset2 + tabW},${yc2 + 2*H}
    L ${xc4 - 12},${yc2 + 2*H} 
    L ${xc4},${yc2 + H} 
    L ${xc4},${yc2} Z`;

  const sideTopPath = is0427 ? sideTopPath0427 : sideTopPath0426;
  const sideBotPath = is0427 ? sideBotPath0427 : sideBotPath0426;

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '90%', height: '90%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
      <defs>
        <pattern id="grid-twl" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <DimMarkers id={dimId} color={dimC} />
      </defs>
      <image href={`${import.meta.env.BASE_URL}msp-logo.png`} x={vbW*0.25} y={vbH*0.25} width={vbW*0.5} height={vbH*0.5}
        opacity="0.09" preserveAspectRatio="xMidYMid meet" />
      <rect width="100%" height="100%" fill="url(#grid-twl)" />

      {/* ── DRAWING FILLS AND CUT OUTLINES ────────────────────────── */}
      {/* Tuck Flap */}
      <path d={tuckFlapPath} fill="#e0f2fe" stroke={cut} strokeWidth="2" />
      
      {/* Lid Dust Flaps */}
      <path d={lidTopFlapPath} fill="#dbeafe" stroke={cut} strokeWidth="2" />
      <path d={lidBotFlapPath} fill="#dbeafe" stroke={cut} strokeWidth="2" />

      {/* Back Wall Dust Flaps */}
      <path d={backTopFlapPath} fill="#f8fafc" stroke={cut} strokeWidth="2" />
      <path d={backBotFlapPath} fill="#f8fafc" stroke={cut} strokeWidth="2" />

      {/* Front Wall Dust Flaps */}
      <path d={frontTopFlapPath} fill="#f8fafc" stroke={cut} strokeWidth="2" />
      <path d={frontBotFlapPath} fill="#f8fafc" stroke={cut} strokeWidth="2" />

      {/* Lid */}
      <rect x={xc1} y={yc1} width={W} height={L} fill="#dbeafe" stroke={cut} strokeWidth="2" />

      {/* Back Wall */}
      <rect x={xc2} y={yc1} width={H} height={L} fill="#fffbf5" stroke={cut} strokeWidth="2" />

      {/* Bottom */}
      <rect x={xc3} y={yc1} width={W} height={L} fill="#fef9c3" stroke={cut} strokeWidth="2" />

      {/* Front Wall */}
      <rect x={xc4} y={yc1} width={H} height={L} fill="#fffbf5" stroke={cut} strokeWidth="2" />

      {/* Side Wings */}
      <path d={sideTopPath} fill="#dcfce7" stroke={cut} strokeWidth="2" />
      <path d={sideBotPath} fill="#dcfce7" stroke={cut} strokeWidth="2" />

      {/* 0427 Cherry Lock slots on Bottom panel crease lines */}
      {is0427 && (
        <>
          <rect x={xc3 + tabOffset1} y={yc1 - 1.5} width={tabW} height={3} fill="#fff" stroke={cut} strokeWidth="1.5" />
          <rect x={xc3 + tabOffset2} y={yc1 - 1.5} width={tabW} height={3} fill="#fff" stroke={cut} strokeWidth="1.5" />
          <rect x={xc3 + tabOffset1} y={yc2 - 1.5} width={tabW} height={3} fill="#fff" stroke={cut} strokeWidth="1.5" />
          <rect x={xc3 + tabOffset2} y={yc2 - 1.5} width={tabW} height={3} fill="#fff" stroke={cut} strokeWidth="1.5" />
        </>
      )}

      {/* ── DRAWING CREASE LINES (OVERLAYS) ────────────────────────── */}
      {/* Tuck / Lid crease */}
      <line x1={xc1} y1={yc1} x2={xc1} y2={yc2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Lid / Back crease */}
      <line x1={xc2} y1={yc1} x2={xc2} y2={yc2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Back / Bottom crease */}
      <line x1={xc3} y1={yc1} x2={xc3} y2={yc2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      {/* Bottom / Front crease */}
      <line x1={xc4} y1={yc1} x2={xc4} y2={yc2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      
      {/* Side wing attachment creases */}
      <line x1={xc3} y1={yc1} x2={xc4} y2={yc1} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <line x1={xc3} y1={yc2} x2={xc4} y2={yc2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />

      {/* 0427 double-wall rollover crease lines */}
      {is0427 && (
        <>
          <line x1={xc3} y1={yc1 - H} x2={xc4} y2={yc1 - H} stroke={crease} strokeWidth="1.5" strokeDasharray="5,4" />
          <line x1={xc3} y1={yc2 + H} x2={xc4} y2={yc2 + H} stroke={crease} strokeWidth="1.5" strokeDasharray="5,4" />
        </>
      )}

      {/* ── PANEL LABELS ─────────────────────────────────────────── */}
      <text x={xc1 - t/2} y={(yc1+yc2)/2 + 4} textAnchor="middle" fill="#0284c7" fontSize="11" fontWeight="700" transform={`rotate(-90,${xc1 - t/2},${(yc1+yc2)/2})`}>TUCK</text>
      <text x={xc1 + W/2} y={(yc1+yc2)/2 + 6} textAnchor="middle" fill="#3b82f6" fontSize={Math.min(W*0.28, L*0.09, 28)} fontWeight="900">LID</text>
      <text x={xc2 + H/2} y={(yc1+yc2)/2 + 5} textAnchor="middle" fill="#94a3b8" fontSize={Math.min(H*0.28, L*0.09, 22)} fontWeight="800" transform={`rotate(-90,${xc2 + H/2},${(yc1+yc2)/2})`}>BACK</text>
      <text x={xc3 + W/2} y={(yc1+yc2)/2 + 6} textAnchor="middle" fill="#ca8a04" fontSize={Math.min(W*0.28, L*0.09, 28)} fontWeight="900">BOTTOM</text>
      <text x={xc4 + H/2} y={(yc1+yc2)/2 + 5} textAnchor="middle" fill="#94a3b8" fontSize={Math.min(H*0.28, L*0.09, 22)} fontWeight="800" transform={`rotate(-90,${xc4 + H/2},${(yc1+yc2)/2})`}>FRONT</text>

      {/* Side wing labels */}
      <text x={xc3 + W/2} y={yc1 - H/2 + 4} textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="800">SIDE WALL</text>
      <text x={xc3 + W/2} y={yc2 + H/2 + 4} textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="800">SIDE WALL</text>

      {/* ── HORIZONTAL DIMENSION ANNOTATIONS (TOP ROW) ────────────── */}
      {[xc0, xc1, xc2, xc3, xc4, xc5].map((x, i) => (
        <line key={i} x1={x} y1={yc1 - ext - 20} x2={x} y2={yc1 - ext - 5} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      ))}
      <HDim x1={xc0} x2={xc1} y={yc1 - ext - 12} label={`t: ${t}mm`} id={dimId} color={dimC} fontSize={11} />
      <HDim x1={xc1} x2={xc2} y={yc1 - ext - 12} label={`W: ${W}mm`} id={dimId} color={dimC} />
      <HDim x1={xc2} x2={xc3} y={yc1 - ext - 12} label={`H: ${H}mm`} id={dimId} color={dimC} />
      <HDim x1={xc3} x2={xc4} y={yc1 - ext - 12} label={`W: ${W}mm`} id={dimId} color={dimC} />
      <HDim x1={xc4} x2={xc5} y={yc1 - ext - 12} label={`H: ${H}mm`} id={dimId} color={dimC} />
      
      <HDim x1={xc0} x2={xc5} y={yc1 - ext - 30} label={`Total blank width: ${BW}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* ── VERTICAL DIMENSION ANNOTATIONS (LEFT & RIGHT) ─────────── */}
      <line x1={xc0 - 5} y1={yc1} x2={xc0 - 25} y2={yc1} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={xc0 - 5} y1={yc2} x2={xc0 - 25} y2={yc2} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <VDim y1={yc1} y2={yc2} x={xc0 - 15} label={`L: ${L}mm`} id={dimId} color={dimC} />

      <line x1={xc4 + H + 5} y1={yc1 - ext} x2={xc4 + H + 25} y2={yc1 - ext} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={xc4 + H + 5} y1={yc1} x2={xc4 + H + 25} y2={yc1} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={xc4 + H + 5} y1={yc2} x2={xc4 + H + 25} y2={yc2} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={xc4 + H + 5} y1={yc2 + ext} x2={xc4 + H + 25} y2={yc2 + ext} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      
      {is0427 ? (
        <>
          <VDim y1={yc1 - H} y2={yc1} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
          <VDim y1={yc1 - 2*H} y2={yc1 - H} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
          <VDim y1={yc2} y2={yc2 + H} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
          <VDim y1={yc2 + H} y2={yc2 + 2*H} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
        </>
      ) : (
        <>
          <VDim y1={yc1 - H} y2={yc1} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
          <VDim y1={yc2} y2={yc2 + H} x={xc4 + H + 15} label={`H: ${H}mm`} id={dimId} color={dimC} />
        </>
      )}

      <line x1={xc4 + H + 5} y1={yc1 - ext} x2={xc4 + H + 45} y2={yc1 - ext} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={xc4 + H + 5} y1={yc2 + ext} x2={xc4 + H + 45} y2={yc2 + ext} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3" />
      <VDim y1={yc1 - ext} y2={yc2 + ext} x={xc4 + H + 35} label={`Total blank height: ${BH}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* ── LEGEND ─────────────────────────────────────────────────── */}
      <line x1={mLeft} y1={vbH-22} x2={mLeft+36} y2={vbH-22} stroke={cut} strokeWidth="2"/>
      <text x={mLeft+46} y={vbH-17} fontSize="12" fill="#333">Cutting Line</text>
      <line x1={mLeft+160} y1={vbH-22} x2={mLeft+196} y2={vbH-22}
        stroke={crease} strokeWidth="2.5" strokeDasharray="8,6"/>
      <text x={mLeft+206} y={vbH-17} fontSize="12" fill="#333">Crease / Fold</text>
      <line x1={mLeft+320} y1={vbH-22} x2={mLeft+356} y2={vbH-22}
        stroke={crease} strokeWidth="1.5" strokeDasharray="5,4"/>
      <text x={mLeft+366} y={vbH-17} fontSize="12" fill="#333">Double-wall Crease</text>
      <text x={vbW-10} y={vbH-10} textAnchor="end" fontSize="11" fill="#94a3b8" fontStyle="italic">
        {blueprint.name}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────
// FEFCO 0409 — Hinged Lid Folder Box die-cut layout
//
// Per official FEFCO PDF 12th Ed. (page 47):
//   Panels run LEFT → RIGHT:  W | H | W | H
//   L dimension runs VERTICAL (box length = height of the blank)
//   A small tuck-in lid tab ('<' in PDF) attaches to bottom of right H panel
//   Top flap row at top of all 4 panels (labelled 'L' in the small strip at top)
//
// Assembled:  base (L×W) with H-high walls; the right H-wall has a hinged lid
//             that folds over the top opening.
// ─────────────────────────────────────────────────────────────────────────────────
function HingedFolderLayout({ L, W, H, blueprint }) {
  const ld = blueprint.lidDepth || Math.round(W / 2); // tuck-flap depth

  const cut    = '#dc2626';
  const crease = '#16a34a';
  const dimC   = '#dc2626';
  const dimId  = 'hfl-dim';

  // Total blank: (W+H+W+H) wide × (L+ld) tall
  const BW = W + H + W + H;
  const BH = L + ld;

  const margin  = 90;
  const mRight  = 120;
  const vbW = BW + margin + mRight;
  const vbH = BH + margin * 2 + 60;

  // Panel x-boundaries (left to right: W | H | W | H)
  const x0 = margin;           // left outer edge
  const x1 = x0 + W;          // W/H fold
  const x2 = x1 + H;          // H/W fold
  const x3 = x2 + W;          // W/H fold
  const x4 = x3 + H;          // right outer edge

  // y-boundaries
  const y0 = margin;           // top of blank (top of L body panels)
  const y1 = y0 + L;           // bottom of body / top of lid tab
  const y2 = y1 + ld;          // bottom of blank (lid tuck tab)

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '90%', height: '90%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
      <defs>
        <pattern id="grid-hfl" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <DimMarkers id={dimId} color={dimC} />
      </defs>
      <image href={`${import.meta.env.BASE_URL}msp-logo.png`} x={vbW*0.25} y={vbH*0.25} width={vbW*0.5} height={vbH*0.5}
        opacity="0.09" preserveAspectRatio="xMidYMid meet" />
      <rect width="100%" height="100%" fill="url(#grid-hfl)" />

      {/* ── Main blank outline ─────────────────────────────────── */}
      {/* The lid tab only extends from panel 4 (rightmost H-panel) */}
      <path
        d={[
          `M ${x0},${y0}`, `L ${x4},${y0}`,    // top edge all 4 panels
          `L ${x4},${y2}`,                        // right side down incl. lid tab
          `L ${x3},${y2}`,                        // lid tab bottom left
          `L ${x3},${y1}`,                        // back up to body bottom on panel 4
          `L ${x0},${y1}`,                        // along body bottom
          'Z',
        ].join(' ')}
        fill="#fffbf5" stroke={cut} strokeWidth="2" strokeLinejoin="round"
      />

      {/* ── Panel fills ────────────────────────────────────────── */}
      {/* Panel 1 (W) — side wall */}
      <rect x={x0} y={y0} width={W} height={L} fill="#fffbf5" />
      {/* Panel 2 (H) — front/back wall */}
      <rect x={x1} y={y0} width={H} height={L} fill="#f0f9ff" />
      {/* Panel 3 (W) — base/bottom */}
      <rect x={x2} y={y0} width={W} height={L} fill="#fef9c3" />
      {/* Panel 4 (H) — front/back wall (with hinged lid) */}
      <rect x={x3} y={y0} width={H} height={L} fill="#f0f9ff" />
      {/* Lid tuck tab on panel 4 */}
      <rect x={x3} y={y1} width={H} height={ld} fill="#dbeafe" />

      {/* ── Vertical fold/crease lines ──────────────────────────── */}
      <line x1={x1} y1={y0} x2={x1} y2={y1} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <line x1={x2} y1={y0} x2={x2} y2={y1} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <line x1={x3} y1={y0} x2={x3} y2={y2} stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />

      {/* Hinge line (lid fold) */}
      <line x1={x3} y1={y1} x2={x4} y2={y1} stroke={crease} strokeWidth="3" strokeDasharray="10,6" />

      {/* ── Panel labels ─────────────────────────────────────────── */}
      {[
        { x: x0+W/2,  lbl: 'W', note: 'SIDE WALL',    fill: '#94a3b8' },
        { x: x1+H/2,  lbl: 'H', note: 'END WALL',     fill: '#38bdf8' },
        { x: x2+W/2,  lbl: 'W', note: 'SIDE WALL',    fill: '#94a3b8' },
        { x: x3+H/2,  lbl: 'H', note: 'END WALL+LID', fill: '#38bdf8' },
      ].map(({ x, lbl, note, fill }, i) => (
        <g key={i}>
          <text x={x} y={y0 + L/2} textAnchor="middle"
            fill="#e2e8f0" fontSize={Math.min(L*0.4, 50)} fontWeight="900">{lbl}</text>
          <text x={x} y={y0 + L/2 + Math.min(L*0.22, 26)} textAnchor="middle"
            fill={fill} fontSize={Math.min(L*0.1, 13)} fontWeight="700">{note}</text>
        </g>
      ))}
      {/* Lid label */}
      <text x={x3+H/2} y={y1+ld/2+5} textAnchor="middle"
        fill="#3b82f6" fontSize={Math.min(ld*0.45, 16)} fontWeight="800">LID TAB</text>
      <text x={x3+H+10} y={y1+6} fill="#7c3aed" fontSize="11" fontWeight="700">HINGE</text>

      {/* ── Dimension rows ────────────────────────────────────────── */}
      {/* Width dims row above panels */}
      {[x0,x1,x2,x3,x4].map((x,i) => (
        <line key={i} x1={x} y1={y0-3} x2={x} y2={y0-38}
          stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3"/>
      ))}
      <HDim x1={x0} x2={x1} y={y0-22} label={`W: ${W}mm`} id={dimId} color={dimC} />
      <HDim x1={x1} x2={x2} y={y0-22} label={`H: ${H}mm`} id={dimId} color={dimC} />
      <HDim x1={x2} x2={x3} y={y0-22} label={`W: ${W}mm`} id={dimId} color={dimC} />
      <HDim x1={x3} x2={x4} y={y0-22} label={`H: ${H}mm`} id={dimId} color={dimC} />
      <HDim x1={x0} x2={x4} y={y0-46}
        label={`Total blank width: ${BW}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* Height dims right side */}
      {[y0,y1,y2].map((y,i) => (
        <line key={i} x1={x4+3} y1={y} x2={x4+mRight-12} y2={y}
          stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4,3"/>
      ))}
      <VDim y1={y0} y2={y1} x={x4+40} label={`L: ${L}mm`}  id={dimId} color={dimC} />
      <VDim y1={y1} y2={y2} x={x4+40} label={`<: ${ld}mm`} id={dimId} color={dimC} fontSize={11} />
      <VDim y1={y0} y2={y2} x={x4+72}
        label={`Total height: ${BH}mm`} id={dimId} color="#7c3aed" fontSize={12} />

      {/* Legend */}
      <line x1={margin} y1={vbH-22} x2={margin+36} y2={vbH-22} stroke={cut} strokeWidth="2" />
      <text x={margin+46} y={vbH-17} fontSize="12" fill="#333">Cutting Line</text>
      <line x1={margin+160} y1={vbH-22} x2={margin+196} y2={vbH-22}
        stroke={crease} strokeWidth="2.5" strokeDasharray="8,6" />
      <text x={margin+206} y={vbH-17} fontSize="12" fill="#333">Crease / Fold</text>
      <text x={vbW-10} y={vbH-10} textAnchor="end" fontSize="11" fill="#94a3b8" fontStyle="italic">
        {blueprint.name}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SheetVisualizer component
// ─────────────────────────────────────────────────────────────────────────────
export default function SheetVisualizer({ fefcoCode, dimensions, dimensionType, thickness }) {
  const t = thickness || 3;
  let L = dimensions.length;
  let W = dimensions.width;
  let H = dimensions.height;

  if (dimensionType === 'OD') {
    L = Math.max(L - t * 2, 10);
    W = Math.max(W - t * 2, 10);
    H = Math.max(H - t * 4, 10);
  }

  const blueprint = getFefcoBlueprint(fefcoCode || '0201', { length: L, width: W, height: H });

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden',
    }}>
      {blueprint.isTrayWithLid
        ? <TrayWithLidLayout L={L} W={W} H={H} blueprint={blueprint} />
        : blueprint.isTelescope
          ? <TelescopeLayout L={L} W={W} H={H} blueprint={blueprint} />
          : blueprint.isHingedFolder
            ? <HingedFolderLayout L={L} W={W} H={H} blueprint={blueprint} />
            : <StandardLayout L={L} W={W} H={H} blueprint={blueprint} />
      }
    </div>
  );
}
