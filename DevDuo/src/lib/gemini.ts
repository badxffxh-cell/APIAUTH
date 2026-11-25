import { fetch as expoFetch } from 'expo/fetch';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface StreamOptions {
  apiKey: string;
  model: string;
  system: string;
  history: GeminiTurn[];
  onToken: (fullText: string) => void;
  signal?: AbortSignal;
}

export class GeminiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function body(system: string, history: GeminiTurn[]) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 4096 },
  });
}

function extractText(json: any): string {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p: any) => typeof p?.text === 'string' && !p.thought)
    .map((p: any) => p.text)
    .join('');
}

async function readError(res: { status: number; text: () => Promise<string> }): Promise<GeminiError> {
  let msg = `Erro ${res.status}`;
  try {
    const raw = await res.text();
    const j = JSON.parse(raw);
    msg = j?.error?.message ?? msg;
  } catch {}
  if (res.status === 400 && /api key/i.test(msg)) msg = 'Chave da API inválida. Confira em Perfil → Ajustes.';
  if (res.status === 403) msg = 'Acesso negado pela API Gemini. Verifique se a chave tem permissão.';
  if (res.status === 404) msg = `Modelo não encontrado. Troque o modelo em Ajustes. (${msg})`;
  if (res.status === 429) msg = 'Limite de uso atingido. Aguarde alguns segundos e tente de novo.';
  return new GeminiError(msg, res.status);
}

const decoder: { decode: (b: Uint8Array, o?: { stream: boolean }) => string } =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8')
    : {
        // Fallback mínimo UTF-8.
        decode: (b: Uint8Array) => decodeURIComponent(escape(String.fromCharCode(...Array.from(b)))),
      };

/** Faz streaming via SSE. Se o streaming falhar, cai para uma chamada simples. */
export async function streamGemini(o: StreamOptions): Promise<string> {
  const url = `${BASE}/${encodeURIComponent(o.model)}:streamGenerateContent?alt=sse`;
  let full = '';
  try {
    const res = await expoFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': o.apiKey },
      body: body(o.system, o.history),
      signal: o.signal,
    });
    if (!res.ok) throw await readError(res);
    if (!res.body) throw new Error('no-stream');

    const reader = res.body.getReader();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          if (json?.error) throw new GeminiError(json.error.message ?? 'Erro na resposta');
          const t = extractText(json);
          if (t) {
            full += t;
            o.onToken(full);
          }
        } catch (e) {
          if (e instanceof GeminiError) throw e;
        }
      }
    }
    if (full) return full;
    throw new Error('empty-stream');
  } catch (e: any) {
    if (e instanceof GeminiError) throw e;
    if (e?.name === 'AbortError' || o.signal?.aborted) return full;
    if (full) return full;
  }

  // Fallback sem streaming.
  const res = await globalThis.fetch(`${BASE}/${encodeURIComponent(o.model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': o.apiKey },
    body: body(o.system, o.history),
    signal: o.signal,
  });
  if (!res.ok) throw await readError(res);
  const json = await res.json();
  const text = extractText(json);
  if (!text) {
    const reason = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason;
    throw new GeminiError(reason ? `Resposta bloqueada (${reason}).` : 'A IA não retornou texto.');
  }
  o.onToken(text);
  return text;
}

/** Teste rápido de conexão usado na tela de Ajustes. */
export async function pingGemini(apiKey: string, model: string): Promise<string> {
  let out = '';
  await streamGemini({
    apiKey,
    model,
    system: 'Responda apenas com: OK',
    history: [{ role: 'user', text: 'ping' }],
    onToken: (t) => (out = t),
  });
  return out.trim();
}
