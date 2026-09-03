import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'PROFESSOR', 'STUDENT']).optional().default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const createFacultySchema = z.object({
  name: z.string().min(3, 'O nome da faculdade é obrigatório'),
  code: z.string().min(2, 'O código da faculdade é obrigatório (ex: FATEC-SP)'),
  city: z.string().optional(),
  state: z.string().optional(),
});
export const updateFacultySchema = createFacultySchema.partial();

export const createCourseSchema = z.object({
  name: z.string().min(3, 'O nome do curso é obrigatório'),
  code: z.string().min(2, 'O código do curso é obrigatório (ex: ADS)'),
  description: z.string().optional(),
  facultyId: z.string().uuid('ID de faculdade inválido'),
});
export const updateCourseSchema = createCourseSchema.partial();

export const createClassSchema = z.object({
  name: z.string().min(3, 'O nome da turma é obrigatório'),
  code: z.string().min(2, 'O código da turma é obrigatório (ex: ADS-2026-2)'),
  semester: z.string().min(1, 'O semestre é obrigatório (ex: 4º)'),
  year: z.number().int().min(2020).max(2100),
  courseId: z.string().uuid('ID de curso inválido'),
});
export const updateClassSchema = createClassSchema.partial();

export const addClassMemberSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
  role: z.enum(['STUDENT', 'PROFESSOR', 'ASSISTANT']).default('STUDENT'),
});

// --------------------------------------------------------
// PEDAGOGICAL SCHEMAS
// --------------------------------------------------------

export const createLearningPathSchema = z.object({
  title: z.string().min(3, 'O título da trilha é obrigatório'),
  slug: z.string().min(2, 'O slug da trilha é obrigatório'),
  description: z.string().optional(),
  courseId: z.string().uuid('ID do curso inválido').optional().nullable(),
});
export const updateLearningPathSchema = createLearningPathSchema.partial();

export const createModuleSchema = z.object({
  title: z.string().min(2, 'O título do módulo é obrigatório'),
  description: z.string().optional(),
  order: z.number().int().default(0),
  learningPathId: z.string().uuid('ID da trilha inválido'),
});
export const updateModuleSchema = createModuleSchema.partial();

export const createTopicSchema = z.object({
  title: z.string().min(2, 'O título do tópico é obrigatório'),
  description: z.string().optional(),
  order: z.number().int().default(0),
  moduleId: z.string().uuid('ID do módulo inválido'),
});
export const updateTopicSchema = createTopicSchema.partial();

// --------------------------------------------------------
// PROGRAMMING CHALLENGES
// --------------------------------------------------------

export const createChallengeSchema = z.object({
  title: z.string().min(3, 'O título do desafio é obrigatório'),
  slug: z.string().min(2, 'O slug é obrigatório'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  difficulty: z.enum(['KYU_8', 'KYU_7', 'KYU_6', 'KYU_5', 'KYU_4', 'KYU_3', 'KYU_2', 'KYU_1']).default('KYU_8'),
  source: z.enum(['INTERNAL', 'CODEWARS']).default('INTERNAL'),
  externalId: z.string().optional().nullable(),
  language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
  initialCode: z.string().min(1, 'O código inicial é obrigatório'),
  testCode: z.string().default(''),
  publicTests: z.any().default([]),
  hiddenTests: z.any().default([]),
  tags: z.array(z.string()).default([]),
  xpReward: z.number().int().min(10).default(50),
  isDaily: z.boolean().default(false),
  topicId: z.string().uuid('ID do tópico inválido').optional().nullable(),
});
export const updateChallengeSchema = createChallengeSchema.partial();

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'O título da atividade é obrigatório'),
  classId: z.string().uuid('ID da turma inválido'),
  challengeId: z.string().uuid('ID do desafio inválido'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isOptional: z.boolean().default(false),
});
export const updateAssignmentSchema = createAssignmentSchema.partial();

// --------------------------------------------------------
// COMPLEMENTARY ACADEMIC EXERCISES
// --------------------------------------------------------

