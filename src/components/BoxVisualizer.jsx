import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useTexture, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { getFefcoBlueprint } from '../utils/FefcoEngine';

// ─── Shared helpers ────────────────────────────────────────────────────────

/** Smooth-damps a group to a target rotation every frame */
function AnimatedGroup({ targetRotation, position, children }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, targetRotation[0], 4, delta);
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetRotation[1], 4, delta);
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, targetRotation[2], 4, delta);
  });
  return <group ref={ref} position={position}>{children}</group>;
}

/** MSP logo decal projected onto a vertical face (+Z normal by default) */
function LogoDecal({ width, height, isBack }) {
  const texture = useTexture('/msp-logo.png');
  const aspect  = texture.image ? texture.image.width / texture.image.height : 1;
  let dW = width * 0.5, dH = dW / aspect;
  if (dH > height * 0.5) { dH = height * 0.5; dW = dH * aspect; }
  return (
    <Decal
      position={[0, 0, isBack ? -0.026 : 0.026]}
      rotation={[0, isBack ? Math.PI : 0, 0]}
      scale={[dW, dH, 1]}
      map={texture}
    />
  );
}

/** MSP logo decal projected onto a horizontal face (+Y normal) */
function LogoDecalTop({ width, depth }) {
  const texture = useTexture('/msp-logo.png');
  const aspect  = texture.image ? texture.image.width / texture.image.height : 1;
  let dW = width * 0.45, dH = dW / aspect;
  if (dH > depth * 0.45) { dH = depth * 0.45; dW = dH * aspect; }
  return (
    <Decal
      position={[0, 0.026, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[dW, dH, 1]}
      map={texture}
    />
  );
}

// ─── Slotted box model (0201, 0200, 0202, 0203, etc.) ─────────────────────

/**
 * Renders a folded/unfolded slotted-style carton driven entirely by the
 * FEFCO blueprint so the result always matches the die-cut sheet.
 *
 * Panel terminology (matches SheetVisualizer layout):
 *   L-panels (1 & 3) → "inner" flaps  (minor, fold first at foldTopInner)
 *   W-panels (2 & 4) → "outer" flaps  (major, fold last  at foldTopOuter)
 *
 * For RSC (0201):   both flap depths = W/2 → looks identical, order irrelevant.
 * For FOL (0203):   L-panel depth = W (full), W-panel depth = W/2 (minor inners).
 */
function BoxModel({ dimensions, isFlattened, blueprint }) {
  const { length, width, height } = dimensions;
  const sc = 0.01;
  const l  = length * sc, w = width * sc, h = height * sc;
  const t  = 0.05; // visual cardboard thickness

  const hasTop    = blueprint.hasTopFlaps;
  const hasBot    = blueprint.hasBottomFlaps;
  const gfW       = (blueprint.glueFlap    || 0) * sc;
  const topL      = (blueprint.topFlapL    || 0) * sc;   // inner (L-panels)
  const topW      = (blueprint.topFlapW    || 0) * sc;   // outer (W-panels)
  const botL      = (blueprint.bottomFlapL || 0) * sc;
  const botW      = (blueprint.bottomFlapW || 0) * sc;

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c49a6c', roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide,
  }), []);

  const foldY        = isFlattened ? 0 : -Math.PI / 2;
  const foldTopInner = isFlattened ? 0 : -Math.PI / 4;        // 45° open
  const foldBotInner = isFlattened ? 0 :  Math.PI / 4;        // 45° open
  const foldTopOuter = isFlattened ? 0 : -Math.PI / 4;        // 45° open
  const foldBotOuter = isFlattened ? 0 :  Math.PI / 4;        // 45° open

  const offset = isFlattened
    ? [-(l * 2 + w * 2 + gfW) / 2, 0, 0]
    : [-l / 2, h / 2, w / 2];

  return (
    <group position={offset}>
      {/* ── PANEL 1 (L) ─────────────────────────────────────────────── */}
      <AnimatedGroup position={[0, 0, 0]} targetRotation={[0, 0, 0]}>
        <mesh position={[l/2, 0, 0]} material={mat} castShadow receiveShadow>
          <boxGeometry args={[l, h, t]} />
          <LogoDecal width={l} height={h} />
          <LogoDecal width={l} height={h} isBack />
        </mesh>

        {hasTop && topL > 0 && (
          <AnimatedGroup position={[l/2, h/2, 0]} targetRotation={[foldTopInner, 0, 0]}>
            <mesh position={[0, topL/2, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[l, topL, t]} />
            </mesh>
          </AnimatedGroup>
        )}
        {hasBot && botL > 0 && (
          <AnimatedGroup position={[l/2, -h/2, 0]} targetRotation={[foldBotInner, 0, 0]}>
            <mesh position={[0, -botL/2, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[l, botL, t]} />
            </mesh>
          </AnimatedGroup>
        )}
        {blueprint.isCrashLock && (
          <AnimatedGroup position={[l/2, -h/2, 0]} targetRotation={[foldBotInner, 0, 0]}>
            <mesh position={[0, -w/4, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[l, w/2, t]} />
            </mesh>
          </AnimatedGroup>
        )}

        {/* ── PANEL 2 (W) ─────────────────────────────────────────── */}
        <AnimatedGroup position={[l, 0, 0]} targetRotation={[0, foldY, 0]}>
          <mesh position={[w/2, 0, 0]} material={mat} castShadow receiveShadow>
            <boxGeometry args={[w, h, t]} />
            <LogoDecal width={w} height={h} />
            <LogoDecal width={w} height={h} isBack />
          </mesh>

          {hasTop && topW > 0 && (
            <AnimatedGroup position={[w/2, h/2, 0]} targetRotation={[foldTopOuter, 0, 0]}>
              <mesh position={[0, topW/2, 0]} material={mat} castShadow receiveShadow>
                <boxGeometry args={[w, topW, t]} />
                <LogoDecal width={w} height={topW} />
                <LogoDecal width={w} height={topW} isBack />
              </mesh>
            </AnimatedGroup>
          )}
          {hasBot && botW > 0 && (
            <AnimatedGroup position={[w/2, -h/2, 0]} targetRotation={[foldBotOuter, 0, 0]}>
              <mesh position={[0, -botW/2, 0]} material={mat} castShadow receiveShadow>
                <boxGeometry args={[w, botW, t]} />
                <LogoDecal width={w} height={botW} />
                <LogoDecal width={w} height={botW} isBack />
              </mesh>
            </AnimatedGroup>
          )}
          {blueprint.isCrashLock && (
            <AnimatedGroup position={[w/2, -h/2, 0]} targetRotation={[foldBotOuter, 0, 0]}>
              <mesh position={[0, -w/4, 0]} material={mat} castShadow receiveShadow>
                <boxGeometry args={[w, w/2, t]} />
              </mesh>
            </AnimatedGroup>
          )}

          {/* ── PANEL 3 (L) ───────────────────────────────────────── */}
          <AnimatedGroup position={[w, 0, 0]} targetRotation={[0, foldY, 0]}>
            <mesh position={[l/2, 0, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[l, h, t]} />
              <LogoDecal width={l} height={h} />
              <LogoDecal width={l} height={h} isBack />
            </mesh>

            {hasTop && topL > 0 && (
              <AnimatedGroup position={[l/2, h/2, 0]} targetRotation={[foldTopInner, 0, 0]}>
                <mesh position={[0, topL/2, 0]} material={mat} castShadow receiveShadow>
                  <boxGeometry args={[l, topL, t]} />
                </mesh>
              </AnimatedGroup>
            )}
            {hasBot && botL > 0 && (
              <AnimatedGroup position={[l/2, -h/2, 0]} targetRotation={[foldBotInner, 0, 0]}>
                <mesh position={[0, -botL/2, 0]} material={mat} castShadow receiveShadow>
                  <boxGeometry args={[l, botL, t]} />
                </mesh>
              </AnimatedGroup>
            )}
            {blueprint.isCrashLock && (
              <AnimatedGroup position={[l/2, -h/2, 0]} targetRotation={[foldBotInner, 0, 0]}>
                <mesh position={[0, -w/4, 0]} material={mat} castShadow receiveShadow>
                  <boxGeometry args={[l, w/2, t]} />
                </mesh>
              </AnimatedGroup>
            )}

            {/* ── PANEL 4 (W) ─────────────────────────────────────── */}
            <AnimatedGroup position={[l, 0, 0]} targetRotation={[0, foldY, 0]}>
              <mesh position={[w/2, 0, 0]} material={mat} castShadow receiveShadow>
                <boxGeometry args={[w, h, t]} />
                <LogoDecal width={w} height={h} />
                <LogoDecal width={w} height={h} isBack />
              </mesh>

              {hasTop && topW > 0 && (
                <AnimatedGroup position={[w/2, h/2, 0]} targetRotation={[foldTopOuter, 0, 0]}>
                  <mesh position={[0, topW/2, 0]} material={mat} castShadow receiveShadow>
                    <boxGeometry args={[w, topW, t]} />
                    <LogoDecal width={w} height={topW} />
                    <LogoDecal width={w} height={topW} isBack />
                  </mesh>
                </AnimatedGroup>
              )}
              {hasBot && botW > 0 && (
                <AnimatedGroup position={[w/2, -h/2, 0]} targetRotation={[foldBotOuter, 0, 0]}>
                  <mesh position={[0, -botW/2, 0]} material={mat} castShadow receiveShadow>
                    <boxGeometry args={[w, botW, t]} />
                    <LogoDecal width={w} height={botW} />
                    <LogoDecal width={w} height={botW} isBack />
                  </mesh>
                </AnimatedGroup>
              )}
              {blueprint.isCrashLock && (
                <AnimatedGroup position={[w/2, -h/2, 0]} targetRotation={[foldBotOuter, 0, 0]}>
                  <mesh position={[0, -w/4, 0]} material={mat} castShadow receiveShadow>
                    <boxGeometry args={[w, w/2, t]} />
                  </mesh>
                </AnimatedGroup>
              )}

              {/* ── GLUE FLAP ─────────────────────────────────────── */}
              {gfW > 0 && (
                <AnimatedGroup position={[w, 0, 0]} targetRotation={[0, foldY, 0]}>
                  <mesh position={[gfW/2, 0, 0]} material={mat} castShadow receiveShadow>
                    <boxGeometry args={[gfW, h, t]} />
                  </mesh>
                </AnimatedGroup>
              )}
            </AnimatedGroup>
          </AnimatedGroup>
        </AnimatedGroup>
      </AnimatedGroup>
    </group>
  );
}

// ─── Telescope box model (0301, 0306, 0310, 0320) ─────────────────────────

/**
 * Renders a two-piece telescope box (base body + lid tray).
 *
 * isLidOpen = true  → lid hinges open (~115° backward) revealing the interior.
 * isLidOpen = false → lid sits fully closed on the base.
 *
 * Hinge pivot sits at the back top edge of the base body so the animation
 * looks exactly like lifting the lid of a shoebox.
 */
function TelescopeBoxModel({ dimensions, blueprint, isLidOpen }) {
  const { length, width, height } = dimensions;
  const sc  = 0.01;
  const l   = length * sc;
  const w   = width  * sc;
  const h   = height * sc;
  const t   = 0.05; // panel thickness

  // Lid is fractionally larger so it telescopes over the base walls
  const extra = 0.10; // ~10 mm clearance in scene units
  const ll = l + extra;
  const wl = w + extra;
  const v  = (blueprint.lidDepth || Math.round(height * 0.35)) * sc;

  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c49a6c', roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide,
  }), []);

  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#dab96e', roughness: 0.80, metalness: 0.05, side: THREE.DoubleSide,
  }), []);

  // Open ≈ 115°, closed = 0°
  const lidAngle = isLidOpen ? -Math.PI * 0.64 : 0;

  return (
    <group>
      {/* ── BASE BODY ──────────────────────────────────────────────── */}
      <group>
        {/* Bottom face – sits on y=0 */}
        <mesh position={[0, 0, 0]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[l, t, w]} />
        </mesh>
        {/* Front wall  (+Z) */}
        <mesh position={[0, h/2, w/2]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[l, h, t]} />
          <LogoDecal width={l} height={h} />
        </mesh>
        {/* Back wall   (-Z) */}
        <mesh position={[0, h/2, -w/2]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[l, h, t]} />
          <LogoDecal width={l} height={h} isBack />
        </mesh>
        {/* Left wall   (-X) */}
        <mesh position={[-l/2, h/2, 0]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[t, h, w]} />
        </mesh>
        {/* Right wall  (+X) */}
        <mesh position={[l/2, h/2, 0]} material={baseMat} castShadow receiveShadow>
          <boxGeometry args={[t, h, w]} />
        </mesh>
      </group>

      {/* ── LID TRAY ───────────────────────────────────────────────── */}
      {/*                                                               */}
      {/* Hinge world position: [0, h, -wl/2]                          */}
      {/*   — top-back edge of the base body (body goes from y=0 to y=h) */}
      <AnimatedGroup
        position={[0, h, -wl/2]}
        targetRotation={[lidAngle, 0, 0]}
      >
        {/* Lid top face */}
        <mesh position={[0, 0, wl/2]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[ll, t, wl]} />
          <LogoDecalTop width={ll} depth={wl} />
        </mesh>
        {/* Front rim (opening edge) */}
        <mesh position={[0, -v/2, wl]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[ll, v, t]} />
          <LogoDecal width={ll} height={v} />
        </mesh>
        {/* Back rim  (hinge edge) */}
        <mesh position={[0, -v/2, 0]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[ll, v, t]} />
        </mesh>
        {/* Left rim */}
        <mesh position={[-ll/2, -v/2, wl/2]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[t, v, wl]} />
        </mesh>
        {/* Right rim */}
        <mesh position={[ll/2, -v/2, wl/2]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[t, v, wl]} />
        </mesh>
      </AnimatedGroup>
    </group>
  );
}

