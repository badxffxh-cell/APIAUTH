import { lesson, r } from './builder';

export const HTML_LESSONS = [
  lesson(
    {
      id: 'html-1',
      languageId: 'html',
      level: 'iniciante',
      title: 'Sua primeira página',
      description: 'Tags, elementos e a estrutura básica de um documento HTML.',
      icon: 'document-text',
      xp: 15,
    },
    [
      {
        type: 'learn',
        title: 'HTML é feito de tags',
        prompt:
          'HTML descreve a estrutura de uma página usando tags. Uma tag abre com <nome> e fecha com </nome>. Tudo entre elas é o conteúdo do elemento.',
        code: '<h1>Olá, mundo!</h1>\n<p>Meu primeiro parágrafo.</p>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'O que significa a sigla HTML?',
        options: [
          'HyperText Markup Language',
          'High Tech Modern Language',
          'Hyperlink Text Making Logic',
          'Home Tool Markup Language',
        ],
        answer: 0,
        explanation:
          'HTML = HyperText Markup Language. É uma linguagem de marcação: ela estrutura o conteúdo, não executa lógica.',
      },
      {
        type: 'choice',
        prompt: 'Qual tag cria o título principal visível da página?',
        options: ['<h1>', '<title>', '<head>', '<p>'],
        monoOptions: true,
        answer: 0,
        explanation:
          '<h1> é o título principal visível. Já <title> define o texto que aparece na aba do navegador.',
      },
      {
        type: 'fill',
        prompt: 'Feche o parágrafo corretamente.',
        template: '<p>Olá, DevDuo!{{0}}',
        codeLang: 'html',
        blanks: ['</p>'],
        bank: ['<p>', '</p>', '<\\p>', '/p>'],
        explanation: 'A tag de fechamento repete o nome da tag com uma barra: </p>.',
      },
      {
        type: 'arrange',
        prompt: 'Monte a estrutura básica de um documento HTML.',
        codeLang: 'html',
        lines: [
          '<!DOCTYPE html>',
          '<html>',
          '  <body>',
          '    <h1>DevDuo</h1>',
          '  </body>',
          '</html>',
        ],
        explanation:
          'O <!DOCTYPE html> vem primeiro, depois <html> envolve tudo e o conteúdo visível fica dentro de <body>.',
      },
      {
        type: 'write',
        prompt: 'Escreva um parágrafo com o texto: Eu amo codar',
        codeLang: 'html',
        placeholder: '<p>...</p>',
        checks: [
          { pattern: r`<p>`, flags: 'i', hint: 'Comece abrindo a tag <p>.' },
          { pattern: r`<\/p>\s*$`, flags: 'i', hint: 'Não esqueça de fechar com </p>.' },
          {
            pattern: r`<p>\s*Eu amo codar\s*<\/p>`,
            flags: 'i',
            hint: 'O texto "Eu amo codar" deve ficar entre <p> e </p>.',
          },
        ],
        solution: '<p>Eu amo codar</p>',
        explanation: 'Perfeito! Um parágrafo é criado com <p>conteúdo</p>.',
      },
    ]
  ),

  lesson(
    {
      id: 'html-2',
      languageId: 'html',
      level: 'iniciante',
      title: 'Títulos e textos',
      description: 'Hierarquia de títulos, ênfase e quebras de linha.',
      icon: 'text',
      xp: 15,
    },
    [
      {
        type: 'learn',
        title: 'Hierarquia de títulos',
        prompt:
          'Existem seis níveis de título: de <h1> (mais importante) até <h6>. Use <strong> para importância e <em> para ênfase.',
        code: '<h1>Blog</h1>\n<h2>Post de hoje</h2>\n<p>Isso é <strong>muito</strong> <em>legal</em>!</p>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Quantos níveis de título existem no HTML?',
        options: ['3', '6', '10', 'Ilimitados'],
        answer: 1,
        explanation: 'São seis: <h1>, <h2>, <h3>, <h4>, <h5> e <h6>.',
      },
      {
        type: 'fill',
        prompt: 'Destaque a palavra como importante.',
        template: '<p>Isso é {{0}}importante{{1}}</p>',
        codeLang: 'html',
        blanks: ['<strong>', '</strong>'],
        bank: ['<strong>', '</strong>', '<bold>', '</bold>', '<em>'],
        explanation: '<strong> indica importância (e normalmente aparece em negrito).',
      },
      {
        type: 'choice',
        prompt: 'Qual tag adiciona ênfase semântica (geralmente em itálico)?',
        options: ['<em>', '<strong>', '<emph>', '<it>'],
        monoOptions: true,
        answer: 0,
        explanation: '<em> = emphasis. Leitores de tela mudam o tom de voz para esse trecho.',
      },
      {
        type: 'arrange',
        prompt: 'Organize os títulos respeitando a hierarquia.',
        codeLang: 'html',
        lines: [
          '<h1>Receitas</h1>',
          '<h2>Doces</h2>',
          '<h3>Brigadeiro</h3>',
          '<p>Leite condensado, chocolate e manteiga.</p>',
        ],
        explanation: 'Títulos descem um nível por vez: h1 → h2 → h3, e o texto vem depois.',
      },
      {
        type: 'write',
        prompt: 'Crie um título de nível 2 com o texto: Sobre mim',
        codeLang: 'html',
        placeholder: '<h2>...</h2>',
        checks: [
          { pattern: r`<h2>`, flags: 'i', hint: 'Um título de nível 2 usa a tag <h2>.' },
          { pattern: r`<\/h2>`, flags: 'i', hint: 'Feche o título com </h2>.' },
          {
            pattern: r`<h2>\s*Sobre mim\s*<\/h2>`,
            flags: 'i',
            hint: 'O texto "Sobre mim" deve ficar dentro do <h2>.',
          },
        ],
        solution: '<h2>Sobre mim</h2>',
        explanation: 'Isso aí! <h2> é ótimo para seções dentro da página.',
      },
    ]
  ),

  lesson(
    {
      id: 'html-3',
      languageId: 'html',
      level: 'iniciante',
      title: 'Links e imagens',
      description: 'Conecte páginas com <a> e mostre imagens com <img>.',
      icon: 'link',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Atributos dão superpoderes às tags',
        prompt:
          'Atributos ficam na tag de abertura: nome="valor". O link <a> usa href para o destino. A imagem <img> usa src para o arquivo e alt para a descrição. <img> não tem tag de fechamento!',
        code: '<a href="https://devduo.app">Visite o DevDuo</a>\n<img src="logo.png" alt="Logo do DevDuo">',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual atributo define o destino de um link?',
        options: ['href', 'src', 'link', 'url'],
        monoOptions: true,
        answer: 0,
        explanation: 'href = hypertext reference. É o endereço para onde o link aponta.',
      },
      {
        type: 'fill',
        prompt: 'Complete a imagem com o arquivo e a descrição.',
        template: '<img {{0}}="gato.png" {{1}}="Um gato fofo">',
        codeLang: 'html',
        blanks: ['src', 'alt'],
        bank: ['href', 'src', 'title', 'alt', 'link'],
        explanation: 'src aponta para o arquivo da imagem e alt descreve a imagem.',
      },
      {
        type: 'choice',
        prompt: 'Por que o atributo alt é importante?',
        options: [
          'Acessibilidade e quando a imagem não carrega',
          'Deixa a imagem maior',
          'Define o formato do arquivo',
          'É obrigatório apenas em links',
        ],
        answer: 0,
        explanation:
          'Leitores de tela leem o alt para pessoas com deficiência visual, e ele aparece se a imagem falhar.',
      },
      {
        type: 'choice',
        prompt: 'O que este código faz?',
        code: '<a href="sobre.html" target="_blank">Sobre</a>',
        codeLang: 'html',
        options: [
          'Abre sobre.html em uma nova aba',
          'Baixa o arquivo sobre.html',
          'Mostra uma imagem chamada Sobre',
          'Abre sobre.html na mesma aba',
        ],
        answer: 0,
        explanation: 'target="_blank" faz o link abrir em uma nova aba ou janela.',
      },
      {
        type: 'write',
        prompt: 'Crie um link para https://google.com com o texto: Google',
        codeLang: 'html',
        placeholder: '<a href="...">...</a>',
        checks: [
          { pattern: r`<a\s`, flags: 'i', hint: 'Links começam com <a ...>.' },
          {
            pattern: r`href\s*=\s*["']https?:\/\/(www\.)?google\.com\/?["']`,
            flags: 'i',
            hint: 'Use o atributo href="https://google.com".',
          },
          { pattern: r`>\s*Google\s*<\/a>`, flags: 'i', hint: 'O texto Google fica antes de </a>.' },
        ],
        solution: '<a href="https://google.com">Google</a>',
        explanation: 'Link criado! A web inteira é feita de links como esse.',
      },
    ]
  ),

  lesson(
    {
      id: 'html-4',
      languageId: 'html',
      level: 'intermediario',
      title: 'Listas e tabelas',
      description: 'Organize informações com <ul>, <ol> e <table>.',
      icon: 'list',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Listas',
        prompt:
          '<ul> cria uma lista com marcadores e <ol> uma lista numerada. Cada item fica dentro de <li>.',
        code: '<ol>\n  <li>Aprender HTML</li>\n  <li>Aprender CSS</li>\n</ol>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual tag cria uma lista numerada?',
        options: ['<ol>', '<ul>', '<li>', '<nl>'],
        monoOptions: true,
        answer: 0,
        explanation: 'ol = ordered list (lista ordenada). ul = unordered list.',
      },
      {
        type: 'arrange',
        prompt: 'Monte a lista com os passos na ordem certa.',
        codeLang: 'html',
        lines: [
          '<ol>',
          '  <li>Abrir o editor</li>',
          '  <li>Escrever o código</li>',
          '  <li>Ver o preview</li>',
          '</ol>',
        ],
        explanation: 'A lista abre com <ol>, os itens <li> seguem a ordem dos passos e </ol> fecha.',
      },
      {
        type: 'learn',
        title: 'Tabelas',
        prompt:
          'Uma <table> é feita de linhas <tr>. Dentro das linhas ficam células de cabeçalho <th> ou células de dados <td>.',
        code: '<table>\n  <tr>\n    <th>Nome</th>\n    <th>Idade</th>\n  </tr>\n  <tr>\n    <td>Ana</td>\n    <td>28</td>\n  </tr>\n</table>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'fill',
        prompt: 'Complete a linha da tabela.',
        template: '<table>\n  {{0}}\n    <td>Ana</td>\n    <td>28</td>\n  {{1}}\n</table>',
        codeLang: 'html',
        blanks: ['<tr>', '</tr>'],
        bank: ['<td>', '<tr>', '</tr>', '<th>', '<row>'],
        explanation: 'tr = table row. Cada linha abre com <tr> e fecha com </tr>.',
      },
      {
        type: 'choice',
        prompt: 'Qual tag representa uma célula de cabeçalho?',
        options: ['<th>', '<td>', '<thead>', '<head>'],
        monoOptions: true,
        answer: 0,
        explanation: 'th = table header. O navegador deixa o texto em negrito e centralizado.',
      },
      {
        type: 'write',
        prompt: 'Crie uma lista não ordenada com dois itens: Café e Chá',
        codeLang: 'html',
        starter: '<ul>\n  \n</ul>',
        checks: [
          { pattern: r`<ul>[\s\S]*<\/ul>`, flags: 'i', hint: 'Envolva os itens com <ul> e </ul>.' },
          { pattern: r`<li>\s*Caf[eé]\s*<\/li>`, flags: 'i', hint: 'Adicione <li>Café</li>.' },
          { pattern: r`<li>\s*Ch[aá]\s*<\/li>`, flags: 'i', hint: 'Adicione <li>Chá</li>.' },
        ],
        solution: '<ul>\n  <li>Café</li>\n  <li>Chá</li>\n</ul>',
        explanation: 'Lista pronta! Combine com CSS para criar menus incríveis.',
      },
    ]
  ),

  lesson(
    {
      id: 'html-5',
      languageId: 'html',
      level: 'intermediario',
      title: 'Formulários',
      description: 'Colete dados com <form>, <input>, <label> e <button>.',
      icon: 'create',
      xp: 25,
    },
    [
      {
        type: 'learn',
        title: 'Formulários interativos',
        prompt:
          '<form> agrupa campos. <input> cria campos de vários tipos (text, email, password...). <label for="id"> liga o rótulo ao campo com o mesmo id.',
        code: '<form>\n  <label for="email">E-mail</label>\n  <input id="email" type="email">\n  <button type="submit">Entrar</button>\n</form>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual type de <input> esconde o que é digitado?',
        options: ['password', 'hidden', 'secret', 'text'],
        monoOptions: true,
        answer: 0,
        explanation: 'type="password" mostra bolinhas no lugar dos caracteres. hidden nem aparece na tela.',
      },
      {
        type: 'fill',
        prompt: 'Ligue o rótulo ao campo e defina o tipo de e-mail.',
        template: '<label {{0}}="email">E-mail</label>\n<input id="email" {{1}}="email">',
        codeLang: 'html',
        blanks: ['for', 'type'],
        bank: ['name', 'for', 'type', 'href', 'id'],
        explanation: 'for conecta o label ao id do input; type="email" valida o formato e mostra o teclado certo.',
      },
      {
        type: 'choice',
        prompt: 'Qual atributo torna um campo obrigatório?',
        options: ['required', 'mandatory', 'validate', 'needed'],
        monoOptions: true,
        answer: 0,
        explanation: 'Com required o navegador impede o envio do formulário enquanto o campo estiver vazio.',
      },
      {
        type: 'arrange',
        prompt: 'Monte o formulário de cadastro.',
        codeLang: 'html',
        lines: [
          '<form>',
          '  <label for="nome">Nome</label>',
          '  <input id="nome" type="text">',
          '  <button type="submit">Enviar</button>',
          '</form>',
        ],
        explanation: 'Rótulo antes do campo, botão de envio no final, tudo dentro de <form>.',
      },
      {
        type: 'write',
        prompt: 'Crie um campo de e-mail obrigatório.',
        codeLang: 'html',
        placeholder: '<input ...>',
        checks: [
          { pattern: r`<input\b`, flags: 'i', hint: 'Use a tag <input>.' },
          { pattern: r`type\s*=\s*["']email["']`, flags: 'i', hint: 'Defina type="email".' },
          { pattern: r`\brequired\b`, flags: 'i', hint: 'Adicione o atributo required.' },
        ],
        solution: '<input type="email" required>',
        explanation: 'Agora o navegador valida o e-mail e exige o preenchimento. Zero JavaScript!',
      },
    ]
  ),

  lesson(
    {
      id: 'html-6',
      languageId: 'html',
      level: 'avancado',
      title: 'HTML semântico',
      description: 'header, nav, main, article e footer: páginas acessíveis e amigáveis ao SEO.',
      icon: 'layers',
      xp: 30,
    },
    [
      {
        type: 'learn',
        title: 'Tags com significado',
        prompt:
          'Tags semânticas descrevem o papel do conteúdo: <header> (topo), <nav> (navegação), <main> (conteúdo principal), <article> (conteúdo independente), <section> (seção temática) e <footer> (rodapé).',
        code: '<header>\n  <nav>...</nav>\n</header>\n<main>\n  <article>...</article>\n</main>\n<footer>...</footer>',
        codeLang: 'html',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual tag deve envolver o conteúdo principal e único da página?',
        options: ['<main>', '<section>', '<body>', '<div>'],
        monoOptions: true,
        answer: 0,
        explanation: 'Deve existir apenas um <main> visível por página, com o conteúdo central.',
      },
      {
        type: 'choice',
        prompt: 'Para um menu de navegação, a escolha mais semântica é:',
        options: ['<nav>', '<div class="menu">', '<links>', '<aside>'],
        monoOptions: true,
        answer: 0,
        explanation: '<nav> avisa navegadores e leitores de tela que ali estão os links de navegação.',
      },
      {
        type: 'arrange',
        prompt: 'Organize o layout clássico de uma página.',
        codeLang: 'html',
        lines: [
          '<header>Logo</header>',
          '<nav>Menu</nav>',
          '<main>Conteúdo</main>',
          '<footer>© 2026</footer>',
        ],
        explanation: 'Topo com header e nav, conteúdo no main e rodapé no footer.',
      },
      {
        type: 'fill',
        prompt: 'Uma notícia é um conteúdo independente. Qual tag usar?',
        template: '<{{0}}>\n  <h2>Notícia do dia</h2>\n  <p>Texto completo...</p>\n</{{1}}>',
        codeLang: 'html',
        blanks: ['article', 'article'],
        bank: ['div', 'article', 'span', 'article', 'post'],
        explanation: '<article> é ideal para posts, notícias e cards que fazem sentido sozinhos.',
      },
      {
        type: 'choice',
        prompt: 'Qual o principal benefício do HTML semântico?',
        options: [
          'Acessibilidade e SEO melhores',
          'A página ganha cores automaticamente',
          'Dispensa o uso de CSS',
          'Funciona sem navegador',
        ],
        answer: 0,
        explanation: 'Buscadores e tecnologias assistivas entendem melhor a estrutura da sua página.',
      },
      {
        type: 'write',
        prompt: 'Crie um rodapé com o texto: Feito com DevDuo',
        codeLang: 'html',
        placeholder: '<footer>...</footer>',
        checks: [
          { pattern: r`<footer>`, flags: 'i', hint: 'Use a tag <footer>.' },
          { pattern: r`<\/footer>`, flags: 'i', hint: 'Feche com </footer>.' },
          {
            pattern: r`<footer>\s*Feito com DevDuo\s*<\/footer>`,
            flags: 'i',
            hint: 'Coloque o texto "Feito com DevDuo" dentro do footer.',
          },
        ],
        solution: '<footer>Feito com DevDuo</footer>',
        explanation: 'Você domina a estrutura semântica. Hora de estilizar com CSS!',
      },
    ]
  ),
];
