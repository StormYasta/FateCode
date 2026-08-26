import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TeacherPerformanceDashboard } from '../components/TeacherPerformanceDashboard';
import {
  BarChart3,
  Eye,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

type DashboardTab = 'performance' | 'integrity';

type ClassOption = {
  classId: string;
  name: string;
  code: string;
};

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<DashboardTab>('performance');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [selectedSubReport, setSelectedSubReport] = useState<any | null>(null);

  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  useEffect(() => {
    if (!isTeacherOrAdmin) return;

    async function loadAllowedClasses() {
      try {
        const response = await api.get('/teacher/analytics?days=30');
        const list = response.data.data?.classComparison || [];
        setClasses(list);
        if (list.length) setSelectedClassId((current) => current || list[0].classId);
      } catch (err) {
        console.error('Error loading teacher classes:', err);
      }
    }

    loadAllowedClasses();
  }, [isTeacherOrAdmin]);

  useEffect(() => {
    if (tab !== 'integrity' || !selectedClassId) return;
    loadClassIntegrity(selectedClassId);
  }, [tab, selectedClassId]);

  const loadClassIntegrity = async (classId: string) => {
    setIntegrityLoading(true);
    try {
      const response = await api.get(`/classes/${classId}/integrity-summary`);
      setSubmissions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching integrity summary:', err);
      setSubmissions([]);
    } finally {
      setIntegrityLoading(false);
    }
  };

  const handleInspectIntegrity = async (submissionId: string) => {
    try {
      const response = await api.get(`/submissions/${submissionId}/integrity`);
      setSelectedSubReport(response.data.data);
    } catch (err) {
      console.error('Error fetching detailed integrity analysis:', err);
    }
  };

  if (!isTeacherOrAdmin) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
        Acesso restrito ao corpo docente e administração acadêmica.
      </div>
    );
  }

  const selectedClass = classes.find((item) => item.classId === selectedClassId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#101726] to-[#0d1322] border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" /> Dashboard Docente
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Acompanhamento pedagógico das turmas</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Compare turmas, acompanhe tempo de resolução, médias de desempenho, conclusão e conceitos que merecem reforço em sala.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-1 self-start">
            <button
              type="button"
              onClick={() => setTab('performance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${tab === 'performance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" /> Desempenho
            </button>
            <button
              type="button"
              onClick={() => setTab('integrity')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${tab === 'integrity' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Integridade
            </button>
          </div>
        </div>
      </div>

      {tab === 'performance' ? (
        <TeacherPerformanceDashboard />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-indigo-400">Integridade acadêmica</div>
              <h2 className="text-xl font-black text-white mt-1">Submissões e indicadores heurísticos</h2>
              <p className="text-xs text-slate-400 mt-1">Indicadores auxiliam a tutoria docente e não configuram decisão ou juízo automatizado.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Turma</span>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                {classes.map((item) => (
                  <option key={item.classId} value={item.classId}>{item.name} ({item.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" /> Submissões recentes
              </h3>
              <span className="text-xs text-slate-400">{selectedClass?.code || 'Turma'}</span>
            </div>

            {integrityLoading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Carregando submissões...</div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Nenhuma submissão recente nesta turma.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 font-semibold">Estudante</th>
                      <th className="p-3.5 font-semibold">Desafio</th>
                      <th className="p-3.5 font-semibold">Data</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold">Indicador</th>
                      <th className="p-3.5 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {submissions.map((submission: any) => {
                      const risk = submission.integrityAnalysis?.riskLevel || 'NORMAL';
                      return (
                        <tr key={submission.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-200">{submission.user?.name}</div>
                            <div className="text-[10px] text-slate-500">{submission.user?.email}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">{submission.challenge?.title}</td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(submission.submittedAt).toLocaleString('pt-BR')}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${submission.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                              {submission.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${risk === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400' : risk === 'ATTENTION' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {risk === 'ATTENTION' ? 'ATENÇÃO' : risk === 'HIGH' ? 'ALTO' : 'NORMAL'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleInspectIntegrity(submission.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspecionar
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
        </div>
      )}

      {selectedSubReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111726] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Relatório heurístico
              </h3>
              <button type="button" onClick={() => setSelectedSubReport(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕ Fechar</button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Classificação:</span>
              <span className="font-bold text-white">{selectedSubReport.riskLevel}</span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300">Parecer geral</h4>
              <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800 leading-relaxed mt-2">{selectedSubReport.reportSummary}</p>
            </div>

            {selectedSubReport.indicators?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300">Indicadores observados</h4>
                <ul className="space-y-1 text-xs text-amber-300/90 mt-2">
                  {selectedSubReport.indicators.map((indicator: string, index: number) => <li key={index}>• {indicator}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Tempo estimado</div>
                <div className="font-bold text-white mt-1">{selectedSubReport.durationSeconds}s</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Iterações de teste</div>
                <div className="font-bold text-white mt-1">{selectedSubReport.executionCount}</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic text-center">Indicadores atípicos servem para investigação pedagógica contextualizada, não para punição automática.</p>
          </div>
        </div>
      )}
    </div>
  );
};
