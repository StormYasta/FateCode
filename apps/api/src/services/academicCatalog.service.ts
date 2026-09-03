import { prisma } from '../plugins/prisma.js';

type Difficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
type ExerciseType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'NUMERIC' | 'SHORT_TEXT';

type ExerciseSeed = {
  title: string;
  slug: string;
  statement: string;
  subject: 'DISCRETE_MATHEMATICS';
  exerciseType: ExerciseType;
  difficulty: Difficulty;
  options: string[] | null;
  correctAnswer: string | number | boolean | string[];
  explanation: string;
  numericTolerance: number | null;
  tags: string[];
  xpReward: number;
  isPublished: boolean;
};

const difficultyByVariant: Difficulty[] = ['BASIC', 'BASIC', 'INTERMEDIATE', 'INTERMEDIATE', 'ADVANCED'];
const xpByDifficulty: Record<Difficulty, number> = { BASIC: 25, INTERMEDIATE: 40, ADVANCED: 60 };

const factorial = (n: number) => {
  let value = 1;
  for (let i = 2; i <= n; i += 1) value *= i;
  return value;
};

const combination = (n: number, k: number) => factorial(n) / (factorial(k) * factorial(n - k));
const arrangement = (n: number, k: number) => factorial(n) / factorial(n - k);

const makeExercise = (
  family: string,
  variant: number,
  topic: string,
  data: Omit<ExerciseSeed, 'slug' | 'subject' | 'difficulty' | 'xpReward' | 'isPublished' | 'tags'> & { tags?: string[]; difficulty?: Difficulty }
): ExerciseSeed => {
  const difficulty = data.difficulty || difficultyByVariant[variant];
  return {
    ...data,
    slug: `mmd-001-${family}-${variant + 1}`,
    subject: 'DISCRETE_MATHEMATICS',
    difficulty,
    xpReward: xpByDifficulty[difficulty],
    isPublished: true,
    tags: ['mmd-001', topic, ...(data.tags || [])],
  };
};

