export type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

export type ClassRole = 'STUDENT' | 'PROFESSOR' | 'ASSISTANT';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'c' | 'cpp';

export type ChallengeDifficulty = 'KYU_8' | 'KYU_7' | 'KYU_6' | 'KYU_5' | 'KYU_4' | 'KYU_3' | 'KYU_2' | 'KYU_1';

export type ChallengeSource = 'INTERNAL' | 'CODEWARS';

export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'COMPILATION_ERROR';

export type IntegrityRisk = 'NORMAL' | 'ATTENTION' | 'HIGH';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: UserDTO;
  tokens: AuthTokens;
}

export interface FacultyDTO {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    courses: number;
  };
}

export interface CourseDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  facultyId: string;
  faculty?: FacultyDTO;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes: number;
  };
}

export interface ClassDTO {
  id: string;
  name: string;
  code: string;
  semester: string;
  year: number;
  courseId: string;
  course?: CourseDTO;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface ClassMemberDTO {
  id: string;
  classId: string;
  userId: string;
  role: ClassRole;
  user: UserDTO;
  createdAt: string;
}

// --------------------------------------------------------
// PEDAGOGICAL TYPES (FASE 2)
// --------------------------------------------------------

export interface ChallengeDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty;
  source: ChallengeSource;
  externalId?: string | null;
  language: Language;
  initialCode: string;
  testCode: string;
  publicTests: any;
  hiddenTests?: any;
  tags: string[];
  xpReward: number;
  isDaily: boolean;
  topicId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDTO {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  moduleId: string;
  challenges?: ChallengeDTO[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    challenges: number;
  };
}

export interface ModuleDTO {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  learningPathId: string;
  topics?: TopicDTO[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    topics: number;
  };
}

export interface LearningPathDTO {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  courseId?: string | null;
  course?: CourseDTO | null;
  modules?: ModuleDTO[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    modules: number;
  };
}

export interface AssignmentDTO {
  id: string;
  title: string;
  classId: string;
  class?: ClassDTO;
  challengeId: string;
  challenge?: ChallengeDTO;
  startDate: string;
  dueDate?: string | null;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------
// CODEWARS INTEGRATION TYPES (FASE 3)
// --------------------------------------------------------

export interface CodewarsChallengeRank {
  id: number;
  name: string;
  color: string;
}

export interface CodewarsChallengeDTO {
  id: string;
  name: string;
  slug: string;
  category: string;
  publishedAt: string;
  approvedAt?: string;
  languages: string[];
  url: string;
  rank: CodewarsChallengeRank;
  createdAt: string;
  createdBy?: {
    username: string;
    url: string;
  };
  description: string;
  totalAttempts: number;
  totalCompleted: number;
  totalStars: number;
  tags: string[];
}

export interface CodewarsUserDTO {
  username: string;
  name?: string;
  honor: number;
  clan?: string;
  leaderboardPosition?: number;
  skills?: string[];
  ranks?: {
    overall: { rank: number; name: string; color: string; score: number };
    languages?: Record<string, { rank: number; name: string; color: string; score: number }>;
  };
  codeChallenges?: {
    totalAuthored: number;
    totalCompleted: number;
  };
}
