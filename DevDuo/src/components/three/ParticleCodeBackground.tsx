import { useCallback } from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import * as THREE from 'three';

import { GLYPHS, sampleGlyph } from './glyphs';
import { glowPointsMaterial } from './shaders';
import { ThreeView, type SceneContext, type SceneHandle } from './ThreeView';

const COUNT = 1500;
const GLYPH_SHARE = 0.58;
const MORPH = 2.4;
const HOLD_GLYPH = 3.2;
const HOLD_CLOUD = 2.2;

const VERT = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aRand;
  attribute vec3 aColor;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float p = clamp((uProgress - aRand.x * 0.35) / 0.65, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vec3 pos = mix(aFrom, aTo, p);
    float t = uTime * (0.25 + aRand.y * 0.45);
    pos += vec3(sin(t + aRand.x * 6.2831), cos(t * 0.8 + aRand.z * 6.2831), sin(t * 0.6 + aRand.w * 6.2831)) * (0.05 + 0.1 * aRand.y);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.45 + aRand.z * 1.15) / -mv.z;
    vColor = aColor;
    vAlpha = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * (1.0 + aRand.w * 2.0) + aRand.x * 12.0));
  }
`;

/**
 * Fundo 3D da tela inicial: partículas flutuam em uma nuvem e periodicamente
 * se reúnem para formar símbolos de código ( </>  { }  () =>  # ).
 */
export function ParticleCodeBackground({ paused }: { paused?: boolean }) {
  const setup = useCallback(({ width, height }: SceneContext): SceneHandle => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    const visH = 2 * 7 * Math.tan((25 * Math.PI) / 180);
    const visW = visH * (width / height);
    const glyphScale = Math.min(visW * 0.3, visH * 0.26);
    const glyphY = visH * 0.26;

    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const glyphCount = Math.floor(COUNT * GLYPH_SHARE);
    const from = new Float32Array(COUNT * 3);
    const to = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT * 4);
    const col = new Float32Array(COUNT * 3);

    const palette = ['#6C63FF', '#00E5FF', '#8F88FF', '#00FF94', '#FFFFFF'].map((c) => new THREE.Color(c));
    const weights = [0.42, 0.34, 0.12, 0.08, 0.04];

    const cloudPoint = (i: number, out: Float32Array) => {
      out[i * 3] = (rand() - 0.5) * visW * 1.5;
      out[i * 3 + 1] = (rand() - 0.5) * visH * 1.15;
      out[i * 3 + 2] = -3.5 + rand() * 5;
    };

    for (let i = 0; i < COUNT; i++) {
      cloudPoint(i, from);
      cloudPoint(i, to);
      rnd.set([rand(), rand(), rand(), rand()], i * 4);
      let r = rand();
      let k = 0;
      while (k < weights.length - 1 && r > weights[k]) {
        r -= weights[k];
        k++;
      }
      col.set([palette[k].r, palette[k].g, palette[k].b], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(from.slice(), 3));
    const aFrom = new THREE.BufferAttribute(from, 3);
    const aTo = new THREE.BufferAttribute(to, 3);
    aFrom.setUsage(THREE.DynamicDrawUsage);
    aTo.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aFrom', aFrom);
    geo.setAttribute('aTo', aTo);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));

    const uniforms = {
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uSize: { value: 26 * PixelRatio.get() },
    };
    const mat = glowPointsMaterial(uniforms, VERT);
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    // Máquina de estados: nuvem → símbolo → nuvem → próximo símbolo...
    let glyphIndex = 0;
    let showingGlyph = false;
    let phaseStart = 0;
    let holding = true;

    const retarget = (toGlyph: boolean) => {
      from.set(to);
      if (toGlyph) {
        const pts = sampleGlyph(GLYPHS[glyphIndex % GLYPHS.length], glyphCount, rand);
        glyphIndex++;
        for (let i = 0; i < glyphCount; i++) {
          to[i * 3] = pts[i][0] * glyphScale + (rand() - 0.5) * 0.06;
          to[i * 3 + 1] = glyphY + pts[i][1] * glyphScale + (rand() - 0.5) * 0.06;
          to[i * 3 + 2] = (rand() - 0.5) * 0.35;
        }
      } else {
        for (let i = 0; i < glyphCount; i++) cloudPoint(i, to);
      }
      // Partículas de ambiente sempre derivam para novos pontos da nuvem.
      for (let i = glyphCount; i < COUNT; i++) {
        if (rand() < 0.5) cloudPoint(i, to);
      }
      aFrom.needsUpdate = true;
      aTo.needsUpdate = true;
      uniforms.uProgress.value = 0;
    };

    return {
      scene,
      camera,
      update: (t) => {
        uniforms.uTime.value = t;
        const elapsed = t - phaseStart;
        if (holding) {
          const hold = showingGlyph ? HOLD_GLYPH : HOLD_CLOUD;
          if (elapsed > hold) {
            showingGlyph = !showingGlyph;
            retarget(showingGlyph);
            holding = false;
            phaseStart = t;
          }
        } else {
          uniforms.uProgress.value = Math.min(1, elapsed / MORPH);
          if (elapsed >= MORPH) {
            holding = true;
            phaseStart = t;
          }
        }
        points.rotation.y = Math.sin(t * 0.12) * 0.22;
        points.rotation.x = Math.sin(t * 0.09) * 0.06;
      },
      dispose: () => {
        geo.dispose();
        mat.dispose();
      },
    };
  }, []);

  return <ThreeView style={StyleSheet.absoluteFill} setup={setup} paused={paused} clearColor="#080810" />;
}
