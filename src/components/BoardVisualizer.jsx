import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useTexture, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { fluteSpecs } from '../utils/BoardGradeEngine';

// Projects the MSP logo onto the board layers
function BoardLogoDecal({ length, width, isBottom }) {
  const texture = useTexture('/msp-logo.png');
  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  
  let decalW = length * 0.4;
  let decalH = decalW / aspect;
  if (decalH > width * 0.4) {
    decalH = width * 0.4;
    decalW = decalH * aspect;
  }
  
  const yPos = isBottom ? -0.026 : 0.026;
  const rotX = isBottom ? Math.PI / 2 : -Math.PI / 2;
  
  return (
    <Decal 
      position={[0, yPos, 0]} 
      rotation={[rotX, 0, 0]} 
      scale={[decalW, decalH, 1]} 
      map={texture}
    />
  );
}

function LinerLayer({ yPosition, width, length, color, showLogoTop, showLogoBottom }) {
  return (
    <mesh position={[0, yPosition, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, 0.05, width]} />
      <meshStandardMaterial color={color} roughness={0.8} />
      {showLogoTop && <BoardLogoDecal length={length} width={width} isBottom={false} />}
      {showLogoBottom && <BoardLogoDecal length={length} width={width} isBottom={true} />}
    </mesh>
  );
}

function CorrugatedLayer({ yPosition, fluteType, width, length, color }) {
  const spec = fluteSpecs[fluteType || 'C'];
  const waveHeight = (spec ? spec.height : 3.6) * 0.1; 
  const pitch = (spec ? spec.pitch : 7.5) * 0.1;
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const segments = Math.floor(length / (pitch / 10));
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * length - length / 2;
      for (let j = 0; j <= 10; j++) {
        const z = (j / 10) * width - width / 2;
        const y = Math.sin((x / pitch) * Math.PI * 2) * (waveHeight / 2);
        vertices.push(x, y, z);
      }
    }
    
    const indices = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < 10; j++) {
        const a = i * 11 + j;
        const b = (i + 1) * 11 + j;
        const c = i * 11 + (j + 1);
        const d = (i + 1) * 11 + (j + 1);
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [length, width, waveHeight, pitch]);

  return (
    <mesh position={[0, yPosition, 0]} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BoardModel({ ply, layers }) {
  const l = 10;
  const w = 5; 
  
  const getColor = (layerKey) => {
    if (layerKey === 'L1' || layerKey === 'L5') return '#4ade80'; // Green for outer & inner
    if (layerKey === 'L3') return '#22c55e'; // Green for mid-liner
    return '#d4a373'; // Cartoon/cardboard color for fluting
  };

  const l1Color = getColor('L1');
  const l5Color = getColor('L5');
  
  let currentY = 0;
  const elements = [];
  
  // Build from bottom up (L5 to L1)
  if (ply === 3) {
    // L5 (Bottom Liner)
    elements.push(<LinerLayer key="l5" yPosition={currentY} width={w} length={l} color={l5Color} showLogoBottom={true} />);
    
    // L2 (Flute)
    const fH = (fluteSpecs[layers.L2?.flute || 'C']?.height || 3.6) * 0.1;
    currentY += fH / 2 + 0.025;
    elements.push(<CorrugatedLayer key="l2" yPosition={currentY} fluteType={layers.L2?.flute} width={w} length={l} color={getColor('L2')} />);
    
    // L1 (Top Liner)
    currentY += fH / 2 + 0.025;
    elements.push(<LinerLayer key="l1" yPosition={currentY} width={w} length={l} color={l1Color} showLogoTop={true} />);
  } else if (ply === 5) {
    // L5 (Bottom Liner)
    elements.push(<LinerLayer key="l5" yPosition={currentY} width={w} length={l} color={l5Color} showLogoBottom={true} />);
    
    // L4 (Flute 2)
    const f2H = (fluteSpecs[layers.L4?.flute || 'B']?.height || 2.5) * 0.1;
    currentY += f2H / 2 + 0.025;
    elements.push(<CorrugatedLayer key="l4" yPosition={currentY} fluteType={layers.L4?.flute} width={w} length={l} color={getColor('L4')} />);
    
    // L3 (Mid Liner)
    currentY += f2H / 2 + 0.025;
    elements.push(<LinerLayer key="l3" yPosition={currentY} width={w} length={l} color={getColor('L3')} />);
    
    // L2 (Flute 1)
    const f1H = (fluteSpecs[layers.L2?.flute || 'E']?.height || 1.2) * 0.1;
    currentY += f1H / 2 + 0.025;
    elements.push(<CorrugatedLayer key="l2" yPosition={currentY} fluteType={layers.L2?.flute} width={w} length={l} color={getColor('L2')} />);
    
    // L1 (Top Liner)
    currentY += f1H / 2 + 0.025;
    elements.push(<LinerLayer key="l1" yPosition={currentY} width={w} length={l} color={l1Color} showLogoTop={true} />);
  }

  // Center vertically
  return <group position={[0, -currentY / 2, 0]}>{elements}</group>;
}

export default function BoardVisualizer({ ply, layers }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [6, 4, 8], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
        
        <Suspense fallback={null}>
          <BoardModel ply={ply} layers={layers} />
        </Suspense>
        
        <Environment preset="city" />
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1.0} />
        <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={15} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}
