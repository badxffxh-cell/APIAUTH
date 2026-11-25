/** Traços (polylines) em coordenadas normalizadas [-1, 1] para os símbolos de código. */
type Pt = [number, number];
type Stroke = Pt[];

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 18): Stroke {
  const out: Stroke = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

const leftBrace: Stroke = [
  [-0.3, 0.74],
  [-0.48, 0.7],
  [-0.55, 0.52],
  [-0.55, 0.2],
  [-0.62, 0.05],
  [-0.78, 0],
  [-0.62, -0.05],
  [-0.55, -0.2],
  [-0.55, -0.52],
  [-0.48, -0.7],
  [-0.3, -0.74],
];
const rightBrace: Stroke = leftBrace.map(([x, y]) => [-x, y]);

export const GLYPHS: Stroke[][] = [
  // </>
  [
    [
      [-0.5, 0.48],
      [-1.0, 0],
      [-0.5, -0.48],
    ],
    [
      [0.2, 0.66],
      [-0.2, -0.66],
    ],
    [
      [0.5, 0.48],
      [1.0, 0],
      [0.5, -0.48],
    ],
  ],
  // { }  com "..." no meio
  [leftBrace, rightBrace, arc(-0.18, 0, 0.035, 0.035, 0, 360, 8), arc(0, 0, 0.035, 0.035, 0, 360, 8), arc(0.18, 0, 0.035, 0.035, 0, 360, 8)],
  // () =>
  [
    arc(-0.6, 0, 0.32, 0.62, 112, 248),
    arc(-0.5, 0, 0.32, 0.62, -68, 68),
    [
      [0.02, 0.11],
      [0.58, 0.11],
    ],
    [
      [0.02, -0.11],
      [0.58, -0.11],
    ],
    [
      [0.55, 0.36],
      [0.95, 0],
      [0.55, -0.36],
    ],
  ],
  // #
  [
    [
      [-0.3, 0.72],
      [-0.48, -0.72],
    ],
    [
      [0.3, 0.72],
      [0.12, -0.72],
    ],
    [
      [-0.75, 0.26],
      [0.7, 0.26],
    ],
    [
      [-0.8, -0.26],
      [0.65, -0.26],
    ],
  ],
];

/** Amostra N pontos distribuídos uniformemente ao longo dos traços. */
export function sampleGlyph(strokes: Stroke[], n: number, rand: () => number): Pt[] {
  const segs: { a: Pt; b: Pt; len: number }[] = [];
  for (const s of strokes) {
    for (let i = 0; i < s.length - 1; i++) {
      const a = s[i];
      const b = s[i + 1];
      segs.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
    }
  }
  const total = segs.reduce((acc, s) => acc + s.len, 0);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let u = ((i + rand()) / n) * total;
    let k = 0;
    while (k < segs.length - 1 && u > segs[k].len) {
      u -= segs[k].len;
      k++;
    }
    const s = segs[k];
    const f = s.len > 0 ? u / s.len : 0;
    out.push([s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f]);
  }
  return out;
}
