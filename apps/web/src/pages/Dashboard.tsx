import React, { useEffect, useState } from 'react';
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
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes] = await Promise.all([
          api.get('/classes'),
        ]);
        setClasses(classRes.data.data || []);
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

  return (
    <div className="space-y-8">
      {/* Top Banner: Greeting + Gamified Badges */}
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
              Bem-vindo à sua central de aprendizado e competição acadêmica.
            </p>
          </div>

          {/* Gamification Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Streak */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-amber-400 font-bold font-mono text-lg">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{currentStreak}d</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Streak Atual</span>
            </div>

            {/* Total XP */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-indigo-300 font-bold font-mono text-lg">
                <Star className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                <span>{totalXP.toLocaleString('pt-BR')}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Total XP</span>
            </div>

            {/* Ranking Faculdade */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center space-x-1 text-amber-300 font-bold font-mono text-lg">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>#4</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">Faculdade</span>
            </div>

            {/* Ranking Turma */}
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

      {/* Grid: Daily Challenge + Academic Tracks */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Challenge Card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0c1220] border border-amber-500/20 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 border-b border-l border-amber-500/20 px-3.5 py-1 text-xs font-mono font-bold rounded-bl-xl flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>+250 XP EXTRA</span>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4" />
              <span>Desafio do Dia • Expira em 14h</span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
              O Cofre dos Primos
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-4">
              Encontre o maior número primo palíndromo menor ou igual a N. Testes de estresse e performance avaliados em tempo real.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 text-xs font-semibold font-mono border border-amber-500/30">
                ★★★★☆ (4 kyu)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                Algoritmos
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                Matemática
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                JavaScript / TypeScript
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>42 colegas já resolveram hoje</span>
            </div>

            <Link
              to="/challenges/cofre-dos-primos"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all group"
            >
              <span>Resolver no Editor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Conquistas Recentes & Badges (1 col) */}
        <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Conquistas</span>
              </h3>
              <span className="text-xs text-indigo-400 font-medium">5 Desbloqueadas</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link to="/profile" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center space-x-1">
              <span>Ver todas as conquistas no perfil</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Turmas & Courses Section */}
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
                <p className="text-xs text-slate-400 mt-1">
                  {cls.course?.name || 'Curso Superior'}
                </p>
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
      </div>
    </div>
  );
};
