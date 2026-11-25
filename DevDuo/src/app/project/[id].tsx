import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { scheduleOnRN } from 'react-native-worklets';

import { CodeEditor, type CodeEditorHandle } from '@/components/editor/CodeEditor';
import { FileTree, fileIcon } from '@/components/editor/FileTree';
import { KeyboardBar } from '@/components/editor/KeyboardBar';
import { ActionList, GlassSheet, PromptSheet } from '@/components/glass/GlassSheet';
import { GlassView } from '@/components/glass/GlassView';
import { EmptyState, IconButton } from '@/components/ui/Bits';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackground } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Txt } from '@/components/ui/Txt';
import { languageFromFilename } from '@/lib/highlighter';
import { haptic } from '@/lib/haptics';
import { CONSOLE_BRIDGE, buildPreviewHtml, buildScriptRunnerHtml } from '@/lib/preview';
import {
  createFile,
  createFolder,
  deleteItem,
  flattenFiles,
  flattenFolders,
  getProject,
  moveItem,
  readAllFiles,
  readFile,
  readTree,
  renameItem,
  touchProject,
  writeFile,
} from '@/lib/projects';
import { useProgress } from '@/store/progress';
import { useAIUI, useCelebration } from '@/store/ui';
import { colors, fonts, gradients, radius } from '@/theme';
import type { FileNode } from '@/types';

type View_ = 'code' | 'preview' | 'console';
type LogEntry = { id: number; level: 'log' | 'info' | 'warn' | 'error'; text: string; at: number };
type Prompt = { mode: 'newFile' | 'newFolder' | 'rename'; parent: string; node?: FileNode } | null;

