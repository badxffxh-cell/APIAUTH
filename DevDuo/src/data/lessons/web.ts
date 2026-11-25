import { lesson, r } from './builder';

export const CSS_LESSONS = [
  lesson(
    {
      id: 'css-1',
      languageId: 'css',
      level: 'iniciante',
      title: 'Seletores e cores',
      description: 'Como o CSS encontra elementos e aplica estilos.',
      icon: 'color-palette',
    },
    [
      {
        type: 'learn',
        title: 'Anatomia de uma regra CSS',
        prompt:
          'Uma regra tem um seletor e um bloco de declarações. Cada declaração é propriedade: valor; — e fica entre chaves.',
        code: 'h1 {\n  color: #6C63FF;\n  font-size: 32px;\n}\n\n.card { background: #111; }\n#logo { width: 48px; }',
        codeLang: 'css',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual propriedade muda a cor do texto?',
        options: ['color', 'font-color', 'text-color', 'background'],
        monoOptions: true,
        answer: 0,
        explanation: 'É simplesmente color. background muda a cor de fundo.',
      },
      {
        type: 'choice',
        prompt: 'Qual seletor encontra elementos com class="card"?',
        options: ['.card', '#card', 'card', '*card'],
        monoOptions: true,
        answer: 0,
        explanation: 'Ponto (.) seleciona classes; cerquilha (#) seleciona ids.',
      },
      {
        type: 'fill',
        prompt: 'Complete a regra que pinta o título de roxo.',
        template: '.titulo {{0}}\n  {{1}}: #6C63FF;\n}',
        codeLang: 'css',
        blanks: ['{', 'color'],
        bank: ['(', '{', 'colour', 'color', 'fill'],
        explanation: 'Regras abrem com { e a propriedade de cor do texto é color.',
      },
      {
        type: 'write',
        prompt: 'Faça todos os parágrafos (p) terem a cor white.',
        codeLang: 'css',
        placeholder: 'p { ... }',
        checks: [
          { pattern: r`(^|\s|\})p\s*\{`, flags: 'i', hint: 'O seletor é apenas p, seguido de {.' },
          {
            pattern: r`color\s*:\s*(white|#fff(fff)?)\s*;?`,
            flags: 'i',
            hint: 'Use color: white;',
          },
          { pattern: r`\}`, hint: 'Feche a regra com }.' },
        ],
        solution: 'p {\n  color: white;\n}',
        explanation: 'Agora todo <p> da página fica branco.',
      },
    ]
  ),
  lesson(
    {
      id: 'css-2',
      languageId: 'css',
      level: 'iniciante',
      title: 'Box model',
      description: 'margin, border, padding e o segredo do border-box.',
      icon: 'cube',
    },
    [
      {
        type: 'learn',
        title: 'Todo elemento é uma caixa',
        prompt:
          'De dentro para fora: conteúdo → padding (espaço interno) → border (borda) → margin (espaço externo).',
        code: '.card {\n  padding: 16px;\n  border: 1px solid #333;\n  margin: 24px;\n  border-radius: 12px;\n}',
        codeLang: 'css',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual propriedade cria espaço INTERNO entre o conteúdo e a borda?',
        options: ['padding', 'margin', 'gap', 'spacing'],
        monoOptions: true,
        answer: 0,
        explanation: 'padding é interno; margin é o espaço do lado de fora da borda.',
      },
      {
        type: 'fill',
        prompt: 'Adicione espaço interno e cantos arredondados.',
        template: '.card {\n  {{0}}: 16px;\n  border-{{1}}: 12px;\n}',
        codeLang: 'css',
        blanks: ['padding', 'radius'],
        bank: ['margin', 'padding', 'round', 'radius', 'space'],
        explanation: 'padding para o espaço interno e border-radius para arredondar os cantos.',
      },
      {
        type: 'choice',
        prompt: 'O que box-sizing: border-box faz?',
        options: [
          'Inclui padding e borda na largura definida',
          'Remove todas as bordas',
          'Centraliza a caixa',
          'Cria uma sombra',
        ],
        answer: 0,
        explanation: 'Com border-box, width: 200px significa 200px no total, já contando padding e borda.',
      },
      {
        type: 'write',
        prompt: 'Crie a regra .box com margin 0 e padding 20px.',
        codeLang: 'css',
        placeholder: '.box { ... }',
        checks: [
          { pattern: r`\.box\s*\{`, hint: 'Comece com .box {' },
          { pattern: r`margin\s*:\s*0(px)?\s*;?`, flags: 'i', hint: 'Adicione margin: 0;' },
          { pattern: r`padding\s*:\s*20px\s*;?`, flags: 'i', hint: 'Adicione padding: 20px;' },
        ],
        solution: '.box {\n  margin: 0;\n  padding: 20px;\n}',
        explanation: 'Caixa configurada! Esse combo aparece em quase todo projeto.',
      },
    ]
  ),
  lesson(
    {
      id: 'css-3',
      languageId: 'css',
      level: 'intermediario',
      title: 'Flexbox',
      description: 'Alinhe e distribua elementos com display: flex.',
      icon: 'grid',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Flexbox em 10 segundos',
        prompt:
          'display: flex transforma os filhos em itens flexíveis. justify-content alinha no eixo principal e align-items no eixo cruzado.',
        code: '.centro {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 12px;\n}',
        codeLang: 'css',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual propriedade empilha os itens em coluna?',
        options: ['flex-direction: column', 'flex-wrap: column', 'align-items: column', 'display: column'],
        monoOptions: true,
        answer: 0,
        explanation: 'flex-direction define o eixo principal: row (padrão) ou column.',
      },
      {
        type: 'fill',
        prompt: 'Centralize horizontal e verticalmente.',
        template: '.hero {\n  display: {{0}};\n  justify-content: center;\n  {{1}}: center;\n}',
        codeLang: 'css',
        blanks: ['flex', 'align-items'],
        bank: ['block', 'flex', 'align-items', 'text-align', 'vertical-align'],
        explanation: 'Com display: flex, justify-content + align-items centralizam nos dois eixos.',
      },
      {
        type: 'choice',
        prompt: 'O que justify-content: space-between faz?',
        options: [
          'Espalha os itens com espaço igual entre eles',
          'Junta tudo no centro',
          'Adiciona margem em todos os itens',
          'Inverte a ordem dos itens',
        ],
        answer: 0,
        explanation: 'O primeiro item vai para o início, o último para o fim, e o espaço restante é dividido.',
      },
      {
        type: 'write',
        prompt: 'Faça .menu ser flex com gap de 8px.',
        codeLang: 'css',
        placeholder: '.menu { ... }',
        checks: [
          { pattern: r`\.menu\s*\{`, hint: 'Comece com .menu {' },
          { pattern: r`display\s*:\s*flex`, flags: 'i', hint: 'Use display: flex;' },
          { pattern: r`gap\s*:\s*8px`, flags: 'i', hint: 'Use gap: 8px;' },
        ],
        solution: '.menu {\n  display: flex;\n  gap: 8px;\n}',
        explanation: 'gap é a forma moderna de espaçar itens flex e grid.',
      },
    ]
  ),
];

