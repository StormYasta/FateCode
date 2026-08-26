import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, Trophy } from 'lucide-react';
import { api } from '../services/api';

type Difficulty = 'KYU_8' | 'KYU_7' | 'KYU_6' | 'KYU_5' | 'KYU_4' | 'KYU_3' | 'KYU_2' | 'KYU_1';
type Language = 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'C' | 'CPP';

type Challenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  source: string;
  language: Language;
  tags: string[];
  xpReward: number;
  isDaily: boolean;
};

const difficulties: { value: Difficulty; label: string; subtitle: string }[] = [
  { value: 'KYU_8', label: '8 kyu', subtitle: 'Iniciante' },
  { value: 'KYU_7', label: '7 kyu', subtitle: 'Básico' },
  { value: 'KYU_6', label: '6 kyu', subtitle: 'Fundamentos' },
  { value: 'KYU_5', label: '5 kyu', subtitle: 'Intermediário' },
  { value: 'KYU_4', label: '4 kyu', subtitle: 'Avançado' },
  { value: 'KYU_3', label: '3 kyu', subtitle: 'Difícil' },
  { value: 'KYU_2', label: '2 kyu', subtitle: 'Especialista' },
  { value: 'KYU_1', label: '1 kyu', subtitle: 'Expert' },
];

const languageNames: Record<Language, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  C: 'C',
  CPP: 'C++',
};

const difficultyLabel = (difficulty: Difficulty) => difficulty.replace('KYU_', '') + ' kyu';

export const GeneralChallenges: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadChallenges = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/challenges', {
          params: {
            ...(difficulty ? { difficulty } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });
        if (!cancelled) setChallenges(response.data.data || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Não foi possível carregar os desafios.');
          setChallenges([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(loadChallenges, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [difficulty, search]);

  return (
    <div className="space-y-7">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          Treino Livre
        </div>
        <h1 className="text-3xl font-bold text-white">Desafios de Programação</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Pratique no seu ritmo, escolha um nível de 8 kyu até 1 kyu e selecione a linguagem ao abrir o desafio.
        </p>
      </div>

      <section className="rounded-2xl bg-[#0c1222] border border-slate-800 p-5 space-y-5">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar desafios por nome ou descrição..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
        </label>

        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <SlidersHorizontal className="w-4 h-4" />
            Nível de dificuldade
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
            <button
              type="button"
              onClick={() => setDifficulty('')}
              className={`rounded-xl px-3 py-3 border text-left transition-colors ${
                difficulty === ''
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-bold">Todos</div>
              <div className="text-[11px] opacity-70 mt-0.5">Níveis</div>
            </button>
            {difficulties.map((item) => {
              const active = difficulty === item.value;
              return (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setDifficulty(item.value)}
                  className={`rounded-xl px-3 py-3 border text-left transition-colors ${
                    active
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5 truncate">{item.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          {loading ? 'Carregando desafios...' : `${challenges.length} desafio(s) encontrado(s)`}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Trophy className="w-4 h-4" />
          Quanto menor o kyu, maior a dificuldade.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && challenges.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
          <h3 className="text-lg font-semibold text-white">Nenhum desafio encontrado</h3>
          <p className="text-sm text-slate-400 mt-2">
            Tente outro nível de dificuldade ou remova o termo de busca.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            to={`/challenges/${challenge.slug || challenge.id}`}
            className="group rounded-2xl bg-[#0c1222] border border-slate-800 p-5 hover:border-indigo-500/60 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300">
                  {difficultyLabel(challenge.difficulty)}
                </span>
                {challenge.isDaily && (
                  <span className="ml-2 inline-flex px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300">
                    Diário
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-emerald-300">+{challenge.xpReward} XP</span>
            </div>

            <h3 className="text-lg font-bold text-white mt-4 group-hover:text-indigo-200 transition-colors">
              {challenge.title}
            </h3>
            <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
              {challenge.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {challenge.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 mt-5 pt-4 text-xs">
              <span className="text-slate-500">Base atual: {languageNames[challenge.language] || challenge.language}</span>
              <span className="font-semibold text-indigo-300 group-hover:translate-x-1 transition-transform">Abrir desafio →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
