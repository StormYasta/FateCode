type Difficulty = 'KYU_8' | 'KYU_7' | 'KYU_6' | 'KYU_5' | 'KYU_4' | 'KYU_3' | 'KYU_2' | 'KYU_1';

type TestCase = {
  input: any;
  expected: any;
  description: string;
};

type Template = {
  key: string;
  title: string;
  functionName: string;
  description: string;
  difficulty: Difficulty;
  xp: number;
  tags: string[];
  makeTests: (variant: number) => { publicTests: TestCase[]; hiddenTests: TestCase[] };
};

const vowels = (text: string) => (text.match(/[aeiouáéíóúãõâêô]/gi) || []).length;
const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);
const fibonacci = (n: number): number => {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};
const gcd = (a: number, b: number): number => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const rotateLeft = (values: any[], steps: number) => {
  if (!values.length) return [];
  const k = ((steps % values.length) + values.length) % values.length;
  return [...values.slice(k), ...values.slice(0, k)];
};
const mostFrequentChar = (text: string) => {
  const counts = new Map<string, number>();
  let best = '';
  let bestCount = 0;
  for (const char of text) {
    const count = (counts.get(char) || 0) + 1;
    counts.set(char, count);
    if (count > bestCount) {
      best = char;
      bestCount = count;
    }
  }
  return best;
};