export const JS_LESSONS = [
  lesson(
    {
      id: 'js-1',
      languageId: 'javascript',
      level: 'iniciante',
      title: 'Variáveis',
      description: 'let, const e o famoso console.log.',
      icon: 'cube-outline',
    },
    [
      {
        type: 'learn',
        title: 'Guardando valores',
        prompt:
          'Use const para valores que não serão reatribuídos e let para os que mudam. console.log mostra valores no console.',
        code: 'const nome = "Ana";\nlet pontos = 10;\npontos = pontos + 5;\nconsole.log(nome, pontos); // Ana 15',
        codeLang: 'javascript',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual palavra declara um valor que não pode ser reatribuído?',
        options: ['const', 'let', 'var', 'fixed'],
        monoOptions: true,
        answer: 0,
        explanation: 'const impede a reatribuição. Prefira const sempre que possível.',
      },
      {
        type: 'choice',
        prompt: 'O que é exibido no console?',
        code: 'let x = 2;\nx = x + 3;\nconsole.log(x);',
        codeLang: 'javascript',
        options: ['5', '2', '23', 'undefined'],
        answer: 0,
        explanation: 'x começa em 2 e recebe 2 + 3 = 5.',
      },
      {
        type: 'fill',
        prompt: 'Declare uma constante e mostre no console.',
        template: '{{0}} nome = "Ana";\nconsole.{{1}}(nome);',
        codeLang: 'javascript',
        blanks: ['const', 'log'],
        bank: ['print', 'const', 'log', 'echo', 'constant'],
        explanation: 'const declara a constante e console.log imprime o valor.',
      },
      {
        type: 'write',
        prompt: 'Declare uma constante idade com o valor 18.',
        codeLang: 'javascript',
        placeholder: 'const ...',
        checks: [
          { pattern: r`\bconst\b`, hint: 'Use a palavra const.' },
          { pattern: r`const\s+idade\s*=\s*18\s*;?`, hint: 'O formato é: const idade = 18;' },
        ],
        solution: 'const idade = 18;',
        explanation: 'Constante criada!',
      },
    ]
  ),
  lesson(
    {
      id: 'js-2',
      languageId: 'javascript',
      level: 'iniciante',
      title: 'Funções',
      description: 'Blocos reutilizáveis de código e arrow functions.',
      icon: 'flash',
    },
    [
      {
        type: 'learn',
        title: 'Funções recebem e devolvem valores',
        prompt: 'Uma função recebe parâmetros e usa return para devolver um resultado. Arrow functions são uma sintaxe curta.',
        code: 'function soma(a, b) {\n  return a + b;\n}\n\nconst dobro = (n) => n * 2;\nconsole.log(soma(2, 3), dobro(4)); // 5 8',
        codeLang: 'javascript',
        explanation: '',
      },
      {
        type: 'fill',
        prompt: 'Faça a função devolver o resultado.',
        template: 'function soma(a, b) {\n  {{0}} a + b;\n}',
        codeLang: 'javascript',
        blanks: ['return'],
        bank: ['print', 'return', 'yield', 'give'],
        explanation: 'return devolve o valor para quem chamou a função.',
      },
      {
        type: 'arrange',
        prompt: 'Monte a arrow function e use-a.',
        codeLang: 'javascript',
        lines: ['const dobro = (n) => {', '  return n * 2;', '};', 'console.log(dobro(4));'],
        explanation: 'Primeiro declaramos a função, depois a chamamos.',
      },
      {
        type: 'choice',
        prompt: 'Qual o resultado de quadrado(3)?',
        code: 'const quadrado = (n) => n * n;',
        codeLang: 'javascript',
        options: ['9', '6', '33', 'NaN'],
        answer: 0,
        explanation: '3 * 3 = 9. Arrow functions de uma linha retornam o valor automaticamente.',
      },
      {
        type: 'write',
        prompt: 'Crie uma arrow function quadrado que retorna n * n.',
        codeLang: 'javascript',
        placeholder: 'const quadrado = ...',
        checks: [
          { pattern: r`const\s+quadrado\s*=`, hint: 'Comece com const quadrado =' },
          { pattern: r`\(?\s*n\s*\)?\s*=>`, hint: 'Use a seta: (n) =>' },
          { pattern: r`n\s*\*\s*n|n\s*\*\*\s*2|Math\.pow\(\s*n\s*,\s*2\s*\)`, hint: 'O retorno é n * n.' },
        ],
        solution: 'const quadrado = (n) => n * n;',
        explanation: 'Arrow function dominada!',
      },
    ]
  ),
  lesson(
    {
      id: 'js-3',
      languageId: 'javascript',
      level: 'intermediario',
      title: 'Arrays e DOM',
      description: 'map, filter e eventos de clique na página.',
      icon: 'hand-left',
      xp: 20,
    },
    [
      {
        type: 'choice',
        prompt: 'Qual o resultado?',
        code: '[1, 2, 3].map((n) => n * 2);',
        codeLang: 'javascript',
        options: ['[2, 4, 6]', '[1, 2, 3, 2]', '12', '[3, 4, 5]'],
        monoOptions: true,
        answer: 0,
        explanation: 'map cria um novo array aplicando a função a cada item.',
      },
      {
        type: 'choice',
        prompt: 'Qual método mantém apenas os itens que passam em um teste?',
        options: ['filter', 'map', 'forEach', 'reduce'],
        monoOptions: true,
        answer: 0,
        explanation: 'filter devolve um array com os itens para os quais a função retorna true.',
      },
      {
        type: 'fill',
        prompt: 'Selecione o botão e reaja ao clique.',
        template: "document.{{0}}('#btn')\n  .addEventListener('{{1}}', () => {\n    alert('Oi!');\n  });",
        codeLang: 'javascript',
        blanks: ['querySelector', 'click'],
        bank: ['getElement', 'querySelector', 'press', 'click', 'tap'],
        explanation: 'querySelector usa seletores CSS; "click" é o evento de toque/clique.',
      },
      {
        type: 'write',
        prompt: 'Use filter para criar grandes com os números de nums maiores que 10.',
        codeLang: 'javascript',
        starter: 'const nums = [4, 12, 8, 30];\n',
        checks: [
          { pattern: r`const\s+grandes\s*=`, hint: 'Guarde o resultado em const grandes =' },
          { pattern: r`nums\.filter\(`, hint: 'Chame nums.filter(...)' },
          { pattern: r`>\s*10`, hint: 'A condição é n > 10.' },
        ],
        solution: 'const nums = [4, 12, 8, 30];\nconst grandes = nums.filter((n) => n > 10);',
        explanation: 'grandes agora vale [12, 30].',
      },
    ]
  ),
];

