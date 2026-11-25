# DevDuo — um Duolingo para desenvolvedores

App mobile em **React Native + Expo SDK 58** com três modos:

- **Aprender** — trilhas por linguagem (HTML, CSS, JavaScript, TypeScript, Python, Swift, Kotlin, SQL), níveis Iniciante → Intermediário → Avançado, exercícios interativos (múltipla escolha, completar código, escrever código, ordenar linhas e cartões de conceito), XP, ofensiva diária, corações, gemas, conquistas e ranking semanal. Progresso salvo com AsyncStorage.
- **Editor** — IDE de bolso: projetos com pastas e arquivos (criar, renomear, excluir e mover), editor com syntax highlighting, numeração de linhas, auto-indentação e barra de símbolos acima do teclado, abas de arquivos abertos, preview HTML/CSS/JS em WebView e console capturando `console.log` e erros. Tudo salvo no aparelho com `expo-file-system`.
- **Assistente IA** — chat com Gemini (streaming), acessível por um botão flutuante arrastável em qualquer tela. Envia automaticamente o arquivo aberto ou o exercício atual como contexto, explica erros do console e insere código no editor.

## Visual

- Glassmorphism estilo iOS com `expo-blur` em cards, sheets, tab bar e chat
- Three.js via `expo-gl` + `expo-three`: partículas que formam símbolos de código na tela inicial, ícones 3D das linguagens e explosões de partículas nas conquistas e no fim das lições
- `@shopify/react-native-skia`: anéis de progresso, barras de XP com gradiente animado, gráfico semanal, glows e o caminho da trilha
- Reanimated 4 (API do Reanimated 3) + Gesture Handler 3: micro-animações com mola, sheets arrastáveis, gaveta de arquivos, botão flutuante
- Fontes Inter e JetBrains Mono (`@expo-google-fonts`)

## Rodar

```bash
cd DevDuo
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (iOS/Android). Todas as bibliotecas nativas usadas estão incluídas no Expo Go do SDK 58.

### Chave do Gemini

Gere uma chave grátis em https://aistudio.google.com/app/apikey e cole em **Perfil → Ajustes**. A chave fica no Keychain/Keystore do aparelho. Para desenvolvimento você também pode criar um `.env.local` com `EXPO_PUBLIC_GEMINI_API_KEY=...`. Nesse caso a chave fica embutida no bundle, então não use isso em builds distribuídos.

Modelo padrão: `gemini-4-hydrogen` (dá para trocar em Ajustes, inclusive digitando outro id).

## Gerar o IPA (iOS)

**Sem conta Apple paga (CI do GitHub):** o workflow `.github/workflows/devduo-ios-ipa.yml` compila em Release num runner `macos-26` e publica o artefato `DevDuo-unsigned-ipa`. Ele roda em todo push que mexe em `DevDuo/` nesta branch, ou manualmente em *Actions → Run workflow*. O IPA não é assinado: instale com **Sideloadly** ou **AltStore**, que re-assinam com o seu Apple ID. Com Apple ID grátis o app vale por 7 dias.

**Com conta Apple Developer (EAS):**

```bash
npx eas-cli@latest build -p ios --profile preview
```

## Estrutura

```
src/
  app/                 rotas (expo-router)
    (tabs)/            Aprender · Editor · Assistente · Perfil
    course/[id].tsx    trilha da linguagem
    lesson/[id].tsx    lição com exercícios
    project/[id].tsx   IDE do projeto
    ranking · achievements · settings
  components/
    glass/             GlassView, GlassSheet
    three/             ThreeView, partículas, ícones 3D, burst
    skia/              ProgressRing, XPBar, WeeklyChart, Glow, AmbientOrbs
    exercises/         Choice, Fill, Write, Arrange, LearnCard
    editor/            CodeEditor, FileTree, KeyboardBar
    ai/                AIOverlay, ChatView, Markdown
  data/                linguagens, lições, conquistas, ranking, templates
  lib/                 highlighter, gemini, projects (FS), preview, exercise
  store/               zustand + AsyncStorage (progresso, chat, ajustes)
```
