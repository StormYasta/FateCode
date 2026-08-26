import { PrismaClient, Role, ClassRole, Difficulty, ChallengeSource, Language } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seed for FateCode (Phase 1 & Phase 2)...');

  // Clean existing data in reverse dependency order
  await prisma.codeSimilarity.deleteMany();
  await prisma.integrityAnalysis.deleteMany();
  await prisma.commentReport.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.season.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.xPTransaction.deleteMany();
  await prisma.developmentEvent.deleteMany();
  await prisma.codeSnapshot.deleteMany();
  await prisma.execution.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.module.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.course.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Faculty
  const faculty = await prisma.faculty.create({
    data: {
      name: 'Faculdade de Tecnologia de São Paulo - FATEC-SP',
      code: 'FATEC-SP',
      city: 'São Paulo',
      state: 'SP',
    },
  });
  console.log(`✅ Faculty created: ${faculty.name}`);

  // 2. Create Courses
  const adsCourse = await prisma.course.create({
    data: {
      name: 'Análise e Desenvolvimento de Sistemas',
      code: 'ADS',
      description: 'Formação superior focada em desenvolvimento de software, arquitetura e engenharia de dados.',
      facultyId: faculty.id,
    },
  });

  const gtiCourse = await prisma.course.create({
    data: {
      name: 'Gestão da Tecnologia da Informação',
      code: 'GTI',
      description: 'Curso superior focado em governança, infraestrutura e gestão estratégica de TI.',
      facultyId: faculty.id,
    },
  });
  console.log(`✅ Courses created: ${adsCourse.code}, ${gtiCourse.code}`);

  // 3. Create Classes (Turmas)
  const classAds1 = await prisma.class.create({
    data: {
      name: 'ADS - 1º Semestre 2026/2',
      code: 'ADS-1-2026-2',
      semester: '1º',
      year: 2026,
      courseId: adsCourse.id,
    },
  });

  const classAds4 = await prisma.class.create({
    data: {
      name: 'ADS - 4º Semestre 2026/2',
      code: 'ADS-4-2026-2',
      semester: '4º',
      year: 2026,
      courseId: adsCourse.id,
    },
  });

  const classGti2 = await prisma.class.create({
    data: {
      name: 'GTI - 2º Semestre 2026/2',
      code: 'GTI-2-2026-2',
      semester: '2º',
      year: 2026,
      courseId: gtiCourse.id,
    },
  });
  console.log(`✅ Classes created: ${classAds1.name}, ${classAds4.name}, ${classGti2.name}`);

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const profPasswordHash = await bcrypt.hash('Prof@123456', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123456', 10);

  // 4. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fatecode.edu.br',
      name: 'Administrador FateCode',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      bio: 'Administrador do Sistema FateCode',
      profile: {
        create: {
          totalXP: 9999,
          githubUsername: 'fatecode-admin',
        },
      },
    },
  });
  console.log(`✅ Admin created: ${adminUser.email}`);

  // 5. Create 3 Professors
  const profsData = [
    { email: 'prof.silva@fatecode.edu.br', name: 'Prof. Carlos Silva', bio: 'Docente de Algoritmos e Estruturas de Dados.' },
    { email: 'prof.santos@fatecode.edu.br', name: 'Profa. Mariana Santos', bio: 'Docente de Desenvolvimento Web e Engenharia de Software.' },
    { email: 'prof.oliveira@fatecode.edu.br', name: 'Prof. Roberto Oliveira', bio: 'Docente de Bancos de Dados e Arquitetura de Sistemas.' },
  ];

  const profUsers = [];
  for (const prof of profsData) {
    const user = await prisma.user.create({
      data: {
        email: prof.email,
        name: prof.name,
        passwordHash: profPasswordHash,
        role: Role.PROFESSOR,
        bio: prof.bio,
        profile: {
          create: {
            totalXP: 5000,
          },
        },
      },
    });
    profUsers.push(user);
  }
  console.log(`✅ 3 Professors created`);

  // Assign Professors to Classes
  await prisma.classMember.createMany({
    data: [
      { classId: classAds1.id, userId: profUsers[0].id, role: ClassRole.PROFESSOR },
      { classId: classAds4.id, userId: profUsers[1].id, role: ClassRole.PROFESSOR },
      { classId: classGti2.id, userId: profUsers[2].id, role: ClassRole.PROFESSOR },
    ],
  });

  // 6. Create 15 Students
  const studentsData = [
    { email: 'joao.silva@fatecode.edu.br', name: 'João Silva', xp: 12450, classId: classAds4.id },
    { email: 'maria.souza@fatecode.edu.br', name: 'Maria Souza', xp: 11920, classId: classAds4.id },
    { email: 'carlos.eduardo@fatecode.edu.br', name: 'Carlos Eduardo', xp: 11340, classId: classAds4.id },
    { email: 'ana.beatriz@fatecode.edu.br', name: 'Ana Beatriz', xp: 9800, classId: classAds4.id },
    { email: 'lucas.mendes@fatecode.edu.br', name: 'Lucas Mendes', xp: 8420, classId: classAds4.id },
    { email: 'juliana.costa@fatecode.edu.br', name: 'Juliana Costa', xp: 7500, classId: classAds1.id },
    { email: 'pedro.henrique@fatecode.edu.br', name: 'Pedro Henrique', xp: 6890, classId: classAds1.id },
    { email: 'fernanda.lima@fatecode.edu.br', name: 'Fernanda Lima', xp: 6200, classId: classAds1.id },
    { email: 'gabriel.alves@fatecode.edu.br', name: 'Gabriel Alves', xp: 5400, classId: classAds1.id },
    { email: 'larissa.rocha@fatecode.edu.br', name: 'Larissa Rocha', xp: 4800, classId: classAds1.id },
    { email: 'matheus.dias@fatecode.edu.br', name: 'Matheus Dias', xp: 5100, classId: classGti2.id },
    { email: 'camila.martins@fatecode.edu.br', name: 'Camila Martins', xp: 4300, classId: classGti2.id },
    { email: 'felipe.barbosa@fatecode.edu.br', name: 'Felipe Barbosa', xp: 3900, classId: classGti2.id },
    { email: 'isabela.cardoso@fatecode.edu.br', name: 'Isabela Cardoso', xp: 3200, classId: classGti2.id },
    { email: 'rafael.nunes@fatecode.edu.br', name: 'Rafael Nunes', xp: 2800, classId: classGti2.id },
  ];

  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: studentPasswordHash,
        role: Role.STUDENT,
        bio: `Estudante na FATEC-SP apaixonado por código e desafios.`,
        profile: {
          create: {
            totalXP: s.xp,
            githubUsername: s.email.split('@')[0].replace('.', '-'),
          },
        },
        streak: {
          create: {
            currentStreak: Math.floor(Math.random() * 15) + 1,
            maxStreak: 20,
            lastActivityDate: new Date(),
          },
        },
        xpTransactions: {
          create: {
            amount: s.xp,
            reason: 'Pontuação acumulada em atividades acadêmicas e desafios diários',
          },
        },
      },
    });

    await prisma.classMember.create({
      data: {
        classId: s.classId,
        userId: user.id,
        role: ClassRole.STUDENT,
      },
    });
  }
  console.log(`✅ 15 Students created and assigned to classes`);

  // 7. Create Season & Achievements
  await prisma.season.create({
    data: {
      name: 'Temporada 2026.2 — FateCode Championship',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-20'),
      isActive: true,
    },
  });

  await prisma.achievement.createMany({
    data: [
      { code: 'FIRST_CHALLENGE', title: 'Primeiro Desafio', description: 'Resolveu seu primeiro exercício na plataforma.', icon: '🔥', xpReward: 50 },
      { code: 'STREAK_7', title: '7 Dias Consecutivos', description: 'Manteve uma sequência diária de 7 dias.', icon: '⚡', xpReward: 100 },
      { code: 'ALGORITHMIST', title: 'Algoritmista', description: 'Resolveu 20 desafios de algoritmos.', icon: '🧠', xpReward: 250 },
      { code: 'NIGHTMARE_1KYU', title: 'Pesadelo 1 kyu', description: 'Resolveu um desafio lendário 1 kyu.', icon: '💀', xpReward: 1000 },
      { code: 'TOP_3_SEASON', title: 'Top 3 da Temporada', description: 'Terminou uma temporada no pódio universitário.', icon: '🏆', xpReward: 500 },
    ],
  });

  // --------------------------------------------------------
  // 8. PHASE 2: LEARNING PATHS, MODULES, TOPICS & CHALLENGES
  // --------------------------------------------------------

  // Track 1: Algoritmos e Estruturas de Dados com JavaScript
  const trackAlgorithms = await prisma.learningPath.create({
    data: {
      title: 'Algoritmos e Estruturas de Dados com JavaScript',
      slug: 'algoritmos-estruturas-dados-js',
      description: 'Domine a resolução de problemas algorítmicos complexos, otimização de complexidade assintótica O(n) e estruturas de dados essenciais.',
      courseId: adsCourse.id,
    },
  });

  const moduleArrays = await prisma.module.create({
    data: {
      title: 'Módulo 01: Vetores e Arrays',
      description: 'Indexação, iteração, ponteiros múltiplos e janelas deslizantes.',
      order: 1,
      learningPathId: trackAlgorithms.id,
    },
  });

  const topicArraySearch = await prisma.topic.create({
    data: {
      title: 'Tópico 1.1: Busca e Pares em Arrays',
      description: 'Exercícios clássicos de localização e soma de elementos.',
      order: 1,
      moduleId: moduleArrays.id,
    },
  });

  const challengeTwoSum = await prisma.challenge.create({
    data: {
      title: 'Soma de Dois Números (Two Sum)',
      slug: 'two-sum',
      description: 'Dado um array de números inteiros `nums` e um número inteiro `target`, retorne os índices dos dois números cuja soma seja igual a `target`.\n\nExemplo:\n```js\nnums = [2, 7, 11, 15], target = 9 -> [0, 1]\n```',
      difficulty: Difficulty.KYU_7,
      source: ChallengeSource.CODEWARS,
      externalId: '52c31f8e6605bcc646000082',
      language: Language.JAVASCRIPT,
      initialCode: `function twoSum(nums, target) {\n  // Escreva sua solução aqui\n}`,
      testCode: `const assert = require('assert');`,
      publicTests: [
        { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'nums = [2, 7, 11, 15], target = 9' },
        { input: [[3, 2, 4], 6], expected: [1, 2], description: 'nums = [3, 2, 4], target = 6' },
      ],
      hiddenTests: [
        { input: [[3, 3], 6], expected: [0, 1], description: 'Caso com números repetidos' },
        { input: [[1, 5, 8, 12, 19, 20], 31], expected: [3, 4], description: 'Caso array maior' },
      ],
      tags: ['arrays', 'hashmap', 'algorithms'],
      xpReward: 75,
      topicId: topicArraySearch.id,
    },
  });

  const challengeReverseArray = await prisma.challenge.create({
    data: {
      title: 'Inverter Array In-Place',
      slug: 'reverse-array',
      description: 'Inverta a ordem dos elementos de um array sem criar uma nova estrutura de memória (O(1) memória auxiliar).',
      difficulty: Difficulty.KYU_8,
      source: ChallengeSource.INTERNAL,
      language: Language.JAVASCRIPT,
      initialCode: `function reverseArray(arr) {\n  // Escreva sua solução aqui\n  return arr;\n}`,
      testCode: `const assert = require('assert');`,
      publicTests: [
        { input: [[1, 2, 3, 4]], expected: [4, 3, 2, 1], description: 'Array sequencial' },
        { input: [['a', 'b', 'c']], expected: ['c', 'b', 'a'], description: 'Array de strings' },
      ],
      hiddenTests: [
        { input: [[10]], expected: [10], description: 'Elemento único' },
      ],
      tags: ['arrays', 'pointers', 'basics'],
      xpReward: 50,
      topicId: topicArraySearch.id,
    },
  });

  const moduleHashMaps = await prisma.module.create({
    data: {
      title: 'Módulo 02: Dicionários e HashMaps',
      description: 'Tabelas de dispersão para acesso O(1), contagem de frequências e agrupamentos.',
      order: 2,
      learningPathId: trackAlgorithms.id,
    },
  });

  const topicAnagrams = await prisma.topic.create({
    data: {
      title: 'Tópico 2.1: Contagem e Frequência de Caracteres',
      description: 'Problemas de comparação de strings e contagem de termos.',
      order: 1,
      moduleId: moduleHashMaps.id,
    },
  });

  const challengeAnagram = await prisma.challenge.create({
    data: {
      title: 'Anagrama Válido (Valid Anagram)',
      slug: 'valid-anagram',
      description: 'Dadas duas strings `s` e `t`, retorne `true` se `t` for um anagrama de `s`, e `false` caso contrário.',
      difficulty: Difficulty.KYU_7,
      source: ChallengeSource.CODEWARS,
      language: Language.JAVASCRIPT,
      initialCode: `function isAnagram(s, t) {\n  // Escreva sua solução aqui\n}`,
      testCode: `const assert = require('assert');`,
      publicTests: [
        { input: ['anagram', 'nagaram'], expected: true, description: 'anagram e nagaram -> true' },
        { input: ['rat', 'car'], expected: false, description: 'rat e car -> false' },
      ],
      hiddenTests: [
        { input: ['a', 'ab'], expected: false, description: 'tamanhos diferentes' },
        { input: ['listen', 'silent'], expected: true, description: 'listen e silent -> true' },
      ],
      tags: ['hashmap', 'strings', 'algorithms'],
      xpReward: 75,
      topicId: topicAnagrams.id,
    },
  });

  // Track 2: Desenvolvimento Web e Métodos Funcionais
  const trackWeb = await prisma.learningPath.create({
    data: {
      title: 'Desenvolvimento Web e Programação Funcional',
      slug: 'dev-web-programacao-funcional',
      description: 'Aprofunde-se no paradigma funcional do JavaScript moderno: map, filter, reduce, imutabilidade e assincronismo.',
      courseId: adsCourse.id,
    },
  });

  const moduleFunctional = await prisma.module.create({
    data: {
      title: 'Módulo 01: Funções de Alta Ordem',
      description: 'Composição de funções e pipelines de processamento.',
      order: 1,
      learningPathId: trackWeb.id,
    },
  });

  const topicReduce = await prisma.topic.create({
    data: {
      title: 'Tópico 1.1: Agregações com Reduce',
      description: 'Construção de pipelines de transformação com acumuladores.',
      order: 1,
      moduleId: moduleFunctional.id,
    },
  });

  const challengeReduce = await prisma.challenge.create({
    data: {
      title: 'Pipeline de Vendas com Reduce',
      slug: 'pipeline-vendas-reduce',
      description: 'Dado um array de transações `{ id, categoria, valor }`, agrupe o total faturado por categoria em um único objeto.',
      difficulty: Difficulty.KYU_6,
      source: ChallengeSource.INTERNAL,
      language: Language.JAVASCRIPT,
      initialCode: `function agruparVendas(transacoes) {\n  // Utilize Array.prototype.reduce\n}`,
      testCode: `const assert = require('assert');`,
      publicTests: [
        {
          input: [[{ categoria: 'eletronicos', valor: 100 }, { categoria: 'livros', valor: 50 }, { categoria: 'eletronicos', valor: 200 }]],
          expected: { eletronicos: 300, livros: 50 },
          description: 'Agrupamento padrão',
        },
      ],
      hiddenTests: [
        { input: [[]], expected: {}, description: 'Array vazio' },
      ],
      tags: ['functional', 'reduce', 'arrays'],
      xpReward: 100,
      topicId: topicReduce.id,
    },
  });

  // Daily Challenge
  const challengeDaily = await prisma.challenge.create({
    data: {
      title: 'Desafio do Dia: O Cofre dos Primos',
      slug: 'cofre-dos-primos',
      description: 'Encontre o maior número primo palíndromo menor ou igual a `N`. Retorne `null` se não existir nenhum número palíndromo primo no intervalo.',
      difficulty: Difficulty.KYU_4,
      source: ChallengeSource.INTERNAL,
      language: Language.JAVASCRIPT,
      initialCode: `function primeVault(n) {\n  // Escreva sua solução aqui\n}`,
      testCode: `const assert = require('assert');`,
      publicTests: [
        { input: [100], expected: 11, description: 'N = 100 -> 11' },
        { input: [1000], expected: 929, description: 'N = 1000 -> 929' },
      ],
      hiddenTests: [
        { input: [10000], expected: 98689, description: 'Teste de estresse N = 10000' },
      ],
      tags: ['algorithms', 'math', 'prime', 'palindrome'],
      xpReward: 250,
      isDaily: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyChallenge.create({
    data: {
      challengeId: challengeDaily.id,
      activeDate: today,
      extraXp: 100,
    },
  });

  // 9. Create Class Assignments
  const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.assignment.create({
    data: {
      title: 'Atividade 01 — Busca Eficiente e Soma de Pares',
      classId: classAds4.id,
      challengeId: challengeTwoSum.id,
      dueDate: inOneWeek,
      isOptional: false,
    },
  });

  await prisma.assignment.create({
    data: {
      title: 'Atividade 02 — Estrutura de Dicionários e Strings',
      classId: classAds4.id,
      challengeId: challengeAnagram.id,
      dueDate: inTwoWeeks,
      isOptional: false,
    },
  });

  await prisma.assignment.create({
    data: {
      title: 'Atividade Inicial — Inversão e Lógica com Vetores',
      classId: classAds1.id,
      challengeId: challengeReverseArray.id,
      dueDate: inOneWeek,
      isOptional: false,
    },
  });

  await prisma.assignment.create({
    data: {
      title: 'Atividade Prática — Pipelines e Métodos de Alta Ordem',
      classId: classGti2.id,
      challengeId: challengeReduce.id,
      dueDate: inTwoWeeks,
      isOptional: false,
    },
  });

  console.log('✅ Phase 2 Pedagogical Tracks, Modules, Topics, Challenges & Assignments created!');
  console.log('\n🚀 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