const templates: Template[] = [
  {
    key: 'sum', title: 'Somar dois números', functionName: 'somar', difficulty: 'KYU_8', xp: 50,
    description: 'Implemente `somar(a, b)` e retorne a soma dos dois números recebidos.', tags: ['Fundamentos', 'Matemática'],
    makeTests: (v) => ({
      publicTests: [
        { input: [v, v + 2], expected: 2 * v + 2, description: 'Soma de positivos' },
        { input: [-v, v], expected: 0, description: 'Valores opostos' },
        { input: [0, v * 3], expected: v * 3, description: 'Soma com zero' },
      ],
      hiddenTests: [
        { input: [v * 10, -v * 2], expected: v * 8, description: 'Valores maiores' },
        { input: [-v * 4, -v * 3], expected: -v * 7, description: 'Dois negativos' },
      ],
    }),
  },
  {
    key: 'subtract', title: 'Subtrair valores', functionName: 'subtrair', difficulty: 'KYU_8', xp: 50,
    description: 'Implemente `subtrair(a, b)` e retorne `a - b`.', tags: ['Fundamentos', 'Matemática'],
    makeTests: (v) => ({
      publicTests: [
        { input: [v + 10, v], expected: 10, description: 'Subtração básica' },
        { input: [v, v + 5], expected: -5, description: 'Resultado negativo' },
        { input: [v, 0], expected: v, description: 'Subtração por zero' },
      ],
      hiddenTests: [
        { input: [-v, v], expected: -2 * v, description: 'Negativo menos positivo' },
        { input: [100 + v, 50 + v], expected: 50, description: 'Valores maiores' },
      ],
    }),
  },
  {
    key: 'multiply', title: 'Multiplicar valores', functionName: 'multiplicar', difficulty: 'KYU_8', xp: 50,
    description: 'Implemente `multiplicar(a, b)` e retorne o produto dos dois números.', tags: ['Fundamentos', 'Matemática'],
    makeTests: (v) => ({
      publicTests: [
        { input: [v, 3], expected: v * 3, description: 'Produto positivo' },
        { input: [v, 0], expected: 0, description: 'Produto por zero' },
        { input: [-v, 2], expected: -v * 2, description: 'Produto negativo' },
      ],
      hiddenTests: [
        { input: [-v, -4], expected: v * 4, description: 'Dois negativos' },
        { input: [v + 10, 5], expected: (v + 10) * 5, description: 'Valores maiores' },
      ],
    }),
  },
  {
    key: 'even', title: 'Número par', functionName: 'ehPar', difficulty: 'KYU_7', xp: 75,
    description: 'Implemente `ehPar(n)` e retorne `true` quando o número for par e `false` caso contrário.', tags: ['Fundamentos', 'Lógica'],
    makeTests: (v) => ({
      publicTests: [
        { input: v * 2, expected: true, description: 'Número par' },
        { input: v * 2 + 1, expected: false, description: 'Número ímpar' },
        { input: 0, expected: true, description: 'Zero é par' },
      ],
      hiddenTests: [
        { input: -v * 2, expected: true, description: 'Par negativo' },
        { input: -(v * 2 + 1), expected: false, description: 'Ímpar negativo' },
      ],
    }),
  },
  {
    key: 'reverse', title: 'Inverter texto', functionName: 'inverterTexto', difficulty: 'KYU_7', xp: 75,
    description: 'Implemente `inverterTexto(texto)` retornando os caracteres na ordem inversa.', tags: ['Strings', 'Fundamentos'],
    makeTests: (v) => ({
      publicTests: [
        { input: `fate${v}`, expected: `${v}etaf`, description: 'Texto alfanumérico' },
        { input: 'abc', expected: 'cba', description: 'Texto curto' },
        { input: '', expected: '', description: 'Texto vazio' },
      ],
      hiddenTests: [
        { input: 'radar', expected: 'radar', description: 'Palíndromo' },
        { input: `A ${v} B`, expected: `B ${v} A`, description: 'Mantém espaços' },
      ],
    }),
  },
  {
    key: 'vowels', title: 'Contar vogais', functionName: 'contarVogais', difficulty: 'KYU_7', xp: 75,
    description: 'Implemente `contarVogais(texto)` e retorne a quantidade de vogais, ignorando maiúsculas e minúsculas.', tags: ['Strings', 'Contagem'],
    makeTests: (v) => ({
      publicTests: [
        { input: 'FateCode', expected: vowels('FateCode'), description: 'Palavra mista' },
        { input: `aluno${v}`, expected: vowels(`aluno${v}`), description: 'Texto alfanumérico' },
        { input: 'xyz', expected: 0, description: 'Sem vogais' },
      ],
      hiddenTests: [
        { input: 'AEIOU', expected: 5, description: 'Maiúsculas' },
        { input: 'programacao', expected: vowels('programacao'), description: 'Palavra maior' },
      ],
    }),
  },
  {
    key: 'max', title: 'Maior valor da lista', functionName: 'maiorValor', difficulty: 'KYU_6', xp: 100,
    description: 'Implemente `maiorValor(numeros)` e retorne o maior número do array.', tags: ['Arrays', 'Fundamentos'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[v, v + 3, v - 2]], expected: v + 3, description: 'Valores positivos' },
        { input: [[-v, -v - 2, -1]], expected: -1, description: 'Valores negativos' },
        { input: [[v]], expected: v, description: 'Um elemento' },
      ],
      hiddenTests: [
        { input: [[0, v * 10, 5, -100]], expected: v * 10, description: 'Lista mista' },
        { input: [[v, v, v]], expected: v, description: 'Valores repetidos' },
      ],
    }),
  },
  {
    key: 'array-sum', title: 'Somar elementos do array', functionName: 'somarArray', difficulty: 'KYU_6', xp: 100,
    description: 'Implemente `somarArray(numeros)` e retorne a soma de todos os elementos.', tags: ['Arrays', 'Redução'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[v, v + 1, v + 2]], expected: 3 * v + 3, description: 'Três elementos' },
        { input: [[]], expected: 0, description: 'Array vazio' },
        { input: [[-v, v]], expected: 0, description: 'Valores opostos' },
      ],
      hiddenTests: [
        { input: [[1, 2, 3, 4, v]], expected: 10 + v, description: 'Cinco elementos' },
        { input: [[-1, -2, -3, -v]], expected: -6 - v, description: 'Negativos' },
      ],
    }),
  },
  {
    key: 'factorial', title: 'Fatorial', functionName: 'fatorial', difficulty: 'KYU_6', xp: 100,
    description: 'Implemente `fatorial(n)` para inteiros não negativos. Considere `0! = 1`.', tags: ['Matemática', 'Recursão'],
    makeTests: (v) => {
      const n = Math.min(6, v + 1);
      return {
        publicTests: [
          { input: 0, expected: 1, description: 'Fatorial de zero' },
          { input: n, expected: factorial(n), description: `Fatorial de ${n}` },
          { input: 3, expected: 6, description: 'Fatorial de três' },
        ],
        hiddenTests: [
          { input: 5, expected: 120, description: 'Fatorial de cinco' },
          { input: 7, expected: 5040, description: 'Fatorial de sete' },
        ],
      };
    },
  },
  {
    key: 'fibonacci', title: 'Fibonacci', functionName: 'fibonacci', difficulty: 'KYU_5', xp: 150,
    description: 'Implemente `fibonacci(n)` considerando F(0)=0 e F(1)=1.', tags: ['Matemática', 'Algoritmos'],
    makeTests: (v) => ({
      publicTests: [
        { input: 0, expected: 0, description: 'Caso base zero' },
        { input: 1, expected: 1, description: 'Caso base um' },
        { input: v + 4, expected: fibonacci(v + 4), description: 'Termo intermediário' },
      ],
      hiddenTests: [
        { input: 10, expected: 55, description: 'Décimo termo' },
        { input: 15, expected: 610, description: 'Décimo quinto termo' },
      ],
    }),
  },
  {
    key: 'palindrome', title: 'Detectar palíndromo', functionName: 'ehPalindromo', difficulty: 'KYU_5', xp: 150,
    description: 'Implemente `ehPalindromo(texto)` verificando se o texto é igual ao seu inverso. A comparação é literal.', tags: ['Strings', 'Lógica'],
    makeTests: (v) => ({
      publicTests: [
        { input: 'radar', expected: true, description: 'Palíndromo clássico' },
        { input: `fate${v}`, expected: false, description: 'Não palíndromo' },
        { input: '', expected: true, description: 'Texto vazio' },
      ],
      hiddenTests: [
        { input: 'abba', expected: true, description: 'Tamanho par' },
        { input: 'abcba', expected: true, description: 'Tamanho ímpar' },
      ],
    }),
  },
  {
    key: 'unique', title: 'Remover duplicados', functionName: 'valoresUnicos', difficulty: 'KYU_5', xp: 150,
    description: 'Implemente `valoresUnicos(valores)` removendo duplicados e preservando a primeira ocorrência.', tags: ['Arrays', 'Sets'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[1, 1, 2, 3, 3, v]], expected: [...new Set([1, 1, 2, 3, 3, v])], description: 'Duplicados numéricos' },
        { input: [[]], expected: [], description: 'Array vazio' },
        { input: [['a', 'b', 'a']], expected: ['a', 'b'], description: 'Strings' },
      ],
      hiddenTests: [
        { input: [[v, v, v]], expected: [v], description: 'Todos iguais' },
        { input: [[1, 2, 3]], expected: [1, 2, 3], description: 'Já único' },
      ],
    }),
  },
  {
    key: 'sort', title: 'Ordenação crescente', functionName: 'ordenarCrescente', difficulty: 'KYU_4', xp: 250,
    description: 'Implemente `ordenarCrescente(numeros)` e devolva uma nova lista em ordem numérica crescente.', tags: ['Arrays', 'Ordenação'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[v + 3, v, v + 1]], expected: [v, v + 1, v + 3], description: 'Três números' },
        { input: [[3, 2, 1]], expected: [1, 2, 3], description: 'Ordem inversa' },
        { input: [[]], expected: [], description: 'Array vazio' },
      ],
      hiddenTests: [
        { input: [[-1, v, 0, -v]], expected: [-v, -1, 0, v].sort((a, b) => a - b), description: 'Negativos e positivos' },
        { input: [[2, 2, 1]], expected: [1, 2, 2], description: 'Repetidos' },
      ],
    }),
  },
  {
    key: 'words', title: 'Contar palavras', functionName: 'contarPalavras', difficulty: 'KYU_4', xp: 250,
    description: 'Implemente `contarPalavras(texto)` contando grupos separados por um ou mais espaços. Ignore espaços no início e fim.', tags: ['Strings', 'Parsing'],
    makeTests: (v) => ({
      publicTests: [
        { input: `aluno ${v} fatecode`, expected: 3, description: 'Três palavras' },
        { input: '  uma   frase  ', expected: 2, description: 'Espaços extras' },
        { input: '', expected: 0, description: 'Texto vazio' },
      ],
      hiddenTests: [
        { input: 'a b c d e', expected: 5, description: 'Cinco palavras' },
        { input: '   ', expected: 0, description: 'Apenas espaços' },
      ],
    }),
  },
  {
    key: 'clamp', title: 'Limitar valor ao intervalo', functionName: 'limitar', difficulty: 'KYU_4', xp: 250,
    description: 'Implemente `limitar(valor, minimo, maximo)`. Valores abaixo do mínimo viram mínimo; acima do máximo viram máximo.', tags: ['Lógica', 'Matemática'],
    makeTests: (v) => ({
      publicTests: [
        { input: [v, 0, 10], expected: Math.min(10, Math.max(0, v)), description: 'Dentro ou próximo do intervalo' },
        { input: [-5, 0, 10], expected: 0, description: 'Abaixo do mínimo' },
        { input: [15, 0, 10], expected: 10, description: 'Acima do máximo' },
      ],
      hiddenTests: [
        { input: [5, 5, 5], expected: 5, description: 'Intervalo unitário' },
        { input: [-v, -10, -2], expected: Math.min(-2, Math.max(-10, -v)), description: 'Intervalo negativo' },
      ],
    }),
  },
  {
    key: 'gcd', title: 'Máximo divisor comum', functionName: 'mdc', difficulty: 'KYU_3', xp: 400,
    description: 'Implemente `mdc(a, b)` e retorne o máximo divisor comum positivo dos dois inteiros.', tags: ['Matemática', 'Algoritmos'],
    makeTests: (v) => ({
      publicTests: [
        { input: [12 + v * 2, 6], expected: gcd(12 + v * 2, 6), description: 'MDC positivo' },
        { input: [48, 18], expected: 6, description: 'Caso clássico' },
        { input: [7, 5], expected: 1, description: 'Coprimos' },
      ],
      hiddenTests: [
        { input: [-24, 18], expected: 6, description: 'Com negativo' },
        { input: [0, v + 5], expected: v + 5, description: 'Um valor zero' },
      ],
    }),
  },
  {
    key: 'prime', title: 'Número primo', functionName: 'ehPrimo', difficulty: 'KYU_3', xp: 400,
    description: 'Implemente `ehPrimo(n)` retornando `true` somente para números primos maiores ou iguais a 2.', tags: ['Matemática', 'Algoritmos'],
    makeTests: (v) => ({
      publicTests: [
        { input: 2, expected: true, description: 'Menor primo' },
        { input: 4, expected: false, description: 'Composto' },
        { input: v + 10, expected: isPrime(v + 10), description: 'Valor variável' },
      ],
      hiddenTests: [
        { input: 97, expected: true, description: 'Primo maior' },
        { input: 1, expected: false, description: 'Um não é primo' },
      ],
    }),
  },
  {
    key: 'flatten', title: 'Achatar um nível', functionName: 'achatarUmNivel', difficulty: 'KYU_2', xp: 600,
    description: 'Implemente `achatarUmNivel(valores)` removendo exatamente um nível de arrays aninhados.', tags: ['Arrays', 'Estruturas de Dados'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[[1, 2], [3, v]]], expected: [1, 2, 3, v], description: 'Dois grupos' },
        { input: [[1, [2, 3], 4]], expected: [1, 2, 3, 4], description: 'Mistura escalares e array' },
        { input: [[]], expected: [], description: 'Array vazio' },
      ],
      hiddenTests: [
        { input: [[[1], [], [2, 3]]], expected: [1, 2, 3], description: 'Grupo vazio' },
        { input: [[['a', 'b'], ['c']]], expected: ['a', 'b', 'c'], description: 'Strings' },
      ],
    }),
  },
  {
    key: 'frequency', title: 'Caractere mais frequente', functionName: 'maisFrequente', difficulty: 'KYU_2', xp: 600,
    description: 'Implemente `maisFrequente(texto)` retornando o caractere com maior frequência. Em empate, retorne o que apareceu primeiro.', tags: ['Strings', 'Mapas', 'Contagem'],
    makeTests: (v) => ({
      publicTests: [
        { input: `aabbbc${v}`, expected: 'b', description: 'Frequência clara' },
        { input: 'abac', expected: 'a', description: 'Primeiro vence empate posterior' },
        { input: 'x', expected: 'x', description: 'Um caractere' },
      ],
      hiddenTests: [
        { input: '1122331', expected: '1', description: 'Dígitos' },
        { input: 'banana', expected: 'a', description: 'Palavra conhecida' },
      ],
    }),
  },
  {
    key: 'rotate', title: 'Rotacionar array à esquerda', functionName: 'rotacionarEsquerda', difficulty: 'KYU_1', xp: 1000,
    description: 'Implemente `rotacionarEsquerda(valores, passos)`. A rotação deve aceitar passos maiores que o tamanho e valores negativos.', tags: ['Arrays', 'Algoritmos', 'Modularidade'],
    makeTests: (v) => ({
      publicTests: [
        { input: [[1, 2, 3, 4], v], expected: rotateLeft([1, 2, 3, 4], v), description: 'Passos variáveis' },
        { input: [[1, 2, 3], 4], expected: [2, 3, 1], description: 'Passos maiores que o tamanho' },
        { input: [[], 3], expected: [], description: 'Array vazio' },
      ],
      hiddenTests: [
        { input: [[1, 2, 3, 4], -1], expected: [4, 1, 2, 3], description: 'Rotação negativa' },
        { input: [['a', 'b', 'c'], 6], expected: ['a', 'b', 'c'], description: 'Voltas completas' },
      ],
    }),
  },
];

export function buildValidationChallengeCatalog() {
  const challenges: any[] = [];

  for (const template of templates) {
    for (let variant = 1; variant <= 5; variant++) {
      const { publicTests, hiddenTests } = template.makeTests(variant);
      challenges.push({
        title: `${template.title} · V${variant}`,
        slug: `validacao-${template.key}-${variant}`,
        description: `${template.description}\n\nEste exercício faz parte do catálogo inicial de validação do FateCode.`,
        difficulty: template.difficulty,
        source: 'INTERNAL',
        externalId: null,
        language: 'JAVASCRIPT',
        initialCode: `function ${template.functionName}(...args) {\n  // Escreva sua solução aqui.\n}\n`,
        testCode: '',
        publicTests,
        hiddenTests,
        tags: [...template.tags, 'FateCode', 'validation-catalog'],
        xpReward: template.xp,
        isDaily: false,
        topicId: null,
      });
    }
  }

  return challenges;
}
