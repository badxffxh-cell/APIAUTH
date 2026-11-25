import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { ActionList, GlassSheet, PromptSheet } from '@/components/glass/GlassSheet';
import { GlassView } from '@/components/glass/GlassView';
import { EmptyState, GradientIcon, IconButton } from '@/components/ui/Bits';
import { GradientButton } from '@/components/ui/GradientButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackground, ScreenTitle, TAB_BAR_SPACE } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { TEMPLATES } from '@/data/templates';
import { relativeTime } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { createProject, deleteProject, listProjects, renameProject } from '@/lib/projects';
import { useProgress } from '@/store/progress';
import { useCelebration } from '@/store/ui';
import { colors, fonts, radius } from '@/theme';
import type { ProjectMeta } from '@/types';

type Project = ProjectMeta & { fileCount: number };

export default function EditorScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [menu, setMenu] = useState<Project | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);

  const refresh = useCallback(() => {
    try {
      setProjects(listProjects());
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = () => {
    const n = name.trim() || 'Meu projeto';
    try {
      const meta = createProject(n, template);
      haptic.success();
      const fresh = useProgress.getState().track('projectsCreated');
      setCreating(false);
      setName('');
      refresh();
      setTimeout(() => {
        router.push(`/project/${meta.id}`);
        useCelebration.getState().push(fresh);
      }, 250);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível criar o projeto.');
    }
  };

  const tpl = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

  return (
    <ScreenBackground palette={['rgba(0,229,255,0.30)', 'rgba(108,99,255,0.36)', 'rgba(0,255,148,0.12)']}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Editor" subtitle="Sua IDE de bolso" right={<IconButton icon="add" onPress={() => setCreating(true)} />} />

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Animated.View entering={FadeInDown.springify()}>
            <PressableScale onPress={() => setCreating(true)} scaleTo={0.97}>
              <GlassView radius={radius.xl} style={styles.newCard}>
                <GradientIcon icon="add" colors={['#6C63FF', '#00E5FF']} size={52} />
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">Novo projeto</Txt>
                  <Txt variant="caption">HTML, CSS e JS com preview ao vivo</Txt>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </GlassView>
            </PressableScale>
          </Animated.View>

          {projects.length === 0 ? (
            <EmptyState icon="folder-open" title="Nenhum projeto ainda" subtitle="Crie seu primeiro projeto a partir de um template e veja o resultado na hora." />
          ) : (
            <>
              <Txt variant="label" style={{ marginTop: 14 }}>
                Projetos · {projects.length}
              </Txt>
              {projects.map((p, i) => {
                const t = tpl(p.template);
                return (
                  <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 50).springify()} layout={LinearTransition.springify()}>
                    <PressableScale onPress={() => router.push(`/project/${p.id}`)} onLongPress={() => setMenu(p)} scaleTo={0.97}>
                      <GlassView radius={radius.lg} style={styles.project}>
                        <GradientIcon icon={t.icon as never} colors={t.colors} size={46} glow={false} />
                        <View style={{ flex: 1 }}>
                          <Txt variant="headline" numberOfLines={1}>
                            {p.name}
                          </Txt>
                          <Txt variant="caption">
                            {p.fileCount} {p.fileCount === 1 ? 'arquivo' : 'arquivos'} · {relativeTime(p.updatedAt)}
                          </Txt>
                        </View>
                        <IconButton icon="ellipsis-horizontal" size={36} color={colors.textSecondary} onPress={() => setMenu(p)} />
                      </GlassView>
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>

      <GlassSheet visible={creating} onClose={() => setCreating(false)} title="Novo projeto" subtitle="Escolha um template para começar">
        <GlassView radius={radius.md} shadow={false} style={styles.inputWrap}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do projeto"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            keyboardAppearance="dark"
            selectionColor={colors.accent}
            returnKeyType="done"
          />
        </GlassView>
        <View style={{ gap: 8, marginTop: 14 }}>
          {TEMPLATES.map((t) => {
            const active = template === t.id;
            return (
              <PressableScale key={t.id} onPress={() => setTemplate(t.id)} scaleTo={0.97} hapticStyle="tap">
                <GlassView radius={radius.md} shadow={false} borderColor={active ? colors.accent : colors.glassBorderSoft} tintColor={active ? 'rgba(0,229,255,0.08)' : undefined} style={styles.template}>
                  <GradientIcon icon={t.icon as never} colors={t.colors} size={38} glow={false} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{t.name}</Txt>
                    <Txt variant="micro" style={{ fontFamily: fonts.mono }}>
                      {t.description}
                    </Txt>
                  </View>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.accent : colors.textTertiary} />
                </GlassView>
              </PressableScale>
            );
          })}
        </View>
        <GradientButton title="Criar projeto" icon="sparkles" onPress={create} style={{ marginTop: 18 }} />
      </GlassSheet>

      <GlassSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        <ActionList
          actions={[
            { label: 'Abrir', icon: 'open-outline', onPress: () => (setMenu(null), menu && router.push(`/project/${menu.id}`)) },
            { label: 'Renomear', icon: 'pencil', onPress: () => (setRenaming(menu), setMenu(null)) },
            {
              label: 'Excluir projeto',
              icon: 'trash',
              destructive: true,
              onPress: () => {
                const p = menu;
                setMenu(null);
                if (!p) return;
                Alert.alert('Excluir projeto?', `"${p.name}" e todos os seus arquivos serão apagados.`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                      deleteProject(p.id);
                      haptic.warning();
                      refresh();
                    },
                  },
                ]);
              },
            },
          ]}
        />
      </GlassSheet>

      <PromptSheet
        visible={!!renaming}
        title="Renomear projeto"
        initial={renaming?.name ?? ''}
        onClose={() => setRenaming(null)}
        onSubmit={(v) => {
          if (renaming && v.trim()) renameProject(renaming.id, v);
          setRenaming(null);
          refresh();
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  newCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  project: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  inputWrap: { paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  input: { position: 'relative', color: colors.text, fontFamily: fonts.medium, fontSize: 16 },
  template: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
});