export const TS_LESSONS = [
  lesson(
    {
      id: 'ts-1',
      languageId: 'typescript',
      level: 'iniciante',
      title: 'Tipos básicos',
      description: 'string, number, boolean e anotações de tipo.',
      icon: 'shield-checkmark',
    },
    [
      {
        type: 'learn',
        title: 'Anotações de tipo',
        prompt: 'Em TypeScript você declara o tipo depois de dois-pontos. O compilador avisa quando algo não bate.',
        code: 'let nome: string = "Ana";\nlet idade: number = 28;\nlet ativo: boolean = true;',
        codeLang: 'typescript',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual tipo representa true ou false?',
        options: ['boolean', 'bool', 'bit', 'truthy'],
        monoOptions: true,
        answer: 0,
        explanation: 'Em TypeScript o tipo é boolean.',
      },
      {
        type: 'fill',
        prompt: 'Tipe a função corretamente.',
        template: 'function saudar(nome: {{0}}): {{1}} {\n  return "Olá, " + nome;\n}',
        codeLang: 'typescript',
        blanks: ['string', 'string'],
        bank: ['number', 'string', 'void', 'string', 'text'],
        explanation: 'Recebe string e devolve string.',
      },
      {
        type: 'choice',
        prompt: 'O que acontece aqui?',
        code: 'let total: number = 10;\ntotal = "dez";',
        codeLang: 'typescript',
        options: ['Erro de tipo na compilação', 'total vira "dez"', 'total vira 10', 'Nada acontece'],
        answer: 0,
        explanation: 'Não é possível atribuir string a uma variável number.',
      },
    ]
  ),
  lesson(
    {
      id: 'ts-2',
      languageId: 'typescript',
      level: 'intermediario',
      title: 'Interfaces',
      description: 'Descreva o formato dos seus objetos.',
      icon: 'construct',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Contratos para objetos',
        prompt: 'Uma interface descreve quais propriedades um objeto tem. O ? marca propriedades opcionais.',
        code: 'interface Usuario {\n  nome: string;\n  idade: number;\n  bio?: string;\n}',
        codeLang: 'typescript',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'O que significa o ? em bio?: string',
        options: ['A propriedade é opcional', 'A propriedade é privada', 'O tipo é desconhecido', 'É um erro de sintaxe'],
        answer: 0,
        explanation: 'bio pode existir ou não no objeto.',
      },
      {
        type: 'arrange',
        prompt: 'Monte a interface Produto.',
        codeLang: 'typescript',
        lines: ['interface Produto {', '  nome: string;', '  preco: number;', '}'],
        explanation: 'Chaves envolvem as propriedades, cada uma com seu tipo.',
      },
      {
        type: 'write',
        prompt: 'Crie uma interface Ponto com x e y do tipo number.',
        codeLang: 'typescript',
        placeholder: 'interface Ponto { ... }',
        checks: [
          { pattern: r`interface\s+Ponto\s*\{`, hint: 'Comece com interface Ponto {' },
          { pattern: r`x\s*:\s*number`, hint: 'Adicione x: number;' },
          { pattern: r`y\s*:\s*number`, hint: 'Adicione y: number;' },
        ],
        solution: 'interface Ponto {\n  x: number;\n  y: number;\n}',
        explanation: 'Interface pronta para coordenadas!',
      },
    ]
  ),
];
