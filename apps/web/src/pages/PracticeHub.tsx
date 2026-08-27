import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Binary,
  Calculator,
  ChartNoAxesColumn,
  Code2,
  Network,
  Sigma,
  Sparkles,
} from 'lucide-react';

const subjects = [
  { label: 'Matemática Discreta', icon: Binary },
  { label: 'Lógica de Programação', icon: Network },
  { label: 'Cálculo', icon: Sigma },
  { label: 'Estatística', icon: ChartNoAxesColumn },
  { label: 'Pesquisa Operacional', icon: Calculator },
];

export const PracticeHub: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          Treino Livre
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">O que você quer praticar?</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Os módulos permanecem separados: programação usa editor, testes e níveis kyu; disciplinas usam questões e correção própria.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Link
          to="/practice/programming"
          className="group p-7 rounded-3xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/35 dark:via-[#0f1628] dark:to-[#101424] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Code2 className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              8 kyu → 1 kyu
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-7">Programação</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
            Resolva desafios no editor, execute testes, submeta soluções e evolua por dificuldade e linguagem.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            {['JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++'].map((item) => (
              <span key={item} className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-indigo-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Editor + testes + XP</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-1 transition-transform">
              Abrir Programação <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        <Link
          to="/practice/subjects"
          className="group p-7 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/25 dark:via-[#0f1628] dark:to-[#0d1820] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Calculator className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              Novo módulo
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-7">Disciplinas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
            Pratique conteúdos teóricos e quantitativos com múltipla escolha, verdadeiro/falso, respostas numéricas e respostas curtas.
          </p>

          <div className="grid sm:grid-cols-2 gap-2 mt-5">
            {subjects.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-emerald-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Questões + feedback + XP</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-1 transition-transform">
              Abrir Disciplinas <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};
