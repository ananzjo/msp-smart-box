import React, { useState } from 'react';
import { PAPER_TYPES, FLUTE_MULTIPLIERS } from '../utils/BoardGradeEngine';

// ── FEFCO model catalogue ──────────────────────────────────────────────────
const FEFCO_MODELS = [
  { code: '0110',  label: 'Flat Sheet',                  group: 'Sheet' },
  { code: '0200',  label: 'Half Slotted (HSC)',           group: 'Slotted' },
  { code: '0201',  label: 'Regular Slotted (RSC)',        group: 'Slotted' },
  { code: '0201D', label: 'RSC Variation D',              group: 'Slotted' },
  { code: '0201S', label: 'RSC Variation S',              group: 'Slotted' },
  { code: '0202',  label: 'Overlap Slotted (OSC)',        group: 'Slotted' },
  { code: '0203',  label: 'Full Overlap (FOL)',            group: 'Slotted' },
  { code: '0301',  label: 'Full Telescope (FTB)',          group: 'Telescope' },
  { code: '0306',  label: 'Telescope Design (TDB)',        group: 'Telescope' },
  { code: '0310',  label: 'Telescope Box',                 group: 'Telescope' },
  { code: '0320',  label: 'Telescope Box Var.',            group: 'Telescope' },
  { code: '0409',  label: 'Hinged Lid Folder',             group: 'Folder' },
  { code: '0426',  label: 'Folder Tray + Lid (0426)',      group: 'Folder' },
  { code: '0427',  label: 'Folder Tray Ext. Lid (0427)',   group: 'Folder' },
  { code: '0916',  label: 'Interior Fitment',              group: 'Special' },
];

const GROUP_COLORS = {
  Sheet:     { accent: '#06b6d4', bg: '#ecfeff' },
  Slotted:   { accent: '#3b82f6', bg: '#eff6ff' },
  Telescope: { accent: '#8b5cf6', bg: '#f5f3ff' },
  Folder:    { accent: '#ea580c', bg: '#fff7ed' },
  Special:   { accent: '#f59e0b', bg: '#fffbeb' },
};

