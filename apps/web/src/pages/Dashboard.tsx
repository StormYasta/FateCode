import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Flame,
  Star,
  Trophy,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Users,
  WandSparkles,
  Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Challenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  language: string;
  tags: string[];
  xpReward: number;
  isDaily: boolean;
};

const languageNames: Record<string, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  C: 'C',
  CPP: 'C++',
};

const formatDifficulty = (difficulty?: string) =>
  difficulty ? `${difficulty.replace('KYU_', '')} kyu` : '8 kyu';

const ChallengeCard: React.FC<{
  challenge: Challenge | null;
  type: 'daily' | 'suggested';
}> = ({ challenge, type }) => {
  const isDaily = type === 'daily';

  if (!challenge) {
    return (
      <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 p-6 min-h-[280px] flex items-center justify-center">
        <div className="text-center">
          <Code2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Nenhum desafio disponível</p>
          <p className="text-xs text-slate-500 mt-1">Cadastre desafios para alimentar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0c1220] border p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px] ${
        isDaily ? 'border-amber-500/20' : 'border-indigo-500/20'
      }`}
    >
      <div>
        <div
          className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-3 ${
            isDaily ? 'text-amber-400' : 'text-indigo-400'
          }`}
        >
          {isDaily ? <Clock className="w-4 h-4" /> : <WandSparkles className="w-4 h-4" />}
          <span>{isDaily ? 'Desafio do Dia' : 'Desafio Sugerido'}</span>
        </div>

        <h2 className="text-xl font-black text-white tracking-tight mb-2">{challenge.title}</h2>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4">
          {challenge.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono border ${
              isDaily
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {formatDifficulty(challenge.difficulty)}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
            {languageNames[challenge.language] || challenge.language}
          </span>
          {challenge.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <span className="text-xs font-mono font-bold text-emerald-400">+{challenge.xpReward} XP</span>
        <Link
          to={`/challenges/${challenge.slug || challenge.id}`}
          className={`px-4 py-2.5 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all group ${
            isDaily
              ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
          }`}
        >
          <span>{isDaily ? 'Resolver agora' : 'Treinar desafio'}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes, challengeRes] = await Promise.all([
          api.get('/classes'),
          api.get('/challenges'),
        ]);
        setClasses(classRes.data.data || []);
        setChallenges(challengeRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalXP = user?.profile?.totalXP || 0;
  const currentStreak = user?.streak?.currentStreak || 0;

  const dailyChallenge = useMemo(
    () => challenges.find((challenge) => challenge.isDaily) || challenges[0] || null,
    [challenges]
  );

  const suggestedChallenge = useMemo(() => {
    if (!challenges.length) return null;
    const candidates = challenges.filter(
      (challenge) => challenge.id !== dailyChallenge?.id && !challenge.isDaily
    );
    if (!candidates.length) {
      return challenges.find((challenge) => challenge.id !== dailyChallenge?.id) || null;
    }

    // Keep the suggestion deterministic for the day while still rotating over time.
    const dayKey = Math.floor(Date.now() / 86_400_000);
    return candidates[dayKey % candidates.length];
  }, [challenges, dailyChallenge]);

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#0f172a] border border-indigo-500/20 p-6 md:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Temporada 2026.2 • FateCode Arena</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Olá, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Continue suas atividades acadêmicas ou pratique livremente com desafios por nível.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-amber-400 font-bold font-mono text-lg">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{currentStreak}d</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Streak Atual</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-indigo-300 font-bold font-mono text-lg">
                <Star className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                <span>{totalXP.toLocaleString('pt-BR')}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Total XP</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-amber-300 font-bold font-mono text-lg">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>#4</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Faculdade</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-emerald-400 font-bold font-mono text-lg">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>#1</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Sua Turma</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Continue praticando</h2>
            <p className="text-xs text-slate-400 mt-1">
              Um desafio diário para manter a sequência e uma sugestão de treino para você avançar.
            </p>
          </div>
          <Link to="/practice" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Ver treino livre <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChallengeCard challenge={dailyChallenge} type="daily" />
          <ChallengeCard challenge={suggestedChallenge} type="suggested" />
        </div>
      </div>

      <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Conquistas Recentes</span>
          </h3>
          <Link to="/profile" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            Ver perfil →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xs font-bold text-slate-200">1º Desafio</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Concluído</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs font-bold text-slate-200">7 Dias</div>
            <div className="text-[10px] text-amber-400 font-semibold mt-0.5">Sequência</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-xs font-bold text-slate-200">Algoritmista</div>
            <div className="text-[10px] text-slate-400 mt-0.5">20 Soluções</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs font-bold text-slate-200">Top 3</div>
            <div className="text-[10px] text-indigo-400 font-semibold mt-0.5">Temporada</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Turmas & Estrutura Acadêmica</h3>
            <p className="text-xs text-slate-400">Turmas ativas no semestre 2026/2 com ranking integrado.</p>
          </div>
          <Link
            to="/classes"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-6">Carregando turmas...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                to={`/classes/${cls.id}`}
                className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800/90 hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      {cls.code}
                    </span>
                    <span className="text-slate-400 font-mono">{cls.semester} • {cls.year}</span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {cls.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{cls.course?.name || 'Curso Superior'}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cls._count?.members || 0} alunos</span>
                  </div>
                  <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    Ver detalhes →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
