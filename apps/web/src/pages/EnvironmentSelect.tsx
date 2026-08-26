import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Braces, GraduationCap, Swords } from 'lucide-react';

const languages = [
  { value: 'JAVASCRIPT', label: 'JavaScript', short: 'JS' },
  { value: 'TYPESCRIPT', label: 'TypeScript', short: 'TS' },
  { value: 'PYTHON', label: 'Python', short: 'PY' },
  { value: 'JAVA', label: 'Java', short: 'JV' },
  { value: 'C', label: 'C', short: 'C' },
  { value: 'CPP', label: 'C++', short: 'C++' },
] as const;

export const EnvironmentSelect: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(
    () => localStorage.getItem('fatecode_language') || 'JAVASCRIPT'
  );

  const chooseLanguage = (value: string) => {
    setLanguage(value);
    localStorage.setItem('fatecode_language', value);
  };

  const enterEnvironment = (environment: 'general' | 'academic') => {
    localStorage.setItem('fatecode_language', language);
    localStorage.setItem('fatecode_environment', environment);
    navigate(environment === 'general' ? '/general/challenges' : '/academic/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Braces className="w-4 h-4" />
          Seu ambiente de programação
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">Como você quer usar o FateCode hoje?</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Escolha sua linguagem principal e entre no ambiente de desafios livres ou no espaço acadêmico da sua instituição.
        </p>
      </div>

      <section className="rounded-2xl bg-[#0c1222] border border-slate-800 p-5 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">1. Escolha a linguagem</h2>
          <p className="text-sm text-slate-400 mt-1">Ela será usada como filtro inicial dos desafios e ficará salva neste navegador.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {languages.map((item) => {
            const active = item.value === language;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => chooseLanguage(item.value)}
                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                  active
                    ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <span className={`text-xs font-mono font-bold ${active ? 'text-indigo-100' : 'text-indigo-400'}`}>
                  {item.short}
                </span>
                <div className="mt-1 text-sm font-semibold text-white">{item.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">2. Escolha o ambiente</h2>
          <p className="text-sm text-slate-400 mt-1">Você pode trocar de ambiente a qualquer momento.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={() => enterEnvironment('general')}
            className="group text-left rounded-2xl p-6 bg-gradient-to-br from-indigo-600/20 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/70 transition-all hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-5">
              <Swords className="w-6 h-6 text-indigo-300" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Livre para todos</span>
                <h3 className="text-2xl font-bold text-white mt-1">Ambiente Geral</h3>
              </div>
              <span className="text-indigo-300 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Resolva desafios no estilo Codewars, escolha entre 8 kyu e 1 kyu, filtre por linguagem e evolua pela prática.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 text-xs text-slate-300">
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">8 kyu → 1 kyu</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">Desafios livres</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">XP e evolução</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => enterEnvironment('academic')}
            className="group text-left rounded-2xl p-6 bg-gradient-to-br from-emerald-600/15 to-slate-900 border border-emerald-500/25 hover:border-emerald-400/60 transition-all hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-5">
              <GraduationCap className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Instituição de ensino</span>
                <h3 className="text-2xl font-bold text-white mt-1">Ambiente Acadêmico</h3>
              </div>
              <span className="text-emerald-300 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Acesse turmas, trilhas curriculares, atividades, acompanhamento docente, rankings e integridade acadêmica.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 text-xs text-slate-300">
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">Turmas</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">Atividades</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-700">Painel docente</span>
            </div>
          </button>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <BookOpen className="w-4 h-4" />
        A linguagem selecionada poderá ser alterada novamente dentro do Ambiente Geral.
      </div>
    </div>
  );
};
