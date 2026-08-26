import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Eye, 
  Search,
  Building2,
  Trophy,
  Filter
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubReport, setSelectedSubReport] = useState<any | null>(null);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const cRes = await api.get('/classes');
        const classList = cRes.data.data || [];
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
          loadClassIntegrity(classList[0].id);
        }
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, []);

  const loadClassIntegrity = async (classId: string) => {
    try {
      const res = await api.get(`/classes/${classId}/integrity-summary`);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching integrity summary:', err);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    loadClassIntegrity(classId);
  };

  const handleInspectIntegrity = async (subId: string) => {
    try {
      const res = await api.get(`/submissions/${subId}/integrity`);
      setSelectedSubReport(res.data.data);
    } catch (err) {
      console.error('Error fetching detailed integrity analysis:', err);
    }
  };

  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  if (!isTeacherOrAdmin) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
        Acesso restrito ao corpo docente e administração acadêmica.
      </div>
    );
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#101726] to-[#0d1322] border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Painel de Gestão Docente & Integridade</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Acompanhamento Pedagógico
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Monitore o progresso das turmas, histórico de desenvolvimento, submissões recentes e indicadores de integridade acadêmica.
            </p>
          </div>

          {/* Class Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Turma:</span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">{selectedClass?._count?.members || 0} Alunos</div>
            <div className="text-xs text-slate-400">Matriculados na Turma</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">{submissions.length} Submissões</div>
            <div className="text-xs text-slate-400">Registradas no Período</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">Indicadores Ativos</div>
            <div className="text-xs text-slate-400">Análise Heurística Neutra</div>
          </div>
        </div>
      </div>

      {/* Submissions & Integrity Table */}
      <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Submissões e Histórico de Desenvolvimento</span>
          </h2>
          <span className="text-xs text-slate-400">Turma {selectedClass?.code}</span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhuma submissão recente nesta turma.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Estudante</th>
                  <th className="p-3.5 font-semibold">Desafio</th>
                  <th className="p-3.5 font-semibold">Data / Hora</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold">Indicadores</th>
                  <th className="p-3.5 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {submissions.map((sub: any) => {
                  const risk = sub.integrityAnalysis?.riskLevel || 'NORMAL';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-sans font-bold text-slate-200">
                        {sub.user?.name}
                        <div className="text-[11px] font-mono text-slate-400 font-normal">{sub.user?.email}</div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-sans">{sub.challenge?.title}</td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(sub.submittedAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk === 'NORMAL'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : risk === 'ATTENTION'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {risk === 'NORMAL' ? 'NORMAL' : risk === 'ATTENTION' ? 'ATENÇÃO' : 'ALTO'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => handleInspectIntegrity(sub.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspecionar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Inspection Modal */}
      {selectedSubReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111726] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Relatório de Indicadores Heurísticos</span>
              </h3>
              <button
                onClick={() => setSelectedSubReport(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Classificação Heurística:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded ${
                selectedSubReport.riskLevel === 'NORMAL'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : selectedSubReport.riskLevel === 'ATTENTION'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {selectedSubReport.riskLevel}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Parecer Geral:</h4>
              <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {selectedSubReport.reportSummary}
              </p>
            </div>

            {selectedSubReport.indicators?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Indicadores Observados:</h4>
                <ul className="space-y-1 text-xs text-amber-300/90 font-mono">
                  {selectedSubReport.indicators.map((ind: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span>•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Tempo Estimado:</div>
                <div className="font-bold text-white">{selectedSubReport.durationSeconds}s</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Iterações de Teste:</div>
                <div className="font-bold text-white">{selectedSubReport.executionCount}</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic text-center">
              Nota ética: Indicadores atípicos auxiliam a tutoria docente e não configuram juízo automatizado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
