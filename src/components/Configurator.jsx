import React, { useState, useEffect } from 'react';
import Controls from './Controls';
import BoxVisualizer from './BoxVisualizer';
import BoardVisualizer from './BoardVisualizer';
import SheetVisualizer from './SheetVisualizer';
import ReportExport from './ReportExport';
import { BoardGradeEngine } from '../utils/BoardGradeEngine';
import '../index.css'; // Or standard Vite css

export default function Configurator() {
  const [fefcoCode, setFefcoCode] = useState('0201');
  const [ply, setPly] = useState(3);
  const [dimensionType, setDimensionType] = useState('OD');
  const [dimensions, setDimensions] = useState({ length: 600, width: 450, height: 250 });
  const [layers, setLayers] = useState({
    L1: { type: 'KL', gsm: 135 },
    L2: { type: 'FL', gsm: 120, flute: 'C' },
    L3: { type: 'TL', gsm: 120 },
    L4: { type: 'FL', gsm: 120, flute: 'B' },
    L5: { type: 'KL', gsm: 135 }
  });

  const [metrics, setMetrics] = useState(null);
  const [errors, setErrors] = useState([]);
  const [activeView, setActiveView] = useState('box');

  useEffect(() => {
    const config = { ply, layers };
    const validationErrors = BoardGradeEngine.validateConfiguration(config);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      setMetrics(BoardGradeEngine.calculateMetrics(config));
    } else {
      setMetrics(null);
    }
  }, [ply, layers]);

  return (
    <div className="configurator-container">
      <header className="config-header">
        <h1>MSP Box Configurator</h1>
        <p>Interactive 3D Visualizer & Technical Estimator</p>
      </header>
      
      <div className="config-layout">
        <aside className="controls-panel">
          <Controls 
            fefcoCode={fefcoCode}
            setFefcoCode={setFefcoCode}
            ply={ply} setPly={setPly}
            dimensions={dimensions} setDimensions={setDimensions}
            dimensionType={dimensionType} setDimensionType={setDimensionType}
            layers={layers} setLayers={setLayers}
          />
          
          {errors.length > 0 && (
            <div className="error-box">
              <h3>Configuration Errors</h3>
              <ul>
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {metrics && (
            <div className="metrics-box">
              <h3>Technical Estimation</h3>
              <p><strong>Board Grade:</strong> {metrics.boardGradeCode}</p>
              <p><strong>Expected GSM:</strong> {metrics.expectedGSM} (±5%)</p>
              <p><strong>Tolerance Range:</strong> {metrics.gsmRangeFrom} - {metrics.gsmRangeTo} GSM</p>
              <p><strong>Board Thickness:</strong> {metrics.thickness.toFixed(2)} mm</p>
              {metrics.vipRequired && <div className="badge vip">VIP Required</div>}
              <div style={{ marginTop: '1rem' }}>
                <ReportExport fefcoCode={fefcoCode} metrics={metrics} dimensions={dimensions} ply={ply} dimensionType={dimensionType} layers={layers} />
              </div>
            </div>
          )}
        </aside>

        <main className="visualizer-panel" style={{ position: 'relative' }}>
          <img src={`${import.meta.env.BASE_URL}msp-logo.png`} alt="MSP Logo" style={{
            position: 'absolute', bottom: '1.5rem', right: '1.5rem', 
            width: '150px', opacity: 0.25, pointerEvents: 'none', zIndex: 10, filter: 'grayscale(100%)'
          }} />
          <div className="view-toggle">
            <button className={activeView === 'box' ? 'active' : ''} onClick={() => setActiveView('box')}>3D Box View</button>
            <button className={activeView === 'board' ? 'active' : ''} onClick={() => setActiveView('board')}>3D Board View</button>
            <button className={activeView === 'sheet' ? 'active' : ''} onClick={() => setActiveView('sheet')}>2D Sheet (Die-cut)</button>
          </div>
          <div className="visualizer-container">
            {activeView === 'box' ? (
              <BoxVisualizer fefcoCode={fefcoCode} dimensions={dimensions} dimensionType={dimensionType} thickness={metrics?.thickness || 3} />
            ) : activeView === 'board' ? (
              <BoardVisualizer ply={ply} layers={layers} dimensions={dimensions} />
            ) : (
              <SheetVisualizer fefcoCode={fefcoCode} dimensions={dimensions} dimensionType={dimensionType} thickness={metrics?.thickness || 3} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