function buildCatalog(): ExerciseSeed[] {
  const exercises: ExerciseSeed[] = [];

  // 1) Teoria dos conjuntos — 20 exercícios
  const unionCases = [
    { a: [1, 2, 3, 4], b: [3, 4, 5], answer: 5 },
    { a: [2, 4, 6, 8], b: [1, 2, 3, 4], answer: 6 },
    { a: [1, 3, 5, 7, 9], b: [3, 6, 9, 12], answer: 7 },
    { a: [0, 1, 2, 3, 4, 5], b: [4, 5, 6, 7], answer: 8 },
    { a: [2, 3, 5, 7, 11], b: [5, 7, 11, 13, 17], answer: 7 },
  ];
  unionCases.forEach((item, index) => {
    exercises.push(makeExercise('conjuntos-uniao', index, 'conjuntos', {
      title: `Cardinalidade da união ${index + 1}`,
      statement: `Considere A = {${item.a.join(', ')}} e B = {${item.b.join(', ')}}. Quantos elementos possui A ∪ B?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: item.answer,
      explanation: `A união reúne todos os elementos distintos de A e B. Neste caso, |A ∪ B| = ${item.answer}.`,
      numericTolerance: 0,
      tags: ['uniao', 'cardinalidade'],
    }));
  });

  const intersectionCases = [
    { a: [1, 2, 3, 4], b: [3, 4, 5, 6], answer: 2 },
    { a: [2, 4, 6, 8, 10], b: [1, 2, 3, 4, 5], answer: 2 },
    { a: [1, 3, 5, 7, 9], b: [3, 5, 7], answer: 3 },
    { a: [0, 2, 4, 6, 8], b: [4, 6, 8, 10, 12], answer: 3 },
    { a: [2, 3, 5, 7, 11, 13], b: [5, 7, 11, 13, 17], answer: 4 },
  ];
  intersectionCases.forEach((item, index) => {
    exercises.push(makeExercise('conjuntos-intersecao', index, 'conjuntos', {
      title: `Cardinalidade da interseção ${index + 1}`,
      statement: `Considere A = {${item.a.join(', ')}} e B = {${item.b.join(', ')}}. Quantos elementos possui A ∩ B?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: item.answer,
      explanation: `A interseção contém somente elementos presentes nos dois conjuntos. Portanto, |A ∩ B| = ${item.answer}.`,
      numericTolerance: 0,
      tags: ['intersecao', 'cardinalidade'],
    }));
  });

  [2, 3, 4, 5, 6].forEach((n, index) => {
    const answer = 2 ** n;
    exercises.push(makeExercise('conjuntos-partes', index, 'conjuntos', {
      title: `Conjunto das partes com ${n} elementos`,
      statement: `Um conjunto A possui ${n} elementos. Quantos elementos possui o conjunto das partes P(A)?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Um conjunto com n elementos possui 2^n subconjuntos. Logo, 2^${n} = ${answer}.`,
      numericTolerance: 0,
      tags: ['subconjuntos', 'conjunto-das-partes'],
    }));
  });

  const differenceCases = [
    { a: [1, 2, 3, 4, 5], b: [2, 4], answer: 3 },
    { a: [2, 4, 6, 8, 10], b: [4, 8, 12], answer: 3 },
    { a: [1, 3, 5, 7, 9], b: [1, 5, 9], answer: 2 },
    { a: [0, 1, 2, 3, 4, 5, 6], b: [0, 2, 4, 6], answer: 3 },
    { a: [2, 3, 5, 7, 11, 13], b: [3, 7, 13, 17], answer: 3 },
  ];
  differenceCases.forEach((item, index) => {
    exercises.push(makeExercise('conjuntos-diferenca', index, 'conjuntos', {
      title: `Diferença de conjuntos ${index + 1}`,
      statement: `Considere A = {${item.a.join(', ')}} e B = {${item.b.join(', ')}}. Quantos elementos possui A − B?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: item.answer,
      explanation: `A − B contém os elementos de A que não pertencem a B. O resultado possui ${item.answer} elemento(s).`,
      numericTolerance: 0,
      tags: ['diferenca'],
    }));
  });

  // 2) Indução matemática — 10 exercícios
  [5, 8, 10, 12, 15].forEach((n, index) => {
    const answer = (n * (n + 1)) / 2;
    exercises.push(makeExercise('inducao-soma-naturais', index, 'inducao', {
      title: `Soma dos naturais até ${n}`,
      statement: `A identidade 1 + 2 + ... + n = n(n+1)/2 pode ser provada por indução. Qual é o valor do lado direito para n = ${n}?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Substituindo n = ${n}: ${n}·${n + 1}/2 = ${answer}. Essa igualdade é a expressão usada no passo indutivo.`,
      numericTolerance: 0,
      tags: ['inducao-matematica', 'somatorios'],
    }));
  });

  [3, 5, 7, 9, 12].forEach((n, index) => {
    const answer = n * n;
    exercises.push(makeExercise('inducao-soma-impares', index, 'inducao', {
      title: `Soma dos ${n} primeiros ímpares`,
      statement: `A propriedade 1 + 3 + 5 + ... + (2n − 1) = n² é demonstrável por indução. Qual é a soma dos ${n} primeiros números ímpares?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Pela identidade, a soma dos ${n} primeiros ímpares é ${n}² = ${answer}.`,
      numericTolerance: 0,
      tags: ['inducao-matematica', 'somatorios', 'impares'],
    }));
  });

  // 3) Análise combinatória — 20 exercícios
  [4, 5, 6, 7, 8].forEach((n, index) => {
    const answer = factorial(n);
    exercises.push(makeExercise('combinatoria-permutacao', index, 'combinatoria', {
      title: `Permutação de ${n} elementos`,
      statement: `De quantas maneiras diferentes podemos ordenar ${n} objetos distintos em uma fila?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Uma permutação simples de ${n} elementos possui ${n}! = ${answer} possibilidades.`,
      numericTolerance: 0,
      tags: ['permutacao', 'fatorial'],
    }));
  });

  const combinationCases = [
    [5, 2], [6, 2], [7, 3], [8, 3], [10, 4],
  ] as const;
  combinationCases.forEach(([n, k], index) => {
    const answer = combination(n, k);
    exercises.push(makeExercise('combinatoria-combinacao', index, 'combinatoria', {
      title: `Combinação C(${n}, ${k})`,
      statement: `De quantas formas podemos escolher ${k} elementos de um conjunto com ${n} elementos, sem considerar a ordem?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `C(${n},${k}) = ${n}! / (${k}!·${n - k}!) = ${answer}.`,
      numericTolerance: 0,
      tags: ['combinacao'],
    }));
  });

  const arrangementCases = [
    [5, 2], [6, 2], [6, 3], [7, 3], [8, 4],
  ] as const;
  arrangementCases.forEach(([n, k], index) => {
    const answer = arrangement(n, k);
    exercises.push(makeExercise('combinatoria-arranjo', index, 'combinatoria', {
      title: `Arranjo A(${n}, ${k})`,
      statement: `Quantas sequências ordenadas de ${k} elementos distintos podem ser formadas a partir de ${n} elementos distintos?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `A(${n},${k}) = ${n}! / (${n - k})! = ${answer}.`,
      numericTolerance: 0,
      tags: ['arranjo'],
    }));
  });

  const productCases = [
    { factors: [3, 2], context: '3 camisetas e 2 calças', answer: 6 },
    { factors: [4, 3], context: '4 entradas e 3 pratos principais', answer: 12 },
    { factors: [2, 5, 3], context: '2 rotas iniciais, 5 rotas intermediárias e 3 rotas finais', answer: 30 },
    { factors: [4, 4, 2], context: '4 símbolos para cada uma de duas posições e 2 símbolos para a terceira', answer: 32 },
    { factors: [5, 3, 4], context: '5 opções de processador, 3 de memória e 4 de armazenamento', answer: 60 },
  ];
  productCases.forEach((item, index) => {
    exercises.push(makeExercise('combinatoria-principio-multiplicativo', index, 'combinatoria', {
      title: `Princípio multiplicativo ${index + 1}`,
      statement: `Um processo possui ${item.context}. Quantas combinações completas distintas são possíveis?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: item.answer,
      explanation: `Pelo princípio multiplicativo, multiplicamos as quantidades independentes: ${item.factors.join(' × ')} = ${item.answer}.`,
      numericTolerance: 0,
      tags: ['principio-fundamental-da-contagem'],
    }));
  });

  // 4) Aplicações da lógica formal — 15 exercícios
  const implicationCases = [
    { p: true, q: true, answer: true },
    { p: true, q: false, answer: false },
    { p: false, q: true, answer: true },
    { p: false, q: false, answer: true },
    { p: true, q: false, answer: false },
  ];
  implicationCases.forEach((item, index) => {
    exercises.push(makeExercise('logica-implicacao', index, 'logica', {
      title: `Tabela-verdade da implicação ${index + 1}`,
      statement: `Considere p = ${item.p ? 'V' : 'F'} e q = ${item.q ? 'V' : 'F'}. A proposição p → q é verdadeira?`,
      exerciseType: 'TRUE_FALSE',
      options: null,
      correctAnswer: item.answer,
      explanation: 'A implicação p → q é falsa somente quando p é verdadeira e q é falsa.',
      numericTolerance: null,
      tags: ['proposicoes', 'implicacao', 'tabela-verdade'],
    }));
  });

  const deMorganCases = [
    { source: '¬(p ∧ q)', answer: '¬p ∨ ¬q', options: ['¬p ∨ ¬q', '¬p ∧ ¬q', 'p ∨ q', 'p ∧ q'] },
    { source: '¬(p ∨ q)', answer: '¬p ∧ ¬q', options: ['¬p ∨ ¬q', '¬p ∧ ¬q', 'p ∨ q', 'p ∧ q'] },
    { source: '¬(A ∩ B)', answer: '¬A ∪ ¬B', options: ['¬A ∪ ¬B', '¬A ∩ ¬B', 'A ∪ B', 'A ∩ B'] },
    { source: '¬(A ∪ B)', answer: '¬A ∩ ¬B', options: ['¬A ∪ ¬B', '¬A ∩ ¬B', 'A ∪ B', 'A ∩ B'] },
    { source: '¬(p ∧ q)', answer: '¬p ∨ ¬q', options: ['¬p ∧ ¬q', 'p ∨ q', '¬p ∨ ¬q', 'p ∧ q'] },
  ];
  deMorganCases.forEach((item, index) => {
    exercises.push(makeExercise('logica-de-morgan', index, 'logica', {
      title: `Lei de De Morgan ${index + 1}`,
      statement: `Qual expressão é logicamente equivalente a ${item.source}?`,
      exerciseType: 'MULTIPLE_CHOICE',
      options: item.options,
      correctAnswer: item.answer,
      explanation: `Pelas leis de De Morgan, ${item.source} é equivalente a ${item.answer}.`,
      numericTolerance: null,
      tags: ['de-morgan', 'equivalencia'],
    }));
  });

  const quantifierCases = [
    { proposition: 'Todo aluno entregou a atividade.', answer: 'Existe pelo menos um aluno que não entregou a atividade.' },
    { proposition: 'Todo número do conjunto é positivo.', answer: 'Existe pelo menos um número do conjunto que não é positivo.' },
    { proposition: 'Existe um usuário com acesso administrativo.', answer: 'Nenhum usuário possui acesso administrativo.' },
    { proposition: 'Existe um grafo da coleção que é conexo.', answer: 'Nenhum grafo da coleção é conexo.' },
    { proposition: 'Todo elemento de A pertence a B.', answer: 'Existe pelo menos um elemento de A que não pertence a B.' },
  ];
  quantifierCases.forEach((item, index) => {
    exercises.push(makeExercise('logica-negacao-quantificadores', index, 'logica', {
      title: `Negação de quantificadores ${index + 1}`,
      statement: `Qual é a negação lógica de: “${item.proposition}”?`,
      exerciseType: 'MULTIPLE_CHOICE',
      options: [
        item.answer,
        item.proposition,
        'A proposição é sempre verdadeira.',
        'Não é possível negar uma proposição quantificada.',
      ],
      correctAnswer: item.answer,
      explanation: 'Ao negar quantificadores, “todo” troca por “existe ao menos um que não”, e “existe” troca por “nenhum”.',
      numericTolerance: null,
      tags: ['quantificadores', 'negacao'],
    }));
  });

  // 5) Relações — 10 exercícios
  const relationCases = [
    { statement: 'A relação = sobre os números inteiros é reflexiva.', answer: true, explanation: 'Todo inteiro x satisfaz x = x.' },
    { statement: 'A relação ≤ sobre os números inteiros é simétrica.', answer: false, explanation: 'Por exemplo, 2 ≤ 3, mas 3 ≤ 2 é falso.' },
    { statement: 'A relação < sobre os números inteiros é reflexiva.', answer: false, explanation: 'Nenhum inteiro x satisfaz x < x.' },
    { statement: 'A relação “ter a mesma paridade” sobre os inteiros é transitiva.', answer: true, explanation: 'Se x e y têm a mesma paridade e y e z também, então x e z têm a mesma paridade.' },
    { statement: 'A relação de divisibilidade sobre os inteiros positivos é transitiva.', answer: true, explanation: 'Se a divide b e b divide c, então a divide c.' },
  ];
  relationCases.forEach((item, index) => {
    exercises.push(makeExercise('relacoes-propriedades', index, 'relacoes', {
      title: `Propriedades de relações ${index + 1}`,
      statement: item.statement,
      exerciseType: 'TRUE_FALSE',
      options: null,
      correctAnswer: item.answer,
      explanation: item.explanation,
      numericTolerance: null,
      tags: ['reflexiva', 'simetrica', 'transitiva'],
    }));
  });

  [2, 3, 4, 5, 6].forEach((modulus, index) => {
    exercises.push(makeExercise('relacoes-congruencia', index, 'relacoes', {
      title: `Classes de congruência módulo ${modulus}`,
      statement: `Na relação x ~ y se, e somente se, x ≡ y (mod ${modulus}), quantas classes de equivalência distintas existem nos inteiros?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: modulus,
      explanation: `A congruência módulo ${modulus} separa os inteiros em ${modulus} classes, correspondentes aos restos 0 até ${modulus - 1}.`,
      numericTolerance: 0,
      tags: ['equivalencia', 'congruencia'],
    }));
  });

  // 6) Funções — 10 exercícios
  const functionCases = [
    { a: 2, b: 1, x: 3 },
    { a: 3, b: -2, x: 4 },
    { a: -1, b: 5, x: 2 },
    { a: 4, b: 3, x: -1 },
    { a: -2, b: 7, x: 5 },
  ];
  functionCases.forEach((item, index) => {
    const answer = item.a * item.x + item.b;
    exercises.push(makeExercise('funcoes-avaliacao', index, 'funcoes', {
      title: `Avaliação de função ${index + 1}`,
      statement: `Se f(x) = ${item.a}x ${item.b >= 0 ? '+' : '-'} ${Math.abs(item.b)}, qual é o valor de f(${item.x})?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Substituindo x = ${item.x}, obtemos f(${item.x}) = ${item.a}·${item.x} ${item.b >= 0 ? '+' : '-'} ${Math.abs(item.b)} = ${answer}.`,
      numericTolerance: 0,
      tags: ['avaliacao-de-funcao'],
    }));
  });

  const compositionCases = [
    { a: 2, b: 1, c: 1, d: 3, x: 2 },
    { a: 3, b: 0, c: 2, d: -1, x: 2 },
    { a: -1, b: 4, c: 2, d: 1, x: 3 },
    { a: 2, b: -3, c: -1, d: 5, x: 1 },
    { a: 4, b: 2, c: 1, d: -2, x: 5 },
  ];
  compositionCases.forEach((item, index) => {
    const gx = item.c * item.x + item.d;
    const answer = item.a * gx + item.b;
    exercises.push(makeExercise('funcoes-composicao', index, 'funcoes', {
      title: `Composição de funções ${index + 1}`,
      statement: `Considere f(x) = ${item.a}x ${item.b >= 0 ? '+' : '-'} ${Math.abs(item.b)} e g(x) = ${item.c}x ${item.d >= 0 ? '+' : '-'} ${Math.abs(item.d)}. Qual é o valor de (f ∘ g)(${item.x})?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Primeiro g(${item.x}) = ${gx}. Depois f(${gx}) = ${answer}.`,
      numericTolerance: 0,
      tags: ['composicao-de-funcoes'],
    }));
  });

  // 7) Grafos e árvores — 15 exercícios
  const degreeCases = [
    { degrees: [2, 2, 2, 2], answer: 4 },
    { degrees: [1, 2, 2, 3], answer: 4 },
    { degrees: [3, 3, 2, 2], answer: 5 },
    { degrees: [2, 3, 3, 4], answer: 6 },
    { degrees: [4, 4, 3, 3, 2], answer: 8 },
  ];
  degreeCases.forEach((item, index) => {
    exercises.push(makeExercise('grafos-lema-apertos-mao', index, 'grafos-arvores', {
      title: `Graus e número de arestas ${index + 1}`,
      statement: `Um grafo não direcionado possui vértices com graus ${item.degrees.join(', ')}. Quantas arestas ele possui?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: item.answer,
      explanation: `Pelo lema do aperto de mãos, a soma dos graus é duas vezes o número de arestas. ${item.degrees.reduce((a, b) => a + b, 0)}/2 = ${item.answer}.`,
      numericTolerance: 0,
      tags: ['grafos', 'grau', 'lema-do-aperto-de-maos'],
    }));
  });

  [4, 5, 6, 7, 8].forEach((n, index) => {
    const answer = (n * (n - 1)) / 2;
    exercises.push(makeExercise('grafos-completos', index, 'grafos-arvores', {
      title: `Arestas do grafo completo K${n}`,
      statement: `Quantas arestas possui o grafo completo K${n}?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Um grafo completo com n vértices possui n(n−1)/2 arestas. Para n = ${n}, temos ${answer}.`,
      numericTolerance: 0,
      tags: ['grafos', 'grafo-completo'],
    }));
  });

  [4, 6, 8, 10, 15].forEach((vertices, index) => {
    const answer = vertices - 1;
    exercises.push(makeExercise('arvores-arestas', index, 'grafos-arvores', {
      title: `Arestas de uma árvore com ${vertices} vértices`,
      statement: `Uma árvore possui ${vertices} vértices. Quantas arestas ela necessariamente possui?`,
      exerciseType: 'NUMERIC',
      options: null,
      correctAnswer: answer,
      explanation: `Toda árvore finita com n vértices possui exatamente n − 1 arestas. Portanto, ${vertices} − 1 = ${answer}.`,
      numericTolerance: 0,
      tags: ['arvores', 'arestas'],
    }));
  });

  return exercises;
}

const catalog = buildCatalog();

if (catalog.length !== 100) {
  throw new Error(`Discrete Mathematics validation catalog must contain exactly 100 exercises; got ${catalog.length}.`);
}

export class AcademicCatalogService {
  static async seedValidationCatalog() {
    const result = await (prisma as any).academicExercise.createMany({
      data: catalog,
      skipDuplicates: true,
    });

    const total = await (prisma as any).academicExercise.count({
      where: { tags: { has: 'mmd-001' } },
    });

    return { created: result.count, total };
  }
}