// ── Visual Model Picker ────────────────────────────────────────────────────
function ModelPicker({ fefcoCode, setFefcoCode }) {
  const [hoveredCode, setHoveredCode] = useState(null);
  const groups = [...new Set(FEFCO_MODELS.map(m => m.group))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {groups.map(group => {
        const { accent } = GROUP_COLORS[group];
        const models = FEFCO_MODELS.filter(m => m.group === group);
        return (
          <div key={group}>
            <div style={{
              fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: '0.08em', color: accent, marginBottom: '0.4rem',
              paddingLeft: '2px'
            }}>
              {group}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: '0.4rem'
            }}>
              {models.map(({ code, label }) => {
                const isSelected = fefcoCode === code;
                const isHovered  = hoveredCode === code;
                return (
                  <button
                    key={code}
                    title={`${code} – ${label}`}
                    onClick={() => setFefcoCode(code)}
                    onMouseEnter={() => setHoveredCode(code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '0.25rem', padding: '0.4rem 0.25rem 0.35rem',
                      background: isSelected
                        ? accent
                        : isHovered
                          ? GROUP_COLORS[group].bg
                          : 'rgba(255,255,255,0.05)',
                      border: isSelected
                        ? `2px solid ${accent}`
                        : isHovered
                          ? `2px solid ${accent}55`
                          : '2px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? `0 0 12px ${accent}55` : 'none',
                      transform: isHovered && !isSelected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    {/* Model image */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '0.35rem',
                      overflow: 'hidden',
                      background: isSelected ? 'rgba(255,255,255,0.15)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <img
                        src={`/fefco/${code}.png`}
                        alt={code}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'contain',
                          filter: isSelected ? 'brightness(1.1)' : 'none',
                        }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    {/* Code badge */}
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '700',
                      color: isSelected ? '#fff' : accent,
                      lineHeight: 1,
                    }}>
                      {code}
                    </span>
                    {/* Label – truncated */}
                    <span style={{
                      fontSize: '0.55rem',
                      color: isSelected ? 'rgba(255,255,255,0.85)' : '#94a3b8',
                      textAlign: 'center', lineHeight: 1.2,
                      maxWidth: 68, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Controls component ────────────────────────────────────────────────
export default function Controls({
  fefcoCode, setFefcoCode,
  ply, setPly,
  dimensions, setDimensions,
  dimensionType, setDimensionType,
  layers, setLayers
}) {
  const handleDimensionChange = (e) => {
    setDimensions({ ...dimensions, [e.target.name]: Number(e.target.value) });
  };

  const handleLayerChange = (layerKey, field, value) => {
    setLayers({ ...layers, [layerKey]: { ...layers[layerKey], [field]: value } });
  };

  const paperTypeOptions = Object.entries(PAPER_TYPES).map(([key, data]) => (
    <option key={key} value={key}>{key} - {data.type}</option>
  ));

  const renderLayerControl = (layerKey, label, showFlute = false) => {
    const layer = layers[layerKey];
    if (!layer) return null;
    const allowedGsm = PAPER_TYPES[layer.type]?.allowedGSM || [];
    return (
      <div className="control-group layer-control" key={layerKey}>
        <h4>{label} ({layerKey})</h4>
        <div className="input-row">
          <label>Type:</label>
          <select value={layer.type} onChange={(e) => handleLayerChange(layerKey, 'type', e.target.value)}>
            {paperTypeOptions}
          </select>
        </div>
        <div className="input-row">
          <label>GSM:</label>
          <select value={layer.gsm} onChange={(e) => handleLayerChange(layerKey, 'gsm', e.target.value)}>
            <option value="">Select GSM</option>
            {allowedGsm.map(gsm => <option key={gsm} value={gsm}>{gsm}</option>)}
          </select>
        </div>
        {showFlute && (
          <div className="input-row">
            <label>Flute:</label>
            <select value={layer.flute} onChange={(e) => handleLayerChange(layerKey, 'flute', e.target.value)}>
              {Object.keys(FLUTE_MULTIPLIERS).map(f => <option key={f} value={f}>{f}-Flute</option>)}
            </select>
          </div>
        )}
      </div>
    );
  };

  // Selected model label for sub-header
  const selectedModel = FEFCO_MODELS.find(m => m.code === fefcoCode);

  return (
    <div className="controls-container">

      {/* ── Box Model selector ────────────────────────────────── */}
      <div className="control-section">
        <h3>Box Model</h3>

        {/* Selected model summary strip */}
        {selectedModel && (() => {
          const { accent, bg } = GROUP_COLORS[selectedModel.group];
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: bg, border: `1px solid ${accent}44`,
              borderRadius: '0.5rem', padding: '0.5rem 0.65rem',
              marginBottom: '0.75rem',
            }}>
              <img
                src={`/fefco/${fefcoCode}.png`}
                alt={fefcoCode}
                style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '0.25rem', background: '#fff' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: accent }}>{fefcoCode}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.2 }}>{selectedModel.label}</div>
              </div>
            </div>
          );
        })()}

        <ModelPicker fefcoCode={fefcoCode} setFefcoCode={setFefcoCode} />
      </div>

      {/* ── Dimensions ────────────────────────────────────────── */}
      <section className="control-section">
        <h3>Box Dimensions (mm)</h3>
        <div className="input-row" style={{ marginBottom: '1rem', justifyContent: 'flex-start', gap: '2rem' }}>
          <label style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" style={{ width: 'auto' }} name="dimensionType" value="ID"
              checked={dimensionType === 'ID'} onChange={() => setDimensionType('ID')} />
            Inside Dimensions (ID)
          </label>
          <label style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" style={{ width: 'auto' }} name="dimensionType" value="OD"
              checked={dimensionType === 'OD'} onChange={() => setDimensionType('OD')} />
            Outside Dimensions (OD)
          </label>
        </div>
        <div className="dimensions-grid">
          <div className="input-col">
            <label>Length (L)</label>
            <input type="number" name="length" value={dimensions.length} onChange={handleDimensionChange} />
          </div>
          <div className="input-col">
            <label>Width (W)</label>
            <input type="number" name="width" value={dimensions.width} onChange={handleDimensionChange} />
          </div>
          <div className="input-col">
            <label>Height (H)</label>
            <input type="number" name="height" value={dimensions.height} onChange={handleDimensionChange} />
          </div>
        </div>
      </section>

      {/* ── Board Configuration ───────────────────────────────── */}
      <section className="control-section">
        <h3>Board Configuration</h3>
        <div className="input-row">
          <label>Ply Count:</label>
          <select value={ply} onChange={(e) => setPly(Number(e.target.value))}>
            <option value={3}>3-Ply (Single Wall)</option>
            <option value={5}>5-Ply (Double Wall)</option>
          </select>
        </div>
        <div className="layers-container">
          {renderLayerControl('L1', 'Top Liner')}
          {renderLayerControl('L2', 'Fluting 1', true)}
          {ply === 5 && renderLayerControl('L3', 'Mid-Liner')}
          {ply === 5 && renderLayerControl('L4', 'Fluting 2', true)}
          {renderLayerControl('L5', 'Inner Liner')}
        </div>
      </section>
    </div>
  );
}
