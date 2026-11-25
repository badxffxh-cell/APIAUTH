import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import Renderer from 'expo-three/build/Renderer';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { AppState, type StyleProp, type ViewStyle } from 'react-native';
import type * as THREE from 'three';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
}

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.Camera;
  update: (t: number, dt: number) => void;
  dispose?: () => void;
}

interface Props {
  style?: StyleProp<ViewStyle>;
  setup: (ctx: SceneContext) => SceneHandle;
  /** Pausa a renderização (tela fora de foco, app em segundo plano...). */
  paused?: boolean;
  clearColor?: string;
  clearAlpha?: number;
  msaa?: number;
  /** Muda para reiniciar a cena (ex.: nova explosão de partículas). */
  sceneKey?: string | number;
}

/**
 * Ponte entre expo-gl e Three.js (via Renderer do expo-three).
 * Cuida do loop de animação, pausa em segundo plano (iOS não permite GL em background)
 * e libera o contexto ao desmontar.
 */
export function ThreeView({ style, setup, paused = false, clearColor = '#080810', clearAlpha = 1, msaa = 4, sceneKey }: Props) {
  const pausedRef = useRef(paused);
  const activeRef = useRef(AppState.currentState === 'active');
  const cleanupRef = useRef<(() => void) | null>(null);
  const setupRef = useRef(setup);

  useLayoutEffect(() => {
    setupRef.current = setup;
    pausedRef.current = paused;
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      activeRef.current = s === 'active';
    });
    return () => {
      sub.remove();
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      cleanupRef.current?.();
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const renderer = new Renderer({ gl, width, height, pixelRatio: 1, alpha: clearAlpha < 1, antialias: true });
      renderer.setClearColor(clearColor, clearAlpha);

      let handle: SceneHandle;
      try {
        handle = setupRef.current({ renderer, width, height });
      } catch (e) {
        console.warn('[DevDuo] Falha ao montar a cena 3D', e);
        return;
      }

      let alive = true;
      let raf = 0;
      let last = performance.now();
      let t = 0;
      const loop = () => {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (pausedRef.current || !activeRef.current) return;
        t += dt;
        try {
          handle.update(t, dt);
          renderer.render(handle.scene, handle.camera);
          gl.endFrameEXP();
        } catch (e) {
          alive = false;
          console.warn('[DevDuo] Erro no loop 3D', e);
        }
      };
      loop();

      cleanupRef.current = () => {
        alive = false;
        cancelAnimationFrame(raf);
        try {
          handle.dispose?.();
          renderer.dispose();
        } catch {}
        GLView.destroyContextAsync(gl).catch(() => {});
      };
    },
    [clearColor, clearAlpha]
  );

  return (
    <GLView
      key={sceneKey}
      pointerEvents="none"
      style={[{ backgroundColor: clearAlpha < 1 ? 'transparent' : clearColor }, style]}
      msaaSamples={msaa}
      onContextCreate={onContextCreate}
    />
  );
}
