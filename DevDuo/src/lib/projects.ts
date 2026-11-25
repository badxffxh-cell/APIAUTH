import { Directory, File, Paths } from 'expo-file-system';

import { TEMPLATES } from '@/data/templates';
import type { FileNode, ProjectMeta } from '@/types';

const META_FILE = '.devduo.json';
const INVALID = /[\\:*?"<>|]/;

function root(): Directory {
  const dir = new Directory(Paths.document, 'DevDuoProjects');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function projectDir(id: string): Directory {
  return new Directory(root(), id);
}

function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function fileAt(projectId: string, path: string): File {
  return new File(projectDir(projectId), ...segments(path));
}

function dirAt(projectId: string, path: string): Directory {
  const segs = segments(path);
  return segs.length ? new Directory(projectDir(projectId), ...segs) : projectDir(projectId);
}

function slugify(name: string): string {
  const base =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'projeto';
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

export function validateName(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Digite um nome.';
  if (n.includes('/')) return 'O nome não pode conter "/".';
  if (INVALID.test(n)) return 'Caracteres inválidos: \\ : * ? " < > |';
  if (n === '.' || n === '..' || n === META_FILE) return 'Nome reservado.';
  return null;
}

function readMeta(id: string): ProjectMeta | null {
  try {
    const f = new File(projectDir(id), META_FILE);
    if (!f.exists) return null;
    return JSON.parse(f.textSync()) as ProjectMeta;
  } catch {
    return null;
  }
}

function writeMeta(meta: ProjectMeta) {
  const f = new File(projectDir(meta.id), META_FILE);
  if (!f.exists) f.create({ intermediates: true });
  f.writeSync(JSON.stringify(meta));
}

export function touchProject(id: string) {
  const meta = readMeta(id);
  if (meta) writeMeta({ ...meta, updatedAt: Date.now() });
}

/* ---------- Projetos ---------- */

export function listProjects(): (ProjectMeta & { fileCount: number })[] {
  const out: (ProjectMeta & { fileCount: number })[] = [];
  for (const entry of root().list()) {
    if (!(entry instanceof Directory)) continue;
    const meta = readMeta(entry.name) ?? {
      id: entry.name,
      name: entry.name,
      template: 'blank',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    out.push({ ...meta, fileCount: countFiles(entry) });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

function countFiles(dir: Directory): number {
  let n = 0;
  for (const e of dir.list()) {
    if (e instanceof Directory) n += countFiles(e);
    else if (e.name !== META_FILE) n++;
  }
  return n;
}

export function getProject(id: string): ProjectMeta | null {
  return readMeta(id);
}

export function createProject(name: string, templateId: string): ProjectMeta {
  const tpl = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const id = slugify(name);
  const dir = projectDir(id);
  dir.create({ intermediates: true, idempotent: true });
  for (const [path, content] of Object.entries(tpl.files)) {
    const f = fileAt(id, path);
    f.create({ intermediates: true, overwrite: true });
    f.writeSync(content);
  }
  const meta: ProjectMeta = { id, name: name.trim(), template: tpl.id, createdAt: Date.now(), updatedAt: Date.now() };
  writeMeta(meta);
  return meta;
}

export function renameProject(id: string, name: string) {
  const meta = readMeta(id);
  if (meta) writeMeta({ ...meta, name: name.trim(), updatedAt: Date.now() });
}

export function deleteProject(id: string) {
  const dir = projectDir(id);
  if (dir.exists) dir.delete();
}

/* ---------- Árvore de arquivos ---------- */

export function readTree(projectId: string): FileNode[] {
  const walk = (dir: Directory, prefix: string): FileNode[] => {
    const nodes: FileNode[] = [];
    for (const e of dir.list()) {
      if (e.name === META_FILE || e.name.startsWith('.')) continue;
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (e instanceof Directory) nodes.push({ name: e.name, path, type: 'folder', children: walk(e, path) });
      else nodes.push({ name: e.name, path, type: 'file' });
    }
    return nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
  };
  return walk(projectDir(projectId), '');
}

export function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((n) => (n.type === 'folder' ? flattenFiles(n.children ?? []) : [n]));
}

export function flattenFolders(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((n) => (n.type === 'folder' ? [n, ...flattenFolders(n.children ?? [])] : []));
}

export function readFile(projectId: string, path: string): string {
  const f = fileAt(projectId, path);
  return f.exists ? f.textSync() : '';
}

export function writeFile(projectId: string, path: string, content: string) {
  const f = fileAt(projectId, path);
  if (!f.exists) f.create({ intermediates: true });
  f.writeSync(content);
}

const joinPath = (parent: string, name: string) => (parent ? `${parent}/${name.trim()}` : name.trim());

function exists(projectId: string, path: string) {
  return fileAt(projectId, path).exists || dirAt(projectId, path).exists;
}

export function createFile(projectId: string, parent: string, name: string): string {
  const err = validateName(name);
  if (err) throw new Error(err);
  const path = joinPath(parent, name);
  if (exists(projectId, path)) throw new Error('Já existe um item com esse nome.');
  const f = fileAt(projectId, path);
  f.create({ intermediates: true });
  f.writeSync(defaultContentFor(name));
  return path;
}

export function createFolder(projectId: string, parent: string, name: string): string {
  const err = validateName(name);
  if (err) throw new Error(err);
  const path = joinPath(parent, name);
  if (exists(projectId, path)) throw new Error('Já existe um item com esse nome.');
  dirAt(projectId, path).create({ intermediates: true });
  return path;
}

export function renameItem(projectId: string, node: FileNode, newName: string): string {
  const err = validateName(newName);
  if (err) throw new Error(err);
  const parent = node.path.split('/').slice(0, -1).join('/');
  const target = joinPath(parent, newName);
  if (target === node.path) return target;
  if (exists(projectId, target)) throw new Error('Já existe um item com esse nome.');
  if (node.type === 'folder') dirAt(projectId, node.path).rename(newName.trim());
  else fileAt(projectId, node.path).rename(newName.trim());
  return target;
}

export function deleteItem(projectId: string, node: FileNode) {
  if (node.type === 'folder') dirAt(projectId, node.path).delete();
  else fileAt(projectId, node.path).delete();
}

/** Move um item para outra pasta ("" = raiz). Retorna o novo caminho. */
export function moveItem(projectId: string, node: FileNode, destFolder: string): string {
  if (node.type === 'folder' && (destFolder === node.path || destFolder.startsWith(node.path + '/'))) {
    throw new Error('Não é possível mover uma pasta para dentro dela mesma.');
  }
  const target = joinPath(destFolder, node.name);
  if (target === node.path) return target;
  if (exists(projectId, target)) throw new Error('O destino já tem um item com esse nome.');
  const dest = dirAt(projectId, destFolder);
  if (node.type === 'folder') dirAt(projectId, node.path).moveSync(dest);
  else fileAt(projectId, node.path).moveSync(dest);
  return target;
}

/** Lê todos os arquivos de texto do projeto (usado pelo preview). */
export function readAllFiles(projectId: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of flattenFiles(readTree(projectId))) {
    if (/\.(html?|css|m?js|json|txt|md|svg)$/i.test(n.name)) out[n.path] = readFile(projectId, n.path);
  }
  return out;
}

function defaultContentFor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'html' || ext === 'htm')
    return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Página</title>\n</head>\n<body>\n  \n</body>\n</html>\n';
  if (ext === 'css') return '/* Estilos */\n';
  if (ext === 'js') return '// JavaScript\n';
  if (ext === 'json') return '{\n  \n}\n';
  return '';
}
