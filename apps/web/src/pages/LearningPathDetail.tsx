import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Map, 
  Layers, 
  BookOpen, 
  Code2, 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Lock, 
  ArrowRight 
} from 'lucide-react';

export const LearningPathDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [path, setPath] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadPath() {
      try {
        const res = await api.get(`/learning-paths/${slug}`);
        setPath(res.data.data);
        if (res.data.data?.modules) {
          const initial: Record<string, boolean> = {};
          res.data.data.modules.forEach((m: any) => {
            initial[m.id] = true;
          });
          setOpenModules(initial);
        }
      } catch (err) {
        console.error('Failed to load path detail:', err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadPath();
  }, [slug]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'KYU_8': return 'bg-slate-700/60 border-slate-600 text-slate-300';
      case 'KYU_7': return 'bg-slate-700/60 border-slate-600 text-slate-300';
      case 'KYU_6': return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300';
      case 'KYU_5': return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300';
      case 'KYU_4': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      case 'KYU_3': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      case 'KYU_2': return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      case 'KYU_1': return 'bg-rose-500/20 border-rose-500/40 text-rose-300';
      default: return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const formatDifficulty = (difficulty: string) => {
    return difficulty ? difficulty.replace('KYU_', '') + ' kyu' : '8 kyu';
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Carregando conteúdo da trilha...</div>;
  }

  if (!path) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
        Trilha não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/learning-paths"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Trilhas</span>
      </Link>

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#121a2d] via-[#101726] to-[#0d1322] border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono">
                {path.course?.name || 'Formação Geral'}
              </span>
              <span>• {path.modules?.length || 0} Módulos Curriculares</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{path.title}</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {path.description}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-36">
            <div className="text-xs text-slate-400">Progresso Geral</div>
            <div className="font-mono text-xl font-bold text-indigo-400 mt-0.5">60%</div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500 w-3/5 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Modules Accordion */}
      <div className="space-y-4">
        {path.modules?.map((module: any, mIdx: number) => {
          const isOpen = openModules[module.id];

          return (
            <div
              key={module.id}
              className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 overflow-hidden shadow-lg"
            >
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-sm">
                    {mIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{module.title}</h3>
                    {module.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{module.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>{module.topics?.length || 0} Tópicos</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {/* Topics & Challenges List */}
              {isOpen && (
                <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4">
                  {module.topics?.map((topic: any, tIdx: number) => (
                    <div key={topic.id} className="pt-4 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                        <span className="text-indigo-400 font-mono">{mIdx + 1}.{tIdx + 1}</span>
                        <span>{topic.title}</span>
                      </div>

                      {/* Exercises in Topic */}
                      <div className="grid gap-2">
                        {topic.challenges?.map((challenge: any) => (
                          <Link
                            key={challenge.id}
                            to={`/challenges/${challenge.slug || challenge.id}`}
                            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                                <Code2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                                    {challenge.title}
                                  </h4>
                                  {challenge.source === 'CODEWARS' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase">
                                      Codewars
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  {challenge.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              {/* Difficulty */}
                              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getDifficultyColor(challenge.difficulty)}`}>
                                {formatDifficulty(challenge.difficulty)}
                              </span>

                              {/* XP */}
                              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                                <span>+{challenge.xpReward} XP</span>
                              </span>

                              <div className="p-1 rounded bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white transition-colors">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
