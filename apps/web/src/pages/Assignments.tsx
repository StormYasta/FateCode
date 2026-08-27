import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  ArrowRight,
  Calculator,
  Clock,
  Code2,
  GraduationCap,
  ListChecks,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ModuleTab = 'PROGRAMMING' | 'SUBJECTS';

const subjectLabels: Record<string, string> = {
  DISCRETE_MATHEMATICS: 'Matemática Discreta',
  PROGRAMMING_LOGIC: 'Lógica de Programação',
  CALCULUS: 'Cálculo',
  STATISTICS: 'Estatística',
  OPERATIONS_RESEARCH: 'Pesquisa Operacional',
  OTHER: 'Outra disciplina',
};

export const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ModuleTab>('PROGRAMMING');

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get('/assignments');
        setAssignments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  const programming = useMemo(() => assignments.filter((item) => Boolean(item.challenge)), [assignments]);
  const subjects = useMemo(() => assignments.filter((item) => Boolean(item.academicExercise)), [assignments]);
  const visible = activeTab === 'PROGRAMMING' ? programming : subjects;

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo definido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <ListChecks className="w-6 h-6 text-indigo-500" />
            <span>Atividades da Turma</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Programação e disciplinas ficam separadas, mesmo quando são atribuídas pela mesma turma.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono">
          {assignments.length} atividade(s)
        </span>
      </div>

      <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('PROGRAMMING')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'PROGRAMMING' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <Code2 className="w-4 h-4" /> Programação <span className="opacity-70">{programming.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUBJECTS')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'SUBJECTS' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <Calculator className="w-4 h-4" /> Disciplinas <span className="opacity-70">{subjects.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">Carregando atividades...</div>
      ) : visible.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0f1628]/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Nenhuma atividade neste módulo.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {visible.map((assignment) => {
            const isProgramming = Boolean(assignment.challenge);
            const content = assignment.challenge || assignment.academicExercise;
            const accent = isProgramming ? 'indigo' : 'emerald';
            const href = isProgramming
              ? `/challenges/${content.slug || content.id}?assignmentId=${assignment.id}`
              : `/academic-exercises/${content.slug || content.id}?assignmentId=${assignment.id}`;

            return (
              <div
                key={assignment.id}
                className={`p-6 rounded-2xl bg-white dark:bg-[#0f1628]/80 border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between shadow-sm ${isProgramming ? 'hover:border-indigo-400' : 'hover:border-emerald-400'}`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3 gap-3">
                    <div className={`flex items-center space-x-1.5 font-semibold font-mono ${isProgramming ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{assignment.class?.code || 'Turma'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Entrega: {formatDueDate(assignment.dueDate)}</span>
                    </div>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2">{assignment.title}</h3>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg ${isProgramming ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
                        {isProgramming ? <Code2 className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{content.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isProgramming
                            ? `Programação • ${content.language || 'JavaScript'}`
                            : `Disciplinas • ${subjectLabels[content.subject] || content.subject}`}
                        </div>
                      </div>
                    </div>

                    <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1 ${isProgramming ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/30' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30'}`}>
                      <Star className="w-3.5 h-3.5" />
                      <span>+{content.xpReward || 30} XP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Em aberto</span>
                  </span>
                  <Link
                    to={href}
                    className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg transition-all ${isProgramming ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'}`}
                  >
                    <span>{isProgramming ? 'Resolver no Editor' : 'Responder questão'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