export const academicSubjectSchema = z.enum([
  'DISCRETE_MATHEMATICS',
  'PROGRAMMING_LOGIC',
  'CALCULUS',
  'STATISTICS',
  'OPERATIONS_RESEARCH',
  'OTHER',
]);

export const academicExerciseTypeSchema = z.enum([
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'NUMERIC',
  'SHORT_TEXT',
]);

export const academicDifficultySchema = z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']);

const academicExerciseBaseSchema = z.object({
  title: z.string().min(3, 'O título do exercício é obrigatório'),
  slug: z.string().min(2, 'O slug é obrigatório'),
  statement: z.string().min(5, 'O enunciado é obrigatório'),
  subject: academicSubjectSchema,
  exerciseType: academicExerciseTypeSchema,
  difficulty: academicDifficultySchema.default('BASIC'),
  options: z.array(z.string().min(1)).optional().nullable(),
  correctAnswer: z.any(),
  explanation: z.string().optional().nullable(),
  numericTolerance: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).default([]),
  xpReward: z.number().int().min(5).default(30),
  isPublished: z.boolean().default(true),
});

export const createAcademicExerciseSchema = academicExerciseBaseSchema.superRefine((data, ctx) => {
  if (data.exerciseType === 'MULTIPLE_CHOICE' && (!data.options || data.options.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Questões de múltipla escolha precisam de pelo menos duas alternativas.' });
  }
  if (data.exerciseType === 'TRUE_FALSE' && typeof data.correctAnswer !== 'boolean') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Questões de verdadeiro/falso exigem resposta booleana.' });
  }
  if (data.exerciseType === 'NUMERIC' && Number.isNaN(Number(data.correctAnswer))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Questões numéricas exigem uma resposta numérica.' });
  }
});

export const updateAcademicExerciseSchema = academicExerciseBaseSchema.partial();

export const submitAcademicExerciseSchema = z.object({
  answer: z.any(),
  assignmentId: z.string().uuid('ID da atividade inválido').optional().nullable(),
});

export const createAcademicAssignmentSchema = z.object({
  title: z.string().min(3, 'O título da atividade é obrigatório'),
  classId: z.string().uuid('ID da turma inválido'),
  exerciseId: z.string().uuid('ID do exercício inválido'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isOptional: z.boolean().default(false),
});

export const updateAcademicAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isOptional: z.boolean().optional(),
});

// --------------------------------------------------------
// CODEWARS IMPORT
// --------------------------------------------------------

export const importCodewarsChallengeSchema = z.object({
  externalId: z.string().min(1, 'O ID ou slug do Codewars é obrigatório'),
  topicId: z.string().uuid('ID do tópico inválido').optional().nullable(),
  language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
  initialCode: z.string().min(1, 'O código inicial é obrigatório'),
  testCode: z.string().default(''),
  publicTests: z.array(z.object({ input: z.any(), expected: z.any(), description: z.string().optional() })).default([]),
  hiddenTests: z.array(z.object({ input: z.any(), expected: z.any(), description: z.string().optional() })).default([]),
  customTitle: z.string().optional(),
  customDescription: z.string().optional(),
  xpReward: z.number().int().min(10).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type AddClassMemberInput = z.infer<typeof addClassMemberSchema>;
export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;
export type UpdateLearningPathInput = z.infer<typeof updateLearningPathSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateAcademicExerciseInput = z.infer<typeof createAcademicExerciseSchema>;
export type UpdateAcademicExerciseInput = z.infer<typeof updateAcademicExerciseSchema>;
export type SubmitAcademicExerciseInput = z.infer<typeof submitAcademicExerciseSchema>;
export type CreateAcademicAssignmentInput = z.infer<typeof createAcademicAssignmentSchema>;
export type UpdateAcademicAssignmentInput = z.infer<typeof updateAcademicAssignmentSchema>;
export type ImportCodewarsChallengeInput = z.infer<typeof importCodewarsChallengeSchema>;
