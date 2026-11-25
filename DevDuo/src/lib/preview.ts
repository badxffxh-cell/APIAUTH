/**
 * Monta um documento HTML único a partir dos arquivos do projeto:
 * <link href="x.css"> e <script src="y.js"> locais são embutidos inline.
 */

function dirname(p: string) {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}

function resolve(from: string, ref: string): string {
  const clean = ref.split(/[?#]/)[0];
  if (/^(https?:|data:|\/\/)/i.test(clean)) return '';
  const parts = (clean.startsWith('/') ? [] : dirname(from).split('/')).filter(Boolean);
  for (const seg of clean.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

const escapeScript = (s: string) => s.replace(/<\/script/gi, '<\\/script');
const escapeStyle = (s: string) => s.replace(/<\/style/gi, '<\\/style');

export function buildPreviewHtml(files: Record<string, string>, entry: string): string {
  const html = files[entry];
  if (html === undefined) return '<html><body style="background:#080810;color:#fff;font-family:sans-serif;padding:24px">Arquivo não encontrado.</body></html>';

  let out = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) return tag;
    const path = resolve(entry, href);
    const css = path ? files[path] : undefined;
    return css !== undefined ? `<style data-file="${path}">\n${escapeStyle(css)}\n</style>` : tag;
  });

  out = out.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, pre, src, post) => {
    const path = resolve(entry, src);
    const js = path ? files[path] : undefined;
    if (js === undefined) return tag;
    const attrs = `${pre} ${post}`.replace(/\s+/g, ' ').trim();
    return `<script ${attrs} data-file="${path}">\n${escapeScript(js)}\n//# sourceURL=${path}\n</script>`;
  });

  return out;
}

/** Envolve um arquivo JS solto em uma página para rodar e mostrar o console. */
export function buildScriptRunnerHtml(code: string, fileName: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#080810;color:#fff;font:14px -apple-system,system-ui;padding:20px}h3{color:#00E5FF;margin:0 0 8px}p{color:rgba(255,255,255,.6)}</style>
</head><body><h3>▶ ${fileName}</h3><p>Saída disponível na aba Console.</p>
<script>\n${escapeScript(code)}\n//# sourceURL=${fileName}\n</script></body></html>`;
}

/** Ponte de console: injetada antes do conteúdo carregar. */
export const CONSOLE_BRIDGE = `(function(){
  if (window.__devduo) return; window.__devduo = true;
  function fmt(a){
    try {
      if (a instanceof Error) return a.name + ': ' + a.message;
      if (typeof a === 'object' && a !== null) return JSON.stringify(a, null, 2);
      return String(a);
    } catch (e) { return String(a); }
  }
  function send(level, args){
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'devduo', level: level, text: Array.prototype.map.call(args, fmt).join(' ') }));
    } catch (e) {}
  }
  ['log','info','warn','error','debug'].forEach(function(k){
    var orig = console[k];
    console[k] = function(){ send(k === 'debug' ? 'log' : k, arguments); if (orig) orig.apply(console, arguments); };
  });
  window.addEventListener('error', function(e){
    send('error', [(e.message || 'Erro') + (e.lineno ? ' (linha ' + e.lineno + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function(e){
    var r = e.reason; send('error', ['Promise rejeitada: ' + (r && r.message ? r.message : r)]);
  });
})(); true;`;
