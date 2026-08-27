import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Binary,
  Calculator,
  ChartNoAxesColumn,
  CheckSquare2,
  ListChecks,
  Network,
  Search,
  Sigma,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

type Subject =
  | 'DISCRETE_MATHEMATICS'
  | 'PROGRAMMING_LOGIC'
  | 'CALCULUS'
  | 'STATISTICS'
  | 'OPERATIONS_RESEARCH'
  | 'OTHER';

type ExerciseType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'NUMERIC' | 'SHORT_TEXT';
type AcademicDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

type Exercise = {
  id: string;
  title: string;
  slug: string;
  statement: string;
  subject: Subject;
  exerciseType: ExerciseType;
  difficulty: AcademicDifficulty;
  tags: string[];
  xpReward: number;
};

const subjectMeta: Record<Subject, { label: string; icon: React.ElementType }> = {
  DISCRETE_MATHEMATICS: { label: 'Matemática Discreta', icon: Binary },
  PROGRAMMING_LOGIC: { label: 'Lógica de Programação', icon: Network },
  CALCULUS: { label: 'Cálculo', icon: Sigma },
  STATISTICS: { label: 'Estatística', icon: ChartNoAxesColumn },
  OPERATIONS_RESEARCH: { label: 'Pesquisa Operacional', icon: Calculator },
  OTHER: { label: 'Outras Disciplinas', icon: ListChecks },
};

const difficultyMeta: Record<AcademicDifficulty, string> = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

const typeMeta: Record<ExerciseType, string> = {
  MULTIPLE_CHOICE: 'Múltipla escolha',
  TRUE_FALSE: 'Verdadeiro / Falso',
  NUMERIC: 'Resposta numérica',
  SHORT_TEXT: 'Resposta curta',
};

export const AcademicExercises: React.FC = () => {
  const [subject, setSubject] = useState<Subject | ''>('');
  const [difficulty, setDifficulty] = useState<AcademicDifficulty | ''>('');
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/academic-exercises', {
          params: {
            ...(subject ? { subject } : {}),
            ...(difficulty ? { difficulty } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        if (!cancelled) setExercises(response.data.data || []);
      } catch (err: any) {
        if (!cancelled) {
          setExercises([]);
          setError(err.response?.data?.message || 'Não foi possível carregar os exercícios.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [subject, difficulty, search]);

  const subjectCounts = useMemo(() => {
    const counts = {} as Record<string, number>;
    exercises.forEach((exercise) => {
      counts[exercise.subject] = (counts[exercise.subject] || 0) + 1;
    });
    return counts;
  }, [exercises]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <Link
            to="/practice"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos módulos
          </Link>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 ml-3">
            <Sparkles className="w-4 h-4" />
            Disciplinas
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Exercícios por disciplina</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
            Questões independentes do módulo de programação, com formatos próprios de resposta e correção.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <CheckSquare2 className="w-4 h-4 text-emerald-500" />
          {loading ? 'Carregando...' : `${exercises.length} exercício(s)`}
        </div>
      </div>

      <section className="rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por conceito, enunciado ou título..."
            className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500"
          />
        </label>

        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Disciplina</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setSubject('')}
              className={`rounded-xl px-3 py-3 border text-left transition-colors ${
                subject === ''
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
              }`}
            >
              <div className="text-sm font-bold">Todas</div>
              <div className="text-[11px] opacity-70 mt-0.5">Disciplinas</div>
            </button>

            {(Object.entries(subjectMeta) as [Subject, { label: string; icon: React.ElementType }][]).slice(0, 5).map(([value, meta]) => {
              const Icon = meta.icon;
              const active = subject === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSubject(value)}
                  className={`rounded-xl px-3 py-3 border text-left transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold leading-tight">{meta.label}</span>
                  </div>
                  <div className="text-[10px] opacity-65 mt-1">{subjectCounts[value] || 'Filtrar'}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Nível:</span>
          {([
            ['', 'Todos'],
            ['BASIC', 'Básico'],
            ['INTERMEDIATE', 'Intermediário'],
            ['ADVANCED', 'Avançado'],
          ] as const).map(([value, label]) => (
            <button
              type="button"
              key={value || 'all'}
              onClick={() => setDifficulty(value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                difficulty === value
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && exercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum exercício encontrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Altere os filtros ou peça ao professor para publicar novos exercícios.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exercises.map((exercise) => {
          const meta = subjectMeta[exercise.subject];
          const Icon = meta.icon;
          return (
            <Link
              key={exercise.id}
              to={`/academic-exercises/${exercise.slug || exercise.id}`}
              className="group rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:-translate-y-0.5 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Icon className="w-4 h-4" />
                  <span>{meta.label}</span>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">+{exercise.xpReward} XP</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors">
                {exercise.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">{exercise.statement}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                  {difficultyMeta[exercise.difficulty]}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                  {typeMeta[exercise.exerciseType]}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-5 pt-4 text-xs">
                <span className="text-slate-500 dark:text-slate-400">{exercise.tags?.slice(0, 2).map((tag) => `#${tag}`).join(' ')}</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-1 transition-transform">Resolver →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
