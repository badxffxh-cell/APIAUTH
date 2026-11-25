import { lesson, r } from './builder';

export const PY_LESSONS = [
  lesson(
    {
      id: 'py-1',
      languageId: 'python',
      level: 'iniciante',
      title: 'print e variáveis',
      description: 'Seus primeiros passos em Python.',
      icon: 'terminal',
    },
    [
      {
        type: 'learn',
        title: 'Python é direto ao ponto',
        prompt: 'Não precisa declarar tipo nem usar ponto e vírgula. print() mostra valores e f-strings interpolam variáveis.',
        code: 'nome = "Ana"\nidade = 28\nprint(f"{nome} tem {idade} anos")',
        codeLang: 'python',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual função exibe texto na tela?',
        options: ['print()', 'echo()', 'console.log()', 'show()'],
        monoOptions: true,
        answer: 0,
        explanation: 'Em Python usamos print().',
      },
      {
        type: 'fill',
        prompt: 'Use uma f-string para mostrar o nome.',
        template: 'nome = "Leo"\n{{0}}({{1}}"Olá, {nome}!")',
        codeLang: 'python',
        blanks: ['print', 'f'],
        bank: ['echo', 'print', 'f', '$', 's'],
        explanation: 'O prefixo f permite usar {variavel} dentro da string.',
      },
      {
        type: 'write',
        prompt: 'Crie a variável linguagem com o valor "Python" e imprima-a.',
        codeLang: 'python',
        checks: [
          { pattern: r`linguagem\s*=\s*["']Python["']`, hint: 'linguagem = "Python"' },
          { pattern: r`print\(\s*linguagem\s*\)`, hint: 'Depois use print(linguagem)' },
        ],
        solution: 'linguagem = "Python"\nprint(linguagem)',
        explanation: 'Simples assim!',
      },
    ]
  ),
  lesson(
    {
      id: 'py-2',
      languageId: 'python',
      level: 'iniciante',
      title: 'Condicionais',
      description: 'if, elif, else e a importância da indentação.',
      icon: 'git-branch',
    },
    [
      {
        type: 'learn',
        title: 'Indentação é sintaxe',
        prompt: 'Em Python os blocos são definidos por indentação (4 espaços), e a linha do if termina com dois-pontos.',
        code: 'nota = 8\nif nota >= 7:\n    print("Aprovado")\nelif nota >= 5:\n    print("Recuperação")\nelse:\n    print("Reprovado")',
        codeLang: 'python',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'O que é impresso?',
        code: 'x = 3\nif x > 5:\n    print("A")\nelse:\n    print("B")',
        codeLang: 'python',
        options: ['B', 'A', 'AB', 'Nada'],
        answer: 0,
        explanation: '3 não é maior que 5, então o bloco else executa.',
      },
      {
        type: 'arrange',
        prompt: 'Organize o código para verificar a idade.',
        codeLang: 'python',
        lines: ['idade = 20', 'if idade >= 18:', '    print("Maior de idade")', 'else:', '    print("Menor de idade")'],
        explanation: 'Atribuição, depois if com bloco indentado, depois else.',
      },
      {
        type: 'choice',
        prompt: 'Qual palavra-chave significa "senão, se"?',
        options: ['elif', 'elseif', 'else if', 'elsif'],
        monoOptions: true,
        answer: 0,
        explanation: 'Python usa elif.',
      },
    ]
  ),
  lesson(
    {
      id: 'py-3',
      languageId: 'python',
      level: 'intermediario',
      title: 'Listas e loops',
      description: 'for, range e list comprehensions.',
      icon: 'repeat',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Repetindo com for',
        prompt: 'for percorre qualquer sequência. List comprehensions criam listas em uma linha.',
        code: 'frutas = ["maçã", "uva"]\nfor f in frutas:\n    print(f)\n\nquadrados = [n * n for n in range(5)]',
        codeLang: 'python',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Quais números range(3) gera?',
        options: ['0, 1, 2', '1, 2, 3', '0, 1, 2, 3', '3'],
        answer: 0,
        explanation: 'range(n) vai de 0 até n - 1.',
      },
      {
        type: 'fill',
        prompt: 'Complete a list comprehension dos pares.',
        template: 'pares = [n {{0}} n {{1}} range(10) if n % 2 == 0]',
        codeLang: 'python',
        blanks: ['for', 'in'],
        bank: ['each', 'for', 'in', 'of', 'while'],
        explanation: 'A sintaxe é [expressão for item in sequência if condição].',
      },
      {
        type: 'write',
        prompt: 'Escreva um for que imprime cada item da lista nomes.',
        codeLang: 'python',
        starter: 'nomes = ["Ana", "Leo"]\n',
        checks: [
          { pattern: r`for\s+\w+\s+in\s+nomes\s*:`, hint: 'Use for nome in nomes:' },
          { pattern: r`\n\s+print\(\s*\w+\s*\)`, hint: 'Dentro do bloco (indentado), use print(nome).' },
        ],
        solution: 'nomes = ["Ana", "Leo"]\nfor nome in nomes:\n    print(nome)',
        explanation: 'Loop perfeito!',
      },
    ]
  ),
];

