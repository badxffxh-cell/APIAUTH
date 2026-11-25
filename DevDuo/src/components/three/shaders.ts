import * as THREE from 'three';

/** Material de partículas redondas e brilhantes (soft glow aditivo). */
export function glowPointsMaterial(uniforms: Record<string, THREE.IUniform>, vertexShader: string) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: /* glsl */ `
      precision mediump float;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        float hot = pow(core, 3.0);
        gl_FragColor = vec4(vColor * (0.55 + hot * 1.2), core * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Plano com gradiente radial (halo atrás de objetos). */
export function radialGlowMaterial(color: THREE.ColorRepresentation, strength = 0.9) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5));
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * uStrength);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export const PALETTE = [new THREE.Color('#6C63FF'), new THREE.Color('#00E5FF'), new THREE.Color('#00FF94'), new THREE.Color('#B48CFF')];