// ─── Camera controller ─────────────────────────────────────────────────────

function CameraController({ view, isAuto }) {
  const { camera } = useThree();
  const ctrlRef    = useRef();
  const R          = 15;

  useEffect(() => {
    if (isAuto || !ctrlRef.current) return;
    let x = 0, y = 0, z = 0;
    switch (view) {
      case 'Front':     z = R;              break;
      case 'Back':      z = -R;             break;
      case 'Top':       y = R; z = 0.01;   break;
      case 'Bottom':    y = -R; z = 0.01;  break;
      case 'Right':     x = R;              break;
      case 'Left':      x = -R;             break;
      case 'Isometric': x = R*.6; y = R*.6; z = R*.6; break;
      case 'Dimetric':  x = R*.8; y = R*.4; z = R*.8; break;
      case 'Trimetric': x = R*.9; y = R*.5; z = R*.6; break;
      default: return;
    }
    camera.position.set(x, y, z);
    ctrlRef.current.target.set(0, 1.2, 0);  // orbit around approx box centre height
    ctrlRef.current.update();
  }, [view, isAuto, camera]);

  return (
    <OrbitControls
      ref={ctrlRef}
      makeDefault
      autoRotate={isAuto}
      autoRotateSpeed={1.0}
      enableDamping
    />
  );
}