export const SWIFT_LESSONS = [
  lesson(
    {
      id: 'sw-1',
      languageId: 'swift',
      level: 'iniciante',
      title: 'let, var e tipos',
      description: 'Constantes, variáveis e inferência de tipo em Swift.',
      icon: 'logo-apple',
    },
    [
      {
        type: 'learn',
        title: 'Seguro por padrão',
        prompt: 'let cria constantes e var cria variáveis. Swift infere o tipo, mas você pode declarar explicitamente.',
        code: 'let nome = "Ana"\nvar pontos: Int = 10\npontos += 5\nprint("\\(nome): \\(pontos)")',
        codeLang: 'swift',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Como declarar uma constante em Swift?',
        options: ['let', 'const', 'val', 'final'],
        monoOptions: true,
        answer: 0,
        explanation: 'Em Swift, let declara constantes.',
      },
      {
        type: 'choice',
        prompt: 'Como interpolar uma variável em uma String Swift?',
        options: ['"\\(nome)"', '"${nome}"', '"{nome}"', '"#nome"'],
        monoOptions: true,
        answer: 0,
        explanation: 'Swift usa \\(variavel) dentro da string.',
      },
      {
        type: 'fill',
        prompt: 'Declare uma variável inteira.',
        template: '{{0}} vidas: {{1}} = 5',
        codeLang: 'swift',
        blanks: ['var', 'Int'],
        bank: ['let', 'var', 'Int', 'int', 'Number'],
        explanation: 'var pois o valor vai mudar, e Int (com I maiúsculo) é o tipo inteiro.',
      },
    ]
  ),
  lesson(
    {
      id: 'sw-2',
      languageId: 'swift',
      level: 'intermediario',
      title: 'SwiftUI básico',
      description: 'Views declarativas, VStack e @State.',
      icon: 'phone-portrait',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Interfaces declarativas',
        prompt: 'Em SwiftUI você descreve a interface. @State guarda estado e a view se atualiza sozinha quando ele muda.',
        code: 'struct Contador: View {\n  @State var total = 0\n  var body: some View {\n    VStack {\n      Text("\\(total)")\n      Button("+1") { total += 1 }\n    }\n  }\n}',
        codeLang: 'swift',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual container empilha views verticalmente?',
        options: ['VStack', 'HStack', 'ZStack', 'Column'],
        monoOptions: true,
        answer: 0,
        explanation: 'V = vertical. HStack é horizontal e ZStack sobrepõe.',
      },
      {
        type: 'choice',
        prompt: 'Para que serve @State?',
        options: [
          'Guardar estado que atualiza a view',
          'Declarar uma constante global',
          'Importar bibliotecas',
          'Criar uma tela nova',
        ],
        answer: 0,
        explanation: 'Quando um @State muda, o SwiftUI recalcula o body.',
      },
      {
        type: 'arrange',
        prompt: 'Monte a view com um texto.',
        codeLang: 'swift',
        lines: ['struct Ola: View {', '  var body: some View {', '    Text("Olá!")', '  }', '}'],
        explanation: 'Toda View tem uma propriedade body que retorna some View.',
      },
    ]
  ),
];

