import { useCallback } from 'react';
import { PixelRatio, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as THREE from 'three';

import { glowPointsMaterial, radialGlowMaterial } from './shaders';
import { ThreeView, type SceneContext, type SceneHandle } from './ThreeView';

const N = 700;

const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aLife;
  uniform float uSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize / -mv.z;
    vColor = aColor;
    vAlpha = clamp(aLife, 0.0, 1.0);
  }
`;

interface Props {
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  /** Repete explosões a cada N segundos (0 = só uma). */
  loopEvery?: number;
  burstKey?: string | number;
  paused?: boolean;
}

/** Explosão de partículas 3D com gravidade, brilho aditivo e onda de choque. */
export function ParticleBurst({ style, colors = ['#6C63FF', '#00E5FF', '#00FF94', '#FFD166', '#FFFFFF'], loopEvery = 3.4, burstKey, paused }: Props) {
  const setup = useCallback(
    ({ width, height }: SceneContext): SceneHandle => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
      camera.position.set(0, 0, 8);

      const pos = new Float32Array(N * 3);
      const vel = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const size = new Float32Array(N);
      const life = new Float32Array(N);
      const decay = new Float32Array(N);
      const palette = colors.map((c) => new THREE.Color(c));

      const geo = new THREE.BufferGeometry();
      const aPos = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
      const aLife = new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', aPos);
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      geo.setAttribute('aLife', aLife);

      const uniforms = { uSize: { value: 34 * PixelRatio.get() } };
      const mat = glowPointsMaterial(uniforms, VERT);
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      scene.add(points);

      const ringMat = new THREE.MeshBasicMaterial({ color: '#00E5FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), ringMat);
      scene.add(ring);
      const flash = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), radialGlowMaterial('#6C63FF', 0));
      flash.position.z = -0.5;
      scene.add(flash);
      const flashMat = flash.material as THREE.ShaderMaterial;

      const fire = () => {
        for (let i = 0; i < N; i++) {
          const u = Math.random() * 2 - 1;
          const th = Math.random() * Math.PI * 2;
          const s = Math.sqrt(1 - u * u);
          const speed = 2.5 + Math.random() * 6.5;
          pos.set([0, 0.2, 0], i * 3);
          vel.set([s * Math.cos(th) * speed, u * speed * 0.9 + 2.2, s * Math.sin(th) * speed * 0.6], i * 3);
          const c = palette[Math.floor(Math.random() * palette.length)];
          col.set([c.r, c.g, c.b], i * 3);
          size[i] = 0.4 + Math.random() * 1.4;
          life[i] = 1;
          decay[i] = 0.35 + Math.random() * 0.45;
        }
        (geo.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
        (geo.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
        ring.scale.setScalar(0.1);
        ringMat.opacity = 0.9;
        flashMat.uniforms.uStrength.value = 1.1;
      };
      fire();
      let lastFire = 0;

      return {
        scene,
        camera,
        update: (t, dt) => {
          if (loopEvery > 0 && t - lastFire > loopEvery) {
            lastFire = t;
            fire();
          }
          for (let i = 0; i < N; i++) {
            if (life[i] <= 0) continue;
            const k = i * 3;
            vel[k] *= 0.985;
            vel[k + 1] = vel[k + 1] * 0.985 - 4.2 * dt;
            vel[k + 2] *= 0.985;
            pos[k] += vel[k] * dt;
            pos[k + 1] += vel[k + 1] * dt;
            pos[k + 2] += vel[k + 2] * dt;
            life[i] -= decay[i] * dt;
          }
          aPos.needsUpdate = true;
          aLife.needsUpdate = true;
          ring.scale.multiplyScalar(1 + dt * 3.2);
          ringMat.opacity = Math.max(0, ringMat.opacity - dt * 0.9);
          flashMat.uniforms.uStrength.value = Math.max(0, flashMat.uniforms.uStrength.value - dt * 1.4);
          points.rotation.y = Math.sin(t * 0.4) * 0.3;
        },
        dispose: () => {
          geo.dispose();
          mat.dispose();
          ring.geometry.dispose();
          ringMat.dispose();
          flash.geometry.dispose();
          flashMat.dispose();
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loopEvery]
  );

  return (
    <ThreeView
      style={[StyleSheet.absoluteFill, style]}
      setup={setup}
      paused={paused}
      clearColor="#000000"
      clearAlpha={0}
      sceneKey={burstKey}
    />
  );
}
