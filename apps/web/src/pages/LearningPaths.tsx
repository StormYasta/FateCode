import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Map, 
  BookOpen, 
  Layers, 
  Code2, 
  ArrowRight, 
  Plus, 
  GraduationCap, 
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LearningPaths: React.FC = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadPaths() {
      try {
        const res = await api.get('/learning-paths');
        setPaths(res.data.data || []);
      } catch (err) {
        console.error('Failed to load learning paths:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPaths();
  }, []);

  const filteredPaths = paths.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.course && p.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Map className="w-6 h-6 text-indigo-400" />
            <span>Trilhas de Aprendizagem</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Jornadas pedagógicas estruturadas por módulos, tópicos e exercícios práticos.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome ou conteúdo..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Tracks */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando trilhas de estudo...</div>
      ) : filteredPaths.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
          Nenhuma trilha encontrada.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map((path) => {
            const modulesCount = path._count?.modules || path.modules?.length || 0;
            let totalChallenges = 0;
            path.modules?.forEach((m: any) => {
              m.topics?.forEach((t: any) => {
                totalChallenges += t._count?.challenges || t.challenges?.length || 0;
              });
            });

            return (
              <div
                key={path.id}
                className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold">
                      {path.course?.code || 'Geral'}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{modulesCount} Módulos</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {path.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-5">
                    {path.description || 'Trilha completa com desafios progressivos de programação.'}
                  </p>

                  {/* Progress mock */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Progresso da Trilha</span>
                      <span className="font-mono text-indigo-300 font-bold">60%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-3/5 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{totalChallenges > 0 ? `${totalChallenges} desafios` : 'Exercícios práticos'}</span>
                  </div>

                  <Link
                    to={`/learning-paths/${path.slug || path.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <span>Explorar Trilha</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
