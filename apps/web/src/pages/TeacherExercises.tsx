import React from 'react';
import { Binary, Code2, Layers3 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { TeacherChallenges } from './TeacherChallenges';
import { TeacherAcademicExercises } from './TeacherAcademicExercises';

type ExerciseModule = 'programming' | 'discrete-math';

export const TeacherExercises: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawType = searchParams.get('type');
  const module: ExerciseModule = rawType === 'discrete-math' ? 'discrete-math' : 'programming';

  const selectModule = (next: ExerciseModule) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('type', next);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1628] p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Layers3 className="w-4 h-4" /> Gestão Docente
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">Exercícios</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Gerencie o núcleo de Programação e o módulo complementar de Matemática Discreta no mesmo painel, mantendo regras, dados e formas de correção separados.
            </p>
          </div>

          <div className="inline-flex self-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => selectModule('programming')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                module === 'programming'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Programação
            </button>
            <button
              type="button"
              onClick={() => selectModule('discrete-math')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                module === 'discrete-math'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Binary className="w-4 h-4" />
              Matemática Discreta
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-transparent p-1 md:p-2">
        {module === 'programming' ? <TeacherChallenges /> : <TeacherAcademicExercises />}
      </div>
    </div>
  );
};