export const KOTLIN_LESSONS = [
  lesson(
    {
      id: 'kt-1',
      languageId: 'kotlin',
      level: 'iniciante',
      title: 'val, var e funções',
      description: 'O essencial de Kotlin em poucos minutos.',
      icon: 'logo-android',
    },
    [
      {
        type: 'learn',
        title: 'Conciso e expressivo',
        prompt: 'val é imutável, var é mutável. Funções usam fun e podem ter corpo de expressão.',
        code: 'val nome = "Ana"\nvar nivel = 1\nfun dobro(n: Int) = n * 2\nprintln("$nome: ${dobro(nivel)}")',
        codeLang: 'kotlin',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual palavra declara uma referência imutável?',
        options: ['val', 'var', 'let', 'const'],
        monoOptions: true,
        answer: 0,
        explanation: 'Em Kotlin, val não pode ser reatribuído.',
      },
      {
        type: 'fill',
        prompt: 'Declare a função soma.',
        template: '{{0}} soma(a: Int, b: Int): {{1}} {\n  return a + b\n}',
        codeLang: 'kotlin',
        blanks: ['fun', 'Int'],
        bank: ['function', 'fun', 'Int', 'Integer', 'def'],
        explanation: 'Funções começam com fun e o tipo de retorno vem após os dois-pontos.',
      },
      {
        type: 'write',
        prompt: 'Crie uma função triplo(n: Int) que retorna n * 3 (corpo de expressão).',
        codeLang: 'kotlin',
        placeholder: 'fun triplo...',
        checks: [
          { pattern: r`fun\s+triplo\s*\(\s*n\s*:\s*Int\s*\)`, hint: 'Comece com fun triplo(n: Int)' },
          { pattern: r`n\s*\*\s*3|3\s*\*\s*n`, hint: 'Retorne n * 3' },
        ],
        solution: 'fun triplo(n: Int) = n * 3',
        explanation: 'Corpo de expressão deixa tudo em uma linha.',
      },
    ]
  ),
  lesson(
    {
      id: 'kt-2',
      languageId: 'kotlin',
      level: 'intermediario',
      title: 'Null safety',
      description: 'Tipos anuláveis, ?. e o operador Elvis.',
      icon: 'shield',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Adeus, NullPointerException',
        prompt: 'Tipos com ? podem ser nulos. ?. chama com segurança e ?: (Elvis) fornece um valor padrão.',
        code: 'val nome: String? = null\nval tamanho = nome?.length ?: 0',
        codeLang: 'kotlin',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'Qual é o valor de tamanho?',
        code: 'val nome: String? = null\nval tamanho = nome?.length ?: 0',
        codeLang: 'kotlin',
        options: ['0', 'null', 'Erro', '4'],
        answer: 0,
        explanation: 'nome?.length é null, então o Elvis devolve 0.',
      },
      {
        type: 'choice',
        prompt: 'Como declarar uma String que pode ser nula?',
        options: ['String?', 'String!', 'Nullable<String>', '?String'],
        monoOptions: true,
        answer: 0,
        explanation: 'Basta adicionar ? ao tipo.',
      },
      {
        type: 'fill',
        prompt: 'Use chamada segura e Elvis.',
        template: 'val cidade = usuario{{0}}endereco{{1}} "Desconhecida"',
        codeLang: 'kotlin',
        blanks: ['?.', '?:'],
        bank: ['.', '?.', '?:', '!!', '::'],
        explanation: '?. evita a exceção e ?: define o valor padrão.',
      },
    ]
  ),
];

