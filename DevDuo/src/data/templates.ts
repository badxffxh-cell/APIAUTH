export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: readonly [string, string];
  files: Record<string, string>;
}

const STARTER_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu app DevDuo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="card">
    <span class="badge">DevDuo</span>
    <h1>Olá, mundo! 👋</h1>
    <p>Edite <code>index.html</code>, <code>style.css</code> e <code>script.js</code> e toque em ▶ para ver o resultado.</p>
    <button id="btn">Cliques: <strong id="count">0</strong></button>
  </main>
  <script src="script.js"></script>
</body>
</html>
`;

const STARTER_CSS = `* {
  box-sizing: border-box;
  margin: 0;
}

body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, system-ui, sans-serif;
  background: radial-gradient(circle at 20% 20%, #6C63FF55, transparent 40%),
              radial-gradient(circle at 80% 80%, #00E5FF44, transparent 40%),
              #080810;
  color: #fff;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 360px;
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #6C63FF;
}

h1 {
  margin: 16px 0 8px;
  font-size: 28px;
}

p {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

code {
  color: #00E5FF;
}

button {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #6C63FF, #00E5FF);
}

button:active {
  transform: scale(0.97);
}
`;

const STARTER_JS = `const btn = document.querySelector('#btn');
const count = document.querySelector('#count');
let cliques = 0;

btn.addEventListener('click', () => {
  cliques++;
  count.textContent = cliques;
  console.log('Cliques:', cliques);
});

console.log('script.js carregado 🚀');
`;

const LANDING_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>
    <nav>
      <strong>✦ Nova</strong>
      <a href="#recursos">Recursos</a>
    </nav>
  </header>
  <main>
    <section class="hero">
      <h1>Construa algo <span>incrível</span>.</h1>
      <p>Uma landing page pronta para você personalizar.</p>
      <a class="cta" href="#recursos">Começar</a>
    </section>
    <section id="recursos" class="grid">
      <article><h3>⚡ Rápido</h3><p>HTML e CSS puros.</p></article>
      <article><h3>🎨 Bonito</h3><p>Glassmorphism e gradientes.</p></article>
      <article><h3>📱 Responsivo</h3><p>Feito para o celular.</p></article>
    </section>
  </main>
  <footer>Feito com DevDuo</footer>
  <script src="js/app.js"></script>
</body>
</html>
`;

const LANDING_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #080810;
  color: #fff;
}

nav {
  display: flex;
  justify-content: space-between;
  padding: 20px;
}

nav a {
  color: #00E5FF;
  text-decoration: none;
}

.hero {
  padding: 60px 24px;
  text-align: center;
}

.hero h1 {
  font-size: 40px;
  line-height: 1.1;
}

.hero span {
  background: linear-gradient(90deg, #6C63FF, #00E5FF);
  -webkit-background-clip: text;
  color: transparent;
}

.hero p {
  color: rgba(255, 255, 255, 0.6);
}

.cta {
  display: inline-block;
  margin-top: 16px;
  padding: 14px 28px;
  border-radius: 999px;
  color: #080810;
  font-weight: 700;
  text-decoration: none;
  background: #00FF94;
}

.grid {
  display: grid;
  gap: 12px;
  padding: 24px;
}

article {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

article p {
  color: rgba(255, 255, 255, 0.6);
}

footer {
  text-align: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.4);
}
`;

const LANDING_JS = `document.querySelectorAll('article').forEach((card, i) => {
  card.style.opacity = 0;
  card.style.transform = 'translateY(16px)';
  setTimeout(() => {
    card.style.transition = 'all .5s ease';
    card.style.opacity = 1;
    card.style.transform = 'none';
  }, 200 + i * 150);
});
console.log('Landing pronta ✨');
`;

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'starter',
    name: 'Web Starter',
    description: 'index.html + style.css + script.js',
    icon: 'sparkles',
    colors: ['#6C63FF', '#00E5FF'],
    files: { 'index.html': STARTER_HTML, 'style.css': STARTER_CSS, 'script.js': STARTER_JS },
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Com pastas css/ e js/',
    icon: 'rocket',
    colors: ['#00FF94', '#00E5FF'],
    files: { 'index.html': LANDING_HTML, 'css/style.css': LANDING_CSS, 'js/app.js': LANDING_JS },
  },
  {
    id: 'blank',
    name: 'Em branco',
    description: 'Apenas um index.html',
    icon: 'document-outline',
    colors: ['#B48CFF', '#6C63FF'],
    files: {
      'index.html': '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Novo projeto</title>\n</head>\n<body>\n  <h1>Novo projeto</h1>\n</body>\n</html>\n',
    },
  },
];
