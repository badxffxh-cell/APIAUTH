import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { colors, fonts } from '@/theme';
import type { FileNode } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

export function fileIcon(name: string): { icon: IconName; color: string } {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return { icon: 'logo-html5', color: '#FF6B3D' };
    case 'css':
      return { icon: 'logo-css3', color: '#3D8BFF' };
    case 'js':
    case 'mjs':
      return { icon: 'logo-javascript', color: '#F7DF1E' };
    case 'ts':
      return { icon: 'code-slash', color: '#4A9DFF' };
    case 'json':
      return { icon: 'code-working', color: '#FFB86C' };
    case 'md':
      return { icon: 'document-text', color: '#B9A6FF' };
    case 'py':
      return { icon: 'logo-python', color: '#FFD43B' };
    case 'svg':
    case 'png':
    case 'jpg':
      return { icon: 'image', color: '#00FF94' };
    default:
      return { icon: 'document-outline', color: colors.textSecondary };
  }
}

interface Props {
  nodes: FileNode[];
  expanded: Set<string>;
  activePath: string | null;
  onToggle: (path: string) => void;
  onOpen: (node: FileNode) => void;
  onMenu: (node: FileNode) => void;
  depth?: number;
}

/** Árvore de arquivos e pastas com expandir/recolher e menu por toque longo. */
export function FileTree({ nodes, expanded, activePath, onToggle, onOpen, onMenu, depth = 0 }: Props) {
  return (
    <View>
      {nodes.map((n) => {
        const isOpen = expanded.has(n.path);
        const active = n.path === activePath;
        const fi = n.type === 'folder' ? { icon: (isOpen ? 'folder-open' : 'folder') as IconName, color: colors.primaryLight } : fileIcon(n.name);
        return (
          <Animated.View key={n.path} layout={LinearTransition.duration(180)} entering={FadeIn.duration(160)}>
            <Pressable
              onPress={() => {
                haptic.tap();
                if (n.type === 'folder') onToggle(n.path);
                else onOpen(n);
              }}
              onLongPress={() => {
                haptic.medium();
                onMenu(n);
              }}
              delayLongPress={320}
              style={({ pressed }) => [styles.row, { paddingLeft: 10 + depth * 16 }, active && styles.active, pressed && styles.pressed]}
            >
              {n.type === 'folder' ? (
                <Ionicons name={isOpen ? 'chevron-down' : 'chevron-forward'} size={13} color={colors.textTertiary} style={{ width: 14 }} />
              ) : (
                <View style={{ width: 14 }} />
              )}
              <Ionicons name={fi.icon} size={17} color={fi.color} />
              <Txt numberOfLines={1} style={[styles.name, active && { color: '#fff', fontFamily: fonts.monoBold }]}>
                {n.name}
              </Txt>
              <Pressable hitSlop={10} onPress={() => onMenu(n)} style={styles.more}>
                <Ionicons name="ellipsis-horizontal" size={15} color={colors.textTertiary} />
              </Pressable>
            </Pressable>
            {n.type === 'folder' && isOpen && (
              <FileTree nodes={n.children ?? []} expanded={expanded} activePath={activePath} onToggle={onToggle} onOpen={onOpen} onMenu={onMenu} depth={depth + 1} />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingRight: 6, borderRadius: 10 },
  active: { backgroundColor: 'rgba(108,99,255,0.28)' },
  pressed: { backgroundColor: 'rgba(255,255,255,0.07)' },
  name: { flex: 1, fontFamily: fonts.mono, fontSize: 13.5, color: colors.textSecondary },
  more: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
