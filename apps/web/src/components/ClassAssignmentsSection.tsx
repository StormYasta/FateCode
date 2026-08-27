import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Binary, CalendarDays, Code2, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const ClassAssignmentsSection: React.FC<{ classId: string }> = ({ classId }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/assignments', { params: { classId } });
        setAssignments(response.data.data || []);
      } catch (err) {
        console.error('Failed to load class assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId]);

  const programming = useMemo(() => assignments.filter((item) => Boolean(item.challenge)), [assignments]);
  const discreteMath = useMemo(
    () => assignments.filter((item) => item.academicExercise?.subject === 'DISCRETE_MATHEMATICS'),
    [assignments]
  );

  const renderGroup = (title: string, items: any[], programmingGroup: boolean) => (
    <div className="rounded-2xl bg-white dark:bg-[#0f1628]/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {programmingGroup ? <Code2 className="w-4 h-4 text-indigo-500" /> : <Binary className="w-4 h-4 text-emerald-500" />}
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
        </div>
        <span className="text-[11px] text-slate-400">{items.length} atividade(s)</span>
      </div>

      {items.length === 0 ? (
        <div className="p-5 text-xs text-slate-500 dark:text-slate-400">Nenhuma atividade publicada neste módulo.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.slice(0, 5).map((assignment) => {
            const content = programmingGroup ? assignment.challenge : assignment.academicExercise;
            const href = programmingGroup
              ? `/challenges/${content.slug || content.id}?assignmentId=${assignment.id}`
              : `/academic-exercises/${content.slug || content.id}?assignment=${assignment.id}`;
            return (
              <div key={assignment.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{assignment.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>{content.title}</span>
                    {!programmingGroup && <><span>•</span><span>MMD-001</span></>}
                    {assignment.dueDate && <><span>•</span><span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(assignment.dueDate).toLocaleDateString('pt-BR')}</span></>}
                  </div>
                </div>
                <Link to={href} className={`shrink-0 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1 ${programmingGroup ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                  Abrir <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="w-5 h-5 text-indigo-500" />
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Atividades da turma</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">O conteúdo de programação e a Matemática Discreta permanecem separados.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-slate-400">Carregando atividades...</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {renderGroup('Programação', programming, true)}
          {renderGroup('Matemática Discreta', discreteMath, false)}
        </div>
      )}
    </section>
  );
};
