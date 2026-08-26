import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  Flame, 
  Star, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Medal, 
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';

export const Rankings: React.FC = () => {
  const { user } = useAuth();

  const [level, setLevel] = useState<'FACULTY' | 'COURSE' | 'CLASS'>('FACULTY');
  const [period, setPeriod] = useState<'ALL_TIME' | 'SEASON' | 'MONTHLY'>('ALL_TIME');
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [cRes, clRes] = await Promise.all([
          api.get('/courses'),
          api.get('/classes'),
        ]);
        setCourses(cRes.data.data || []);
        setClasses(clRes.data.data || []);
      } catch (err) {
        console.error('Failed to load courses/classes for ranking:', err);
      }
    }
    loadAuxData();
  }, []);

  useEffect(() => {
    async function loadRankings() {
      setLoading(true);
      try {
        let url = `/rankings?level=${level}&period=${period}`;
        if (selectedTargetId) {
          url += `&targetId=${selectedTargetId}`;
        }
        const res = await api.get(url);
        setRankings(res.data.data || []);
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, [level, period, selectedTargetId]);

  const top3 = rankings.slice(0, 3);
  const restOfRankings = rankings.slice(3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#141b2d] to-[#0d1322] border border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Arena Competitiva Universitária</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Rankings & Leaderboard</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Classificação geral baseada em XP acumulado por exercícios, desafios diários e conquistas.
            </p>
          </div>

          {/* Level Switcher */}
          <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => { setLevel('FACULTY'); setSelectedTargetId(''); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                level === 'FACULTY'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Faculdade</span>
            </button>
            <button
              onClick={() => { setLevel('COURSE'); setSelectedTargetId(courses[0]?.id || ''); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                level === 'COURSE'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curso</span>
            </button>
            <button
              onClick={() => { setLevel('CLASS'); setSelectedTargetId(classes[0]?.id || ''); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                level === 'CLASS'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Turma</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f1628]/80 border border-slate-800 p-3.5 rounded-2xl">
        {/* Temporal Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPeriod('ALL_TIME')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              period === 'ALL_TIME' ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Geral (All Time)
          </button>
          <button
            onClick={() => setPeriod('SEASON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              period === 'SEASON' ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Temporada 2026.2
          </button>
          <button
            onClick={() => setPeriod('MONTHLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              period === 'MONTHLY' ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
        </div>

        {/* Specific Target Selector for Course or Class */}
        {level === 'COURSE' && (
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        )}

        {level === 'CLASS' && (
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        )}
      </div>

      {/* Podium Top 3 */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 md:gap-6 pt-4 pb-2 items-end">
          {/* 2nd Place */}
          <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-t from-slate-900 to-[#10182b] border border-slate-700 text-center space-y-2 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-slate-300 text-black font-black flex items-center justify-center mx-auto text-base shadow-lg">
              2º
            </div>
            <div className="font-bold text-sm text-white truncate">{top3[1]?.name}</div>
            <div className="text-xs font-mono font-bold text-indigo-300">
              {top3[1]?.totalXP?.toLocaleString('pt-BR')} XP
            </div>
            <div className="flex items-center justify-center space-x-1 text-[11px] text-amber-400 font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{top3[1]?.currentStreak}d streak</span>
            </div>
          </div>

          {/* 1st Place (Crown) */}
          <div className="p-5 md:p-8 rounded-3xl bg-gradient-to-t from-amber-950/40 via-slate-900 to-[#182138] border-2 border-amber-500/50 text-center space-y-3 shadow-2xl scale-105">
            <div className="text-2xl -mb-2">👑</div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-black font-black flex items-center justify-center mx-auto text-lg shadow-xl shadow-amber-500/30">
              1º
            </div>
            <div className="font-black text-base md:text-lg text-white truncate">{top3[0]?.name}</div>
            <div className="text-sm font-mono font-black text-amber-400 flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{top3[0]?.totalXP?.toLocaleString('pt-BR')} XP</span>
            </div>
            <div className="flex items-center justify-center space-x-1 text-xs text-amber-400 font-mono font-bold">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{top3[0]?.currentStreak} dias consecutivos</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-t from-slate-900 to-[#10182b] border border-amber-800/60 text-center space-y-2 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-black flex items-center justify-center mx-auto text-base shadow-lg">
              3º
            </div>
            <div className="font-bold text-sm text-white truncate">{top3[2]?.name}</div>
            <div className="text-xs font-mono font-bold text-indigo-300">
              {top3[2]?.totalXP?.toLocaleString('pt-BR')} XP
            </div>
            <div className="flex items-center justify-center space-x-1 text-[11px] text-amber-400 font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{top3[2]?.currentStreak}d streak</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table (Position 4 onwards) */}
      <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-300 uppercase tracking-wider">
          Classificação Completa
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando classificação...</div>
        ) : rankings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhum estudante classificado nesta categoria.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {rankings.map((st: any) => {
              const isCurrentUser = user?.id === st.id;

              return (
                <div
                  key={st.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isCurrentUser ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 font-mono font-bold text-sm text-slate-400 text-center">
                      #{st.position}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{st.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {st.classes?.[0]?.name || 'FATEC São Paulo'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-mono font-bold">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{st.currentStreak}d</span>
                    </div>

                    <div className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 flex items-center space-x-1 min-w-24 justify-end">
                      <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                      <span>{st.totalXP.toLocaleString('pt-BR')} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
