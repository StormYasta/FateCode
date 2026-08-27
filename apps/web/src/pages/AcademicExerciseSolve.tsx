import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Binary,
  Calculator,
  ChartNoAxesColumn,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Lightbulb,
  Network,
  RotateCcw,
  Send,
  Sigma,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Subject =
  | 'DISCRETE_MATHEMATICS'
  | 'PROGRAMMING_LOGIC'
  | 'CALCULUS'
  | 'STATISTICS'
  | 'OPERATIONS_RESEARCH'
  | 'OTHER';

type ExerciseType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'NUMERIC' | 'SHORT_TEXT';

type Exercise = {
  id: string;
  title: string;
  slug: string;
  statement: string;
  subject: Subject;
  exerciseType: ExerciseType;
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  options?: string[] | null;
  tags: string[];
  xpReward: number;
};

const subjectMeta: Record<Subject, { label: string; icon: React.ElementType }> = {
  DISCRETE_MATHEMATICS: { label: 'Matemática Discreta', icon: Binary },
  PROGRAMMING_LOGIC: { label: 'Lógica de Programação', icon: Network },
  CALCULUS: { label: 'Cálculo', icon: Sigma },
  STATISTICS: { label: 'Estatística', icon: ChartNoAxesColumn },
  OPERATIONS_RESEARCH: { label: 'Pesquisa Operacional', icon: Calculator },
  OTHER: { label: 'Outras Disciplinas', icon: CircleHelp },
};

const difficultyLabel = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
} as const;

export const AcademicExerciseSolve: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const { refreshUser } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [answer, setAnswer] = useState<any>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      if (!idOrSlug) return;
      setLoading(true);
      try {
        const [exerciseResponse, submissionResponse] = await Promise.all([
          api.get(`/academic-exercises/${idOrSlug}`),
          api.get(`/academic-exercises/${idOrSlug}/submissions`).catch(() => ({ data: { data: [] } })),
        ]);
        setExercise(exerciseResponse.data.data);
        setSubmissions(submissionResponse.data.data || []);
      } catch (err) {
        console.error('Failed to load academic exercise:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [idOrSlug]);

  const alreadySolved = useMemo(() => submissions.some((submission) => submission.isCorrect), [submissions]);

  const handleSubmit = async () => {
    if (!exercise || submitting) return;
    if (answer === '' || answer === null || answer === undefined) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await api.post(`/academic-exercises/${exercise.id}/submit`, {
        answer,
        assignmentId: assignmentId || null,
      });
      setFeedback(response.data);
      const submissionResponse = await api.get(`/academic-exercises/${exercise.id}/submissions`);
      setSubmissions(submissionResponse.data.data || []);
      if (response.data.success) {
        await refreshUser();
        confetti({ particleCount: 90, spread: 65, origin: { y: 0.62 } });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.response?.data?.message || 'Não foi possível enviar a resposta.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAnswer('');
    setFeedback(null);
  };

  if (loading) {
    return <div className="p-16 text-center text-slate-500 dark:text-slate-400">Carregando exercício...</div>;
  }

  if (!exercise) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0f1628] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        Exercício não encontrado.
      </div>
    );
  }

  const meta = subjectMeta[exercise.subject];
  const SubjectIcon = meta.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <Link
          to={assignmentId ? '/assignments' : '/practice/subjects'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="w-4 h-4" />
          {assignmentId ? 'Voltar às atividades' : 'Voltar às disciplinas'}
        </Link>

        {assignmentId && (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
            Atividade da turma
          </span>
        )}
      </div>

      <section className="rounded-3xl bg-white dark:bg-[#0f1628] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-[#0f1628]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <SubjectIcon className="w-4 h-4" /> {meta.label}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400">{difficultyLabel[exercise.difficulty]}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{exercise.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {alreadySolved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Concluído
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                +{exercise.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-7">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">Enunciado</div>
            <div className="text-base md:text-lg leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {exercise.statement}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Sua resposta</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" /> {submissions.length} tentativa(s)
              </span>
            </div>

            {exercise.exerciseType === 'MULTIPLE_CHOICE' && (
              <div className="grid gap-2.5">
                {(exercise.options || []).map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    disabled={Boolean(feedback?.success)}
                    onClick={() => setAnswer(option)}
                    className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${
                      answer === option
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500/50'
                    }`}
                  >
                    <span className="inline-flex w-6 h-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {exercise.exerciseType === 'TRUE_FALSE' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { value: true, label: 'Verdadeiro' },
                  { value: false, label: 'Falso' },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.label}
                    disabled={Boolean(feedback?.success)}
                    onClick={() => setAnswer(option.value)}
                    className={`p-4 rounded-xl border font-bold transition-all ${
                      answer === option.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {exercise.exerciseType === 'NUMERIC' && (
              <input
                type="text"
                inputMode="decimal"
                value={answer}
                disabled={Boolean(feedback?.success)}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Digite o valor numérico..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
              />
            )}

            {exercise.exerciseType === 'SHORT_TEXT' && (
              <textarea
                rows={4}
                value={answer}
                disabled={Boolean(feedback?.success)}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Escreva uma resposta curta..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-y"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {exercise.tags?.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">#{tag}</span>
                ))}
              </div>

              <div className="flex gap-2">
                {feedback && (
                  <button
                    type="button"
                    onClick={reset}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || Boolean(feedback?.success) || answer === ''}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar resposta
                </button>
              </div>
            </div>
          </div>

          {feedback && (
            <div className={`rounded-2xl border p-5 ${
              feedback.success
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {feedback.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-black ${feedback.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                    {feedback.message}
                  </h3>
                  {feedback.explanation && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{feedback.explanation}</span>
                    </div>
                  )}
                  {!feedback.success && feedback.correctAnswer !== undefined && (
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Resposta esperada: <span className="font-bold text-slate-700 dark:text-slate-200">{String(feedback.correctAnswer)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-4 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Este módulo é independente dos desafios de código: não existe editor, compilação ou nível kyu aqui.</span>
      </div>
    </div>
  );
};