const ACCESSORY_ID = 'devduo-editor-keys';
let logSeq = 0;

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const project = useMemo(() => getProject(projectId), [projectId]);

  // Estado inicial: árvore, pastas expandidas e o arquivo de entrada já aberto.
  const [initial] = useState(() => {
    let t: FileNode[] = [];
    try {
      t = readTree(projectId);
    } catch {}
    const files = flattenFiles(t);
    const first = files.find((f) => f.path === 'index.html') ?? files[0];
    return {
      tree: t,
      expanded: new Set(flattenFolders(t).map((f) => f.path)),
      openFiles: first ? [first.path] : [],
      active: first?.path ?? null,
      contents: first ? { [first.path]: readFile(projectId, first.path) } : {},
    };
  });
  const [tree, setTree] = useState<FileNode[]>(initial.tree);
  const [expanded, setExpanded] = useState<Set<string>>(initial.expanded);
  const [openFiles, setOpenFiles] = useState<string[]>(initial.openFiles);
  const [active, setActive] = useState<string | null>(initial.active);
  const [contents, setContents] = useState<Record<string, string>>(initial.contents);
  const [saving, setSaving] = useState<'saved' | 'saving'>('saved');
  const [view, setView] = useState<View_>('code');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [menuNode, setMenuNode] = useState<FileNode | null>(null);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [moveNode, setMoveNode] = useState<FileNode | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  const editorRef = useRef<CodeEditorHandle>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const contentsRef = useRef(contents);
  useEffect(() => {
    contentsRef.current = contents;
  }, [contents]);
  const previewTracked = useRef(false);

  const setContext = useAIUI((s) => s.setContext);
  const setEditorInsert = useAIUI((s) => s.setEditorInsert);

  const refreshTree = useCallback(() => {
    try {
      const t = readTree(projectId);
      setTree(t);
      return t;
    } catch {
      return [];
    }
  }, [projectId]);

  const openFile = useCallback(
    (path: string) => {
      setContents((c) => (path in c ? c : { ...c, [path]: readFile(projectId, path) }));
      setOpenFiles((f) => (f.includes(path) ? f : [...f, path]));
      setActive(path);
      setView('code');
    },
    [projectId]
  );

  // Teclado (para mostrar a barra de símbolos no Android).
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const flush = useCallback(() => {
    for (const [path, t] of Object.entries(timers.current)) {
      clearTimeout(t);
      const c = contentsRef.current[path];
      if (c !== undefined) writeFile(projectId, path, c);
    }
    timers.current = {};
    touchProject(projectId);
    setSaving('saved');
  }, [projectId]);

  // Salva tudo ao sair.
  useEffect(() => () => flush(), [flush]);

  const onEdit = (text: string) => {
    if (!active) return;
    const path = active;
    setContents((c) => ({ ...c, [path]: text }));
    setSaving('saving');
    clearTimeout(timers.current[path]);
    timers.current[path] = setTimeout(() => {
      writeFile(projectId, path, contentsRef.current[path] ?? text);
      delete timers.current[path];
      if (!Object.keys(timers.current).length) {
        touchProject(projectId);
        setSaving('saved');
      }
    }, 600);
  };

  // Contexto automático do arquivo aberto para o Assistente IA.
  useEffect(() => {
    if (!active || !project) return;
    const handle = setTimeout(() => {
      setContext({
        kind: 'file',
        projectName: project.name,
        fileName: active.split('/').pop() ?? active,
        path: active,
        language: languageFromFilename(active),
        content: contentsRef.current[active] ?? '',
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [active, contents, project, setContext]);

  useEffect(() => {
    setEditorInsert((code) => {
      setView('code');
      setTimeout(() => editorRef.current?.insert(code), 60);
    });
    return () => {
      setEditorInsert(null);
      setContext(null);
    };
  }, [setEditorInsert, setContext]);

  /* ---------- Preview ---------- */

  const runPreview = useCallback(() => {
    flush();
    const files = { ...readAllFiles(projectId), ...contentsRef.current };
    const htmlFiles = Object.keys(files).filter((p) => /\.html?$/i.test(p));
    let html: string;
    if (active && /\.html?$/i.test(active)) html = buildPreviewHtml(files, active);
    else if (htmlFiles.includes('index.html')) html = buildPreviewHtml(files, 'index.html');
    else if (htmlFiles.length) html = buildPreviewHtml(files, htmlFiles[0]);
    else if (active && /\.m?js$/i.test(active)) html = buildScriptRunnerHtml(files[active] ?? '', active);
    else html = '<html><body style="background:#080810;color:#fff;font-family:-apple-system;padding:24px">Crie um arquivo .html para ver o preview.</body></html>';
    setLogs([]);
    setPreviewHtml(html);
    setPreviewKey((k) => k + 1);
    if (!previewTracked.current) {
      previewTracked.current = true;
      useCelebration.getState().push(useProgress.getState().track('previewsRun'));
    }
  }, [active, flush, projectId]);

  const switchView = (v: View_) => {
    if (v === 'preview') runPreview();
    Keyboard.dismiss();
    setView(v);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.source !== 'devduo') return;
      setLogs((l) => [...l.slice(-199), { id: ++logSeq, level: data.level, text: String(data.text), at: Date.now() }]);
    } catch {}
  };

  /* ---------- Operações de arquivo ---------- */

  const remapPath = (from: string, to: string) => {
    const map = (p: string) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p);
    setOpenFiles((f) => f.map(map));
    setActive((a) => (a ? map(a) : a));
    setContents((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [map(k), v])));
  };

  const closeUnder = (path: string) => {
    const under = (p: string) => p === path || p.startsWith(path + '/');
    setOpenFiles((f) => {
      const next = f.filter((p) => !under(p));
      setActive((a) => (a && under(a) ? (next[next.length - 1] ?? null) : a));
      return next;
    });
    setContents((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !under(k))));
  };

  const closeTab = (path: string) => {
    flush();
    setOpenFiles((f) => {
      const next = f.filter((p) => p !== path);
      if (active === path) setActive(next[next.length - 1] ?? null);
      return next;
    });
  };

  const submitPrompt = (value: string) => {
    if (!prompt) return;
    try {
      flush();
      if (prompt.mode === 'newFile') {
        const path = createFile(projectId, prompt.parent, value);
        refreshTree();
        if (prompt.parent) setExpanded((e) => new Set(e).add(prompt.parent));
        openFile(path);
        setDrawer(false);
      } else if (prompt.mode === 'newFolder') {
        const path = createFolder(projectId, prompt.parent, value);
        refreshTree();
        setExpanded((e) => new Set(e).add(path));
      } else if (prompt.mode === 'rename' && prompt.node) {
        const to = renameItem(projectId, prompt.node, value);
        remapPath(prompt.node.path, to);
        refreshTree();
      }
      haptic.success();
      setPrompt(null);
      setPromptError(null);
    } catch (e: any) {
      haptic.error();
      setPromptError(e?.message ?? 'Erro');
    }
  };

  const doMove = (dest: string) => {
    if (!moveNode) return;
    try {
      flush();
      const to = moveItem(projectId, moveNode, dest);
      remapPath(moveNode.path, to);
      refreshTree();
      if (dest) setExpanded((e) => new Set(e).add(dest));
      haptic.success();
    } catch (e: any) {
      Alert.alert('Não foi possível mover', e?.message ?? '');
    }
    setMoveNode(null);
  };

  const doDelete = (node: FileNode) => {
    Alert.alert(`Excluir ${node.type === 'folder' ? 'pasta' : 'arquivo'}?`, `"${node.name}" será apagado${node.type === 'folder' ? ' com todo o conteúdo' : ''}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          clearTimeout(timers.current[node.path]);
          delete timers.current[node.path];
          deleteItem(projectId, node);
          closeUnder(node.path);
          refreshTree();
          haptic.warning();
        },
      },
    ]);
  };

  /* ---------- Gaveta (drawer) ---------- */

  const drawerW = Math.min(330, width * 0.82);
  const dx = useSharedValue(-drawerW);
  useEffect(() => {
    dx.set(drawer ? withSpring(0, { damping: 20, stiffness: 200 }) : withTiming(-drawerW - 20, { duration: 220 }));
    if (drawer) Keyboard.dismiss();
  }, [drawer, drawerW, dx]);
  const drawerPan = usePanGesture({
    activeOffsetX: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      dx.set(Math.min(0, e.translationX));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationX < -80 || e.velocityX < -600) scheduleOnRN(setDrawer, false);
      else dx.set(withSpring(0, { damping: 20, stiffness: 200 }));
    },
  });
  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: 1 + dx.value / (drawerW + 20) }));

  if (!project) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <EmptyState icon="alert-circle" title="Projeto não encontrado" subtitle="Ele pode ter sido excluído." />
        </View>
      </ScreenBackground>
    );
  }

  const activeLang = active ? languageFromFilename(active) : 'plain';
  const errors = logs.filter((l) => l.level === 'error').length;
  const folders = [{ name: 'Raiz do projeto', path: '' }, ...flattenFolders(tree)];

  return (
    <ScreenBackground palette={['rgba(108,99,255,0.22)', 'rgba(0,229,255,0.14)', 'rgba(0,255,148,0.06)']}>
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="chevron-back" onPress={() => router.back()} size={40} />
        <IconButton icon="folder-open-outline" onPress={() => setDrawer(true)} size={40} color={colors.primaryLight} />
        <View style={{ flex: 1 }}>
          <Txt variant="headline" numberOfLines={1}>
            {project.name}
          </Txt>
          <View style={styles.saveRow}>
            <View style={[styles.saveDot, { backgroundColor: saving === 'saved' ? colors.success : colors.warning }]} />
            <Txt variant="micro">{saving === 'saved' ? 'Salvo no dispositivo' : 'Salvando...'}</Txt>
          </View>
        </View>
        <PressableScale onPress={() => switchView('preview')} hapticStyle="medium" scaleTo={0.9}>
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.run}>
            <Ionicons name="play" size={18} color={colors.textInverse} />
          </LinearGradient>
        </PressableScale>
      </View>

      {/* Abas de arquivos abertos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ paddingHorizontal: 14, gap: 6 }}>
        {openFiles.map((p) => {
          const fi = fileIcon(p);
          const on = p === active;
          return (
            <Animated.View key={p} entering={FadeIn}>
              <Pressable onPress={() => (setActive(p), setView('code'))} style={[styles.tab, on && styles.tabOn]}>
                <Ionicons name={fi.icon} size={13} color={fi.color} />
                <Txt style={[styles.tabText, on && { color: '#fff' }]} numberOfLines={1}>
                  {p.split('/').pop()}
                </Txt>
                <Pressable hitSlop={8} onPress={() => closeTab(p)}>
                  <Ionicons name="close" size={13} color={colors.textTertiary} />
                </Pressable>
                {on && <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabLine} />}
              </Pressable>
            </Animated.View>
          );
        })}
        <Pressable onPress={() => setPrompt({ mode: 'newFile', parent: '' })} style={[styles.tab, { paddingHorizontal: 10 }]}>
          <Ionicons name="add" size={15} color={colors.accent} />
        </Pressable>
      </ScrollView>

      <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
        <Segmented
          value={view}
          onChange={switchView}
          items={[
            { key: 'code', label: 'Código', icon: 'code-slash' },
            { key: 'preview', label: 'Preview', icon: 'eye' },
            { key: 'console', label: 'Console', icon: 'terminal', badge: errors || undefined },
          ]}
        />
      </View>

      {/* Conteúdo */}
      <View style={{ flex: 1 }}>
        {view === 'code' &&
          (active ? (
            <GlassView radius={radius.lg} shadow={false} tintColor="rgba(5,5,12,0.72)" style={styles.editorWrap}>
              <CodeEditor ref={editorRef} value={contents[active] ?? ''} onChange={onEdit} language={activeLang} accessoryId={ACCESSORY_ID} bottomInset={insets.bottom + 120} />
            </GlassView>
          ) : (
            <EmptyState icon="document-text" title="Nenhum arquivo aberto" subtitle="Abra a gaveta de arquivos para escolher ou criar um arquivo." />
          ))}

        {/* O WebView fica montado para manter o console vivo ao trocar de aba. */}
        {previewHtml !== '' && (
          <View style={[styles.previewWrap, view !== 'preview' && styles.hidden]} pointerEvents={view === 'preview' ? 'auto' : 'none'}>
            <View style={styles.browserBar}>
              <View style={styles.urlPill}>
                <Ionicons name="lock-closed" size={11} color={colors.success} />
                <Txt style={styles.url} numberOfLines={1}>
                  devduo://{project.name.toLowerCase().replace(/\s+/g, '-')}/{active && /\.html?$/i.test(active) ? active : 'index.html'}
                </Txt>
              </View>
              <IconButton icon="refresh" size={32} onPress={runPreview} />
            </View>
            <WebView
              key={previewKey}
              originWhitelist={['*']}
              source={{ html: previewHtml }}
              injectedJavaScriptBeforeContentLoaded={CONSOLE_BRIDGE}
              onMessage={onMessage}
              style={{ flex: 1, backgroundColor: '#ffffff' }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              setSupportMultipleWindows={false}
            />
          </View>
        )}

        {view === 'console' && (
          <Animated.View entering={FadeInDown.springify()} style={{ flex: 1 }}>
            <GlassView radius={radius.lg} shadow={false} tintColor="rgba(5,5,12,0.8)" style={styles.console}>
              <View style={styles.consoleHead}>
                <Txt variant="label">Console</Txt>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <IconButton icon="play" size={32} color={colors.success} onPress={() => (runPreview(), setView('console'))} />
                  <IconButton icon="trash-outline" size={32} color={colors.textSecondary} onPress={() => setLogs([])} />
                </View>
              </View>
              <ScrollView contentContainerStyle={{ padding: 12, gap: 6, paddingBottom: insets.bottom + 30 }}>
                {logs.length === 0 && (
                  <Txt variant="caption" style={{ fontFamily: fonts.mono }}>
                    {previewHtml ? '// Nenhuma saída ainda. Use console.log() no seu JS.' : '// Rode o projeto (▶) para ver a saída aqui.'}
                  </Txt>
                )}
                {logs.map((l) => (
                  <View key={l.id} style={[styles.log, l.level === 'error' && styles.logError, l.level === 'warn' && styles.logWarn]}>
                    <Ionicons
                      name={l.level === 'error' ? 'close-circle' : l.level === 'warn' ? 'warning' : 'chevron-forward'}
                      size={13}
                      color={l.level === 'error' ? colors.danger : l.level === 'warn' ? colors.warning : colors.accent}
                      style={{ marginTop: 2 }}
                    />
                    <Txt selectable style={[styles.logText, l.level === 'error' && { color: '#FF8FA3' }, l.level === 'warn' && { color: '#FFD58A' }]}>
                      {l.text}
                    </Txt>
                  </View>
                ))}
                {errors > 0 && (
                  <PressableScale onPress={() => useAIUI.getState().ask(`Meu código gerou estes erros no console:\n${logs.filter((l) => l.level === 'error').map((l) => l.text).join('\n')}\n\nComo corrijo?`)} hapticStyle="light" style={styles.fixBtn}>
                    <Ionicons name="sparkles" size={15} color={colors.accent} />
                    <Txt variant="caption" color={colors.accent}>
                      Pedir para a IA explicar os erros
                    </Txt>
                  </PressableScale>
                )}
              </ScrollView>
            </GlassView>
          </Animated.View>
        )}
      </View>

      {view === 'code' && active && Platform.OS === 'android' && keyboard && (
        <KeyboardBar nativeID={ACCESSORY_ID} language={activeLang} onInsert={(t, b) => editorRef.current?.insert(t, b)} onCloseTag={() => editorRef.current?.closeTag()} onDismiss={() => Keyboard.dismiss()} />
      )}
      {Platform.OS === 'ios' && (
        <KeyboardBar nativeID={ACCESSORY_ID} language={activeLang} onInsert={(t, b) => editorRef.current?.insert(t, b)} onCloseTag={() => editorRef.current?.closeTag()} onDismiss={() => Keyboard.dismiss()} />
      )}

      {/* Gaveta de arquivos */}
      {drawer && (
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(4,4,10,0.55)' }]} onPress={() => setDrawer(false)} />
        </Animated.View>
      )}
      <GestureDetector gesture={drawerPan}>
        <Animated.View style={[styles.drawer, { width: drawerW, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }, drawerStyle]} pointerEvents={drawer ? 'auto' : 'none'}>
          <GlassView radius={0} strong intensity={80} style={StyleSheet.absoluteFill} borderColor="rgba(255,255,255,0.14)" />
          <View style={styles.drawerHead}>
            <View style={{ flex: 1 }}>
              <Txt variant="label">Explorador</Txt>
              <Txt variant="headline" numberOfLines={1}>
                {project.name}
              </Txt>
            </View>
            <IconButton icon="document-outline" size={36} color={colors.accent} onPress={() => setPrompt({ mode: 'newFile', parent: '' })} />
            <IconButton icon="folder-outline" size={36} color={colors.primaryLight} onPress={() => setPrompt({ mode: 'newFolder', parent: '' })} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 30 }}>
            <FileTree
              nodes={tree}
              expanded={expanded}
              activePath={active}
              onToggle={(p) =>
                setExpanded((e) => {
                  const n = new Set(e);
                  if (n.has(p)) n.delete(p);
                  else n.add(p);
                  return n;
                })
              }
              onOpen={(n) => {
                openFile(n.path);
                setDrawer(false);
              }}
              onMenu={setMenuNode}
            />
            <Txt variant="micro" style={{ marginTop: 16, paddingHorizontal: 10, color: colors.textTertiary }}>
              Toque longo em um item para renomear, mover ou excluir.
            </Txt>
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Menus e diálogos */}
      <GlassSheet visible={!!menuNode} onClose={() => setMenuNode(null)} title={menuNode?.name} subtitle={menuNode?.path}>
        {menuNode && (
          <ActionList
            actions={[
              ...(menuNode.type === 'folder'
                ? [
                    { label: 'Novo arquivo aqui', icon: 'document-outline' as const, onPress: () => (setPrompt({ mode: 'newFile', parent: menuNode.path }), setMenuNode(null)) },
                    { label: 'Nova pasta aqui', icon: 'folder-outline' as const, onPress: () => (setPrompt({ mode: 'newFolder', parent: menuNode.path }), setMenuNode(null)) },
                  ]
                : [{ label: 'Abrir', icon: 'open-outline' as const, onPress: () => (openFile(menuNode.path), setMenuNode(null), setDrawer(false)) }]),
              { label: 'Renomear', icon: 'pencil', onPress: () => (setPrompt({ mode: 'rename', parent: '', node: menuNode }), setMenuNode(null)) },
              { label: 'Mover para...', icon: 'move', onPress: () => (setMoveNode(menuNode), setMenuNode(null)) },
              { label: 'Excluir', icon: 'trash', destructive: true, onPress: () => (doDelete(menuNode), setMenuNode(null)) },
            ]}
          />
        )}
      </GlassSheet>

      <PromptSheet
        visible={!!prompt}
        mono
        title={prompt?.mode === 'newFile' ? 'Novo arquivo' : prompt?.mode === 'newFolder' ? 'Nova pasta' : 'Renomear'}
        subtitle={prompt?.mode === 'rename' ? prompt.node?.path : `em /${prompt?.parent ?? ''}`}
        initial={prompt?.mode === 'rename' ? (prompt.node?.name ?? '') : ''}
        placeholder={prompt?.mode === 'newFolder' ? 'components' : 'pagina.html, app.js, estilo.css...'}
        confirmLabel={prompt?.mode === 'rename' ? 'Renomear' : 'Criar'}
        error={promptError}
        onClose={() => (setPrompt(null), setPromptError(null))}
        onSubmit={submitPrompt}
      />

      <GlassSheet visible={!!moveNode} onClose={() => setMoveNode(null)} title={`Mover "${moveNode?.name}"`} subtitle="Escolha a pasta de destino">
        <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 8 }}>
          {folders
            .filter((f) => !moveNode || (f.path !== moveNode.path && !f.path.startsWith(moveNode.path + '/')))
            .map((f) => (
              <PressableScale key={f.path || 'root'} onPress={() => doMove(f.path)} scaleTo={0.97} hapticStyle="tap">
                <GlassView radius={radius.md} shadow={false} borderColor={colors.glassBorderSoft} style={styles.folderRow}>
                  <Ionicons name={f.path ? 'folder' : 'home'} size={18} color={colors.primaryLight} />
                  <Txt style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.text, flex: 1 }} numberOfLines={1}>
                    /{f.path}
                  </Txt>
                </GlassView>
              </PressableScale>
            ))}
        </ScrollView>
      </GlassSheet>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveDot: { width: 6, height: 6, borderRadius: 3 },
  run: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: colors.success, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  tabs: { flexGrow: 0, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.glassBorderSoft, maxWidth: 180, overflow: 'hidden' },
  tabOn: { backgroundColor: 'rgba(108,99,255,0.22)', borderColor: 'rgba(108,99,255,0.6)' },
  tabText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2 },
  editorWrap: { flex: 1, marginHorizontal: 10, overflow: 'hidden' },
  previewWrap: { ...StyleSheet.absoluteFill, marginHorizontal: 10, marginBottom: 10, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: '#fff' },
  hidden: { opacity: 0, zIndex: -1 },
  browserBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#14141F' },
  urlPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, borderRadius: 9, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
  url: { flex: 1, fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary },
  console: { flex: 1, marginHorizontal: 10, marginBottom: 10, overflow: 'hidden' },
  consoleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorderSoft },
  log: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 },
  logError: { backgroundColor: 'rgba(255,77,109,0.10)' },
  logWarn: { backgroundColor: 'rgba(255,176,32,0.10)' },
  logText: { flex: 1, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 18, color: colors.text },
  fixBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: colors.accentSoft },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  drawerHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12, marginBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorderSoft },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48 },
});
