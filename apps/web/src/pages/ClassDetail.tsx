import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ClassContentSection } from '../components/ClassContentSection';
import {
  Users,
  Trophy,
  Flame,
  Star,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [classData, setClassData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClass() {
      try {
        const res = await api.get(`/classes/${id}`);
        setClassData(res.data.data);
      } catch (err) {
        console.error('Failed to load class:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadClass();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Carregando turma...</div>;
  }

  if (!classData) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
        Turma não encontrada.
      </div>
    );
  }

  const professors = classData.members?.filter((m: any) => m.role === 'PROFESSOR') || [];
  const students = (classData.members?.filter((m: any) => m.role === 'STUDENT') || []).sort(
    (a: any, b: any) => (b.user.profile?.totalXP || 0) - (a.user.profile?.totalXP || 0)
  );
  const canManageClass = currentUser?.role === 'ADMIN' || classData.members?.some(
    (member: any) => member.user.id === currentUser?.id && (member.role === 'PROFESSOR' || member.role === 'ASSISTANT')
  );

  return (
    <div className="space-y-8">
      <Link
        to="/classes"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Turmas</span>
      </Link>

      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#121a2d] to-[#0d1322] border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono">
                {classData.code}
              </span>
              <span>• {classData.semester} Semestre / {classData.year}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{classData.name}</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{classData.course?.name}</span>
              <span>•</span>
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{classData.course?.faculty?.name}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-28">
              <div className="font-mono text-xl font-bold text-white">{students.length}</div>
              <div className="text-[11px] text-slate-400">Estudantes</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-28">
              <div className="font-mono text-xl font-bold text-indigo-400">{professors.length}</div>
              <div className="text-[11px] text-slate-400">Docentes</div>
            </div>
          </div>
        </div>
      </div>

      <ClassContentSection classId={classData.id} canManage={Boolean(canManageClass)} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Corpo Docente</span>
            </h3>

            {professors.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum professor vinculado a esta turma.</p>
            ) : (
              <div className="space-y-3">
                {professors.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                      {p.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{p.user.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{p.user.email}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">
                      Docente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Ranking da Turma</span>
              </h3>
              <span className="text-xs text-slate-400">Ordenado por XP Total</span>
            </div>

            {students.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum estudante matriculado.</p>
            ) : (
              <div className="space-y-2">
                {students.map((st: any, index: number) => {
                  const xp = st.user.profile?.totalXP || 0;
                  const streak = st.user.streak?.currentStreak || 0;
                  const isCurrent = currentUser?.id === st.user.id;

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/10'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            index === 0
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                              : index === 1
                              ? 'bg-slate-300 text-black'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">{st.user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>{st.user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-xs text-amber-400 font-mono font-semibold">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{streak}d</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-indigo-300 font-mono font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                          <span>{xp.toLocaleString('pt-BR')} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
