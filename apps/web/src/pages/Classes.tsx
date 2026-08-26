import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Users, Calendar, BookOpen, ArrowRight, Shield, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Classes: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <span>Turmas Acadêmicas</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Gerenciamento de turmas, alunos matriculados e corpo docente.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome ou código..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando turmas...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
          Nenhuma turma encontrada.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold">
                    {cls.code}
                  </span>
                  <div className="flex items-center space-x-1 text-slate-400 font-mono text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cls.semester} • {cls.year}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{cls.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1.5 mb-4">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{cls.course?.name || 'Curso Superior'}</span>
                </p>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 mb-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estudantes Inscritos:</span>
                  <span className="font-bold text-white font-mono">{cls._count?.members || 0}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-semibold">{cls.course?.faculty?.code || 'FATEC'}</span>
                <Link
                  to={`/classes/${cls.id}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>Abrir Turma</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