export const SQL_LESSONS = [
  lesson(
    {
      id: 'sql-1',
      languageId: 'sql',
      level: 'iniciante',
      title: 'SELECT',
      description: 'Buscando dados em uma tabela.',
      icon: 'server',
    },
    [
      {
        type: 'learn',
        title: 'Perguntando ao banco',
        prompt: 'SELECT escolhe as colunas e FROM indica a tabela. * significa "todas as colunas".',
        code: 'SELECT nome, email\nFROM usuarios;\n\nSELECT * FROM produtos;',
        codeLang: 'sql',
        explanation: '',
      },
      {
        type: 'choice',
        prompt: 'O que SELECT * FROM clientes retorna?',
        options: ['Todas as colunas de clientes', 'Apenas a primeira coluna', 'O número de clientes', 'Nada'],
        answer: 0,
        explanation: '* seleciona todas as colunas de todas as linhas.',
      },
      {
        type: 'fill',
        prompt: 'Busque os nomes da tabela alunos.',
        template: '{{0}} nome {{1}} alunos;',
        codeLang: 'sql',
        blanks: ['SELECT', 'FROM'],
        bank: ['GET', 'SELECT', 'FROM', 'IN', 'TABLE'],
        explanation: 'SELECT coluna FROM tabela;',
      },
      {
        type: 'write',
        prompt: 'Selecione todas as colunas da tabela pedidos.',
        codeLang: 'sql',
        checks: [
          { pattern: r`select\s+\*\s+from\s+pedidos\s*;?`, flags: 'i', hint: 'SELECT * FROM pedidos;' },
        ],
        solution: 'SELECT * FROM pedidos;',
        explanation: 'Consulta executada!',
      },
    ]
  ),
  lesson(
    {
      id: 'sql-2',
      languageId: 'sql',
      level: 'intermediario',
      title: 'WHERE e ORDER BY',
      description: 'Filtrando e ordenando resultados.',
      icon: 'funnel',
      xp: 20,
    },
    [
      {
        type: 'learn',
        title: 'Filtros e ordenação',
        prompt: 'WHERE filtra linhas por condição. ORDER BY ordena (ASC crescente, DESC decrescente). LIMIT restringe a quantidade.',
        code: 'SELECT nome, preco\nFROM produtos\nWHERE preco > 50\nORDER BY preco DESC\nLIMIT 5;',
        codeLang: 'sql',
        explanation: '',
      },
      {
        type: 'arrange',
        prompt: 'Ordene as cláusulas da consulta.',
        codeLang: 'sql',
        lines: ['SELECT nome', 'FROM alunos', 'WHERE nota >= 7', 'ORDER BY nota DESC;'],
        explanation: 'A ordem é sempre SELECT → FROM → WHERE → ORDER BY.',
      },
      {
        type: 'choice',
        prompt: 'Como ordenar do maior para o menor?',
        options: ['ORDER BY coluna DESC', 'ORDER BY coluna ASC', 'SORT coluna DOWN', 'ORDER coluna REVERSE'],
        monoOptions: true,
        answer: 0,
        explanation: 'DESC = descending (decrescente).',
      },
      {
        type: 'write',
        prompt: 'Selecione os produtos com estoque igual a 0.',
        codeLang: 'sql',
        checks: [
          { pattern: r`select\s+[\s\S]+\s+from\s+produtos`, flags: 'i', hint: 'Comece com SELECT * FROM produtos' },
          { pattern: r`where\s+estoque\s*=\s*0`, flags: 'i', hint: 'Adicione WHERE estoque = 0' },
        ],
        solution: 'SELECT * FROM produtos WHERE estoque = 0;',
        explanation: 'Agora você sabe o que precisa repor!',
      },
    ]
  ),
];