// ─── Tray with Hinged Lid model (0426 / 0427) ───────────────────────────────────
// Assembled tray with 4 vertical walls and a hinged lid.
// The lid pivots around the back-wall top edge.
// isLidOpen = true  → lid open at ~115° (default view)
// isLidOpen = false → lid closed (flat over the opening)
function TrayWithLidModel({ dimensions, blueprint, isLidOpen }) {
  const { length: L, width: W, height: H } = dimensions;
  const sc = 0.01;
  const l = L * sc, w = W * sc, h = H * sc;
  const t = 0.04; // Visual thickness
  const is0427 = blueprint.code === '0427';
  const tuckDepth = (blueprint.tuckFlap || Math.max(15, Math.round(H * 0.4))) * sc;

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c49a6c', roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
  }), []);
  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#b88a55', roughness: 0.75, metalness: 0.06, side: THREE.DoubleSide,
  }), []);

  // Lid pivot is at the top-back edge of the box: [0, h, -l/2]
  // Open: lid rotated backward by ~110 degrees
  // Closed: lid sitting flat over the box (0 degrees)
  const lidRotX = isLidOpen ? -Math.PI * 0.6 : 0;

  // Relative rotations of tuck flap and ears based on open/closed state
  const tuckRotX = isLidOpen ? 0 : Math.PI / 2;
  const earLeftRotZ = isLidOpen ? 0 : -Math.PI / 2;
  const earRightRotZ = isLidOpen ? 0 : Math.PI / 2;

  return (
    <group>
      {/* ── Bottom panel – sits on y = 0 */}
      <mesh position={[0, -t/2, 0]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[w, t, l]} />
      </mesh>

      {/* ── Back wall */}
      <mesh position={[0, h/2, -l/2 - t/2]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />
      </mesh>

      {/* ── Front wall */}
      <mesh position={[0, h/2, l/2 + t/2]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <LogoDecal width={w} height={h} />
      </mesh>

      {/* ── Left side wall (single-wall for 0426, double-wall for 0427) */}
      <group>
        <mesh position={[-w/2 - t/2, h/2, 0]} material={bodyMat} castShadow receiveShadow>
          <boxGeometry args={[t, h, l]} />
        </mesh>
        {is0427 && (
          <mesh position={[-w/2 + t/2, h/2, 0]} material={bodyMat} castShadow receiveShadow>
            <boxGeometry args={[t, h - t, l - t]} />
          </mesh>
        )}
      </group>

      {/* ── Right side wall (single-wall for 0426, double-wall for 0427) */}
      <group>
        <mesh position={[w/2 + t/2, h/2, 0]} material={bodyMat} castShadow receiveShadow>
          <boxGeometry args={[t, h, l]} />
        </mesh>
        {is0427 && (
          <mesh position={[w/2 - t/2, h/2, 0]} material={bodyMat} castShadow receiveShadow>
            <boxGeometry args={[t, h - t, l - t]} />
          </mesh>
        )}
      </group>

      {/* ── Lid assembly (hinged to top-back wall) */}
      <AnimatedGroup targetRotation={[lidRotX, 0, 0]} position={[0, h, -l/2]}>
        {/* Lid plate: extends from z=0 to z=l */}
        <mesh position={[0, t/2, l/2]} material={lidMat} castShadow receiveShadow>
          <boxGeometry args={[w, t, l]} />
          <LogoDecalTop width={w} depth={l} />
        </mesh>

        {/* Tuck Flap: attached to front edge of lid (z=l) */}
        <AnimatedGroup targetRotation={[tuckRotX, 0, 0]} position={[0, 0, l]}>
          <mesh position={[0, -tuckDepth/2, -t/2]} material={lidMat} castShadow receiveShadow>
            <boxGeometry args={[w - 0.04, tuckDepth, t]} />
            <LogoDecal width={w - 0.04} height={tuckDepth} />
          </mesh>
        </AnimatedGroup>

        {/* Left Ear (Side Flap): attached to left edge of lid (x=-w/2) */}
        <AnimatedGroup targetRotation={[0, 0, earLeftRotZ]} position={[-w/2, 0, l/2]}>
          <mesh position={[t/2, -h/2 + t, 0]} material={lidMat} castShadow receiveShadow>
            <boxGeometry args={[t, h - t * 2, l - t * 2]} />
          </mesh>
        </AnimatedGroup>

        {/* Right Ear (Side Flap): attached to right edge of lid (x=w/2) */}
        <AnimatedGroup targetRotation={[0, 0, earRightRotZ]} position={[w/2, 0, l/2]}>
          <mesh position={[-t/2, -h/2 + t, 0]} material={lidMat} castShadow receiveShadow>
            <boxGeometry args={[t, h - t * 2, l - t * 2]} />
          </mesh>
        </AnimatedGroup>
      </AnimatedGroup>
    </group>
  );
}

// ─── Hinged Lid Folder Box model (0409) ───────────────────────────────────────────────
// FEFCO 0409: Box assembled as:
//   - base plate  L×W at y=0
//   - 2 end walls (H wide, L tall, facing +Z and –Z)  → use L×H panels
//   - 2 side walls (W wide, H tall, facing +X and –X) → fold from W panels
//   - Hinged lid on +Z end wall (depth = W/2 = tuck depth)
// Note: In FEFCO 0409 the blank panels are W|H|W|H horizontal, with L vertical.
// When assembled: the H-panels become end walls, W-panels fold into side walls,
// and the tuck flap attached to the final H-panel is the hinged lid.
function HingedFolderModel({ dimensions, blueprint, isLidOpen }) {
  const { length: L, width: W, height: H } = dimensions;
  const sc = 0.01;
  const l = L * sc, w = W * sc, h = H * sc;
  const t = 0.04;
  const ld = (blueprint.lidDepth || Math.round(W / 2)) * sc;

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c49a6c', roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide,
  }), []);
  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#a07840', roughness: 0.75, metalness: 0.06, side: THREE.DoubleSide,
  }), []);

  // Lid pivot at top of the +Z end wall
  // rotation.x < 0 → lid leans backward (open display)
  // rotation.x = 0 → lid straight up
  // rotation.x = +π/2 → lid horizontal over opening
  const lidRotX = isLidOpen ? -Math.PI * 0.55 : Math.PI * 0.5;

  return (
    <group>
      {/* ── Base plate */}
      <mesh position={[0, 0, 0]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[l, t, w]} />
      </mesh>

      {/* ── Two end walls (along L axis, facing ±Z) */}
      {/* Back end wall (–Z) */}
      <mesh position={[0, h / 2, -w / 2]} material={bodyMat} castShadow>
        <boxGeometry args={[l, h, t]} />
      </mesh>
      {/* Front end wall (+Z) — has hinged lid at top */}
      <mesh position={[0, h / 2, w / 2]} material={bodyMat} castShadow>
        <boxGeometry args={[l, h, t]} />
      </mesh>

      {/* ── Two side walls (perpendicular, facing ±X) */}
      <mesh position={[-l / 2, h / 2, 0]} material={bodyMat} castShadow>
        <boxGeometry args={[t, h, w]} />
      </mesh>
      <mesh position={[l / 2, h / 2, 0]} material={bodyMat} castShadow>
        <boxGeometry args={[t, h, w]} />
      </mesh>

      {/* ── Hinged lid — pivots from top edge of front end wall (+Z) */}
      <AnimatedGroup targetRotation={[lidRotX, 0, 0]} position={[0, h, w / 2]}>
        {/* Lid panel extends forward (in +Z direction from pivot) by ld */}
        <mesh position={[0, ld / 2, 0]} material={lidMat} castShadow>
          <boxGeometry args={[l, ld, t]} />
        </mesh>
      </AnimatedGroup>
    </group>
  );
}



