import { useCallback } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import type { ShapeKind } from '@/types';
import { glowPointsMaterial, radialGlowMaterial } from './shaders';
import { ThreeView, type SceneContext, type SceneHandle } from './ThreeView';

interface Props {
  shape: ShapeKind;
  color: string;
  size?: number;
  radius?: number;
  paused?: boolean;
  background?: string;
  /** Gira mais rápido (ex.: item em destaque). */
  energetic?: boolean;
}

function buildShape(shape: ShapeKind, color: string): THREE.Object3D {
  const base = new THREE.Color(color);
  const mat = (c: THREE.Color, flat = true) =>
    new THREE.MeshPhongMaterial({
      color: c,
      emissive: c.clone().multiplyScalar(0.28),
      specular: new THREE.Color('#ffffff'),
      shininess: 70,
      flatShading: flat,
    });
  const withEdges = (geo: THREE.BufferGeometry, m: THREE.Material) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, m));
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 25),
      new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 })
    );
    edges.scale.setScalar(1.002);
    g.add(edges);
    return g;
  };

  switch (shape) {
    case 'octahedron':
      return withEdges(new THREE.OctahedronGeometry(1.08), mat(base));
    case 'torusKnot':
      return new THREE.Mesh(new THREE.TorusKnotGeometry(0.58, 0.19, 120, 16), mat(base, false));
    case 'cube': {
      const g = withEdges(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat(base));
      g.rotation.set(0.5, 0.6, 0);
      return g;
    }
    case 'dodecahedron':
      return withEdges(new THREE.DodecahedronGeometry(1.0), mat(base));
    case 'twinTorus': {
      const g = new THREE.Group();
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 20, 56), mat(new THREE.Color('#4B8BBE'), false));
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 20, 56), mat(new THREE.Color('#FFD43B'), false));
      a.position.x = -0.28;
      b.position.x = 0.28;
      b.rotation.y = Math.PI / 2;
      g.add(a, b);
      return g;
    }
    case 'cone':
      return withEdges(new THREE.ConeGeometry(0.85, 1.6, 6), mat(base));
    case 'tetrahedron':
      return withEdges(new THREE.TetrahedronGeometry(1.2), mat(base));
    case 'database': {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const c = base.clone().offsetHSL(0, 0, (i - 1) * 0.06);
        const disc = withEdges(new THREE.CylinderGeometry(0.78, 0.78, 0.36, 40), mat(c, false));
        disc.position.y = (i - 1) * 0.48;
        g.add(disc);
      }
      g.rotation.x = 0.35;
      return g;
    }
  }
}

const ORBIT_VERT = /* glsl */ `
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize / -mv.z;
    vColor = aColor;
    vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + position.x * 4.0);
  }
`;

/** Ícone 3D da linguagem: sólido brilhante girando, com halo e partículas em órbita. */
export function LanguageIcon3D({ shape, color, size = 64, radius = 18, paused, background = '#10101E', energetic }: Props) {
  const setup = useCallback(
    ({ width, height }: SceneContext): SceneHandle => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
      camera.position.set(0, 0, 4.6);

      scene.add(new THREE.AmbientLight('#ffffff', 0.55));
      const key = new THREE.DirectionalLight('#ffffff', 1.6);
      key.position.set(2.5, 3, 4);
      scene.add(key);
      const rim = new THREE.PointLight('#00E5FF', 18, 12);
      rim.position.set(-3, -1.5, 2);
      scene.add(rim);
      const fill = new THREE.PointLight('#6C63FF', 14, 12);
      fill.position.set(3, -2, 1);
      scene.add(fill);

      const halo = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), radialGlowMaterial(color, 0.55));
      halo.position.z = -1.4;
      scene.add(halo);

      const obj = buildShape(shape, color);
      scene.add(obj);

      // Anel de partículas em órbita
      const N = 42;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      const c1 = new THREE.Color(color);
      const c2 = new THREE.Color('#00E5FF');
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = 1.55 + (i % 3) * 0.06;
        pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.32, Math.sin(a) * r], i * 3);
        const c = i % 2 ? c1 : c2;
        col.set([c.r, c.g, c.b], i * 3);
      }
      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      ringGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      const ringUniforms = { uSize: { value: 9 * PixelRatio.get() * (size / 64) }, uTime: { value: 0 } };
      const ringMat = glowPointsMaterial(ringUniforms, ORBIT_VERT);
      const ring = new THREE.Points(ringGeo, ringMat);
      ring.rotation.z = 0.35;
      scene.add(ring);

      const speed = energetic ? 1.4 : 0.7;
      const phase = Math.random() * 10;
      return {
        scene,
        camera,
        update: (t, dt) => {
          const tt = t + phase;
          obj.rotation.y += dt * speed;
          obj.rotation.x = Math.sin(tt * 0.7) * 0.35;
          obj.position.y = Math.sin(tt * 1.4) * 0.07;
          ring.rotation.y = tt * 0.6;
          ringUniforms.uTime.value = tt;
        },
        dispose: () => {
          scene.traverse((o) => {
            const m = o as THREE.Mesh;
            m.geometry?.dispose?.();
            const mm = m.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
            else mm?.dispose?.();
          });
        },
      };
    },
    [shape, color, size, energetic]
  );

  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor: background }]}>
      <ThreeView style={StyleSheet.absoluteFill} setup={setup} paused={paused} clearColor={background} sceneKey={`${shape}-${color}`} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.border, { borderRadius: radius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { overflow: 'hidden' },
  border: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
});
