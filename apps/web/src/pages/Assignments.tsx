import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ListChecks, 
  Clock, 
  Star, 
  ArrowRight, 
  Code2,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Assignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get('/assignments');
        setAssignments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo definido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <ListChecks className="w-6 h-6 text-indigo-400" />
            <span>Atividades Acadêmicas</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Exercícios e listas de código atribuídos pelos professores às suas turmas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            {assignments.length} Atividades Ativas
          </span>
        </div>
      </div>

      {/* Grid / List of Assignments */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando atividades...</div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
          Nenhuma atividade pendente no momento.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold font-mono">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{assignment.class?.code || 'Turma'}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400 font-mono text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Entrega: {formatDueDate(assignment.dueDate)}</span>
                  </div>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white mb-2">
                  {assignment.title}
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {assignment.challenge?.title || 'Exercício de Programação'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Linguagem: {assignment.challenge?.language || 'JavaScript'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                    <span>+{assignment.challenge?.xpReward || 50} XP</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Em Aberto para Resolução</span>
                </span>

                <Link
                  to={`/challenges/${assignment.challenge?.slug || assignment.challengeId}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Resolver no Editor</span>
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
