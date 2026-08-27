import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Binary, Code2, Sparkles } from 'lucide-react';

export const PracticeHub: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          Treino Livre
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Escolha o tipo de treino</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Programação continua como núcleo do FateCode. Matemática Discreta entra como módulo complementar, com experiência e correção próprias.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Link
          to="/practice/programming"
          className="lg:col-span-2 group p-7 md:p-8 rounded-3xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/35 dark:via-[#0f1628] dark:to-[#101424] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Code2 className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              Módulo principal
            </span>
          </div>

          <div className="mt-8">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">8 kyu → 1 kyu</div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">Programação</h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed mt-3 max-w-2xl">
              Resolva desafios no editor, execute testes, submeta soluções e evolua por dificuldade. É aqui que ficam o ranking técnico, o progresso e a prática principal da plataforma.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {['JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++'].map((item) => (
              <span key={item} className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-9 pt-5 border-t border-indigo-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Editor + testes + XP + kyu</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-1 transition-transform">
              Abrir Programação <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        <Link
          to="/practice/discrete-math"
          className="group p-7 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/25 dark:via-[#0f1628] dark:to-[#0d1820] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Binary className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              Complementar
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-7">Matemática Discreta</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
            Uma commodity acadêmica para reforçar a base lógica do aluno sem misturar o fluxo dos desafios de programação.
          </p>

          <div className="space-y-2 mt-5 text-xs text-slate-700 dark:text-slate-300">
            {['Conjuntos e relações', 'Indução e combinatória', 'Lógica formal', 'Funções', 'Grafos e árvores'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-emerald-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">100 exercícios de teste</span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-1 transition-transform">
              Abrir <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};
