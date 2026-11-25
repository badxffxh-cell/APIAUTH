import type { SyntaxToken } from '@/theme';
import type { CodeLang } from '@/types';

export interface Token {
  text: string;
  type: SyntaxToken;
}

type Rule = [SyntaxToken, RegExp];

const kw = (words: string, flags = '') => new RegExp(`\\b(?:${words.trim().split(/\s+/).join('|')})\\b`, 'y' + flags);

const JS_KEYWORDS =
  'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this super null undefined true false void delete yield static get set';
const TS_EXTRA = 'interface type enum implements public private protected readonly as keyof declare namespace abstract string number boolean any unknown never';

const jsRules = (extra = ''): Rule[] => [
  ['comment', /\/\/[^\n]*/y],
  ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
  ['string', /`(?:\\[\s\S]|[^\\`])*`?/y],
  ['string', /"(?:\\.|[^"\\\n])*"?/y],
  ['string', /'(?:\\.|[^'\\\n])*'?/y],
  ['number', /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/y],
  ['keyword', kw(JS_KEYWORDS + ' ' + extra)],
  ['builtin', /\b(?:console|document|window|Math|JSON|Promise|Array|Object|String|Number|fetch|localStorage)\b/y],
  ['function', /[A-Za-z_$][\w$]*(?=\s*\()/y],
  ['type', /\b[A-Z][\w$]*/y],
  ['plain', /[A-Za-z_$][\w$]*/y],
  ['punct', /[{}()[\];,.<>+\-*/%=&|!?:~^]+/y],
];

const RULES: Partial<Record<CodeLang, Rule[]>> = {
  javascript: jsRules(),
  typescript: jsRules(TS_EXTRA),
  json: [
    ['property', /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
    ['string', /"(?:\\.|[^"\\\n])*"?/y],
    ['number', /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y],
    ['keyword', kw('true false null')],
    ['punct', /[{}[\],:]/y],
  ],
  python: [
    ['comment', /#[^\n]*/y],
    ['string', /(?:[rfbuRFBU]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y],
    ['string', /(?:[rfbuRFBU]{1,2})?"(?:\\.|[^"\\\n])*"?/y],
    ['string', /(?:[rfbuRFBU]{1,2})?'(?:\\.|[^'\\\n])*'?/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['entity', /@[\w.]+/y],
    [
      'keyword',
      kw(
        'def class return if elif else for while in not and or import from as with try except finally raise lambda None True False pass break continue yield global nonlocal is async await match case'
      ),
    ],
    ['builtin', kw('print len range input int str float list dict set tuple enumerate zip open sorted sum min max type isinstance self')],
    ['function', /[A-Za-z_]\w*(?=\s*\()/y],
    ['type', /\b[A-Z]\w*/y],
    ['plain', /[A-Za-z_]\w*/y],
    ['punct', /[{}()[\];,.<>+\-*/%=&|!?:~^]+/y],
  ],
  swift: [
    ['comment', /\/\/[^\n]*/y],
    ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /"(?:\\.|[^"\\\n])*"?/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['entity', /@\w+/y],
    [
      'keyword',
      kw(
        'func let var struct class enum protocol extension import return if else guard for in while repeat switch case default break continue true false nil self Self init deinit some any async await throws throw try catch do private public internal fileprivate static override mutating inout where as is'
      ),
    ],
    ['function', /[A-Za-z_]\w*(?=\s*\()/y],
    ['type', /\b[A-Z]\w*/y],
    ['plain', /[A-Za-z_]\w*/y],
    ['punct', /[{}()[\];,.<>+\-*/%=&|!?:~^\\]+/y],
  ],
  kotlin: [
    ['comment', /\/\/[^\n]*/y],
    ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /"(?:\\.|[^"\\\n])*"?/y],
    ['number', /\b\d+(?:\.\d+)?[fFL]?\b/y],
    ['entity', /@\w+/y],
    [
      'keyword',
      kw(
        'fun val var class object data sealed enum interface when is in out return if else for while do null true false import package private public internal protected override open abstract suspend companion this super throw try catch finally as typealias lateinit by'
      ),
    ],
    ['builtin', kw('println print listOf mapOf setOf mutableListOf arrayOf')],
    ['function', /[A-Za-z_]\w*(?=\s*\()/y],
    ['type', /\b[A-Z]\w*/y],
    ['plain', /[A-Za-z_]\w*/y],
    ['punct', /[{}()[\];,.<>+\-*/%=&|!?:~^$]+/y],
  ],
  sql: [
    ['comment', /--[^\n]*/y],
    ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /'(?:''|[^'])*'?/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    [
      'keyword',
      kw(
        'select from where insert into values update set delete create table drop alter add join left right inner outer full on group by order limit offset as and or not null is primary key foreign references distinct having asc desc union all like between exists case when then else end default index view',
        'i'
      ),
    ],
    ['type', kw('int integer varchar text boolean date timestamp serial decimal float real char', 'i')],
    ['function', /[A-Za-z_]\w*(?=\s*\()/y],
    ['plain', /[A-Za-z_]\w*/y],
    ['punct', /[(),;.*=<>!+\-/]+/y],
  ],
};

function runRules(code: string, rules: Rule[], out: Token[]) {
  let pos = 0;
  let plain = '';
  const flush = () => {
    if (plain) {
      out.push({ text: plain, type: 'plain' });
      plain = '';
    }
  };
  while (pos < code.length) {
    let matched = false;
    for (const [type, re] of rules) {
      re.lastIndex = pos;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        if (type === 'plain') {
          plain += m[0];
        } else {
          flush();
          out.push({ text: m[0], type });
        }
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      plain += code[pos];
      pos++;
    }
  }
  flush();
}

/* ---------- CSS (tem estado: dentro/fora de blocos) ---------- */

function tokenizeCss(code: string, out: Token[]) {
  let pos = 0;
  let depth = 0;
  let inValue = false;
  const push = (text: string, type: SyntaxToken) => {
    const last = out[out.length - 1];
    if (last && last.type === type && type === 'plain') last.text += text;
    else out.push({ text, type });
  };
  const at = (re: RegExp) => {
    re.lastIndex = pos;
    const m = re.exec(code);
    return m && m.index === pos ? m[0] : null;
  };
  while (pos < code.length) {
    let m: string | null;
    if ((m = at(/\/\*[\s\S]*?(?:\*\/|$)/y))) push(m, 'comment');
    else if ((m = at(/"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y))) push(m, 'string');
    else if ((m = at(/\s+/y))) push(m, 'plain');
    else if ((m = at(/@[\w-]+/y))) push(m, 'keyword');
    else if (code[pos] === '{') {
      depth++;
      inValue = false;
      push('{', 'punct');
      pos++;
      continue;
    } else if (code[pos] === '}') {
      depth = Math.max(0, depth - 1);
      inValue = false;
      push('}', 'punct');
      pos++;
      continue;
    } else if (depth === 0 || (!inValue && at(/[^:;{}]+\{/y) && !at(/[\w-]+\s*:/y))) {
      // Seletor
      m = at(/[^{}/;]+/y) ?? code[pos];
      push(m, 'selector');
    } else if (!inValue && (m = at(/-{0,2}[\w-]+(?=\s*:)/y))) push(m, 'property');
    else if (code[pos] === ':') {
      inValue = true;
      push(':', 'punct');
      pos++;
      continue;
    } else if (code[pos] === ';') {
      inValue = false;
      push(';', 'punct');
      pos++;
      continue;
    } else if ((m = at(/#[\da-fA-F]{3,8}\b/y))) push(m, 'number');
    else if ((m = at(/-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|dvh|svh)?/y))) push(m, 'number');
    else if ((m = at(/[\w-]+(?=\()/y))) push(m, 'function');
    else if ((m = at(/!important/y))) push(m, 'keyword');
    else if ((m = at(/[\w-]+/y))) push(m, inValue ? 'string' : 'plain');
    else {
      m = code[pos];
      push(m, 'punct');
    }
    pos += m.length;
  }
}

/* ---------- HTML (com <style> e <script> embutidos) ---------- */

function tokenizeHtml(code: string, out: Token[]) {
  let pos = 0;
  const textUntil = (re: RegExp) => {
    re.lastIndex = pos;
    const m = re.exec(code);
    return m ? m.index : code.length;
  };
  while (pos < code.length) {
    if (code.startsWith('<!--', pos)) {
      const end = code.indexOf('-->', pos + 4);
      const stop = end < 0 ? code.length : end + 3;
      out.push({ text: code.slice(pos, stop), type: 'comment' });
      pos = stop;
      continue;
    }
    if (/^<!doctype/i.test(code.slice(pos, pos + 9))) {
      const end = code.indexOf('>', pos);
      const stop = end < 0 ? code.length : end + 1;
      out.push({ text: code.slice(pos, stop), type: 'keyword' });
      pos = stop;
      continue;
    }
    const tagMatch = /^<\/?[A-Za-z][\w-]*/.exec(code.slice(pos, pos + 64));
    if (tagMatch) {
      const tagText = tagMatch[0];
      const tagName = tagText.replace(/^<\/?/, '').toLowerCase();
      const closing = tagText.startsWith('</');
      out.push({ text: tagText, type: 'tag' });
      pos += tagText.length;
      // Atributos
      while (pos < code.length && code[pos] !== '>' && code[pos] !== '<') {
        if (code.startsWith('/>', pos)) break;
        const rest = code.slice(pos, pos + 4000);
        let m: RegExpExecArray | null;
        let piece: Token;
        if ((m = /^\s+/.exec(rest))) piece = { text: m[0], type: 'plain' };
        else if ((m = /^[^\s=>"'/<]+/.exec(rest))) piece = { text: m[0], type: 'attr' };
        else if ((m = /^"[^"]*"?|^'[^']*'?/.exec(rest))) piece = { text: m[0], type: 'string' };
        else if (rest[0] === '=') piece = { text: '=', type: 'punct' };
        else piece = { text: rest[0], type: 'tag' };
        out.push(piece);
        pos += piece.text.length;
      }
      if (code.startsWith('/>', pos)) {
        out.push({ text: '/>', type: 'tag' });
        pos += 2;
      } else if (code[pos] === '>') {
        out.push({ text: '>', type: 'tag' });
        pos += 1;
      }
      if (!closing && (tagName === 'style' || tagName === 'script')) {
        const endRe = new RegExp(`</${tagName}`, 'ig');
        const end = textUntil(endRe);
        const inner = code.slice(pos, end);
        if (inner) {
          if (tagName === 'style') tokenizeCss(inner, out);
          else runRules(inner, RULES.javascript!, out);
        }
        pos = end;
      }
      continue;
    }
    if (code[pos] === '&') {
      const m = /^&[#\w]+;/.exec(code.slice(pos, pos + 12));
      if (m) {
        out.push({ text: m[0], type: 'entity' });
        pos += m[0].length;
        continue;
      }
    }
    // Texto até o próximo "<" ou "&"
    let next = pos + 1;
    while (next < code.length && code[next] !== '<' && code[next] !== '&') next++;
    const last = out[out.length - 1];
    const text = code.slice(pos, next);
    if (last && last.type === 'plain') last.text += text;
    else out.push({ text, type: 'plain' });
    pos = next;
  }
}

export function tokenize(code: string, lang: CodeLang): Token[] {
  const out: Token[] = [];
  if (!code) return out;
  if (lang === 'html') tokenizeHtml(code, out);
  else if (lang === 'css') tokenizeCss(code, out);
  else if (RULES[lang]) runRules(code, RULES[lang]!, out);
  else out.push({ text: code, type: 'plain' });
  return out;
}

/** Tokens divididos por linha (para renderizar com numeração). */
export function tokenizeLines(code: string, lang: CodeLang): Token[][] {
  const lines: Token[][] = [[]];
  for (const t of tokenize(code, lang)) {
    const parts = t.text.split('\n');
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ text: p, type: t.type });
    });
  }
  return lines;
}

export function languageFromFilename(name: string): CodeLang {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, CodeLang> = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    mjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    swift: 'swift',
    kt: 'kotlin',
    kts: 'kotlin',
    sql: 'sql',
    json: 'json',
    md: 'markdown',
  };
  return map[ext] ?? 'plain';
}

export function normalizeLangTag(tag: string | undefined): CodeLang {
  const t = (tag ?? '').toLowerCase();
  if (['js', 'javascript', 'jsx', 'node'].includes(t)) return 'javascript';
  if (['ts', 'typescript', 'tsx'].includes(t)) return 'typescript';
  if (['html', 'xml', 'svg', 'htm'].includes(t)) return 'html';
  if (['css', 'scss'].includes(t)) return 'css';
  if (['py', 'python'].includes(t)) return 'python';
  if (['swift'].includes(t)) return 'swift';
  if (['kt', 'kotlin'].includes(t)) return 'kotlin';
  if (['sql', 'postgres', 'mysql', 'sqlite'].includes(t)) return 'sql';
  if (['json'].includes(t)) return 'json';
  return 'plain';
}