// ─── Main export ───────────────────────────────────────────────────────────

export default function BoxVisualizer({ dimensions, fefcoCode, dimensionType, thickness }) {
  const [isFlattened, setIsFlattened] = useState(false);
  const [viewMode,    setViewMode]    = useState('Isometric');
  const [isAuto,      setIsAuto]      = useState(false);

  // ── Reset view state whenever the model changes ──────────────────
  useEffect(() => {
    setIsFlattened(false);
    setIsAuto(false);
  }, [fefcoCode]);

  // ── Dimension alignment (same formula as SheetVisualizer) ─────────
  const t = thickness || 3;
  let L = dimensions.length;
  let W = dimensions.width;
  let H = dimensions.height;
  if (dimensionType === 'OD') {
    L = Math.max(L - t * 2, 10);
    W = Math.max(W - t * 2, 10);
    H = Math.max(H - t * 4, 10);
  }
  const adj = { length: L, width: W, height: H };

  // ── Blueprint (same call as SheetVisualizer) ──────────────────────
  const bp             = getFefcoBlueprint(fefcoCode || '0201', adj);
  const isTelescope    = !!bp.isTelescope;
  const isTrayWithLid  = !!bp.isTrayWithLid;
  const isHingedFolder = !!bp.isHingedFolder;

  // ── Adaptive button labels ────────────────────────────────────────
  const toggleLabel = (isTrayWithLid || isTelescope || isHingedFolder)
    ? (isFlattened ? 'Open Lid'    : 'Close Lid')
    : (isFlattened ? 'Fold 3D Box' : 'Flatten 3D Box');

  const views = ['Front','Back','Top','Bottom','Right','Left','Isometric','Trimetric','Dimetric'];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* ── Controls overlay ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 15, left: 15, zIndex: 10,
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setIsFlattened(f => !f)}
          style={{
            padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
            fontWeight: '700', boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
            transition: 'background 0.2s',
          }}
        >
          {toggleLabel}
        </button>
        <button
          onClick={() => setIsAuto(a => !a)}
          style={{
            padding: '0.5rem 1rem',
            background: isAuto ? '#22c55e' : '#64748b',
            color: '#fff', border: 'none', borderRadius: '0.375rem',
            cursor: 'pointer', fontWeight: '700',
            boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
            transition: 'background 0.2s',
          }}
        >
          {isAuto ? 'Stop Auto-Spin' : 'Auto-Spin'}
        </button>

        {/* Active model badge */}
        <div style={{
          padding: '0.5rem 0.75rem',
          background: 'rgba(15,23,42,0.85)', color: '#93c5fd',
          borderRadius: '0.375rem', fontWeight: '700', fontSize: '0.78rem',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          border: '1px solid rgba(147,197,253,0.2)',
          gap: '0.4rem',
        }}>
          <span style={{ opacity: 0.6 }}>{fefcoCode}</span>
          <span>·</span>
          <span>{bp.name}</span>
        </div>
      </div>

      {/* ── Camera views toolbar ─────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 15, left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: '0.25rem',
        background: 'rgba(15,23,42,0.85)', padding: '0.4rem 0.6rem',
        borderRadius: '0.5rem', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {views.map(v => (
          <button
            key={v}
            onClick={() => { setViewMode(v); setIsAuto(false); }}
            style={{
              padding: '0.25rem 0.5rem',
              background: viewMode === v && !isAuto ? '#3b82f6' : 'transparent',
              color: '#fff', border: 'none', borderRadius: '0.25rem',
              cursor: 'pointer', fontSize: '0.72rem',
              transition: 'background 0.18s',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ── Three.js canvas ──────────────────────────────────────────── */}
      <Canvas camera={{ position: [10, 8, 10], fov: 45 }} shadows gl={{ preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 15, 10]} intensity={1.2}
          castShadow shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />

        <Suspense fallback={null}>
          {isTrayWithLid ? (
            /*
             * Hinged-lid tray (0426 / 0427):
             *   isFlattened = false → lid OPEN  (default showcase view)
             *   isFlattened = true  → lid CLOSED (assembled, ready to ship)
             */
            <TrayWithLidModel
              dimensions={adj}
              blueprint={bp}
              isLidOpen={!isFlattened}
            />
          ) : isTelescope ? (
            /*
             * Telescope models (0301 / 0306 / 0310 / 0320):
             *   isFlattened = false → lid OPEN
             *   isFlattened = true  → lid CLOSED
             */
            <TelescopeBoxModel
              dimensions={adj}
              blueprint={bp}
              isLidOpen={!isFlattened}
            />
          ) : isHingedFolder ? (
            /*
             * Hinged Folder models (0409):
             *   isFlattened = false → lid OPEN
             *   isFlattened = true  → lid CLOSED
             */
            <HingedFolderModel
              dimensions={adj}
              blueprint={bp}
              isLidOpen={!isFlattened}
            />
          ) : (
            /*
             * Slotted / flat models (0201, 0200, 0202, 0203, 0110, etc.):
             *   isFlattened = false → 3-D assembled
             *   isFlattened = true  → unfolded flat layout
             */
            <BoxModel
              dimensions={adj}
              isFlattened={isFlattened}
              blueprint={bp}
            />
          )}
        </Suspense>

        <Environment preset="city" />
        <CameraController view={viewMode} isAuto={isAuto} />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.50} scale={22} blur={2.5} far={5} />
      </Canvas>
    </div>
  );
}
